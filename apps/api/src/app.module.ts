import * as path from 'node:path';

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { BigIntSerializerInterceptor } from './common/interceptors/bigint-serializer.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { EnvConfig } from './config/env.config';
import { validateEnv } from './config/env.validation';
import { FilesModule } from './files/files.module';
import { FoldersModule } from './folders/folders.module';
import { HealthModule } from './health/health.module';
import { PlansModule } from './plans/plans.module';
import { PrismaModule } from './prisma/prisma.module';
import { SearchModule } from './search/search.module';
import { ShareModule } from './share/share.module';
import { StatsModule } from './stats/stats.module';
import { StorageModule } from './storage/storage.module';
import { TrashModule } from './trash/trash.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      envFilePath: [
        path.resolve(process.cwd(), '.env'),
        path.resolve(__dirname, '../../../../.env'),
        path.resolve(__dirname, '../../../.env'),
      ],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 100,
      },
    ]),
    PrismaModule,
    StorageModule,
    HealthModule,
    AuthModule,
    FoldersModule,
    FilesModule,
    TrashModule,
    ShareModule,
    SearchModule,
    StatsModule,
    PlansModule,
  ],
  controllers: [AppController],
  providers: [
    EnvConfig,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
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
