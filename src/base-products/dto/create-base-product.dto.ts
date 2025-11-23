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

class VariantDto {
  @ApiProperty({ example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', required: false, description: 'ID de la variante (generado automáticamente si no se provee)' })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty({ example: 'Talla M - Premium', description: 'Nombre de la variante' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ example: 35000, description: 'Precio de esta variante' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 'Camiseta talla M con acabado premium', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    type: [SpecificationDto],
    required: false,
    description: 'Especificaciones específicas de esta variante',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpecificationDto)
  specifications?: SpecificationDto[];

  @ApiProperty({
    example: ['Blanco', 'Negro', 'Azul'],
    description: 'Colores disponibles para esta variante',
  })
  @IsArray()
  @IsString({ each: true })
  colors: string[];

  @ApiProperty({
    type: [SizeGroupDto],
    description: 'Grupos de tallas para esta variante',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SizeGroupDto)
  sizeGroups: SizeGroupDto[];
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
    type: [SpecificationDto],
    required: false,
    description: 'Especificaciones técnicas generales del producto',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpecificationDto)
  specifications?: SpecificationDto[];

  @ApiProperty({
    example: [],
    required: false,
    description: 'URLs de las imágenes del producto',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  @ApiProperty({ example: 10000 })
  @IsNumber()
  @Min(0)
  cost: number;

  @ApiProperty({
    type: [VariantDto],
    description: 'Lista de variantes del producto (al menos 1 requerida)',
    example: [
      {
        label: 'Algodón Premium',
        price: 35000,
        description: 'Camiseta con acabado premium',
        colors: ['Blanco', 'Negro', 'Azul Marino'],
        sizeGroups: [
          { label: 'Adulto', sizes: ['S', 'M', 'L', 'XL'] },
          { label: 'Niño', sizes: ['6', '8', '10', '12'] }
        ],
        specifications: [{ key: 'Material', value: 'Algodón Pima' }]
      },
      {
        label: 'Algodón Estándar',
        price: 25000,
        description: 'Camiseta con acabado estándar',
        colors: ['Blanco', 'Negro', 'Gris'],
        sizeGroups: [
          { label: 'Adulto', sizes: ['S', 'M', 'L'] }
        ]
      }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantDto)
  @IsNotEmpty({ message: 'Debe incluir al menos 1 variante' })
  variants: VariantDto[];

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