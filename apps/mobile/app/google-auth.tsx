import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/stores/auth.store';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

function parseTokens(url: string): { accessToken: string; refreshToken: string } | null {
  try {
    const u = new URL(url);
    const accessToken = u.searchParams.get('accessToken');
    const refreshToken = u.searchParams.get('refreshToken');
    if (accessToken && refreshToken) return { accessToken, refreshToken };
    return null;
  } catch {
    return null;
  }
}

export default function GoogleAuthScreen() {
  const insets = useSafeAreaInsets();
  const setSession = useAuthStore((s) => s.setSession);
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('Ouverture du navigateur...');
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    (async () => {
      try {
        // returnUrl pris par expo-linking ; en Expo Go c'est `exp://192.x.x.x:8081/--/oauth-callback`,
        // en build natif c'est `supfile://oauth-callback`. Le backend redirigera dessus en fin de flow.
        const returnUrl = Linking.createURL('oauth-callback');
        const authUrl = `${API_BASE}/auth/google?returnUrl=${encodeURIComponent(returnUrl)}`;
        const result = await WebBrowser.openAuthSessionAsync(authUrl, returnUrl);

        if (result.type === 'cancel' || result.type === 'dismiss') {
          setError('Connexion annulée');
          return;
        }

        if (result.type !== 'success' || !result.url) {
          setError('Echec de la connexion');
          return;
        }

        const tokens = parseTokens(result.url);
        if (!tokens) {
          setError("Tokens absents de l'URL de retour");
          return;
        }

        setStatus('Récupération du profil...');
        setAccessToken(tokens.accessToken);
        const user = await authApi.me();
        setSession(user, tokens.accessToken, tokens.refreshToken);
        router.replace('/');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur inconnue');
      }
    })();
  }, [setSession, setAccessToken]);

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center px-3 py-2 border-b border-slate-100">
        <Pressable onPress={() => router.back()} className="px-3 py-2">
          <Text className="text-base text-slate-700">‹ Retour</Text>
        </Pressable>
        <Text className="text-sm font-medium text-slate-900 ml-2">Connexion Google</Text>
      </View>

      <View className="flex-1 items-center justify-center px-6">
        {error ? (
          <>
            <Text className="text-base text-red-600 text-center mb-4">{error}</Text>
            <Pressable onPress={() => router.back()} className="px-4 py-2 bg-slate-100 rounded">
              <Text className="text-sm text-slate-700">Retour</Text>
            </Pressable>
          </>
        ) : (
          <>
            <ActivityIndicator />
            <Text className="text-sm text-slate-500 mt-4">{status}</Text>
          </>
        )}
      </View>
    </View>
  );
}
