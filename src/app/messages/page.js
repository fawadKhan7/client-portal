'use client'

import { useState, useRef } from 'react'
import Layout from '@/components/Layout'
import MessageList from '@/components/MessageList'
import { toast, toastMessages } from '@/lib/toast'
import { MessageIcon } from '@/components/icons'
import { formatMessageTime } from '@/helper'

export default function MessagesPage() {
  const [conversations, setConversations] = useState([])
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const userRef = useRef(null)

  const fetchConversations = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/requests', {
        credentials: 'include'
      })
      
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch conversations')
      }

      // Filter requests that have messages (for now, show all requests as potential conversations)
      setConversations(data.requests || [])
      
      // Auto-select first conversation if available
      if (data.requests && data.requests.length > 0 && !selectedRequest) {
        setSelectedRequest(data.requests[0])
      }
    } catch (err) {
      console.error('Error fetching conversations:', err)
      const errorMessage = err.message || 'Failed to load conversations'
      setError(errorMessage)
      toast.error(toastMessages.general.loadError)
    } finally {
      setLoading(false)
    }
  }

  const handleUserChange = (user) => {
    if (user && user.id !== userRef.current?.id) {
      userRef.current = user
      fetchConversations()
    }
  }

  const handleConversationSelect = (request) => {
    setSelectedRequest(request)
  }



  return (
    <Layout>
      {({ user }) => {
        handleUserChange(user)
        
        return (
          <div className="h-[calc(100vh-115px)] flex flex-col md:flex-row bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
            {/* Conversations List */}
            <div className="w-full md:w-1/3 md:min-w-[300px] border-b md:border-b-0 md:border-r border-gray-200 flex flex-col overflow-hidden max-h-64 md:max-h-none">
              <div className="p-6 border-b border-gray-200">
                <h1 className="text-xl font-semibold text-deep-blue">Messages</h1>
                <p className="text-sm text-gray-600 mt-1">
                  {user?.role === 'admin' ? 'Client conversations' : 'Your conversations'}
                </p>
              </div>

              {loading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal"></div>
                </div>
              ) : error ? (
                <div className="p-6 text-center">
                  <p className="text-red-600 mb-4">{error}</p>
                  <button
                    onClick={fetchConversations}
                    className="text-sm text-teal underline hover:text-teal/80"
                  >
                    Try again
                  </button>
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No conversations yet</p>
                    <p className="text-sm text-gray-400 mt-1">Create a request to start messaging</p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto">
                  {conversations.map((request) => (
                    <div
                      key={request.id}
                      onClick={() => handleConversationSelect(request)}
                      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedRequest?.id === request.id ? 'bg-teal bg-opacity-10 border-r-2 border-r-teal' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-teal rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {user?.role === 'admin' 
                              ? (request.client_profile?.name || 'C').charAt(0).toUpperCase()
                              : 'A'
                            }
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-deep-blue truncate">
                            {user?.role === 'admin' 
                              ? request.client_profile?.name || 'Client'
                              : 'Admin Team'
                            }
                          </p>
                          <p className="text-sm text-gray-600 truncate">
                            {request.title}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatMessageTime(request.created_at)}
                          </p>
                        </div>
                        {selectedRequest?.id === request.id && (
                          <div className="w-2 h-2 bg-teal rounded-full"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Message Area */}
            <div className="flex-1 flex flex-col overflow-hidden min-h-0">
              {selectedRequest ? (
                <div className="flex-1 flex flex-col min-h-0">
                  
                  {/* Messages */}
                  <div className="flex-1 overflow-hidden">
                    <MessageList
                      requestId={selectedRequest.id}
                      requestTitle={selectedRequest.title}
                      user={user}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                    <p className="text-gray-500">Choose a request from the left to start messaging</p>
                  </div>
                </div>
              )}
            </div>

          </div>
        )
      }}
    </Layout>
  )
}