import React from 'react';
import { KioskProvider } from './context/KioskContext';
import MainLayout from './components/MainLayout';

export default function App() {
  return (
    <KioskProvider>
      <MainLayout />
    </KioskProvider>
  );
}
