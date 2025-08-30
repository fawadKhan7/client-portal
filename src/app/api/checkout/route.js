import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { stripe } from '@/lib/stripe'

export async function POST(request) {
  try {
    const { request_id, amount, currency = 'usd' } = await request.json()

    if (!request_id || !amount) {
      return NextResponse.json(
        { error: 'Request ID and amount are required' },
        { status: 400 }
      )
    }

    // Create Supabase client
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify request belongs to user and is completed
    const { data: requestData, error: requestError } = await supabase
      .from('requests')
      .select('id, title, status, client_id')
      .eq('id', request_id)
      .single()

    if (requestError || !requestData) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      )
    }

    // Verify user owns the request and it's completed
    if (requestData.client_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized access to request' },
        { status: 403 }
      )
    }

    if (requestData.status !== 'completed') {
      return NextResponse.json(
        { error: 'Request must be completed before payment' },
        { status: 400 }
      )
    }

    // Check if payment already exists for this request
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id, status')
      .eq('request_id', request_id)
      .eq('status', 'paid')
      .single()

    if (existingPayment) {
      return NextResponse.json(
        { error: 'Request has already been paid for' },
        { status: 400 }
      )
    }

    // Create payment record in database
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        request_id,
        client_id: session.user.id,
        amount: parseFloat(amount),
        currency,
        status: 'pending'
      })
      .select('*')
      .single()

    if (paymentError) {
      console.error('Error creating payment record:', paymentError)
      return NextResponse.json(
        { error: 'Failed to create payment record' },
        { status: 500 }
      )
    }

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: `Request: ${requestData.title}`,
              description: 'Payment for completed request deliverables',
            },
            unit_amount: Math.round(parseFloat(amount) * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/requests/${request_id}?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/requests/${request_id}?payment=cancelled`,
      metadata: {
        payment_id: payment.id,
        request_id: request_id,
        client_id: session.user.id,
      },
    })

    return NextResponse.json({
      checkout_url: checkoutSession.url,
      payment_id: payment.id,
    })

  } catch (error) {
    console.error('Checkout API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
