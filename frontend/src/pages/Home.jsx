import { useState, useEffect } from 'react'
import axios from 'axios'
import OrgCard from '../components/OrgCard'
import SfmcOrgCard from '../components/SfmcOrgCard'
import SubdomainModal from '../components/SubdomainModal'

function Home() {
  const [orgs, setOrgs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // SFMC state
  const [sfmcAccounts, setSfmcAccounts] = useState([])
  const [sfmcLoading, setSfmcLoading] = useState(true)
  const [sfmcError, setSfmcError] = useState(null)
  const [showSubdomainModal, setShowSubdomainModal] = useState(false)

  useEffect(() => {
    fetchOrgs()
    fetchSfmcAccounts()
  }, [])

  const fetchOrgs = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get('/auth/orgs')
      setOrgs(response.data.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchSfmcAccounts = async () => {
    try {
      setSfmcLoading(true)
      setSfmcError(null)
      const response = await axios.get('/auth/sfmc/orgs')
      setSfmcAccounts(response.data.accounts || [])
    } catch (err) {
      setSfmcError(err.message)
    } finally {
      setSfmcLoading(false)
    }
  }

  const handleConnect = (isSandbox = false) => {
    const url = `/auth/salesforce/connect${isSandbox ? '?sandbox=true' : ''}`
    window.location.href = url
  }

  const handleDisconnect = async (orgId) => {
    if (!confirm('Are you sure you want to disconnect this org?')) {
      return
    }

    try {
      await axios.delete(`/auth/orgs/${orgId}`)
      fetchOrgs() // Refresh list
    } catch (err) {
      alert('Failed to disconnect: ' + err.message)
    }
  }

  const handleSfmcConnect = (subdomain) => {
    setShowSubdomainModal(false)
    // Use ngrok URL directly to ensure session works with OAuth callback
    window.location.href = `https://senior-recluse-overfeed.ngrok-free.dev/auth/sfmc/initiate?subdomain=${encodeURIComponent(subdomain)}`
  }

  const handleSfmcDelete = (accountId) => {
    setSfmcAccounts(prev => prev.filter(acc => acc.id !== accountId))
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Salesforce CRM Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        {/* Left Section - How it works */}
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Connect your Salesforce CRM
            </h1>
            <p className="text-lg text-gray-600">
              Just like Clientell — one click OAuth connection
            </p>
          </div>

          {/* Visual step flow */}
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xl">
                  🔗
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Step 1: Click Connect</h3>
                <p className="text-gray-600">We redirect you to Salesforce login</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xl">
                  🔐
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Step 2: Login to Salesforce</h3>
                <p className="text-gray-600">Enter your org credentials</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xl">
                  ✅
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Step 3: Grant Access</h3>
                <p className="text-gray-600">Allow this app to access your org</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-xl">
                  🚀
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Step 4: Connected!</h3>
                <p className="text-gray-600">Start exploring your Salesforce data</p>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-4 pt-4">
            <button
              onClick={() => handleConnect(false)}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition shadow-md"
            >
              Connect Production Org
            </button>
            <button
              onClick={() => handleConnect(true)}
              className="w-full border-2 border-blue-600 text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
            >
              Connect Sandbox Org
            </button>
            <p className="text-sm text-gray-500 text-center">
              No Salesforce Setup access needed. We handle everything.
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <span className="text-2xl">💡</span>
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900 mb-1">How this works</h4>
                <p className="text-sm text-blue-800">
                  We (the SaaS provider) own ONE Connected App with credentials stored on our backend.
                  You never need to touch Salesforce Setup — just click Connect and authorize.
                  This is exactly how Clientell and other SaaS tools integrate with Salesforce.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Connected Orgs */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Connected Orgs</h2>
            <button
              onClick={fetchOrgs}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              🔄 Refresh
            </button>
          </div>

          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading orgs...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
              Error loading orgs: {error}
            </div>
          )}

          {!loading && !error && orgs.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔌</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No orgs connected yet
              </h3>
              <p className="text-gray-500">
                Click "Connect Production Org" to get started
              </p>
            </div>
          )}

          {!loading && !error && orgs.length > 0 && (
            <div className="space-y-4">
              {orgs.map(org => (
                <OrgCard
                  key={org.orgId}
                  org={org}
                  onDisconnect={handleDisconnect}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="relative my-16">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-gray-50 text-gray-500 font-medium">
            Also Connect To
          </span>
        </div>
      </div>

      {/* Salesforce Marketing Cloud Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left Section - SFMC Info */}
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Connect Marketing Cloud
            </h1>
            <p className="text-lg text-gray-600">
              Extend your integration to SFMC
            </p>
          </div>

          {/* Visual step flow */}
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-xl">
                  🏢
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Step 1: Enter Subdomain</h3>
                <p className="text-gray-600">Provide your SFMC subdomain</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-xl">
                  🔐
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Step 2: Login to SFMC</h3>
                <p className="text-gray-600">Authenticate with your Marketing Cloud credentials</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-xl">
                  ✅
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Step 3: Grant Access</h3>
                <p className="text-gray-600">Allow this app to access your SFMC data</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-xl">
                  🚀
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Step 4: Connected!</h3>
                <p className="text-gray-600">Access subscribers, campaigns, journeys, and more</p>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="space-y-4 pt-4">
            <button
              onClick={() => setShowSubdomainModal(true)}
              className="w-full text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition shadow-md"
              style={{ backgroundColor: '#FF6600' }}
            >
              Connect Marketing Cloud
            </button>
            <p className="text-sm text-gray-500 text-center">
              Requires SFMC Installed Package with OAuth enabled
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex gap-3">
              <span className="text-2xl">💡</span>
              <div className="flex-1">
                <h4 className="font-semibold text-orange-900 mb-1">SFMC Token Expiry</h4>
                <p className="text-sm text-orange-800">
                  Marketing Cloud tokens expire in approximately 18 minutes (much shorter than CRM's 2 hours).
                  Our backend automatically refreshes tokens before they expire to ensure seamless access.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Connected SFMC Accounts */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Connected Accounts</h2>
            <button
              onClick={fetchSfmcAccounts}
              className="hover:text-orange-700 text-sm font-medium"
              style={{ color: '#FF6600' }}
            >
              🔄 Refresh
            </button>
          </div>

          {sfmcLoading && (
            <div className="text-center py-12">
              <div 
                className="inline-block animate-spin rounded-full h-8 w-8 border-b-2"
                style={{ borderColor: '#FF6600' }}
              ></div>
              <p className="mt-2 text-gray-600">Loading accounts...</p>
            </div>
          )}

          {sfmcError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
              Error loading accounts: {sfmcError}
            </div>
          )}

          {!sfmcLoading && !sfmcError && sfmcAccounts.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📧</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No Marketing Cloud accounts connected
              </h3>
              <p className="text-gray-500">
                Click "Connect Marketing Cloud" to get started
              </p>
            </div>
          )}

          {!sfmcLoading && !sfmcError && sfmcAccounts.length > 0 && (
            <div className="space-y-4">
              {sfmcAccounts.map(account => (
                <SfmcOrgCard
                  key={account.id}
                  account={account}
                  onDelete={handleSfmcDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Subdomain Modal */}
      <SubdomainModal
        isOpen={showSubdomainModal}
        onClose={() => setShowSubdomainModal(false)}
        onConnect={handleSfmcConnect}
      />
    </div>
  )
}

export default Home
