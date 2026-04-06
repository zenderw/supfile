import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';

import '../global.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30 * 1000,
    },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#ffffff' },
          headerTitleStyle: { fontWeight: '600' },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'SUPFile' }} />
        <Stack.Screen name="login" options={{ title: 'Connexion', headerBackVisible: false }} />
        <Stack.Screen name="register" options={{ title: 'Inscription' }} />
      </Stack>
    </QueryClientProvider>
  );
}
