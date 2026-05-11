import { Card, CardHeader, CardTitle, CardContent, Button } from '@reset/ui';

export function App() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Reset Egypt — Réservation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-text-secondary">
            Cette page sera la borne de réservation publique (Module 7, Phase 7).
          </p>
          <p className="text-xs text-text-tertiary">
            Squelette Phase 1 — aucune fonctionnalité métier ici.
          </p>
          <Button variant="primary" disabled>
            Réserver une séance (bientôt)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
