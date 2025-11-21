import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Leer los roles requeridos desde el decorador @Roles()
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // REGLA GUEST / SIN SESIÓN:
    // Si no hay decorador @Roles, la ruta es pública. Dejamos pasar a todos.
    if (!requiredRoles) {
      return true;
    }

    // Obtenemos el usuario del request (inyectado por JwtStrategy o OptionalGuard)
    const { user } = context.switchToHttp().getRequest();

    // Si la ruta requiere roles (no es pública) pero no hay usuario logueado: BLOQUEAR
    if (!user) {
      return false;
    }

    // REGLA ADMIN:
    // Si el usuario es ADMIN, tiene permiso universal (entra a rutas de Admin y de Client)
    if (user.role === Role.ADMIN) {
      return true;
    }

    // REGLA CLIENT:
    // Si no es admin, verificamos si su rol coincide con lo requerido
    return requiredRoles.some((role) => user.role === role);
  }
}