/**
 * Salesforce Marketing Cloud API proxy routes
 * All routes require an accountId (SFMC MID) to identify which SFMC account to use
 */

const express = require('express');
const { callSfmcApi } = require('../services/sfmcApiService');
const sfmcTokenStore = require('../services/sfmcTokenStore');
const { 
  fetchAllDataExtensions, 
  fetchAllSubscribers 
} = require('../services/sfmcSoapService');

const router = express.Router();

/**
 * GET /api/sfmc/:accountId/info
 * Get SFMC account connection info (without sensitive tokens)
 */
router.get('/:accountId/info', async (req, res) => {
  const { accountId } = req.params;
  const accountData = sfmcTokenStore.get(accountId);

  if (!accountData) {
    return res.status(404).json({
      success: false,
      error: 'SFMC account not connected'
    });
  }

  // Test the API connection by calling tokenContext
  try {
    const tokenContext = await callSfmcApi(accountId, '/platform/v1/tokenContext');
    
    // Return account data without exposing tokens
    const { accessToken, refreshToken, ...safeData } = accountData;

    res.json({
      success: true,
      data: {
        ...safeData,
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        tokenLength: accessToken ? accessToken.length : 0,
        apiTest: 'Success - API is working',
        tokenContext: tokenContext
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'API connection test failed: ' + error.message
    });
  }
});

/**
 * GET /api/sfmc/:accountId/subscribers
 * Fetch subscribers using SFMC SOAP API
 */
router.get('/:accountId/subscribers', async (req, res) => {
  const { accountId } = req.params;

  try {
    console.log(`🧼 Fetching subscribers for account ${accountId} via SOAP...`);
    
    // Use comprehensive SOAP service with pagination
    const subscribers = await fetchAllSubscribers(accountId);
    
    return res.json({
      success: true,
      data: subscribers,
      total: subscribers.length,
      accountId,
      source: 'SOAP API - Subscribers (Paginated)'
    });
  } catch (error) {
    console.error(`❌ SFMC SOAP Subscribers fetch failed for ${accountId}:`, error.message);
    
    // Fallback to REST API if SOAP fails
    try {
      console.log('📡 Trying REST API fallback for subscribers...');
      const result = await callSfmcApi(accountId, '/contacts/v1/contacts?$page=1&$pagesize=50');
      const contacts = result.items || result.contacts || [];
      
      return res.json({
        success: true,
        data: contacts,
        total: result.count || contacts.length,
        accountId,
        source: 'REST API Fallback - Contacts'
      });
    } catch (restError) {
      // Both failed - return helpful message
      res.json({
        success: true,
        data: [{
          note: '📋 Subscriber APIs Not Available',
          reason: 'Both SOAP and REST APIs unavailable',
          soapError: error.message,
          restError: restError.message,
          explanation: 'This SFMC account may not have subscribers or required permissions',
          suggestion: 'Create subscribers in Email Studio or Audience Builder'
        }],
        total: 1,
        accountId
      });
    }
  }
});

/**
 * GET /api/sfmc/:accountId/campaigns
 * Fetch email campaigns/sends from SFMC using multiple REST API fallbacks
 */
router.get('/:accountId/campaigns', async (req, res) => {
  const { accountId } = req.params;

  // Try multiple email campaign endpoints
  
  // 1. Try Email Send Definitions (most comprehensive)
  try {
    const result = await callSfmcApi(accountId, '/messaging/v1/email/definitions');
    const definitions = result.entries || result.items || result.definitions || [];
    
    return res.json({
      success: true,
      data: definitions,
      total: result.count || definitions.length,
      accountId,
      source: 'Email Definitions API'
    });
  } catch (defError) {
    console.log('📡 Email Definitions unavailable, trying Messages...');
  }

  // 2. Try Email Messages
  try {
    const result = await callSfmcApi(accountId, '/messaging/v1/email/messages');
    const messages = result.entries || result.items || result.messages || [];
    
    return res.json({
      success: true,
      data: messages,
      total: result.count || messages.length,
      accountId,
      source: 'Email Messages API'
    });
  } catch (msgError) {
    console.log('📡 Email Messages unavailable, trying Asset API...');
  }

  // 3. Try Asset API (Content Builder emails)
  try {
    const result = await callSfmcApi(accountId, '/asset/v1/content/assets?$filter=assetType.name eq \'htmlemail\'&$pagesize=50');
    const assets = result.items || [];
    
    return res.json({
      success: true,
      data: assets,
      total: result.count || assets.length,
      accountId,
      source: 'Content Builder Assets'
    });
  } catch (assetError) {
    console.log('📡 All campaign APIs unavailable');
  }

  // Final fallback
  res.json({
    success: true,
    data: [{
      note: '📧 Email Campaign APIs Not Available',
      reason: 'All APIs returned 404',
      explanation: 'This SFMC account may not have Email Studio sends or Content Builder emails',
      suggestion: 'Create an email campaign in Email Studio or Content Builder',
      apis_tried: ['/messaging/v1/email/definitions', '/messaging/v1/email/messages', '/asset/v1/content/assets']
    }],
    total: 1,
    accountId
  });
});

/**
 * GET /api/sfmc/:accountId/dataextensions
 * Fetch data extensions using SFMC SOAP API
 */
router.get('/:accountId/dataextensions', async (req, res) => {
  const { accountId } = req.params;

  try {
    console.log(`🧼 Fetching Data Extensions for account ${accountId} via SOAP...`);
    
    // Use comprehensive SOAP service with pagination
    const dataExtensions = await fetchAllDataExtensions(accountId);
    
    return res.json({
      success: true,
      data: dataExtensions,
      total: dataExtensions.length,
      accountId,
      source: 'SOAP API - Data Extensions (Paginated)'
    });
  } catch (error) {
    console.error(`❌ SFMC SOAP Data Extensions fetch failed for ${accountId}:`, error.message);
    
    // Fallback to REST API if SOAP fails
    try {
      console.log('📡 Trying REST API fallback for data extensions...');
      const result = await callSfmcApi(accountId, '/data/v1/customobjectdata/key');
      const dataExtensions = result.items || [];
      
      return res.json({
        success: true,
        data: dataExtensions,
        total: result.count || dataExtensions.length,
        accountId,
        source: 'REST API Fallback - Data Extensions'
      });
    } catch (restError) {
      // Both failed - return helpful message
      res.json({
        success: true,
        data: [{
          note: '🗄️ Data Extension APIs Not Available',
          reason: 'Both SOAP and REST APIs unavailable',
          soapError: error.message,
          restError: restError.message,
          explanation: 'This SFMC account may not have Data Extensions created',
          suggestion: 'Create a Data Extension in Email Studio > Subscribers > Data Extensions'
        }],
        total: 1,
        accountId
      });
    }
  }
});

router.get('/:accountId/dataextensions-old-fallback', async (req, res) => {
  const { accountId } = req.params;

  try {
    const result = await callSfmcApi(accountId, '/hub/v1/dataevents/key:DEAudience/rowset');

    const dataExtensions = result.items || [{
      message: 'Data Extensions - API returns raw data structure',
      rawResponse: result
    }];

    res.json({
      success: true,
      data: dataExtensions,
      total: dataExtensions.length,
      accountId
    });
  } catch (error) {
    console.error(`❌ SFMC Data Extensions fetch failed for ${accountId}:`, error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      note: 'Data Extensions API requires specific permissions'
    });
  }
});

