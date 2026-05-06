import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from 'react-native';

import { formatBytes, searchApi } from '@/lib/api/files';

function useDebounced<T>(value: T, delay = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export default function SearchScreen() {
  const [q, setQ] = useState('');
  const dq = useDebounced(q, 300);
  const enabled = dq.trim().length >= 2;

  const { data, isFetching } = useQuery({
    queryKey: ['mobile-search', dq],
    queryFn: () => searchApi.run(dq.trim()),
    enabled,
  });

  const items = data
    ? [
        ...data.folders.map((f) => ({ kind: 'folder' as const, item: f })),
        ...data.files.map((f) => ({ kind: 'file' as const, item: f })),
      ]
    : [];

  return (
    <View className="flex-1 bg-white">
      <View className="px-4 py-3 border-b border-slate-100">
        <TextInput
          autoFocus
          placeholder="Rechercher..."
          value={q}
          onChangeText={setQ}
          className="h-10 px-3 border border-slate-200 rounded bg-slate-50"
          autoCorrect={false}
          autoCapitalize="none"
        />
      </View>

      {!enabled && (
        <Text className="text-center text-slate-400 mt-10">Tapez au moins 2 caractères.</Text>
      )}

      {enabled && isFetching && (
        <View className="mt-10 items-center">
          <ActivityIndicator />
        </View>
      )}

      {enabled && data && items.length === 0 && !isFetching && (
        <Text className="text-center text-slate-400 mt-10">Aucun résultat pour « {dq} ».</Text>
      )}

      {enabled && data && items.length > 0 && (
        <FlatList
          data={items}
          keyExtractor={(it) => `${it.kind}-${it.item.id}`}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                if (item.kind === 'folder') {
                  router.push(`/files/${item.item.id}`);
                } else {
                  router.push(`/preview/${item.item.id}`);
                }
              }}
              className="flex-row items-center px-4 py-3 border-b border-slate-100"
            >
              <Text className="text-xl mr-3">{item.kind === 'folder' ? '📁' : '📄'}</Text>
              <Text className="text-sm text-slate-900 flex-1" numberOfLines={1}>
                {item.item.name}
              </Text>
              {item.kind === 'file' && (
                <Text className="text-xs text-slate-500">{formatBytes(item.item.size)}</Text>
              )}
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
