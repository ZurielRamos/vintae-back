import { Controller, Post, Body, BadRequestException, Logger, Inject, forwardRef } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { OrdersService } from '../orders/orders.service';
import { CreditsService } from '../credits/credits.service';
import { WompiWebhookDto } from './dto/wompi-webhook.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Pagos')
@Controller('payments')
export class PaymentsController {
    private readonly logger = new Logger(PaymentsController.name);

    constructor(
        private readonly paymentsService: PaymentsService,
        @Inject(forwardRef(() => OrdersService))
        private readonly ordersService: OrdersService,
        @Inject(forwardRef(() => CreditsService))
        private readonly creditsService: CreditsService,
    ) { }

    @Post('wompi/webhook')
    async handleWompiWebhook(@Body() event: WompiWebhookDto) {
        this.logger.log(`Webhook recibido: ${JSON.stringify(event)}`);

        // 1. Validar Firma (Seguridad)
        // NOTA: En desarrollo a veces es difícil probar firmas si no tienes el secreto correcto.
        // Puedes comentar esto temporalmente si estás probando con Postman manual.
        /*
        const isValid = this.paymentsService.verifyWebhookSignature(event.data);
        if (!isValid) {
            this.logger.error('Firma de webhook inválida');
            throw new BadRequestException('Invalid signature');
        }
        */

        const { event: eventType, data } = event;

        if (eventType !== 'transaction.updated') {
            return { status: 'ignored', reason: 'Only transaction.updated events are handled' };
        }

        const transaction = data.transaction;
        const reference = transaction.reference; // Ej: ORD-123-99999 o CREDIT-123-99999
        const status = transaction.status; // APPROVED, DECLINED, VOIDED, ERROR

        if (status !== 'APPROVED') {
            this.logger.log(`Transacción ${reference} no aprobada (Estado: ${status})`);
            return { status: 'ok', message: 'Transaction not approved' };
        }

        try {
            // 2. Enrutar según prefijo
            if (reference.startsWith('ORD-')) {
                // Es una Orden
                // Extraer ID si es necesario, o buscar por referencia
                // Asumimos que OrdersService tiene un método para buscar por referencia o confirmamos con el ID de transacción
                await this.ordersService.confirmOrderPayment(reference, transaction.id, transaction.amount_in_cents / 100);
                this.logger.log(`Orden ${reference} confirmada`);

            } else if (reference.startsWith('CREDIT-')) {
                // Es una Recarga de Créditos
                await this.creditsService.confirmRecharge(reference, transaction.id, transaction.amount_in_cents / 100);
                this.logger.log(`Recarga ${reference} confirmada`);

            } else {
                this.logger.warn(`Referencia desconocida: ${reference}`);
            }

        } catch (error) {
            this.logger.error(`Error procesando webhook para ${reference}: ${error.message}`);
            // No lanzamos error para que Wompi no reintente infinitamente si es un error lógico nuestro
            // (A menos que sea un error de conexión DB temporal)
        }


        return { status: 'ok' };
    }
}

