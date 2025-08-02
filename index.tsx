import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ToastProvider } from './contexts/ToastContext';
import { ConfirmProvider } from './contexts/ConfirmContext';
import { AddressConfirmProvider } from './contexts/AddressConfirmContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ToastProvider>
      <ConfirmProvider>
        <AddressConfirmProvider>
          <App />
        </AddressConfirmProvider>
      </ConfirmProvider>
    </ToastProvider>
  </React.StrictMode>
);
