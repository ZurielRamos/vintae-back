import { Controller, Post, Get, Body, Param, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ToggleWishlistDto } from './dto/toggle-wishlist.dto';

@ApiTags('Lista de Deseos (Favoritos)')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post('toggle')
  @Roles(Role.CLIENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Agregar o Quitar producto de favoritos' })
  @ApiResponse({ status: 200, description: 'Devuelve si fue agregado o eliminado' })
  toggle(@Request() req, @Body() dto: ToggleWishlistDto) {
    return this.wishlistService.toggleItem(req.user.id, dto.productId);
  }

  @Get()
  @Roles(Role.CLIENT)
  @ApiOperation({ summary: 'Obtener mi lista de deseos completa' })
  getMyWishlist(@Request() req) {
    return this.wishlistService.getMyWishlist(req.user.id);
  }

  @Get('check/:productId')
  @Roles(Role.CLIENT)
  @ApiOperation({ summary: 'Verificar si un producto específico es favorito' })
  checkStatus(@Request() req, @Param('productId') productId: number) {
    return this.wishlistService.checkProductStatus(req.user.id, productId);
  }
}