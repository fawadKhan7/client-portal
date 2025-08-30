'use client'

import { useRouter } from 'next/navigation'
import FileSolidIcon from '../icons/FileSolidIcon'
import FileIcon from '../icons/FileIcon'

export default function RecentFilesCard({ recentFiles, loading, formatTimeAgo, formatFileSize, getFileIconColor }) {
  const router = useRouter()

  return (
    <div className="bg-white rounded-lg shadow-soft">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-deep-blue">Recent Files</h2>
          <button 
            onClick={() => router.push('/files')}
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
        ) : recentFiles.length > 0 ? (
          <div className="space-y-4">
            {recentFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileSolidIcon className={`w-8 h-8 ${getFileIconColor(file.original_name)}`} />
                  <div>
                    <p className="text-sm font-medium text-deep-blue">{file.original_name}</p>
                    <p className="text-xs text-gray-400">{formatFileSize(file.file_size)}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400">{formatTimeAgo(file.created_at)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">No recent files</p>
          </div>
        )}
      </div>
    </div>
  )
}
