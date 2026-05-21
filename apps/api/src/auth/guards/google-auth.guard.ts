import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext): Record<string, unknown> | undefined {
    const req = context.switchToHttp().getRequest<Request>();
    const host = req.headers.host;
    if (!host) return undefined;
    const proto = (req.headers['x-forwarded-proto'] as string) ?? req.protocol ?? 'http';
    const callbackURL = `${proto}://${host}/api/v1/auth/google/callback`;

    // returnUrl mobile propagé via le state OAuth (encodé base64 pour passer les caractères spéciaux)
    const returnUrl = typeof req.query.returnUrl === 'string' ? req.query.returnUrl : undefined;
    const state = returnUrl ? Buffer.from(returnUrl).toString('base64url') : undefined;

    return { callbackURL, state };
  }
}
