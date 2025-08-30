'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { toast, toastMessages } from '@/lib/toast'

export default function MessageList({ requestId, user, requestTitle }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const connectionStatusRef = useRef('disconnected')
  const previousConnectionStatusRef = useRef('disconnected')
  const [typingUsers, setTypingUsers] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const subscriptionRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const lastTypingRef = useRef(0)
  const lastMessageCountRef = useRef(0)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > lastMessageCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      lastMessageCountRef.current = messages.length
    }
  }, [messages])

  const updateConnectionStatus = (status) => {
    const previousStatus = connectionStatusRef.current
    previousConnectionStatusRef.current = previousStatus
    connectionStatusRef.current = status
    setConnectionStatus(status)
    
    // Show connection status toasts (but not on initial load)
    if (previousStatus !== 'disconnected' || status !== 'connecting') {
      if (status === 'connected' && previousStatus !== 'connected') {
        // Only show if we were previously disconnected/error
        if (previousStatus === 'error' || previousStatus === 'disconnected') {
          toast.success(toastMessages.messages.connectionRestored)
        }
      } else if (status === 'error' || status === 'disconnected') {
        // Only show if we were previously connected
        if (previousStatus === 'connected') {
          toast.warning(toastMessages.messages.connectionLost)
        }
      }
    }
  }

  const fetchMessages = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(`/api/messages?request_id=${requestId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch messages')
      }

      const messages = data.messages || []
      setMessages(messages)
      lastMessageCountRef.current = messages.length
    } catch (err) {
      const errorMessage = err.message || 'Failed to load messages'
      setError(errorMessage)
      toast.error(toastMessages.messages.loadError)
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscription = () => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe()
    }
  
    updateConnectionStatus('connecting')
  
    const channel = supabase
      .channel(`messages-request-${requestId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `request_id=eq.${requestId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new])
        }
      )
      // Listen for typing events
      .on('broadcast', { event: 'typing' }, (payload) => {
        handleIncomingTypingEvent(payload.payload)
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          updateConnectionStatus('connected')
        } else if (status === 'CHANNEL_ERROR') {
          updateConnectionStatus('error')
        } else if (status === 'TIMED_OUT' || status === 'CLOSED') {
          updateConnectionStatus('disconnected')
        }
      })
  
    subscriptionRef.current = channel
  }
  
  const handleIncomingTypingEvent = (payload) => {
    // Ignore our own typing events
    if (payload.user_id === user?.id) return
    
    setTypingUsers((current) => {
      // Remove user if they stopped typing
      if (!payload.is_typing) {
        return current.filter(u => u.user_id !== payload.user_id)
      }
      
      // Add or update user if they're typing
      const existingUserIndex = current.findIndex(u => u.user_id === payload.user_id)
      
      if (existingUserIndex >= 0) {
        // Update existing user
        const updated = [...current]
        updated[existingUserIndex] = {
          user_id: payload.user_id,
          name: payload.user_name
        }
        return updated
      } else {
        // Add new user
        return [
          ...current,
          {
            user_id: payload.user_id,
            name: payload.user_name
          }
        ]
      }
    })
  }
  
  useEffect(() => {
    if (requestId && user?.id) {
      fetchMessages()
      setupRealtimeSubscription()
      
      return () => {
        if (subscriptionRef.current) {
          subscriptionRef.current.unsubscribe()
          subscriptionRef.current = null
        }
      }
    }
  }, [requestId, user?.id])

  const broadcastTyping = (isTyping) => {
    if (subscriptionRef.current) {
      subscriptionRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          user_id: user?.id,
          user_name: user?.name || user?.email,
          is_typing: isTyping
        }
      })
    }
  }

  const handleTyping = () => {
    const now = Date.now()
    
    if (!isTyping) {
      setIsTyping(true)
      broadcastTyping(true)
    }
    
    lastTypingRef.current = now
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (Date.now() - lastTypingRef.current >= 1000) {
        setIsTyping(false)
        broadcastTyping(false)
      }
    }, 1000)
  }

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (isTyping) {
        broadcastTyping(false)
      }
    }
  }, [isTyping])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    const messageContent = newMessage.trim()

    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false)
      broadcastTyping(false)
    }

    setSending(true)
    setNewMessage('')

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: messageContent,
          request_id: requestId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message')
      }

      // The real-time subscription will handle adding the message to the UI
      
    } catch (err) {
      // Restore message to input for retry
      setNewMessage(messageContent)
      
      // Show error toast
      toast.error(err.message || toastMessages.messages.sendError)
    } finally {
      setSending(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now - date) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit'
      })
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  const getConnectionStatusText = (status) => {
    switch (status) {
      case 'connected':
        return 'Active'
      case 'connecting':
        return 'Connecting...'
      case 'disconnected':
        return 'Inactive'
      case 'error':
        return 'Error'
      default:
        return 'Unknown'
    }
  }

  const getConnectionStatusIndicator = (status) => {
    switch (status) {
      case 'connected':
        return <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Connected"></div>
      case 'connecting':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" title="Connecting..."></div>
      case 'disconnected':
        return <div className="w-2 h-2 bg-red-500 rounded-full" title="Disconnected"></div>
      case 'error':
        return <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" title="Connection Error"></div>
      default:
        return <div className="w-2 h-2 bg-gray-500 rounded-full" title="Unknown Status"></div>
    }
  }

  const getUserAvatar = (user) => {
    if (user?.avatar_url) {
      return (
        <img
          src={user.avatar_url}
          alt={user.name || user.email}
          className="w-8 h-8 rounded-full object-cover"
        />
      )
    }
    
    const initials = (user?.name || user?.email || 'U')
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)

    const colorClass = user?.role === 'admin' ? 'bg-gold' : 'bg-teal'

    return (
      <div className={`w-8 h-8 rounded-full ${colorClass} flex items-center justify-center text-white text-sm font-medium`}>
        {initials}
      </div>
    )
  }

  const isOwnMessage = (message) => {
    return message.sender_id === user?.id
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-deep-blue flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Messages
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <div className="max-w-xs space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex-shrink-0 p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-deep-blue flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {requestTitle} ({messages.length})
          
          {/* Connection Status Indicator */}
          <div className="ml-2 flex items-center">
            {getConnectionStatusIndicator(connectionStatus)}
          </div>
          
          {/* Status Text */}
          <span className="ml-2 text-xs text-gray-500">
            {getConnectionStatusText(connectionStatus)}
          </span>
        </h2>
      </div>

      {error && (
        <div className="flex-shrink-0 p-4 bg-red-50 border-b border-red-200">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800">Error Loading Messages</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={fetchMessages}
                className="text-sm text-red-800 underline mt-2 hover:text-red-900"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages List */}
      <div className="flex-1 p-6 space-y-4 overflow-y-auto min-h-0">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-gray-500 mb-2">No messages yet</p>
            <p className="text-sm text-gray-400">Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwn = isOwnMessage(message)
            const showAvatar = index === 0 || messages[index - 1].sender_id !== message.sender_id
            
            return (
              <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-xs lg:max-w-md ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2`}>
                  {showAvatar && !isOwn && (
                    <div className="flex-shrink-0">
                      {getUserAvatar(message.sender)}
                    </div>
                  )}
                  
                  <div className={`px-4 py-3 rounded-lg ${
                    isOwn 
                      ? 'bg-teal text-white rounded-br-none'
                      : 'bg-gray-100 text-gray-800 rounded-bl-none'
                  } ${!showAvatar && !isOwn ? 'ml-10' : ''}`}>
                    {showAvatar && (
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs font-medium opacity-75">
                          {message.sender?.name || message.sender?.email || 'Unknown User'}
                        </span>
                        {message.sender?.role === 'admin' && (
                          <span className="w-2 h-2 rounded-full bg-gold opacity-60" title="Admin"></span>
                        )}
                      </div>
                    )}
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <p className={`text-xs mt-2 opacity-60 ${
                      isOwn ? 'text-white' : 'text-gray-500'
                    }`}>
                      {formatDate(message.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })
        )}
        
        {/* Typing Indicators */}
        {typingUsers.length > 0 && (
          <div className="flex justify-start">
            <div className="flex items-end space-x-2">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 bg-gray-100 text-gray-800 rounded-lg rounded-bl-none">
                <p className="text-xs text-gray-500 mb-1">
                  {typingUsers.length === 1 
                    ? `${typingUsers[0].name} is typing...`
                    : typingUsers.length === 2
                    ? `${typingUsers[0].name} and ${typingUsers[1].name} are typing...`
                    : `${typingUsers.length} people are typing...`
                  }
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="flex-shrink-0 p-6 border-t border-gray-200 bg-white">
        <form onSubmit={handleSendMessage} className="flex space-x-3">
          <div className="flex-shrink-0">
            {getUserAvatar(user)}
          </div>
          <div className="flex-1 flex space-x-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value)
                if (e.target.value.length > 0) {
                  handleTyping()
                } else if (isTyping) {
                  setIsTyping(false)
                  broadcastTyping(false)
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage(e)
                } else if (newMessage.length > 0) {
                  handleTyping()
                }
              }}
              disabled={sending}
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent disabled:opacity-50 text-black"
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="px-4 py-2 bg-teal text-white rounded-lg hover:bg-teal/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {sending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
              <span className="hidden sm:inline">{sending ? 'Sending...' : 'Send'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}