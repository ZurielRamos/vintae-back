import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({ 
    example: '+573207104999', 
    description: 'Número de teléfono en formato internacional (E.164)' 
  })
  @IsNotEmpty({ message: 'El número de teléfono es obligatorio' })
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, { message: 'El formato debe ser E.164 (ej: +573207104999)' })
  phoneNumber: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: '+573207104999' })
  @IsNotEmpty({ message: 'El número de teléfono es obligatorio' })
  @IsString()
  phoneNumber: string;

  @ApiProperty({ example: '212121', description: 'Código de 6 dígitos recibido por SMS' })
  @IsNotEmpty({ message: 'El código OTP es obligatorio' })
  @IsString()
  code: string;
}