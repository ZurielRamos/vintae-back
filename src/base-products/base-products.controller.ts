import { Controller, Post, Body, Patch, Param, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BaseProductsService } from './base-products.service';
import { CreateBaseProductDto } from './dto/create-base-product.dto';
import { UpdateBaseProductDto } from './dto/update-base-product.dto';
import { BaseProduct } from './entities/base-products.entity';

@ApiTags('Base Products')
@Controller('base-products')
export class BaseProductsController {
  constructor(private readonly baseProductsService: BaseProductsService) { }

  @Post()
  @ApiOperation({ summary: 'Crea un producto base y relaciona sus categorías.' })
  @ApiResponse({ status: 201, description: 'Producto base creado.', type: BaseProduct })
  create(@Body() dto: CreateBaseProductDto): Promise<BaseProduct> {
    return this.baseProductsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtiene todos los productos base.' })
  findAll() {
    return this.baseProductsService.findAll();
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualiza un producto base y sus categorías.' })
  @ApiResponse({ status: 200, description: 'Producto base actualizado.', type: BaseProduct })
  update(@Param('id') id: string, @Body() dto: UpdateBaseProductDto): Promise<BaseProduct> {
    return this.baseProductsService.update(id, dto);
  }

}
