import { Controller, Post, Body, HttpCode, Get, Query } from '@nestjs/common';
import { StorageService } from './storage.service';
import { GetUploadUrlDto, GetDownloadUrlDto, FinalizeAccessDto } from './dto/storage.dto';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  // =================================================================
  // ENDPOINT 1: Generar URL de Subida Inicial (Paso 1/2 de Subida)
  // =================================================================
  // Cliente llama ANTES de la subida para obtener la URL temporal.
  @Post('upload-url')
  @HttpCode(200)
  async getSignedUploadUrl(@Body() body: GetUploadUrlDto) {
    const expirationTime = 15;
    // La ruta donde se almacenará el archivo
    const fileName = `${body.fileId}.${body.fileExtension}`;

    const uploadUrl = await this.storageService.generateV4UploadSignedUrl(
      fileName,
      body.contentType,
      expirationTime,
    );

    // Devolvemos la URL y la ruta para el paso de finalización
    return {
      uploadUrl,
      filePath: fileName,
      contentType: body.contentType,
    };
  }

  // =================================================================
  // ENDPOINT 2: Finalizar la Subida y Establecer Permisos (Paso 2/2 de Subida)
  // =================================================================
  // Cliente llama DESPUÉS de hacer PUT exitoso a la uploadUrl.
  @Post('finalize-access')
  @HttpCode(200)
  async finalizeUploadAccess(@Body() body: FinalizeAccessDto) {
    // 1. El backend establece el permiso de forma autorizada (public/private)
    await this.storageService.setFileAccess(body.filePath, body.accessType);

    // 2. Respuesta final
    if (body.accessType === 'public') {
        const publicUrl = this.storageService.getPublicUrl(body.filePath);
        return { message: 'Archivo subido y marcado como público.', publicUrl, filePath: body.filePath };
    } else {
        return { message: 'Archivo subido y mantenido como privado. Use URL firmada para descarga.', filePath: body.filePath };
    }
  }

  // =================================================================
  // ENDPOINT 3: Descarga Firmada (Para archivos privados)
  // =================================================================
  // Cliente llama para obtener acceso temporal a un archivo privado.
  @Post('download-signed-url')
  @HttpCode(200)
  async getSignedDownloadUrl(@Body() body: GetDownloadUrlDto) {
    const downloadUrl = await this.storageService.generateV4DownloadSignedUrl(
      body.filePath,
      body.expirationMinutes,
    );
    return { downloadUrl };
  }
}