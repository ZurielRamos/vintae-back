import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Sobrescribimos el método que maneja qué hacer cuando la validación termina
  handleRequest(err, user, info, context) {
    // Si hay un error (token inválido) o no hay usuario (no enviaron token),
    // NO lanzamos excepción. Simplemente retornamos null.
    if (err || !user) {
      return null;
    }
    
    // Si el token es válido, retornamos el usuario decodificado
    return user;
  }
}