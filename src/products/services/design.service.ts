import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Product } from '../entities/product.entity';
import { DesignPurchase } from '../entities/design-purchase.entity';
import { DesignDownload } from '../entities/design-download.entity';
import { CreditsService } from 'src/credits/credits.service';
import { CreditType } from 'src/credits/entities/credit-transaction.entity';
import { StorageService } from 'src/storage/storage.service';
import { Request } from 'express';
import { DESIGN_DOWNLOAD_COSTS } from '../constants/design-costs';

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

    // --- 1. COMPRAR DISEÑO (COSTOS FIJOS EN CRÉDITOS) ---
    async purchaseDesign(userId: string, productId: number, purchaseType: string) {
        // A. Validaciones
        const product = await this.productRepo.findOneBy({ id: productId });
        if (!product) throw new NotFoundException('Diseño no encontrado');

        // Obtener costo fijo según tipo
        const credits = DESIGN_DOWNLOAD_COSTS[purchaseType];
        if (!credits) throw new BadRequestException('Tipo de compra inválido');

        const downloadsToAdd = purchaseType === 'UNLIMITED' ? -1 :
            (purchaseType === 'FIVE' ? 5 : 1);

        // B. Transacción ACID (Cobro + Entrega)
        return await this.dataSource.transaction(async (manager) => {
            // 1. Cobrar Créditos de Diseño
            await this.creditsService.chargeUser(
                userId,
                credits,
                CreditType.DESIGN, // Usar créditos de diseño
                `Compra de Diseño (${purchaseType}): ${product.name}`,
                manager
            );

            // 2. Buscar si ya existe compra
            let purchase = await manager.findOne(DesignPurchase, {
                where: { userId, productId }
            });

            if (purchase) {
                // Actualizar existente
                if (purchase.purchaseType === 'UNLIMITED') {
                    // Ya es ilimitado, no hacer nada adicional
                } else {
                    if (purchaseType === 'UNLIMITED') {
                        purchase.purchaseType = 'UNLIMITED';
                        purchase.downloadsRemaining = null;
                    } else {
                        // Sumar descargas
                        const current = purchase.downloadsRemaining || 0;
                        purchase.downloadsRemaining = current + downloadsToAdd;
                        purchase.purchaseType = purchaseType;
                    }
                }
                purchase.pricePaid = credits; // Guardamos créditos pagados
                purchase.purchasedAt = new Date();
            } else {
                // Crear nueva
                purchase = manager.create(DesignPurchase, {
                    userId,
                    productId,
                    pricePaid: credits,
                    purchaseType,
                    downloadsRemaining: downloadsToAdd === -1 ? null : downloadsToAdd
                });
            }

            await manager.save(purchase);

            // 3. Incrementar Contador de Ventas
            await manager.increment(Product, { id: productId }, 'designSoldCount', 1);

            return {
                message: 'Compra exitosa.',
                purchaseId: purchase.id,
                downloadsRemaining: purchase.downloadsRemaining === null ? 'Unlimited' : purchase.downloadsRemaining,
                creditsCharged: credits
            };
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
            throw new ForbiddenException('Debes comprar este diseño para descargarlo');
        }

        if (!product.files) {
            throw new NotFoundException('No hay archivo fuente cargado para este diseño');
        }

        // Validar descargas restantes
        if (purchase.downloadsRemaining !== null) {
            if (purchase.downloadsRemaining <= 0) {
                throw new ForbiddenException('Has agotado tus descargas para este diseño. Por favor compra más.');
            }
            // Decrementar (si no es ilimitado)
            purchase.downloadsRemaining -= 1;
            await this.purchaseRepo.save(purchase);
        }

        // B. Generar URL firmada para el archivo
        const downloadUrl = await this.storageService.generateV4DownloadSignedUrl(product.files, 5);

        // C. Registrar Descarga para Analytics (Sin esperar)
        this.registerDownload(purchase.id, userId, productId, [product.files], request);

        // D. Incrementar Contador General (Sin esperar)
        this.productRepo.increment({ id: productId }, 'designDownloadCount', 1);

        return {
            file: downloadUrl,
            downloadsRemaining: purchase.downloadsRemaining === null ? 'Unlimited' : purchase.downloadsRemaining
        };
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