import { IsNotEmpty, IsNumber, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCartItemDto {
  @ApiProperty({ example: 3, description: 'Nueva cantidad total' })
  @IsNotEmpty()
  @IsNumber()
  @IsInt()
  @Min(1)
  quantity: number;
}