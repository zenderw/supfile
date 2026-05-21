import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { folderShareApi } from '@/lib/api/files';

interface Props {
  visible: boolean;
  folderId: string | null;
  folderName: string;
  onClose: () => void;
}

export function ShareFolderModal({ visible, folderId, folderName, onClose }: Props) {
  const qc = useQueryClient();
  const [email, setEmail] = useState('');

  const shares = useQuery({
    queryKey: ['folder-shares', folderId],
    queryFn: () => folderShareApi.listForFolder(folderId!),
    enabled: visible && !!folderId,
  });

  const share = useMutation({
    mutationFn: (e: string) => folderShareApi.share(folderId!, e),
    onSuccess: () => {
      setEmail('');
      qc.invalidateQueries({ queryKey: ['folder-shares', folderId] });
      qc.invalidateQueries({ queryKey: ['folder', null] });
    },
    onError: (e: Error) => Alert.alert('Erreur', e.message),
  });

  const revoke = useMutation({
    mutationFn: (userId: string) => folderShareApi.revoke(folderId!, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['folder-shares', folderId] });
      qc.invalidateQueries({ queryKey: ['folder', null] });
    },
    onError: (e: Error) => Alert.alert('Erreur', e.message),
  });

  function handleSubmit() {
    const e = email.trim();
    if (!e) return;
    share.mutate(e);
  }

  function handleClose() {
    setEmail('');
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable onPress={handleClose} className="flex-1 bg-black/40 justify-end">
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="bg-white rounded-t-2xl max-h-[80%]"
        >
          <View className="p-4 border-b border-slate-100">
            <Text className="text-base font-semibold text-slate-900" numberOfLines={1}>
              Partager « {folderName} »
            </Text>
            <Text className="text-xs text-slate-500 mt-1">
              Le destinataire pourra consulter et télécharger ce dossier.
            </Text>
          </View>

          <View className="p-4">
            <Text className="text-xs font-medium text-slate-700 mb-1">Email du destinataire</Text>
            <View className="flex-row gap-2">
              <TextInput
                placeholder="user@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                className="flex-1 h-10 px-3 border border-slate-200 rounded bg-slate-50"
              />
              <Pressable
                onPress={handleSubmit}
                disabled={share.isPending || !email.trim()}
                className="h-10 px-4 items-center justify-center bg-slate-900 rounded disabled:opacity-50"
              >
                <Text className="text-sm font-medium text-white">
                  {share.isPending ? '...' : 'Partager'}
                </Text>
              </Pressable>
            </View>
          </View>

          <ScrollView className="px-4 pb-4">
            <Text className="text-xs font-medium text-slate-700 mb-2">
              Déjà partagé avec
              {shares.data && shares.data.length > 0 ? ` (${shares.data.length})` : ''}
            </Text>
            {shares.isLoading && <ActivityIndicator size="small" />}
            {shares.data && shares.data.length === 0 && (
              <Text className="text-xs text-slate-400">Aucun partage pour l'instant.</Text>
            )}
            {shares.data?.map((s) => (
              <View
                key={s.id}
                className="flex-row items-center py-3 border-b border-slate-100 last:border-b-0"
              >
                <View className="flex-1">
                  <Text className="text-sm text-slate-900">{s.toUser.displayName}</Text>
                  <Text className="text-xs text-slate-500">{s.toUser.email}</Text>
                </View>
                <Pressable
                  onPress={() => revoke.mutate(s.toUser.id)}
                  className="px-3 py-2 rounded active:bg-red-50"
                >
                  <Text className="text-sm text-red-600">Retirer</Text>
                </Pressable>
              </View>
            ))}
          </ScrollView>

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
