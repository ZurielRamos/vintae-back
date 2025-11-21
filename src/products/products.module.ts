import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { PriceGroupService } from './services/price-group.service';
import { PriceGroup } from './entities/price-group.entity';
import { PricesController } from './controllers/prices.controlles';
import { BaseProduct } from 'src/base-products/entities/base-products.entity';
import { DesignsController } from './controllers/designs.controller';
import { DesignsService } from './services/design.service';
import { DesignPurchase } from './entities/design-purchase.entity';
import { DesignDownload } from './entities/design-download.entity';
import { CreditsModule } from 'src/credits/credits.module';
import { StorageModule } from 'src/storage/storage.module';

@Module({
  controllers: [ProductsController, PricesController, DesignsController],
  providers: [ProductsService, PriceGroupService, DesignsService],
  imports: [
    TypeOrmModule.forFeature([Product, PriceGroup, BaseProduct, DesignPurchase, DesignDownload]),
    CreditsModule,
    StorageModule,
  ],

})
export class ProductsModule { }
