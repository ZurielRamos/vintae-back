import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ResendVerificationDto {
    @ApiProperty({
        example: 'user@example.com',
        description: 'Email del usuario para reenviar código de verificación'
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;
}
