import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Product } from './product.entity';

@Entity('design_purchases')
@Unique(['userId', 'productId']) // Solo se compra una vez (Acceso vitalicio)
export class DesignPurchase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  pricePaid: number; // Guardamos cuánto pagó (por si el precio cambia luego)

  @Column({ nullable: true })
  purchaseType: string; // 'ONE', 'FIVE', 'UNLIMITED'

  @Column({ type: 'int', nullable: true })
  downloadsRemaining: number | null; // Null = Ilimitado

  @CreateDateColumn()
  purchasedAt: Date;
}