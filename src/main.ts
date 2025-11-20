import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ExpressAdapter } from '@nestjs/platform-express';
import serverlessExpress from '@vendia/serverless-express';
import express from 'express';

// IMPORTANTE: No importamos 'Handler' de express porque causa conflicto de tipos.
// Usaremos 'any' o la interfaz de AWS para evitar problemas de compilación.

let cachedServer: any; // Usamos 'any' para evitar conflictos de tipos estrictos que rompan el build

async function bootstrapServer() {
  // Si ya tenemos el servidor inicializado, lo devolvemos (Warm Start)
  if (cachedServer) {
    return cachedServer;
  }

  // 1. Instancia de Express
  const expressApp = express();
  const adapter = new ExpressAdapter(expressApp);

  // 2. Instancia de NestJS
  const app = await NestFactory.create(AppModule, adapter);

  // 3. Configuración Global
  app.setGlobalPrefix('api/v1');

  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 4. Configuración Swagger
  const config = new DocumentBuilder()
    .setTitle('Design API')
    .setDescription('API para gestionar productos y diseños.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // 5. Inicialización
  await app.init();

  // 6. Crear el Handler Serverless
  cachedServer = serverlessExpress({ app: expressApp });
  
  return cachedServer;
}

// 7. Exportación del Handler para Vercel
// Esta es la función que Vercel busca en "dist/main.js" -> "handler"
export const handler = async (event: any, context: any, callback: any) => {
  const server = await bootstrapServer();
  return server(event, context, callback);
};