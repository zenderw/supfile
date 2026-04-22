import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { BigIntSerializerInterceptor } from './common/interceptors/bigint-serializer.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { EnvConfig } from './config/env.config';
import { validateEnv } from './config/env.validation';
import { FilesModule } from './files/files.module';
import { FoldersModule } from './folders/folders.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      envFilePath: ['.env'],
    }),
    PrismaModule,
    StorageModule,
    HealthModule,
    AuthModule,
    FoldersModule,
    FilesModule,
  ],
  controllers: [AppController],
  providers: [
    EnvConfig,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: BigIntSerializerInterceptor,
    },
  ],
})
export class AppModule {}
