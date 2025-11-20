import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateBaseProductDto {

  @ApiProperty({ example: 'Base T-Shirt' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'Basic T-Shirt description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: ['S', 'M', 'L', 'XL', '2XL', '3XL'],
    required: false,
    description: 'Tamaños disponibles',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sizes?: string[];

  @ApiProperty({
    example: ['Blanco', 'Negro', 'Azul', 'Verde', 'Amarillo', 'Rojo'],
    required: false,
    description: 'Colores disponibles',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  colors?: string[];

  @ApiProperty({
    example: [],
    required: false,
    description: 'URLs de las imágenes del producto',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  @ApiProperty({ example: 30000 })
  @IsNumber()
  @Min(0)
  suggestedPrice: number;

  @ApiProperty({ example: 10000 })
  @IsNumber()
  @Min(0)
  cost: number;

  @ApiProperty({
    example: ['uuid-category-1', 'uuid-category-2'],
    required: false,
    description: 'IDs de categorías a asociar al producto base',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  categoryIds?: string[];

  @ApiProperty({
    example: 'uuid-category-1',
    required: false,
    description: 'ID de la categoría principal (debe estar incluida en categoryIds)',
  })
  @IsOptional()
  @IsUUID()
  primaryCategoryId?: string;
}