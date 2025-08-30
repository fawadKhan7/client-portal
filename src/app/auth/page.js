'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '../../../lib/auth'
import { supabase } from '../../../lib/supabaseClient'
import { toast, toastMessages } from '../../../lib/toast'

export default function AuthPage() {
  const [formData, setFormData] = useState({
    isLogin: true,
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    loading: false,
    error: ''
  })
  const [initialLoading, setInitialLoading] = useState(true)
  const router = useRouter()

  // Update form data helper
  const updateForm = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Reset form helper
  const resetForm = () => {
    setFormData(prev => ({ 
      ...prev, 
      email: '', 
      password: '', 
      confirmPassword: '', 
      name: '', 
      error: '' 
    }))
  }

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await auth.getSession()
        if (session?.user) {
          // Only redirect if we have a valid session
          await redirectBasedOnRole(session.user)
          return // Don't set loading to false if redirecting
        }
      } catch (error) {
        console.error('Error checking auth:', error)
        // On error, don't redirect, just show the auth form
      } finally {
        setInitialLoading(false)
      }
    }
    checkAuth()
  }, [router])

  // Redirect user based on their role
  const redirectBasedOnRole = async (user) => {
    try {
      // Get user profile to determine role
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error getting user profile:', error)
        // Don't redirect on profile fetch error, let user try again
        updateForm('error', 'Failed to get user profile. Please try again.')
        return
      }

      const role = profile?.role || 'client' // Default to client if no profile
      
      if (role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error in redirect logic:', error)
      updateForm('error', 'Something went wrong. Please try again.')
    }
  }

  // Create profile record for new user
  const createUserProfile = async (user, userName) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .insert([
          {
            id: user.id,
            name: userName, // Use the actual name from the form
            email: user.email, // Store email for easier access
            role: 'client' // Default role
          }
        ])

      if (error && error.code !== '23505') { // 23505 = unique violation (profile already exists)
        throw error
      }
    } catch (error) {
      console.error('Error creating user profile:', error)
      // Don't throw here - profile creation failure shouldn't block auth
    }
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    updateForm('error', '')
    updateForm('loading', true)

    try {
      // Validation
      if (!formData.email || !formData.password) {
        throw new Error('Email and password are required')
      }

      if (!formData.isLogin && !formData.name) {
        throw new Error('Name is required for signup')
      }

      if (!formData.isLogin && formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match')
      }

      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters')
      }

      let result
      if (formData.isLogin) {
        // Login
        result = await auth.signIn(formData.email, formData.password)
        
        // Only redirect on successful login (user exists and no errors)
        if (result?.user && result?.session) {
          toast.success(toastMessages.auth.loginSuccess)
          await redirectBasedOnRole(result.user)
        } else if (result?.user && !result?.session) {
          // User exists but no session (e.g., email confirmation required)
          updateForm('error', 'Please check your email to confirm your account before signing in.')
        }
      } else {
        // Signup
        result = await auth.signUp(formData.email, formData.password)
        
        // Handle different signup scenarios
        if (result?.user) {
          if (result?.session) {
            // Full signup success with session - create profile and redirect
            try {
              await createUserProfile(result.user, formData.name)
              toast.success('Account created successfully! Welcome!')
              await redirectBasedOnRole(result.user)
            } catch (profileError) {
              console.error('Profile creation error:', profileError)
              const errorMessage = 'Account created but profile setup failed. Please contact support.'
              updateForm('error', errorMessage)
              toast.error(errorMessage)
            }
          } else {
            // User created but needs email confirmation
            updateForm('error', 'Account created! Please check your email to confirm your account before signing in.')
          }
        } else {
          // No user returned - something went wrong
          throw new Error('Signup failed. Please try again.')
        }
      }

    } catch (error) {
      console.error('Auth error:', error)
      
      // Handle specific error types with better messages
      let errorMessage = error.message
      
      if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Please check your email and click the confirmation link before signing in.'
      } else if (error.message?.includes('Invalid login credentials')) {
        errorMessage = toastMessages.auth.loginError
      } else if (error.message?.includes('User already registered')) {
        errorMessage = 'An account with this email already exists. Please sign in instead.'
      }
      
      updateForm('error', errorMessage)
      toast.error(errorMessage)
    } finally {
      updateForm('loading', false)
    }
  }

  // Toggle between login and signup
  const toggleMode = () => {
    updateForm('isLogin', !formData.isLogin)
    resetForm()
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-soft-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-deep-blue"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-soft-white flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-deep-blue">
            {formData.isLogin ? 'Sign in to your account' : 'Create your account'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {formData.isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={toggleMode}
              className="font-medium text-teal hover:text-emerald-600 transition-colors"
              disabled={formData.loading}
            >
              {formData.isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Name Field (Signup only) */}
            {!formData.isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-deep-blue mb-2">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={(e) => updateForm('name', e.target.value)}
                  disabled={formData.loading}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg text-deep-blue placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter your full name"
                />
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-deep-blue mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={(e) => updateForm('email', e.target.value)}
                disabled={formData.loading}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg text-deep-blue placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Enter your email"
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-deep-blue mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={formData.isLogin ? "current-password" : "new-password"}
                required
                value={formData.password}
                onChange={(e) => updateForm('password', e.target.value)}
                disabled={formData.loading}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg text-deep-blue placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Enter your password"
              />
            </div>

                        {/* Confirm Password Field (Signup only) */}
            {!formData.isLogin && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-deep-blue mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => updateForm('confirmPassword', e.target.value)}
                  disabled={formData.loading}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg text-deep-blue placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Confirm your password"
                />
              </div>
            )}
          </div>

          {/* Error Message */}
          {formData.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{formData.error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={formData.loading}
            className="w-full btn-premium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {formData.loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-deep-blue mr-2"></div>
                {formData.isLogin ? 'Signing in...' : 'Creating account...'}
              </div>
            ) : (
              formData.isLogin ? 'Sign in' : 'Create account'
            )}
          </button>
        </form>

        {/* Additional Info */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            By {formData.isLogin ? 'signing in' : 'creating an account'}, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  )
}
