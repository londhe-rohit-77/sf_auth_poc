/**
 * ApiExplorer Component
 * Shows the actual HTTP request being made (educational)
 */

function ApiExplorer({ soql, instanceUrl, duration, totalSize }) {
  return (
    <div className="bg-gray-900 text-gray-100 rounded-lg p-6 font-mono text-sm">
      <h4 className="text-white font-bold mb-4 font-sans">📡 API Request Details</h4>
      
      {/* Request Section */}
      <div className="mb-6">
        <div className="text-green-400 font-bold mb-2">REQUEST</div>
        <div className="border-t border-gray-700 pt-2 space-y-2">
          <div>
            <span className="text-blue-400">GET</span>{' '}
            <span className="text-gray-300">{instanceUrl}/services/data/v60.0/query</span>
          </div>
          <div>
            <span className="text-yellow-400">Authorization:</span>{' '}
            <span className="text-gray-400">Bearer ••••••••[hidden]</span>
          </div>
          <div className="mt-3">
            <span className="text-yellow-400">Query:</span>
            <div className="mt-1 pl-4 text-gray-300 break-words">
              {soql}
            </div>
          </div>
        </div>
      </div>

      {/* Response Section */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-green-400 font-bold">RESPONSE</span>
          <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">200 OK</span>
          <span className="text-gray-400 text-xs">({duration}ms)</span>
        </div>
        <div className="border-t border-gray-700 pt-2">
          <div className="text-gray-300">
            <span className="text-purple-400">&#123;</span>
            <div className="pl-4">
              <span className="text-blue-400">"totalSize"</span>
              <span className="text-gray-500">: </span>
              <span className="text-green-300">{totalSize}</span>
              <span className="text-gray-500">,</span>
            </div>
            <div className="pl-4">
              <span className="text-blue-400">"records"</span>
              <span className="text-gray-500">: [</span>
              <span className="text-gray-500">...</span>
              <span className="text-gray-500">]</span>
            </div>
            <span className="text-purple-400">&#125;</span>
          </div>
        </div>
      </div>

      {/* Educational Note */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <p className="text-xs text-gray-400 font-sans">
          💡 This shows the actual Salesforce REST API call. The access token is automatically refreshed 
          when expired using the refresh token stored securely on our backend.
        </p>
      </div>
    </div>
  )
}

export default ApiExplorer
