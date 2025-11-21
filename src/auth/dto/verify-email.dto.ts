import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyEmailDto {
    @ApiProperty({
        example: 'ABC123',
        description: 'Código de verificación de 6 caracteres'
    })
    @IsString()
    @IsNotEmpty()
    @Length(6, 6, { message: 'El código debe tener 6 caracteres' })
    code: string;
}
