import { IsString, IsNotEmpty, IsOptional, IsUUID, MinLength, IsBoolean } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';

// ----------------------------------------------------
// DTO 1: Creación de Categoría
// ----------------------------------------------------
export class CreateCategoryDto {

    @ApiProperty({
        example: 'Electronics',
        description: 'Nombre de la categoría',
        required: true,
    })
    @IsNotEmpty()
    @IsString()
    @MinLength(3)
    name: string; 

    @ApiProperty({
        example: 'electronics',
        description: 'Slug de la categoría',
        required: true,
    })
    @IsNotEmpty()
    @IsString()
    @MinLength(3)
    slug: string; 

    @ApiProperty({
        example: 'Description of the category',
        description: 'Descripción de la categoría',
        required: true,
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({
        example: '234589643345234582',
        description: 'Si la categoría es de nivel raíz, no se proporciona.',
        required: true,
    })
    @IsOptional()
    @IsUUID()
    // Si no se proporciona, la categoría es de nivel raíz.
    parentId?: string; 
}

// ----------------------------------------------------
// DTO 2: Actualización de Categoría
// ----------------------------------------------------
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}

// ----------------------------------------------------
// DTO 3: Vinculación de BaseProduct y Categoría
// ----------------------------------------------------
export class LinkBaseProductCategoryDto {

    @ApiProperty({
        example: 'true',
        description: 'ID del producto base',
        required: true,
    })
    @IsNotEmpty()
    @IsUUID()
    baseProductId: string; 

    @ApiProperty({
        example: '234589643345234582',
        description: 'ID de la categoría',
        required: true,
    })
    @IsNotEmpty()
    @IsUUID()
    categoryId: string;

    @ApiProperty({
        example: 'true',
        description: 'Si es la categoría principal del producto',
        required: true,
    })
    @IsOptional()
    @IsBoolean()
    isPrimary?: boolean;
}