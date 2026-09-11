import React, { useState } from 'react'
import { Sidebar, NAVIGATION_CATEGORIES } from './Sidebar'
import { Header } from './Header'
import { PinAuthModal } from '../auth/PinAuthModal'
import { useAuth } from '../../context/AuthContext'

// Pages
import { AdminDashboard } from '../../pages/AdminDashboard'
import { Reports } from '../../pages/Reports'
import { ShiftSummaries } from '../../pages/ShiftSummaries'
import { LiveOrders } from '../../pages/LiveOrders'
import { MenuManagement } from '../../pages/MenuManagement'
import { Inventory } from '../../pages/Inventory'
import { Staff } from '../../pages/Staff'
import { OrderHistory } from '../../pages/OrderHistory'
import { DeviceManagement } from '../../pages/DeviceManagement'
import { PaymentSettings } from '../../pages/PaymentSettings'
import { RestaurantProfile } from '../../pages/RestaurantProfile'

export const DashboardLayout = ({ liveOrdersHook }) => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isPinModalOpen, setIsPinModalOpen] = useState(false)

  // Find Category and Title for active tab
  let activeTabTitle = 'Dashboard'
  let activeCategory = 'Analyzes'

  for (const cat of NAVIGATION_CATEGORIES) {
    const found = cat.items.find(i => i.id === activeTab)
    if (found) {
      activeTabTitle = found.label
      activeCategory = cat.label
      break
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      // 📊 Analyzes
      case 'dashboard':
        return <AdminDashboard onNavigate={setActiveTab} />
      case 'reports':
        return <Reports />
      case 'shifts':
        return <ShiftSummaries />

      // 🍔 Operation
      case 'live-orders':
        return <LiveOrders liveOrdersHook={liveOrdersHook} />
      case 'menu':
        return <MenuManagement />
      case 'inventory':
        return <Inventory />

      // 👥 Management
      case 'staff':
        return <Staff />
      case 'order-history':
        return <OrderHistory />

      // ⚙️ System Settings
      case 'devices':
        return <DeviceManagement />
      case 'payments':
        return <PaymentSettings />
      case 'profile':
        return <RestaurantProfile />

      default:
        return <AdminDashboard onNavigate={setActiveTab} />
    }
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#FAFAF9] font-sans">
      
      {/* 1. Collapsible Global Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        pendingCount={liveOrdersHook?.counts?.pending_payment || 0}
        onQuickLock={() => setIsPinModalOpen(true)}
      />

      {/* 2. Main Content View Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <Header
          activeTabTitle={activeTabTitle}
          activeCategory={activeCategory}
          pendingCount={liveOrdersHook?.counts?.pending_payment || 0}
          onQuickLock={() => setIsPinModalOpen(true)}
          onSimulateOrder={liveOrdersHook?.simulateNewIncomingOrder}
        />

        <main className="flex-1 h-[calc(100vh-5rem)] overflow-hidden">
          {renderContent()}
        </main>
      </div>

      {/* 3. Quick Floor PIN Lock Modal */}
      <PinAuthModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={() => setIsPinModalOpen(false)}
        currentStaff={user}
      />
    </div>
  )
}
