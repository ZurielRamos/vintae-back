import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import express from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';

const server: express.Express = express();
let cachedNestApp; // No necesita ser una Promise<Server>

async function bootstrap() {
  if(!cachedNestApp) {
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(server)
    );
    
    app.setGlobalPrefix('api/v1');
  
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
  
    app.enableCors({
      origin: [
        'http://localhost:5173',
        'http://localhost:3000'
      ], // Solo permite solicitudes desde tu frontend
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true, // Si usas cookies o tokens de autorización
    });
  
    const config = new DocumentBuilder()
      .setTitle('Design API') // Título de la documentación
      .setDescription('API para gestionar productos y diseños.') // Descripción
      .setVersion('1.0') // Versión de la API
      // Si planeas usar autenticación, añade esto:
      .addBearerAuth() 
      .build();
      
    // 3. Creación del documento
    const document = SwaggerModule.createDocument(app, config);
    
    // 4. Activación de la UI en la ruta /api/docs
    SwaggerModule.setup('api/docs', app, document);
  
    await app.init()
  
    // await app.listen(process.env.PORT ?? 3000, () => {
    //   console.log(`Server running on http://localhost:${process.env.PORT ?? 3000}`);
    // });
    cachedNestApp = app;
  }

  return cachedNestApp;
}

// ESTA LÍNEA ES CLAVE PARA VERCEl
const serverlessHandler = async (req, res) => {
  await bootstrap();
  // Llama al manejador de Express (que ahora es cachedNestApp)
  cachedNestApp(req, res); 
};

export default serverlessHandler;


//bootstrap();
