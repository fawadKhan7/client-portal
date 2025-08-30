import { createServerClient } from '@supabase/ssr'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Create Supabase server client for session handling
async function createClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, // Use anon key for session handling
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          // Empty implementation for server component
        },
      },
    }
  )
}

// GET /api/messages - Fetch messages for a request
export async function GET(request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const requestId = searchParams.get('request_id')

    if (!requestId) {
      return NextResponse.json({ error: 'request_id is required' }, { status: 400 })
    }

    // Get the current user from session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has access to this request
    const { data: userRequest, error: requestError } = await supabase
      .from('requests')
      .select('client_id')
      .eq('id', requestId)
      .single()

    if (requestError) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    // Check permission: user must be admin or the request owner
    if (profile?.role !== 'admin' && userRequest.client_id !== session.user.id) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Fetch messages for this request
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(id, name, email, role, avatar_url),
        receiver:profiles!messages_receiver_id_fkey(id, name, email, role, avatar_url)
      `)
      .eq('request_id', requestId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching messages:', error)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    return NextResponse.json({ messages: messages || [] })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/messages - Send a new message
export async function POST(request) {
  try {
    const supabase = await createClient()

    // Get the current user from session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content, request_id, receiver_id } = body

    if (!content?.trim() || !request_id) {
      return NextResponse.json({ error: 'Content and request_id are required' }, { status: 400 })
    }

    // Check if user has access to this request
    const { data: userRequest, error: requestError } = await supabase
      .from('requests')
      .select('client_id')
      .eq('id', request_id)
      .single()

    if (requestError) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    // Check permission: user must be admin or the request owner
    if (profile?.role !== 'admin' && userRequest.client_id !== session.user.id) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Determine receiver_id if not provided
    let finalReceiverId = receiver_id
    if (!finalReceiverId) {
      if (profile?.role === 'admin') {
        // Admin is sending to the client
        finalReceiverId = userRequest.client_id
      } else {
        // Client is sending to an admin
        // Look for the most recent admin who sent a message in this request
        const { data: recentMessages } = await supabase
          .from('messages')
          .select('sender_id, sender:profiles!messages_sender_id_fkey(role)')
          .eq('request_id', request_id)
          .order('created_at', { ascending: false })
          .limit(10)
        
        // Find the most recent admin sender
        const recentAdminMessage = recentMessages?.find(msg => 
          msg.sender?.role === 'admin'
        )
        
        if (recentAdminMessage) {
          finalReceiverId = recentAdminMessage.sender_id
        } else {
          // Fallback: use service role to find any admin
          const serviceSupabase = createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
          )
          
          const { data: adminProfiles } = await serviceSupabase
            .from('profiles')
            .select('id')
            .eq('role', 'admin')
            .limit(1)
          
          if (adminProfiles && adminProfiles.length > 0) {
            finalReceiverId = adminProfiles[0].id
          } else {
            return NextResponse.json({ error: 'No admin available to receive message' }, { status: 400 })
          }
        }
      }
    }

    // Insert the message
    const { data: message, error: insertError } = await supabase
      .from('messages')
      .insert({
        sender_id: session.user.id,
        receiver_id: finalReceiverId,
        content: content.trim(),
        request_id: request_id
      })
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(id, name, email, role, avatar_url),
        receiver:profiles!messages_receiver_id_fkey(id, name, email, role, avatar_url)
      `)
      .single()

    if (insertError) {
      console.error('Error inserting message:', insertError)
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }

    return NextResponse.json({ message }, { status: 201 })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/messages - Mark messages as read (for future implementation)
export async function PUT(request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const messageId = searchParams.get('id')

    // Get the current user from session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 })
    }

    // For future implementation: mark message as read
    // This would require adding a 'read_at' or 'is_read' field to the messages table
    
    return NextResponse.json({ message: 'Read status update not yet implemented' }, { status: 501 })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
