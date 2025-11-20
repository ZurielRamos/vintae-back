import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { CategoryClosure } from './entities/category-clousure.entity';
import { ProductCategory } from './entities/product-category.entity';
import { CategoryService } from './categories.service';
import { CategoryController } from './categories.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Category, 
      CategoryClosure, 
      ProductCategory, 
    ]),
  ],
  controllers: [CategoryController],
  providers: [CategoryService],
  exports: [CategoryService, TypeOrmModule], // Exportamos para que otros módulos lo utilicen
})
export class CategoryModule {}