import { IsNotEmpty, IsString, IsEnum, IsOptional, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '../../common/enums/order-status.enum';

export class ShippingAddressDto {
  @ApiProperty({ example: 'Calle 123 #45-67' })
  @IsNotEmpty() @IsString() street: string;

  @ApiProperty({ example: 'Medellin' })
  @IsNotEmpty() @IsString() city: string;

  @ApiProperty({ example: 'Antioquia' })
  @IsNotEmpty() @IsString() state: string;

  @ApiProperty({ example: '050021' })
  @IsNotEmpty() @IsString() zip: string;

  @ApiProperty({ example: 'Colombia' })
  @IsNotEmpty() @IsString() country: string;

  @ApiProperty({ example: '+573001234567' })
  @IsNotEmpty() @IsString() phone: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString() notes?: string;
}

export class CreateOrderDto {
  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.WALLET })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ type: ShippingAddressDto })
  @IsObject()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @ApiProperty({ example: 'DESC10', required: false })
  @IsOptional()
  @IsString()
  couponCode?: string;
}