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
          // Empty implementation for server component
        },
      },
    }
  )
}

// GET /api/files - List files for user (optionally filtered by request_id)
export async function GET(request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const requestId = searchParams.get('request_id')
    const userId = searchParams.get('user_id')

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
      .from('files')
      .select(`
        *,
        uploader:profiles!files_uploader_id_fkey(name, email, role),
        request:requests!files_request_id_fkey(id, title, client_id)
      `)
      .order('created_at', { ascending: false })

    // Filter by request_id if provided
    if (requestId) {
      query = query.eq('request_id', requestId)
    }

    // Role-based access control
    if (profile?.role !== 'admin') {
      // Non-admin users can only see files they uploaded
      query = query.eq('uploader_id', session.user.id)
    }

    const { data: files, error } = await query

    if (error) {
      console.error('Error fetching files:', error)
      return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 })
    }

    // Generate signed URLs for file access
    const filesWithUrls = await Promise.all(
      files.map(async (file) => {
        const { data: signedUrl } = await supabase.storage
          .from('files')
          .createSignedUrl(file.file_url.split('/').pop(), 3600) // 1 hour expiry

        return {
          ...file,
          signed_url: signedUrl?.signedUrl || file.file_url
        }
      })
    )

    return NextResponse.json({ files: filesWithUrls })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/files - Upload new file
export async function POST(request) {
  try {
    const supabase = await createClient()

    // Get the current user from session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file')
    const requestId = formData.get('request_id')
    const originalName = formData.get('original_name') || file.name

    if (!file || !requestId) {
      return NextResponse.json({ error: 'File and request_id are required' }, { status: 400 })
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 })
    }

    // Validate file type (basic security)
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'File type not supported' }, { status: 400 })
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

    // Generate unique filename
    const fileExt = originalName.split('.').pop()
    const fileName = `${requestId}/${session.user.id}/${Date.now()}.${fileExt}`

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('files')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('files')
      .getPublicUrl(fileName)

    // Insert file record in database
    const { data: fileRecord, error: dbError } = await supabase
      .from('files')
      .insert({
        uploader_id: session.user.id,
        request_id: requestId,
        file_url: fileName, // Store the path, not the full URL
        original_name: originalName
      })
      .select(`
        *,
        uploader:profiles!files_uploader_id_fkey(name, email, role),
        request:requests!files_request_id_fkey(id, title)
      `)
      .single()

    if (dbError) {
      console.error('Database insert error:', dbError)
      // Clean up uploaded file if database insert fails
      await supabase.storage.from('files').remove([fileName])
      return NextResponse.json({ error: 'Failed to save file record' }, { status: 500 })
    }

    // Generate signed URL for immediate access
    const { data: signedUrl } = await supabase.storage
      .from('files')
      .createSignedUrl(fileName, 3600)

    return NextResponse.json({
      file: {
        ...fileRecord,
        signed_url: signedUrl?.signedUrl || publicUrl
      }
    }, { status: 201 })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/files/[id] - Delete file
export async function DELETE(request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('id')

    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 })
    }

    // Get the current user from session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the file record to check ownership
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('*, request:requests!files_request_id_fkey(client_id)')
      .eq('id', fileId)
      .single()

    if (fileError || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    // Check permission: user must be admin, file owner, or request owner
    const canDelete = profile?.role === 'admin' || 
                     file.uploader_id === session.user.id || 
                     file.request?.client_id === session.user.id

    if (!canDelete) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('files')
      .remove([file.file_url])

    if (storageError) {
      console.error('Storage delete error:', storageError)
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('files')
      .delete()
      .eq('id', fileId)

    if (dbError) {
      console.error('Database delete error:', dbError)
      return NextResponse.json({ error: 'Failed to delete file record' }, { status: 500 })
    }

    return NextResponse.json({ message: 'File deleted successfully' })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
