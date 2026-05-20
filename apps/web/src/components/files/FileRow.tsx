import {
  Download,
  Eye,
  FileIcon,
  Folder,
  Link2,
  MoreVertical,
  Pencil,
  Trash2,
  Users,
} from 'lucide-react';

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
  sharedBadge?: string;
  readOnly?: boolean;
  onOpen?: () => void;
  onPreview?: () => void;
  onShare?: () => void;
  onShareWithUser?: () => void;
  onRename?: () => void;
  onDelete?: () => void;
  onDownload?: () => void;
}

export function FileRow({
  name,
  type,
  sizeLabel,
  sharedBadge,
  readOnly,
  onOpen,
  onPreview,
  onShare,
  onShareWithUser,
  onRename,
  onDelete,
  onDownload,
}: CommonProps) {
  const Icon = type === 'folder' ? Folder : FileIcon;
  const hasActions = onPreview || onDownload || onShare || onShareWithUser || onRename || onDelete;

  return (
    <div className="flex items-center justify-between p-3 hover:bg-muted/40 rounded-md group">
      <button type="button" onClick={onOpen} className="flex items-center gap-3 flex-1 text-left">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm font-medium">{name}</span>
        {sharedBadge && (
          <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {sharedBadge}
          </span>
        )}
      </button>
      {sizeLabel && <span className="text-xs text-muted-foreground mr-3">{sizeLabel}</span>}
      {hasActions && (
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
            {onShare && (
              <DropdownMenuItem onClick={onShare}>
                <Link2 className="h-4 w-4 mr-2" />
                Lien public
              </DropdownMenuItem>
            )}
            {onShareWithUser && (
              <DropdownMenuItem onClick={onShareWithUser}>
                <Users className="h-4 w-4 mr-2" />
                Partager avec un utilisateur
              </DropdownMenuItem>
            )}
            {!readOnly && onRename && (
              <DropdownMenuItem onClick={onRename}>
                <Pencil className="h-4 w-4 mr-2" />
                Renommer
              </DropdownMenuItem>
            )}
            {!readOnly && onDelete && (
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
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
