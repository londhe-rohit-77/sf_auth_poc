import { useState, useEffect } from 'react'

function SubdomainModal({ isOpen, onClose, onConnect }) {
  const [subdomain, setSubdomain] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!subdomain.trim()) {
      setError('Subdomain is required')
      return
    }

    // Clean the subdomain input
    const cleanedSubdomain = subdomain.trim()
      .replace(/^https?:\/\//, '')                           // Remove protocol
      .replace(/\.auth\.marketingcloudapis\.com.*$/, '')    // Remove .auth.marketingcloudapis.com
      .replace(/\.rest\.marketingcloudapis\.com.*$/, '')    // Remove .rest.marketingcloudapis.com
      .replace(/\.marketingcloudapis\.com.*$/, '')          // Remove .marketingcloudapis.com
      .replace(/\.exacttarget\.com.*$/, '')                 // Remove .exacttarget.com
      .replace(/\.exacttarget.*$/, '')                       // Remove .exacttarget
      .replace(/\/+$/, '')                                   // Remove trailing slashes
      .replace(/\./g, '')                                    // NOW remove dots from subdomain (mc.s13 → mcs13)

    if (!cleanedSubdomain) {
      setError('Invalid subdomain format')
      return
    }

    onConnect(cleanedSubdomain)
  }

  const handleInputChange = (e) => {
    setSubdomain(e.target.value)
    setError('')
  }

  const getPreviewUrl = () => {
    if (!subdomain.trim()) return 'your-subdomain.auth.marketingcloudapis.com'
    
    const cleaned = subdomain.trim()
      .replace(/^https?:\/\//, '')
      .replace(/\.auth\.marketingcloudapis\.com.*$/, '')
      .replace(/\.rest\.marketingcloudapis\.com.*$/, '')
      .replace(/\.marketingcloudapis\.com.*$/, '')
      .replace(/\.exacttarget\.com.*$/, '')
      .replace(/\.exacttarget.*$/, '')
      .replace(/\/+$/, '')
      .replace(/\./g, '') // Remove dots after domain suffix removal
    
    return cleaned ? `${cleaned}.auth.marketingcloudapis.com` : 'your-subdomain.auth.marketingcloudapis.com'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Connect Marketing Cloud
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Explanation */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-orange-900">
              <span className="font-semibold">What is a subdomain?</span><br />
              Your SFMC subdomain is found in your Marketing Cloud URL.
            </p>
          </div>

          {/* Visual Example */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-2">Example URL breakdown:</p>
            <div className="bg-gray-100 rounded-lg p-4 font-mono text-sm space-y-3">
              <div>
                <span className="text-gray-500">https://</span>
                <span className="bg-yellow-200 text-gray-900 px-1 rounded">mc563885gzs27c5t9-63k636ttgm</span>
                <span className="text-gray-500">.rest.marketingcloudapis.com</span>
              </div>
              <div>
                <span className="text-gray-500">https://</span>
                <span className="bg-yellow-200 text-gray-900 px-1 rounded">mc.s13.exacttarget</span>
                <span className="text-gray-500">.com</span>
                <span className="text-gray-500 text-xs ml-2">(legacy format → becomes mcs13)</span>
              </div>
              <div className="text-gray-600 text-xs mt-2">
                ↑ The highlighted part is your <strong>subdomain</strong>. Dots will be removed automatically.
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Your SFMC Subdomain
              </label>
              <input
                type="text"
                value={subdomain}
                onChange={handleInputChange}
                placeholder="e.g. mc563885gzs27c5t9-63k636ttgm or mc.s13.exacttarget"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                autoFocus
              />
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
            </div>

            {/* Preview */}
            <div className="mb-6">
              <p className="text-xs font-medium text-gray-500 mb-1">Will connect to:</p>
              <p className="text-sm text-gray-700 font-mono bg-gray-50 rounded px-3 py-2">
                {getPreviewUrl()}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!subdomain.trim()}
                style={{ backgroundColor: subdomain.trim() ? '#FF6600' : '#CCCCCC' }}
                className="flex-1 px-6 py-3 text-white rounded-lg font-semibold hover:opacity-90 transition disabled:cursor-not-allowed"
              >
                Connect
              </button>
            </div>
          </form>

          {/* Help Text */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              💡 <strong>Can't find your subdomain?</strong> Login to SFMC and look at the URL in your browser's address bar.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SubdomainModal
