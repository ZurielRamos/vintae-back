import { Controller, Post, Body, Get, UseGuards, Request, HttpCode, BadRequestException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';
import { Role } from '../common/enums/role.enum';
import { ApiBearerAuth, ApiResponse, ApiBadRequestResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SendOtpDto, VerifyOtpDto } from './dto/phone-login.dto';
import { OptionalJwtAuthGuard } from './guards/optional-jwt-auth.guard';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';

@ApiTags('Auntenticación')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  @ApiOperation({
    summary: 'Registro con email y contraseña',
    description: 'Crea una cuenta nueva. Se enviará un código de verificación por email.'
  })
  @ApiResponse({ status: 201, description: 'Usuario registrado. Revisa tu email para verificar.' })
  @ApiBadRequestResponse({ description: 'Email ya registrado o datos inválidos.' })
  @ApiBearerAuth()
  @UseGuards(OptionalJwtAuthGuard)
  register(@Body() registerDto: RegisterDto, @Request() req) {
    const guestUserId = req.user?.id;
    return this.authService.register(registerDto, guestUserId);
  }

  @Post('verify-email')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Verificar email con código',
    description: 'Verifica tu cuenta usando el código de 6 caracteres enviado por email. Al verificar recibirás 5000 créditos de bienvenida.'
  })
  @ApiResponse({ status: 200, description: 'Cuenta verificada exitosamente. Retorna JWT y 5000 créditos.' })
  @ApiBadRequestResponse({ description: 'Código inválido, expirado o cuenta ya verificada.' })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyEmailDto.code);
  }

  @Post('resend-verification')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Reenviar código de verificación',
    description: 'Solicita un nuevo código de verificación si el anterior expiró.'
  })
  @ApiResponse({ status: 200, description: 'Código reenviado exitosamente.' })
  @ApiBadRequestResponse({ description: 'Email no encontrado o cuenta ya verificada.' })
  async resendVerification(@Body() resendDto: ResendVerificationDto) {
    return this.authService.resendVerificationEmail(resendDto.email);
  }

  @Post('guest')
  @ApiOperation({ summary: 'Crear sesión de invitado' })
  async createGuest() {
    return this.authService.createGuestSession();
  }

  @Post('login')
  @ApiBearerAuth()
  @UseGuards(OptionalJwtAuthGuard)
  login(@Body() loginDto: LoginDto, @Request() req) {

    const currentUser = req.user;

    if (currentUser && (currentUser.email || currentUser.phoneNumber)) {
      throw new BadRequestException('Ya tienes una sesión activa. Por favor cierra sesión antes de ingresar con otra cuenta.');
    }

    // Solo pasamos el ID si es un invitado (sin email, o explícitamente guest)
    // Asumiendo que tus invitados tienen email: null
    const guestUserId = (currentUser && !currentUser.email && !currentUser.phoneNumber) ? currentUser.id : null;
    return this.authService.login(loginDto, guestUserId);
  }

  // Endpoint de prueba: Solo para ADMIN
  @Get('admin-only')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  adminOnly(@Request() req) {
    return { message: 'Hola Admin!', user: req.user };
  }


  // Endpoint de prueba: Para cualquier usuario autenticado
  @Get('profile')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.CLIENT)
  @ApiBearerAuth()
  getProfile(@Request() req) {
    return req.user;
  }

  @Post('send-otp')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Enviar código SMS (Paso 1)',
    description: 'Envía un código de 6 dígitos al teléfono. Si el usuario no existe, se crea un registro temporal.'
  })
  @ApiResponse({ status: 200, description: 'SMS enviado correctamente.' })
  @ApiBadRequestResponse({ description: 'Número inválido o error con el proveedor SMS.' })
  async sendOtp(@Body() sendOtpDto: SendOtpDto) {
    return this.authService.sendOtp(sendOtpDto.phoneNumber);
  }

  @Post('login-otp') // Este es el endpoint de LOGIN
  @HttpCode(HttpStatus.OK)
  @UseGuards(OptionalJwtAuthGuard)
  async verifyOtpLogin(@Body() dto: VerifyOtpDto, @Request() req) {
    const guestUserId = req.user?.id;
    // Llamamos a la función completa de Login
    return this.authService.loginWithOtp(dto.phoneNumber, dto.code, guestUserId);
  }
}