import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { CreditTransaction, CreditType, TransactionType } from './entities/credit-transaction.entity';
import { User } from '../users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { PaymentsService } from '../payments/payments.service';
import { Inject, forwardRef } from '@nestjs/common';
import { WompiPaymentDataDto } from '../payments/dto/wompi-payment-data.dto';

@Injectable()
export class CreditsService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @Inject(forwardRef(() => PaymentsService))
    private paymentsService: PaymentsService,
  ) { }

  // --- INICIAR RECARGA (Generar datos para Wompi) ---
  async initiateRecharge(userId: string, amount: number, creditType: CreditType): Promise<WompiPaymentDataDto> {
    if (amount < 1000) throw new BadRequestException('El monto mínimo de recarga es $1.000');

    // Incluir creditType en la referencia para recuperarlo en el webhook
    const reference = `CREDIT-${creditType}-${userId}-${Date.now()}`;
    const amountInCents = Math.round(amount * 100);
    const currency = 'COP';

    const signature = this.paymentsService.generateSignature(reference, amountInCents, currency);

    return {
      reference,
      amountInCents,
      currency,
      signature,
      publicKey: process.env.WOMPI_PUB_KEY
    };
  }

  // --- COMPRAR PAQUETE DE CRÉDITOS DE DISEÑO ---
  async purchaseDesignCreditPackage(userId: string, packageType: string): Promise<WompiPaymentDataDto> {
    // Paquetes con créditos totales (base + bonus) y precios en COP
    const DESIGN_CREDIT_PACKAGES = {
      SMALL: {
        credits: 20,
        bonus_credits: 0,
        total_credits: 20,
        price: 34900 // COP
      },
      MEDIUM: {
        credits: 50,
        bonus_credits: 5,
        total_credits: 55,
        price: 69900 // COP
      },
      LARGE: {
        credits: 120,
        bonus_credits: 15,
        total_credits: 135,
        price: 99900 // COP
      }
    };

    const packageData = DESIGN_CREDIT_PACKAGES[packageType];
    if (!packageData) {
      throw new BadRequestException('Paquete inválido');
    }

    // Referencia especial para paquetes: PACKAGE-{tipo}-{userId}-{timestamp}
    const reference = `PACKAGE-${packageType}-${userId}-${Date.now()}`;
    const amountInCents = Math.round(packageData.price * 100);
    const currency = 'COP';

    const signature = this.paymentsService.generateSignature(reference, amountInCents, currency);

    return {
      reference,
      amountInCents,
      currency,
      signature,
      publicKey: process.env.WOMPI_PUB_KEY
    };
  }

  // --- CONFIRMAR RECARGA (WEBHOOK) ---
  async confirmRecharge(reference: string, transactionId: string, amountInPesos: number) {
    // Validar si ya se procesó esta referencia (Idempotencia)
    const existingTx = await this.dataSource.getRepository(CreditTransaction).findOne({
      where: { referenceId: reference }
    });

    if (existingTx) {
      return { message: 'Transacción ya procesada' };
    }

    // Determinar si es paquete o recarga normal
    if (reference.startsWith('PACKAGE-')) {
      // PACKAGE-{tipo}-{userId}-{timestamp}
      return this.processPackagePurchase(reference, amountInPesos);
    } else if (reference.startsWith('CREDIT-')) {
      // CREDIT-{creditType}-{userId}-{timestamp}
      return this.processRegularRecharge(reference, amountInPesos);
    } else {
      throw new BadRequestException('Referencia inválida');
    }
  }

  private async processPackagePurchase(reference: string, amountInPesos: number) {
    const parts = reference.split('-');
    if (parts.length < 4) throw new BadRequestException('Referencia de paquete inválida');

    const packageType = parts[1]; // SMALL, MEDIUM, LARGE
    const timestamp = parts.pop(); // Remueve el último elemento (timestamp)
    const userId = parts.slice(2).join('-'); // UUID completo desde posición 2 hasta el final

    // Mapear paquete a créditos totales (base + bonus)
    const PACKAGE_TOTAL_CREDITS = {
      SMALL: 20,   // 20 + 0 bonus
      MEDIUM: 55,  // 50 + 5 bonus
      LARGE: 135   // 120 + 15 bonus
    };

    const totalCredits = PACKAGE_TOTAL_CREDITS[packageType];
    if (!totalCredits) throw new BadRequestException('Tipo de paquete inválido');

    // Recargar créditos de diseño (total con bonus incluido)
    await this.rechargeCredits(
      userId,
      totalCredits,
      CreditType.DESIGN,
      reference
    );

    return { message: `Paquete ${packageType} activado: ${totalCredits} créditos de diseño` };
  }

  private async processRegularRecharge(reference: string, amountInPesos: number) {
    const parts = reference.split('-');
    if (parts.length < 4) throw new BadRequestException('Referencia inválida');

    const prefix = parts.shift(); // Sacar CREDIT
    const creditTypeStr = parts.shift(); // Sacar tipo (DESIGN o PURCHASE)
    const timestamp = parts.pop(); // Sacar timestamp
    const extractedUserId = parts.join('-'); // Unir lo que queda (el UUID)

    // Validar creditType
    const creditType = creditTypeStr as CreditType;
    if (!Object.values(CreditType).includes(creditType)) {
      throw new BadRequestException('Tipo de crédito inválido en referencia');
    }

    // Procesar Recarga
    await this.rechargeCredits(extractedUserId, amountInPesos, creditType, reference);

    return { message: 'Recarga exitosa' };
  }

  /**
   * Método Genérico para modificar saldo de forma segura (ACID)
   */
  private async processTransaction(
    userId: string,
    amount: number,
    creditType: CreditType,
    type: TransactionType,
    description: string,
    referenceId?: string,
    externalManager?: EntityManager,
  ) {
    const runInTransaction = async (manager: EntityManager) => {
      // 1. BLOQUEO PESIMISTA
      const user = await manager.findOne(User, {
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) throw new BadRequestException('Usuario no encontrado');

      // 2. Seleccionar el balance correcto según creditType
      const currentBalance = creditType === CreditType.DESIGN
        ? Number(user.designCredits)
        : Number(user.purchaseCredits);

      const transactionAmount = Number(amount);
      const newBalance = currentBalance + transactionAmount;

      if (newBalance < 0) throw new BadRequestException(`Saldo insuficiente de créditos de ${creditType === CreditType.DESIGN ? 'diseño' : 'compra'}`);

      // 3. Actualizar el balance correcto
      if (creditType === CreditType.DESIGN) {
        user.designCredits = newBalance;
      } else {
        user.purchaseCredits = newBalance;
      }
      await manager.save(user);

      // 4. Guardar Transacción
      const transaction = manager.create(CreditTransaction, {
        userId,
        amount: transactionAmount,
        creditType,
        type,
        description,
        referenceId,
        balanceAfter: newBalance,
      });

      await manager.save(transaction);

      return { newBalance, transactionId: transaction.id };
    };

    if (externalManager) {
      return await runInTransaction(externalManager);
    } else {
      return await this.dataSource.transaction(runInTransaction);
    }
  }

  // --- MÉTODOS PÚBLICOS ---

  async rechargeCredits(
    userId: string,
    amount: number,
    creditType: CreditType,
    paymentReference: string,
    manager?: EntityManager
  ) {
    if (amount <= 0) throw new BadRequestException('Monto positivo requerido');

    return this.processTransaction(
      userId,
      amount,
      creditType,
      TransactionType.DEPOSIT,
      `Recarga de créditos de ${creditType === CreditType.DESIGN ? 'diseño' : 'compra'}`,
      paymentReference,
      manager
    );
  }

  async chargeUser(
    userId: string,
    amount: number,
    creditType: CreditType,
    description: string,
    manager?: EntityManager
  ) {
    if (amount <= 0) throw new BadRequestException('El monto a cobrar debe ser positivo');

    return this.processTransaction(
      userId,
      -amount, // Enviamos NEGATIVO para restar
      creditType,
      TransactionType.PURCHASE,
      description,
      undefined,
      manager
    );
  }

  async getHistory(userId: string, creditType?: CreditType) {
    const where: any = { userId };
    if (creditType) {
      where.creditType = creditType;
    }

    return this.dataSource.getRepository(CreditTransaction).find({
      where,
      order: { createdAt: 'DESC' }
    });
  }

  async getBalance(userId: string, creditType: CreditType): Promise<number> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['designCredits', 'purchaseCredits'],
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return creditType === CreditType.DESIGN
      ? Number(user.designCredits)
      : Number(user.purchaseCredits);
  }

  async getBalances(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['designCredits', 'purchaseCredits'],
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return {
      designCredits: Number(user.designCredits),
      purchaseCredits: Number(user.purchaseCredits),
    };
  }
}