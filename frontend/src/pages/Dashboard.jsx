import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import ApiExplorer from '../components/ApiExplorer'

function Dashboard() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const orgId = searchParams.get('orgId')

  const [orgInfo, setOrgInfo] = useState(null)
  const [activeTab, setActiveTab] = useState('accounts')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Query Explorer state
  const [customQuery, setCustomQuery] = useState('SELECT Id, Name FROM Account LIMIT 5')
  const [queryResults, setQueryResults] = useState(null)
  const [queryLoading, setQueryLoading] = useState(false)
  const [queryError, setQueryError] = useState(null)
  const [queryDuration, setQueryDuration] = useState(null)
  const [viewMode, setViewMode] = useState('table') // table or json

  useEffect(() => {
    if (!orgId) {
      navigate('/')
      return
    }
    fetchOrgInfo()
  }, [orgId])

  const fetchOrgInfo = async () => {
    try {
      const response = await axios.get(`/api/${orgId}/info`)
      setOrgInfo(response.data.data)
    } catch (err) {
      setError('Failed to load org info: ' + err.message)
    }
  }

  const fetchData = async (endpoint) => {
    setLoading(true)
    setError(null)
    setData(null)

    try {
      const response = await axios.get(`/api/${orgId}/${endpoint}`)
      setData(response.data)
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  const runCustomQuery = async () => {
    setQueryLoading(true)
    setQueryError(null)
    setQueryResults(null)
    setQueryDuration(null)

    try {
      const startTime = Date.now()
      const response = await axios.post(`/api/${orgId}/query`, {
        soql: customQuery
      })
      const duration = Date.now() - startTime
      setQueryResults(response.data)
      setQueryDuration(duration)
    } catch (err) {
      setQueryError(err.response?.data?.error || err.message)
    } finally {
      setQueryLoading(false)
    }
  }

  const tabs = [
    { id: 'accounts', label: 'Accounts', endpoint: 'accounts' },
    { id: 'opportunities', label: 'Opportunities', endpoint: 'opportunities' },
    { id: 'leads', label: 'Leads', endpoint: 'leads' },
    { id: 'contacts', label: 'Contacts', endpoint: 'contacts' },
    { id: 'query', label: 'Query Explorer', endpoint: null }
  ]

  const renderTable = (records) => {
    if (!records || records.length === 0) {
      return <p className="text-gray-500 text-center py-8">No records found</p>
    }

    // Get column headers (excluding attributes)
    const columns = Object.keys(records[0]).filter(key => key !== 'attributes')

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map(col => (
                <th
                  key={col}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {records.map((record, idx) => (
              <tr key={record.Id || idx} className="hover:bg-gray-50">
                {columns.map(col => (
                  <td key={col} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record[col] !== null && record[col] !== undefined
                      ? String(record[col])
                      : '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const renderDataTab = () => {
    const currentTab = tabs.find(t => t.id === activeTab)

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            {currentTab.label}
          </h3>
          {!loading && !data && (
            <button
              onClick={() => fetchData(currentTab.endpoint)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Fetch Data
            </button>
          )}
          {data && (
            <button
              onClick={() => fetchData(currentTab.endpoint)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              🔄 Refresh
            </button>
          )}
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
            <p className="text-gray-600">Loading {currentTab.label.toLowerCase()}...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">Error: {error}</p>
            <button
              onClick={() => fetchData(currentTab.endpoint)}
              className="mt-2 text-red-600 hover:text-red-700 font-medium text-sm"
            >
              Retry →
            </button>
          </div>
        )}

        {data && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <span className="text-sm font-medium text-gray-700">
                {data.total} record{data.total !== 1 ? 's' : ''} found
              </span>
            </div>
            {renderTable(data.data)}
          </div>
        )}
      </div>
    )
  }

  const renderQueryExplorer = () => {
    return (
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            SOQL Query
          </label>
          <textarea
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded-lg p-3 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="SELECT Id, Name FROM Account LIMIT 5"
          />
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-gray-500">
              💡 Try: SELECT Id, Name, Industry FROM Account WHERE Industry != null LIMIT 10
            </p>
            <button
              onClick={runCustomQuery}
              disabled={queryLoading || !customQuery.trim()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {queryLoading ? 'Running...' : 'Run Query'}
            </button>
          </div>
        </div>

        {queryLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
            <p className="text-gray-600">Executing query...</p>
          </div>
        )}

        {queryError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">Error: {queryError}</p>
          </div>
        )}

        {queryResults && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">
                  {queryResults.total} record{queryResults.total !== 1 ? 's' : ''} • {queryDuration}ms
                </span>
                <div className="flex gap-2 border border-gray-300 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-3 py-1 rounded text-sm font-medium transition ${
                      viewMode === 'table'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Table
                  </button>
                  <button
                    onClick={() => setViewMode('json')}
                    className={`px-3 py-1 rounded text-sm font-medium transition ${
                      viewMode === 'json'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    JSON
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {viewMode === 'table' ? (
                renderTable(queryResults.data)
              ) : (
                <pre className="p-4 overflow-x-auto text-sm">
                  {JSON.stringify(queryResults.data, null, 2)}
                </pre>
              )}
            </div>

            {/* API Explorer Component */}
            <ApiExplorer
              soql={customQuery}
              instanceUrl={orgInfo?.instanceUrl}
              duration={queryDuration}
              totalSize={queryResults.total}
            />
          </div>
        )}
      </div>
    )
  }

  if (!orgInfo) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-3"></div>
          <p className="text-gray-600">Loading org info...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{orgInfo.orgName}</h1>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-sm text-green-600 font-medium">Connected</span>
              </div>
              {orgInfo.isSandbox && (
                <span className="inline-block bg-yellow-100 text-yellow-800 text-xs font-semibold px-3 py-1 rounded-full">
                  🏖️ Sandbox
                </span>
              )}
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">User:</span> {orgInfo.userName} ({orgInfo.userEmail})</p>
              <p>
                <span className="font-medium">Instance:</span>{' '}
                <a
                  href={orgInfo.instanceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700"
                >
                  {orgInfo.instanceUrl}
                </a>
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-900 font-medium"
          >
            ← Back to Home
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  setData(null)
                  setError(null)
                }}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'query' ? renderQueryExplorer() : renderDataTab()}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
