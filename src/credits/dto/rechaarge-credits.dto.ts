import { IsEnum, IsNotEmpty, IsNumber, IsPositive, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreditType } from '../entities/credit-transaction.entity';

export class RechargeCreditsDto {
  @ApiProperty({
    example: 50.00,
    description: 'Monto positivo a recargar en la cuenta del usuario.',
    minimum: 1
  })
  @IsNotEmpty({ message: 'El monto es obligatorio' })
  @IsNumber({}, { message: 'El monto debe ser un número' })
  @IsPositive({ message: 'El monto debe ser positivo' })
  @Min(1, { message: 'El monto mínimo de recarga es 1' })
  amount: number;

  @ApiProperty({
    enum: CreditType,
    example: CreditType.DESIGN,
    description: 'Tipo de créditos a recargar (DESIGN o PURCHASE)'
  })
  @IsNotEmpty({ message: 'El tipo de crédito es obligatorio' })
  @IsEnum(CreditType)
  creditType: CreditType;

  @ApiProperty({
    example: 'pi_3Mtn...xx',
    description: 'ID de referencia de la transacción en la pasarela de pagos (Stripe/PayPal).'
  })
  @IsNotEmpty({ message: 'La referencia de pago es obligatoria' })
  @IsString()
  paymentReference: string;
}