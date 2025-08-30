'use client'

import { useState } from 'react'
import { toast } from '@/lib/toast'
import { CreditCardIcon, LockIcon } from '@/components/icons'

export default function PaymentButton({ request, amount = 100.00, currency = 'usd' }) {
  const [loading, setLoading] = useState(false)

  const handlePayment = async () => {
    if (!request?.id) {
      toast.error('Invalid request')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          request_id: request.id,
          amount,
          currency,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Redirect to Stripe Checkout
      if (data.checkout_url) {
        window.location.href = data.checkout_url
      } else {
        throw new Error('No checkout URL received')
      }

    } catch (error) {
      console.error('Payment error:', error)
      toast.error(error.message || 'Failed to process payment')
      setLoading(false)
    }
  }

  // Don't show button if request is not completed
  if (request?.status !== 'completed') {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-teal to-emerald-600 rounded-lg p-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-2">Payment Required</h3>
          <p className="text-sm opacity-90 mb-4">
            Your request has been completed! Please complete payment to access your deliverables.
          </p>
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold">
              ${amount.toFixed(2)}
            </span>
            <span className="text-sm opacity-75 uppercase">
              {currency}
            </span>
          </div>
        </div>
        
        <button
          onClick={handlePayment}
          disabled={loading}
          className="px-6 py-3 bg-white text-teal hover:bg-gray-50 font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-teal border-t-transparent rounded-full animate-spin"></div>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <CreditCardIcon className="w-5 h-5" />
              <span>Pay Now</span>
            </>
          )}
        </button>
      </div>
      
      <div className="mt-4 flex items-center text-xs opacity-75">
        <LockIcon className="w-4 h-4 mr-1" />
        Secure payment processed by Stripe
      </div>
    </div>
  )
}
