import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { BaseProduct } from "src/base-products/entities/base-products.entity";

@Entity()
export class Product {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column()
    name: string;

    @Column({ unique: true })
    sku: string; // Auto-generado: {baseProduct.sku}-{contador}

    @Column()
    description: string;

    @Column('text', { array: true, default: [] })
    themes: string[];

    @Column('text', { array: true, default: [] })
    styles: string[];

    @Column('text', { array: true, default: [] })
    tags: string[];

    @Column('text', { array: true, default: [] })
    availableColors: string[];

    @Column('text', { array: true, default: [] })
    designColors: string[];

    @Column('text', { array: true, default: [] })
    imageUrls: string[];

    @Column({ nullable: true })
    files: string; // Archivo de diseño (un solo archivo)

    @Column()
    isEditable: boolean;

    @Column()
    isPublished: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column()
    isPremium: boolean;

    // El campo clave para la búsqueda semántica.
    @Column('vector', { nullable: true, select: false })
    embedding: any;

    // Relación ManyToOne con BaseProduct (un producto tiene UN base product)
    @ManyToOne(() => BaseProduct, { eager: true })
    @JoinColumn({ name: 'base_product_id' })
    baseProduct: BaseProduct;

    @Column({ name: 'base_product_id', type: 'uuid' })
    baseProductId: string;

    // Contadores de estadísticas
    @Column({ default: 0 })
    designSoldCount: number; // Cuántas veces se vendió el diseño

    @Column({ default: 0 })
    designDownloadCount: number; // Cuántas veces se descargó

    @Column({ default: 0 })
    saveCount: number; // Cuántas veces se guardó en favoritos

    @Column({ default: 0 })
    shareCount: number; // Cuántas veces se compartió

}
