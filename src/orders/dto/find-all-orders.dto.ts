import { IsEnum, IsInt, IsOptional, IsString, Min, IsDateString, IsUUID, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus, PaymentMethod } from '../../common/enums/order-status.enum';

export class FindAllOrdersDto {
  // --- PAGINACIÓN ---
  @ApiPropertyOptional({ default: 1, description: 'Número de página' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, description: 'Elementos por página' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  // --- FILTROS ---
  @ApiPropertyOptional({ description: 'Filtrar por ID numérico de la orden' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  orderId?: number;

  @ApiPropertyOptional({ enum: OrderStatus, description: 'Filtrar por estado' })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ enum: PaymentMethod, description: 'Filtrar por método de pago' })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ description: 'Filtrar por ID de usuario (UUID)' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  // --- RANGO DE FECHAS ---
  @ApiPropertyOptional({ description: 'Fecha inicio (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Fecha fin (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  // --- ORDENAMIENTO ---
  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'DESC', description: 'Orden de creación' })
  @IsOptional()
  @IsString()
  sort?: 'ASC' | 'DESC' = 'DESC';
}