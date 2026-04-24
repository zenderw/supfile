import 'reflect-metadata';

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module';
import { EnvConfig } from './config/env.config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  app.useBodyParser('json', { limit: '5gb' });
  app.useBodyParser('urlencoded', { extended: true, limit: '5gb' });

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const env = app.get(EnvConfig);
  const port = env.PORT;

  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`SUPFile API démarrée sur http://localhost:${port}/api/v1`);
}

bootstrap();
