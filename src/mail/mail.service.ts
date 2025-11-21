import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { SendEmailDto } from './dto/send-email.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);
  private readonly templatesPath = path.join(__dirname, 'templates');

  constructor(private configService: ConfigService) {
    const smtpPort = this.configService.get<number>('SMTP_PORT') || 587;
    const smtpSecure = this.configService.get<string>('SMTP_SECURE') === 'true';

    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASSWORD'),
      },
      tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2',
      },
      requireTLS: !smtpSecure,
    });

    this.logger.log(`SMTP configurado: ${this.configService.get<string>('SMTP_HOST')}:${smtpPort} (secure: ${smtpSecure})`);
  }

  /**
   * Cargar plantilla HTML desde archivo
   */
  private loadTemplate(templateName: string): string {
    try {
      const templatePath = path.join(this.templatesPath, `${templateName}.html`);
      return fs.readFileSync(templatePath, 'utf-8');
    } catch (error) {
      this.logger.error(`Error cargando plantilla ${templateName}: ${error.message}`);
      throw new Error(`No se pudo cargar la plantilla: ${templateName}`);
    }
  }

  /**
   * Reemplazar variables en la plantilla
   */
  private renderTemplate(template: string, variables: Record<string, any>): string {
    let rendered = template;

    // Agregar variables globales
    const globalVars = {
      year: new Date().getFullYear(),
      frontendUrl: this.configService.get<string>('FRONTEND_URL') || 'https://vesster.com',
      ...variables,
    };

    // Reemplazar variables simples {{variable}}
    Object.keys(globalVars).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, globalVars[key] || '');
    });

    // Manejar condicionales simples {{#if variable}}...{{/if}}
    rendered = rendered.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (match, varName, content) => {
      return globalVars[varName] ? content : '';
    });

    return rendered;
  }

  /**
   * Método genérico para enviar emails
   */
  async sendEmail(dto: SendEmailDto): Promise<void> {
    try {
      const fromName = this.configService.get<string>('SMTP_FROM_NAME') || 'Vesster';
      const fromEmail = this.configService.get<string>('SMTP_FROM_EMAIL') || this.configService.get<string>('SMTP_USER');

      await this.transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: Array.isArray(dto.to) ? dto.to.join(', ') : dto.to,
        subject: dto.subject,
        text: dto.text,
        html: dto.html,
        attachments: dto.attachments,
      });

      this.logger.log(`Email enviado exitosamente a: ${dto.to}`);
    } catch (error) {
      this.logger.error(`Error enviando email: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Email de bienvenida para nuevos usuarios
   */
  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const template = this.loadTemplate('welcome');
    const html = this.renderTemplate(template, { name });

    await this.sendEmail({
      to: email,
      subject: '¡Bienvenido a Vesster! 🎉',
      html,
      text: `Hola ${name}, bienvenido a Vesster. Tu cuenta ha sido creada exitosamente.`,
    });
  }

  /**
   * Email de confirmación de cuenta (con código de verificación)
   */
  async sendAccountVerificationEmail(email: string, name: string, verificationCode: string): Promise<void> {
    const template = this.loadTemplate('account-verification');
    const html = this.renderTemplate(template, { name, verificationCode });

    await this.sendEmail({
      to: email,
      subject: '✉️ Confirma tu cuenta en Vesster',
      html,
      text: `Hola ${name}, confirma tu cuenta usando el código: ${verificationCode}. Expira en 24 horas.`,
    });
  }

  /**
   * Email de cuenta confirmada exitosamente
   */
  async sendAccountConfirmedEmail(email: string, name: string): Promise<void> {
    const template = this.loadTemplate('account-confirmed');
    const html = this.renderTemplate(template, { name });

    await this.sendEmail({
      to: email,
      subject: '🎊 ¡Tu cuenta ha sido verificada!',
      html,
      text: `¡Hola ${name}! Tu cuenta ha sido verificada exitosamente. Ya puedes acceder a todas las funciones de Vesster.`,
    });
  }

  /**
   * Email de recuperación de contraseña
   */
  async sendPasswordResetEmail(email: string, name: string, resetCode: string): Promise<void> {
    const template = this.loadTemplate('password-reset');
    const html = this.renderTemplate(template, { name, resetCode });

    await this.sendEmail({
      to: email,
      subject: 'Recuperación de Contraseña - Vesster',
      html,
      text: `Hola ${name}, tu código de recuperación es: ${resetCode}. Expira en 15 minutos.`,
    });
  }

  /**
   * Email de confirmación de compra de diseño
   */
  async sendDesignPurchaseConfirmation(
    email: string,
    userName: string,
    designName: string,
    purchaseId: string,
  ): Promise<void> {
    const template = this.loadTemplate('design-purchase');
    const html = this.renderTemplate(template, { userName, designName, purchaseId });

    await this.sendEmail({
      to: email,
      subject: `✅ Compra Exitosa: ${designName}`,
      html,
      text: `Hola ${userName}, tu compra de "${designName}" se completó exitosamente. ID: ${purchaseId}`,
    });
  }

  /**
   * Email de confirmación de pedido
   */
  async sendOrderConfirmation(
    email: string,
    userName: string,
    orderId: string,
    orderTotal: number,
  ): Promise<void> {
    const template = this.loadTemplate('order-confirmation');
    const html = this.renderTemplate(template, {
      userName,
      orderId,
      orderTotal: orderTotal.toFixed(2),
    });

    await this.sendEmail({
      to: email,
      subject: `Pedido Confirmado #${orderId}`,
      html,
      text: `Hola ${userName}, tu pedido #${orderId} por $${orderTotal.toFixed(2)} ha sido confirmado.`,
    });
  }

  /**
   * Email de confirmación de pago
   */
  async sendPaymentConfirmationEmail(
    email: string,
    userName: string,
    orderId: string,
    amount: number,
    paymentMethod: string,
  ): Promise<void> {
    const template = this.loadTemplate('payment-confirmation');
    const html = this.renderTemplate(template, {
      userName,
      orderId,
      amount: amount.toFixed(2),
      paymentMethod,
      paymentDate: new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    });

    await this.sendEmail({
      to: email,
      subject: `💳 Pago Confirmado - Pedido #${orderId}`,
      html,
      text: `Hola ${userName}, tu pago de $${amount.toFixed(2)} para el pedido #${orderId} ha sido confirmado. Método: ${paymentMethod}.`,
    });
  }

  /**
   * Email de confirmación de entrega
   */
  async sendDeliveryConfirmationEmail(
    email: string,
    userName: string,
    orderId: string,
    trackingNumber?: string,
  ): Promise<void> {
    const template = this.loadTemplate('delivery-confirmation');
    const html = this.renderTemplate(template, {
      userName,
      orderId,
      trackingNumber,
    });

    await this.sendEmail({
      to: email,
      subject: `🚚 Tu pedido #${orderId} está en camino`,
      html,
      text: `Hola ${userName}, tu pedido #${orderId} ha sido enviado${trackingNumber ? `. Número de rastreo: ${trackingNumber}` : ''}.`,
    });
  }

  /**
   * Verificar conexión SMTP
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log('Conexión SMTP verificada exitosamente');
      return true;
    } catch (error) {
      this.logger.error(`Error verificando conexión SMTP: ${error.message}`);
      return false;
    }
  }
}
