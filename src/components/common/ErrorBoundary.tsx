'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      if (this.props.fallback) {
          return this.props.fallback;
      }
      return (
        <div className="flex flex-col items-center justify-center h-full p-4 border border-dashed rounded-md bg-destructive/10 text-destructive">
          <h2 className="text-lg font-semibold">Algo deu errado.</h2>
          <p className="text-sm text-center">
            Um erro inesperado ocorreu nesta parte da aplicação.
          </p>
          <pre className="mt-2 text-xs text-left bg-destructive/20 p-2 rounded overflow-auto max-w-full">
            {this.state.error?.message || 'Erro desconhecido'}
          </pre>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4"
          >
            Tentar novamente
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;