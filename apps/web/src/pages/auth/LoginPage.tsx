import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { GoogleButton } from '@/components/auth/GoogleButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/lib/api/auth';
import { extractErrorMessage } from '@/lib/api-error';
import { type LoginInput, loginSchema } from '@/lib/validators/auth';
import { useAuthStore } from '@/stores/auth.store';

export function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setSession(data.user, data.accessToken, data.refreshToken);
      toast.success(`Bonjour ${data.user.displayName}`);
      navigate('/');
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err));
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm space-y-6 bg-background p-8 rounded-lg border">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold">Connexion</h1>
          <p className="text-sm text-muted-foreground">Accédez à votre espace SUPFile</p>
        </div>

        <GoogleButton />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">ou</span>
          </div>
        </div>

        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...register('email')} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? 'Connexion...' : 'Se connecter'}
          </Button>
        </form>

        <p className="text-sm text-center text-muted-foreground">
          Pas de compte ?{' '}
          <Link to="/register" className="text-primary underline-offset-4 hover:underline">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}
