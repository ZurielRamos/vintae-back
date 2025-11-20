import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import express, { Handler } from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';
import serverlessExpress from '@vendia/serverless-express';

// Variable para cachear el HANDLER serverless (función lambda)
let serverlessCachedHandler: Handler;

async function bootstrapServer(): Promise<Handler> {
  // Solo inicializar si no está en caché (para Warm Start)
  if (serverlessCachedHandler) {
    return serverlessCachedHandler;
  }
  
  // 1. Crear la aplicación Express (backend subyacente)
  const expressApp: express.Express = express();
  const adapter = new ExpressAdapter(expressApp);
  
  // 2. Crear la aplicación NestJS
  const app = await NestFactory.create(
    AppModule,
    adapter,
  );
  
  // 3. Configuración de NestJS
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
    ], 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // 4. Configuración de Swagger (Documentación)
  const config = new DocumentBuilder()
    .setTitle('Design API')
    .setDescription('API para gestionar productos y diseños.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // 5. Inicializar la aplicación (Montar todos los módulos y controladores)
  await app.init();
  
  // 6. Convertir la aplicación Express subyacente en un handler compatible con Serverless
  // Este es el paso CRUCIAL para evitar el 'TypeError: cachedNestApp is not a function'.
  const handler = serverlessExpress({ app: expressApp });

  // 7. Guardar el handler serverless en caché y retornarlo
  serverlessCachedHandler = handler;
  return handler;
}

// ESTA ES LA FUNCIÓN QUE VERCEL/AWS LAMBDA LLAMARÁ
export const handler: Handler = async (event, context, callback) => {
  // Llama a la función bootstrapServer para obtener el handler cacheado
  const server = await bootstrapServer();
  
  // Ejecuta el handler cacheado (que es una función válida de serverless-express)
  return server(event, context, callback); 
};

// ⚠️ Nota: Hemos renombrado la exportación final a 'handler' 
// (en lugar de serverlessHandler) que es el estándar de AWS Lambda/Vercel.
// Asegúrate de que el handler en tu archivo de configuración de Vercel apunte a: 
// dist/main.handler (asumiendo que compilas a dist/main.js)