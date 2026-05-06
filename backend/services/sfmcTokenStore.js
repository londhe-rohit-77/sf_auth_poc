/**
 * In-memory token store for Salesforce Marketing Cloud accounts
 * SFMC tokens expire much faster (~18 minutes vs 2 hours for CRM)
 */

class SfmcTokenStore {
  constructor() {
    this.store = new Map();
  }

  /**
   * Save or update SFMC account connection data
   * @param {string} accountId - SFMC MID (Member ID)
   * @param {Object} data - Connection data including tokens, subdomain, URLs
   */
  save(accountId, data) {
    this.store.set(accountId, {
      ...data,
      updatedAt: new Date().toISOString()
    });
    console.log(`✅ Saved SFMC connection for account: ${accountId} (${data.accountName})`);
  }

  /**
   * Retrieve SFMC account connection data
   * @param {string} accountId - SFMC MID
   * @returns {Object|null} Connection data or null if not found
   */
  get(accountId) {
    return this.store.get(accountId) || null;
  }

  /**
   * Get all connected SFMC accounts (WITHOUT exposing tokens)
   * @returns {Array} Array of account data without sensitive tokens
   */
  getAll() {
    const accounts = [];
    for (const [accountId, data] of this.store.entries()) {
      accounts.push({
        accountId: data.accountId,
        accountName: data.accountName,
        subdomain: data.subdomain,
        restInstanceUrl: data.restInstanceUrl,
        connectedAt: data.connectedAt,
        tokenExpiry: data.tokenExpiry,
        updatedAt: data.updatedAt
        // accessToken and refreshToken intentionally excluded
      });
    }
    return accounts;
  }

  /**
   * Remove SFMC account connection
   * @param {string} accountId - SFMC MID
   * @returns {boolean} True if deleted, false if not found
   */
  delete(accountId) {
    const deleted = this.store.delete(accountId);
    if (deleted) {
      console.log(`🗑️  Disconnected SFMC account: ${accountId}`);
    }
    return deleted;
  }

  /**
   * Update access token after refresh
   * @param {string} accountId - SFMC MID
   * @param {string} newAccessToken - New access token from refresh
   * @param {Date} newExpiry - New expiry date
   */
  updateAccessToken(accountId, newAccessToken, newExpiry) {
    const data = this.get(accountId);
    if (data) {
      data.accessToken = newAccessToken;
      data.tokenExpiry = newExpiry;
      data.updatedAt = new Date().toISOString();
      this.store.set(accountId, data);
      console.log(`🔄 Refreshed SFMC access token for account: ${accountId}`);
    }
  }

  /**
   * Check if access token is expired or expiring soon
   * @param {string} accountId - SFMC MID
   * @param {number} bufferSeconds - Refresh if expires within this many seconds (default 60)
   * @returns {boolean} True if expired or expiring soon
   */
  isTokenExpired(accountId, bufferSeconds = 60) {
    const data = this.get(accountId);
    if (!data || !data.tokenExpiry) return true;
    
    const expiryTime = new Date(data.tokenExpiry).getTime();
    const now = Date.now();
    const bufferMs = bufferSeconds * 1000;
    
    return expiryTime - now < bufferMs;
  }

  /**
   * Get count of connected SFMC accounts
   * @returns {number}
   */
  count() {
    return this.store.size;
  }
}

// Export singleton instance
module.exports = new SfmcTokenStore();
