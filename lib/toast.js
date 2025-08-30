/**
 * Toast notification helper functions
 * 
 * These functions provide a simple API for showing toast notifications
 * throughout the application. They work with the ToastProvider context.
 * 
 * Usage:
 *   import { toast } from '@/lib/toast'
 *   
 *   toast.success('Message sent successfully!')
 *   toast.error('Failed to send message')
 *   toast.info('New message received')
 *   toast.warning('Connection unstable')
 */

// Global toast instance - will be set by ToastProvider
let toastInstance = null

export function setToastInstance(instance) {
  toastInstance = instance
}

export const toast = {
  success: (message, options = {}) => {
    if (!toastInstance) {
      console.warn('Toast not initialized. Make sure ToastProvider is wrapped around your app.')
      return
    }
    return toastInstance.success(message, options)
  },

  error: (message, options = {}) => {
    if (!toastInstance) {
      console.warn('Toast not initialized. Make sure ToastProvider is wrapped around your app.')
      return
    }
    return toastInstance.error(message, options)
  },

  info: (message, options = {}) => {
    if (!toastInstance) {
      console.warn('Toast not initialized. Make sure ToastProvider is wrapped around your app.')
      return
    }
    return toastInstance.info(message, options)
  },

  warning: (message, options = {}) => {
    if (!toastInstance) {
      console.warn('Toast not initialized. Make sure ToastProvider is wrapped around your app.')
      return
    }
    return toastInstance.warning(message, options)
  },

  /**
   * Convenience method for API response handling
   */
  handleApiResponse: (response, successMessage = 'Operation completed successfully') => {
    if (response.ok || response.success) {
      toast.success(successMessage)
    } else {
      const errorMessage = response.error || response.message || 'An error occurred'
      toast.error(errorMessage)
    }
  },

  /**
   * Convenience method for async operations
   */
  promise: async (promise, options = {}) => {
    const {
      loading = 'Loading...',
      success = 'Operation completed successfully',
      error = 'Operation failed'
    } = options

    let loadingToastId
    
    if (loading) {
      loadingToastId = toast.info(loading, { duration: Infinity })
    }

    try {
      const result = await promise
      
      if (loadingToastId && toastInstance) {
        toastInstance.removeToast(loadingToastId)
      }
      
      if (success) {
        toast.success(typeof success === 'function' ? success(result) : success)
      }
      
      return result
    } catch (err) {
      if (loadingToastId && toastInstance) {
        toastInstance.removeToast(loadingToastId)
      }
      
      const errorMessage = typeof error === 'function' ? error(err) : error
      toast.error(errorMessage)
      
      throw err
    }
  }
}

// Common toast messages for the application
export const toastMessages = {
  // Authentication
  auth: {
    loginSuccess: 'Welcome back!',
    loginError: 'Invalid credentials. Please try again.',
    logoutSuccess: 'You have been logged out successfully',
    sessionExpired: 'Your session has expired. Please log in again.'
  },

  // Messaging
  messages: {
    sendSuccess: 'Message sent successfully',
    sendError: 'Failed to send message. Please try again.',
    loadError: 'Failed to load messages',
    connectionLost: 'Connection lost. Messages may be delayed.',
    connectionRestored: 'Connection restored. Messages are live again.'
  },

  // Files
  files: {
    uploadSuccess: 'File uploaded successfully',
    uploadError: 'Failed to upload file. Please try again.',
    deleteSuccess: 'File deleted successfully',
    deleteError: 'Failed to delete file',
    downloadError: 'Failed to download file'
  },

  // Requests
  requests: {
    createSuccess: 'Request created successfully',
    createError: 'Failed to create request',
    updateSuccess: 'Request updated successfully',
    updateError: 'Failed to update request',
    statusChanged: 'Request status updated'
  },

  // General
  general: {
    saveSuccess: 'Changes saved successfully',
    saveError: 'Failed to save changes',
    loadError: 'Failed to load data',
    networkError: 'Network error. Please check your connection.',
    unexpectedError: 'An unexpected error occurred'
  }
}

export default toast
