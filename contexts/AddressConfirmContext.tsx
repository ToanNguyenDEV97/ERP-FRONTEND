import React, { createContext, useState, useCallback, useContext } from 'react';
import { Order, Customer } from '../types';

export interface AddressConfirmationOptions {
  order: Order;
  customer: Customer;
}

export interface AddressConfirmationResult {
    name: string;
    phone: string;
    address: string;
}

interface AddressConfirmationContextType {
  confirmAddress: (options: AddressConfirmationOptions) => Promise<AddressConfirmationResult | null>;
  confirmationState: AddressConfirmationOptions | null;
  resolveConfirmation: (value: AddressConfirmationResult | null) => void;
}

const AddressConfirmContext = createContext<AddressConfirmationContextType | undefined>(undefined);

export const AddressConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [confirmationState, setConfirmationState] = useState<AddressConfirmationOptions | null>(null);
    const [resolver, setResolver] = useState<{ resolve: (value: AddressConfirmationResult | null) => void } | null>(null);

    const confirmAddress = useCallback((options: AddressConfirmationOptions) => {
        return new Promise<AddressConfirmationResult | null>((resolve) => {
            setConfirmationState(options);
            setResolver({ resolve });
        });
    }, []);

    const resolveConfirmation = (value: AddressConfirmationResult | null) => {
        if (resolver) {
            resolver.resolve(value);
            setConfirmationState(null);
            setResolver(null);
        }
    };
    
    return (
        <AddressConfirmContext.Provider value={{ confirmAddress, confirmationState, resolveConfirmation }}>
            {children}
        </AddressConfirmContext.Provider>
    );
};

export const useAddressConfirm = () => {
  const context = useContext(AddressConfirmContext);
  if (context === undefined) {
    throw new Error('useAddressConfirm must be used within a AddressConfirmProvider');
  }
  return context.confirmAddress;
};

export const useAddressConfirmationState = () => {
    const context = useContext(AddressConfirmContext);
    if (context === undefined) {
      throw new Error('useAddressConfirmationState must be used within a AddressConfirmProvider');
    }
    return {
        confirmationState: context.confirmationState,
        resolveConfirmation: context.resolveConfirmation,
    };
};