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
import { type LoginInput, loginSchema } from '@/lib/validators/auth';
import { useAuthStore } from '@/stores/auth.store';

export default function LoginScreen() {
  const setSession = useAuthStore((s) => s.setSession);

  const { control, handleSubmit } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setSession(data.user, data.accessToken, data.refreshToken);
      router.replace('/');
    },
    onError: (err) => {
      Alert.alert('Connexion impossible', extractErrorMessage(err));
    },
  });

  function handleGoogle() {
    router.push('/google-auth');
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-slate-50"
    >
      <View className="flex-1 justify-center px-6">
        <View className="space-y-6 rounded-lg bg-white p-6 shadow-sm">
          <View>
            <Text className="text-2xl font-bold text-slate-900">Connexion</Text>
            <Text className="mt-1 text-sm text-slate-500">Accédez à votre espace SUPFile</Text>
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
              autoComplete="current-password"
            />

            <PrimaryButton
              onPress={handleSubmit((v) => mutation.mutate(v))}
              label="Se connecter"
              loading={mutation.isPending}
            />
          </View>

          <View className="flex-row justify-center">
            <Text className="text-sm text-slate-500">Pas de compte ? </Text>
            <Link href="/register" className="text-sm font-medium text-blue-600">
              Créer un compte
            </Link>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
