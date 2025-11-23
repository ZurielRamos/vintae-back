import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { Role } from 'src/common/enums/role.enum';
import { WishlistService } from 'src/wishlist/wishlist.service';
import { CartService } from 'src/cart/cart.service';

@Injectable()
export class UsersService {

    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        private wishlistService: WishlistService,
        private cartService: CartService
    ) { }

    async create(createUserDto: CreateUserDto) {
        const existingUser = await this.usersRepository.findOneBy({ email: createUserDto.email });
        if (existingUser) {
            throw new ConflictException('User already exists');
        }

        const user = this.usersRepository.create(createUserDto);
        return this.usersRepository.save(user);
    }

    async createWithPhone(phoneNumber: string) {
        const newUser = this.usersRepository.create({
            phoneNumber: phoneNumber,
            role: Role.CLIENT,
            name: phoneNumber, // Nombre temporal ej: User 5678
            // email y password se guardan como null automáticamente
        });

        return await this.usersRepository.save(newUser);
    }

    async createGuestUser() {
        const guestUser = this.usersRepository.create({
            name: 'Invitado',
            role: Role.GUEST,
        });
        return this.usersRepository.save(guestUser);
    }

    async findOneByEmail(email: string) {
        return this.usersRepository.findOne({ where: { email }, select: ['id', 'name', 'email', 'role', 'designCredits', 'purchaseCredits', 'password'] });
    }

    async findOneByPhone(phoneNumber: string) {
        return this.usersRepository.findOne({
            where: { phoneNumber },
            // Necesitamos otpSessionInfo para verificar, así que lo seleccionamos explícitamente
            select: ['id', 'phoneNumber', 'role', 'otpSessionInfo', 'designCredits', 'purchaseCredits', 'email']
        });
    }

    async updateOtpSession(userId: string, sessionInfo: string | null) {
        return this.usersRepository.update(userId, {
            // El operador || null asegura que si sessionInfo es undefined, se envíe null
            otpSessionInfo: (sessionInfo || null) as any
        });
    }

    async findOneById(id: string) {
        return this.usersRepository.findOne({ where: { id } });
    }


    /**
     * Fusiona los datos de un usuario invitado en un usuario registrado
     * y elimina al invitado.
     */
    async mergeGuestIntoUser(guestId: string, targetUserId: string) {
        console.log('entrando')
        const guestUser = await this.findOneById(guestId);

        // Si el invitado no existe o es el mismo usuario, no hacemos nada
        if (!guestUser || guestId === targetUserId) return;

        if (guestUser.email || guestUser.phoneNumber) {
            console.warn(`Intento de fusión bloqueado: El usuario origen es una cuenta registrada.`);
            return;
        }

        // --- AQUÍ IRÁ TU LÓGICA DE CARRITO MÁS ADELANTE ---
        // Ejemplo conceptual:
        await this.wishlistService.mergeWishlist(guestId, targetUserId);
        await this.cartService.mergeCarts(guestId, targetUserId);
        // await this.cartRepository.update({ userId: guestId }, { userId: targetUserId });
        // await this.favoritesRepository.update({ userId: guestId }, { userId: targetUserId });
        // ---------------------------------------------------

        // Finalmente, eliminamos al usuario invitado para no dejar basura en la DB
        // Usamos delete para borrarlo físicamente
        console.log('eliminando')
        await this.usersRepository.delete(guestId);

        console.log(`Invitado ${guestId} fusionado exitosamente con Usuario ${targetUserId}`);
    }



}
