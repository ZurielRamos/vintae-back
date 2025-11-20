import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn, Index } from 'typeorm';
import { CategoryClosure } from './category-clousure.entity';
import { ProductCategory } from './product-category.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string; 

  @Column({ unique: true })
  // Slug amigable, vital para URLs limpias y SEO.
  slug: string; 

  @Column({ nullable: true })
  description: string;

  // -------------------------
  // Jerarquía Directa (Self-Referencing)
  // -------------------------

  @Index() // Índice para búsquedas rápidas de hijos directos.
  @Column({ type: 'uuid', nullable: true })
  // Referencia al ID del padre directo (sólo un nivel).
  parentId: string | null; 

  @ManyToOne(() => Category, category => category.children, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parentId' })
  parent: Category;

  @OneToMany(() => Category, category => category.parent)
  children: Category[];

  // -------------------------
  // Relación con Closure Table
  // -------------------------

  // Relaciones necesarias para que TypeORM reconozca los JOINs con CategoryClosure.
  @OneToMany(() => CategoryClosure, closure => closure.ancestor)
  ancestors: CategoryClosure[];
  
  @OneToMany(() => CategoryClosure, closure => closure.descendant)
  descendants: CategoryClosure[];

  // -------------------------
  // Relación con Productos
  // -------------------------

  @OneToMany(() => ProductCategory, pc => pc.category)
  productCategories: ProductCategory[];
}