import { createServerClient } from '@supabase/ssr'
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
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            // Server components can't set cookies, but we try anyway
            console.log('Could not set cookies in server component')
          }
        },
      },
    }
  )
}

// GET /api/requests - List requests with role-based filtering
export async function GET(request) {
  try {
    const supabase = await createClient()

    // Get the current user from session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    let query = supabase
      .from('requests')
      .select('*')
      .order('created_at', { ascending: false })

    // Role-based filtering
    if (profile?.role !== 'admin') {
      query = query.eq('client_id', session.user.id)
    }

    const { data: requests, error } = await query

    if (error) {
      console.error('Error fetching requests:', error)
      return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 })
    }

    // Add client profile info for admin users
    const processedData = await Promise.all(
      requests.map(async (request) => {
        let clientProfile = null
        
        // Only fetch profile for admin users
        if (profile?.role === 'admin' && request.client_id) {
          const { data: clientData } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('id', request.client_id)
            .single()
          
          clientProfile = clientData
        }

        return {
          ...request,
          client_profile: clientProfile,
          file_count: 0 // We'll implement file count later
        }
      })
    )

    return NextResponse.json({ requests: processedData })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/requests - Create a new request
export async function POST(request) {
  try {
    const supabase = await createClient()

    // Get the current user from session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Create the request
    const { data: newRequest, error: requestError } = await supabase
      .from('requests')
      .insert({
        client_id: session.user.id,
        title: title.trim(),
        description: description?.trim() || null,
        status: 'pending'
      })
      .select('*')
      .single()

    if (requestError) {
      console.error('Error creating request:', requestError)
      return NextResponse.json({ error: 'Failed to create request' }, { status: 500 })
    }

    return NextResponse.json({ 
      request: {
        ...newRequest,
        file_count: 0
      }
    }, { status: 201 })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/requests - Update request status (admin only)
export async function PATCH(request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const requestId = searchParams.get('id')

    if (!requestId) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 })
    }

    // Get the current user from session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    // Only admins can update request status
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const body = await request.json()
    const { status } = body

    if (!status || !['pending', 'in_progress', 'completed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Update the request status
    const { data: updatedRequest, error: updateError } = await supabase
      .from('requests')
      .update({ status })
      .eq('id', requestId)
      .select('*')
      .single()

    if (updateError) {
      console.error('Error updating request:', updateError)
      return NextResponse.json({ error: 'Failed to update request status' }, { status: 500 })
    }

    return NextResponse.json({ request: updatedRequest })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/requests - Cancel a pending request
export async function DELETE(request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const requestId = searchParams.get('id')

    if (!requestId) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 })
    }

    // Get the current user from session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    // Get the request to check ownership and status
    const { data: existingRequest, error: fetchError } = await supabase
      .from('requests')
      .select('client_id, status')
      .eq('id', requestId)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    // Check permissions - only request owner or admin can cancel
    const isOwner = existingRequest.client_id === session.user.id
    const isAdmin = profile?.role === 'admin'
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Can only cancel pending requests
    if (existingRequest.status !== 'pending') {
      return NextResponse.json({ 
        error: 'Only pending requests can be canceled' 
      }, { status: 400 })
    }

    // First, get all files associated with this request
    const { data: files, error: filesError } = await supabase
      .from('files')
      .select('id, file_url')
      .eq('request_id', requestId)

    if (filesError) {
      console.error('Error fetching files:', filesError)
      return NextResponse.json({ error: 'Failed to fetch request files' }, { status: 500 })
    }

    // Delete files from storage
    if (files && files.length > 0) {
      const filePaths = files.map(file => file.file_url)
      const { error: storageError } = await supabase.storage
        .from('files')
        .remove(filePaths)

      if (storageError) {
        console.error('Error deleting files from storage:', storageError)
        // Continue anyway - don't fail the entire operation
      }

      // Delete file records from database
      const { error: deleteFilesError } = await supabase
        .from('files')
        .delete()
        .eq('request_id', requestId)

      if (deleteFilesError) {
        console.error('Error deleting file records:', deleteFilesError)
        return NextResponse.json({ error: 'Failed to delete request files' }, { status: 500 })
      }
    }

    // Delete all messages associated with this request
    const { error: deleteMessagesError } = await supabase
      .from('messages')
      .delete()
      .eq('request_id', requestId)

    if (deleteMessagesError) {
      console.error('Error deleting messages:', deleteMessagesError)
      return NextResponse.json({ error: 'Failed to delete request messages' }, { status: 500 })
    }

    // Delete the request
    const { error: deleteError } = await supabase
      .from('requests')
      .delete()
      .eq('id', requestId)

    if (deleteError) {
      console.error('Error deleting request:', deleteError)
      return NextResponse.json({ error: 'Failed to cancel request' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Request canceled successfully' })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
