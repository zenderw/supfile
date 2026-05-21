import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/stores/auth.store';
import { useThemeStore } from '@/stores/theme.store';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggle);

  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPassword2, setNewPassword2] = useState('');

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName);
      setEmail(user.email);
      setAvatarUrl(user.avatarUrl ?? '');
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
    const patch: { email?: string; displayName?: string; avatarUrl?: string | null } = {};
    if (displayName.trim() !== user.displayName) patch.displayName = displayName.trim();
    if (email.trim() !== user.email) patch.email = email.trim();
    const cleanAvatar = avatarUrl.trim() || null;
    if (cleanAvatar !== (user.avatarUrl ?? null)) patch.avatarUrl = cleanAvatar;
    if (Object.keys(patch).length === 0) {
      Alert.alert('Info', 'Aucun changement à enregistrer');
      return;
    }
    updateProfile.mutate(patch);
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

        <Text className="text-xs text-slate-700 mb-1">URL de l'avatar</Text>
        <TextInput
          value={avatarUrl}
          onChangeText={setAvatarUrl}
          placeholder="https://..."
          autoCapitalize="none"
          autoCorrect={false}
          className="h-10 px-3 border border-slate-200 rounded bg-slate-50 mb-3"
        />

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

      {/* Thème */}
      <View className="border border-slate-200 rounded p-4 mb-4">
        <Text className="text-xs font-semibold text-slate-500 uppercase mb-3">Apparence</Text>
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-slate-900">
            Thème {theme === 'dark' ? 'sombre' : 'clair'}
          </Text>
          <Pressable
            onPress={toggleTheme}
            className="px-4 py-2 bg-slate-100 rounded active:bg-slate-200"
          >
            <Text className="text-sm font-medium text-slate-700">
              Passer en {theme === 'dark' ? 'clair' : 'sombre'}
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
