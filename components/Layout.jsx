'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/supabaseClient'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import ToastProvider, { useToast } from './ToastProvider'
import { setToastInstance } from '@/lib/toast'

function LayoutContent({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const toast = useToast()

  // Set up the global toast instance
  useEffect(() => {
    setToastInstance(toast)
  }, [toast])

  useEffect(() => {
    const getUser = async () => {
      try {
        const session = await auth.getSession()
        
        if (!session?.user) {
          router.push('/auth')
          return
        }

        // Get user profile data
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (error) {
          // Handle specific error cases
          if (error.code === 'PGRST116') {
            // Auto-create missing profile
            try {
              const { error: createError } = await supabase
                .from('profiles')
                .insert([{
                  id: session.user.id,
                  name: session.user.email?.split('@')[0] || 'User',
                  email: session.user.email,
                  role: 'client'
                }])
              
              if (!createError) {
                // Set user with created profile
                setUser({
                  id: session.user.id,
                  email: session.user.email,
                  name: session.user.email?.split('@')[0] || 'User',
                  role: 'client'
                })
                return
              }
            } catch (createError) {
              // Profile creation failed, continue to fallback
            }
          }
          
          // Fallback to session data
          setUser({
            id: session.user.id,
            email: session.user.email,
            name: session.user.email?.split('@')[0] || 'User',
            role: 'client'
          })
        } else {
          setUser({
            id: session.user.id,
            email: session.user.email,
            ...profile
          })
        }
      } catch (error) {
        console.error('Error in auth check:', error)
        toast.error(toastMessages.auth.sessionExpired)
        router.push('/auth')
      } finally {
        setLoading(false)
      }
    }

    getUser()

    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const handleCloseSidebar = () => {
    setSidebarOpen(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-soft-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-deep-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to auth
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <Navbar user={user} onToggleSidebar={handleToggleSidebar} />
      
      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar 
          user={user} 
          isOpen={sidebarOpen} 
          onClose={handleCloseSidebar} 
        />
        
        {/* Main content */}
        <main className="flex-1 md:ml-0">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            {typeof children === 'function' ? children({ user }) : children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default function Layout({ children }) {
  return (
    <ToastProvider>
      <LayoutContent>
        {children}
      </LayoutContent>
    </ToastProvider>
  )
}