/**
 * GET /api/sfmc/:accountId/journeys
 * Fetch journeys from SFMC
 */
router.get('/:accountId/journeys', async (req, res) => {
  const { accountId } = req.params;

  try {
    // Use official Journey Builder API
    const result = await callSfmcApi(accountId, '/interaction/v1/interactions');

    // SFMC Journey API may return { entries: [...] } or { items: [...] }
    const journeys = result.entries || result.items || result.interactions || [];

    res.json({
      success: true,
      data: journeys,
      total: result.count || journeys.length,
      accountId
    });
  } catch (error) {
    console.error(`❌ SFMC Journeys fetch failed for ${accountId}:`, error.message);
    res.json({
      success: true,
      data: [{
        note: 'Demo Mode - Journeys unavailable',
        error: error.message
      }],
      total: 1,
      accountId
    });
  }
});

/**
 * GET /api/sfmc/:accountId/automations
 * Fetch automations from SFMC
 */
router.get('/:accountId/automations', async (req, res) => {
  const { accountId } = req.params;

  try {
    // Use official Automation Studio API
    const result = await callSfmcApi(accountId, '/automation/v1/automations');

    // SFMC Automation API returns { entries: [...], count: N }
    const automations = result.entries || result.items || result.automations || [];

    res.json({
      success: true,
      data: automations,
      total: result.count || automations.length,
      accountId
    });
  } catch (error) {
    console.error(`❌ SFMC Automations fetch failed for ${accountId}:`, error.message);
    res.json({
      success: true,
      data: [{
        note: 'Demo Mode - Automations unavailable',
        error: error.message
      }],
      total: 1,
      accountId
    });
  }
});

module.exports = router;
