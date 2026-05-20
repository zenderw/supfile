import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Mail, Trash2, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { folderShareApi } from '@/lib/api/folder-share';
import { extractErrorMessage } from '@/lib/api-error';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId: string;
  folderName: string;
}

export function ShareFolderInternalDialog({ open, onOpenChange, folderId, folderName }: Props) {
  const qc = useQueryClient();
  const [email, setEmail] = useState('');

  const { data: shares } = useQuery({
    queryKey: ['folder-shares', folderId],
    queryFn: () => folderShareApi.listForFolder(folderId),
    enabled: open,
  });

  const share = useMutation({
    mutationFn: (e: string) => folderShareApi.share(folderId, e),
    onSuccess: () => {
      setEmail('');
      qc.invalidateQueries({ queryKey: ['folder-shares', folderId] });
      toast.success('Dossier partagé');
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const revoke = useMutation({
    mutationFn: (userId: string) => folderShareApi.revoke(folderId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['folder-shares', folderId] });
      toast.success('Partage retiré');
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    share.mutate(email.trim());
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Partager « {folderName} » avec un utilisateur</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="py-4 space-y-3">
          <Label htmlFor="share-email">Email du destinataire</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="share-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="pl-9"
                required
              />
            </div>
            <Button type="submit" disabled={share.isPending}>
              <UserPlus className="h-4 w-4 mr-1" />
              Partager
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            La personne pourra consulter et télécharger le contenu du dossier, mais pas le modifier.
          </p>
        </form>

        {shares && shares.length > 0 && (
          <div className="space-y-2">
            <Label>Déjà partagé avec</Label>
            <div className="border rounded-md divide-y">
              {shares.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 text-sm">
                  <div>
                    <div className="font-medium">{s.toUser.displayName}</div>
                    <div className="text-xs text-muted-foreground">{s.toUser.email}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => revoke.mutate(s.toUser.id)}
                    aria-label="Retirer le partage"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="ghost">
              Fermer
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
