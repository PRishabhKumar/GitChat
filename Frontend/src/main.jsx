import React from 'react';
import ReactDOM from 'react-dom/client';
import AppContent from './App';
import { AppProvider } from './context/AppContext';
import { ToastProvider } from './context/ToastContext';
import './styles/globals.css';
import './styles/animations.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ToastProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ToastProvider>
  </React.StrictMode>
);
