import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Category } from './category.entity';
import { BaseProduct } from 'src/base-products/entities/base-products.entity';
// Asegúrate de que esta sea la ruta correcta a tu entidad BaseProduct

@Entity('base_product_categories') 
// Índice que optimiza la búsqueda de productos en una categoría.
@Index(['baseProductId', 'categoryId'], { unique: true }) 
export class ProductCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  // ID del BaseProduct (el artículo físico).
  baseProductId: string; 

  @ManyToOne(() => BaseProduct, product => product.productCategories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'base_product_id' })
  product: BaseProduct; 

  @Column('uuid')
  categoryId: string;

  @ManyToOne(() => Category, category => category.productCategories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  category: Category;
  
  @Column({ default: false })
  // Si esta categoría es la principal para el producto.
  isPrimary: boolean; 
}