import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { JwtPayload } from '@supfile/shared';
import type { Request } from 'express';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const req = ctx.switchToHttp().getRequest<Request & { user: JwtPayload }>();
    return req.user;
  },
);
