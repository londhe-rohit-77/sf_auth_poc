import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

function SfmcCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const [status, setStatus] = useState('Processing...')

  useEffect(() => {
    const handleCallback = async () => {
      const accountId = searchParams.get('accountId')
      const success = searchParams.get('success')
      const errorParam = searchParams.get('error')

      // Handle success from backend redirect
      if (success === 'true' && accountId) {
        setStatus('SFMC connection successful! Redirecting...')
        setTimeout(() => {
          navigate('/')
        }, 1500)
        return
      }

      // Handle error from backend redirect
      if (errorParam) {
        setError(`SFMC Authorization failed: ${errorParam}`)
        return
      }

      // If we get here without success or error, something went wrong
      setError('OAuth callback completed but no success or error status received')
    }

    handleCallback()
  }, [searchParams, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#FFF8F0' }}>
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        {!error ? (
          <div className="text-center">
            {/* SFMC Logo/Icon */}
            <div className="mb-6">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: '#FF6600' }}>
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            {/* Loading Spinner */}
            <div className="mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 mx-auto" style={{ borderColor: '#FF6600' }}></div>
            </div>

            {/* Status Message */}
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Connecting Marketing Cloud
            </h2>
            <p className="text-gray-600">
              {status}
            </p>
          </div>
        ) : (
          <div className="text-center">
            {/* Error Icon */}
            <div className="mb-6">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>

            {/* Error Message */}
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Connection Failed
            </h2>
            <p className="text-red-600 mb-6">
              {error}
            </p>

            {/* Action Button */}
            <button
              onClick={() => navigate('/')}
              className="w-full px-6 py-3 text-white rounded-lg font-semibold hover:opacity-90 transition"
              style={{ backgroundColor: '#FF6600' }}
            >
              Return to Home
            </button>

            {/* Troubleshooting Hint */}
            <div className="mt-6 text-left bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-xs text-orange-900">
                <strong>Troubleshooting:</strong><br />
                • Verify your SFMC subdomain is correct<br />
                • Check that the Installed Package is configured<br />
                • Ensure redirect URI matches exactly<br />
                • Confirm client credentials are valid
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SfmcCallback
