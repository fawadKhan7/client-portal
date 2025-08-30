'use client'

import { useRouter } from 'next/navigation'
import MessageIcon from '../icons/MessageIcon'

export default function RecentMessagesCard({ recentMessages, loading, formatTimeAgo }) {
  const router = useRouter()

  return (
    <div className="bg-white rounded-lg shadow-soft">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-deep-blue">Recent Messages</h2>
          <button 
            onClick={() => router.push('/messages')}
            className="text-sm text-teal hover:text-emerald-600 font-medium"
          >
            View All
          </button>
        </div>
      </div>
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-deep-blue"></div>
          </div>
        ) : recentMessages.length > 0 ? (
          <div className="space-y-4">
            {recentMessages.map((message) => (
              <div key={message.id} className="flex items-start space-x-3">
                <div className={`w-8 h-8 ${message.sender?.role === 'admin' ? 'bg-gold' : 'bg-teal'} rounded-full flex items-center justify-center`}>
                  <span className="text-xs font-medium text-white">
                    {(message.sender?.name || message.sender?.email || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-deep-blue">
                    {message.sender?.name || message.sender?.email || 'Unknown'}
                  </p>
                  <p className="text-sm text-gray-600 truncate">{message.content}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatTimeAgo(message.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <MessageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">No recent messages</p>
          </div>
        )}
      </div>
    </div>
  )
}
