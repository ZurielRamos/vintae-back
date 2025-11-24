import { Controller, Post, Body, Get, UseGuards, Request, HttpCode, HttpStatus, Param, NotFoundException } from '@nestjs/common';
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

// Importar DTOs
import { CreditTransactionResponseDto, BalanceResponseDto } from './dto/credit-transaction-response.dto';
import { RechargeCreditsDto } from './dto/rechaarge-credits.dto';
import { InitiateRechargeDto } from './dto/initiate-recharge.dto';
import { WompiPaymentDataDto } from '../payments/dto/wompi-payment-data.dto';
import { CreditPackagesResponseDto, CreditPackageDto } from './dto/credit-packages-response.dto';
import { PurchaseCreditPackageDto } from './dto/purchase-credit-package.dto';

@ApiTags('Billetera y Créditos')
@ApiBearerAuth()
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
  @ApiBody({ type: RechargeCreditsDto })
  @ApiResponse({
    status: 200,
    description: 'Recarga exitosa. Retorna el nuevo saldo y la transacción.',
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
    type: [CreditTransactionResponseDto]
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

  // --- PAQUETES DE CRÉDITOS DE DISEÑO ---
  @Get('packages')
  @ApiOperation({
    summary: 'Listar paquetes de créditos de diseño disponibles',
    description: 'Obtiene los 3 paquetes de créditos disponibles con sus precios y cantidades'
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de paquetes disponibles con precios',
    type: CreditPackagesResponseDto
  })
  getPackages(): CreditPackagesResponseDto {
    return {
      packages: [
        {
          type: 'SMALL',
          name: 'Paquete Básico',
          credits: 20,
          price: 8.99, // USD
          bonus_credits: 0,
          is_featured: false,
          description: '20 créditos de diseño'
        },
        {
          type: 'MEDIUM',
          name: 'Paquete Estándar',
          credits: 50,
          price: 17.99, // USD
          bonus_credits: 5,
          is_featured: true,
          description: '50 créditos de diseño + 5 bonus'
        },
        {
          type: 'LARGE',
          name: 'Paquete Premium',
          credits: 120,
          price: 25.99, // USD
          bonus_credits: 15,
          is_featured: false,
          description: '120 créditos de diseño + 15 bonus'
        }
      ]
    };
  }

  @Get('packages/:type')
  @ApiOperation({
    summary: 'Obtener detalles de un paquete específico',
    description: 'Obtiene la información de un paquete específico por su tipo (útil para checkout)'
  })
  @ApiResponse({
    status: 200,
    description: 'Detalles del paquete solicitado',
    type: CreditPackageDto
  })
  @ApiResponse({
    status: 404,
    description: 'Paquete no encontrado. Tipos válidos: SMALL, MEDIUM, LARGE'
  })
  getPackageByType(@Param('type') type: string): CreditPackageDto {
    const packages = {
      SMALL: {
        type: 'SMALL' as const,
        name: 'Paquete Básico',
        credits: 20,
        price: 8.99,
        bonus_credits: 0,
        is_featured: false,
        description: '20 créditos de diseño'
      },
      MEDIUM: {
        type: 'MEDIUM' as const,
        name: 'Paquete Estándar',
        credits: 50,
        price: 17.99,
        bonus_credits: 5,
        is_featured: true,
        description: '50 créditos de diseño + 5 bonus'
      },
      LARGE: {
        type: 'LARGE' as const,
        name: 'Paquete Premium',
        credits: 120,
        price: 25.99,
        bonus_credits: 15,
        is_featured: false,
        description: '120 créditos de diseño + 15 bonus'
      }
    };

    const packageData = packages[type.toUpperCase()];
    if (!packageData) {
      throw new NotFoundException(
        `Paquete "${type}" no encontrado. Tipos válidos: SMALL, MEDIUM, LARGE`
      );
    }

    return packageData;
  }

  @Post('packages/purchase')
  @Roles(Role.CLIENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Iniciar compra de paquete de créditos de diseño',
    description: 'Genera los datos de pago para Wompi. El paquete se acreditará automáticamente después del pago exitoso.'
  })
  @ApiBody({ type: PurchaseCreditPackageDto })
  @ApiResponse({
    status: 200,
    description: 'Datos para iniciar el pago con Wompi',
    type: WompiPaymentDataDto
  })
  @ApiResponse({
    status: 400,
    description: 'Paquete inválido. Opciones válidas: SMALL, MEDIUM, LARGE'
  })
  purchasePackage(@Request() req, @Body() dto: PurchaseCreditPackageDto): Promise<WompiPaymentDataDto> {
    return this.creditsService.purchaseDesignCreditPackage(req.user.id, dto.package);
  }
}