'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { auth } from '@/lib/auth'

export default function LandingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await auth.getSession()
        if (session?.user) {
          // User is already authenticated, redirect to dashboard
          router.push('/dashboard')
        }
      } catch (error) {
        console.error('Error checking auth:', error)
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [router])

  const handleGetStarted = () => {
    router.push('/auth')
  }



  if (loading) {
    return (
      <div className="min-h-screen bg-soft-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-deep-blue"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-soft-white">

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h2 className="text-4xl md:text-6xl font-bold text-deep-blue mb-6 leading-tight">
              Your Premium
              <span className="block text-gold">Client Portal</span>
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Streamline your client relationships with our secure, professional portal. 
              Access projects, communications, and resources all in one place.
            </p>
            <div className="flex justify-center">
              <button
                onClick={handleGetStarted}
                className="btn-premium text-lg px-8 py-4"
              >
                Start Your Journey
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-deep-blue mb-4">
              Why Choose Our Portal?
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Built with modern technology and designed for seamless collaboration
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center p-6 rounded-lg hover:shadow-premium transition-all duration-300">
              <div className="w-16 h-16 bg-teal rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-deep-blue mb-2">Secure Access</h4>
              <p className="text-gray-600">
                Enterprise-grade security with multi-factor authentication and encrypted data storage.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center p-6 rounded-lg hover:shadow-premium transition-all duration-300">
              <div className="w-16 h-16 bg-gold rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-deep-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-deep-blue mb-2">Lightning Fast</h4>
              <p className="text-gray-600">
                Optimized performance ensures quick access to your projects and data.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center p-6 rounded-lg hover:shadow-premium transition-all duration-300">
              <div className="w-16 h-16 bg-deep-blue rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-deep-blue mb-2">Team Collaboration</h4>
              <p className="text-gray-600">
                Seamless communication tools to keep your team aligned and productive.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h4 className="text-2xl font-bold text-deep-blue mb-4">ClientPortal</h4>
            <p className="text-gray-600 mb-6">
              Professional client management made simple and secure.
            </p>
            <div className="flex justify-center">
              <p className="text-gray-500 text-sm">
                © 2024 ClientPortal. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
