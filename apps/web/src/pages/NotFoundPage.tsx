import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold">404</h1>
        <p className="text-muted-foreground">Cette page n&apos;existe pas.</p>
        <Button asChild>
          <Link to="/">Retour à l&apos;accueil</Link>
        </Button>
      </div>
    </div>
  );
}
