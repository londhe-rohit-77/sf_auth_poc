import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'

function Callback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading') // loading, success, error
  const [message, setMessage] = useState('')
  const [orgInfo, setOrgInfo] = useState(null)
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    const success = searchParams.get('success')
    const orgId = searchParams.get('orgId')
    const error = searchParams.get('error')

    if (error) {
      setStatus('error')
      setMessage(error)
      return
    }

    if (success && orgId) {
      // Simulate a short loading period
      setTimeout(() => {
        fetchOrgInfo(orgId)
      }, 1500)
    } else {
      setStatus('error')
      setMessage('Invalid callback parameters')
    }
  }, [searchParams])

  const fetchOrgInfo = async (orgId) => {
    try {
      const response = await axios.get(`/api/${orgId}/info`)
      setOrgInfo(response.data.data)
      setStatus('success')
      
      // Start countdown
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            navigate(`/dashboard?orgId=${orgId}`)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    } catch (err) {
      setStatus('error')
      setMessage('Failed to fetch org info: ' + err.message)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Completing connection...
          </h2>
          <p className="text-gray-600">Please wait while we verify your Salesforce org</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-semibold text-red-900 mb-3">
              Connection Failed
            </h2>
            <p className="text-red-700 mb-6">{message}</p>
            <button
              onClick={() => navigate('/')}
              className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-8 text-center">
            {/* Success Animation */}
            <div className="inline-block mb-4">
              <div className="relative">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center animate-pulse-slow">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>

            <h2 className="text-3xl font-bold text-green-900 mb-3">
              Successfully Connected!
            </h2>

            {orgInfo && (
              <div className="bg-white rounded-lg p-4 mb-6 text-left">
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-500">Organization</span>
                    <p className="font-semibold text-gray-900">{orgInfo.orgName}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">User</span>
                    <p className="font-semibold text-gray-900">{orgInfo.userName}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Email</span>
                    <p className="font-semibold text-gray-900">{orgInfo.userEmail}</p>
                  </div>
                  {orgInfo.isSandbox && (
                    <div className="pt-2">
                      <span className="inline-block bg-yellow-100 text-yellow-800 text-xs font-semibold px-3 py-1 rounded-full">
                        🏖️ Sandbox
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-900 font-medium">
                Taking you to dashboard in <span className="text-2xl font-bold">{countdown}</span>...
              </p>
            </div>

            <button
              onClick={() => navigate(`/dashboard?orgId=${orgInfo.orgId}`)}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition w-full"
            >
              Go to Dashboard Now →
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default Callback
