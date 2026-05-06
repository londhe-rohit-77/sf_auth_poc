/**
 * SFMC Authentication routes - OAuth flow for Marketing Cloud
 * Key difference from CRM: Each SFMC account has unique subdomain
 */

const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const sfmcTokenStore = require('../services/sfmcTokenStore');

const router = express.Router();

const FRONTEND_URL = process.env.FRONTEND_URL;
const SFMC_CLIENT_ID = process.env.SFMC_CLIENT_ID;
const SFMC_CLIENT_SECRET = process.env.SFMC_CLIENT_SECRET;
const SFMC_REDIRECT_URI = process.env.SFMC_REDIRECT_URI;

/**
 * GET /auth/sfmc/initiate
 * Initiates SFMC OAuth flow - requires subdomain parameter
 * Query params: ?subdomain=mc563885gzs27c5t9-63k636ttgm
 */
router.get('/initiate', (req, res) => {
  let { subdomain } = req.query;

  if (!subdomain) {
    return res.status(400).json({
      success: false,
      error: 'subdomain_required',
      message: 'SFMC subdomain is required. Example: mc563885gzs27c5t9-63k636ttgm'
    });
  }

  // Clean subdomain: First remove domain suffixes, THEN remove dots from what remains
  subdomain = subdomain.trim()
    .replace(/^https?:\/\//, '')                           // Remove protocol
    .replace(/\.auth\.marketingcloudapis\.com.*$/, '')    // Remove .auth.marketingcloudapis.com
    .replace(/\.rest\.marketingcloudapis\.com.*$/, '')    // Remove .rest.marketingcloudapis.com
    .replace(/\.marketingcloudapis\.com.*$/, '')          // Remove .marketingcloudapis.com
    .replace(/\.exacttarget\.com.*$/, '')                 // Remove .exacttarget.com
    .replace(/\.exacttarget.*$/, '')                       // Remove .exacttarget
    .replace(/\/+$/, '')                                   // Remove trailing slashes
    .replace(/\./g, '');                                   // NOW remove dots from subdomain (mc.s13 → mcs13)

  console.log('\n🔗 SFMC OAuth Flow Started');
  console.log(`   Subdomain: ${subdomain}`);

  // Generate random state for CSRF protection
  const state = crypto.randomBytes(16).toString('hex');
  
  // Store state and subdomain in session
  req.session.sfmcState = {
    state,
    subdomain
  };

  console.log(`   State: ${state}`);

  // Build SFMC OAuth authorization URL
  const authUrl = new URL(`https://${subdomain}.auth.marketingcloudapis.com/v2/authorize`);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('client_id', SFMC_CLIENT_ID);
  authUrl.searchParams.append('redirect_uri', SFMC_REDIRECT_URI);
  // Don't specify scope - uses permissions from Installed Package
  authUrl.searchParams.append('state', state);
  // Force fresh login prompt (don't reuse existing sessions)
  authUrl.searchParams.append('prompt', 'login');

  console.log(`   Redirecting to: ${authUrl.origin}/v2/authorize`);
  console.log(`   Force fresh login: YES (prompt=login)`);
  
  res.redirect(authUrl.toString());
});

/**
 * GET /auth/sfmc/callback
 * Handles OAuth callback from SFMC
 * Exchanges authorization code for access + refresh tokens
 */
router.get('/callback', async (req, res) => {
  const { code, state, error, error_description } = req.query;

  console.log('\n🔙 SFMC OAuth Callback Received');

  // Handle OAuth error from SFMC
  if (error) {
    console.error(`   ❌ SFMC OAuth Error: ${error} - ${error_description}`);
    return res.redirect(`${FRONTEND_URL}/sfmc/callback?error=${encodeURIComponent(error_description || error)}`);
  }

  // Validate state to prevent CSRF attacks
  if (!req.session.sfmcState || state !== req.session.sfmcState.state) {
    console.error('   ❌ State mismatch - possible CSRF attack');
    return res.redirect(`${FRONTEND_URL}/sfmc/callback?error=${encodeURIComponent('State mismatch, possible CSRF attack')}`);
  }

  const { subdomain } = req.session.sfmcState;
  console.log(`   ✅ State validated`);
  console.log(`   Subdomain: ${subdomain}`);
  console.log(`   Code received: ${code.substring(0, 20)}...`);

  try {
    // SFMC token endpoint
    const tokenEndpoint = `https://${subdomain}.auth.marketingcloudapis.com/v2/token`;

    console.log(`   🔄 Exchanging code for tokens...`);

    // Exchange authorization code for tokens
    // IMPORTANT: SFMC uses JSON body, NOT form-encoded like SF CRM!
    const tokenRequestBody = {
      grant_type: 'authorization_code',
      client_id: SFMC_CLIENT_ID,
      client_secret: SFMC_CLIENT_SECRET,
      redirect_uri: SFMC_REDIRECT_URI,
      code: code
    };

    const tokenResponse = await axios.post(tokenEndpoint, tokenRequestBody, {
      headers: {
        'Content-Type'  : 'application/json'
      }
    });

    const {
      access_token,
      refresh_token,
      expires_in,
      rest_instance_url,
      soap_instance_url
    } = tokenResponse.data;

    console.log(`   ✅ Tokens received`);
    console.log(`   REST Instance: ${rest_instance_url}`);
    console.log(`   Token expires in: ${expires_in} seconds (~${Math.round(expires_in / 60)} minutes)`);

    // Calculate token expiry
    const tokenExpiry = new Date(Date.now() + expires_in * 1000);

    // Fetch account information
    console.log(`   📋 Fetching account info...`);
    
    let accountInfo;
    try {
      // Try /platform/v1/accounts/me first
      const accountResponse = await axios.get(`${rest_instance_url}/platform/v1/accounts/me`, {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      });
      accountInfo = accountResponse.data;
    } catch (err) {
      // Fallback to tokenContext if accounts/me fails
      console.log(`   ⚠️  /accounts/me failed, trying /tokenContext...`);
      const contextResponse = await axios.get(`${rest_instance_url}/platform/v1/tokenContext`, {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      });
      accountInfo = contextResponse.data.organization || contextResponse.data;
    }

    const accountId = String(accountInfo.id || accountInfo.mid || accountInfo.enterpriseId);
    const accountName = accountInfo.name || accountInfo.businessName || `SFMC Account ${accountId}`;

    console.log(`   ✅ Account info fetched`);
    console.log(`   Account ID (MID): ${accountId}`);
    console.log(`   Account Name: ${accountName}`);

    // Save connection to SFMC token store
    sfmcTokenStore.save(accountId, {
      accountId,
      accountName,
      subdomain,
      accessToken: access_token,
      refreshToken: refresh_token,
      tokenExpiry: tokenExpiry,
      restInstanceUrl: rest_instance_url,
      soapInstanceUrl: soap_instance_url,
      connectedAt: new Date().toISOString()
    });

    // Clear OAuth state from session
    delete req.session.sfmcState;

    console.log(`   🎉 SFMC connection complete!\n`);

    // Redirect to frontend success page
    res.redirect(`${FRONTEND_URL}/sfmc/callback?accountId=${accountId}&success=true`);
  } catch (error) {
    console.error('   ❌ SFMC token exchange failed:', error.response?.data || error.message);
    res.redirect(`${FRONTEND_URL}/sfmc/callback?error=${encodeURIComponent('Token exchange failed: ' + error.message)}`);
  }
});

/**
 * GET /auth/sfmc/orgs
 * Returns list of all connected SFMC accounts (without tokens)
 */
router.get('/orgs', (req, res) => {
  const accounts = sfmcTokenStore.getAll();
  console.log(`📊 Fetched ${accounts.length} connected SFMC account(s)`);
  
  // Format accounts for frontend
  const formattedAccounts = accounts.map(acc => ({
    id: acc.accountId,
    subdomain: acc.subdomain,
    name: acc.accountName,
    restEndpoint: acc.restInstanceUrl,
    connectedAt: new Date(acc.connectedAt).getTime(),
    expiresAt: new Date(acc.tokenExpiry).getTime()
  }));
  
  res.json({
    success: true,
    accounts: formattedAccounts,
    count: formattedAccounts.length
  });
});

/**
 * GET /auth/sfmc/orgs/:accountId
 * Get specific SFMC account details
 */
router.get('/orgs/:accountId', (req, res) => {
  const { accountId } = req.params;
  const account = sfmcTokenStore.get(accountId);

  if (account) {
    res.json({
      success: true,
      account: {
        id: account.accountId,
        subdomain: account.subdomain,
        name: account.accountName,
        restEndpoint: account.restInstanceUrl,
        connectedAt: new Date(account.connectedAt).getTime(),
        expiresAt: new Date(account.tokenExpiry).getTime()
      }
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'SFMC account not found'
    });
  }
});

/**
 * DELETE /auth/sfmc/orgs/:accountId
 * Disconnect an SFMC account by removing it from token store
 */
router.delete('/orgs/:accountId', (req, res) => {
  const { accountId } = req.params;
  
  console.log(`\n🔌 Disconnecting SFMC account: ${accountId}`);
  
  const deleted = sfmcTokenStore.delete(accountId);

  if (deleted) {
    // Clear any session data related to this account
    if (req.session.sfmcState) {
      delete req.session.sfmcState;
    }
    
    console.log(`✅ SFMC account ${accountId} disconnected successfully`);
    console.log(`   Next connection will require fresh login (prompt=login)`);
    
    res.json({
      success: true,
      message: 'SFMC account disconnected successfully. You will need to login again when reconnecting.'
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'SFMC account not found'
    });
  }
});

/**
 * POST /auth/sfmc/refresh/:accountId
 * Manually trigger token refresh for an SFMC account
 */
router.post('/refresh/:accountId', async (req, res) => {
  const { accountId } = req.params;
  
  try {
    const { refreshAccessToken } = require('../services/sfmcApiService');
    await refreshAccessToken(accountId);
    
    res.json({
      success: true,
      message: 'SFMC token refreshed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
