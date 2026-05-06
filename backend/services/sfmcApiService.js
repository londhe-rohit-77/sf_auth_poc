/**
 * Salesforce Marketing Cloud API service with automatic token refresh
 * SFMC tokens expire much faster than CRM tokens (~18 minutes)
 */

const axios = require('axios');
const sfmcTokenStore = require('./sfmcTokenStore');

/**
 * Call SFMC API with automatic token refresh
 * @param {string} accountId - SFMC MID (Member ID)
 * @param {string} path - API path (e.g., /email/v1/lists/subscribers)
 * @param {string} method - HTTP method (GET, POST, PATCH, DELETE)
 * @param {Object} body - Request body for POST/PATCH
 * @returns {Promise<Object>} API response data
 */
async function callSfmcApi(accountId, path, method = 'GET', body = null) {
  const accountData = sfmcTokenStore.get(accountId);
  
  if (!accountData) {
    throw new Error(`SFMC account not connected: ${accountId}`);
  }

  // Check if token is expired or expiring soon - SFMC tokens are short-lived!
  if (sfmcTokenStore.isTokenExpired(accountId)) {
    console.log(`🔄 SFMC token expired for ${accountId}, refreshing...`);
    await refreshAccessToken(accountId);
    // Get updated account data after refresh
    const refreshedData = sfmcTokenStore.get(accountId);
    if (!refreshedData) {
      throw new Error(`Failed to refresh SFMC token for ${accountId}`);
    }
    accountData.accessToken = refreshedData.accessToken;
  }

  const url = `${accountData.restInstanceUrl}${path}`;
  
  const config = {
    method,
    url,
    headers: {
      'Authorization': `Bearer ${accountData.accessToken}`,
      'Content-Type': 'application/json'
    }
  };

  if (body && (method === 'POST' || method === 'PATCH')) {
    config.data = body;
  }

  try {
    console.log(`📡 SFMC API Call: ${method} ${path}`);
    const response = await axios(config);
    return response.data;
  } catch (error) {
    // If 401 Unauthorized, try to refresh token and retry once
    if (error.response && error.response.status === 401) {
      console.log(`🔄 SFMC token invalid for ${accountId}, attempting refresh...`);
      
      try {
        await refreshAccessToken(accountId);
        
        // Retry the original request with new token
        const refreshedAccountData = sfmcTokenStore.get(accountId);
        config.headers.Authorization = `Bearer ${refreshedAccountData.accessToken}`;
        
        console.log(`🔁 Retrying SFMC: ${method} ${path}`);
        const retryResponse = await axios(config);
        return retryResponse.data;
      } catch (refreshError) {
        console.error(`❌ SFMC token refresh failed for ${accountId}:`, refreshError.message);
        throw new Error(`SFMC token refresh failed: ${refreshError.message}`);
      }
    }

    // Handle other SFMC API errors
    if (error.response && error.response.data) {
      const sfmcError = error.response.data;
      // SFMC returns errors as: { message: string, errorcode: number, documentation: string }
      if (sfmcError.message) {
        throw new Error(`SFMC API Error: ${sfmcError.message} (${sfmcError.errorcode || 'unknown'})`);
      }
      throw new Error(`SFMC API Error: ${JSON.stringify(sfmcError)}`);
    }

    throw error;
  }
}

/**
 * Refresh SFMC access token using refresh token
 * @param {string} accountId - SFMC MID
 * @returns {Promise<string>} New access token
 */
