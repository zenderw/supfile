import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { formatBytes, searchApi, type SearchCategory } from '@/lib/api/files';

function useDebounced<T>(value: T, delay = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

type DateRange = 'all' | '7d' | '30d' | '90d' | 'year';

function rangeToDates(range: DateRange): { from?: string; to?: string } {
  if (range === 'all') return {};
  const now = new Date();
  const past = new Date(now);
  if (range === '7d') past.setDate(now.getDate() - 7);
  if (range === '30d') past.setDate(now.getDate() - 30);
  if (range === '90d') past.setDate(now.getDate() - 90);
  if (range === 'year') past.setFullYear(now.getFullYear() - 1);
  return { from: past.toISOString(), to: now.toISOString() };
}

const CATEGORIES: { value: SearchCategory; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'image', label: 'Images' },
  { value: 'video', label: 'Vidéos' },
  { value: 'audio', label: 'Audio' },
  { value: 'pdf', label: 'PDF' },
  { value: 'document', label: 'Docs' },
  { value: 'other', label: 'Autres' },
];

const DATE_RANGES: { value: DateRange; label: string }[] = [
  { value: 'all', label: 'Toujours' },
  { value: '7d', label: '7 jours' },
  { value: '30d', label: '30 jours' },
  { value: '90d', label: '3 mois' },
  { value: 'year', label: '1 an' },
];

export default function SearchScreen() {
  const params = useLocalSearchParams<{ category?: string }>();
  const initialCategory: SearchCategory = CATEGORIES.some((c) => c.value === params.category)
    ? (params.category as SearchCategory)
    : 'all';

  const [q, setQ] = useState('');
  const [category, setCategory] = useState<SearchCategory>(initialCategory);
  const [dateRange, setDateRange] = useState<DateRange>('all');

  const dq = useDebounced(q, 300);
  const cleanQ = dq.trim();
  const enabled = cleanQ.length >= 2 || category !== 'all' || dateRange !== 'all';

  const { data, isFetching } = useQuery({
    queryKey: ['mobile-search', cleanQ, category, dateRange],
    queryFn: () => {
      const dates = rangeToDates(dateRange);
      return searchApi.run(cleanQ, { category, from: dates.from, to: dates.to });
    },
    enabled,
  });

  const items = data
    ? [
        ...data.folders.map((f) => ({ kind: 'folder' as const, item: f })),
        ...data.files.map((f) => ({ kind: 'file' as const, item: f })),
      ]
    : [];

  const activeCategoryLabel = CATEGORIES.find((c) => c.value === category)?.label;

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

      {/* filtres catégorie */}
      <View className="py-2 border-b border-slate-100">
        <Text className="text-[10px] uppercase font-medium text-slate-500 px-4 mb-1">Type</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12 }}
        >
          {CATEGORIES.map((c) => (
            <Pressable
              key={c.value}
              onPress={() => setCategory(c.value)}
              className={`mx-1 px-3 py-1.5 rounded-full ${
                category === c.value ? 'bg-slate-900' : 'bg-slate-100'
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  category === c.value ? 'text-white' : 'text-slate-700'
                }`}
              >
                {c.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* filtres date */}
      <View className="py-2 border-b border-slate-100">
        <Text className="text-[10px] uppercase font-medium text-slate-500 px-4 mb-1">Date</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12 }}
        >
          {DATE_RANGES.map((r) => (
            <Pressable
              key={r.value}
              onPress={() => setDateRange(r.value)}
              className={`mx-1 px-3 py-1.5 rounded-full ${
                dateRange === r.value ? 'bg-slate-900' : 'bg-slate-100'
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  dateRange === r.value ? 'text-white' : 'text-slate-700'
                }`}
              >
                {r.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {!enabled && (
        <Text className="text-center text-slate-400 mt-10 px-6">
          Tapez au moins 2 caractères ou choisissez un filtre.
        </Text>
      )}

      {enabled && isFetching && (
        <View className="mt-10 items-center">
          <ActivityIndicator />
        </View>
      )}

      {enabled && data && items.length === 0 && !isFetching && (
        <Text className="text-center text-slate-400 mt-10 px-6">
          {cleanQ
            ? `Aucun résultat pour « ${cleanQ} ».`
            : `Aucun fichier ${activeCategoryLabel?.toLowerCase() ?? ''} ne correspond.`}
        </Text>
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
