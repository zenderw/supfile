import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Introuvable' }} />
      <View className="flex-1 items-center justify-center bg-white p-6">
        <Text className="text-2xl font-bold text-slate-900">Cet écran n&apos;existe pas.</Text>
        <Link href="/" className="mt-4 text-blue-600">
          Retour à l&apos;accueil
        </Link>
      </View>
    </>
  );
}
