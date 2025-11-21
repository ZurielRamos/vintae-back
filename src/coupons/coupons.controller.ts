import { Controller, Post, Body, Get, UseGuards, Request, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { RedeemCouponDto } from './dto/redeem-coupon.dto';

@ApiTags('Cupones y Descuentos')
@ApiBearerAuth()
@Controller('coupons')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  // 1. CREAR (ADMIN)
  @Post()
  @Roles(Role.CLIENT)
  @ApiOperation({ summary: 'Crear nuevo cupón (Admin)' })
  create(@Body() dto: CreateCouponDto) {
    return this.couponsService.create(dto);
  }

  // 2. CANJEAR RECARGA (CLIENTE)
  @Post('redeem-recharge')
  @Roles(Role.CLIENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Canjear código de recarga de saldo' })
  @ApiResponse({ status: 200, description: 'Saldo agregado a la cuenta' })
  redeemRecharge(@Body() dto: RedeemCouponDto, @Request() req) {
    return this.couponsService.applyRechargeCoupon(dto.code, req.user.id);
  }

  // 3. VALIDAR EN CARRITO (CLIENTE)
  @Get('validate')
  @Roles(Role.CLIENT)
  @ApiOperation({ summary: 'Verificar cupón antes de comprar' })
  async checkCoupon(
    @Query('code') code: string, 
    @Query('amount') amount: number, // Monto actual del carrito
    @Request() req
  ) {
    const coupon = await this.couponsService.validateCoupon(code, req.user.id, amount);
    return { 
      valid: true, 
      type: coupon.type, 
      value: coupon.value,
      code: coupon.code,
      minPurchase: coupon.minPurchase
    };
  }
}