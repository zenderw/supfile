import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { plansApi, type PlanId } from '@/lib/api/plans';

function fmtBytes(b: string): string {
  const n = Number(b);
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(0)} Mo`;
  if (n < 1024 ** 4) return `${(n / 1024 ** 3).toFixed(0)} Go`;
  return `${(n / 1024 ** 4).toFixed(1)} To`;
}

export function PricingPage() {
  const qc = useQueryClient();
  const { data: plans } = useQuery({
    queryKey: ['plans'],
    queryFn: () => plansApi.list(),
  });
  const { data: me } = useQuery({
    queryKey: ['plan-me'],
    queryFn: () => plansApi.me(),
  });

  const upgrade = useMutation({
    mutationFn: (target: PlanId) => plansApi.upgrade(target),
    onSuccess: (data) => {
      toast.success(`Vous êtes maintenant sur le plan ${data.plan}`);
      qc.invalidateQueries({ queryKey: ['plan-me'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!plans || !me) return <p className="text-sm text-muted-foreground">Chargement...</p>;

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold">Abonnement</h1>
        <p className="text-muted-foreground mt-2">
          Vous êtes actuellement sur le plan <strong>{me.plan}</strong>. Changez de plan à tout
          moment.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => {
          const isCurrent = p.id === me.plan;
          const isFree = p.id === 'FREE';
          return (
            <div
              key={p.id}
              className={`border rounded-lg p-6 space-y-4 ${
                p.id === 'PRO' ? 'border-primary shadow-md' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">{p.name}</h2>
                {p.id === 'PRO' && (
                  <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                    Populaire
                  </span>
                )}
              </div>
              <div>
                <span className="text-3xl font-bold">{p.priceMonthlyEur.toFixed(2)} €</span>
                <span className="text-muted-foreground"> / mois</span>
              </div>

              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  {fmtBytes(p.quotaBytes)} de stockage
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  {fmtBytes(p.maxFileBytes)} par fichier max
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  {p.maxActiveShareLinks} liens de partage actifs
                </li>
                <li className="flex items-center gap-2">
                  {p.passwordProtectedShares ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground" />
                  )}
                  Partage protégé par mot de passe
                </li>
                <li className="flex items-center gap-2">
                  {p.customExpiry ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground" />
                  )}
                  Expiration personnalisée
                </li>
                <li className="flex items-center gap-2">
                  {p.prioritySupport ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground" />
                  )}
                  Support prioritaire
                </li>
              </ul>

              {isCurrent ? (
                <Button disabled className="w-full">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Plan actuel
                </Button>
              ) : (
                <Button
                  className="w-full"
                  variant={p.id === 'PRO' ? 'default' : 'outline'}
                  disabled={upgrade.isPending}
                  onClick={() => upgrade.mutate(p.id)}
                >
                  {upgrade.isPending && upgrade.variables === p.id
                    ? '...'
                    : isFree
                      ? 'Passer au gratuit'
                      : 'Choisir ce plan'}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-xs text-muted-foreground pt-4 border-t">
        Démo : le changement de plan est instantané, sans paiement réel. En production, ce flux
        passerait par Stripe Checkout.
      </div>
    </div>
  );
}
