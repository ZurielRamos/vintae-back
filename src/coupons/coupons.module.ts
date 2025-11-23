import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CouponsService } from './coupons.service';
import { CouponsController } from './coupons.controller';
import { Coupon } from './entities/coupon.entity';
import { CouponUsage } from './entities/coupon-usage.entity';
import { CreditsModule } from '../credits/credits.module'; // <--- IMPORTANTE

@Module({
  imports: [
    TypeOrmModule.forFeature([Coupon, CouponUsage]),
    forwardRef(() => CreditsModule), // Importamos para usar CreditsService
  ],
  controllers: [CouponsController],
  providers: [CouponsService],
  exports: [CouponsService], // Exportamos para que OrdersModule pueda usarlo
})
export class CouponsModule { }