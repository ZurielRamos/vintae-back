import { IsString, IsNotEmpty, IsObject, ValidateNested, IsOptional, IsNumber } from 'class-validator';
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
    @IsNumber()
    @IsNotEmpty()
    amount_in_cents: number;

    @ApiProperty({ example: 'COP', required: false })
    @IsString()
    @IsOptional()
    currency?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    origin?: any;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    created_at?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    billing_data?: any;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    finalized_at?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    redirect_url?: any;

    @ApiProperty({ required: false })
    @IsOptional()
    customer_data?: any;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    customer_email?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    payment_method?: any;

    @ApiProperty({ required: false })
    @IsOptional()
    status_message?: any;

    @ApiProperty({ required: false })
    @IsOptional()
    payment_link_id?: any;

    @ApiProperty({ required: false })
    @IsOptional()
    shipping_address?: any;

    @ApiProperty({ required: false })
    @IsOptional()
    payment_source_id?: any;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    payment_method_type?: string;
}

class WompiEventDataDto {
    @ApiProperty({ type: WompiTransactionDto })
    @ValidateNested()
    @Type(() => WompiTransactionDto)
    transaction: WompiTransactionDto;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
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

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    sent_at?: string;

    @ApiProperty({ required: false })
    @IsNumber()
    @IsOptional()
    timestamp?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    signature?: any;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    environment?: string;
}
