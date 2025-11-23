import { IsEnum, IsNotEmpty, IsNumber, IsPositive, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreditType } from '../entities/credit-transaction.entity';

export class InitiateRechargeDto {
    @ApiProperty({
        description: 'Monto a recargar en pesos colombianos',
        example: 10000,
        minimum: 1000,
    })
    @IsNumber()
    @IsPositive()
    @Min(1000, { message: 'El monto mínimo de recarga es $1.000' })
    amount: number;

    @ApiProperty({
        enum: CreditType,
        description: 'Tipo de créditos a recargar',
        example: CreditType.DESIGN
    })
    @IsNotEmpty()
    @IsEnum(CreditType)
    creditType: CreditType;
}
