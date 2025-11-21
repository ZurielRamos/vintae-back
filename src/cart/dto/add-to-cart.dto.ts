import { IsNotEmpty, IsNumber, IsInt, Min, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddToCartDto {
  @ApiProperty({ example: 15, description: 'ID numérico del producto' })
  @IsNotEmpty()
  @IsNumber()
  @IsInt()
  productId: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 'Rojo', description: 'Color seleccionado' })
  @IsNotEmpty({ message: 'El color es obligatorio' })
  @IsString()
  color: string;

  @ApiProperty({ example: 'M', description: 'Talla seleccionada' })
  @IsNotEmpty({ message: 'La talla es obligatoria' })
  @IsString()
  size: string;
}