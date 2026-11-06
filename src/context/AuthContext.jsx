import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()

// Fields a user must fill in before they're allowed to order
export const REQUIRED_PROFILE_FIELDS = ['full_name', 'phone', 'address', 'city', 'province', 'postal_code']

// The profile lives in Supabase user_metadata under a namespaced `profile` key.
// (Google sign-in rewrites top-level keys like `full_name` on every login, so we
// keep our own copy separate to avoid it being overwritten.)
function readProfile(user) {
  const meta = user?.user_metadata || {}
  const saved = meta.profile || {}
  return {
    full_name: saved.full_name || meta.full_name || meta.name || '',
    phone: saved.phone || '',
    company: saved.company || '',
    address: saved.address || '',
    city: saved.city || '',
    province: saved.province || '',
    postal_code: saved.postal_code || '',
    address_notes: saved.address_notes || '',
  }
}

function hasCompleteProfile(user) {
  const saved = user?.user_metadata?.profile
  if (!saved) return false
  return REQUIRED_PROFILE_FIELDS.every(key => String(saved[key] || '').trim() !== '')
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Staff / admin role (null for regular customers). Table is created by supabase/schema.sql.
  const [role, setRole] = useState(null)
  useEffect(() => {
    if (!user) { setRole(null); return }
    let cancelled = false
    supabase.from('user_roles').select('role').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => { if (!cancelled) setRole(data?.role ?? null) })
    return () => { cancelled = true }
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  const signUp = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: fullName ? { full_name: fullName } : undefined,
      },
    })
    return { data, error }
  }

  const signInWithGoogle = async () => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      if (supabaseUrl && supabaseAnonKey) {
        const res = await fetch(`${supabaseUrl}/auth/v1/settings`, {
          headers: { apikey: supabaseAnonKey },
        })
        if (res.ok) {
          const settings = await res.json()
          if (!settings?.external?.google) {
            return {
              data: null,
              error: new Error(
                'Provider Google belum diaktifkan di Supabase (Authentication → Providers → Google).'
              ),
            }
          }
        }
      }
    } catch {
      // If settings check fails due to network, fall through to standard OAuth call
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const resetPassword = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    return { data, error }
  }

  // Save contact & shipping details to the user's account
  const updateProfile = async (values) => {
    const { data, error } = await supabase.auth.updateUser({
      data: { profile: { ...values, updated_at: new Date().toISOString() } },
    })
    if (data?.user) setUser(data.user)
    return { data, error }
  }

  const isEmailAdmin = user?.email?.toLowerCase() === 'admin@gmail.com'
  const effectiveRole = role || (isEmailAdmin ? 'admin' : null)
  const isStaff = effectiveRole === 'staff' || effectiveRole === 'admin'
  const isAdmin = effectiveRole === 'admin'
  const profile = readProfile(user)
  const isProfileComplete = isStaff || hasCompleteProfile(user)

  return (
    <AuthContext.Provider
      value={{
        user, session, loading, profile, isProfileComplete,
        role: effectiveRole, isStaff, isAdmin,
        signIn, signUp, signInWithGoogle, signOut, resetPassword, updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
