import { Button } from '@/components/ui/button';

export function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">SUPFile</h1>
        <p className="text-muted-foreground">Plateforme de stockage cloud</p>
        <Button>Bouton de test shadcn</Button>
      </div>
    </div>
  );
}
