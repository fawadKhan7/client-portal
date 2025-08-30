import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

// Use service role key for webhook operations (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const body = await request.text()
    const headersList = headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'No stripe signature found' },
        { status: 400 }
      )
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('STRIPE_WEBHOOK_SECRET is not configured')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    let event
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      )
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    console.log('Received Stripe webhook event:', event.type)

    // Handle the checkout session completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      
      console.log('Processing checkout session:', session.id)
      console.log('Session metadata:', session.metadata)

      const { payment_id, request_id, client_id } = session.metadata || {}

      if (!payment_id || !request_id || !client_id) {
        console.error('Missing required metadata in checkout session:', session.metadata)
        return NextResponse.json(
          { error: 'Missing required metadata' },
          { status: 400 }
        )
      }

      // Update payment status to paid
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .update({ 
          status: 'paid',
          stripe_session_id: session.id,
          stripe_payment_intent: session.payment_intent
        })
        .eq('id', payment_id)
        .eq('client_id', client_id)
        .select('*')
        .single()

      if (paymentError) {
        console.error('Error updating payment status:', paymentError)
        return NextResponse.json(
          { error: 'Failed to update payment status' },
          { status: 500 }
        )
      }

      console.log('Payment updated successfully:', payment.id)

      // Optionally, you could add a flag to requests table to mark as "paid"
      // or track payment status separately - for now we'll rely on the payments table

      return NextResponse.json({ 
        received: true,
        payment_updated: true 
      })
    }

    // Handle payment failed events
    if (event.type === 'checkout.session.expired' || event.type === 'payment_intent.payment_failed') {
      const session = event.data.object
      const { payment_id } = session.metadata || {}

      if (payment_id) {
        await supabase
          .from('payments')
          .update({ status: 'failed' })
          .eq('id', payment_id)

        console.log('Payment marked as failed:', payment_id)
      }

      return NextResponse.json({ received: true })
    }

    // Handle other event types if needed
    console.log('Unhandled event type:', event.type)
    
    return NextResponse.json({ 
      received: true,
      message: `Unhandled event type: ${event.type}` 
    })

  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
