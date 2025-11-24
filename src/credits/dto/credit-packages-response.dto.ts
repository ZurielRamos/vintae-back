import { ApiProperty } from '@nestjs/swagger';

export class CreditPackageDto {
    @ApiProperty({
        example: 'MEDIUM',
        description: 'Tipo de paquete',
        enum: ['SMALL', 'MEDIUM', 'LARGE']
    })
    type: 'SMALL' | 'MEDIUM' | 'LARGE';

    @ApiProperty({
        example: 'Paquete Estándar',
        description: 'Nombre del paquete'
    })
    name: string;

    @ApiProperty({
        example: 50,
        description: 'Cantidad de créditos base incluidos en el paquete'
    })
    credits: number;

    @ApiProperty({
        example: 17.99,
        description: 'Precio del paquete en dólares USD'
    })
    price: number;

    @ApiProperty({
        example: 5,
        description: 'Créditos bonus adicionales'
    })
    bonus_credits: number;

    @ApiProperty({
        example: false,
        description: 'Indica si este paquete es destacado'
    })
    is_featured: boolean;

    @ApiProperty({
        example: '50 créditos de diseño + 5 bonus',
        description: 'Descripción del paquete'
    })
    description: string;
}

export class CreditPackagesResponseDto {
    @ApiProperty({
        type: [CreditPackageDto],
        description: 'Lista de paquetes de créditos disponibles'
    })
    packages: CreditPackageDto[];
}
