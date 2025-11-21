import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Cart } from './cart.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('cart_items')
// REGLA DE UNICIDAD: Un item es único por Carrito + Producto + Color + Talla
@Unique(['cartId', 'productId', 'selectedColor', 'selectedSize']) 
export class CartItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // --- RELACIÓN CON CARRITO ---
  @ManyToOne(() => Cart, (cart) => cart.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cart_id' })
  cart: Cart;

  @Column({ name: 'cart_id', type: 'uuid' })
  cartId: string;

  // --- RELACIÓN CON PRODUCTO ---
  @ManyToOne(() => Product, { eager: true }) // Traer info del producto automáticamente
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'product_id', type: 'int' }) // INT porque tu Product usa ID numérico
  productId: number;

  // --- VARIACIONES ---
  @Column({ name: 'selected_color' })
  selectedColor: string;

  @Column({ name: 'selected_size' })
  selectedSize: string;

  @Column({ type: 'int', default: 1 })
  quantity: number;
}