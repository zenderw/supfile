import { useQuery } from '@tanstack/react-query';
import { Redirect, router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { formatBytes, statsApi } from '@/lib/api/files';
import { useAuthStore } from '@/stores/auth.store';

function pct(used: string, quota: string): number {
  const u = Number(used);
  const q = Number(quota);
  if (!q) return 0;
  return Math.min(100, (u / q) * 100);
}

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);

  const stats = useQuery({
    queryKey: ['mobile-stats'],
    queryFn: () => statsApi.me(),
    enabled: !!user,
  });

  if (!user) return <Redirect href="/login" />;

  function handleLogout() {
    clear();
    router.replace('/login');
  }

  const used = stats.data ? pct(stats.data.usedSpace, stats.data.quota) : 0;

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 24 }}>
      <Text className="text-2xl font-bold text-slate-900 mt-4">Bonjour {user.displayName}</Text>

      {/* bloc espace */}
      <View className="mt-6 border border-slate-200 rounded p-4">
        <Text className="text-xs font-semibold text-slate-500 uppercase mb-2">Espace</Text>
        {stats.isLoading ? (
          <ActivityIndicator />
        ) : stats.data ? (
          <>
            <Text className="text-sm text-slate-700">
              {formatBytes(stats.data.usedSpace)} / {formatBytes(stats.data.quota)}
            </Text>
            <View className="h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
              <View className="h-full bg-slate-900" style={{ width: `${used}%` }} />
            </View>
            <Text className="text-xs text-slate-500 mt-1">{used.toFixed(1)}% utilisé</Text>
          </>
        ) : null}
      </View>

      {/* totaux + raccourcis */}
      {stats.data && (
        <View className="flex-row gap-3 mt-4">
          <View className="flex-1 border border-slate-200 rounded p-4">
            <Text className="text-2xl font-bold">{stats.data.totalFolders}</Text>
            <Text className="text-xs text-slate-500">dossiers</Text>
          </View>
          <View className="flex-1 border border-slate-200 rounded p-4">
            <Text className="text-2xl font-bold">{stats.data.totalFiles}</Text>
            <Text className="text-xs text-slate-500">fichiers</Text>
          </View>
        </View>
      )}

      <View className="mt-6 gap-3">
        <Pressable
          onPress={() => router.push('/files')}
          className="h-12 items-center justify-center bg-slate-900 rounded"
        >
          <Text className="text-white text-base font-medium">📂 Mes fichiers</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/search')}
          className="h-12 items-center justify-center bg-slate-100 rounded"
        >
          <Text className="text-slate-900 text-base font-medium">🔍 Rechercher</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/trash')}
          className="h-12 items-center justify-center bg-slate-100 rounded"
        >
          <Text className="text-slate-900 text-base font-medium">🗑 Corbeille</Text>
        </Pressable>
      </View>

      {/* recents */}
      {stats.data && stats.data.recentFiles.length > 0 && (
        <View className="mt-6">
          <Text className="text-xs font-semibold text-slate-500 uppercase mb-2">Récents</Text>
          <View className="border border-slate-200 rounded">
            {stats.data.recentFiles.slice(0, 5).map((f, i) => (
              <Pressable
                key={f.id}
                onPress={() => router.push(`/preview/${f.id}`)}
                className={`flex-row items-center px-3 py-3 ${i < 4 ? 'border-b border-slate-100' : ''}`}
              >
                <Text className="text-base mr-3">📄</Text>
                <Text className="text-sm text-slate-900 flex-1" numberOfLines={1}>
                  {f.name}
                </Text>
                <Text className="text-xs text-slate-500">{formatBytes(f.size)}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      <Pressable
        onPress={handleLogout}
        className="h-11 items-center justify-center rounded-md border border-red-200 active:bg-red-50 mt-8"
      >
        <Text className="text-sm font-medium text-red-600">Se déconnecter</Text>
      </Pressable>
    </ScrollView>
  );
}
