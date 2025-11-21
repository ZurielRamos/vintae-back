import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Product } from '../entities/product.entity';
import { DesignPurchase } from '../entities/design-purchase.entity';
import { DesignDownload } from '../entities/design-download.entity';
import { CreditsService } from 'src/credits/credits.service';
import { StorageService } from 'src/storage/storage.service';
import { Request } from 'express';

@Injectable()
export class DesignsService {
    constructor(
        @InjectRepository(Product) private productRepo: Repository<Product>,
        @InjectRepository(DesignPurchase) private purchaseRepo: Repository<DesignPurchase>,
        @InjectRepository(DesignDownload) private downloadRepo: Repository<DesignDownload>,
        private creditsService: CreditsService,
        private storageService: StorageService,
        private dataSource: DataSource,
    ) { }

    // --- 1. COMPRAR DISEÑO (SOLO CRÉDITOS) ---
    async purchaseDesign(userId: string, productId: number) {
        // A. Validaciones
        const product = await this.productRepo.findOneBy({ id: productId });
        if (!product) throw new NotFoundException('Diseño no encontrado');

        if (!product.designPrice || Number(product.designPrice) <= 0) {
            throw new BadRequestException('Este diseño no está a la venta digitalmente');
        }

        // Verificar si ya lo compró
        const alreadyOwned = await this.purchaseRepo.findOne({
            where: { userId, productId }
        });
        if (alreadyOwned) throw new BadRequestException('Ya tienes acceso a este diseño');

        // B. Transacción ACID (Cobro + Entrega)
        return await this.dataSource.transaction(async (manager) => {
            // 1. Cobrar Créditos (Bloqueo pesimista incluido en CreditsService)
            await this.creditsService.chargeUser(
                userId,
                Number(product.designPrice),
                `Compra de Diseño: ${product.name} (SKU ${product.sku})`,
                manager
            );

            // 2. Registrar Propiedad (Licencia)
            const purchase = manager.create(DesignPurchase, {
                userId,
                productId,
                pricePaid: Number(product.designPrice)
            });
            await manager.save(purchase);

            // 3. Incrementar Contador de Ventas
            await manager.increment(Product, { id: productId }, 'designSoldCount', 1);

            return { message: 'Compra exitosa. Ya puedes descargar tu diseño.', purchaseId: purchase.id };
        });
    }

    // --- 2. DESCARGAR DISEÑO ---
    async downloadDesign(userId: string, productId: number, request?: Request) {
        // A. Verificar Propiedad
        const purchase = await this.purchaseRepo.findOne({ where: { userId, productId } });
        const product = await this.productRepo.findOneBy({ id: productId });

        if (!product) {
            throw new NotFoundException('Diseño no encontrado o no existe');
        }

        if (!purchase) {
            // Opcional: Si es el dueño/creador o Admin, permitir descarga sin compra
            // if (!isAdmin) 
            throw new ForbiddenException('Debes comprar este diseño para descargarlo');
        }

        if (!product.fileUrls || product.fileUrls.length === 0) {
            throw new NotFoundException('No hay archivos fuente cargados para este diseño');
        }

        // B. Generar URLs firmadas (Vitalicio acceso, pero URL temporal de 15min)
        // Asumimos que fileUrls tiene las keys de S3/GCP
        const urls = await Promise.all(product.fileUrls.map(async (fileKey) => {
            return await this.storageService.generateV4DownloadSignedUrl(fileKey, 5); // Tu método existente
        }));

        // C. Registrar Descarga para Analytics (Sin esperar)
        this.registerDownload(purchase.id, userId, productId, product.fileUrls, request);

        // D. Incrementar Contador General (Sin esperar)
        this.productRepo.increment({ id: productId }, 'designDownloadCount', 1);

        return { files: urls };
    }

    // --- MÉTODO PRIVADO: Registrar Descarga ---
    private async registerDownload(
        purchaseId: string,
        userId: string,
        productId: number,
        filesDownloaded: string[],
        request?: Request
    ) {
        try {
            // Extraer metadata del request
            const ipAddress = request?.ip || request?.headers['x-forwarded-for'] as string || null;
            const userAgent = request?.headers['user-agent'] || null;

            // Crear registro de descarga
            const download = this.downloadRepo.create({
                purchaseId,
                userId,
                productId,
                ipAddress: ipAddress || undefined,
                userAgent: userAgent || undefined,
                filesDownloaded,
            } as any);

            await this.downloadRepo.save(download);
        } catch (error) {
            // No lanzar error para no bloquear la descarga
            console.error('Error registrando descarga:', error);
        }
    }

    // --- 3. REGISTRAR "COMPARTIDO" ---
    async registerShare(productId: number) {
        await this.productRepo.increment({ id: productId }, 'shareCount', 1);
        return { success: true };
    }

    // --- 4. VERIFICAR SI LO TENGO ---
    async checkOwnership(userId: string, productId: number) {
        const count = await this.purchaseRepo.count({ where: { userId, productId } });
        return { owned: count > 0 };
    }
}