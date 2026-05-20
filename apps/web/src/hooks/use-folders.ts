import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { filesApi, foldersApi, trashApi } from '@/lib/api/files';
import { extractErrorMessage } from '@/lib/api-error';

export const folderKeys = {
  all: ['folders'] as const,
  list: (parentId: string | null) => [...folderKeys.all, 'list', parentId] as const,
  breadcrumb: (id: string) => [...folderKeys.all, 'breadcrumb', id] as const,
  trash: ['trash'] as const,
};

export function useFolderListing(parentId: string | null) {
  return useQuery({
    queryKey: folderKeys.list(parentId),
    queryFn: () => foldersApi.list(parentId),
  });
}

export function useBreadcrumb(folderId: string | null) {
  return useQuery({
    queryKey: folderId ? folderKeys.breadcrumb(folderId) : ['breadcrumb', null],
    queryFn: () => (folderId ? foldersApi.breadcrumb(folderId) : []),
    enabled: !!folderId,
  });
}

export function useCreateFolder(parentId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => foldersApi.create({ name, parentId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: folderKeys.list(parentId) });
      toast.success('Dossier créé');
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useUploadFile(parentId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, onProgress }: { file: File; onProgress?: (pct: number) => void }) =>
      filesApi.upload(file, parentId, onProgress),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: folderKeys.list(parentId) });
      toast.success('Fichier uploadé');
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useRenameFolder(parentId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => foldersApi.update(id, { name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: folderKeys.list(parentId) });
      toast.success('Renommé');
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useRenameFile(parentId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => filesApi.update(id, { name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: folderKeys.list(parentId) });
      toast.success('Renommé');
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useDeleteFolder(parentId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => foldersApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: folderKeys.list(parentId) });
      qc.invalidateQueries({ queryKey: folderKeys.trash });
      toast.success('Dossier déplacé dans la corbeille');
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useDeleteFile(parentId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => filesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: folderKeys.list(parentId) });
      qc.invalidateQueries({ queryKey: folderKeys.trash });
      toast.success('Fichier déplacé dans la corbeille');
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useTrashListing() {
  return useQuery({ queryKey: folderKeys.trash, queryFn: () => trashApi.list() });
}

export function useTrashActions() {
  const qc = useQueryClient();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: folderKeys.trash });
    qc.invalidateQueries({ queryKey: folderKeys.all });
  };

  return {
    restoreFolder: useMutation({
      mutationFn: (id: string) => trashApi.restoreFolder(id),
      onSuccess: () => {
        invalidate();
        toast.success('Dossier restauré');
      },
      onError: (err) => toast.error(extractErrorMessage(err)),
    }),
    restoreFile: useMutation({
      mutationFn: (id: string) => trashApi.restoreFile(id),
      onSuccess: () => {
        invalidate();
        toast.success('Fichier restauré');
      },
      onError: (err) => toast.error(extractErrorMessage(err)),
    }),
    purgeFolder: useMutation({
      mutationFn: (id: string) => trashApi.purgeFolder(id),
      onSuccess: () => {
        invalidate();
        toast.success('Dossier purgé définitivement');
      },
      onError: (err) => toast.error(extractErrorMessage(err)),
    }),
    purgeFile: useMutation({
      mutationFn: (id: string) => trashApi.purgeFile(id),
      onSuccess: () => {
        invalidate();
        toast.success('Fichier purgé définitivement');
      },
      onError: (err) => toast.error(extractErrorMessage(err)),
    }),
  };
}
