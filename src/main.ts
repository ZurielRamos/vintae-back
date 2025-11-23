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
    .setTitle('Sublipedia API')
    .setDescription('API para gestionar productos y diseños.')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auntenticación', 'Endpoints de autenticación y seguridad')
    .addTag('Categorias Productos', 'Endpoints de categorías de productos')
    .addTag('Productos Base', 'Endpoints de productos base')
    .addTag('Diseños de Producto', 'Endpoints de diseños de productos')
    .addTag('Cupones de Descuento y Recarga', 'Endpoints de cupones de descuento y recarga')
    .addTag('Billetera y Créditos', 'Endpoints para la gestión de billetera y créditos')
    .addTag('Diseños Digitales', 'Endpoints para la gestión de diseños digitales')
    .addTag('Lista de Deseos (Favoritos)', 'Endpoints para la gestión de lista de deseos')
    .addTag('Carrito de Compras', 'Endpoints para la gestión de carrito de compras')
    .addTag('Almacenamiento de archivos', 'Endpoints para la gestión de archivos')
    .addTag('Pedidos (Checkout)', 'Endpoints para la gestión de pedidos')
    .addTag('Pagos', 'Endpoints para la gestión de pagos')
    .addTag('AI', 'Endpoints para la gestión de IA')
    .addTag('Test', 'Endpoints para pruebas')
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
      docExpansion: 'none',
      defaultModelsExpandDepth: -1,
    },
  };

  // 3. Pasamos las opciones al setup
  SwaggerModule.setup('api/docs', app, document, customOptions);
  // ---------------------------------

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();