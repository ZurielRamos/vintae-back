import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class SizeGroupDto {
  @ApiProperty({ example: 'Adulto' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ example: ['S', 'M', 'L'] })
  @IsArray()
  @IsString({ each: true })
  sizes: string[];
}

class SpecificationDto {
  @ApiProperty({ example: 'Material' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ example: 'Algodón 100%' })
  @IsString()
  @IsNotEmpty()
  value: string;
}

export class CreateBaseProductDto {

  @ApiProperty({ example: 'Base T-Shirt' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'Basic T-Shirt description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'Camiseta Básica (Algodón)', description: 'Etiqueta para selectores en frontend' })
  @IsString()
  @IsOptional()
  productLabel?: string;

  @ApiProperty({
    example: ['S', 'M', 'L', 'XL', '2XL', '3XL'],
    required: false,
    description: 'Tamaños disponibles (Legacy)',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sizes?: string[];

  @ApiProperty({
    type: [SizeGroupDto],
    required: false,
    description: 'Grupos de tallas (ej: Adulto, Niño)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SizeGroupDto)
  sizeGroups?: SizeGroupDto[];

  @ApiProperty({
    type: [SpecificationDto],
    required: false,
    description: 'Especificaciones técnicas',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpecificationDto)
  specifications?: SpecificationDto[];

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