import { IsOptional, IsString, IsInt, Min, IsEnum, IsArray, IsNumber } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ProductQueryDto {
  // --- Paginación ---
  @ApiPropertyOptional({ description: 'Número de página', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Resultados por página', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  // --- Búsqueda y Ordenamiento ---
  @ApiPropertyOptional({ description: 'Texto para búsqueda semántica o simple' })
  @IsOptional()
  @IsString()
  searchText?: string;

  @ApiPropertyOptional({ description: 'Campo por el cual ordenar', default: 'name' })
  @IsOptional()
  @IsString()
  orderBy?: string = 'name';

  @ApiPropertyOptional({ description: 'Dirección del ordenamiento', enum: ['ASC', 'DESC'], default: 'ASC' })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  orderDirection?: 'ASC' | 'DESC' = 'ASC';

  // --- Filtros de Arrays (Strings) ---
  
  @ApiPropertyOptional({ description: 'Filtra por temas (ej: Música, Urbano)', isArray: true, type: String })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  })
  @IsString({ each: true })
  themes?: string[];

  @ApiPropertyOptional({ description: 'Filtra por estilos (ej: Streetwear, Vintage)', isArray: true, type: String })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  })
  @IsString({ each: true })
  styles?: string[];

  @ApiPropertyOptional({ description: 'Colores disponibles del producto', isArray: true, type: String })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  })
  @IsString({ each: true })
  availableColors?: string[];

  @ApiPropertyOptional({ description: 'Colores predominantes en el diseño', isArray: true, type: String })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  })
  @IsString({ each: true })
  designColors?: string[];

  @ApiPropertyOptional({ description: 'Tags generales', isArray: true, type: String })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  })
  @IsString({ each: true })
  tags?: string[];

  // --- Filtros Numéricos (IDs) ---

  @ApiPropertyOptional({ description: 'IDs de los productos base relacionados', isArray: true, type: Number })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return [];
    // Manejamos si viene como string único "1" o array ["1", "2"] y convertimos a números
    const values = Array.isArray(value) ? value : [value];
    return values.map((v) => Number(v));
  })
  @IsInt({ each: true })
  baseProducts?: number[];
}