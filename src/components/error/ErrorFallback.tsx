import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  onReset: () => void;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, errorInfo, onReset }) => {
  const isDevelopment = import.meta.env.DEV;

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <div>
              <CardTitle className="text-2xl">Something went wrong</CardTitle>
              <CardDescription className="mt-2">
                We're sorry, but something unexpected happened. Please try refreshing the page.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button onClick={onReset} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            <Button onClick={handleGoHome} variant="outline" className="gap-2">
              <Home className="h-4 w-4" />
              Go Home
            </Button>
          </div>

          {isDevelopment && error && (
            <div className="mt-6 space-y-3">
              <div className="text-sm font-semibold text-muted-foreground">
                Development Error Details:
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-mono text-destructive mb-2">
                  {error.name}: {error.message}
                </p>
                {error.stack && (
                  <pre className="text-xs overflow-auto max-h-64 text-muted-foreground">
                    {error.stack}
                  </pre>
                )}
              </div>
              {errorInfo?.componentStack && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-semibold mb-2">Component Stack:</p>
                  <pre className="text-xs overflow-auto max-h-64 text-muted-foreground">
                    {errorInfo.componentStack}
                  </pre>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
