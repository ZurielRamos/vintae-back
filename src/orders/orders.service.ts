import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, EntityManager } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CartService } from '../cart/cart.service';
import { CreditsService } from '../credits/credits.service';
import { CreditType } from '../credits/entities/credit-transaction.entity';
import { CouponsService } from '../coupons/coupons.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus, PaymentMethod } from 'src/common/enums/order-status.enum';
import { CouponType } from 'src/common/enums/coupon-type.enum';
import { FindAllOrdersDto } from './dto/find-all-orders.dto';
import { OrderStatusHistory } from './entities/order-status-history.entity';
import { ChangeOrderStatusDto } from './dto/change-order-status.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { PaymentsService } from '../payments/payments.service';
import { Inject, forwardRef } from '@nestjs/common';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    private cartService: CartService,
    private creditsService: CreditsService,
    private couponsService: CouponsService,
    private dataSource: DataSource,
    @Inject(forwardRef(() => PaymentsService))
    private paymentsService: PaymentsService,
  ) { }

  // --- CONFIRMAR PAGO (WEBHOOK) ---
  async confirmOrderPayment(reference: string, transactionId: string, amountInPesos: number) {
    // 1. Buscar Orden por Referencia
    const order = await this.orderRepo.findOne({ where: { paymentReference: reference } });

    if (!order) {
      throw new NotFoundException(`Orden con referencia ${reference} no encontrada`);
    }

    // 2. Validar Estado
    if (order.status === OrderStatus.PAID) {
      return { message: 'Orden ya estaba pagada' };
    }

    // 3. Validar Monto (Tolerancia de $100 pesos por redondeo)
    const diff = Math.abs(Number(order.total) - amountInPesos);
    if (diff > 100) {
      throw new BadRequestException(`Monto incorrecto. Esperado: ${order.total}, Recibido: ${amountInPesos}`);
    }

    // 4. Actualizar Estado (Transacción)
    await this.dataSource.transaction(async (manager) => {
      order.status = OrderStatus.PAID;
      await manager.save(order);

      await this.logStatusChange(
        manager,
        order.id,
        OrderStatus.PENDING_PAYMENT,
        OrderStatus.PAID,
        null, // Sistema
        `Pago confirmado por Wompi (Tx: ${transactionId})`
      );
    });

    return order;
  }


  private async logStatusChange(
    manager: EntityManager,
    orderId: number,
    previousStatus: OrderStatus | null,
    newStatus: OrderStatus,
    userId: string | null,
    reason: string
  ) {
    const history = manager.create(OrderStatusHistory, {
      order: { id: orderId },
      previousStatus,
      newStatus,
      changedBy: userId ? { id: userId } : null,
      reason
    } as any);

    await manager.save(history);
  }

  async createOrder(userId: string, dto: CreateOrderDto) {
    // 1. Obtener el Carrito
    const cart = await this.cartService.getCart(userId);
    if (cart.items.length === 0) {
      throw new BadRequestException('El carrito está vacío');
    }

    // 2. Validar Regla de Negocio: Contraentrega
    if (dto.paymentMethod === PaymentMethod.CASH_ON_DELIVERY) {
      const cityNormalized = dto.shippingAddress.city.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (!cityNormalized.includes('medellin')) {
        throw new BadRequestException('El pago contraentrega solo está habilitado para Medellín');
      }
    }

    // 3. Cálculos Iniciales
    const subtotal = cart.subtotal;
    let discount = 0;
    let shippingCost = 0;
    let couponIdToUse: string | null = null;

    // 4. Aplicar Cupón
    if (dto.couponCode) {
      const coupon = await this.couponsService.validateCoupon(dto.couponCode, userId, subtotal);

      if (coupon.type === CouponType.PERCENTAGE) {
        discount = (subtotal * coupon.value) / 100;
      } else if (coupon.type === CouponType.FIXED_AMOUNT) {
        discount = Number(coupon.value);
      } else if (coupon.type === CouponType.GIFT_CARD) {
        couponIdToUse = coupon.id;
      }
    }

    if (discount > subtotal) discount = subtotal;
    const total = subtotal - discount + shippingCost;

    // 5. INICIAR TRANSACCIÓN ACID
    return await this.dataSource.transaction(async (manager) => {

      let status: OrderStatus = OrderStatus.PENDING;
      let paymentReference: string | null = null;
      let wompiData: any = null;

      // --- SWITCH DE MÉTODOS DE PAGO ---
      switch (dto.paymentMethod) {
        case PaymentMethod.WALLET:
          // Cobro inmediato con PURCHASE credits
          const tx = await this.creditsService.chargeUser(
            userId,
            total,
            CreditType.PURCHASE, // Usar créditos de compra
            'Pago de Orden',
            manager
          );
          paymentReference = tx.transactionId;
          status = OrderStatus.PAID;
          break;

        case PaymentMethod.CASH_ON_DELIVERY:
          status = OrderStatus.PENDING;
          paymentReference = 'COD-' + Date.now();
          break;

        case PaymentMethod.BANK_TRANSFER:
          status = OrderStatus.PENDING;
          paymentReference = 'TRANSFER-' + Date.now();
          break;

        case PaymentMethod.WOMPI:
          status = OrderStatus.PENDING_PAYMENT;
          paymentReference = `ORD-${userId.substring(0, 5)}-${Date.now()}`;

          const amountInCents = Math.round(total * 100);
          const currency = 'COP';
          const signature = this.paymentsService.generateSignature(paymentReference, amountInCents, currency);

          wompiData = {
            reference: paymentReference,
            amountInCents,
            currency,
            signature, // <--- Firma generada
            publicKey: process.env.WOMPI_PUB_KEY // Opcional enviarla
          };
          break;
      }

      // A. Guardar Orden
      const order = manager.create(Order, {
        userId,
        subtotal,
        discount,
        shippingCost,
        total,
        status,
        paymentMethod: dto.paymentMethod,
        paymentReference,
        shippingAddress: dto.shippingAddress,
        couponCode: dto.couponCode
      });
      const savedOrder = await manager.save(order);

      // B. Guardar Items (Snapshots)
      const orderItems = cart.items.map(item => manager.create(OrderItem, {
        order: savedOrder,
        productId: item.productId,
        productName: item.productName,
        priceAtPurchase: item.price,
        quantity: item.quantity,
        selectedColor: item.selectedColor,
        selectedSize: item.selectedSize,
        variantId: item.variantId,
        variantLabel: item.variantLabel,
        imageUrl: item.image || undefined
      }));
      await manager.save(OrderItem, orderItems);

      // C. Procesar Gift Card (si aplica)
      if (couponIdToUse) {
        // Si tienes lógica para marcar como usada la gift card
        // await this.couponsService.markAsUsed(couponIdToUse, manager);
      }

      // D. Vaciar Carrito
      await manager.delete('cart_items', { cartId: cart.id });

      // E. Registrar Log de Cambio de Estado
      await this.logStatusChange(
        manager,
        savedOrder.id,
        null,
        status,
        userId,
        `Pedido creado con metodo: ${dto.paymentMethod}`
      );

      // Retornamos estructura lista para el frontend
      return {
        order: savedOrder,
        wompiData // Será null si no es Wompi
      };
    });
  }

  // --- HISTORIAL ---
  async getMyOrders(userId: string) {
    return this.orderRepo.find({
      where: { userId },
      relations: ['items'],
      order: { createdAt: 'DESC' }
    });
  }

  async getOrderById(orderId: number, userId: string) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['items']
    });
    if (!order) throw new NotFoundException('Orden no encontrada');
    if (order.userId !== userId) throw new BadRequestException('No autorizado');
    return order;
  }


  // --- MÉTODO UNIFICADO DE APROBACIÓN (ADMIN) ---
  async approveOrderPayment(orderId: number, adminUserId: string) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });

    if (!order) throw new NotFoundException('Orden no encontrada');

    // 1. Validar que el método de pago requiera aprobación manual
    const manualMethods = [PaymentMethod.BANK_TRANSFER, PaymentMethod.CASH_ON_DELIVERY];

    if (!manualMethods.includes(order.paymentMethod)) {
      throw new BadRequestException(
        `Este método de pago (${order.paymentMethod}) se procesa automáticamente o no requiere aprobación manual.`
      );
    }

    // 2. Validar que no esté ya pagada
    if (order.status === OrderStatus.PAID) {
      throw new BadRequestException('La orden ya está marcada como PAGADA');
    }

    const previousStatus = order.status;

    // USAMOS TRANSACCIÓN AHORA
    return await this.dataSource.transaction(async (manager) => {
      // 1. Actualizar Orden
      order.status = OrderStatus.PAID;
      order.approvedByUserId = adminUserId;
      order.approvedAt = new Date();

      await manager.save(order);

      // 2. Registrar Log (Usando nuestro helper)
      await this.logStatusChange(
        manager,
        order.id,
        previousStatus,
        OrderStatus.PAID,
        adminUserId, // ID del Admin
        'Pago aprobado manualmente por administrador'
      );

      return order;
    });
  }




  // --- LISTAR ÓRDENES (ADMIN) ---
  async findAllAdmin(dto: FindAllOrdersDto) {
    const {
      page = 1,
      limit = 10,
      orderId,
      status,
      paymentMethod,
      userId,
      startDate,
      endDate,
      sort
    } = dto;

    // 1. Crear QueryBuilder
    const query = this.orderRepo.createQueryBuilder('order');

    // 2. Unir relaciones necesarias (Para mostrar quién compró)
    // 'user' es el nombre de la propiedad en la entidad Order
    query.leftJoinAndSelect('order.user', 'user');
    // Si quieres ver los items en la lista principal (puede ser pesado), descomenta:
    // query.leftJoinAndSelect('order.items', 'items');

    // 3. Aplicar Filtros Dinámicos

    if (orderId) {
      // Búsqueda exacta por ID
      query.andWhere('order.id = :orderId', { orderId });
    }

    if (status) {
      query.andWhere('order.status = :status', { status });
    }

    if (paymentMethod) {
      query.andWhere('order.paymentMethod = :paymentMethod', { paymentMethod });
    }

    if (userId) {
      query.andWhere('order.userId = :userId', { userId });
    }

    if (startDate) {
      query.andWhere('order.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      // Ajustamos al final del día para incluir todo ese día
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.andWhere('order.createdAt <= :end', { end });
    }

    // 4. Paginación y Ordenamiento
    query.orderBy('order.createdAt', sort);
    query.skip((page - 1) * limit);
    query.take(limit);

    // 5. Ejecutar consulta (Devuelve datos y el conteo total)
    const [data, total] = await query.getManyAndCount();

    // 6. Retornar estructura estandarizada de paginación
    return {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
        limit,
      },
    };
  }




  // --- CAMBIAR ESTADO (ADMIN) ---
  async changeStatus(orderId: number, dto: ChangeOrderStatusDto, adminUserId: string) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Orden no encontrada');

    // Validación lógica básica (Máquina de estados)
    if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.DELIVERED) {
      throw new BadRequestException('No se puede cambiar el estado de una orden finalizada');
    }

    if (order.status === dto.status) {
      throw new BadRequestException('La orden ya tiene este estado');
    }

    const previousStatus = order.status;

    // TRANSACCIÓN PARA CONSISTENCIA
    return await this.dataSource.transaction(async (manager) => {
      // 1. Actualizar Orden
      order.status = dto.status;
      await manager.save(order);

      // 2. Crear Log de Auditoría
      const history = manager.create(OrderStatusHistory, {
        orderId: order.id,
        previousStatus: previousStatus,
        newStatus: dto.status,
        changedByUserId: adminUserId, // ID del Admin
        reason: dto.reason || 'Cambio manual por administrador'
      });
      await manager.save(history);

      // // 3. Lógica adicional (Ej: Devolver stock si cancelan)
      // if (dto.status === OrderStatus.CANCELLED && previousStatus !== OrderStatus.CANCELLED) {
      //     // await this.productsService.restoreStock(...)
      // }

      return order;
    });
  }




  // --- VER HISTORIAL DE CAMBIOS ---
  async getStatusHistory(orderId: number) {
    return this.dataSource.getRepository(OrderStatusHistory).find({
      where: { orderId },
      order: { createdAt: 'DESC' },
      relations: ['changedBy'] // Para mostrar el nombre del admin
    });
  }




  // --- CANCELAR PEDIDO (CLIENTE) ---
  async cancelMyOrder(orderId: number, userId: string, dto: CancelOrderDto) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });

    if (!order) throw new NotFoundException('Orden no encontrada');

    // 1. Validar Dueño
    if (order.userId !== userId) {
      throw new BadRequestException('No tienes permiso para cancelar esta orden');
    }

    // 2. Validar Estado (Solo se puede cancelar si no ha salido)
    const cancellableStatuses = [OrderStatus.PENDING, OrderStatus.PENDING_PAYMENT, OrderStatus.PAID];
    if (!cancellableStatuses.includes(order.status)) {
      throw new BadRequestException('No es posible cancelar la orden en su estado actual (Probablemente ya fue enviada)');
    }

    const previousStatus = order.status;

    // 3. TRANSACCIÓN ACID
    return await this.dataSource.transaction(async (manager) => {

      // A. Reembolso Automático (Si aplica)
      // Si la orden ya estaba pagada (por Wallet, Wompi o Transferencia aprobada),
      // devolvemos el dinero a la Billetera del usuario.
      if (previousStatus === OrderStatus.PAID) {
        // Nota: Llamamos a rechargeCredits pasando el 'manager' para que sea atómico
        await this.creditsService.rechargeCredits(
          userId,
          Number(order.total),
          CreditType.PURCHASE, // Reembolsar créditos de compra
          `Reembolso Orden #${order.id}`,
          manager
        );
      }

      // B. Actualizar Estado
      order.status = OrderStatus.CANCELLED;
      await manager.save(order);

      // C. Log de Auditoría
      await this.logStatusChange(
        manager,
        order.id,
        previousStatus,
        OrderStatus.CANCELLED,
        userId, // El usuario lo hizo
        `Cancelado por el cliente. Razón: ${dto.reason}`
      );

      // D. Restaurar Stock (Opcional, si manejas inventario estricto)
      // await this.productsService.restoreStock(order.items, manager);

      return {
        message: 'Orden cancelada exitosamente',
        refunded: previousStatus === OrderStatus.PAID // Flag para avisar al front
      };
    });
  }


}