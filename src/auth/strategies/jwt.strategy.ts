import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/users/services/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET') || 'MI_SECRETO_SUPER_SEGURO',
    });
  }

  async validate(payload: any) {
    // payload es lo que guardamos dentro del token (id, role, email)
    const user = await this.usersService.findOneById(payload.sub);
    if (!user) throw new UnauthorizedException('Token inválido');
    
    // Lo que retornes aquí se inyecta en `request.user`
    return { 
        id: user.id, 
        name: user.name,
        email: user.email, 
        role: user.role 
    }; 
  }
}