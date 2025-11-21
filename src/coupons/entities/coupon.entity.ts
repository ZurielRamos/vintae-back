import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { CouponType } from '../../common/enums/coupon-type.enum';

@Entity('coupons')
export class Coupon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string; // Ej: "NAVIDAD2025"

  @Column({ type: 'enum', enum: CouponType })
  type: CouponType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  value: number; // Valor del descuento o recarga

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  minPurchase: number; // Mínimo de compra (solo para descuentos)

  @Column()
  expirationDate: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 1000 })
  globalUsageLimit: number; // Límite total de usos

  @Column({ default: 1 })
  usageLimitPerUser: number; // Límite por persona

  @Column({ default: 0 })
  usedCount: number; // Contador actual

  @CreateDateColumn()
  createdAt: Date;
}