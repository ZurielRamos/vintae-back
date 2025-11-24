import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

export enum CreditPackage {
    SMALL = 'SMALL',   // 20 créditos - $34,900
    MEDIUM = 'MEDIUM', // 50 créditos - $69,900
    LARGE = 'LARGE',   // 120 créditos - $99,900
}

export class PurchaseCreditPackageDto {
    @ApiProperty({
        enum: CreditPackage,
        description: 'Tipo de paquete de créditos a comprar',
        example: CreditPackage.MEDIUM,
        examples: {
            small: {
                value: CreditPackage.SMALL,
                description: '20 créditos por $34,900'
            },
            medium: {
                value: CreditPackage.MEDIUM,
                description: '50 créditos por $69,900'
            },
            large: {
                value: CreditPackage.LARGE,
                description: '120 créditos por $99,900'
            }
        }
    })
    @IsNotEmpty({ message: 'El tipo de paquete es obligatorio' })
    @IsEnum(CreditPackage, { message: 'Tipo de paquete inválido. Use: SMALL, MEDIUM o LARGE' })
    package: CreditPackage;
}
