import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";


export class CreateProductDto {

  @ApiProperty({ example: 'Product Name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Product Description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: ['style1', 'style2'] })
  @IsArray()
  @IsString({ each: true })
  styles: string[];

  @ApiProperty({
    example: 'uuid-base-product-1',
    description: 'ID del BaseProduct asociado',
  })
  @IsUUID()
  @IsNotEmpty()
  baseProductId: string; // Un solo BaseProduct por Product

  @ApiProperty({ example: true, default: true })
  @IsBoolean()
  @IsOptional()
  isEditable?: boolean;

  @ApiProperty({ example: false, default: false })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

  @ApiProperty({ example: false, default: false })
  @IsBoolean()
  @IsOptional()
  isPremium?: boolean;

  @ApiProperty({ example: ['theme1', 'theme2'] })
  @IsArray()
  @IsString({ each: true })
  themes: string[];

  @ApiProperty({ example: ['tag1', 'tag2'] })
  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @ApiProperty({ example: ['Rojo', 'Azul'] })
  @IsArray()
  @IsString({ each: true })
  availableColors: string[];

  @ApiProperty({ example: ['#FF0000', '#0000FF'] })
  @IsArray()
  @IsString({ each: true })
  designColors: string[];

  @ApiProperty({ example: ['https://example.com/image1.png'] })
  @IsArray()
  @IsString({ each: true })
  imageUrls: string[];

  @ApiProperty({
    example: 'designs/my-design-file.ai',
    required: false,
    description: 'Archivo de diseño fuente (un solo archivo)'
  })
  @IsString()
  @IsOptional()
  files?: string; // Un solo archivo de diseño
}
