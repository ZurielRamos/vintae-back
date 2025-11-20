import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private storage: Storage;
  private bucketName: string;

  constructor() {
    this.bucketName = process.env.FIREBASE_STORAGE_BUCKET || '';
    
    if (!this.bucketName || this.bucketName === '') {
      throw new InternalServerErrorException(
        'La variable de entorno FIREBASE_STORAGE_BUCKET no está definida.',
      );
    }
    
    // Inicializa el cliente. Carga automáticamente GOOGLE_APPLICATION_CREDENTIALS.
    this.storage = new Storage(); 
  }

  // =================================================================
  // 1. GENERAR URL DE SUBIDA FIRMADA (acción 'write')
  // =================================================================
  async generateV4UploadSignedUrl(
    fileName: string,
    contentType: string,
    expirationMinutes: number,
  ): Promise<string> {
    const file = this.storage.bucket(this.bucketName).file(fileName);
    const expires = Date.now() + expirationMinutes * 60 * 1000;

    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'write', // Permite la subida (PUT)
      expires,
      contentType: contentType, 
    });

    return url;
  }

  // =================================================================
  // 2. GENERAR URL DE DESCARGA FIRMADA (acción 'read')
  // =================================================================
  async generateV4DownloadSignedUrl(
    filePath: string,
    expirationMinutes: number,
  ): Promise<string> {
    const file = this.storage.bucket(this.bucketName!).file(filePath);
    const expires = Date.now() + expirationMinutes * 60 * 1000;

    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read', // Permite la descarga (GET)
      expires,
    });

    return url;
  }
  
  // =================================================================
  // 3. GESTIONAR PERMISOS (ACL)
  // =================================================================
  async setFileAccess(filePath: string, accessType: 'public' | 'private'): Promise<void> {
    const file = this.storage.bucket(this.bucketName!).file(filePath);

    if (accessType === 'public') {
      // Otorgar permiso de lectura pública
      await file.acl.add({
        entity: 'allUsers',
        role: this.storage.acl.READER_ROLE,
      });
      this.logger.log(`ACL actualizada: ${filePath} ahora es público.`);
      
    } else {
      // Asegurarse de que el archivo es privado eliminando el permiso público
      try {
        await file.acl.delete({
          entity: 'allUsers',
        });
        this.logger.log(`ACL actualizada: ${filePath} es ahora privado.`);
      } catch (e) {
        // Puede fallar si ya era privado, lo cual se ignora
      }
    }
  }

  // =================================================================
  // 4. OBTENER URL PÚBLICA (Para archivos que ya se configuraron como públicos)
  // =================================================================
  getPublicUrl(filePath: string): string {
    return `https://storage.googleapis.com/${this.bucketName}/${filePath}`;
  }
}