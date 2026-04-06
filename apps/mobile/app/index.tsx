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
    <View className="flex-1 items-center justify-center bg-white p-6">
      <Text className="text-3xl font-bold text-slate-900">SUPFile</Text>
      <Text className="mt-2 text-slate-500">Bonjour {user.displayName}</Text>
      <Text className="mt-8 text-sm text-slate-400">Application mobile - features à venir</Text>

      <Pressable
        onPress={handleLogout}
        className="mt-12 h-11 items-center justify-center rounded-md border border-red-200 px-6 active:bg-red-50"
      >
        <Text className="text-sm font-medium text-red-600">Se déconnecter</Text>
      </Pressable>
    </View>
  );
}
