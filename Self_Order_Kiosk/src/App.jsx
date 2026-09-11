import React from 'react';
import { KioskProvider } from './context/KioskContext';
import MainLayout from './components/MainLayout';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  return (
    <KioskProvider>
      <ErrorBoundary>
        <MainLayout />
      </ErrorBoundary>
    </KioskProvider>
  );
}
