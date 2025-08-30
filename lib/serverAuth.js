import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

// Server-side auth helpers (for Server Components only)
export const serverAuth = {
  // Get session on server side (for Server Components)
  async getSession() {
    try {
      const cookieStore = cookies()
      const supabaseServer = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll()
            },
            setAll(/* cookiesToSet */) {
              // Server components can't set cookies
            },
          },
        }
      )
      const { data: { session }, error } = await supabaseServer.auth.getSession()
      if (error) throw error
      return session
    } catch (error) {
      console.error('Error getting server session:', error)
      return null
    }
  },

  // Get user on server side (for Server Components)
  async getUser() {
    try {
      const cookieStore = cookies()
      const supabaseServer = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll()
            },
            setAll(/* cookiesToSet */) {
              // Server components can't set cookies
            },
          },
        }
      )
      const { data: { user }, error } = await supabaseServer.auth.getUser()
      if (error) throw error
      return user
    } catch (error) {
      console.error('Error getting server user:', error)
      return null
    }
  },

  // Create Supabase client for server components
  createServerClient() {
    const cookieStore = cookies()
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(/* cookiesToSet */) {
            // Server components can't set cookies
          },
        },
      }
    )
  }
}
