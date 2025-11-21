import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Product } from './product.entity';
import { DesignPurchase } from './design-purchase.entity';

@Entity('design_downloads')
@Index(['userId', 'productId']) // Para queries de análisis por usuario/producto
@Index(['downloadedAt']) // Para análisis temporal
export class DesignDownload {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // Relación con la compra original
    @ManyToOne(() => DesignPurchase)
    @JoinColumn({ name: 'purchase_id' })
    purchase: DesignPurchase;

    @Column({ name: 'purchase_id', type: 'uuid' })
    purchaseId: string;

    // Referencias directas para queries rápidas
    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'user_id', type: 'uuid' })
    userId: string;

    @ManyToOne(() => Product)
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @Column({ name: 'product_id', type: 'int' })
    productId: number;

    // Metadata para análisis de mercadeo
    @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
    ipAddress: string; // Soporta IPv4 e IPv6

    @Column({ name: 'user_agent', type: 'text', nullable: true })
    userAgent: string; // Para análisis de dispositivos/navegadores

    @Column({ name: 'files_downloaded', type: 'jsonb', nullable: true })
    filesDownloaded: string[]; // Array de nombres/keys de archivos descargados

    @CreateDateColumn({ name: 'downloaded_at' })
    downloadedAt: Date;
}
