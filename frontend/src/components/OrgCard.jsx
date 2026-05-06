import { useNavigate } from 'react-router-dom'

function OrgCard({ org, onDisconnect }) {
  const navigate = useNavigate()

  const formatTimeAgo = (isoString) => {
    const now = new Date()
    const then = new Date(isoString)
    const diffMs = now - then
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition">
      {/* Connected Status */}
      <div className="flex items-center gap-2 mb-3">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
        </span>
        <span className="text-sm font-medium text-green-600">Connected</span>
      </div>

      {/* Org Info */}
      <div className="mb-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-900">{org.orgName}</h3>
          {org.isSandbox && (
            <span className="inline-block bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded">
              🏖️ Sandbox
            </span>
          )}
        </div>
        <div className="space-y-1 text-sm text-gray-600">
          <p><span className="font-medium">User:</span> {org.userName}</p>
          <p><span className="font-medium">Email:</span> {org.userEmail}</p>
          <a
            href={org.instanceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
          >
            {org.instanceUrl}
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>

      {/* Connected Time */}
      <div className="text-xs text-gray-500 mb-4">
        Connected {formatTimeAgo(org.connectedAt)}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => navigate(`/dashboard?orgId=${org.orgId}`)}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition text-sm"
        >
          View Dashboard
        </button>
        <button
          onClick={() => onDisconnect(org.orgId)}
          className="px-4 py-2 border-2 border-red-600 text-red-600 rounded-lg font-medium hover:bg-red-50 transition text-sm"
        >
          Disconnect
        </button>
      </div>
    </div>
  )
}

export default OrgCard
