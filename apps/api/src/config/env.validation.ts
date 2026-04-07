import { plainToInstance } from 'class-transformer';
import { IsInt, IsString, MinLength, validateSync } from 'class-validator';

class EnvSchema {
  @IsInt()
  PORT!: number;

  @IsString()
  @MinLength(1)
  DATABASE_URL!: string;

  @IsString()
  @MinLength(32, {
    message: 'JWT_SECRET doit contenir au moins 32 caractères',
  })
  JWT_SECRET!: string;

  @IsInt()
  JWT_ACCESS_TTL!: number;

  @IsInt()
  JWT_REFRESH_TTL!: number;
}

export function validateEnv(raw: Record<string, unknown>): EnvSchema {
  const parsed = plainToInstance(EnvSchema, raw, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(parsed, {
    skipMissingProperties: false,
    forbidUnknownValues: false,
  });

  if (errors.length > 0) {
    const messages = errors
      .map((e) => Object.values(e.constraints ?? {}).join(', '))
      .join('\n  - ');
    throw new Error(`Configuration d'environnement invalide :\n  - ${messages}`);
  }

  return parsed;
}
