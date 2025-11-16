import React, { ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { MessageSquare, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ChatErrorBoundaryProps {
  children: ReactNode;
}

const ChatErrorFallback: React.FC<{ onReset: () => void }> = ({ onReset }) => {
  return (
    <div className="flex items-center justify-center p-8">
      <Alert className="max-w-lg">
        <MessageSquare className="h-5 w-5" />
        <AlertTitle>Chat Error</AlertTitle>
        <AlertDescription className="mt-2 space-y-3">
          <p>We couldn't load the chat interface. This might be due to a connection issue.</p>
          <Button onClick={onReset} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export const ChatErrorBoundary: React.FC<ChatErrorBoundaryProps> = ({ children }) => {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error('Chat error:', error, errorInfo);
  };

  return (
    <ErrorBoundary
      onError={handleError}
      fallback={<ChatErrorFallback onReset={() => window.location.reload()} />}
    >
      {children}
    </ErrorBoundary>
  );
};
