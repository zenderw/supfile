import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Link, router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { Alert, KeyboardAvoidingView, Platform, Text, View } from 'react-native';

import { FormField } from '@/components/FormField';
import { GoogleButton } from '@/components/GoogleButton';
import { PrimaryButton } from '@/components/PrimaryButton';
import { authApi } from '@/lib/api/auth';
import { extractErrorMessage } from '@/lib/api-error';
import { startGoogleOAuth } from '@/lib/oauth';
import { type RegisterInput, registerSchema } from '@/lib/validators/auth';
import { useAuthStore } from '@/stores/auth.store';

export default function RegisterScreen() {
  const setSession = useAuthStore((s) => s.setSession);

  const { control, handleSubmit } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', displayName: '' },
  });

  const mutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      setSession(data.user, data.accessToken, data.refreshToken);
      router.replace('/');
    },
    onError: (err) => {
      Alert.alert('Inscription impossible', extractErrorMessage(err));
    },
  });

  async function handleGoogle() {
    try {
      const { idToken } = await startGoogleOAuth();
      const data = await authApi.loginWithGoogleIdToken(idToken);
      setSession(data.user, data.accessToken, data.refreshToken);
      router.replace('/');
    } catch (err) {
      Alert.alert('Connexion Google impossible', extractErrorMessage(err));
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-slate-50"
    >
      <View className="flex-1 justify-center px-6">
        <View className="space-y-6 rounded-lg bg-white p-6 shadow-sm">
          <View>
            <Text className="text-2xl font-bold text-slate-900">Créer un compte</Text>
            <Text className="mt-1 text-sm text-slate-500">Rejoignez SUPFile</Text>
          </View>

          <GoogleButton onPress={handleGoogle} />

          <View className="flex-row items-center">
            <View className="h-px flex-1 bg-slate-200" />
            <Text className="mx-3 text-xs uppercase text-slate-400">ou</Text>
            <View className="h-px flex-1 bg-slate-200" />
          </View>

          <View className="space-y-4">
            <FormField
              control={control}
              name="displayName"
              label="Nom d'affichage"
              autoComplete="name"
            />
            <FormField
              control={control}
              name="email"
              label="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            <FormField
              control={control}
              name="password"
              label="Mot de passe"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
            />

            <PrimaryButton
              onPress={handleSubmit((v) => mutation.mutate(v))}
              label="Créer le compte"
              loading={mutation.isPending}
            />
          </View>

          <View className="flex-row justify-center">
            <Text className="text-sm text-slate-500">Déjà inscrit ? </Text>
            <Link href="/login" className="text-sm font-medium text-blue-600">
              Se connecter
            </Link>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
