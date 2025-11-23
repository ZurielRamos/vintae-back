import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WishlistItem } from './entities/wishlist-item.entity';
import { Product } from '../products/entities/product.entity'; // Ajusta ruta

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(WishlistItem)
    private wishlistRepo: Repository<WishlistItem>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>, // Para validar que el producto existe
  ) { }

  // --- TOGGLE (AGREGAR / QUITAR) ---
  async toggleItem(userId: string, productId: number) {
    // 1. Verificar si el producto existe
    const product = await this.productRepo.findOneBy({ id: productId });
    if (!product) throw new NotFoundException('Producto no encontrado');

    // 2. Verificar si ya está en favoritos
    const existingItem = await this.wishlistRepo.findOne({
      where: { userId, productId },
    });

    if (existingItem) {
      await this.wishlistRepo.remove(existingItem);
      await this.productRepo.decrement({ id: productId }, 'saveCount', 1);
      return { action: 'removed', message: 'Eliminado de favoritos' };
    } else {
      // CREACIÓN CORRECTA
      const newItem = this.wishlistRepo.create({
        userId,
        productId,
      });
      await this.wishlistRepo.save(newItem);
      await this.productRepo.increment({ id: productId }, 'saveCount', 1);
      return { action: 'added', message: 'Agregado a favoritos' };
    }
  }

  // --- OBTENER MI LISTA ---
  async getMyWishlist(userId: string) {
    return this.wishlistRepo.find({
      where: { userId },
      relations: ['product', 'product.baseProduct'],
      select: {
        id: true,
        product: {
          id: true,
          name: true,
          imageUrls: true,
          baseProduct: {
            variants: true,
          }
        }
      },
      order: { addedAt: 'DESC' }, // Los más recientes primero
    });
  }

  // --- VERIFICAR ESTADO (Para pintar el corazón en el front) ---
  async checkProductStatus(userId: string, productId: number) {
    const count = await this.wishlistRepo.count({
      where: { userId, productId },
    });
    return { isFavorite: count > 0 };
  }


  async mergeWishlist(guestUserId: string, targetUserId: string) {
    // 1. Obtener favoritos del invitado
    const guestItems = await this.wishlistRepo.find({
      where: { userId: guestUserId },
      relations: ['product'],
    });

    for (const item of guestItems) {
      // 2. Verificar si el usuario destino YA tiene ese producto
      const exists = await this.wishlistRepo.findOne({
        where: { userId: targetUserId, productId: item.productId },
      });

      if (!exists) {
        // Si no lo tiene, le asignamos el item del invitado
        await this.wishlistRepo.update(item.id, { userId: targetUserId });
      } else {
        // Si ya lo tiene, borramos el duplicado del invitado
        await this.wishlistRepo.delete(item.id);
      }
    }

  }
}