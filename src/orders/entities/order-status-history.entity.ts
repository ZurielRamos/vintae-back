import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from './order.entity';
import { User } from '../../users/entities/user.entity';
import { OrderStatus } from '../../common/enums/order-status.enum';

@Entity('order_status_history')
export class OrderStatusHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relación con la Orden
  @ManyToOne(() => Order, (order) => order.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ type: 'int' }) // Recuerda que cambiamos Order.id a numérico
  orderId: number;

  // Estado ANTERIOR (para saber de dónde venía)
  @Column({ type: 'enum', enum: OrderStatus, nullable: true })
  previousStatus: OrderStatus;

  // Estado NUEVO
  @Column({ type: 'enum', enum: OrderStatus })
  newStatus: OrderStatus;

  // ¿Quién hizo el cambio? (Puede ser NULL si fue el Sistema/Wompi)
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'changed_by_user_id' })
  changedBy: User;

  @Column({ name: 'changed_by_user_id', type: 'uuid', nullable: true })
  changedByUserId: string;

  // Razón o Nota (Ej: "Cliente solicitó cancelación", "Pago rechazado")
  @Column({ nullable: true })
  reason: string;

  @CreateDateColumn()
  createdAt: Date;
}