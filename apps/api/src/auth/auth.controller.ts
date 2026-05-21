import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { JwtPayload } from '@supfile/shared';
import type { Request, Response } from 'express';

import { EnvConfig } from '../config/env.config';

import { avatarMulterConfig } from './avatar-multer.config';
import { CurrentUser } from './decorators/current-user.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { GoogleMobileDto } from './dto/google-mobile.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './services/auth.service';
import type { GoogleProfileLite } from './strategies/google.strategy';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly env: EnvConfig,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: JwtPayload) {
    return this.auth.getCurrentUser(user.sub);
  }

  @Patch('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  updateMe(@CurrentUser() user: JwtPayload, @Body() dto: UpdateProfileDto) {
    return this.auth.updateProfile(user.sub, dto);
  }

  @Post('me/password')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePassword(@CurrentUser() user: JwtPayload, @Body() dto: ChangePasswordDto) {
    await this.auth.changePassword(user.sub, dto.oldPassword, dto.newPassword);
  }

  @Post('me/avatar')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', avatarMulterConfig))
  async uploadAvatar(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    if (!file) throw new BadRequestException('Aucun fichier dans le payload');
    const host = req.headers.host ?? 'localhost';
    const proto = (req.headers['x-forwarded-proto'] as string) ?? req.protocol ?? 'http';
    const publicBaseUrl = `${proto}://${host}/api/v1`;
    return this.auth.uploadAvatar(
      user.sub,
      { buffer: file.buffer, mimetype: file.mimetype },
      publicBaseUrl,
    );
  }

  @Get('avatars/:storagePath')
  async serveAvatar(@Param('storagePath') storagePath: string, @Res() res: Response) {
    try {
      const { stream, mimeType } = await this.auth.readAvatarStream(
        decodeURIComponent(storagePath),
      );
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      stream.pipe(res);
    } catch {
      res.status(HttpStatus.NOT_FOUND).send();
    }
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const profile = req.user as GoogleProfileLite;
    const result = await this.auth.loginOrCreateOAuth('google', profile);

    // Si returnUrl mobile dans le state, on redirige direct dessus (pas de page intermediaire)
    let mobileReturnUrl: string | undefined;
    const state = req.query.state;
    if (typeof state === 'string' && state.length > 0) {
      try {
        mobileReturnUrl = Buffer.from(state, 'base64url').toString('utf8');
      } catch {
        mobileReturnUrl = undefined;
      }
    }

    if (mobileReturnUrl) {
      const target = new URL(mobileReturnUrl);
      target.searchParams.set('accessToken', result.accessToken);
      target.searchParams.set('refreshToken', result.refreshToken);
      // Page de pont pour permettre au navigateur de fermer la session
      // et d'ouvrir l'app via Universal Link ou redirection auto
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(`<!doctype html><html><head><meta charset="utf-8"><title>SUPFile</title>
<meta http-equiv="refresh" content="0; url=${target.toString()}">
</head>
<body style="font-family:sans-serif;text-align:center;padding:40px">
  <h2>Connexion réussie</h2>
  <p>Retour vers l'application...</p>
  <p><a href="${target.toString()}">Ouvrir SUPFile</a></p>
  <script>setTimeout(function(){ window.location.href = ${JSON.stringify(target.toString())}; }, 50);</script>
</body></html>`);
      return;
    }

    // Flow web classique
    const redirectUrl = new URL(this.env.WEB_OAUTH_REDIRECT_URL);
    redirectUrl.searchParams.set('accessToken', result.accessToken);
    redirectUrl.searchParams.set('refreshToken', result.refreshToken);
    res.redirect(redirectUrl.toString());
  }

  @Post('google/mobile')
  @HttpCode(HttpStatus.OK)
  googleMobile(@Body() dto: GoogleMobileDto) {
    return this.auth.loginWithGoogleIdToken(dto.idToken);
  }
}
