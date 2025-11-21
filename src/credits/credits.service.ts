import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { CreditTransaction, TransactionType } from './entities/credit-transaction.entity';
import { User } from '../users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class CreditsService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

    /**
     * Método Genérico para modificar saldo de forma segura (ACID)
     */
    private async processTransaction(
    userId: string,
    amount: number,
    type: TransactionType,
    description: string,
    referenceId?: string,
    externalManager?: EntityManager, // <--- NUEVO PARÁMETRO
  ) {
    // La lógica "core" que se ejecuta dentro de la transacción
    const runInTransaction = async (manager: EntityManager) => {
      // 1. BLOQUEO PESIMISTA
      const user = await manager.findOne(User, {
        where: { id: userId },
        lock: { mode: 'pessimistic_write' }, 
      });

      if (!user) throw new BadRequestException('Usuario no encontrado');

      const currentBalance = Number(user.credits);
      const transactionAmount = Number(amount);
      const newBalance = currentBalance + transactionAmount;

      if (newBalance < 0) throw new BadRequestException('Saldo insuficiente');

      // 2. Actualizar Usuario
      user.credits = newBalance;
      await manager.save(user);

      // 3. Guardar Transacción
      const transaction = manager.create(CreditTransaction, {
        userId,
        amount: transactionAmount,
        type,
        description,
        referenceId,
        balanceAfter: newBalance,
      });

      await manager.save(transaction);

      return { newBalance, transactionId: transaction.id };
    };

    // DECISIÓN: ¿Usamos la transacción que nos pasaron o creamos una nueva?
    if (externalManager) {
      // Usamos la transacción del padre (CouponsService)
      return await runInTransaction(externalManager);
    } else {
      // Creamos una nueva transacción (comportamiento original)
      return await this.dataSource.transaction(runInTransaction);
    }
  }

    // --- MÉTODOS PÚBLICOS ---

    async rechargeCredits(userId: string, amount: number, paymentReference: string, manager?: EntityManager) {
        if (amount <= 0) throw new BadRequestException('Monto positivo requerido');
        
        return this.processTransaction(
        userId,
        amount,
        TransactionType.DEPOSIT,
        'Recarga de saldo',
        paymentReference,
        manager // <--- Pasamos el manager
        );
    }

  async chargeUser(userId: string, amount: number, description: string, manager?: EntityManager) {
    if (amount <= 0) throw new BadRequestException('El monto a cobrar debe ser positivo');

    return this.processTransaction(
      userId,
      -amount, // Enviamos NEGATIVO para restar
      TransactionType.PURCHASE,
      description,
      undefined, // referenceId opcional
      manager // <--- Pasamos el manager de la Orden
    );
  }

    async getHistory(userId: string) {
        return this.dataSource.getRepository(CreditTransaction).find({
            where: { userId },
            order: { createdAt: 'DESC' }
        });
    }


    async getBalance(userId: string): Promise<number> {
        const user = await this.userRepository.findOne({
        where: { id: userId },
        select: ['credits'], // OPTIMIZACIÓN: Solo traemos la columna credits
        });

        if (!user) {
        throw new NotFoundException('Usuario no encontrado');
        }

        // Aseguramos que sea número (Postgres a veces devuelve decimal como string)
        return Number(user.credits);
    }
}