# 🤝 Contributing Guide

Want to extend this POC or understand it better? Here's a guide to the codebase.

## Development Setup

```bash
# Install dependencies
npm run install:all

# Run both backend and frontend
npm run dev

# Or run separately:
npm run dev:backend   # Backend only on :3001
npm run dev:frontend  # Frontend only on :5173
```

## Code Organization

### Backend Architecture

```
Request → Express Middleware → Route Handler → Service Layer → Salesforce API
```

**Key Files:**
- `server.js`: Entry point, middleware setup
- `routes/`: HTTP endpoint handlers
- `services/`: Business logic (token storage, API calls)

### Frontend Architecture

```
User Action → React Component → Axios Request → Backend Proxy → Response → State Update → UI Render
```

**Key Files:**
- `App.jsx`: Router configuration
- `pages/`: Full page components
- `components/`: Reusable UI components

## Common Tasks

### Add a New Salesforce Object Type

**Backend** (`backend/routes/salesforce.js`):
```javascript
router.get('/:orgId/cases', async (req, res) => {
  const { orgId } = req.params;
  try {
    const soql = 'SELECT Id, CaseNumber, Subject, Status FROM Case LIMIT 20';
    const result = await callSalesforceApi(orgId, `/query?q=${encodeURIComponent(soql)}`);
    res.json({
      success: true,
      data: result.records,
      total: result.totalSize,
      orgId
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

**Frontend** (`frontend/src/pages/Dashboard.jsx`):
```javascript
// Add to tabs array
const tabs = [
  // ... existing tabs
  { id: 'cases', label: 'Cases', endpoint: 'cases' }
];
```

### Add Database Persistence

Replace `tokenStore.js` with a database service:

```javascript
// backend/services/tokenStore.js (with PostgreSQL example)
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async save(orgId, data) {
  await pool.query(
    `INSERT INTO connections (org_id, org_name, access_token, refresh_token, ...)
     VALUES ($1, $2, $3, $4, ...)
     ON CONFLICT (org_id) DO UPDATE SET ...`,
    [orgId, data.orgName, encrypt(data.accessToken), encrypt(data.refreshToken), ...]
  );
}
```

**Important**: Always encrypt tokens before storing!

### Add User Authentication

1. Add user model and auth routes
2. Associate orgs with users:
   ```javascript
   // tokenStore becomes user-scoped
   save(userId, orgId, data)
   getByUser(userId)
   ```
3. Add JWT/session middleware to protect routes
4. Update frontend to handle login/logout

### Implement Webhooks

**Salesforce Platform Events**:
```javascript
// backend/services/webhooks.js
const EventSource = require('eventsource');

function subscribeToPlatformEvents(orgId) {
  const orgData = tokenStore.get(orgId);
  const url = `${orgData.instanceUrl}/cometd/60.0`;
  
  // Subscribe to Platform Event
  // https://developer.salesforce.com/docs/atlas.en-us.platform_events.meta
}
```

### Add More OAuth Scopes

Update `backend/routes/auth.js`:
```javascript
authUrl.searchParams.append('scope', 'api refresh_token full openid web');
```

Available scopes:
- `api` - Access data via APIs
- `refresh_token` - Receive refresh token
- `full` - Full access
- `web` - Access web (Visualforce pages)
- `openid` - OpenID Connect
- `chatter_api` - Chatter feeds

## Testing

### Manual Testing Checklist

- [ ] Connect production org
- [ ] Connect sandbox org
- [ ] Fetch Accounts, Opportunities, Leads, Contacts
- [ ] Run custom SOQL query
- [ ] Disconnect org
- [ ] Reconnect same org
- [ ] Token auto-refresh (wait 2 hours or force token expiry)

### Future: Automated Tests

```javascript
// Example with Jest + Supertest
describe('OAuth Flow', () => {
  it('should redirect to Salesforce login', async () => {
    const res = await request(app)
      .get('/auth/salesforce/connect')
      .expect(302);
    expect(res.headers.location).toContain('salesforce.com');
  });
});
```

## Debugging

### Backend Logs

The backend logs every important step:
```
🔗 OAuth Flow Started
   Type: Production
   State: abc123...
   Redirecting to: https://login.salesforce.com/...

🔙 OAuth Callback Received
   ✅ State validated
   Code received: xyz789...
   🔄 Exchanging code for tokens...
   ✅ Tokens received
   Instance: https://na123.salesforce.com
```

### Frontend Debugging

Use React DevTools + Network tab:
1. Install React DevTools browser extension
2. Open DevTools → Network tab
3. Filter by "XHR" to see API calls
4. Check request/response for each API call

### Common Issues

**"State mismatch"**: Session not persisting. Check `SESSION_SECRET` in `.env`.

**"Org not connected"**: Token may have been cleared. Check `tokenStore.get(orgId)` returns data.

**API 401 errors**: Token expired and refresh failed. Check refresh token is valid.

## Performance Optimization

### Current Limitations
- In-memory storage doesn't scale
- No caching of frequently accessed data
- Each API call hits Salesforce directly

### Improvements for Production
```javascript
// Add Redis caching
const redis = require('redis');
const client = redis.createClient();

async function getAccountsCached(orgId) {
  const cacheKey = `accounts:${orgId}`;
  const cached = await client.get(cacheKey);
  
  if (cached) return JSON.parse(cached);
  
  const result = await callSalesforceApi(orgId, '/query?q=...');
  await client.setex(cacheKey, 300, JSON.stringify(result)); // 5 min TTL
  
  return result;
}
```

## Security Best Practices

### Never Commit
- `.env` files (in `.gitignore`)
- Access/refresh tokens
- Consumer Key/Secret
- Session secrets

### Always Encrypt
- Access tokens in database
- Refresh tokens in database
- Use AES-256 encryption

### Validate Everything
- State parameter (CSRF protection)
- OAuth callback parameters
- User input in SOQL queries (prevent SOQL injection)

### Example: SOQL Injection Prevention
```javascript
// BAD - vulnerable to injection
const soql = `SELECT Id FROM Account WHERE Name = '${userInput}'`;

// GOOD - use parameterized queries or escape
const soql = `SELECT Id FROM Account WHERE Name = '${escape(userInput)}'`;

// BETTER - use composite API or bind variables when available
```

## Deployment Checklist

Before deploying to production:

- [ ] Use HTTPS only (no HTTP)
- [ ] Update Connected App callback URL to production domain
- [ ] Update `FRONTEND_URL` and `SF_REDIRECT_URI` in `.env`
- [ ] Use database instead of in-memory storage
- [ ] Implement user authentication
- [ ] Add rate limiting
- [ ] Add request logging (Winston, DataDog)
- [ ] Set up error monitoring (Sentry)
- [ ] Encrypt all stored tokens
- [ ] Use Redis for sessions
- [ ] Enable CORS only for your domain
- [ ] Add health check endpoint
- [ ] Set up CI/CD pipeline
- [ ] Configure environment variables in hosting platform

## Resources

- [Salesforce REST API Docs](https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/)
- [OAuth 2.0 Web Server Flow](https://help.salesforce.com/s/articleView?id=sf.remoteaccess_oauth_web_server_flow.htm)
- [Express.js Docs](https://expressjs.com/)
- [React Router Docs](https://reactrouter.com/)
- [Tailwind CSS Docs](https://tailwindcss.com/)

## Questions?

Open an issue or check the main [README.md](./README.md) for more information.

Happy coding! 🚀
