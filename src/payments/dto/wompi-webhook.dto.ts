import { IsString, IsNotEmpty, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class WompiTransactionDto {
    @ApiProperty({ example: 'TRANS-123' })
    @IsString()
    @IsNotEmpty()
    id: string;

    @ApiProperty({ example: 'CREDIT-xxx-xxx' })
    @IsString()
    @IsNotEmpty()
    reference: string;

    @ApiProperty({ example: 'APPROVED' })
    @IsString()
    @IsNotEmpty()
    status: string;

    @ApiProperty({ example: 1000000 })
    amount_in_cents: number;

    @ApiProperty({ example: 'COP' })
    currency?: string;
}

class WompiEventDataDto {
    @ApiProperty({ type: WompiTransactionDto })
    @ValidateNested()
    @Type(() => WompiTransactionDto)
    transaction: WompiTransactionDto;

    @ApiProperty({ required: false })
    checksum?: string;
}

export class WompiWebhookDto {
    @ApiProperty({
        description: 'Tipo de evento',
        example: 'transaction.updated',
    })
    @IsString()
    @IsNotEmpty()
    event: string;

    @ApiProperty({ type: WompiEventDataDto })
    @IsObject()
    @ValidateNested()
    @Type(() => WompiEventDataDto)
    data: WompiEventDataDto;
}
