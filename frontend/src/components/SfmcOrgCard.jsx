import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function SfmcOrgCard({ account, onDelete }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const navigate = useNavigate()

  const handleViewData = () => {
    navigate(`/sfmc/dashboard?accountId=${account.id}`)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/auth/sfmc/orgs/${account.id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        onDelete(account.id)
        // Show message that they'll need to login again
        alert('✅ Disconnected successfully!\n\nWhen you reconnect, you\'ll be asked to login to SFMC again.')
      } else {
        throw new Error('Failed to delete')
      }
    } catch (error) {
      console.error('Error deleting account:', error)
      alert('Failed to delete account. Please try again.')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const getTimeSince = (timestamp) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  return (
    <div className="bg-white rounded-lg shadow-md border-2 border-orange-200 p-6 hover:shadow-lg transition-shadow relative">
      {/* SFMC Badge */}
      <div className="absolute top-4 right-4">
        <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">
          MARKETING CLOUD
        </span>
      </div>

      {/* Account Info */}
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-900 mb-1">
          {account.subdomain}
        </h3>
        <p className="text-sm text-gray-500">
          Account ID: {account.id}
        </p>
      </div>

      {/* Connection Details */}
      <div className="bg-orange-50 rounded-lg p-3 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-orange-900">Active Connection</span>
        </div>
        <div className="text-xs text-orange-700 space-y-1">
          <p>Connected: {getTimeSince(account.connectedAt)}</p>
          {account.restEndpoint && (
            <p className="font-mono text-xs truncate">
              {account.restEndpoint}
            </p>
          )}
        </div>
      </div>

      {/* Token Status */}
      <div className="mb-4 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <span className="font-medium">Token expires in:</span>
          <span className="text-orange-600 font-semibold">
            {Math.max(0, Math.floor((account.expiresAt - Date.now()) / 60000))} minutes
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      {!showDeleteConfirm ? (
        <div className="flex gap-3">
          <button
            onClick={handleViewData}
            className="flex-1 px-4 py-2 text-white rounded-lg font-medium hover:opacity-90 transition"
            style={{ backgroundColor: '#FF6600' }}
          >
            View Data
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 border-2 border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 transition"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-900 mb-3">
            Are you sure? This will remove the connection.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50"
            >
              {isDeleting ? 'Disconnecting...' : 'Yes, Disconnect'}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SfmcOrgCard
