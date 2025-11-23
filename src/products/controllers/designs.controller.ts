import { Controller, Post, Get, Param, UseGuards, Request, HttpCode, HttpStatus, ParseIntPipe, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { DesignsService } from '../services/design.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { PurchaseDesignDto } from '../dto/purchase-design.dto';

@ApiTags('Diseños Digitales')
@Controller('designs')
export class DesignsController {
    constructor(private readonly designsService: DesignsService) { }

    // COMPRAR
    @Post(':id/purchase')
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.CLIENT)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Comprar diseño con Créditos' })
    purchase(
        @Request() req,
        @Param('id', ParseIntPipe) productId: number,
        @Body() purchaseDto: PurchaseDesignDto
    ) {
        return this.designsService.purchaseDesign(req.user.id, productId, purchaseDto.purchaseType);
    }

    // DESCARGAR
    @Get(':id/download')
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.CLIENT)
    @ApiOperation({ summary: 'Obtener URL de descarga (Requiere compra previa)' })
    download(@Request() req, @Param('id', ParseIntPipe) productId: number) {
        return this.designsService.downloadDesign(req.user.id, productId, req);
    }

    // CHECK OWNERSHIP
    @Get(':id/check-access')
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.CLIENT)
    checkAccess(@Request() req, @Param('id', ParseIntPipe) productId: number) {
        return this.designsService.checkOwnership(req.user.id, productId);
    }

    // REGISTRAR SHARE (Público o Privado)
    @Post(':id/share')
    @ApiOperation({ summary: 'Registrar que se compartió el diseño' })
    share(@Param('id', ParseIntPipe) productId: number) {
        return this.designsService.registerShare(productId);
    }
}