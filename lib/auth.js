import { supabase } from './supabaseClient'

// Client-side auth helpers
export const auth = {
  // Get current session on client side
  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      return session
    } catch (error) {
      console.error('Error getting session:', error)
      return null
    }
  },

  // Get current user on client side
  async getUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      return user
    } catch (error) {
      console.error('Error getting user:', error)
      return null
    }
  },

  // Sign in with email and password
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      return { user: data.user, session: data.session }
    } catch (error) {
      console.error('Error signing in:', error)
      throw error
    }
  },

  // Sign up with email and password
  async signUp(email, password) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      if (error) throw error
      return { user: data.user, session: data.session }
    } catch (error) {
      console.error('Error signing up:', error)
      throw error
    }
  },

  // Sign out
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  },

  // Listen to auth state changes
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Utility functions
export const authUtils = {
  // Check if user is authenticated
  isAuthenticated(session) {
    return session && session.user
  },

  // Check if session is expired
  isSessionExpired(session) {
    if (!session) return true
    return new Date(session.expires_at * 1000) < new Date()
  },

  // Get user role from session (if you have roles in your app)
  getUserRole(session) {
    return session?.user?.user_metadata?.role || 'user'
  },

  // Format user display name
  getUserDisplayName(user) {
    return user?.user_metadata?.full_name || user?.email || 'User'
  }
}
