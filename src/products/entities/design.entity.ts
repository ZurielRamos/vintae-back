import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";



@Entity('designs')
export class Design {

    @PrimaryGeneratedColumn('uuid')
    id: string; 

    @Column({ length: 255 })
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ default: false })
    isPremium: boolean; // ¿Es de pago?

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    updatedAt: Date;
}