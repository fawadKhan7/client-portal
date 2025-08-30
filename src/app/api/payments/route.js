import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const request_id = searchParams.get('request_id')

    if (!request_id) {
      return NextResponse.json(
        { error: 'Request ID is required' },
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

    // Check if user has access to this request
    let query = supabase.from('requests').select('id, client_id').eq('id', request_id)

    // For non-admin users, only show their own requests
    if (session.user.user_metadata?.role !== 'admin') {
      query = query.eq('client_id', session.user.id)
    }

    const { data: requestData, error: requestError } = await query.single()

    if (requestError || !requestData) {
      return NextResponse.json(
        { error: 'Request not found or access denied' },
        { status: 404 }
      )
    }

    // Get payment information for this request
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('request_id', request_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (paymentError && paymentError.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" which is fine - means no payment yet
      console.error('Error fetching payment:', paymentError)
      return NextResponse.json(
        { error: 'Failed to fetch payment information' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      payment: payment || null,
      has_payment: !!payment,
      is_paid: payment?.status === 'paid'
    })

  } catch (error) {
    console.error('Payments API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
