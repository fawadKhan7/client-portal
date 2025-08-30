'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Layout from '@/components/Layout'
import RequestDetail from '@/components/RequestDetail'
import { toast, toastMessages } from '@/lib/toast'

export default function RequestDetailPage({ params }) {
  const router = useRouter()
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const requestId = params.id

  const fetchRequest = async (user) => {
    try {
      setLoading(true)
      setError('')

      // Fetch all requests and find the specific one
      const response = await fetch('/api/requests')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch requests')
      }

      const foundRequest = data.requests?.find(req => req.id === requestId)
      
      if (!foundRequest) {
        setError('Request not found')
        return
      }

      setRequest(foundRequest)
    } catch (err) {
      console.error('Error fetching request:', err)
      const errorMessage = err.message || 'Failed to load request details'
      setError(errorMessage)
      toast.error(toastMessages.general.loadError)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = (newStatus) => {
    if (request) {
      setRequest(prev => ({
        ...prev,
        status: newStatus
      }))
    }
  }

  return (
    <Layout>
      {({ user }) => {
        // Load request when user is available
        if (user && loading && !request && !error) {
          fetchRequest(user)
        }

        return (
          <div className="space-y-6">
            {/* Breadcrumb Navigation */}
            <nav className="flex items-center space-x-2 text-sm text-gray-600">
              <Link 
                href="/requests" 
                className="hover:text-teal transition-colors"
              >
                Requests
              </Link>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-deep-blue font-medium">
                {loading ? 'Loading...' : request ? request.title : 'Request Details'}
              </span>
            </nav>

            {/* Back Button */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => router.back()}
                className="flex items-center space-x-2 text-gray-600 hover:text-deep-blue transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back to Requests</span>
              </button>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="bg-white rounded-lg shadow-md p-8 border border-gray-100">
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-white rounded-lg shadow-md p-8 border border-gray-100 text-center">
                <div className="text-red-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Request Not Found</h3>
                <p className="text-gray-500 mb-4">{error}</p>
                <Link
                  href="/requests"
                  className="btn-premium"
                >
                  Back to Requests
                </Link>
              </div>
            )}

            {/* Request Detail */}
            {request && !loading && !error && (
              <RequestDetail
                request={request}
                user={user}
                onStatusUpdate={handleStatusUpdate}
              />
            )}
          </div>
        )
      }}
    </Layout>
  )
}
