import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/services/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
import { Role } from 'src/common/enums/role.enum';
import { MailService } from 'src/mail/mail.service';
import { CreditsService } from 'src/credits/credits.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
    private creditsService: CreditsService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) { }

  async register(registerDto: RegisterDto, guestUserId?: string) {
    const user = await this.usersService.findOneByEmail(registerDto.email);
    if (user) {
      throw new ConflictException('El email ya está registrado');
    }

    // Generar código de verificación
    const verificationCode = this.generateVerificationCode();
    const verificationCodeExpiry = new Date();
    verificationCodeExpiry.setHours(verificationCodeExpiry.getHours() + 24); // 24 horas

    // Crear usuario con verificación pendiente
    const newUser = await this.usersService.create({
      ...registerDto,
      emailVerified: false,
      verificationCode,
      verificationCodeExpiry,
    });

    // Fusionar invitado si existe
    if (guestUserId) {
      await this.usersService.mergeGuestIntoUser(guestUserId, newUser.id);
    }

    // Enviar emails de bienvenida y verificación
    try {
      await this.mailService.sendWelcomeEmail(newUser.email, newUser.name);
      await this.mailService.sendAccountVerificationEmail(
        newUser.email,
        newUser.name,
        verificationCode
      );
    } catch (error) {
      console.error('Error enviando emails:', error);
      // No fallar el registro si falla el email
    }

    return {
      message: 'Registro exitoso. Por favor revisa tu email para verificar tu cuenta.',
      email: newUser.email,
    };
  }

  /**
   * Verificar email con código
   */
  async verifyEmail(code: string) {
    // Buscar usuario por código (incluir campos select: false)
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.verificationCode')
      .addSelect('user.verificationCodeExpiry')
      .where('user.verificationCode = :code', { code })
      .getOne();

    if (!user) {
      throw new BadRequestException('Código de verificación inválido');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Esta cuenta ya ha sido verificada');
    }

    // Verificar expiración
    if (!user.verificationCodeExpiry || new Date() > user.verificationCodeExpiry) {
      throw new BadRequestException('El código de verificación ha expirado. Solicita uno nuevo.');
    }

    // Marcar como verificado
    user.emailVerified = true;
    user.emailVerifiedAt = new Date();
    user.verificationCode = null;
    user.verificationCodeExpiry = null;
    await this.userRepository.save(user);

    // Recargar 5000 créditos como recompensa
    await this.creditsService.rechargeCredits(
      user.id,
      5000,
      'VERIFICACION_EMAIL'
    );

    // Actualizar créditos en el objeto user
    user.credits += 5000;

    // Enviar email de confirmación
    try {
      await this.mailService.sendAccountConfirmedEmail(user.email, user.name);
    } catch (error) {
      console.error('Error enviando email de confirmación:', error);
    }

    // Generar JWT
    const payload = { sub: user.id, email: user.email, role: user.role };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
        credits: user.credits,
        emailVerified: user.emailVerified,
      },
      message: '¡Cuenta verificada! Has recibido 5000 créditos de bienvenida.',
    };
  }

  /**
   * Reenviar email de verificación
   */
  async resendVerificationEmail(email: string) {
    const user = await this.usersService.findOneByEmail(email);

    if (!user) {
      throw new BadRequestException('Email no encontrado');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Esta cuenta ya está verificada');
    }

    // Generar nuevo código
    const verificationCode = this.generateVerificationCode();
    const verificationCodeExpiry = new Date();
    verificationCodeExpiry.setHours(verificationCodeExpiry.getHours() + 24);

    // Actualizar usuario
    await this.userRepository.update(user.id, {
      verificationCode,
      verificationCodeExpiry,
    });

    // Reenviar email
    try {
      await this.mailService.sendAccountVerificationEmail(
        user.email,
        user.name,
        verificationCode
      );
    } catch (error) {
      console.error('Error reenviando email:', error);
      throw new BadRequestException('No se pudo enviar el email. Intenta más tarde.');
    }

    return {
      message: 'Código de verificación reenviado. Revisa tu email.',
    };
  }

  /**
   * Generar código de verificación aleatorio
   */
  private generateVerificationCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  async login(loginDto: LoginDto, guestUserId?: string) {
    const { email, password } = loginDto;
    const user = await this.usersService.findOneByEmail(email);

    if (!user || !(await user.validatePassword(password))) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    if (guestUserId && guestUserId !== user.id) {
      await this.usersService.mergeGuestIntoUser(guestUserId, user.id);
    }

    // Generar Token
    const payload = { sub: user.id, email: user.email, role: user.role };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
        credits: user.credits
      }
    };
  }

  async sendOtp(phoneNumber: string) {
    const apiKey = this.configService.get('FIREBASE_API_KEY');
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode?key=${apiKey}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phoneNumber,
          recaptchaToken: null, // null funciona en entorno de pruebas/dev
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Error al conectar con Firebase');
      }

      const sessionInfo = data.sessionInfo;

      // Guardar sessionInfo en DB temporalmente
      let user = await this.usersService.findOneByPhone(phoneNumber);

      if (!user) {
        user = await this.usersService.createWithPhone(phoneNumber);
      }
      await this.usersService.updateOtpSession(user.id, sessionInfo);

      return { message: 'SMS enviado correctamente' };

    } catch (error) {
      console.error('Error enviando SMS:', error.message);
      // Manejar errores comunes de Firebase
      if (error.message.includes('TOO_MANY_ATTEMPTS')) {
        throw new BadRequestException('Demasiados intentos. Intenta más tarde.');
      }
      throw new BadRequestException('No se pudo enviar el SMS. Verifica el número.');
    }
  }

  // --- VERIFICAR OTP (Con lógica de Guest Merge) ---
  async verifyOtp(phoneNumber: string, code: string, guestUserId?: string) {
    console.log('Token: ', guestUserId)
    const apiKey = this.configService.get('FIREBASE_API_KEY');
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPhoneNumber?key=${apiKey}`;

    // 1. Recuperamos el usuario dueño del teléfono (creado previamente en sendOtp)
    const phoneUser = await this.usersService.findOneByPhone(phoneNumber);

    if (!phoneUser || !phoneUser.otpSessionInfo) {
      throw new BadRequestException('No hay solicitud OTP activa para este número');
    }

    try {
      // 2. Validar contra Google
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionInfo: phoneUser.otpSessionInfo,
          code: code,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Código inválido');
      }

      // 3. Limpiar sesión OTP del usuario del teléfono
      await this.usersService.updateOtpSession(phoneUser.id, null);

      // ==================================================================
      // 4. LÓGICA DE FUSIÓN (MERGE) DE INVITADO
      // ==================================================================
      // Si nos enviaron un ID de invitado y es diferente al usuario del teléfono
      if (guestUserId && guestUserId !== phoneUser.id) {
        console.log('entrando a guest')
        // Llamamos a un método especial en UsersService para mover datos y borrar al invitado
        await this.usersService.mergeGuestIntoUser(guestUserId, phoneUser.id);
      }
      // ==================================================================

      // 5. Generar JWT para el usuario REAL (phoneUser)
      // Nota: Si el merge funcionó, el phoneUser ahora tiene el carrito del invitado
      const payload = {
        sub: phoneUser.id,
        email: phoneUser.phoneNumber, // Usamos el teléfono como identificador principal en payload
        phoneNumber: phoneUser.phoneNumber,
        role: phoneUser.role,
        name: phoneUser.name // Asegúrate que tu entidad use 'fullName' o 'name' consistentemente
      };

      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: phoneUser.id,
          name: phoneUser.name,
          email: phoneUser.phoneNumber,
          phoneNumber: phoneUser.phoneNumber,
          role: phoneUser.role,
          credits: phoneUser.credits
        }
      };

    } catch (error) {
      console.error('Error verificando OTP:', error.message);
      if (error.message.includes('INVALID_CODE')) {
        throw new UnauthorizedException('El código ingresado es incorrecto');
      }
      if (error.message.includes('SESSION_EXPIRED')) {
        throw new UnauthorizedException('El código ha expirado, solicita uno nuevo');
      }
      throw new UnauthorizedException('Error verificando el código');
    }
  }



  // CREAR USUARIO INVITADO
  async createGuestSession() {
    // 1. Crear usuario vacío en la DB
    // Usamos un identificador temporal en el nombre para diferenciarlo
    const guestUser = await this.usersService.createGuestUser();

    // 2. Generar JWT inmediatamente
    const payload = {
      sub: guestUser.id,
      email: guestUser.phoneNumber,
      phoneNumber: guestUser.phoneNumber,
      role: guestUser.role,
      isGuest: true // Flag útil para el frontend
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: guestUser
    };
  }





  /**
   * 1. FUNCIÓN PURA DE VALIDACIÓN
   * Verifica el código con Firebase y devuelve al usuario si es correcto.
   * NO genera tokens ni fusiona carritos.
   */
  async validateOtp(phoneNumber: string, code: string) {
    const apiKey = this.configService.get('FIREBASE_API_KEY');
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPhoneNumber?key=${apiKey}`;

    // A. Recuperar usuario y sesión
    const user = await this.usersService.findOneByPhone(phoneNumber);

    if (!user || !user.otpSessionInfo) {
      throw new BadRequestException('No hay solicitud OTP activa para este número');
    }

    try {
      // B. Validar contra Google
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionInfo: user.otpSessionInfo,
          code: code,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Código inválido');
      }

      // C. Limpiar sesión OTP (Para que el código no se reuse)
      await this.usersService.updateOtpSession(user.id, null);

      // D. Retornar el usuario validado
      return user;

    } catch (error) {
      console.error('Error validando OTP:', error.message);
      if (error.message.includes('INVALID_CODE')) {
        throw new UnauthorizedException('El código ingresado es incorrecto');
      }
      if (error.message.includes('SESSION_EXPIRED')) {
        throw new UnauthorizedException('El código ha expirado, solicita uno nuevo');
      }
      throw new UnauthorizedException('Error verificando el código');
    }
  }

  /**
   * 2. FUNCIÓN DE LOGIN (FLUJO COMPLETO)
   * Usa validateOtp + Merge Guest + JWT
   */
  async loginWithOtp(phoneNumber: string, code: string, guestUserId?: string) {
    console.log('Guest Token ID:', guestUserId);

    // 1. Llamamos a la función de validación pura
    const phoneUser = await this.validateOtp(phoneNumber, code);

    // ==================================================================
    // 2. LÓGICA DE FUSIÓN (MERGE) DE INVITADO
    // ==================================================================
    if (guestUserId && guestUserId !== phoneUser.id) {
      console.log('Entrando a fusión de invitado...');
      await this.usersService.mergeGuestIntoUser(guestUserId, phoneUser.id);
    }
    // ==================================================================

    // 3. Generar Payload y Token
    const payload = {
      sub: phoneUser.id,
      email: phoneUser.phoneNumber, // Usamos el teléfono como identificador principal si no hay email
      phoneNumber: phoneUser.phoneNumber,
      role: phoneUser.role,
      name: phoneUser.name
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: phoneUser.id,
        name: phoneUser.name,
        email: phoneUser.email || phoneUser.phoneNumber, // Fallback si email es null
        phoneNumber: phoneUser.phoneNumber,
        role: phoneUser.role,
        credits: phoneUser.credits
      }
    };
  }

}