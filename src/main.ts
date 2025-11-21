import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
// 1. Importa SwaggerCustomOptions
import { DocumentBuilder, SwaggerModule, SwaggerCustomOptions } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'https://vintae.vercel.app', 'https://vesster.store', 'https://adm.vesster.store'], 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // --- CONFIGURACIÓN SWAGGER CDN ---
  const config = new DocumentBuilder()
    .setTitle('Design API')
    .setDescription('API para gestionar productos y diseños.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
    
  const document = SwaggerModule.createDocument(app, config);

  // 2. Definimos las opciones para usar CDN externa (unpkg)
  const customOptions: SwaggerCustomOptions = {
    customCssUrl: 'https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css',
    customJs: [
      'https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js',
      'https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-standalone-preset.js',
    ],
    swaggerOptions: {
      persistAuthorization: true,
    },
  };

  // 3. Pasamos las opciones al setup
  SwaggerModule.setup('api/docs', app, document, customOptions);
  // ---------------------------------

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();