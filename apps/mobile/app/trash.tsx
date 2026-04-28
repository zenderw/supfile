import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';

import { ActionsSheet } from '@/components/files/ActionsSheet';
import { FileListItem } from '@/components/files/FileListItem';
import { trashApi } from '@/lib/api/files';

type Target =
  | { kind: 'folder'; id: string; name: string }
  | { kind: 'file'; id: string; name: string; size: string }
  | null;

export default function TrashScreen() {
  const qc = useQueryClient();
  const [menu, setMenu] = useState<Target>(null);

  const listing = useQuery({
    queryKey: ['trash'],
    queryFn: () => trashApi.list(),
  });

  function invalidate() {
    qc.invalidateQueries({ queryKey: ['trash'] });
    qc.invalidateQueries({ queryKey: ['folder'] });
  }

  const restoreFolder = useMutation({
    mutationFn: (id: string) => trashApi.restoreFolder(id),
    onSuccess: invalidate,
  });
  const restoreFile = useMutation({
    mutationFn: (id: string) => trashApi.restoreFile(id),
    onSuccess: invalidate,
  });
  const purgeFolder = useMutation({
    mutationFn: (id: string) => trashApi.purgeFolder(id),
    onSuccess: invalidate,
  });
  const purgeFile = useMutation({
    mutationFn: (id: string) => trashApi.purgeFile(id),
    onSuccess: invalidate,
  });

  function confirmPurge(target: Target) {
    if (!target) return;
    Alert.alert(
      'Supprimer définitivement',
      `${target.name} sera supprimé sans possibilité de restauration.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            if (target.kind === 'folder') purgeFolder.mutate(target.id);
            else purgeFile.mutate(target.id);
          },
        },
      ],
    );
  }

  if (listing.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator />
      </View>
    );
  }

  const data = listing.data;
  const items = [
    ...(data?.folders ?? []).map((f) => ({
      kind: 'folder' as const,
      id: f.id,
      name: f.name,
    })),
    ...(data?.files ?? []).map((f) => ({
      kind: 'file' as const,
      id: f.id,
      name: f.name,
      size: f.size,
    })),
  ];

  return (
    <View className="flex-1 bg-white">
      <FlatList
        data={items}
        keyExtractor={(it) => `${it.kind}-${it.id}`}
        refreshControl={
          <RefreshControl refreshing={listing.isFetching} onRefresh={() => listing.refetch()} />
        }
        ListEmptyComponent={
          <Text className="text-center text-slate-400 mt-10">Corbeille vide</Text>
        }
        renderItem={({ item }) => (
          <FileListItem
            type={item.kind}
            name={item.name}
            size={item.kind === 'file' ? item.size : undefined}
            onPress={() => setMenu(item)}
            onLongPress={() => setMenu(item)}
          />
        )}
      />

      <ActionsSheet
        visible={!!menu}
        onClose={() => setMenu(null)}
        title={menu?.name ?? ''}
        actions={
          menu
            ? [
                {
                  label: 'Restaurer',
                  onPress: () => {
                    if (menu.kind === 'folder') restoreFolder.mutate(menu.id);
                    else restoreFile.mutate(menu.id);
                  },
                },
                {
                  label: 'Supprimer définitivement',
                  destructive: true,
                  onPress: () => confirmPurge(menu),
                },
              ]
            : []
        }
      />

      {/* boutons de quitter en bas si tu veux */}
      <Pressable
        onPress={() => {
          /* back via header */
        }}
      />
    </View>
  );
}
