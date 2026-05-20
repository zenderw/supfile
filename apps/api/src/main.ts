import 'reflect-metadata';

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { EnvConfig } from './config/env.config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  app.use(
    helmet({
      contentSecurityPolicy: false,
      frameguard: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.useBodyParser('json', { limit: '5gb' });
  app.useBodyParser('urlencoded', { extended: true, limit: '5gb' });

  app.setGlobalPrefix('api/v1');

  const swaggerConfig = new DocumentBuilder()
    .setTitle('SUPFile API')
    .setDescription('API REST de la plateforme de stockage cloud SUPFile')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Inscription, connexion, OAuth Google')
    .addTag('folders', 'Arborescence de dossiers')
    .addTag('files', 'Upload, téléchargement, métadonnées')
    .addTag('share', 'Liens de partage publics')
    .addTag('search', 'Recherche fichiers et dossiers')
    .addTag('stats', 'Dashboard et quota')
    .addTag('trash', 'Corbeille')
    .addTag('plans', 'Plans freemium')
    .addTag('health', 'Healthcheck')
    .build();
  const swaggerDoc = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDoc, {
    swaggerOptions: { persistAuthorization: true },
  });

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
  logger.log(`Swagger UI dispo sur http://localhost:${port}/api/docs`);
}

bootstrap();
