// src/price-group/price-group.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Product } from './product.entity';

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



@Entity('price_group')
export class PriceGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, transformer: NumericTransformer })
  basePrice: number;

}  
