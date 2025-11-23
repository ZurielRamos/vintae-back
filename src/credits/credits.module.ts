import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreditsService } from './credits.service';
import { CreditsController } from './credits.controller';
import { CreditTransaction } from './entities/credit-transaction.entity';
import { User } from '../users/entities/user.entity';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, CreditTransaction]),
    forwardRef(() => PaymentsModule),
  ],
  controllers: [CreditsController],
  providers: [CreditsService],
  exports: [CreditsService], // Exportamos el servicio para usarlo en OrdersModule
})
export class CreditsModule { }