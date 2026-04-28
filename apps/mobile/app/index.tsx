import { router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useAuthStore } from '@/stores/auth.store';

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);

  useEffect(() => {
    if (!user) {
      router.replace('/login');
    }
  }, [user]);

  if (!user) return null;

  function handleLogout() {
    clear();
    router.replace('/login');
  }

  return (
    <View className="flex-1 bg-white p-6">
      <Text className="text-2xl font-bold text-slate-900 mt-8">Bonjour {user.displayName}</Text>

      <View className="mt-8 gap-3">
        <Pressable
          onPress={() => router.push('/files')}
          className="h-14 items-center justify-center bg-slate-900 rounded"
        >
          <Text className="text-white text-base font-medium">📂 Mes fichiers</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/trash')}
          className="h-14 items-center justify-center bg-slate-100 rounded"
        >
          <Text className="text-slate-900 text-base font-medium">🗑 Corbeille</Text>
        </Pressable>
      </View>

      <View className="flex-1" />

      <Pressable
        onPress={handleLogout}
        className="h-11 items-center justify-center rounded-md border border-red-200 active:bg-red-50"
      >
        <Text className="text-sm font-medium text-red-600">Se déconnecter</Text>
      </Pressable>
    </View>
  );
}
