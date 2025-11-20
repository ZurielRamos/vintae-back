import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaseProductsService } from './base-products.service';
import { BaseProductsController } from './base-products.controller';
import { BaseProduct } from './entities/base-products.entity';
import { ProductCategory } from 'src/categories/entities/product-category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BaseProduct, ProductCategory])],
  controllers: [BaseProductsController],
  providers: [BaseProductsService],
})
export class BaseProductsModule {}
