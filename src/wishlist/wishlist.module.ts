import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WishlistService } from './wishlist.service';
import { WishlistController } from './wishlist.controller';
import { WishlistItem } from './entities/wishlist-item.entity';
import { Product } from '../products/entities/product.entity'; // Ajusta ruta

@Module({
  imports: [
    // Registramos WishlistItem y Product para poder usar sus repositorios
    TypeOrmModule.forFeature([WishlistItem, Product]), 
  ],
  controllers: [WishlistController],
  providers: [WishlistService],
  exports: [WishlistService], // Por si quieres fusionar favoritos al hacer login
})
export class WishlistModule {}