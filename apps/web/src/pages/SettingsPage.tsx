import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LogOut, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { formatBytes } from '@/components/files/FileRow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/lib/api/auth';
import { statsApi } from '@/lib/api/stats';
import { extractErrorMessage } from '@/lib/api-error';
import { useAuthStore } from '@/stores/auth.store';

export function SettingsPage() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();

  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: () => statsApi.me(),
  });

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
      qc.invalidateQueries({ queryKey: ['stats'] });
      toast.success('Profil mis à jour');
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const changePwd = useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => {
      setOldPassword('');
      setNewPassword('');
      setNewPassword2('');
      toast.success('Mot de passe modifié');
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const patch: { email?: string; displayName?: string; avatarUrl?: string | null } = {};
    if (displayName.trim() !== user.displayName) patch.displayName = displayName.trim();
    if (email.trim() !== user.email) patch.email = email.trim();
    const cleanAvatar = avatarUrl.trim() || null;
    if (cleanAvatar !== (user.avatarUrl ?? null)) patch.avatarUrl = cleanAvatar;
    if (Object.keys(patch).length === 0) {
      toast.info('Aucun changement à enregistrer');
      return;
    }
    updateProfile.mutate(patch);
  }

  function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== newPassword2) {
      toast.error('Les deux mots de passe ne correspondent pas');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Le mot de passe doit faire au moins 8 caractères');
      return;
    }
    changePwd.mutate({ oldPassword, newPassword });
  }

  function handleLogout() {
    clear();
    navigate('/login', { replace: true });
  }

  if (!user) return null;

  const usedPct = stats ? Math.min(100, (Number(stats.usedSpace) / Number(stats.quota)) * 100) : 0;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Paramètres</h1>

      <form onSubmit={handleSaveProfile} className="border rounded-lg p-6 space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase">Profil</h2>

        <div className="space-y-1">
          <Label htmlFor="displayName">Nom d'affichage</Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            minLength={2}
            maxLength={60}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="avatarUrl">URL de l'avatar</Label>
          <Input
            id="avatarUrl"
            type="url"
            placeholder="https://..."
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Lien vers une image (PNG, JPG). Laisser vide pour aucun avatar.
          </p>
        </div>

        <Button type="submit" disabled={updateProfile.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {updateProfile.isPending ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </form>

      <form onSubmit={handleChangePassword} className="border rounded-lg p-6 space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase">
          Changer le mot de passe
        </h2>

        <div className="space-y-1">
          <Label htmlFor="oldPwd">Mot de passe actuel</Label>
          <Input
            id="oldPwd"
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="newPwd">Nouveau mot de passe</Label>
          <Input
            id="newPwd"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="newPwd2">Confirmer le nouveau mot de passe</Label>
          <Input
            id="newPwd2"
            type="password"
            value={newPassword2}
            onChange={(e) => setNewPassword2(e.target.value)}
            required
            minLength={8}
          />
        </div>

        <Button type="submit" disabled={changePwd.isPending}>
          {changePwd.isPending ? 'Changement...' : 'Changer le mot de passe'}
        </Button>
      </form>

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
