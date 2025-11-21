import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CancelOrderDto {
  @ApiProperty({ example: 'Me equivoqué de producto', description: 'Razón de la cancelación' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  reason: string;
}