async function refreshAccessToken(accountId) {
  const accountData = sfmcTokenStore.get(accountId);
  
  if (!accountData || !accountData.refreshToken) {
    throw new Error(`No refresh token available for SFMC account: ${accountId}`);
  }

  // SFMC token endpoint uses subdomain
  const tokenEndpoint = `https://${accountData.subdomain}.auth.marketingcloudapis.com/v2/token`;

  // SFMC uses JSON body (not form-encoded like SF CRM!)
  const requestBody = {
    grant_type: 'refresh_token',
    client_id: process.env.SFMC_CLIENT_ID,
    client_secret: process.env.SFMC_CLIENT_SECRET,
    refresh_token: accountData.refreshToken
  };

  try {
    const response = await axios.post(tokenEndpoint, requestBody, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const newAccessToken = response.data.access_token;
    const expiresIn = response.data.expires_in || 1079; // Default ~18 minutes
    const newExpiry = new Date(Date.now() + expiresIn * 1000);
    
    sfmcTokenStore.updateAccessToken(accountId, newAccessToken, newExpiry);
    
    console.log(`✅ Successfully refreshed SFMC token for account: ${accountId}`);
    console.log(`   New token expires at: ${newExpiry.toISOString()}`);
    return newAccessToken;
  } catch (error) {
    console.error(`❌ SFMC token refresh failed:`, error.response?.data || error.message);
    throw error;
  }
}

module.exports = {
  callSfmcApi,
  refreshAccessToken,
  callSfmcSoapApi
};

/**
 * Call SFMC SOAP API with automatic token refresh
 * @param {string} accountId - SFMC MID (Member ID)
 * @param {string} soapAction - SOAP Action (e.g., 'Retrieve')
 * @param {string} soapBody - SOAP XML body content
 * @returns {Promise<Object>} Parsed SOAP response
 */
async function callSfmcSoapApi(accountId, soapAction, soapBody) {
  const accountData = sfmcTokenStore.get(accountId);
  
  if (!accountData) {
    throw new Error(`SFMC account not connected: ${accountId}`);
  }

  // Check if token is expired
  if (sfmcTokenStore.isTokenExpired(accountId)) {
    console.log(`🔄 SFMC token expired for ${accountId}, refreshing...`);
    await refreshAccessToken(accountId);
    const refreshedData = sfmcTokenStore.get(accountId);
    if (!refreshedData) {
      throw new Error(`Failed to refresh SFMC token for ${accountId}`);
    }
    accountData.accessToken = refreshedData.accessToken;
  }

  // SOAP endpoint is different from REST
  const soapUrl = `${accountData.soapInstanceUrl}/Service.asmx`;
  
  // Build SOAP envelope
  const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" xmlns:a="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
  <s:Header>
    <a:Action s:mustUnderstand="1">${soapAction}</a:Action>
    <a:To s:mustUnderstand="1">${soapUrl}</a:To>
    <fueloauth xmlns="http://exacttarget.com">${accountData.accessToken}</fueloauth>
  </s:Header>
  <s:Body xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
    ${soapBody}
  </s:Body>
</s:Envelope>`;

  const config = {
    method: 'POST',
    url: soapUrl,
    headers: {
      'Content-Type': 'text/xml',
      'SOAPAction': soapAction
    },
    data: soapEnvelope
  };

  try {
    console.log(`🧼 SFMC SOAP Call: ${soapAction}`);
    const response = await axios(config);
    
    // Parse XML response - for now return raw XML
    // In production, you'd use xml2js or similar to parse
    return response.data;
  } catch (error) {
    // If 401, try refresh and retry
    if (error.response && error.response.status === 401) {
      console.log(`🔄 SFMC SOAP token invalid, refreshing...`);
      
      try {
        await refreshAccessToken(accountId);
        const refreshedAccountData = sfmcTokenStore.get(accountId);
        
        // Update token in SOAP envelope
        const newSoapEnvelope = soapEnvelope.replace(accountData.accessToken, refreshedAccountData.accessToken);
        config.data = newSoapEnvelope;
        
        console.log(`🔁 Retrying SFMC SOAP: ${soapAction}`);
        const retryResponse = await axios(config);
        return retryResponse.data;
      } catch (refreshError) {
        throw new Error(`SFMC SOAP token refresh failed: ${refreshError.message}`);
      }
    }

    throw new Error(`SFMC SOAP Error: ${error.response?.statusText || error.message}`);
  }
}
