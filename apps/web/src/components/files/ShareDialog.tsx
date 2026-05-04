import { useMutation } from '@tanstack/react-query';
import { Check, Copy } from 'lucide-react';
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
import { shareApi, type ShareLink } from '@/lib/api/share';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileId: string;
  fileName: string;
}

const EXPIRY_OPTIONS = [
  { label: 'Jamais', hours: undefined },
  { label: '1 heure', hours: 1 },
  { label: '1 jour', hours: 24 },
  { label: '7 jours', hours: 24 * 7 },
  { label: '30 jours', hours: 24 * 30 },
];

export function ShareDialog({ open, onOpenChange, fileId, fileName }: Props) {
  const [password, setPassword] = useState('');
  const [expiryIdx, setExpiryIdx] = useState(0);
  const [link, setLink] = useState<ShareLink | null>(null);
  const [copied, setCopied] = useState(false);

  const create = useMutation({
    mutationFn: () =>
      shareApi.create(fileId, {
        password: password.trim() || undefined,
        expiresInHours: EXPIRY_OPTIONS[expiryIdx].hours,
      }),
    onSuccess: (l) => {
      setLink(l);
      toast.success('Lien créé');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function reset() {
    setPassword('');
    setExpiryIdx(0);
    setLink(null);
    setCopied(false);
  }

  function handleOpenChange(o: boolean) {
    if (!o) reset();
    onOpenChange(o);
  }

  async function copy() {
    if (!link) return;
    const url = shareApi.buildShareUrl(link.token);
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Partager « {fileName} »</DialogTitle>
        </DialogHeader>

        {!link ? (
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="share-password">Mot de passe (optionnel)</Label>
              <Input
                id="share-password"
                type="password"
                placeholder="Laisser vide pour aucun"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="share-expiry">Expiration</Label>
              <select
                id="share-expiry"
                value={expiryIdx}
                onChange={(e) => setExpiryIdx(Number(e.target.value))}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                {EXPIRY_OPTIONS.map((o, i) => (
                  <option key={o.label} value={i}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="py-4 space-y-3">
            <Label>Lien public</Label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={shareApi.buildShareUrl(link.token)}
                className="font-mono text-xs"
              />
              <Button onClick={copy} variant="outline" size="icon">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {link.hasPassword ? 'Protégé par mot de passe. ' : ''}
              {link.expiresAt
                ? `Expire le ${new Date(link.expiresAt).toLocaleString()}.`
                : 'Sans expiration.'}
            </p>
          </div>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="ghost">
              Fermer
            </Button>
          </DialogClose>
          {!link && (
            <Button onClick={() => create.mutate()} disabled={create.isPending}>
              {create.isPending ? 'Création...' : 'Créer le lien'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
