import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',       // Recarga de saldo
  PURCHASE = 'PURCHASE',     // Compra de producto
  REFUND = 'REFUND',         // Reembolso
  ADJUSTMENT = 'ADJUSTMENT', // Ajuste manual de admin
}

export enum CreditType {
  DESIGN = 'DESIGN',         // Créditos de diseño
  PURCHASE = 'PURCHASE',     // Créditos de compra
}

@Entity('credit_transactions')
export class CreditTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number; // Valor de la transacción (positivo o negativo)

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column({ type: 'enum', enum: CreditType })
  creditType: CreditType; // Tipo de crédito (diseño o compra)

  @Column({ nullable: true })
  description: string; // Ej: "Recarga vía Stripe", "Compra Orden #123"

  @Column({ nullable: true })
  referenceId: string; // ID externo (Stripe ID, Order ID) para trazabilidad

  // Relación con el usuario
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  // Guardamos el saldo que quedó DESPUÉS de la transacción (Snapshot)
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  balanceAfter: number;

  @CreateDateColumn()
  createdAt: Date;
}