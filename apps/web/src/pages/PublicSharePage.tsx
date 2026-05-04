import { useQuery } from '@tanstack/react-query';
import { Download, Lock } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { shareApi } from '@/lib/api/share';

function formatBytes(s: string): string {
  const n = Number(s);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function PublicSharePage() {
  const { token } = useParams<{ token: string }>();
  const [password, setPassword] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const meta = useQuery({
    queryKey: ['public-share', token],
    queryFn: () => shareApi.getPublicMeta(token!),
    enabled: !!token,
    retry: false,
  });

  if (!token) return null;

  if (meta.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (meta.error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-2">
          <h1 className="text-2xl font-bold">Lien indisponible</h1>
          <p className="text-muted-foreground text-sm">
            {meta.error instanceof Error
              ? meta.error.message
              : "Ce lien n'existe pas, a expiré ou a été révoqué."}
          </p>
        </div>
      </div>
    );
  }

  if (!meta.data) return null;

  const needsPassword = meta.data.requiresPassword && !unlocked;

  async function verifyAndUnlock() {
    setVerifying(true);
    try {
      await shareApi.verifyPassword(token!, password);
      setUnlocked(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Échec');
    } finally {
      setVerifying(false);
    }
  }

  function startDownload() {
    const url = shareApi.buildDownloadUrl(
      token!,
      meta.data?.requiresPassword ? password : undefined,
    );
    window.location.href = url;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-muted/20">
      <div className="bg-background border rounded-lg shadow-sm p-6 w-full max-w-md space-y-5">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Fichier partagé</p>
          <h1 className="text-xl font-bold truncate">{meta.data.name}</h1>
          <p className="text-sm text-muted-foreground">{formatBytes(meta.data.size)}</p>
        </div>

        {needsPassword ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="h-4 w-4" />
              Ce fichier est protégé par mot de passe.
            </div>
            <div className="space-y-2">
              <Label htmlFor="pwd">Mot de passe</Label>
              <Input
                id="pwd"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') verifyAndUnlock();
                }}
              />
            </div>
            <Button onClick={verifyAndUnlock} disabled={!password || verifying} className="w-full">
              {verifying ? 'Vérification...' : 'Déverrouiller'}
            </Button>
          </div>
        ) : (
          <Button onClick={startDownload} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Télécharger
          </Button>
        )}

        {meta.data.expiresAt && (
          <p className="text-xs text-muted-foreground text-center">
            Lien valable jusqu'au {new Date(meta.data.expiresAt).toLocaleString()}.
          </p>
        )}
      </div>
    </div>
  );
}
