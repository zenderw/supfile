import { Stack } from 'expo-router';

export default function FilesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#ffffff' },
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Mes fichiers' }} />
      <Stack.Screen name="[id]" options={{ title: 'Dossier' }} />
    </Stack>
  );
}
