import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { EnvConfig } from './config/env.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const env = app.get(EnvConfig);
  const port = env.PORT;

  await app.listen(port);
  console.log(`SUPFile API démarrée sur http://localhost:${port}`);
}

bootstrap();
