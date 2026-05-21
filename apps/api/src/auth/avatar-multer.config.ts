import { BadRequestException } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { memoryStorage } from 'multer';

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const avatarMulterConfig: MulterOptions = {
  storage: memoryStorage(),
  limits: { fileSize: MAX_AVATAR_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      cb(
        new BadRequestException({
          code: 'INVALID_AVATAR_MIME',
          message: 'Format image invalide (JPG, PNG, WEBP, GIF uniquement)',
        }),
        false,
      );
      return;
    }
    cb(null, true);
  },
};
