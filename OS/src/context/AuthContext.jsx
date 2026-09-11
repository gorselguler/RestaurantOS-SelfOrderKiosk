import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get session
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      
      if (session?.user) {
        await fetchProfile(session.user)
      } else {
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen to Auth State Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      if (session?.user) {
        await fetchProfile(session.user)
      } else {
        setUser(null)
        setRole(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (authUser) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, restaurant_id, full_name, restaurants(name, currency)')
        .eq('id', authUser.id)
        .single()

      if (error) throw error

      setUser({
        ...authUser,
        id: authUser.id,
        restaurant_id: data?.restaurant_id,
        name: data?.full_name || authUser.user_metadata?.companyName || authUser.email,
        email: authUser.email,
        role: data?.role || 'admin',
        restaurantName: data?.restaurants?.name || authUser.user_metadata?.companyName || 'Restaurant OS',
        currency: data?.restaurants?.currency || 'PLN',
        avatar: `https://ui-avatars.com/api/?name=${authUser.email || 'A'}&background=C2410C&color=fff`
      })
      
      setRole(data?.role || 'admin')
    } catch (error) {
      console.error('Profil bilgisi çekilirken hata oluştu:', error)
      setUser({
        ...authUser,
        id: authUser.id,
        restaurant_id: authUser.user_metadata?.restaurant_id || null,
        name: authUser.user_metadata?.companyName || authUser.email,
        role: 'admin',
        restaurantName: authUser.user_metadata?.companyName || 'Restaurant OS',
        currency: 'PLN',
        avatar: `https://ui-avatars.com/api/?name=${authUser.email || 'A'}&background=C2410C&color=fff`
      })
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
  }

  const switchRole = () => {
    console.warn("Gerçek auth modunda manuel rol değiştirme kapalıdır.")
  }

  const toggleRole = () => {
    console.warn("Gerçek auth modunda manuel rol değiştirme kapalıdır.")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        restaurant_id: user?.restaurant_id,
        isAdmin: role === 'admin',
        isCashier: role === 'cashier',
        loading,
        logout,
        switchRole,
        toggleRole
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
