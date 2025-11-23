import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Coupon } from './entities/coupon.entity';
import { CreditsService } from 'src/credits/credits.service';
import { CreditType } from 'src/credits/entities/credit-transaction.entity';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { CouponUsage } from './entities/coupon-usage.entity';
import { CouponType }
  from 'src/common/enums/coupon-type.enum';

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon) private couponRepo: Repository<Coupon>,
    @InjectRepository(CouponUsage) private usageRepo: Repository<CouponUsage>,
    private creditsService: CreditsService, // Inyectamos el módulo de créditos
    private dataSource: DataSource,
  ) { }

  // --- CREAR (ADMIN) ---
  async create(dto: CreateCouponDto) {
    // Verificar que el código sea único
    const exists = await this.couponRepo.findOneBy({ code: dto.code });
    if (exists) throw new BadRequestException('El código de cupón ya existe');

    const coupon = this.couponRepo.create(dto);
    return this.couponRepo.save(coupon);
  }

  /**
   * @param expectedType (Opcional) Si se envía, fuerza a que el cupón sea de este tipo antes de validar montos.
   */
  async validateCoupon(
    code: string,
    userId: string,
    purchaseAmount: number = 0,
    expectedType?: CouponType // <--- NUEVO PARÁMETRO
  ): Promise<Coupon> {


    const coupon = await this.couponRepo.findOne({ where: { code } });

    if (!coupon) throw new BadRequestException('Cupón inválido');
    if (!coupon.isActive) throw new BadRequestException('Este cupón está desactivado');
    if (new Date() > coupon.expirationDate) throw new BadRequestException('Este cupón ha expirado');
    if (coupon.usedCount >= coupon.globalUsageLimit) throw new BadRequestException('Este cupón se ha agotado globalmente');

    // --- NUEVA VALIDACIÓN DE TIPO (PRIORITARIA) ---
    // Verificamos el tipo ANTES de chequear montos mínimos
    if (expectedType && coupon.type !== expectedType) {
      throw new BadRequestException(`Este cupón no es válido para esta operación (Tipo esperado: ${expectedType})`);
    }
    // ----------------------------------------------

    // Validar mínimo de compra (Solo aplica si NO es una recarga o si el tipo coincide)
    // Nota: Si es RECHARGE_CREDIT, ignoramos minPurchase
    if (coupon.type !== CouponType.RECHARGE_CREDIT && purchaseAmount < coupon.minPurchase) {
      throw new BadRequestException(`El monto mínimo para usar este cupón es $${coupon.minPurchase}`);
    }

    const userUsageCount = await this.usageRepo.createQueryBuilder('usage')
      .where('usage.couponId = :couponId', { couponId: coupon.id })
      .andWhere('usage.userId = :userId', { userId: userId })
      .getCount();

    console.log(`Usuario ${userId} ha usado el cupón ${code}: ${userUsageCount} veces. Límite: ${coupon.usageLimitPerUser}`);

    if (userUsageCount >= coupon.usageLimitPerUser) {
      throw new BadRequestException(
        `Ya has utilizado este cupón el máximo de veces permitido (${coupon.usageLimitPerUser})`
      );
    }

    return coupon;
  }

  // --- CANJEAR CUPÓN DE RECARGA (SALDO) ---
  async applyRechargeCoupon(code: string, userId: string) {
    // 1. Validación (fuera de la transacción para no bloquear innecesariamente)
    const coupon = await this.validateCoupon(code, userId, 0, CouponType.RECHARGE_CREDIT);

    // 2. Transacción Única
    await this.dataSource.transaction(async (manager) => {

      // A. Registrar Uso (Usando 'manager')
      const usage = manager.create(CouponUsage, { userId, couponId: coupon.id });
      await manager.save(usage);

      // B. Incrementar contador (Usando 'manager')
      await manager.increment(Coupon, { id: coupon.id }, 'usedCount', 1);

      // C. Recargar Saldo (¡AQUÍ ESTÁ EL CAMBIO!)
      // Pasamos 'manager' como último argumento. 
      // Ahora CreditsService usará ESTA misma transacción en lugar de esperar una nueva.
      await this.creditsService.rechargeCredits(
        userId,
        Number(coupon.value),
        CreditType.PURCHASE, // Recargar créditos de compra
        `Cupón: ${code}`,
        manager
      );
    });

    // Obtenemos el balance final (fuera de la transacción)
    return {
      message: `Recarga exitosa de $${coupon.value}`,
      newBalance: await this.creditsService.getBalance(userId, CreditType.PURCHASE)
    };
  }

  // --- PROCESAR GIFT CARD (Para módulo de Órdenes) ---
  async processGiftCardUsage(code: string, userId: string, orderTotal: number, orderId: string) {
    const coupon = await this.validateCoupon(code, userId, orderTotal);

    if (coupon.type !== CouponType.GIFT_CARD) throw new BadRequestException('El código no es una Gift Card');

    const cardValue = Number(coupon.value);
    let paidAmount = 0;
    let surplus = 0;

    if (cardValue >= orderTotal) {
      paidAmount = orderTotal;
      surplus = cardValue - orderTotal;
    } else {
      paidAmount = cardValue;
      surplus = 0;
    }

    // Guardar uso
    await this.usageRepo.save({ userId, couponId: coupon.id, orderId });
    await this.couponRepo.increment({ id: coupon.id }, 'usedCount', 1);

    // Mover excedente a wallet
    if (surplus > 0) {
      await this.creditsService.rechargeCredits(userId, surplus, CreditType.PURCHASE, `Excedente Gift Card ${code}`);
    }

    return {
      coveredAmount: paidAmount,
      surplusToWallet: surplus,
      couponId: coupon.id
    };
  }
}