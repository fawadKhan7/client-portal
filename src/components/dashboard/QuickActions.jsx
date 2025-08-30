'use client'

import { useRouter } from 'next/navigation'
import PlusIcon from '../icons/PlusIcon'
import MessageIcon from '../icons/MessageIcon'
import FileIcon from '../icons/FileIcon'

export default function QuickActions({ user }) {
  const router = useRouter()

  return (
    <div className="mb-8 flex flex-wrap gap-4">
      {user?.role !== 'admin' && (
        <button
          onClick={() => router.push('/requests')}
          className="btn-premium"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          New Request
        </button>
      )}
      <button
        onClick={() => router.push('/messages')}
        className="btn-secondary"
      >
        <MessageIcon className="w-5 h-5 mr-2" />
        View Messages
      </button>
      <button
        onClick={() => router.push('/files')}
        className="px-6 py-3 rounded-lg font-medium transition-all duration-200 ease-in-out bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
      >
        <FileIcon className="w-5 h-5 mr-2 inline" />
        Manage Files
      </button>
    </div>
  )
}
