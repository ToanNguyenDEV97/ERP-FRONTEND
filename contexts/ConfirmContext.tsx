import React, { createContext, useState, useCallback, useContext } from 'react';

interface ConfirmationOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'info';
}

interface ConfirmationContextType {
  confirm: (options: ConfirmationOptions) => Promise<boolean>;
  confirmationState: ConfirmationOptions | null;
  resolveConfirmation: (value: boolean) => void;
}

const ConfirmContext = createContext<ConfirmationContextType | undefined>(undefined);

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [confirmationState, setConfirmationState] = useState<ConfirmationOptions | null>(null);
    const [resolver, setResolver] = useState<{ resolve: (value: boolean) => void } | null>(null);

    const confirm = useCallback((options: ConfirmationOptions) => {
        return new Promise<boolean>((resolve) => {
            setConfirmationState(options);
            setResolver({ resolve });
        });
    }, []);

    const resolveConfirmation = (value: boolean) => {
        if (resolver) {
            resolver.resolve(value);
            setConfirmationState(null);
            setResolver(null);
        }
    };
    
    return (
        <ConfirmContext.Provider value={{ confirm, confirmationState, resolveConfirmation }}>
            {children}
        </ConfirmContext.Provider>
    );
};


export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (context === undefined) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context.confirm;
};

export const useConfirmationState = () => {
    const context = useContext(ConfirmContext);
    if (context === undefined) {
      throw new Error('useConfirmationState must be used within a ConfirmProvider');
    }
    return {
        confirmationState: context.confirmationState,
        resolveConfirmation: context.resolveConfirmation,
    };
};
