import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Copy, Link2, Lock, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { formatBytes } from '@/components/files/FileRow';
import { Button } from '@/components/ui/button';
import { shareApi, type ShareLink } from '@/lib/api/share';

function formatExpiry(iso: string | null): string {
  if (!iso) return 'Sans expiration';
  const d = new Date(iso);
  if (d < new Date()) return 'Expiré';
  return `Expire le ${d.toLocaleDateString()} à ${d.toLocaleTimeString().slice(0, 5)}`;
}

export function SharedPage() {
  const qc = useQueryClient();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['share-mine'],
    queryFn: () => shareApi.listMine(),
  });

  const revoke = useMutation({
    mutationFn: (id: string) => shareApi.revoke(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['share-mine'] });
      toast.success('Lien révoqué');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function copy(link: ShareLink) {
    const url = shareApi.buildShareUrl(link.token);
    await navigator.clipboard.writeText(url);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Chargement...</p>;
  if (!data) return null;

  const active = data.filter((l) => !l.revokedAt);
  const revoked = data.filter((l) => l.revokedAt);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mes partages</h1>
        <p className="text-sm text-muted-foreground mt-1">Liens publics que vous avez créés.</p>
      </div>

      {active.length === 0 && revoked.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Aucun lien de partage. Allez sur « Mes fichiers » et utilisez l'action « Partager ».
        </p>
      )}

      {active.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase">
            Actifs ({active.length})
          </h2>
          <div className="border rounded-lg divide-y">
            {active.map((l) => (
              <div key={l.id} className="p-4 flex items-center gap-4">
                <Link2 className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {l.file?.name ?? l.fileName ?? 'Fichier'}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    {l.file?.size && <span>{formatBytes(l.file.size)}</span>}
                    <span>{formatExpiry(l.expiresAt)}</span>
                    {l.hasPassword && (
                      <span className="flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        Protégé
                      </span>
                    )}
                    {typeof l.downloads === 'number' && (
                      <span>
                        {l.downloads} téléchargement{l.downloads > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => copy(l)}>
                  {copiedId === l.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => revoke.mutate(l.id)}
                  disabled={revoke.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      {revoked.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase">
            Révoqués ({revoked.length})
          </h2>
          <div className="border rounded-lg divide-y opacity-60">
            {revoked.map((l) => (
              <div key={l.id} className="p-4 flex items-center gap-4">
                <Link2 className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate line-through">
                    {l.file?.name ?? l.fileName ?? 'Fichier'}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Lien révoqué</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
