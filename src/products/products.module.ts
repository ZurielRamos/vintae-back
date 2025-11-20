import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { PriceGroupService } from './services/price-group.service';
import { PriceGroup } from './entities/price-group.entity';
import { PricesController } from './controllers/prices.controlles';
import { BaseProduct } from 'src/base-products/entities/base-products.entity';

@Module({
  controllers: [ProductsController, PricesController],
  providers: [ProductsService, PriceGroupService],
  imports: [TypeOrmModule.forFeature([Product, PriceGroup, BaseProduct])],
})
export class ProductsModule {}
