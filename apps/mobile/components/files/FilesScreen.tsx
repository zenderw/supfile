import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  Text,
  View,
} from 'react-native';

import { ActionsSheet } from './ActionsSheet';
import { FileListItem } from './FileListItem';
import { RenamePrompt } from './RenamePrompt';

import { filesApi, foldersApi, shareApi, FileItem, FolderItem } from '@/lib/api/files';

interface Props {
  folderId: string | null;
}

type MenuTarget = { kind: 'folder'; item: FolderItem } | { kind: 'file'; item: FileItem } | null;

export function FilesScreen({ folderId }: Props) {
  const qc = useQueryClient();
  const [menu, setMenu] = useState<MenuTarget>(null);
  const [renaming, setRenaming] = useState<MenuTarget>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const listing = useQuery({
    queryKey: ['folder', folderId],
    queryFn: () => foldersApi.list(folderId),
  });

  const breadcrumb = useQuery({
    queryKey: ['breadcrumb', folderId],
    queryFn: () => (folderId ? foldersApi.breadcrumb(folderId) : []),
    enabled: !!folderId,
  });

  function invalidate() {
    qc.invalidateQueries({ queryKey: ['folder', folderId] });
  }

  const createFolder = useMutation({
    mutationFn: (name: string) => foldersApi.create(name, folderId),
    onSuccess: () => {
      invalidate();
      setCreateOpen(false);
    },
    onError: (e: Error) => Alert.alert('Erreur', e.message),
  });

  const renameFolder = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => foldersApi.rename(id, name),
    onSuccess: () => {
      invalidate();
      setRenaming(null);
    },
  });

  const renameFile = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => filesApi.rename(id, name),
    onSuccess: () => {
      invalidate();
      setRenaming(null);
    },
  });

  const deleteFolder = useMutation({
    mutationFn: (id: string) => foldersApi.remove(id),
    onSuccess: invalidate,
  });

  const deleteFile = useMutation({
    mutationFn: (id: string) => filesApi.remove(id),
    onSuccess: invalidate,
  });

  async function shareFile(fileId: string) {
    try {
      const link = await shareApi.create(fileId, {});
      const url = shareApi.buildShareUrl(link.token);
      await Share.share({ message: url, url });
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Echec partage');
    }
  }

  const upload = useMutation({
    mutationFn: ({ uri, name, mimeType }: { uri: string; name: string; mimeType: string }) =>
      filesApi.upload(uri, name, mimeType, folderId),
    onSuccess: invalidate,
    onError: (e: Error) => Alert.alert('Upload échoué', e.message),
  });

  async function pickDocument() {
    const res = await DocumentPicker.getDocumentAsync({ multiple: false });
    if (res.canceled || !res.assets?.[0]) return;
    const asset = res.assets[0];
    upload.mutate({
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType ?? 'application/octet-stream',
    });
  }

  async function pickImage() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission refusée');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
    });
    if (res.canceled || !res.assets?.[0]) return;
    const asset = res.assets[0];
    const name = asset.fileName ?? `photo-${Date.now()}.jpg`;
    upload.mutate({
      uri: asset.uri,
      name,
      mimeType: asset.mimeType ?? 'image/jpeg',
    });
  }

  async function takePhoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission refusée');
      return;
    }
    const res = await ImagePicker.launchCameraAsync();
    if (res.canceled || !res.assets?.[0]) return;
    const asset = res.assets[0];
    upload.mutate({
      uri: asset.uri,
      name: `photo-${Date.now()}.jpg`,
      mimeType: 'image/jpeg',
    });
  }

  function openUploadMenu() {
    Alert.alert('Ajouter', undefined, [
      { text: 'Document', onPress: pickDocument },
      { text: 'Galerie', onPress: pickImage },
      { text: 'Caméra', onPress: takePhoto },
      { text: 'Annuler', style: 'cancel' },
    ]);
  }

  const crumbs = folderId
    ? (breadcrumb.data ?? [{ id: null, name: 'Mes fichiers' }])
    : [{ id: null, name: 'Mes fichiers' }];

  return (
    <View className="flex-1 bg-white">
      {/* breadcrumbs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="border-b border-slate-100 max-h-12"
        contentContainerStyle={{
          alignItems: 'center',
          paddingHorizontal: 12,
        }}
      >
        {crumbs.map((c, i) => (
          <View key={c.id ?? 'root'} className="flex-row items-center">
            <Pressable
              onPress={() => router.push(c.id ? `/files/${c.id}` : '/files')}
              className="px-2 py-2"
            >
              <Text
                className={`text-sm ${
                  i === crumbs.length - 1 ? 'text-slate-900 font-semibold' : 'text-slate-500'
                }`}
              >
                {c.name}
              </Text>
            </Pressable>
            {i < crumbs.length - 1 && <Text className="text-slate-300 mx-1">›</Text>}
          </View>
        ))}
      </ScrollView>

      {/* actions header */}
      <View className="flex-row gap-2 px-4 py-3 border-b border-slate-100">
        <Pressable
          onPress={() => setCreateOpen(true)}
          className="flex-1 h-10 items-center justify-center bg-slate-100 rounded"
        >
          <Text className="text-sm font-medium text-slate-700">+ Nouveau dossier</Text>
        </Pressable>
        <Pressable
          onPress={openUploadMenu}
          disabled={upload.isPending}
          className="flex-1 h-10 items-center justify-center bg-slate-900 rounded"
        >
          <Text className="text-sm font-medium text-white">
            {upload.isPending ? 'Upload...' : '⬆ Envoyer'}
          </Text>
        </Pressable>
      </View>

      {/* listing */}
      {listing.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={[
            ...(listing.data?.folders ?? []).map((f) => ({
              kind: 'folder' as const,
              item: f,
            })),
            ...(listing.data?.files ?? []).map((f) => ({
              kind: 'file' as const,
              item: f,
            })),
          ]}
          keyExtractor={(it) => `${it.kind}-${it.item.id}`}
          refreshControl={
            <RefreshControl refreshing={listing.isFetching} onRefresh={() => listing.refetch()} />
          }
          ListEmptyComponent={
            <Text className="text-center text-slate-400 mt-10">Dossier vide</Text>
          }
          renderItem={({ item }) => (
            <FileListItem
              type={item.kind}
              name={item.item.name}
              size={item.kind === 'file' ? item.item.size : undefined}
              onPress={() => {
                if (item.kind === 'folder') {
                  router.push(`/files/${item.item.id}`);
                } else {
                  router.push(`/preview/${item.item.id}`);
                }
              }}
              onLongPress={() => setMenu(item)}
            />
          )}
        />
      )}

      {/* sheet actions */}
      <ActionsSheet
        visible={!!menu}
        onClose={() => setMenu(null)}
        title={menu?.item.name ?? ''}
        actions={
          menu
            ? [
                ...(menu.kind === 'file'
                  ? [
                      {
                        label: 'Aperçu',
                        onPress: () => router.push(`/preview/${menu.item.id}`),
                      },
                      {
                        label: 'Partager',
                        onPress: () => shareFile(menu.item.id),
                      },
                    ]
                  : []),
                { label: 'Renommer', onPress: () => setRenaming(menu) },
                {
                  label: 'Supprimer',
                  destructive: true,
                  onPress: () => {
                    if (menu.kind === 'folder') {
                      deleteFolder.mutate(menu.item.id);
                    } else {
                      deleteFile.mutate(menu.item.id);
                    }
                  },
                },
              ]
            : []
        }
      />

      {/* rename prompt */}
      <RenamePrompt
        visible={!!renaming}
        initial={renaming?.item.name ?? ''}
        title={`Renommer ${renaming?.item.name ?? ''}`}
        onCancel={() => setRenaming(null)}
        onSubmit={(name) => {
          if (!renaming) return;
          if (renaming.kind === 'folder') {
            renameFolder.mutate({ id: renaming.item.id, name });
          } else {
            renameFile.mutate({ id: renaming.item.id, name });
          }
        }}
      />

      {/* create folder prompt */}
      <RenamePrompt
        visible={createOpen}
        initial=""
        title="Nouveau dossier"
        onCancel={() => setCreateOpen(false)}
        onSubmit={(name) => createFolder.mutate(name)}
      />
    </View>
  );
}
