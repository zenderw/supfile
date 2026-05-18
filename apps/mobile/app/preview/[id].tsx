import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { kindOf, previewApi } from '@/lib/api/files';

export default function PreviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [text, setText] = useState<string | null>(null);

  const meta = useQuery({
    queryKey: ['preview-meta', id],
    queryFn: () => previewApi.getMetadata(id!),
    enabled: !!id,
  });

  const tokenQ = useQuery({
    queryKey: ['preview-token', id],
    queryFn: () => previewApi.getDownloadToken(id!),
    enabled: !!id,
    refetchInterval: 45_000,
  });

  const kind = meta.data ? kindOf(meta.data.mimeType) : null;
  const url = id && tokenQ.data ? previewApi.buildDownloadUrl(id, tokenQ.data) : null;

  useEffect(() => {
    if (kind !== 'text' || !url) return;
    let cancel = false;
    fetch(url)
      .then((r) => r.text())
      .then((t) => {
        if (!cancel) setText(t);
      })
      .catch(() => {
        if (!cancel) setText('— erreur de chargement —');
      });
    return () => {
      cancel = true;
    };
  }, [kind, url]);

  function openExternal() {
    if (!url) return;
    Linking.openURL(url).catch(() => Alert.alert("Impossible d'ouvrir le lien"));
  }

  if (meta.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator />
      </View>
    );
  }
  if (!meta.data) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-red-500">Fichier introuvable</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* on overrride le titre Stack avec le nom du fichier et on rajoute un bouton DL */}
      <Stack.Screen
        options={{
          title: meta.data.name,
          headerRight: () =>
            url ? (
              <Pressable onPress={openExternal} className="px-2 py-1">
                <Text className="text-base">⤓</Text>
              </Pressable>
            ) : null,
        }}
      />

      <View className="flex-1 items-center justify-center p-4">
        {url && kind === 'image' && (
          <Image
            source={{ uri: url }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="contain"
          />
        )}

        {kind === 'text' && (
          <ScrollView className="w-full">
            <Text className="font-mono text-xs text-slate-800">
              {text ?? 'Chargement du contenu...'}
            </Text>
          </ScrollView>
        )}

        {(kind === 'pdf' || kind === 'video' || kind === 'audio') && (
          <View className="items-center gap-3">
            <Text className="text-slate-500 text-center">
              {kind === 'pdf'
                ? 'Le PDF s\'ouvre dans le navigateur natif pour un meilleur rendu.'
                : 'Aperçu non intégré pour ce format sur mobile.'}
            </Text>
            <Pressable onPress={openExternal} className="bg-slate-900 rounded px-5 py-3">
              <Text className="text-white font-medium">Ouvrir dans le navigateur</Text>
            </Pressable>
          </View>
        )}

        {kind === 'unsupported' && (
          <Text className="text-slate-500 text-center">
            Aperçu indisponible. Utilisez "Ouvrir dans le navigateur" pour télécharger.
          </Text>
        )}
      </View>
    </View>
  );
}
