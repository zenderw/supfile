import { FileIcon, Folder, RotateCcw, Trash2 } from 'lucide-react';

import { formatBytes } from '@/components/files/FileRow';
import { Button } from '@/components/ui/button';
import { useTrashActions, useTrashListing } from '@/hooks/use-folders';

export function TrashPage() {
  const { data, isLoading } = useTrashListing();
  const { restoreFolder, restoreFile, purgeFolder, purgeFile } = useTrashActions();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Corbeille</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Les éléments supprimés peuvent être restaurés ou supprimés définitivement.
        </p>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Chargement...</p>}

      {data && (
        <div className="border rounded-lg divide-y">
          {data.folders.length === 0 && data.files.length === 0 && (
            <p className="p-8 text-center text-muted-foreground text-sm">Corbeille vide</p>
          )}

          {data.folders.map((f) => (
            <div key={f.id} className="flex items-center justify-between p-3 hover:bg-muted/40">
              <div className="flex items-center gap-3 flex-1">
                <Folder className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">{f.name}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => restoreFolder.mutate(f.id)}>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Restaurer
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => purgeFolder.mutate(f.id)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Purger
                </Button>
              </div>
            </div>
          ))}

          {data.files.map((f) => (
            <div key={f.id} className="flex items-center justify-between p-3 hover:bg-muted/40">
              <div className="flex items-center gap-3 flex-1">
                <FileIcon className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">{f.name}</span>
                <span className="text-xs text-muted-foreground">{formatBytes(f.size)}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => restoreFile.mutate(f.id)}>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Restaurer
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => purgeFile.mutate(f.id)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Purger
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
