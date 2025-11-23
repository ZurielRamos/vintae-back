import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { MailService } from './mail/mail.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Test')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly mailService: MailService,
  ) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /**
   * Endpoint de prueba para el módulo de email
   * Uso: GET /test-email?to=tu-email@example.com
   */
  @Get('test-email')
  async testEmail(@Query('to') to?: string) {
    try {
      // Verificar conexión SMTP
      const isConnected = await this.mailService.verifyConnection();

      if (!isConnected) {
        return {
          success: false,
          error: 'No se pudo conectar al servidor SMTP. Verifica tu configuración en .env'
        };
      }

      // Email de destino (usa el query param o un email por defecto)
      const emailTo = to || 'test@example.com';

      // Enviar email de prueba
      await this.mailService.sendEmail({
        to: emailTo,
        subject: '✅ Test Email - Vesster',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #667eea;">¡Funciona! 🎉</h1>
            <p>El módulo de email está configurado correctamente.</p>
            <p><strong>Servidor SMTP:</strong> Conectado ✅</p>
            <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">Este es un email de prueba del sistema Vesster</p>
          </div>
        `,
        text: '¡Funciona! El módulo de email está configurado correctamente.',
      });

      return {
        success: true,
        message: `Email de prueba enviado exitosamente a ${emailTo}`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        hint: 'Verifica las variables SMTP en tu archivo .env'
      };
    }
  }

  /**
   * Endpoint para probar email de bienvenida
   * Uso: GET /test-welcome?email=tu-email@example.com&name=TuNombre
   */
  @Get('test-welcome')
  async testWelcomeEmail(
    @Query('email') email?: string,
    @Query('name') name?: string,
  ) {
    try {
      const emailTo = email || 'test@example.com';
      const userName = name || 'Usuario de Prueba';

      await this.mailService.sendWelcomeEmail(emailTo, userName);

      return {
        success: true,
        message: `Email de bienvenida enviado a ${emailTo}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Endpoint para probar email de verificación de cuenta
   * Uso: GET /test-verification?email=tu-email@example.com&name=TuNombre
   */
  @Get('test-verification')
  async testVerificationEmail(
    @Query('email') email?: string,
    @Query('name') name?: string,
  ) {
    try {
      const emailTo = email || 'test@example.com';
      const userName = name || 'Usuario de Prueba';
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();

      await this.mailService.sendAccountVerificationEmail(emailTo, userName, code);

      return {
        success: true,
        message: `Email de verificación enviado a ${emailTo}`,
        code
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Endpoint para probar email de cuenta confirmada
   * Uso: GET /test-confirmed?email=tu-email@example.com&name=TuNombre
   */
  @Get('test-confirmed')
  async testConfirmedEmail(
    @Query('email') email?: string,
    @Query('name') name?: string,
  ) {
    try {
      const emailTo = email || 'test@example.com';
      const userName = name || 'Usuario de Prueba';

      await this.mailService.sendAccountConfirmedEmail(emailTo, userName);

      return {
        success: true,
        message: `Email de cuenta confirmada enviado a ${emailTo}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Endpoint para probar email de confirmación de pago
   * Uso: GET /test-payment?email=tu-email@example.com&name=TuNombre
   */
  @Get('test-payment')
  async testPaymentEmail(
    @Query('email') email?: string,
    @Query('name') name?: string,
  ) {
    try {
      const emailTo = email || 'test@example.com';
      const userName = name || 'Usuario de Prueba';
      const orderId = 'ORD-' + Date.now();
      const amount = 149.99;
      const paymentMethod = 'Tarjeta de Crédito ****1234';

      await this.mailService.sendPaymentConfirmationEmail(
        emailTo,
        userName,
        orderId,
        amount,
        paymentMethod
      );

      return {
        success: true,
        message: `Email de confirmación de pago enviado a ${emailTo}`,
        orderId
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Endpoint para probar email de confirmación de entrega
   * Uso: GET /test-delivery?email=tu-email@example.com&name=TuNombre&tracking=ABC123
   */
  @Get('test-delivery')
  async testDeliveryEmail(
    @Query('email') email?: string,
    @Query('name') name?: string,
    @Query('tracking') tracking?: string,
  ) {
    try {
      const emailTo = email || 'test@example.com';
      const userName = name || 'Usuario de Prueba';
      const orderId = 'ORD-' + Date.now();
      const trackingNumber = tracking || 'TRK-' + Math.random().toString(36).substring(2, 12).toUpperCase();

      await this.mailService.sendDeliveryConfirmationEmail(
        emailTo,
        userName,
        orderId,
        trackingNumber
      );

      return {
        success: true,
        message: `Email de confirmación de entrega enviado a ${emailTo}`,
        orderId,
        trackingNumber
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}
