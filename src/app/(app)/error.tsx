'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md border-destructive/50">
        <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
                <div className="p-3 bg-destructive/10 rounded-full">
                    <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
            </div>
            <CardTitle className="text-xl">Algo deu errado!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-2">
            <p className="text-muted-foreground">
                Ocorreu um erro inesperado ao carregar esta página.
            </p>
            {error.message && (
                <div className="text-xs bg-muted p-2 rounded text-left overflow-auto max-h-32 font-mono">
                    {error.message}
                </div>
            )}
        </CardContent>
        <CardFooter className="justify-center">
          <Button onClick={() => reset()} variant="default">
            Tentar novamente
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
