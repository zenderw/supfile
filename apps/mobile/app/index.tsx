import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white p-6">
      <Text className="text-3xl font-bold text-slate-900">SUPFile</Text>
      <Text className="mt-2 text-slate-500">Plateforme de stockage cloud</Text>
      <Text className="mt-8 text-sm text-slate-400">Application mobile - en construction</Text>
      <StatusBar style="auto" />
    </View>
  );
}
