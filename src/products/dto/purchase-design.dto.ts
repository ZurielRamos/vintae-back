import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

export enum PurchaseType {
    ONE = 'ONE',
    FIVE = 'FIVE',
    UNLIMITED = 'UNLIMITED',
}

export class PurchaseDesignDto {
    @ApiProperty({ enum: PurchaseType, example: PurchaseType.ONE })
    @IsNotEmpty()
    @IsEnum(PurchaseType)
    purchaseType: PurchaseType;
}
