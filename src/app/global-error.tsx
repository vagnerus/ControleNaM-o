'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body className="font-body antialiased">
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-background p-4 text-foreground">
          <div className="flex max-w-md flex-col items-center text-center space-y-4">
             <div className="p-4 bg-destructive/10 rounded-full">
                <AlertTriangle className="h-10 w-10 text-destructive" />
             </div>
            <h1 className="text-2xl font-bold">Erro Crítico</h1>
            <p className="text-muted-foreground">
              Ocorreu um erro fatal que impediu o carregamento da aplicação.
            </p>
            {error.message && (
                 <div className="text-xs bg-muted p-2 rounded text-left w-full overflow-auto max-h-32 font-mono">
                    {error.message}
                </div>
            )}
            <Button onClick={() => reset()} size="lg">
              Tentar novamente
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
