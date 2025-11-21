import { Controller, Post, Get, Body, Param, UseGuards, Request, HttpCode, HttpStatus, Patch, Query, ParseIntPipe } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreateOrderDto } from './dto/create-order.dto';
import { FindAllOrdersDto } from './dto/find-all-orders.dto';
import { ChangeOrderStatusDto } from './dto/change-order-status.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';

@ApiTags('Pedidos (Checkout)')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles(Role.CLIENT)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear pedido (Checkout)' })
  @ApiResponse({ status: 201, description: 'Orden creada exitosamente.' })
  create(@Request() req, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(req.user.id, dto);
  }


  // --- ENDPOINT ADMIN: LISTAR TODO ---
  @Get('admin')
  @Roles(Role.ADMIN) // <--- SOLO ADMINS
  @ApiOperation({ summary: 'Listar órdenes con filtros y paginación (Admin Dashboard)' })
  findAllAdmin(@Query() dto: FindAllOrdersDto) {
    return this.ordersService.findAllAdmin(dto);
  }



  @Get()
  @Roles(Role.CLIENT)
  @ApiOperation({ summary: 'Ver mis pedidos' })
  findAll(@Request() req) {
    return this.ordersService.getMyOrders(req.user.id);
  }

  @Get(':id')
  @Roles(Role.CLIENT)
  @ApiOperation({ summary: 'Ver detalle de un pedido' })
  findOne(@Request() req, @Param('id') id: number) {
    return this.ordersService.getOrderById(id, req.user.id);
  }

  // --- APROBAR PAGO (GENÉRICO) ---
  @Patch(':id/approve-payment') // Cambié el nombre de la ruta para que sea más genérico
  @Roles(Role.ADMIN)
  @ApiOperation({ 
    summary: 'Aprobar pago manual (Transferencia o Contraentrega)',
    description: 'Marca la orden como PAGADA y registra qué administrador realizó la acción.'
  })
  @ApiResponse({ status: 200, description: 'Orden aprobada exitosamente' })
  approvePayment(@Param('id') id: number, @Request() req) {
    // Pasamos el ID del admin que está haciendo la petición
    return this.ordersService.approveOrderPayment(id, req.user.id);
  }



  // --- CAMBIAR ESTADO ---
  @Patch(':id/status')
  @Roles(Role.ADMIN) // Solo Admins
  @ApiOperation({ summary: 'Cambiar estado del pedido (Admin)' })
  changeStatus(
    @Param('id', ParseIntPipe) id: number, 
    @Body() dto: ChangeOrderStatusDto,
    @Request() req
  ) {
    return this.ordersService.changeStatus(id, dto, req.user.id);
  }

  // --- VER LOGS DE UNA ORDEN ---
  @Get(':id/history')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Ver historial de cambios de estado' })
  getHistory(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.getStatusHistory(id);
  }


  @Patch(':id/cancel')
  @Roles(Role.CLIENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Cancelar mi pedido', 
    description: 'Permite cancelar si el pedido no ha sido enviado. Si ya fue pagado, se reembolsa a la billetera.' 
  })
  @ApiResponse({ status: 200, description: 'Orden cancelada.' })
  cancelOrder(
    @Param('id', ParseIntPipe) id: number, 
    @Body() dto: CancelOrderDto,
    @Request() req
  ) {
    return this.ordersService.cancelMyOrder(id, req.user.id, dto);
  }

  
}