import { IsNotEmpty, IsNumber, IsString, IsUUID } from 'class-validator'; // O IsInt si tus productos son numéricos
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class ToggleWishlistDto {
@ApiProperty({ example: 15, description: 'ID numérico del producto' })
  @IsNotEmpty()
  @IsNumber()
  @IsInt() // Asegura que sea entero
  @Min(1)
  productId: number; // <--- DEBE SER NUMBER

}