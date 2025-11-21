import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreditsService } from './credits.service';
import { CreditsController } from './credits.controller';
import { CreditTransaction } from './entities/credit-transaction.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CreditTransaction, User])],
  controllers: [CreditsController],
  providers: [CreditsService],
  exports: [CreditsService], // Exportamos el servicio para usarlo en OrdersModule
})
export class CreditsModule {}