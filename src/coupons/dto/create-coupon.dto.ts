import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsDateString, Min, IsBoolean } from 'class-validator';
import { CouponType } from '../../common/enums/coupon-type.enum';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate } from 'class-validator';

export class CreateCouponDto {
  @ApiProperty({ example: 'SUMMER2024' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ enum: CouponType, example: CouponType.PERCENTAGE })
  @IsEnum(CouponType)
  type: CouponType;

  @ApiProperty({ example: 15.00, description: 'Porcentaje o monto fijo' })
  @IsNumber()
  @Min(0)
  value: number;

  @ApiProperty({ example: 50.00, required: false })
  @IsNumber()
  @IsOptional()
  minPurchase?: number;

  @ApiProperty({ example: '2025-12-31T23:59:59.000Z' })
  @Type(() => Date) // 1. Transforma el string del JSON a objeto Date JS
  @IsDate()         // 2. Valida que sea un objeto Date válido
  expirationDate: Date;

  @ApiProperty({ example: 1, description: 'Cuántas veces lo puede usar un usuario' })
  @IsNumber()
  @IsOptional()
  usageLimitPerUser?: number;

  @ApiProperty({ example: 1000, description: 'Límite global de canjes' })
  @IsNumber()
  @IsOptional()
  globalUsageLimit?: number;
}