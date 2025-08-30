'use client'

import { useState, useRef } from 'react'
import Layout from '../../../components/Layout'
import { toast } from '@/lib/toast'
import StatsGrid from '../../components/dashboard/StatsGrid'
import QuickActions from '../../components/dashboard/QuickActions'
import RecentRequestsCard from '../../components/dashboard/RecentRequestsCard'
import RecentMessagesCard from '../../components/dashboard/RecentMessagesCard'
import RecentFilesCard from '../../components/dashboard/RecentFilesCard'
import formatTimeAgo from '../../helper/formatTimeAgo'
import formatFileSize from '../../helper/formatFileSize'
import getFileIconColor from '../../helper/getFileIconColor'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    requests: { total: 0, pending: 0, in_progress: 0, completed: 0 },
    messages: 0,
    files: 0
  })
  const [recentMessages, setRecentMessages] = useState([])
  const [recentFiles, setRecentFiles] = useState([])
  const [recentRequests, setRecentRequests] = useState([])
  const userRef = useRef(null)

  // Fetch requests and calculate stats
  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/requests', {
        credentials: 'include'
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch requests')
      }

      const requests = data.requests || []
      setRecentRequests(requests.slice(0, 5))

      // Calculate stats
      setStats(prev => ({
        ...prev,
        requests: {
          total: requests.length,
          pending: requests.filter(r => r.status === 'pending').length,
          in_progress: requests.filter(r => r.status === 'in_progress').length,
          completed: requests.filter(r => r.status === 'completed').length
        }
      }))
    } catch (error) {
      console.error('Error fetching requests:', error)
      toast.error('Failed to load requests data')
    }
  }

  // Fetch recent files
  const fetchRecentFiles = async () => {
    try {
      const response = await fetch('/api/files', {
        credentials: 'include'
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch files')
      }

      const files = data.files || []
      setRecentFiles(files.slice(0, 5))
      setStats(prev => ({ ...prev, files: files.length }))
    } catch (error) {
      console.error('Error fetching files:', error)
      // Don't show toast for files - it's not critical
    }
  }

  // Fetch recent messages for the first request (as an example)
  const fetchRecentMessages = async () => {
    try {
      const response = await fetch('/api/requests', {
        credentials: 'include'
      })
      const requestData = await response.json()

      if (response.ok && requestData.requests?.length > 0) {
        const firstRequestId = requestData.requests[0].id
        
        const messagesResponse = await fetch(`/api/messages?request_id=${firstRequestId}`, {
          credentials: 'include'
        })
        const messagesData = await messagesResponse.json()

        if (messagesResponse.ok) {
          const messages = messagesData.messages || []
          setRecentMessages(messages.slice(-5).reverse()) // Get last 5, reverse for newest first
          setStats(prev => ({ ...prev, messages: messages.length }))
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
      // Don't show toast - messages are not critical for dashboard
    }
  }



  const handleUserChange = (user) => {
    if (user && user.id !== userRef.current?.id) {
      userRef.current = user
      fetchDashboardData()
    }
  }

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchRequests(),
        fetchRecentFiles(),
        fetchRecentMessages()
      ])
    } finally {
      setLoading(false)
    }
  }


  return (
    <Layout>
      {({ user }) => {
        handleUserChange(user)
        
        return (
          <div className="max-w-7xl mx-auto">
            {/* Page header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-deep-blue">Dashboard</h1>
              <p className="mt-2 text-gray-600">
                Welcome back, {user?.name || user?.email?.split('@')[0] || 'there'}! 
                {user?.role === 'admin' ? ' Admin Panel Overview' : ' Your Client Portal Overview'}
              </p>
            </div>

            {/* Quick Actions */}
            <QuickActions user={user} />

            {/* Stats grid */}
            <StatsGrid stats={stats} loading={loading} />

            {/* Recent activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Recent Requests Card */}
              <RecentRequestsCard 
                recentRequests={recentRequests} 
                loading={loading} 
                formatTimeAgo={formatTimeAgo} 
              />

              {/* Recent Messages Card */}
              <RecentMessagesCard 
                recentMessages={recentMessages} 
                loading={loading} 
                formatTimeAgo={formatTimeAgo} 
              />

              {/* Recent Files Card */}
              <RecentFilesCard 
                recentFiles={recentFiles} 
                loading={loading} 
                formatTimeAgo={formatTimeAgo} 
                formatFileSize={formatFileSize}
                getFileIconColor={getFileIconColor}
              />
            </div>
          </div>
        )
      }}
    </Layout>
  )
}
