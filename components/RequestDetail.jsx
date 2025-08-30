'use client'

import { useState, useEffect } from 'react'
import StatusUpdater from './StatusUpdater'
import MessageList from './MessageList'
import FileList from './FileList'
import PaymentButton from './PaymentButton'
import { formatDate } from '@/helper'
import { UserIcon, CheckCircleIcon } from '@/components/icons'

export default function RequestDetail({ request, user, onStatusUpdate }) {
  const [fileRefreshTrigger, setFileRefreshTrigger] = useState(0)
  const [paymentStatus, setPaymentStatus] = useState(null)
  const [loadingPayment, setLoadingPayment] = useState(false)

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      closed: 'bg-gray-100 text-gray-800 border-gray-200'
    }

    const statusLabels = {
      pending: 'Pending',
      in_progress: 'In Progress',
      completed: 'Completed',
      closed: 'Closed'
    }

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusClasses[status] || statusClasses.pending}`}>
        {statusLabels[status] || status}
      </span>
    )
  }



  const handleFileUpload = (newFile) => {
    // Trigger a refresh of the file list
    setFileRefreshTrigger(prev => prev + 1)
  }

  // Check payment status for completed requests
  const checkPaymentStatus = async () => {
    if (request.status !== 'completed' || user.role === 'admin') {
      setPaymentStatus(null)
      return
    }

    setLoadingPayment(true)
    try {
      const response = await fetch(`/api/payments?request_id=${request.id}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setPaymentStatus(data.payment)
      } else {
        setPaymentStatus(null)
      }
    } catch (error) {
      console.error('Error checking payment status:', error)
      setPaymentStatus(null)
    } finally {
      setLoadingPayment(false)
    }
  }

  useEffect(() => {
    checkPaymentStatus()
  }, [request.id, request.status, user.role])

  // Check if payment is required and not yet paid
  const isPaymentRequired = user.role !== 'admin' && 
    request.status === 'completed' && 
    (!paymentStatus || paymentStatus.status !== 'paid')

  return (
    <div className="space-y-6">
      {/* Request Header */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-deep-blue mb-2">{request.title}</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>Created {formatDate(request.created_at)}</span>
              {user.role === 'admin' && request.client_profile && (
                <span className="flex items-center">
                  <UserIcon className="w-4 h-4 mr-1" />
                  {request.client_profile.name} ({request.client_profile.email})
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {getStatusBadge(request.status)}
          </div>
        </div>

        {request.description && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
            <p className="text-gray-600 leading-relaxed">{request.description}</p>
          </div>
        )}

        {/* Status Updater - Admin Only */}
        {user.role === 'admin' && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <StatusUpdater 
              currentStatus={request.status}
              onStatusUpdate={onStatusUpdate}
              requestId={request.id}
            />
          </div>
        )}
      </div>

      {/* Payment Section - Show for clients with completed unpaid requests */}
      {isPaymentRequired && (
        <PaymentButton 
          request={request} 
          amount={100.00} // You can make this dynamic based on request data
          currency="usd"
        />
      )}

      {/* Payment Status Display - Show for completed requests with payment */}
      {request.status === 'completed' && paymentStatus?.status === 'paid' && user.role !== 'admin' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircleIcon className="w-5 h-5 text-green-400 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-green-800">Payment Confirmed</h3>
              <p className="text-sm text-green-700 mt-1">
                Your payment has been processed successfully. You can now access all deliverables.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Files Section */}
      <FileList
        requestId={request.id}
        user={user}
        onFileUpload={handleFileUpload}
        refreshTrigger={fileRefreshTrigger}
        paymentStatus={paymentStatus}
        isPaymentRequired={isPaymentRequired}
      />

      {/* Messages Section */}
      <MessageList
        requestId={request.id}
        user={user}
      />
    </div>
  )
}
