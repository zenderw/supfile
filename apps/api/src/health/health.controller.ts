import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';

import { HealthService, HealthStatus } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  check(): HealthStatus {
    return this.health.check();
  }
}
