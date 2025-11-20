import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, IsUUID, MinLength } from "class-validator";


export class CreateProductDto {

    @ApiProperty({ example: 'Product Name' })
    @IsString()
    name: string;

    @ApiProperty({ example: 'Product Description' })
    @IsString()
    description: string;

    @ApiProperty({ example: ['style1', 'style2'] })
    @IsArray()
    @IsString({ each: true })
    styles: string[];

    @ApiProperty({
      example: ['uuid-base-product-1', 'uuid-base-product-2'],
      required: false,
      description: 'IDs de BaseProducts asociados al Product',
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    baseProductIds?: string[];

    @ApiProperty({ example: 100 })
    @IsNumber()
    @IsOptional()
    individualPrice: number;

    @ApiProperty({ example: true })
    @IsBoolean()
    @IsOptional()
    isEditable: boolean;

    @ApiProperty({ example: true })
    @IsBoolean()
    @IsOptional()
    isPublished: boolean;

    @ApiProperty({ example: true })
    @IsBoolean()
    @IsOptional()
    isPremium: boolean;

    @ApiProperty({ example: ['theme1', 'theme2'] })
    @IsArray()
    @IsString({ each: true })
    themes: string[];

    @ApiProperty({ example: ['tag1', 'tag2'] })
    @IsArray()
    @IsString({ each: true })
    tags: string[];

    @ApiProperty({ example: ['color1', 'color2'] })
    @IsArray()
    @IsString({ each: true })
    availableColors: string[];

    @ApiProperty({ example: ['size1', 'size2'] })
    @IsArray()
    @IsString({ each: true })
    availableSizes: string[];

    @ApiProperty({ example: ['color1', 'color2'] })
    @IsArray()
    @IsString({ each: true })
    designColors: string[];

    @ApiProperty({ example: ['url1', 'url2'] })
    @IsArray()
    @IsString({ each: true })
    imageUrls: string[];

    @ApiProperty({ example: ['url1', 'url2'] })
    @IsArray()
    @IsString({ each: true })
    fileUrls: string[];
}
