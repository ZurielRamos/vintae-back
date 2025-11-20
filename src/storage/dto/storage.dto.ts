import { IsString, IsNotEmpty, IsMimeType, IsNumber, Min, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger'; // Importamos ApiProperty

// ----------------------------------------------------
// DTO para solicitar una URL de SUBIDA FIRMADA
// ----------------------------------------------------
export class GetUploadUrlDto {
  @ApiProperty({ 
    description: 'ID único del archivo. Usado para nombrar el archivo final en el bucket.',
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
  })
  @IsNotEmpty()
  @IsString()
  readonly fileId: string; 

  @ApiProperty({ 
    description: 'Extensión del archivo (sin punto).',
    example: 'jpeg',
  })
  @IsNotEmpty()
  @IsString()
  readonly fileExtension: string; 

  @ApiProperty({ 
    description: 'Tipo MIME del archivo. Debe coincidir con el header Content-Type usado en la subida.',
    example: 'image/jpeg',
  })
  @IsNotEmpty()
  @IsString()
  @IsMimeType()
  readonly contentType: string;
}

// ----------------------------------------------------
// DTO para FINALIZAR la subida y establecer permisos
// ----------------------------------------------------
export class FinalizeAccessDto {
  @ApiProperty({ 
    description: 'Ruta completa del archivo en el bucket (ej. uploads/uuid.jpg). Recibida del endpoint upload-url.',
    example: 'uploads/d290f1ee-6c54-4b01-90e6-d701748f0851.jpeg',
  })
  @IsNotEmpty()
  @IsString()
  readonly filePath: string;
  
  @ApiProperty({ 
    description: 'Tipo de acceso a establecer. Debe coincidir con el valor usado al solicitar la URL de subida.',
    enum: ['public', 'private'],
    example: 'public',
  })
  @IsIn(['public', 'private'])
  readonly accessType: 'public' | 'private';
}

// ----------------------------------------------------
// DTO para solicitar una URL de DESCARGA FIRMADA
// ----------------------------------------------------
export class GetDownloadUrlDto {
  @ApiProperty({ 
    description: 'Ruta del archivo privado en el bucket (ej. users/docs/reporte.pdf).',
    example: 'users/123/documents/reporte_confidencial.pdf',
  })
  @IsNotEmpty()
  @IsString()
  readonly filePath: string;

  @ApiProperty({ 
    description: 'Duración de la validez del enlace firmado, en minutos.',
    default: 60,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  readonly expirationMinutes: number = 60;
}