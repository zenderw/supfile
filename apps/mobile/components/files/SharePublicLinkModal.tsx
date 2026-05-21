import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, Modal, Pressable, Share, Text, TextInput, View } from 'react-native';

import { shareApi } from '@/lib/api/files';

const EXPIRY_OPTIONS: { label: string; hours?: number }[] = [
  { label: 'Jamais' },
  { label: '1 heure', hours: 1 },
  { label: '1 jour', hours: 24 },
  { label: '7 jours', hours: 24 * 7 },
  { label: '30 jours', hours: 24 * 30 },
];

interface Props {
  visible: boolean;
  fileId: string | null;
  fileName: string;
  onClose: () => void;
}

export function SharePublicLinkModal({ visible, fileId, fileName, onClose }: Props) {
  const [password, setPassword] = useState('');
  const [expiryIdx, setExpiryIdx] = useState(0);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: async () => {
      if (!fileId) throw new Error('fileId manquant');
      const link = await shareApi.create(fileId, {
        password: password.trim() || undefined,
        expiresInHours: EXPIRY_OPTIONS[expiryIdx].hours,
      });
      return shareApi.buildShareUrl(link.token);
    },
    onSuccess: (url) => {
      setCreatedUrl(url);
    },
    onError: (e: Error) => Alert.alert('Erreur', e.message),
  });

  function reset() {
    setPassword('');
    setExpiryIdx(0);
    setCreatedUrl(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function shareUrl() {
    if (!createdUrl) return;
    await Share.share({ message: createdUrl, url: createdUrl });
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable onPress={handleClose} className="flex-1 bg-black/40 justify-end">
        <Pressable onPress={(e) => e.stopPropagation()} className="bg-white rounded-t-2xl">
          <View className="p-4 border-b border-slate-100">
            <Text className="text-base font-semibold text-slate-900" numberOfLines={1}>
              Partager « {fileName} »
            </Text>
          </View>

          {!createdUrl ? (
            <View className="p-4">
              <Text className="text-xs font-medium text-slate-700 mb-1">
                Mot de passe (optionnel)
              </Text>
              <TextInput
                placeholder="Laisser vide pour aucun"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                className="h-10 px-3 border border-slate-200 rounded bg-slate-50"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Text className="text-xs font-medium text-slate-700 mb-1 mt-4">Expiration</Text>
              <View className="flex-row flex-wrap gap-2">
                {EXPIRY_OPTIONS.map((opt, idx) => (
                  <Pressable
                    key={opt.label}
                    onPress={() => setExpiryIdx(idx)}
                    className={`px-3 py-1.5 rounded-full ${
                      expiryIdx === idx ? 'bg-slate-900' : 'bg-slate-100'
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        expiryIdx === idx ? 'text-white' : 'text-slate-700'
                      }`}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Pressable
                onPress={() => create.mutate()}
                disabled={create.isPending}
                className="mt-5 h-11 items-center justify-center bg-slate-900 rounded disabled:opacity-50"
              >
                <Text className="text-sm font-medium text-white">
                  {create.isPending ? 'Création...' : 'Créer le lien'}
                </Text>
              </Pressable>
            </View>
          ) : (
            <View className="p-4">
              <Text className="text-xs font-medium text-slate-700 mb-1">Lien public</Text>
              <View className="bg-slate-50 border border-slate-200 rounded p-3 mb-3">
                <Text className="text-xs text-slate-900" selectable>
                  {createdUrl}
                </Text>
              </View>
              <Pressable
                onPress={shareUrl}
                className="h-11 items-center justify-center bg-slate-900 rounded"
              >
                <Text className="text-sm font-medium text-white">Partager le lien</Text>
              </Pressable>
            </View>
          )}

          <Pressable
            onPress={handleClose}
            className="py-4 border-t border-slate-100 active:bg-slate-50"
          >
            <Text className="text-center text-base font-medium text-slate-500">Fermer</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
