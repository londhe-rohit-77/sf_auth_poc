import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'

function SfmcDashboard() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const accountId = searchParams.get('accountId')

  const [activeTab, setActiveTab] = useState('subscribers')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [account, setAccount] = useState(null)

  useEffect(() => {
    if (!accountId) {
      navigate('/')
      return
    }

    // Fetch account info
    fetch(`/auth/sfmc/orgs/${accountId}`, {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        if (data.account) {
          setAccount(data.account)
        }
      })
      .catch(err => console.error('Error fetching account info:', err))
  }, [accountId, navigate])

  useEffect(() => {
    if (!accountId) return
    fetchData(activeTab)
  }, [accountId, activeTab])

  const fetchData = async (type) => {
    setLoading(true)
    setError(null)
    setData(null)

    try {
      const endpoints = {
        subscribers: `/api/sfmc/${accountId}/subscribers`,
        campaigns: `/api/sfmc/${accountId}/campaigns`,
        dataextensions: `/api/sfmc/${accountId}/dataextensions`,
        journeys: `/api/sfmc/${accountId}/journeys`,
        automations: `/api/sfmc/${accountId}/automations`
      }

      const response = await fetch(
        endpoints[type],
        { credentials: 'include' }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch data')
      }

      setData(result)
    } catch (err) {
      console.error('Error fetching SFMC data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'subscribers', label: 'Subscribers', icon: '👥' },
    { id: 'campaigns', label: 'Campaigns', icon: '📧' },
    { id: 'dataextensions', label: 'Data Extensions', icon: '🗄️' },
    { id: 'journeys', label: 'Journeys', icon: '🗺️' },
    { id: 'automations', label: 'Automations', icon: '⚙️' }
  ]

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4" style={{ borderColor: '#FF6600' }}></div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-900 font-semibold mb-2">Error loading data</p>
          <p className="text-red-700 text-sm mb-4">{error}</p>
          <button
            onClick={() => fetchData(activeTab)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      )
    }

    if (!data) {
      return (
        <div className="text-center py-12 text-gray-500">
          Select a tab to view data
        </div>
      )
    }

    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-orange-50 px-6 py-3 border-b border-orange-200">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-orange-900">
              {tabs.find(t => t.id === activeTab)?.label} Data
            </h3>
            {data.total !== undefined && (
              <span className="text-sm text-orange-700">
                {data.total} {data.total === 1 ? 'item' : 'items'}
              </span>
            )}
          </div>
        </div>
        
        <div className="p-6">
          {/* Debug info */}
          <div className="mb-4 text-sm text-gray-600">
            <strong>Response structure:</strong> {Object.keys(data).join(', ')}
            {data.data && Array.isArray(data.data) && (
              <span className="ml-4">Array length: {data.data.length}</span>
            )}
          </div>
          
          <pre className="bg-gray-50 rounded-lg p-4 overflow-auto text-xs font-mono max-h-[500px] whitespace-pre-wrap text-gray-800">
            {JSON.stringify(data.data || data, null, 2)}
          </pre>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="text-orange-600 hover:text-orange-700 mb-4 flex items-center gap-2"
          >
            ← Back to Home
          </button>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Marketing Cloud Dashboard
                </h1>
                {account && (
                  <p className="text-gray-600">
                    Connected to: <span className="font-semibold text-orange-600">{account.subdomain}</span>
                  </p>
                )}
              </div>
              <div className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg text-sm font-semibold">
                SFMC
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-6 p-2">
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[140px] px-4 py-3 rounded-lg font-medium transition ${
                  activeTab === tab.id
                    ? 'text-white'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
                style={activeTab === tab.id ? { backgroundColor: '#FF6600' } : {}}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {renderContent()}
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-sm text-orange-900">
            <strong>Note:</strong> SFMC tokens expire in approximately 18 minutes. 
            The backend automatically refreshes tokens as needed.
          </p>
        </div>
      </div>
    </div>
  )
}

export default SfmcDashboard
