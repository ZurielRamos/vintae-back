import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
    private readonly logger = new Logger(PaymentsService.name);

    constructor(private configService: ConfigService) { }

    /**
     * Genera la firma de integridad para el Widget/Checkout de Wompi.
     * Fórmula: SHA256(reference + amountInCents + currency + integritySecret)
     */
    generateSignature(reference: string, amountInCents: number, currency: string): string {
        const secret = this.configService.get<string>('WOMPI_INTEGRITY_SECRET');
        if (!secret) {
            throw new Error('WOMPI_INTEGRITY_SECRET no está configurado');
        }

        // Convertir explícitamente amountInCents a string
        const amountStr = String(amountInCents);

        // Concatenar SIN separadores: reference + amountInCents + currency + secret
        const chain = `${reference}${amountStr}${currency}${secret}`;

        // Generar SHA256 en hexadecimal (lowercase)
        const hash = crypto.createHash('sha256').update(chain).digest('hex');

        return hash;
    }

    /**
     * Verifica la firma de los eventos (Webhooks) de Wompi.
     * Wompi envía 'checksum' en el evento.
     * Fórmula: SHA256(transaction.id + transaction.status + transaction.amount_in_cents + eventsSecret)
     */
    verifyWebhookSignature(eventData: any): boolean {
        const secret = this.configService.get<string>('WOMPI_EVENTS_SECRET');
        if (!secret) {
            this.logger.error('WOMPI_EVENTS_SECRET no configurado');
            return false;
        }

        const { transaction, checksum } = eventData;
        if (!transaction || !checksum) return false;

        const chain = `${transaction.id}${transaction.status}${transaction.amount_in_cents}${secret}`;
        const hash = crypto.createHash('sha256').update(chain).digest('hex');

        return hash === checksum;
    }
}
