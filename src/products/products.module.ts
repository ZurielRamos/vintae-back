import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { BaseProduct } from 'src/base-products/entities/base-products.entity';
import { DesignsController } from './controllers/designs.controller';
import { DesignsService } from './services/design.service';
import { DesignPurchase } from './entities/design-purchase.entity';
import { DesignDownload } from './entities/design-download.entity';
import { CreditsModule } from 'src/credits/credits.module';
import { StorageModule } from 'src/storage/storage.module';

@Module({
  controllers: [ProductsController, DesignsController],
  providers: [ProductsService, DesignsService],
  imports: [
    TypeOrmModule.forFeature([Product, BaseProduct, DesignPurchase, DesignDownload]),
    CreditsModule,
    StorageModule,
  ],
  exports: [ProductsService],
})
export class ProductsModule { }
