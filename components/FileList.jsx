'use client'

import { useState, useEffect } from 'react'
import { toast, toastMessages } from '@/lib/toast'
import { formatDate, getFileIcon, formatFileSize } from '@/helper'
import { LockIcon } from '@/components/icons'

export default function FileList({ requestId, user, onFileUpload, refreshTrigger, paymentStatus, isPaymentRequired }) {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const fetchFiles = async () => {
    try {
      setLoading(true)
      setError('')

      const params = new URLSearchParams()
      if (requestId) params.append('request_id', requestId)

      const response = await fetch(`/api/files?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch files')
      }

      setFiles(data.files || [])
    } catch (err) {
      console.error('Error fetching files:', err)
      const errorMessage = err.message || 'Failed to load files'
      setError(errorMessage)
      toast.error(toastMessages.general.loadError)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFiles()
  }, [requestId, refreshTrigger])







  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file || !requestId) return

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('request_id', requestId)
      formData.append('original_name', file.name)

      const response = await fetch('/api/files', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload file')
      }

      // Add the new file to the list
      setFiles(prev => [data.file, ...prev])
      
      // Clear the file input
      event.target.value = ''
      
      // Show success toast
      toast.success(toastMessages.files.uploadSuccess)
      
      // Notify parent component if callback provided
      if (onFileUpload) {
        onFileUpload(data.file)
      }

    } catch (err) {
      console.error('Error uploading file:', err)
      const errorMessage = err.message || 'Failed to upload file'
      setError(errorMessage)
      toast.error(toastMessages.files.uploadError)
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (file) => {
    try {
      // Check if this is a deliverable file that requires payment
      const isDeliverable = user.role !== 'admin' && 
        file.uploader_profile?.role === 'admin' && 
        isPaymentRequired

      if (isDeliverable) {
        toast.error('Payment required to download deliverable files')
        return
      }

      if (file.signed_url) {
        // Open the signed URL in a new tab/window for download
        window.open(file.signed_url, '_blank')
      } else {
        throw new Error('Download URL not available')
      }
    } catch (err) {
      console.error('Error downloading file:', err)
      toast.error('Failed to download file')
    }
  }

  const handleDelete = async (fileId) => {
    if (!confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      return
    }

    setDeleting(fileId)
    try {
      const response = await fetch(`/api/files?id=${fileId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete file')
      }

      // Remove the file from the list
      setFiles(prev => prev.filter(f => f.id !== fileId))
      
      // Show success toast
      toast.success(toastMessages.files.deleteSuccess)

    } catch (err) {
      console.error('Error deleting file:', err)
      toast.error(err.message || toastMessages.files.deleteError)
    } finally {
      setDeleting(null)
    }
  }

  const canDeleteFile = (file) => {
    return user?.role === 'admin' || file.uploader_id === user?.id || file.request?.client_id === user?.id
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-gray-200 rounded"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-deep-blue flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          Files ({files.length})
        </h2>
        
        {requestId && (
          <div className="relative">
            <input
              type="file"
              id="file-upload"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.xlsx,.csv"
            />
            <label
              htmlFor="file-upload"
              className={`btn-premium ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {uploading ? 'Uploading...' : 'Upload File'}
            </label>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {files.length === 0 ? (
        <div className="text-center py-8">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500 mb-2">No files uploaded yet</p>
          {requestId && (
            <p className="text-sm text-gray-400">Upload your first file to get started</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {files.map((file) => (
            <div key={file.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                {getFileIcon(file.original_name, file.file_type)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-deep-blue truncate">{file.original_name}</p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>
                      Uploaded by {file.uploader?.name || 'Unknown'}
                    </span>
                    <span>•</span>
                    <span>{formatDate(file.created_at)}</span>
                    {file.file_size && (
                      <>
                        <span>•</span>
                        <span>{formatFileSize(file.file_size)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                {(() => {
                  const isDeliverable = user.role !== 'admin' && 
                    file.uploader_profile?.role === 'admin' && 
                    isPaymentRequired
                  
                  return (
                    <button
                      onClick={() => handleDownload(file)}
                      disabled={isDeliverable}
                      className={`px-3 py-1 text-sm rounded-md transition-colors flex items-center space-x-1 ${
                        isDeliverable 
                          ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                          : 'bg-teal text-white hover:bg-teal/90'
                      }`}
                      title={isDeliverable ? 'Payment required to download deliverable' : 'Download file'}
                    >
                      {isDeliverable && <LockIcon className="w-3 h-3" />}
                      <span>{isDeliverable ? 'Locked' : 'Download'}</span>
                    </button>
                  )
                })()}
                
                {canDeleteFile(file) && (
                  <button
                    onClick={() => handleDelete(file.id)}
                    disabled={deleting === file.id}
                    className="px-3 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete file"
                  >
                    {deleting === file.id ? 'Deleting...' : 'Delete'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
