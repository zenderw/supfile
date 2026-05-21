import { useMutation } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/stores/auth.store';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);

  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPassword2, setNewPassword2] = useState('');

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName);
      setEmail(user.email);
    }
  }, [user]);

  const updateProfile = useMutation({
    mutationFn: authApi.updateMe,
    onSuccess: (updated) => {
      const accessToken = useAuthStore.getState().accessToken;
      const refreshToken = useAuthStore.getState().refreshToken;
      if (accessToken && refreshToken) {
        setSession(updated, accessToken, refreshToken);
      }
      Alert.alert('OK', 'Profil mis à jour');
    },
    onError: (e: Error) => Alert.alert('Erreur', e.message),
  });

  const changePwd = useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => {
      setOldPassword('');
      setNewPassword('');
      setNewPassword2('');
      Alert.alert('OK', 'Mot de passe modifié');
    },
    onError: (e: Error) => Alert.alert('Erreur', e.message),
  });

  function handleSaveProfile() {
    if (!user) return;
    const patch: { email?: string; displayName?: string } = {};
    if (displayName.trim() !== user.displayName) patch.displayName = displayName.trim();
    if (email.trim() !== user.email) patch.email = email.trim();
    if (Object.keys(patch).length === 0) {
      Alert.alert('Info', 'Aucun changement à enregistrer');
      return;
    }
    updateProfile.mutate(patch);
  }

  const uploadAvatar = useMutation({
    mutationFn: ({ uri, name, mimeType }: { uri: string; name: string; mimeType: string }) =>
      authApi.uploadAvatar(uri, name, mimeType),
    onSuccess: (updated) => {
      const accessToken = useAuthStore.getState().accessToken;
      const refreshToken = useAuthStore.getState().refreshToken;
      if (accessToken && refreshToken) {
        setSession(updated, accessToken, refreshToken);
      }
      Alert.alert('OK', 'Avatar mis à jour');
    },
    onError: (e: Error) => Alert.alert('Erreur', e.message),
  });

  async function pickAvatar() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission refusée');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (res.canceled || !res.assets?.[0]) return;
    const asset = res.assets[0];
    uploadAvatar.mutate({
      uri: asset.uri,
      name: asset.fileName ?? `avatar-${Date.now()}.jpg`,
      mimeType: asset.mimeType ?? 'image/jpeg',
    });
  }

  function handleChangePassword() {
    if (newPassword !== newPassword2) {
      Alert.alert('Erreur', 'Les deux mots de passe ne correspondent pas');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Erreur', 'Le mot de passe doit faire au moins 8 caractères');
      return;
    }
    changePwd.mutate({ oldPassword, newPassword });
  }

  if (!user) return null;

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ padding: 20, paddingTop: insets.top + 12 }}
    >
      <Pressable onPress={() => router.back()} className="self-start px-3 py-2 mb-2">
        <Text className="text-base text-slate-700">‹ Retour</Text>
      </Pressable>

      <Text className="text-2xl font-bold text-slate-900 mb-6">Paramètres</Text>

      {/* Profil */}
      <View className="border border-slate-200 rounded p-4 mb-4">
        <Text className="text-xs font-semibold text-slate-500 uppercase mb-3">Profil</Text>

        <Text className="text-xs text-slate-700 mb-1">Nom d'affichage</Text>
        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          className="h-10 px-3 border border-slate-200 rounded bg-slate-50 mb-3"
          autoCorrect={false}
        />

        <Text className="text-xs text-slate-700 mb-1">Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          className="h-10 px-3 border border-slate-200 rounded bg-slate-50 mb-3"
        />

        <Text className="text-xs text-slate-700 mb-1">Avatar</Text>
        <View className="flex-row items-center gap-3 mb-3">
          <View className="h-16 w-16 rounded-full bg-slate-100 border border-slate-200 overflow-hidden items-center justify-center">
            {user.avatarUrl ? (
              <Image
                source={{ uri: user.avatarUrl }}
                style={{ width: 64, height: 64 }}
                resizeMode="cover"
              />
            ) : (
              <Text className="text-[10px] text-slate-400">Aucun</Text>
            )}
          </View>
          <Pressable
            onPress={pickAvatar}
            disabled={uploadAvatar.isPending}
            className="flex-1 h-10 items-center justify-center bg-slate-100 rounded active:bg-slate-200 disabled:opacity-50"
          >
            {uploadAvatar.isPending ? (
              <ActivityIndicator size="small" />
            ) : (
              <Text className="text-sm font-medium text-slate-700">Changer l&apos;image</Text>
            )}
          </Pressable>
        </View>

        <Pressable
          onPress={handleSaveProfile}
          disabled={updateProfile.isPending}
          className="h-11 items-center justify-center bg-slate-900 rounded disabled:opacity-50"
        >
          {updateProfile.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-sm font-medium text-white">Enregistrer</Text>
          )}
        </Pressable>
      </View>

      {/* Mot de passe */}
      <View className="border border-slate-200 rounded p-4 mb-4">
        <Text className="text-xs font-semibold text-slate-500 uppercase mb-3">
          Changer le mot de passe
        </Text>

        <Text className="text-xs text-slate-700 mb-1">Mot de passe actuel</Text>
        <TextInput
          value={oldPassword}
          onChangeText={setOldPassword}
          secureTextEntry
          className="h-10 px-3 border border-slate-200 rounded bg-slate-50 mb-3"
        />

        <Text className="text-xs text-slate-700 mb-1">Nouveau mot de passe</Text>
        <TextInput
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          className="h-10 px-3 border border-slate-200 rounded bg-slate-50 mb-3"
        />

        <Text className="text-xs text-slate-700 mb-1">Confirmer le mot de passe</Text>
        <TextInput
          value={newPassword2}
          onChangeText={setNewPassword2}
          secureTextEntry
          className="h-10 px-3 border border-slate-200 rounded bg-slate-50 mb-3"
        />

        <Pressable
          onPress={handleChangePassword}
          disabled={changePwd.isPending}
          className="h-11 items-center justify-center bg-slate-900 rounded disabled:opacity-50"
        >
          {changePwd.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-sm font-medium text-white">Changer le mot de passe</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}
