'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { toast, toastMessages } from '@/lib/toast'

export default function RequestForm({ onRequestCreated, user }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    file: null
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const updateForm = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      file: null
    })
    setError('')
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB')
        return
      }
      updateForm('file', file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      setError('Title is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Create the request
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim() || null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create request')
      }

      const newRequest = data.request

      // If there's a file, upload it and link to the request
      if (formData.file) {
        try {
          const formDataUpload = new FormData()
          formDataUpload.append('file', formData.file)
          formDataUpload.append('request_id', newRequest.id)
          formDataUpload.append('original_name', formData.file.name)

          const fileResponse = await fetch('/api/files', {
            method: 'POST',
            body: formDataUpload
          })

          if (!fileResponse.ok) {
            const fileError = await fileResponse.json()
            console.error('File upload failed:', fileError)
            // Don't fail the whole request if file upload fails
            toast.warning('Request created successfully, but file upload failed. You can upload the file later.')
          }
        } catch (fileErr) {
          console.error('File upload error:', fileErr)
          toast.warning('Request created successfully, but file upload failed. You can upload the file later.')
        }
      }

      resetForm()
      
      // Reset file input
      const fileInput = document.getElementById('file-upload')
      if (fileInput) fileInput.value = ''

      // Show success toast
      toast.success(toastMessages.requests.createSuccess)

      // Notify parent component
      if (onRequestCreated) {
        onRequestCreated(newRequest)
      }

    } catch (err) {
      console.error('Error creating request:', err)
      const errorMessage = err.message || toastMessages.requests.createError
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
      <h3 className="text-xl font-semibold text-deep-blue mb-4">Create New Request</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-deep-blue mb-2">
            Request Title *
          </label>
          <input
            type="text"
            id="title"
            required
            value={formData.title}
            onChange={(e) => updateForm('title', e.target.value)}
            disabled={loading}
            className="w-full px-3 py-3 border border-gray-300 rounded-lg text-deep-blue placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="e.g., Need campaign analysis for Q4"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-deep-blue mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => updateForm('description', e.target.value)}
            disabled={loading}
            rows={4}
            className="w-full px-3 py-3 border border-gray-300 rounded-lg text-deep-blue placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed resize-none"
            placeholder="Provide additional details about your request..."
          />
        </div>

        {/* File Upload */}
        <div>
          <label htmlFor="file-upload" className="block text-sm font-medium text-deep-blue mb-2">
            Attach File (Optional)
          </label>
          <div className="relative">
            <input
              type="file"
              id="file-upload"
              onChange={handleFileChange}
              disabled={loading}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg text-deep-blue focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal file:text-white hover:file:bg-teal/90 file:cursor-pointer"
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.xlsx,.csv"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Supported formats: PDF, DOC, TXT, Images, Excel. Max size: 10MB
          </p>
          {formData.file && (
            <p className="text-sm text-teal mt-2">
              ✓ Selected: {formData.file.name}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !formData.title.trim()}
            className="btn-premium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Request...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  )
}
