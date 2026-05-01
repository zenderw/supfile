import { Download, Eye, FileIcon, Folder, MoreVertical, Pencil, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CommonProps {
  id: string;
  name: string;
  type: 'folder' | 'file';
  sizeLabel?: string;
  onOpen?: () => void;
  onPreview?: () => void;
  onRename: () => void;
  onDelete: () => void;
  onDownload?: () => void;
}

export function FileRow({
  name,
  type,
  sizeLabel,
  onOpen,
  onPreview,
  onRename,
  onDelete,
  onDownload,
}: CommonProps) {
  const Icon = type === 'folder' ? Folder : FileIcon;

  return (
    <div className="flex items-center justify-between p-3 hover:bg-muted/40 rounded-md group">
      <button type="button" onClick={onOpen} className="flex items-center gap-3 flex-1 text-left">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm font-medium">{name}</span>
      </button>
      {sizeLabel && <span className="text-xs text-muted-foreground mr-3">{sizeLabel}</span>}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {onPreview && (
            <DropdownMenuItem onClick={onPreview}>
              <Eye className="h-4 w-4 mr-2" />
              Aperçu
            </DropdownMenuItem>
          )}
          {onDownload && (
            <DropdownMenuItem onClick={onDownload}>
              <Download className="h-4 w-4 mr-2" />
              Télécharger
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={onRename}>
            <Pencil className="h-4 w-4 mr-2" />
            Renommer
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function formatBytes(bytesStr: string): string {
  const bytes = Number(bytesStr);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
