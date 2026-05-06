/**
 * In-memory token store for Salesforce org connections
 * In production, this would be a database with encrypted tokens
 */

class TokenStore {
  constructor() {
    this.store = new Map();
  }

  /**
   * Save or update org connection data
   * @param {string} orgId - Salesforce Organization ID
   * @param {Object} data - Connection data including tokens, user info, etc.
   */
  save(orgId, data) {
    this.store.set(orgId, {
      ...data,
      updatedAt: new Date().toISOString()
    });
    console.log(`✅ Saved connection for org: ${orgId} (${data.orgName})`);
  }

  /**
   * Retrieve org connection data
   * @param {string} orgId - Salesforce Organization ID
   * @returns {Object|null} Connection data or null if not found
   */
  get(orgId) {
    return this.store.get(orgId) || null;
  }

  /**
   * Get all connected orgs (WITHOUT exposing tokens)
   * @returns {Array} Array of org data without sensitive tokens
   */
  getAll() {
    const orgs = [];
    for (const [orgId, data] of this.store.entries()) {
      orgs.push({
        orgId: data.orgId,
        orgName: data.orgName,
        userName: data.userName,
        userEmail: data.userEmail,
        instanceUrl: data.instanceUrl,
        connectedAt: data.connectedAt,
        isSandbox: data.isSandbox,
        updatedAt: data.updatedAt
        // accessToken and refreshToken intentionally excluded
      });
    }
    return orgs;
  }

  /**
   * Remove org connection
   * @param {string} orgId - Salesforce Organization ID
   * @returns {boolean} True if deleted, false if not found
   */
  delete(orgId) {
    const deleted = this.store.delete(orgId);
    if (deleted) {
      console.log(`🗑️  Disconnected org: ${orgId}`);
    }
    return deleted;
  }

  /**
   * Update access token after refresh
   * @param {string} orgId - Salesforce Organization ID
   * @param {string} newAccessToken - New access token from refresh
   */
  updateAccessToken(orgId, newAccessToken) {
    const data = this.get(orgId);
    if (data) {
      data.accessToken = newAccessToken;
      data.updatedAt = new Date().toISOString();
      this.store.set(orgId, data);
      console.log(`🔄 Refreshed access token for org: ${orgId}`);
    }
  }

  /**
   * Get count of connected orgs
   * @returns {number}
   */
  count() {
    return this.store.size;
  }
}

// Export singleton instance
module.exports = new TokenStore();
