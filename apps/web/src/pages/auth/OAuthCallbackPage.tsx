import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/stores/auth.store';

export function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    const error = params.get('error');

    if (error) {
      toast.error('Connexion Google annulée ou refusée');
      navigate('/login', { replace: true });
      return;
    }

    if (!accessToken || !refreshToken) {
      toast.error('Réponse OAuth incomplète');
      navigate('/login', { replace: true });
      return;
    }

    (async () => {
      try {
        useAuthStore.getState().setAccessToken(accessToken);
        const user = await authApi.me();
        setSession(user, accessToken, refreshToken);
        toast.success(`Bonjour ${user.displayName}`);
        navigate('/', { replace: true });
      } catch {
        useAuthStore.getState().clear();
        toast.error('Impossible de récupérer votre profil');
        navigate('/login', { replace: true });
      }
    })();
  }, [params, navigate, setSession]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Connexion en cours...</p>
    </div>
  );
}
