'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/auth'
import { toast, toastMessages } from '@/lib/toast'

export default function Navbar({ user, onToggleSidebar }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    try {
      setLoading(true)
      await auth.signOut()
      toast.success(toastMessages.auth.logoutSuccess)
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
      toast.warning('Logout may have failed, but you will be redirected for security.')
      // Even if there's an error, redirect to home
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  return (
    <nav className="bg-white shadow-soft border-b border-gray-200">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-deep-blue hover:text-teal hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal transition-colors"
              onClick={onToggleSidebar}
              aria-label="Toggle sidebar"
            >
              <svg
                className="h-6 w-6"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {/* Brand */}
            <div className="flex-shrink-0 ml-4 md:ml-0">
              <h1 className="text-2xl font-bold text-deep-blue">
                ClientPortal
              </h1>
            </div>
          </div>

          {/* Right side - User info and logout */}
          <div className="flex items-center space-x-4">
            {/* User info */}
            <div className="hidden sm:flex sm:items-center sm:space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-deep-blue">
                  {user?.name || user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user?.role || 'Client'}
                </p>
              </div>
              <div className="w-8 h-8 bg-teal rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              disabled={loading}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-deep-blue hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-deep-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing out...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
