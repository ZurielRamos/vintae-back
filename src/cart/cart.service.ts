import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Product } from '../products/entities/product.entity';
import { AddToCartDto } from './dto/add-to-cart.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart) private cartRepo: Repository<Cart>,
    @InjectRepository(CartItem) private cartItemRepo: Repository<CartItem>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
  ) { }

  // --- OBTENER CARRITO (GET) ---
  async getCart(userId: string) {
    // 1. Buscamos carrito existente
    let cart = await this.cartRepo.findOne({
      where: { userId: userId },
      relations: ['items', 'items.product', 'items.product.baseProducts'],
      order: { items: { productId: 'ASC' } }
    });

    // 2. Si no existe, creamos uno vacío
    if (!cart) {
      const newCart = this.cartRepo.create({ userId: userId });
      cart = await this.cartRepo.save(newCart);
      cart.items = [];
    }

    // 3. Calcular totales y formatear respuesta
    const itemsFormatted = cart.items.map(item => {
      // Buscar la variante seleccionada en el BaseProduct
      const baseProduct = item.product.baseProduct;
      const selectedVariant = baseProduct?.variants?.find(v => v.id === item.variantId);
      const price = Number(selectedVariant?.price || 0);

      return {
        id: item.id, // ID del item en el carrito
        productId: item.productId,
        productName: item.product.name,
        selectedColor: item.selectedColor,
        selectedSize: item.selectedSize,
        variantId: item.variantId,
        variantLabel: selectedVariant?.label || 'N/A',
        price: price,
        quantity: item.quantity,
        total: price * item.quantity,
        image: item.product.imageUrls?.[0] || null
      };
    });

    const subtotal = itemsFormatted.reduce((sum, item) => sum + item.total, 0);

    return {
      id: cart.id,
      userId: cart.userId,
      items: itemsFormatted,
      subtotal: subtotal,
      totalItems: itemsFormatted.reduce((sum, item) => sum + item.quantity, 0)
    };
  }

  // --- AGREGAR AL CARRITO (ADD) ---
  async addToCart(userId: string, dto: AddToCartDto) {
    // 1. Validar Producto y BaseProduct
    const product = await this.productRepo.findOne({
      where: { id: dto.productId },
      relations: ['baseProduct']
    });

    if (!product) throw new NotFoundException('Producto no encontrado');
    if (!product.baseProduct) {
      throw new NotFoundException('Este producto no tiene un BaseProduct asociado');
    }

    // 2. Validar que la variante exista
    const baseProduct = product.baseProduct;
    const selectedVariant = baseProduct.variants?.find(v => v.id === dto.variantId);

    if (!selectedVariant) {
      throw new NotFoundException(`La variante ${dto.variantId} no existe para este producto`);
    }

    // 3. Validar que el color esté disponible en la variante
    if (!selectedVariant.colors?.includes(dto.color)) {
      throw new NotFoundException(
        `El color "${dto.color}" no está disponible para esta variante. Colores disponibles: ${selectedVariant.colors?.join(', ')}`
      );
    }

    // 4. Validar que la talla esté disponible en la variante
    const allSizes = selectedVariant.sizeGroups?.flatMap(sg => sg.sizes) || [];
    if (!allSizes.includes(dto.size)) {
      throw new NotFoundException(
        `La talla "${dto.size}" no está disponible para esta variante. Tallas disponibles: ${allSizes.join(', ')}`
      );
    }

    // 5. Obtener Carrito (asegurando que existe)
    const cartData = await this.getCart(userId);

    // 6. Buscar si ya existe este producto CON ESTE COLOR, TALLA Y VARIANTE
    const existingItem = await this.cartItemRepo.findOne({
      where: {
        cartId: cartData.id,
        productId: dto.productId,
        selectedColor: dto.color,
        selectedSize: dto.size,
        variantId: dto.variantId
      }
    });

    if (existingItem) {
      // Actualizar cantidad
      existingItem.quantity += dto.quantity;
      await this.cartItemRepo.save(existingItem);
    } else {
      // Crear nuevo item
      const newItem = this.cartItemRepo.create({
        cartId: cartData.id,
        productId: dto.productId,
        quantity: dto.quantity,
        selectedColor: dto.color,
        selectedSize: dto.size,
        variantId: dto.variantId
      });
      await this.cartItemRepo.save(newItem);
    }

    return this.getCart(userId);
  }

  // --- ELIMINAR ITEM ---
  async removeItem(userId: string, itemId: string) {
    const item = await this.cartItemRepo.findOne({
      where: { id: itemId },
      relations: ['cart']
    });

    if (!item || item.cart.userId !== userId) throw new NotFoundException('Item no encontrado');

    await this.cartItemRepo.remove(item);
    return this.getCart(userId);
  }

  // --- ACTUALIZAR CANTIDAD ---
  async updateQuantity(userId: string, itemId: string, quantity: number) {
    const item = await this.cartItemRepo.findOne({
      where: { id: itemId },
      relations: ['cart']
    });

    if (!item || item.cart.userId !== userId) throw new NotFoundException('Item no encontrado');

    item.quantity = quantity;
    await this.cartItemRepo.save(item);
    return this.getCart(userId);
  }

  // --- VACIAR CARRITO ---
  async clearCart(userId: string) {
    const cart = await this.cartRepo.findOne({ where: { userId } });
    if (cart) {
      await this.cartItemRepo.delete({ cartId: cart.id });
    }
    return { message: 'Carrito vaciado' };
  }

  // --- FUSIÓN (INVITADO -> USUARIO) ---
  async mergeCarts(guestUserId: string, targetUserId: string) {
    const guestCart = await this.cartRepo.findOne({
      where: { userId: guestUserId },
      relations: ['items']
    });

    if (!guestCart || guestCart.items.length === 0) return;

    // Aseguramos que el destino tenga carrito
    const targetCartRes = await this.getCart(targetUserId);

    for (const item of guestCart.items) {
      // Verificamos si existe esa combinación exacta en el destino
      const existing = await this.cartItemRepo.findOne({
        where: {
          cartId: targetCartRes.id,
          productId: item.productId,
          selectedColor: item.selectedColor,
          selectedSize: item.selectedSize,
          variantId: item.variantId
        }
      });

      if (existing) {
        existing.quantity += item.quantity;
        await this.cartItemRepo.save(existing);
        await this.cartItemRepo.delete(item.id);
      } else {
        // Movemos el item
        await this.cartItemRepo.update(item.id, { cartId: targetCartRes.id });
      }
    }

    await this.cartRepo.delete(guestCart.id);
  }




}