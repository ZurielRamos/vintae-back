import { Role } from "src/common/enums/role.enum";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import * as bcrypt from 'bcrypt';


@Entity('users')
export class User {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: false })
    name: string;

    @Column({ unique: true, nullable: false })
    email: string;

    @Column({ select: false })
    password: string;

    @Column({ type: 'enum', enum: Role, default: Role.CLIENT })
    role: Role;

    @Column({ type: 'int', default: 0 })
    credits: number;

    async hasPassword() {
        this.password = await bcrypt.hash(this.password, 10);
    }

    async validatePassword(password: string): Promise<boolean> {
        return bcrypt.compare(password, this.password);
    }
}