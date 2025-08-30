'use client'

import RequestIcon from '../icons/RequestIcon'
import ClockIcon from '../icons/ClockIcon'
import LightningIcon from '../icons/LightningIcon'
import CheckCircleIcon from '../icons/CheckCircleIcon'

export default function StatsGrid({ stats, loading }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total Requests */}
      <div className="bg-white rounded-lg p-6 shadow-soft">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-teal bg-opacity-10">
            <RequestIcon className="w-6 h-6 text-teal" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Total Requests</p>
            <p className="text-2xl font-bold text-deep-blue">{loading ? '...' : stats.requests.total}</p>
          </div>
        </div>
      </div>

      {/* Pending Requests */}
      <div className="bg-white rounded-lg p-6 shadow-soft">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-yellow-100">
            <ClockIcon className="w-6 h-6 text-yellow-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Pending Requests</p>
            <p className="text-2xl font-bold text-deep-blue">{loading ? '...' : stats.requests.pending}</p>
          </div>
        </div>
      </div>

      {/* In Progress */}
      <div className="bg-white rounded-lg p-6 shadow-soft">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-blue-100">
            <LightningIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">In Progress</p>
            <p className="text-2xl font-bold text-deep-blue">{loading ? '...' : stats.requests.in_progress}</p>
          </div>
        </div>
      </div>

      {/* Completed */}
      <div className="bg-white rounded-lg p-6 shadow-soft">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-green-100">
            <CheckCircleIcon className="w-6 h-6 text-green-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Completed</p>
            <p className="text-2xl font-bold text-deep-blue">{loading ? '...' : stats.requests.completed}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
