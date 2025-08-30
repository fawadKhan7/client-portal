'use client'

import { useState } from 'react'
import { toast, toastMessages } from '@/lib/toast'

export default function StatusUpdater({ currentStatus, onStatusUpdate, requestId }) {
  const [updating, setUpdating] = useState(false)

  const statusFlow = [
    { key: 'pending', label: 'Pending', color: 'yellow' },
    { key: 'in_progress', label: 'In Progress', color: 'blue' },
    { key: 'completed', label: 'Completed', color: 'green' }
  ]

  const getStatusIndex = (status) => {
    return statusFlow.findIndex(s => s.key === status)
  }

  const currentIndex = getStatusIndex(currentStatus)

  const getButtonVariant = (status, index) => {
    if (status.key === currentStatus) {
      return 'current'
    } else if (index === currentIndex + 1) {
      return 'next'
    } else if (index > currentIndex + 1) {
      return 'future'
    } else {
      return 'past'
    }
  }

  const getButtonClasses = (variant, color) => {
    const baseClasses = 'px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 relative'
    
    switch (variant) {
      case 'current':
        return `${baseClasses} bg-${color}-500 text-white shadow-md cursor-default`
      case 'next':
        return `${baseClasses} bg-white border-2 border-${color}-500 text-${color}-600 hover:bg-${color}-50 cursor-pointer`
      case 'future':
        return `${baseClasses} bg-gray-100 text-gray-400 cursor-not-allowed`
      case 'past':
        return `${baseClasses} bg-${color}-100 text-${color}-600 cursor-default`
      default:
        return baseClasses
    }
  }

  const handleStatusUpdate = async (newStatus, requestId) => {
    if (updating || newStatus === currentStatus) return
    
    const currentIdx = getStatusIndex(currentStatus)
    const newIdx = getStatusIndex(newStatus)
    
    // Only allow moving to next status in sequence
    if (newIdx !== currentIdx + 1) {
      return
    }

    setUpdating(true)
    try {
      const response = await fetch(`/api/requests?id=${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update status')
      }
      
      if (onStatusUpdate) {
        onStatusUpdate(newStatus)
      }
      
      // Show success feedback
      toast.success(`Status updated to "${statusFlow[newIdx].label}" successfully!`)
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error(error.message || toastMessages.requests.updateError)
    } finally {
      setUpdating(false)
    }
  }

  const getProgressWidth = () => {
    if (currentIndex === -1) return '0%'
    return `${(currentIndex / (statusFlow.length - 1)) * 100}%`
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-deep-blue mb-3">Update Request Status</h3>
      
      {/* Progress Bar */}
      <div className="relative">
        <div className="flex justify-between">
          {statusFlow.map((status, index) => (
            <div key={status.key} className="flex flex-col items-center relative z-10">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-all ${
                index <= currentIndex 
                  ? 'bg-teal text-white' 
                  : 'bg-gray-200 text-gray-400'
              }`}>
                {index < currentIndex ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span className="text-xs font-bold">{index + 1}</span>
                )}
              </div>
              <span className={`text-xs text-center ${
                index <= currentIndex ? 'text-teal font-medium' : 'text-gray-400'
              }`}>
                {status.label}
              </span>
            </div>
          ))}
        </div>
        
        {/* Progress Line */}
        <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200 -z-0">
          <div 
            className="h-full bg-teal transition-all duration-500 ease-out"
            style={{ width: getProgressWidth() }}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 pt-4">
        {statusFlow.map((status, index) => {
          const variant = getButtonVariant(status, index)
          const isActionable = variant === 'next'
          
          return (
            <button
              key={status.key}
              onClick={() => isActionable && handleStatusUpdate(status.key, requestId)}
              disabled={updating || !isActionable}
              className={`${getButtonClasses(variant, status.color)} ${
                isActionable && !updating ? 'hover:shadow-md' : ''
              } ${updating ? 'opacity-50' : ''}`}
              title={
                variant === 'current' 
                  ? 'Current status'
                  : variant === 'next' 
                  ? `Move to ${status.label}`
                  : variant === 'future'
                  ? 'Complete previous steps first'
                  : 'Already completed'
              }
            >
              {variant === 'current' && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                </span>
              )}
              {status.label}
              {variant === 'next' && (
                <svg className="w-4 h-4 ml-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
          )
        })}
      </div>

      {updating && (
        <div className="flex items-center justify-center py-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal mr-2"></div>
          <span className="text-sm text-gray-600">Updating status...</span>
        </div>
      )}

      {/* Help Text */}
      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
        <p><strong>Status Flow:</strong> Requests progress from Pending → In Progress → Completed.</p>
        <p><strong>Final Decision:</strong> Once completed, admin can approve or reject the request.</p>
      </div>
    </div>
  )
}
