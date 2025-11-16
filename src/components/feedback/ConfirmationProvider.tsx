import React, { createContext, useContext, ReactNode } from 'react';
import { useConfirmation, ConfirmationOptions } from '@/hooks/useConfirmation';
import { ConfirmationDialog } from './ConfirmationDialog';

interface ConfirmationContextValue {
  confirm: (options: ConfirmationOptions) => void;
}

const ConfirmationContext = createContext<ConfirmationContextValue | null>(null);

export const useConfirmationDialog = () => {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error('useConfirmationDialog must be used within ConfirmationProvider');
  }
  return context;
};

interface ConfirmationProviderProps {
  children: ReactNode;
}

export const ConfirmationProvider: React.FC<ConfirmationProviderProps> = ({ children }) => {
  const { state, confirm, close } = useConfirmation();

  return (
    <ConfirmationContext.Provider value={{ confirm }}>
      {children}
      <ConfirmationDialog
        open={state.isOpen}
        onOpenChange={close}
        title={state.title}
        description={state.description}
        confirmText={state.confirmText}
        cancelText={state.cancelText}
        variant={state.variant}
        onConfirm={state.onConfirm}
        loading={state.loading}
      />
    </ConfirmationContext.Provider>
  );
};
