import path from 'node:path';

import { BadRequestException } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { memoryStorage } from 'multer';

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024 * 1024;
const BLOCKED_EXTENSIONS = ['.exe', '.bat', '.cmd', '.sh', '.ps1', '.msi', '.scr'];

export const multerConfig: MulterOptions = {
  storage: memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_SIZE },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (BLOCKED_EXTENSIONS.includes(ext)) {
      cb(
        new BadRequestException({
          code: 'EXTENSION_BLOCKED',
          message: `L'extension ${ext} n'est pas autorisée`,
        }),
        false,
      );
      return;
    }
    cb(null, true);
  },
};
