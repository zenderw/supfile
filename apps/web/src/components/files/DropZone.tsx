import { UploadCloud } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { useUploadFile } from '@/hooks/use-folders';
import { cn } from '@/lib/utils';

interface Props {
  parentId: string | null;
  children: React.ReactNode;
  disabled?: boolean;
}

export function DropZone({ parentId, children, disabled }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState<{
    current: number;
    total: number;
    name: string;
  } | null>(null);
  const dragCounter = useRef(0);
  const upload = useUploadFile(parentId);

  // Empeche le navigateur d'ouvrir les fichiers droppes hors zone
  useEffect(() => {
    const prevent = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes('Files')) {
        e.preventDefault();
      }
    };
    window.addEventListener('dragover', prevent);
    window.addEventListener('drop', prevent);
    return () => {
      window.removeEventListener('dragover', prevent);
      window.removeEventListener('drop', prevent);
    };
  }, []);

  const handleDragEnter = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (disabled) return;
      if (!e.dataTransfer.types.includes('Files')) return;
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current += 1;
      setIsDragging(true);
    },
    [disabled],
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (disabled) return;
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current -= 1;
      if (dragCounter.current <= 0) {
        dragCounter.current = 0;
        setIsDragging(false);
      }
    },
    [disabled],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (disabled) return;
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'copy';
    },
    [disabled],
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      if (disabled) return;
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current = 0;
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files ?? []);
      if (files.length === 0) {
        toast.error('Aucun fichier détecté dans le drop');
        return;
      }

      let ok = 0;
      let failed = 0;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploading({ current: i + 1, total: files.length, name: file.name });
        try {
          await upload.mutateAsync({ file });
          ok++;
        } catch (err) {
          console.error('Upload failed for', file.name, err);
          failed++;
        }
      }
      setUploading(null);
      if (failed === 0) {
        toast.success(`${ok} fichier${ok > 1 ? 's' : ''} uploadé${ok > 1 ? 's' : ''}`);
      } else if (ok === 0) {
        toast.error(`Echec : ${failed} fichier${failed > 1 ? 's' : ''}`);
      } else {
        toast.success(`${ok} OK, ${failed} échec${failed > 1 ? 's' : ''}`);
      }
    },
    [disabled, upload],
  );

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={cn(
        'relative rounded-lg transition-colors',
        isDragging && 'ring-2 ring-primary ring-offset-2',
      )}
    >
      {children}

      {isDragging && (
        <div
          className={cn(
            'absolute inset-0 z-50 flex flex-col items-center justify-center',
            'rounded-lg border-2 border-dashed border-primary bg-primary/10 backdrop-blur-sm',
            'pointer-events-none',
          )}
        >
          <UploadCloud className="h-12 w-12 text-primary mb-3" />
          <p className="text-base font-medium text-primary">Déposez vos fichiers ici</p>
          <p className="text-xs text-muted-foreground mt-1">Upload dans le dossier courant</p>
        </div>
      )}

      {uploading && (
        <div className="fixed bottom-6 right-6 z-50 bg-background border rounded-lg shadow-lg p-4 min-w-72">
          <div className="flex items-center gap-3 mb-2">
            <UploadCloud className="h-5 w-5 text-primary animate-pulse" />
            <span className="text-sm font-medium">
              Upload {uploading.current}/{uploading.total}
            </span>
          </div>
          <p className="text-xs text-muted-foreground truncate">{uploading.name}</p>
          <div className="h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${(uploading.current / uploading.total) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
