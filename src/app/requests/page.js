'use client'

import { useState, useCallback, useRef } from 'react'
import Layout from '@/components/Layout'
import RequestForm from '@/components/RequestForm'
import RequestList from '@/components/RequestList'
import { toast, toastMessages } from '@/lib/toast'
import { AlertCircleIcon } from '@/components/icons'

export default function RequestsPage() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const userRef = useRef(null)

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      
      const response = await fetch('/api/requests', {
        credentials: 'include'
      })
      
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch requests')
      }

      setRequests(data.requests || [])
    } catch (err) {
      console.error('Error fetching requests:', err)
      const errorMessage = err.message || 'Failed to load requests'
      setError(errorMessage)
      toast.error(toastMessages.general.loadError)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleRequestCreated = (newRequest) => {
    // Add the new request to the top of the list
    setRequests(prev => [newRequest, ...prev])
    setShowForm(false)
    
    // Refresh the requests list to get the latest data
    setTimeout(() => {
      fetchRequests()
    }, 1000)
  }

  const handleUserChange = (user) => {
    if (user && user.id !== userRef.current?.id) {
      userRef.current = user
      fetchRequests()
    }
  }

  return (
    <Layout>
      {({ user }) => {
        // Handle user changes
        handleUserChange(user)
        
        return (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-deep-blue">
                {user?.role === 'admin' ? 'All Requests' : 'My Requests'}
              </h1>
              <p className="text-gray-600 mt-1">
                {user?.role === 'admin' 
                  ? 'Manage client requests and track progress'
                  : 'Submit new requests and track their progress'
                }
              </p>
            </div>

            {/* Client can create new requests */}
            {user?.role !== 'admin' && (
              <button
                onClick={() => setShowForm(!showForm)}
                className="btn-premium"
              >
                {showForm ? 'Cancel' : 'New Request'}
              </button>
            )}
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <AlertCircleIcon className="w-5 h-5 text-red-400 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Error Loading Requests</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                  <button
                    onClick={() => fetchRequests()}
                    className="text-sm text-red-800 underline mt-2 hover:text-red-900"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Request Form - Only for clients */}
          {user?.role !== 'admin' && showForm && (
            <RequestForm 
              user={user}
              onRequestCreated={handleRequestCreated}
            />
          )}

          {/* Stats Cards - Only for admin */}
          {user?.role === 'admin' && !loading && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Requests', value: requests.length, color: 'bg-blue-500' },
                { label: 'Pending', value: requests.filter(r => r.status === 'pending').length, color: 'bg-yellow-500' },
                { label: 'In Progress', value: requests.filter(r => r.status === 'in_progress').length, color: 'bg-blue-500' },
                { label: 'Completed', value: requests.filter(r => r.status === 'completed').length, color: 'bg-green-500' }
              ].map((stat, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded-full ${stat.color} mr-3`}></div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                      <p className="text-2xl font-bold text-deep-blue">{stat.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Requests List */}
          <RequestList
            requests={requests}
            isAdmin={user?.role === 'admin'}
            loading={loading}
            onRequestUpdate={fetchRequests}
          />

        </div>
        )
      }}
    </Layout>
  )
}