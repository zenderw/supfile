import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { CreateFolderDialog } from '@/components/files/CreateFolderDialog';
import { FileRow, formatBytes } from '@/components/files/FileRow';
import { RenameDialog } from '@/components/files/RenameDialog';
import { ShareDialog } from '@/components/files/ShareDialog';
import { ShareFolderInternalDialog } from '@/components/files/ShareFolderInternalDialog';
import { UploadButton } from '@/components/files/UploadButton';
import { Button } from '@/components/ui/button';
import {
  useBreadcrumb,
  useDeleteFile,
  useDeleteFolder,
  useFolderListing,
  useRenameFile,
  useRenameFolder,
} from '@/hooks/use-folders';
import { filesApi } from '@/lib/api/files';

interface RenameState {
  open: boolean;
  type: 'folder' | 'file';
  id: string;
  name: string;
}

export function FilesPage() {
  const { folderId } = useParams<{ folderId?: string }>();
  const navigate = useNavigate();
  const currentFolderId = folderId ?? null;

  const { data, isLoading } = useFolderListing(currentFolderId);
  const { data: breadcrumb } = useBreadcrumb(currentFolderId);

  const renameFolder = useRenameFolder(currentFolderId);
  const renameFile = useRenameFile(currentFolderId);
  const deleteFolder = useDeleteFolder(currentFolderId);
  const deleteFile = useDeleteFile(currentFolderId);

  const [rename, setRename] = useState<RenameState | null>(null);
  const [share, setShare] = useState<{ id: string; name: string } | null>(null);
  const [shareFolder, setShareFolder] = useState<{ id: string; name: string } | null>(null);

  function openFolder(id: string) {
    navigate(`/files/${id}`);
  }

  async function downloadFolder(id: string, name: string) {
    try {
      await filesApi.downloadFolderZip(id, name);
    } catch (e) {
      toast.error((e as Error).message ?? 'Echec du telechargement');
    }
  }

  const items = breadcrumb ?? [{ id: null, name: 'Mes fichiers' }];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mes fichiers</h1>
        <div className="flex gap-2">
          <CreateFolderDialog parentId={currentFolderId} />
          <UploadButton parentId={currentFolderId} />
        </div>
      </div>

      {/* breadcrumbs */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground flex-wrap">
        {items.map((item, idx) => (
          <span key={item.id ?? 'root'} className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(item.id ? `/files/${item.id}` : '/files')}
              className="h-7 px-2"
            >
              {item.name}
            </Button>
            {idx < items.length - 1 && <ChevronRight className="h-3 w-3" />}
          </span>
        ))}
      </nav>

      {isLoading && <p className="text-sm text-muted-foreground">Chargement...</p>}

      {data && (
        <div className="border rounded-lg divide-y">
          {data.folders.length === 0 && data.files.length === 0 && (
            <p className="p-8 text-center text-muted-foreground text-sm">Ce dossier est vide</p>
          )}

          {data.folders.map((f) => {
            const isShared = 'shared' in f && f.shared;
            const sharedBy =
              isShared && 'sharedBy' in f
                ? (f.sharedBy as { displayName: string } | undefined)
                : undefined;
            return (
              <FileRow
                key={f.id}
                id={f.id}
                name={f.name}
                type="folder"
                readOnly={isShared}
                sharedBadge={
                  isShared && sharedBy ? `Partagé par ${sharedBy.displayName}` : undefined
                }
                onOpen={() => openFolder(f.id)}
                onRename={
                  isShared
                    ? undefined
                    : () => setRename({ open: true, type: 'folder', id: f.id, name: f.name })
                }
                onDelete={isShared ? undefined : () => deleteFolder.mutate(f.id)}
                onDownload={() => downloadFolder(f.id, f.name)}
                onShareWithUser={
                  isShared ? undefined : () => setShareFolder({ id: f.id, name: f.name })
                }
              />
            );
          })}

          {data.files.map((f) => (
            <FileRow
              key={f.id}
              id={f.id}
              name={f.name}
              type="file"
              sizeLabel={formatBytes(f.size)}
              onOpen={() => navigate(`/preview/${f.id}`)}
              onPreview={() => navigate(`/preview/${f.id}`)}
              onShare={() => setShare({ id: f.id, name: f.name })}
              onRename={() => setRename({ open: true, type: 'file', id: f.id, name: f.name })}
              onDelete={() => deleteFile.mutate(f.id)}
            />
          ))}
        </div>
      )}

      {share && (
        <ShareDialog
          open={!!share}
          onOpenChange={(o) => !o && setShare(null)}
          fileId={share.id}
          fileName={share.name}
        />
      )}

      {shareFolder && (
        <ShareFolderInternalDialog
          open={!!shareFolder}
          onOpenChange={(o) => !o && setShareFolder(null)}
          folderId={shareFolder.id}
          folderName={shareFolder.name}
        />
      )}

      {rename && (
        <RenameDialog
          open={rename.open}
          onOpenChange={(open) => setRename(open ? rename : null)}
          initialName={rename.name}
          loading={renameFolder.isPending || renameFile.isPending}
          onSubmit={(name) => {
            const mutation = rename.type === 'folder' ? renameFolder : renameFile;
            mutation.mutate({ id: rename.id, name }, { onSuccess: () => setRename(null) });
          }}
        />
      )}
    </div>
  );
}
