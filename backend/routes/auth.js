/**
 * Authentication routes - OAuth flow implementation
 * This is where the magic happens: users never touch Salesforce Setup
 * They just click "Connect" and we handle everything
 */

const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const tokenStore = require('../services/tokenStore');

const router = express.Router();

const FRONTEND_URL = process.env.FRONTEND_URL;
const SF_CLIENT_ID = process.env.SF_CLIENT_ID;
const SF_CLIENT_SECRET = process.env.SF_CLIENT_SECRET;
const SF_REDIRECT_URI = process.env.SF_REDIRECT_URI;

/**
 * GET /auth/salesforce/connect
 * Initiates OAuth flow by redirecting to Salesforce login
 * Query params: ?sandbox=true (optional, for sandbox orgs)
 */
router.get('/salesforce/connect', (req, res) => {
  const isSandbox = req.query.sandbox === 'true';
  
  // Generate random state for CSRF protection
  const state = crypto.randomBytes(16).toString('hex');
  
  // Store state and sandbox flag in session for validation in callback
  req.session.oauthState = {
    state,
    isSandbox
  };

  console.log('\n🔗 OAuth Flow Started');
  console.log(`   Type: ${isSandbox ? 'Sandbox' : 'Production'}`);
  console.log(`   State: ${state}`);

  // Build Salesforce OAuth authorization URL
  const baseUrl = isSandbox
    ? 'https://test.salesforce.com'
    : 'https://login.salesforce.com';

  const authUrl = new URL(`${baseUrl}/services/oauth2/authorize`);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('client_id', SF_CLIENT_ID);
  authUrl.searchParams.append('redirect_uri', SF_REDIRECT_URI);
  authUrl.searchParams.append('scope', 'api refresh_token full openid');
  authUrl.searchParams.append('state', state);
  authUrl.searchParams.append('prompt', 'login consent'); // Force login + consent screen every time

  console.log(`   Redirecting to: ${baseUrl}/services/oauth2/authorize`);
  
  res.redirect(authUrl.toString());
});

/**
 * GET /auth/salesforce/callback
 * Handles OAuth callback from Salesforce
 * Exchanges authorization code for access + refresh tokens
 */
router.get('/salesforce/callback', async (req, res) => {
  const { code, state, error, error_description } = req.query;

  console.log('\n🔙 OAuth Callback Received');

  // Handle OAuth error from Salesforce
  if (error) {
    console.error(`   ❌ OAuth Error: ${error} - ${error_description}`);
    return res.redirect(`${FRONTEND_URL}/callback?error=${encodeURIComponent(error_description || error)}`);
  }

  // Validate state to prevent CSRF attacks
  if (!req.session.oauthState || state !== req.session.oauthState.state) {
    console.error('   ❌ State mismatch - possible CSRF attack');
    return res.redirect(`${FRONTEND_URL}/callback?error=${encodeURIComponent('State mismatch, possible CSRF attack')}`);
  }

  const { isSandbox } = req.session.oauthState;
  console.log(`   ✅ State validated`);
  console.log(`   Code received: ${code.substring(0, 20)}...`);

  try {
    // Determine token endpoint based on sandbox flag
    const tokenEndpoint = isSandbox
      ? 'https://test.salesforce.com/services/oauth2/token'
      : 'https://login.salesforce.com/services/oauth2/token';

    console.log(`   🔄 Exchanging code for tokens...`);

    // Exchange authorization code for tokens
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: SF_CLIENT_ID,
      client_secret: SF_CLIENT_SECRET,
      redirect_uri: SF_REDIRECT_URI,
      code
    });

    const tokenResponse = await axios.post(tokenEndpoint, tokenParams.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const {
      access_token,
      refresh_token,
      instance_url,
      id: identityUrl
    } = tokenResponse.data;

    console.log(`   ✅ Tokens received`);
    console.log(`   Instance: ${instance_url}`);

    // Fetch user and org information from identity URL
    console.log(`   📋 Fetching user/org info...`);
    
    const identityResponse = await axios.get(identityUrl, {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    const identity = identityResponse.data;
    const orgId = identity.organization_id;
    const orgName = identity.display_name || identity.username.split('@')[1] || 'Salesforce Org';

    console.log(`   ✅ Identity fetched`);
    console.log(`   Org ID: ${orgId}`);
    console.log(`   Org Name: ${orgName}`);
    console.log(`   User: ${identity.display_name} (${identity.email})`);

    // Save connection to token store
    tokenStore.save(orgId, {
      orgId,
      orgName,
      userName: identity.display_name,
      userEmail: identity.email,
      instanceUrl: instance_url,
      accessToken: access_token,
      refreshToken: refresh_token,
      connectedAt: new Date().toISOString(),
      isSandbox
    });

    // Clear OAuth state from session
    delete req.session.oauthState;

    console.log(`   🎉 Connection complete!\n`);

    // Redirect to frontend success page
    res.redirect(`${FRONTEND_URL}/callback?orgId=${orgId}&success=true`);
  } catch (error) {
    console.error('   ❌ Token exchange failed:', error.response?.data || error.message);
    res.redirect(`${FRONTEND_URL}/callback?error=${encodeURIComponent('Token exchange failed: ' + error.message)}`);
  }
});

/**
 * GET /auth/orgs
 * Returns list of all connected orgs (without tokens)
 */
router.get('/orgs', (req, res) => {
  const orgs = tokenStore.getAll();
  console.log(`📊 Fetched ${orgs.length} connected org(s)`);
  
  res.json({
    success: true,
    data: orgs,
    count: orgs.length
  });
});

/**
 * DELETE /auth/orgs/:orgId
 * Disconnect an org by removing it from token store
 */
router.delete('/orgs/:orgId', (req, res) => {
  const { orgId } = req.params;
  const deleted = tokenStore.delete(orgId);

  if (deleted) {
    res.json({
      success: true,
      message: 'Org disconnected successfully'
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'Org not found'
    });
  }
});

/**
 * POST /auth/refresh/:orgId
 * Manually trigger token refresh for an org
 */
router.post('/refresh/:orgId', async (req, res) => {
  const { orgId } = req.params;
  
  try {
    const { refreshAccessToken } = require('../services/sfApi');
    await refreshAccessToken(orgId);
    
    res.json({
      success: true,
      message: 'Token refreshed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
