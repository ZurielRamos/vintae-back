import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { StorageModule } from './storage/storage.module';
import { ProductsModule } from './products/products.module';
import { BaseProductsModule } from './base-products/base-products.module';

import * as pg from 'pg';
import { CategoryModule } from './categories/categories.module';
import { AiModule } from './ai/ai.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CreditsModule } from './credits/credits.module';
import { CouponsModule } from './coupons/coupons.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { MailModule } from './mail/mail.module';
import { PaymentsModule } from './payments/payments.module';

// OID 1700 es para el tipo NUMERIC/DECIMAL.
pg.types.setTypeParser(1700, (value: string) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  return parseFloat(value);
});

@Module({
  imports: [
    // 1. Módulo de Configuración: Carga las variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // 2. Módulo TypeORM Asíncrono para Serverless (USANDO VARIABLES SEPARADAS)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {

        // --- LOG DE CONFIRMACIÓN (Opcional, pero útil) ---
        console.log(`[DB_CONFIG] Usando Host: ${configService.get<string>('DB_HOST')}`);
        console.log(`[DB_CONFIG] Usando Puerto: ${configService.get<number>('DB_PORT')}`);
        // --- FIN LOG ---

        return {
          namingStrategy: new SnakeNamingStrategy(),
          type: 'postgres',

          // 🛑 ¡ATENCIÓN! Usamos las variables separadas y NO la 'url' para asegurar el control.
          host: configService.get<string>('DB_HOST'),
          //port: configService.get<number>('DB_PORT'), // Puerto 6543 (pgbouncer)
          username: configService.get<string>('DB_USERNAME'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_DATABASE'),


          // Descubre entidades automáticamente
          entities: [__dirname + '/**/*.entity{.ts,.js}'],

          // ¡IMPORTANTE! Solo usar en desarrollo.
          synchronize: true,

          // Configuración SSL (Necesario para Neon/Supabase)
          ssl: configService.get<string>('DB_HOST')?.includes('neon.tech') ||
            configService.get<string>('DB_HOST')?.includes('supabase.com')
            ? { rejectUnauthorized: false }
            : false,

          // Estrategia Serverless: Pool de Conexiones
          extra: {
            max: 1,
            idleTimeoutMillis: 30000,
          },
        }
      },
      inject: [ConfigService],
    }),
    StorageModule,
    ProductsModule,
    BaseProductsModule,
    CategoryModule,
    AiModule,
    UsersModule,
    AuthModule,
    CreditsModule,
    CouponsModule,
    WishlistModule,
    CartModule,
    OrdersModule,
    MailModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }