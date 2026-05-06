/**
 * Salesforce API service with automatic token refresh
 */

const axios = require('axios');
const tokenStore = require('./tokenStore');

/**
 * Call Salesforce API with automatic token refresh on 401
 * @param {string} orgId - Salesforce Organization ID
 * @param {string} path - API path (e.g., /query?q=SELECT...)
 * @param {string} method - HTTP method (GET, POST, PATCH, DELETE)
 * @param {Object} body - Request body for POST/PATCH
 * @returns {Promise<Object>} API response data
 */
async function callSalesforceApi(orgId, path, method = 'GET', body = null) {
  const orgData = tokenStore.get(orgId);
  
  if (!orgData) {
    throw new Error(`Org not connected: ${orgId}`);
  }

  const url = `${orgData.instanceUrl}/services/data/v60.0${path}`;
  
  const config = {
    method,
    url,
    headers: {
      'Authorization': `Bearer ${orgData.accessToken}`,
      'Content-Type': 'application/json'
    }
  };

  if (body && (method === 'POST' || method === 'PATCH')) {
    config.data = body;
  }

  try {
    console.log(`📡 SF API Call: ${method} ${path}`);
    const response = await axios(config);
    return response.data;
  } catch (error) {
    // If 401 Unauthorized, try to refresh token and retry once
    if (error.response && error.response.status === 401) {
      console.log(`🔄 Token expired for org ${orgId}, attempting refresh...`);
      
      try {
        await refreshAccessToken(orgId);
        
        // Retry the original request with new token
        const refreshedOrgData = tokenStore.get(orgId);
        config.headers.Authorization = `Bearer ${refreshedOrgData.accessToken}`;
        
        console.log(`🔁 Retrying: ${method} ${path}`);
        const retryResponse = await axios(config);
        return retryResponse.data;
      } catch (refreshError) {
        console.error(`❌ Token refresh failed for org ${orgId}:`, refreshError.message);
        throw new Error(`Token refresh failed: ${refreshError.message}`);
      }
    }

    // Handle other Salesforce API errors
    if (error.response && error.response.data) {
      const sfError = error.response.data;
      // Salesforce returns errors as array: [{ message: "...", errorCode: "..." }]
      if (Array.isArray(sfError) && sfError.length > 0) {
        throw new Error(`Salesforce API Error: ${sfError[0].message} (${sfError[0].errorCode})`);
      }
      throw new Error(`Salesforce API Error: ${JSON.stringify(sfError)}`);
    }

    throw error;
  }
}

/**
 * Refresh access token using refresh token
 * @param {string} orgId - Salesforce Organization ID
 * @returns {Promise<string>} New access token
 */
async function refreshAccessToken(orgId) {
  const orgData = tokenStore.get(orgId);
  
  if (!orgData || !orgData.refreshToken) {
    throw new Error(`No refresh token available for org: ${orgId}`);
  }

  // Determine token endpoint based on sandbox flag
  const tokenEndpoint = orgData.isSandbox
    ? 'https://test.salesforce.com/services/oauth2/token'
    : 'https://login.salesforce.com/services/oauth2/token';

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: process.env.SF_CLIENT_ID,
    client_secret: process.env.SF_CLIENT_SECRET,
    refresh_token: orgData.refreshToken
  });

  try {
    const response = await axios.post(tokenEndpoint, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const newAccessToken = response.data.access_token;
    tokenStore.updateAccessToken(orgId, newAccessToken);
    
    console.log(`✅ Successfully refreshed token for org: ${orgId}`);
    return newAccessToken;
  } catch (error) {
    console.error(`❌ Token refresh failed:`, error.response?.data || error.message);
    throw error;
  }
}

module.exports = {
  callSalesforceApi,
  refreshAccessToken
};
