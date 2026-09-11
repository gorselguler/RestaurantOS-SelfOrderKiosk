import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key'

// Supabase Client instance (Ready for production credentials)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Supabase Realtime Orders Subscription Helper
 * @param {Function} onInsert - Callback when a new order arrives
 * @param {Function} onUpdate - Callback when an existing order is updated
 * @returns {Function} Unsubscribe function
 */
export const subscribeToOrders = (onInsert, onUpdate) => {
  // If no active real Supabase project is connected yet, return a no-op cleanup
  if (supabaseUrl.includes('placeholder-project')) {
    return () => {}
  }

  const channel = supabase
    .channel('public:orders')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'orders' },
      (payload) => onInsert && onInsert(payload.new)
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'orders' },
      (payload) => onUpdate && onUpdate(payload.new)
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
