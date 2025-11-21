import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { CartService } from './cart.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@ApiTags('Carrito de Compras')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @Roles(Role.CLIENT)
  @ApiOperation({ summary: 'Obtener mi carrito actual' })
  getCart(@Request() req) {
    return this.cartService.getCart(req.user.id);
  }

  @Post('add')
  @Roles(Role.CLIENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Agregar producto al carrito (Con Talla y Color)' })
  addToCart(@Request() req, @Body() dto: AddToCartDto) {
    return this.cartService.addToCart(req.user.id, dto);
  }

  @Patch('item/:id')
  @Roles(Role.CLIENT)
  @ApiOperation({ summary: 'Actualizar cantidad de un item' })
  updateItem(
    @Request() req, 
    @Param('id') itemId: string, 
    @Body() dto: UpdateCartItemDto
  ) {
    return this.cartService.updateQuantity(req.user.id, itemId, dto.quantity);
  }

  @Delete('item/:id')
  @Roles(Role.CLIENT)
  @ApiOperation({ summary: 'Eliminar un item del carrito' })
  removeItem(@Request() req, @Param('id') itemId: string) {
    return this.cartService.removeItem(req.user.id, itemId);
  }

  @Delete('clear')
  @Roles(Role.CLIENT)
  @ApiOperation({ summary: 'Vaciar todo el carrito' })
  clearCart(@Request() req) {
    return this.cartService.clearCart(req.user.id);
  }
}