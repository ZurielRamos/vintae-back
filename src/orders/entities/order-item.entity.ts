import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from './order.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'order_id', type: 'int', nullable: true })
  orderId: number;

  // Relación opcional (Set Null) para mantener historial si se borra el producto
  @ManyToOne(() => Product, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'product_id', type: 'int', nullable: true })
  productId: number | null;

  // --- SNAPSHOTS (Datos congelados al momento de compra) ---
  @Column()
  productName: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  priceAtPurchase: number;

  @Column({ type: 'int' })
  quantity: number;

  @Column()
  selectedColor: string;

  @Column()
  selectedSize: string;

  @Column({ type: 'uuid' })
  variantId: string;

  @Column()
  variantLabel: string;

  @Column({ nullable: true })
  imageUrl: string;
}