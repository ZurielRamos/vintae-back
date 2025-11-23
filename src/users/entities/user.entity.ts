import { Role } from "src/common/enums/role.enum";
import { BeforeInsert, BeforeUpdate, Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import * as bcrypt from 'bcrypt';


@Entity('users')
export class User {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: false })
    name: string;

    @Column({ unique: true, nullable: true })
    email: string;

    @Column({ nullable: true })
    password: string;

    @Column({ type: 'varchar', unique: true, nullable: true })
    phoneNumber: string;

    @Column({ type: 'enum', enum: Role, default: Role.CLIENT })
    role: Role;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    designCredits: number; // Créditos para comprar descargas de diseños

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    purchaseCredits: number; // Créditos para comprar productos físicos

    @Column({ type: 'text', nullable: true, select: false })
    otpSessionInfo: string;

    // Campos de verificación de email
    @Column({ type: 'boolean', default: false })
    emailVerified: boolean;

    @Column({ type: 'timestamp', nullable: true })
    emailVerifiedAt: Date;

    @Column({ type: 'varchar', length: 6, nullable: true, select: false })
    verificationCode: string | null;

    @Column({ type: 'timestamp', nullable: true, select: false })
    verificationCodeExpiry: Date | null;

    @BeforeInsert()
    @BeforeUpdate()
    async hashPassword() {
        if (this.password) {
            // Solo hashear si la contraseña ha cambiado o es nueva
            if (!this.password.startsWith('$2b$')) {
                this.password = await bcrypt.hash(this.password, 10);
            }
        }
    }

    async validatePassword(password: string): Promise<boolean> {
        return bcrypt.compare(password, this.password);
    }
}