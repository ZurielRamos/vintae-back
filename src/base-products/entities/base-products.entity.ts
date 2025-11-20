import { ProductCategory } from "src/categories/entities/product-category.entity";
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from "typeorm";

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

@Entity('base_products')
export class BaseProduct {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({nullable: true})
    description: string;

    @Column('text', { array: true, default: [] })
    colors: string[];

    @Column('text', { array: true, default: [] })
    sizes: string[];

    @Column('text', { array: true, default: [] })
    imageUrls: string[];

    @Column({ type: 'decimal', precision: 10, scale: 2, transformer: NumericTransformer })
    cost: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, transformer: NumericTransformer })
    suggestedPrice: number;

    @OneToMany(() => ProductCategory, pc => pc.product)
    productCategories: ProductCategory[];

}