import { ApiProperty } from '@nestjs/swagger';

export class WompiPaymentDataDto {
    @ApiProperty({
        description: 'Referencia única del pago',
        example: 'CREDIT-50900a7f-7c12-4c41-8708-6fb0bb1c571a-1763764332137',
    })
    reference: string;

    @ApiProperty({
        description: 'Monto en centavos',
        example: 1000000,
    })
    amountInCents: number;

    @ApiProperty({
        description: 'Moneda (COP)',
        example: 'COP',
    })
    currency: string;

    @ApiProperty({
        description: 'Firma de integridad SHA256',
        example: '52a5ae50ad7900d3614dbf4797e3b6e06f94bca33bb3bfa6b63998300057d6b1',
    })
    signature: string;

    @ApiProperty({
        description: 'Llave pública de Wompi',
        example: 'pub_test_xxxxx',
        required: false,
    })
    publicKey?: string;
}
