'use client'

import { useRouter } from 'next/navigation'
import FileIcon from '../icons/FileIcon'
import RequestIcon from '../icons/RequestIcon'

export default function RecentRequestsCard({ recentRequests, loading, formatTimeAgo }) {
  const router = useRouter()

  return (
    <div className="bg-white rounded-lg shadow-soft">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-deep-blue">Recent Requests</h2>
          <button 
            onClick={() => router.push('/requests')}
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
        ) : recentRequests.length > 0 ? (
          <div className="space-y-4">
            {recentRequests.map((request) => (
              <div key={request.id} className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-teal rounded-full flex items-center justify-center">
                  <FileIcon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-deep-blue truncate">{request.title}</p>
                  <div className="flex items-center mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      request.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {request.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{formatTimeAgo(request.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <RequestIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">No requests yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
