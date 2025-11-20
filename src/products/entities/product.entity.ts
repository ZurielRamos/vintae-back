import { Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { PriceGroup } from "./price-group.entity";
import { BaseProduct } from "src/base-products/entities/base-products.entity";



const NumericTransformer = {
    // 1. Al leer (FROM DB -> TO JavaScript/TypeScript)
    from: (value: string | number | null): number | null => {
        if (value === null || value === undefined) {
            return null;
        }
        // PostgreSQL devuelve 'decimal' como string, usamos parseFloat
        // para convertirlo en un número que pueda usarse en JS.
        return parseFloat(value as string);
    },
    // 2. Al escribir (FROM JavaScript/TypeScript -> TO DB)
    to: (value: number | null): number | null => {
        if (value === null || value === undefined) {
            return null;
        }
        // Se asegura de que el valor se guarde como un número
        return value;
    },
};

@Entity()
export class Product {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column()
    name: string;

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
    availableSizes: string[];

    @Column('text', { array: true, default: [] })
    designColors: string[];

    @Column('text', { array: true, default: [] })
    imageUrls: string[];

    @Column('text', { array: true, default: [] })
    fileUrls: string[];

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
    // Usamos 'float' array ('float4' en Postgres) para almacenar el vector.
    // Asegúrate de que el tamaño (ej: 1536) coincide con el modelo de embedding.
    @Column('vector', { nullable: true, select: false })
    embedding: any;

    @ManyToMany(() => BaseProduct)
    @JoinTable({
        name: 'product_base_products',
        joinColumn: { name: 'product_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'base_product_id', referencedColumnName: 'id' },
    })
    baseProducts: BaseProduct[];

    // Campo de anulación individual: puede ser NULO
    @Column('decimal', { precision: 10, scale: 2, nullable: true , transformer: NumericTransformer })
    individualPrice: number;

}
