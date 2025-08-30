'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from '@/lib/toast'
import { RequestIcon, XIcon, UserIcon, PaperclipIcon, ChevronRightIcon } from '@/components/icons'
import { formatDate, truncateText } from '@/helper'

export default function RequestList({ requests, isAdmin, loading, onRequestUpdate }) {
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [cancelingIds, setCancelingIds] = useState(new Set())

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
      completed: 'bg-green-100 text-green-800 border-green-200'
    }

    const statusLabels = {
      pending: 'Pending',
      in_progress: 'In Progress',
      completed: 'Completed'
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusClasses[status] || statusClasses.pending}`}>
        {statusLabels[status] || status}
      </span>
    )
  }



  const cancelRequest = async (requestId, e) => {
    e.preventDefault() // Prevent Link navigation
    e.stopPropagation()
    
    const confirmCancel = window.confirm('Are you sure you want to cancel this request? This action cannot be undone.')
    if (!confirmCancel) return

    setCancelingIds(prev => new Set([...prev, requestId]))

    try {
      const response = await fetch(`/api/requests?id=${requestId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel request')
      }

      toast.success('Request canceled successfully')
      
      // Notify parent component to refresh the list
      if (onRequestUpdate) {
        onRequestUpdate()
      }
    } catch (error) {
      console.error('Error canceling request:', error)
      toast.error(error.message || 'Failed to cancel request')
    } finally {
      setCancelingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(requestId)
        return newSet
      })
    }
  }

  const filteredRequests = requests.filter(request => {
    if (selectedStatus === 'all') return true
    return request.status === selectedStatus
  })

  const statusCounts = {
    all: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    in_progress: requests.filter(r => r.status === 'in_progress').length,
    completed: requests.filter(r => r.status === 'completed').length
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md p-6 border border-gray-100 animate-pulse">
            <div className="flex justify-between items-start mb-3">
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              <div className="h-6 bg-gray-200 rounded w-20"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
            <div className="mt-4 flex justify-between items-center">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Status Filter - Only show for admin or if client has multiple statuses */}
      {(isAdmin || new Set(requests.map(r => r.status)).size > 1) && (
        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-100">
          <h3 className="text-sm font-medium text-deep-blue mb-3">Filter by Status</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(statusCounts).map(([status, count]) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  selectedStatus === status
                    ? 'bg-teal text-white border-teal'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-teal hover:text-teal'
                }`}
              >
                {status === 'all' ? 'All' : status.replace('_', ' ')} ({count})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 border border-gray-100 text-center">
          <div className="text-gray-400 mb-4">
            <RequestIcon className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
          <p className="text-gray-500">
            {selectedStatus === 'all' 
              ? 'No requests have been created yet.'
              : `No requests with status "${selectedStatus.replace('_', ' ')}" found.`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <Link
              key={request.id}
              href={`/requests/${request.id}`}
              className="block bg-white rounded-lg shadow-md p-6 border border-gray-100 hover:shadow-lg transition-all hover:border-teal"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-deep-blue group-hover:text-teal transition-colors">
                  {request.title}
                </h3>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(request.status)}
                  {/* Cancel button for pending requests */}
                  {request.status === 'pending' && (
                    <button
                      onClick={(e) => cancelRequest(request.id, e)}
                      disabled={cancelingIds.has(request.id)}
                      className="px-2 py-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
                      title="Cancel this request"
                    >
                      {cancelingIds.has(request.id) ? (
                        <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <XIcon className="w-3 h-3" />
                      )}
                      <span className="hidden sm:inline">{cancelingIds.has(request.id) ? 'Canceling...' : 'Cancel'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Description */}
              {request.description && (
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {truncateText(request.description)}
                </p>
              )}

              {/* Footer */}
              <div className="flex justify-between items-center text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <span>Created {formatDate(request.created_at)}</span>
                  {isAdmin && request.client_profile && (
                    <span className="flex items-center">
                      <UserIcon className="w-4 h-4 mr-1" />
                      {request.client_profile.name || request.client_profile.email}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-3">
                  {/* File count if available */}
                  {request.file_count > 0 && (
                    <span className="flex items-center text-teal">
                      <PaperclipIcon className="w-4 h-4 mr-1" />
                      {request.file_count} file{request.file_count !== 1 ? 's' : ''}
                    </span>
                  )}
                  
                  {/* Arrow icon */}
                  <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
