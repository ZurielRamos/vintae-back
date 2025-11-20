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

    // 2. Módulo TypeORM Asíncrono para Serverless
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        
        // --- INICIO DEBUGGING/FALLBACK ---
        const dbUrl = configService.get<string>('DATABASE_URL');
        console.log(`[DEBUG] NODE_ENV: ${process.env.NODE_ENV}`);
        if (dbUrl) {
           console.log(`[DEBUG] Usando DATABASE_URL (Fallback): DETECTADA`);
        } else {
           console.log(`[DEBUG] Usando variables separadas (Host, Port, User)`);
        }
        // --- FIN DEBUGGING/FALLBACK ---

        return {
            namingStrategy: new SnakeNamingStrategy(),
            type: 'postgres',

            // ⚠️ Estrategia Principal: Usar variables separadas (ideal para pgbouncer)
            // Si DATABASE_URL está definida, se usará esa URL completa.
            // Si no, se usan las variables separadas (más control sobre el puerto).
            url: dbUrl,
            host: dbUrl ? undefined : configService.get<string>('DB_HOST'),
            port: dbUrl ? undefined : configService.get<number>('DB_PORT'), // Usar 6543 para pgbouncer
            username: dbUrl ? undefined : configService.get<string>('DB_USERNAME'),
            password: dbUrl ? undefined : configService.get<string>('DB_PASSWORD'),
            database: dbUrl ? undefined : configService.get<string>('DB_DATABASE'),
            
            // Descubre entidades automáticamente
            entities: [__dirname + '/**/*.entity{.ts,.js}'], 
            
            // ¡IMPORTANTE! Solo usar en desarrollo. En producción, gestiona las migraciones.
            synchronize: true,

            // Configuración SSL: Necesario para la mayoría de los proveedores de DB en la nube
            ssl: 
              process.env.NODE_ENV === 'production'
                ? { rejectUnauthorized: false } // Para Vercel/Producción
                : false, // 👈 Deshabilitar SSL en desarrollo (local/Docker)
            
            // ⚠️ Estrategia Serverless: Usar el Pool de Conexiones
            extra: {
              // Limita las conexiones al mínimo para serverless
              max: 1, 
              // Cierra la conexión inactiva rápidamente
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}