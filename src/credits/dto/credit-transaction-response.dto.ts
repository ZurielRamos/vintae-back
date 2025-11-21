import { ApiProperty } from '@nestjs/swagger';
import { TransactionType } from '../entities/credit-transaction.entity';

export class CreditTransactionResponseDto {
  @ApiProperty({ example: 'a0eebc99-9c0b...' })
  id: string;

  @ApiProperty({ example: 150.00, description: 'Monto de la transacción' })
  amount: number;

  @ApiProperty({ enum: TransactionType, example: TransactionType.DEPOSIT })
  type: TransactionType;

  @ApiProperty({ example: 'Recarga vía Stripe', nullable: true })
  description: string;

  @ApiProperty({ example: 250.50, description: 'Saldo resultante después de la operación' })
  balanceAfter: number;

  @ApiProperty()
  createdAt: Date;
}

export class BalanceResponseDto {
    @ApiProperty({ example: 250.50, description: 'Saldo actual disponible' })
    credits: number;
}