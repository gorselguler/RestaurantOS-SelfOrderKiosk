import React from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { DashboardLayout } from './components/layout/DashboardLayout'
import { useLiveOrders } from './hooks/useLiveOrders'
import AuthScreen from './pages/AuthScreen'

function AppContent() {
  const { user, loading } = useAuth()
  const liveOrdersHook = useLiveOrders()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C2410C]"></div>
      </div>
    )
  }

  if (!user) {
    return <AuthScreen />
  }

  return <DashboardLayout liveOrdersHook={liveOrdersHook} />
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
