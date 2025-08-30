'use client'

import { useState, useRef } from 'react'
import Layout from '@/components/Layout'
import FileList from '@/components/FileList'
import { RequestIcon, MessageIcon, PlusSimpleIcon } from '@/components/icons'

export default function FilesPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const userRef = useRef(null)

  const handleUserChange = (user) => {
    if (user && user.id !== userRef.current?.id) {
      userRef.current = user
      // Trigger initial load by updating refresh trigger
      setRefreshTrigger(prev => prev + 1)
    }
  }

  const handleFileUpload = () => {
    // Refresh the file list when a new file is uploaded
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <Layout>
      {({ user }) => {
        handleUserChange(user)
        
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-deep-blue">Files</h1>
                <p className="text-gray-600 mt-1">
                  {user?.role === 'admin' 
                    ? 'Manage all files and uploads from clients'
                    : 'Your uploaded files and shared documents'
                  }
                </p>
              </div>
            </div>

            {/* Files List */}
            <FileList
              requestId={null} // Show all files, not filtered by request
              user={user}
              onFileUpload={handleFileUpload}
              refreshTrigger={refreshTrigger}
            />

            {/* Info Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-blue-900 mb-2">File Management</h3>
              <div className="text-sm text-blue-800 space-y-2">
                <p>• Files are organized by requests and automatically linked to conversations</p>
                <p>• Supported formats: PDF, DOC, TXT, Images, Excel (Max 10MB per file)</p>
                <p>• {user?.role === 'admin' 
                    ? 'You can view and manage all client files' 
                    : 'You can upload files and download shared documents from admins'
                  }</p>
                <p>• For better organization, upload files directly from request detail pages</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <a
                href="/requests"
                className="block p-6 bg-white rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-all hover:border-teal"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-teal rounded-lg flex items-center justify-center">
                    <RequestIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-deep-blue">View Requests</h3>
                    <p className="text-sm text-gray-600">Manage files within specific requests</p>
                  </div>
                </div>
              </a>

              <a
                href="/messages"
                className="block p-6 bg-white rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-all hover:border-teal"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gold rounded-lg flex items-center justify-center">
                    <MessageIcon className="w-5 h-5 text-deep-blue" />
                  </div>
                  <div>
                    <h3 className="font-medium text-deep-blue">Messages</h3>
                    <p className="text-sm text-gray-600">Discuss files in conversations</p>
                  </div>
                </div>
              </a>

              {user?.role !== 'admin' && (
                <a
                  href="/requests"
                  className="block p-6 bg-white rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-all hover:border-teal"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <PlusSimpleIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-deep-blue">New Request</h3>
                      <p className="text-sm text-gray-600">Create a request with file attachments</p>
                    </div>
                  </div>
                </a>
              )}
            </div>
          </div>
        )
      }}
    </Layout>
  )
}