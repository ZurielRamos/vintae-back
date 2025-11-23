import { Controller, Post, Body, Get, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { CreditsService } from './credits.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody
} from '@nestjs/swagger';

// Importamos los DTOs que acabamos de crear
import { CreditTransactionResponseDto, BalanceResponseDto } from './dto/credit-transaction-response.dto';
import { RechargeCreditsDto } from './dto/rechaarge-credits.dto';
import { InitiateRechargeDto } from './dto/initiate-recharge.dto';
import { WompiPaymentDataDto } from '../payments/dto/wompi-payment-data.dto';

@ApiTags('Billetera y Créditos')
@ApiBearerAuth() // Indica que todos los endpoints requieren Token en Swagger
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('credits')
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) { }

  // --- RECARGAR SALDO ---
  @Post('recharge/init')
  @ApiOperation({ summary: 'Iniciar recarga con Wompi' })
  @ApiResponse({ type: WompiPaymentDataDto })
  initRecharge(@Request() req, @Body() dto: InitiateRechargeDto): Promise<WompiPaymentDataDto> {
    return this.creditsService.initiateRecharge(req.user.id, dto.amount, dto.creditType);
  }

  @Post('recharge')
  @Roles(Role.CLIENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Recargar saldo',
    description: 'Aumenta el saldo del usuario tras un pago exitoso.'
  })
  @ApiBody({ type: RechargeCreditsDto }) // Documenta el Body esperado
  @ApiResponse({
    status: 200,
    description: 'Recarga exitosa. Retorna el nuevo saldo y la transacción.',
    // Aquí podríamos crear un DTO específico para la respuesta de recarga si quisiéramos
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos o monto negativo.' })
  async recharge(@Request() req, @Body() dto: RechargeCreditsDto) {
    return this.creditsService.rechargeCredits(
      req.user.id,
      dto.amount,
      dto.creditType,
      dto.paymentReference
    );
  }

  // --- OBTENER HISTORIAL ---
  @Get('history')
  @Roles(Role.CLIENT)
  @ApiOperation({ summary: 'Ver historial de transacciones' })
  @ApiResponse({
    status: 200,
    description: 'Lista de movimientos de la cuenta.',
    type: [CreditTransactionResponseDto] // Indica que retorna un ARRAY de transacciones
  })
  async getHistory(@Request() req) {
    return this.creditsService.getHistory(req.user.id);
  }

  @Get('balance')
  @Roles(Role.CLIENT)
  @ApiOperation({
    summary: 'Consultar ambos saldos (Diseño y Compra)',
    description: 'Consulta la base de datos para obtener ambos balances de créditos.'
  })
  @ApiResponse({
    status: 200,
    description: 'Saldos actuales de diseño y compra.',
  })
  async getBalances(@Request() req) {
    return this.creditsService.getBalances(req.user.id);
  }
}