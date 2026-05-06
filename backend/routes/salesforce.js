/**
 * Salesforce API proxy routes
 * All routes require an orgId to identify which connected org to use
 */

const express = require('express');
const { callSalesforceApi } = require('../services/sfApi');
const tokenStore = require('../services/tokenStore');

const router = express.Router();

/**
 * GET /api/:orgId/info
 * Get org connection info (without sensitive tokens)
 */
router.get('/:orgId/info', (req, res) => {
  const { orgId } = req.params;
  const orgData = tokenStore.get(orgId);

  if (!orgData) {
    return res.status(404).json({
      success: false,
      error: 'Org not connected'
    });
  }

  // Return org data without exposing tokens
  const { accessToken, refreshToken, ...safeData } = orgData;

  res.json({
    success: true,
    data: safeData
  });
});

/**
 * GET /api/:orgId/accounts
 * Fetch Accounts from Salesforce
 */
router.get('/:orgId/accounts', async (req, res) => {
  const { orgId } = req.params;

  try {
    const soql = 'SELECT Id, Name, Type, Industry, AnnualRevenue, Phone, Website FROM Account LIMIT 20';
    const result = await callSalesforceApi(orgId, `/query?q=${encodeURIComponent(soql)}`);

    res.json({
      success: true,
      data: result.records,
      total: result.totalSize,
      orgId
    });
  } catch (error) {
    console.error(`❌ Accounts fetch failed for ${orgId}:`, error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/:orgId/opportunities
 * Fetch Opportunities from Salesforce
 */
router.get('/:orgId/opportunities', async (req, res) => {
  const { orgId } = req.params;

  try {
    const soql = 'SELECT Id, Name, StageName, Amount, CloseDate, Probability FROM Opportunity LIMIT 20';
    const result = await callSalesforceApi(orgId, `/query?q=${encodeURIComponent(soql)}`);

    res.json({
      success: true,
      data: result.records,
      total: result.totalSize,
      orgId
    });
  } catch (error) {
    console.error(`❌ Opportunities fetch failed for ${orgId}:`, error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/:orgId/leads
 * Fetch Leads from Salesforce
 */
router.get('/:orgId/leads', async (req, res) => {
  const { orgId } = req.params;

  try {
    const soql = 'SELECT Id, Name, Email, Company, Status, LeadSource FROM Lead LIMIT 20';
    const result = await callSalesforceApi(orgId, `/query?q=${encodeURIComponent(soql)}`);

    res.json({
      success: true,
      data: result.records,
      total: result.totalSize,
      orgId
    });
  } catch (error) {
    console.error(`❌ Leads fetch failed for ${orgId}:`, error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/:orgId/contacts
 * Fetch Contacts from Salesforce
 */
router.get('/:orgId/contacts', async (req, res) => {
  const { orgId } = req.params;

  try {
    const soql = 'SELECT Id, Name, Email, Phone, AccountId FROM Contact LIMIT 20';
    const result = await callSalesforceApi(orgId, `/query?q=${encodeURIComponent(soql)}`);

    res.json({
      success: true,
      data: result.records,
      total: result.totalSize,
      orgId
    });
  } catch (error) {
    console.error(`❌ Contacts fetch failed for ${orgId}:`, error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/:orgId/query
 * Execute custom SOQL query
 */
router.post('/:orgId/query', async (req, res) => {
  const { orgId } = req.params;
  const { soql } = req.body;

  if (!soql) {
    return res.status(400).json({
      success: false,
      error: 'SOQL query is required'
    });
  }

  try {
    console.log(`🔍 Custom SOQL for ${orgId}: ${soql}`);
    const startTime = Date.now();
    
    const result = await callSalesforceApi(orgId, `/query?q=${encodeURIComponent(soql)}`);
    
    const duration = Date.now() - startTime;

    res.json({
      success: true,
      data: result.records,
      total: result.totalSize,
      orgId,
      duration: `${duration}ms`
    });
  } catch (error) {
    console.error(`❌ Custom query failed for ${orgId}:`, error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
