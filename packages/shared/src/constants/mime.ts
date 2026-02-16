import type { FileCategory } from '../types/file';

const CATEGORY_PREFIXES: Record<FileCategory, string[]> = {
  image: ['image/'],
  video: ['video/'],
  audio: ['audio/'],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats',
    'application/vnd.ms-',
    'text/',
  ],
  archive: ['application/zip', 'application/x-tar', 'application/x-rar'],
  other: [],
};

export function categorizeMimeType(mime: string): FileCategory {
  for (const [category, prefixes] of Object.entries(CATEGORY_PREFIXES) as [
    FileCategory,
    string[],
  ][]) {
    if (prefixes.some((p) => mime.startsWith(p))) {
      return category;
    }
  }
  return 'other';
}

export const BLOCKED_EXTENSIONS = ['.exe', '.bat', '.cmd', '.sh', '.ps1', '.msi', '.scr'];
