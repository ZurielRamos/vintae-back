import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '../../common/enums/order-status.enum';

export class ChangeOrderStatusDto {
  @ApiProperty({ enum: OrderStatus, description: 'Nuevo estado del pedido' })
  @IsNotEmpty()
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiProperty({ required: false, description: 'Razón del cambio (Auditoría)' })
  @IsOptional()
  @IsString()
  reason?: string;
}