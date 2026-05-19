import { useQuery } from '@tanstack/react-query';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { formatBytes } from '@/components/files/FileRow';
import { Button } from '@/components/ui/button';
import { statsApi } from '@/lib/api/stats';
import { useAuthStore } from '@/stores/auth.store';

export function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const navigate = useNavigate();

  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: () => statsApi.me(),
  });

  function handleLogout() {
    clear();
    navigate('/login', { replace: true });
  }

  if (!user) return null;

  const usedPct = stats ? Math.min(100, (Number(stats.usedSpace) / Number(stats.quota)) * 100) : 0;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Paramètres</h1>

      <section className="border rounded-lg p-6 space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase">Profil</h2>
        <div className="space-y-3">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Nom d'affichage</div>
            <div className="text-base">{user.displayName}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Email</div>
            <div className="text-base">{user.email}</div>
          </div>
        </div>
      </section>

      {stats && (
        <section className="border rounded-lg p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase">Stockage</h2>
            {stats.plan && (
              <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary font-medium">
                Plan {stats.plan}
              </span>
            )}
          </div>
          <div className="flex items-baseline justify-between text-sm">
            <span>Espace utilisé</span>
            <span>
              {formatBytes(stats.usedSpace)} / {formatBytes(stats.quota)}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${usedPct}%` }} />
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.totalFiles} fichier{stats.totalFiles > 1 ? 's' : ''} · {stats.totalFolders}{' '}
            dossier{stats.totalFolders > 1 ? 's' : ''}
          </p>
        </section>
      )}

      <section className="border rounded-lg p-6 space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase">Session</h2>
        <p className="text-sm text-muted-foreground">
          Vous êtes connecté en tant que {user.email}.
        </p>
        <Button variant="destructive" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Se déconnecter
        </Button>
      </section>
    </div>
  );
}
