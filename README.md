# Salesforce OAuth POC - Clientell-Style Connection

A complete proof-of-concept application demonstrating how SaaS providers like **Clientell AI** connect to customer Salesforce orgs using OAuth 2.0.

## 🎯 What This POC Demonstrates

This application replicates the exact OAuth flow used by modern SaaS tools like Clientell, Gong, Outreach, and others. The key insight:

**The SaaS provider (you) owns ONE Connected App with credentials stored on YOUR backend. End users never need Salesforce Setup access — they just click "Connect" and authorize.**

### The Core Concept

```
┌─────────────────────────────────────────────────────────────┐
│              WHO DOES WHAT?                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  YOU (Developer/SaaS Provider):                             │
│    ✓ Create ONE Salesforce Connected App (one time only)   │
│    ✓ Store Consumer Key + Secret in your backend .env      │
│    ✓ Never share these credentials                         │
│                                                             │
│  YOUR USERS (Customers):                                    │
│    ✓ Click "Connect Salesforce Org" in your UI             │
│    ✓ Login to their Salesforce org                         │
│    ✓ Click "Allow" on consent screen                       │
│    ✓ Done. No Salesforce Setup access needed.              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR SAAS BACKEND                        │
│                                                             │
│   .env: SF_CLIENT_ID=xxx  SF_CLIENT_SECRET=yyy              │
│   (These are YOUR Connected App credentials)                │
└──────────────────────────┬──────────────────────────────────┘
                           │
          ┌────────────────▼────────────────┐
          │         OAuth Flow              │
          │                                 │
  User    │  1. Click "Connect"             │
  ──────► │  2. Redirect to SF Login        │
          │  3. User logs into THEIR org    │
          │  4. Consent screen appears      │
          │  5. User clicks "Allow"         │
          │  6. SF sends code to backend    │
          │  7. Backend exchanges code      │
          │     for access + refresh tokens │
          │  8. Tokens stored in memory     │
          │  9. User sees Dashboard         │
          └────────────────┬────────────────┘
                           │
          ┌────────────────▼────────────────┐
          │      Salesforce APIs            │
          │                                 │
          │  GET /sobjects/Account          │
          │  GET /query?q=SELECT...         │
          │  Authorization: Bearer {token}  │
          └─────────────────────────────────┘
```

### How Token Management Works

1. **Access Token**: Short-lived (~2 hours), used for API calls
2. **Refresh Token**: Long-lived, used to get new access tokens
3. **Auto-Refresh**: When API returns 401, backend automatically refreshes and retries
4. **In-Memory Storage**: POC uses Map (production would use encrypted database)

---

## 🚀 Tech Stack

| Component | Technology |
|-----------|-----------|
| **Backend** | Node.js + Express.js |
| **Frontend** | React 18 + Vite |
| **Styling** | Tailwind CSS |
| **Routing** | React Router v6 |
| **HTTP Client** | Axios |
| **Session** | express-session |
| **Token Storage** | In-memory Map (POC only) |

---

## 📁 Project Structure

```
sf-connect-poc/
├── backend/
│   ├── server.js                 # Express server setup
│   ├── routes/
│   │   ├── auth.js              # OAuth initiation + callback + token exchange
│   │   └── salesforce.js        # Salesforce API proxy routes
│   ├── services/
│   │   ├── tokenStore.js        # In-memory token storage
│   │   └── sfApi.js             # Salesforce API caller with auto-refresh
│   ├── .env.example             # Environment variables template
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Main app with routing
│   │   ├── pages/
│   │   │   ├── Home.jsx         # Landing + connected orgs list
│   │   │   ├── Callback.jsx     # OAuth return handler
│   │   │   └── Dashboard.jsx    # Post-connect data explorer
│   │   └── components/
│   │       ├── OrgCard.jsx      # Connected org card
│   │       └── ApiExplorer.jsx  # API request visualizer
│   ├── vite.config.js           # Vite config with proxy
│   └── package.json
├── package.json                 # Root with concurrently scripts
└── README.md
```

---

## ⚙️ One-Time Developer Setup: Create Your Connected App

Before running this POC, you need to create a Connected App in Salesforce (do this ONCE):

### Step 1: Get a Salesforce Developer Account

1. Go to https://developer.salesforce.com
2. Sign up for a **free Developer Edition org**
3. Verify your email and login

### Step 2: Create a Connected App

1. In your Developer org, click the gear icon ⚙️ → **Setup**
2. In Quick Find, search: **App Manager**
3. Click **New Connected App**
4. Fill in the form:

   **Basic Information:**
   - **Connected App Name**: `SF Connect POC`
   - **API Name**: `SF_Connect_POC` (auto-filled)
   - **Contact Email**: Your email

   **API (Enable OAuth Settings):**
   - ✅ Check **Enable OAuth Settings**
   - **Callback URL**: `http://localhost:3001/auth/salesforce/callback`
   - **Selected OAuth Scopes**: Add these three:
     - `Access and manage your data (api)`
     - `Perform requests on your behalf at any time (refresh_token, offline_access)`
     - `Full access (full)`

5. Click **Save**
6. Click **Continue** on the warning about 2-10 minutes propagation time
7. Click **Manage Consumer Details**
8. Verify your identity (you'll receive a code via email)
9. **Copy the Consumer Key and Consumer Secret** — you'll need these next!

### Step 3: Configure Your Backend

1. Navigate to the `backend/` folder
2. Copy `.env.example` to `.env`:
   ```bash
   cp backend/.env.example backend/.env
   ```

3. Edit `backend/.env` and paste your credentials:
   ```bash
   SF_CLIENT_ID=your_consumer_key_from_step_9
   SF_CLIENT_SECRET=your_consumer_secret_from_step_9
   SF_REDIRECT_URI=http://localhost:3001/auth/salesforce/callback
   SESSION_SECRET=your_random_secret_string_change_this
   PORT=3001
   FRONTEND_URL=http://localhost:5173
   ```

**🔒 Security Note**: Never commit your `.env` file to Git! It's already in `.gitignore`.

---

## 🏃 Running the POC

### Prerequisites

- **Node.js** 18+ and npm installed
- Completed the Connected App setup above

### Installation & Launch

```bash
# Clone or download this project
cd sf-connect-poc

# Install all dependencies (backend + frontend)
npm run install:all

# Start both backend and frontend concurrently
npm run dev
```

This will start:
- **Backend**: http://localhost:3001
- **Frontend**: http://localhost:5173

### Usage

1. Open http://localhost:5173 in your browser
2. Click **"Connect Production Org"** or **"Connect Sandbox Org"**
3. Login to your Salesforce org (can be any org you have credentials for)
4. Click **"Allow"** on the OAuth consent screen
5. You'll be redirected back and see the dashboard
6. Explore Accounts, Opportunities, Leads, Contacts
7. Try custom SOQL queries in the Query Explorer tab

---

## 🎓 Understanding the OAuth Flow

### What Happens Behind the Scenes

#### 1. User Clicks "Connect"
```javascript
// Frontend redirects to backend
window.location.href = '/auth/salesforce/connect'
```

#### 2. Backend Generates State & Redirects to Salesforce
```javascript
// backend/routes/auth.js
const state = crypto.randomBytes(16).toString('hex')
req.session.oauthState = { state, isSandbox }

const authUrl = `https://login.salesforce.com/services/oauth2/authorize?
  response_type=code&
  client_id=${SF_CLIENT_ID}&
  redirect_uri=${SF_REDIRECT_URI}&
  scope=api refresh_token full openid&
  state=${state}`

res.redirect(authUrl)
```

#### 3. User Sees Salesforce Login
- User enters their Salesforce username + password
- Salesforce shows consent screen: "SF Connect POC wants to access your data"
- User clicks "Allow"

#### 4. Salesforce Redirects to Your Callback
```
http://localhost:3001/auth/salesforce/callback?code=ABC123...&state=xyz789...
```

#### 5. Backend Exchanges Code for Tokens
```javascript
// backend/routes/auth.js
const tokenResponse = await axios.post(
  'https://login.salesforce.com/services/oauth2/token',
  {
    grant_type: 'authorization_code',
    client_id: SF_CLIENT_ID,
    client_secret: SF_CLIENT_SECRET,
    redirect_uri: SF_REDIRECT_URI,
    code: code
  }
)

// Receive: access_token, refresh_token, instance_url
```

#### 6. Backend Fetches User/Org Info
```javascript
const identity = await axios.get(identityUrl, {
  headers: { Authorization: `Bearer ${access_token}` }
})
// Returns: organization_id, username, email, display_name
```

#### 7. Backend Stores Tokens
```javascript
tokenStore.save(organization_id, {
  orgId: organization_id,
  orgName: display_name,
  accessToken: access_token,
  refreshToken: refresh_token,
  instanceUrl: instance_url,
  // ... other info
})
```

#### 8. User Redirected to Frontend Success Page
```
http://localhost:5173/callback?orgId=00D...&success=true
```

#### 9. Dashboard Makes API Calls
```javascript
// backend/routes/salesforce.js
const result = await callSalesforceApi(
  orgId,
  '/query?q=SELECT Id, Name FROM Account LIMIT 20'
)
// Uses stored access_token, auto-refreshes if expired
```

---

## 🔐 Token Refresh Flow

When an access token expires (typically after ~2 hours):

```javascript
// backend/services/sfApi.js

try {
  // Make API call with access_token
  const response = await axios(config)
} catch (error) {
  if (error.response.status === 401) {
    // Token expired! Refresh it
    await refreshAccessToken(orgId)
    
    // Retry original request with new token
    const retryResponse = await axios(config)
    return retryResponse.data
  }
}
```

The refresh flow:
```javascript
POST https://login.salesforce.com/services/oauth2/token
Body:
  grant_type=refresh_token
  client_id=YOUR_CLIENT_ID
  client_secret=YOUR_CLIENT_SECRET
  refresh_token=STORED_REFRESH_TOKEN

Response:
  { access_token: "NEW_TOKEN_HERE" }
```

**Key Point**: Refresh tokens are long-lived and don't expire (unless revoked). This lets you maintain persistent access to the customer's org.

---

## 🌐 API Endpoints

### Authentication Routes (`/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/salesforce/connect` | Start OAuth flow |
| GET | `/auth/salesforce/callback` | OAuth callback handler |
| GET | `/auth/orgs` | List all connected orgs |
| DELETE | `/auth/orgs/:orgId` | Disconnect an org |
| POST | `/auth/refresh/:orgId` | Manually refresh tokens |

### Salesforce API Routes (`/api`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/:orgId/info` | Get org connection info |
| GET | `/api/:orgId/accounts` | Fetch Accounts |
| GET | `/api/:orgId/opportunities` | Fetch Opportunities |
| GET | `/api/:orgId/leads` | Fetch Leads |
| GET | `/api/:orgId/contacts` | Fetch Contacts |
| POST | `/api/:orgId/query` | Run custom SOQL query |

---

## 🆚 POC vs Production

| Feature | This POC | Production |
|---------|----------|-----------|
| **Token Storage** | In-memory Map (lost on restart) | Encrypted database (PostgreSQL, MongoDB) |
| **HTTPS** | HTTP only | HTTPS with SSL certificates required |
| **Connected App** | One app, same credentials | Same — still ONE Connected App |
| **User Accounts** | None (stateless orgs) | Multi-tenant with user auth |
| **Sessions** | express-session in-memory | Redis or database-backed sessions |
| **Error Handling** | Basic console logs | Structured logging (Winston, DataDog) |
| **Token Refresh** | Automatic on 401 | Background job + queue system |
| **Rate Limiting** | None | Implemented per Salesforce limits |
| **Org Metadata** | Stored with tokens | Separate metadata table |
| **Webhooks** | Not implemented | Platform Events or Change Data Capture |

---

## 🔍 How Clientell's Package Install Works

You might notice Clientell has an "Install Package" button. Here's how that relates to this POC:

### Managed Package Flow

1. **Managed Package**: Salesforce allows ISVs to bundle metadata (including a Connected App) into an installable package
2. **Customer Installs**: When a customer installs Clientell's managed package:
   - The package includes a pre-configured Connected App
   - That Connected App has a Consumer Key/Secret that Clientell knows
   - The credentials are "baked into" both the customer's org AND Clientell's backend
3. **Auto-Authorization**: After package install, the customer still goes through OAuth (like in this POC), but the Connected App is already in their org

### How This POC Relates

In this POC, we're **skipping the package installation step** because:
- You're using YOUR Developer org's Connected App
- Your customers would normally install YOUR package
- The Connected App in the package would use the SAME credentials you have in your backend `.env`

**Bottom Line**: The OAuth flow is identical. A managed package just automates the Connected App creation in the customer's org.

---

## � Marketing Cloud (SFMC) Integration

In addition to Salesforce CRM, this POC now supports **Salesforce Marketing Cloud (SFMC)** OAuth connections.

### Key Differences: CRM vs SFMC

| Feature | Salesforce CRM | Marketing Cloud (SFMC) |
|---------|----------------|------------------------|
| **OAuth Endpoint** | `login.salesforce.com` | `{subdomain}.auth.marketingcloudapis.com` |
| **Token Lifetime** | ~2 hours | ~18 minutes (much shorter!) |
| **Subdomain** | Not required | Required upfront |
| **Setup Requirement** | Connected App | Installed Package |
| **Token Format** | Form-encoded | JSON body |
| **API Base URL** | `instance_url` from token | `rest_instance_url` from token |

### One-Time SFMC Setup: Create Installed Package

Before connecting to Marketing Cloud, you need to create an **Installed Package** (SFMC's equivalent of a Connected App):

#### Step 1: Get a Marketing Cloud Account

1. Sign up for an [SFMC trial account](https://www.salesforce.com/products/marketing-cloud/overview/) or use an existing one
2. Note your **subdomain** from the URL (e.g., `mc563885gzs27c5t9-63k636ttgm`)

#### Step 2: Create an Installed Package

1. Login to Marketing Cloud
2. Go to **Setup** → **Platform Tools** → **Apps** → **Installed Packages**
3. Click **New** to create a new package
4. Fill in:
   - **Name**: `SF Connect POC`
   - **Description**: `OAuth integration for SF Connect POC`

5. Click **Add Component** → **API Integration**
6. Configure OAuth settings:
   - **Integration Type**: Choose **Server-to-Server** or **Web App**
   - **Properties**:
     - ✅ Check **Data Extensions** (Read/Write)
     - ✅ Check **Email** (Read/Send)
     - ✅ Check **Journeys** (Read)
     - ✅ Check **List and Subscribers** (Read/Write)
     - ✅ Check **Automations** (Read)

7. Click **Save**
8. **Copy the following values**:
   - **Client ID**
   - **Client Secret**
   - **Authentication Base URI** (e.g., `https://mc563885gzs27c5t9-63k636ttgm.auth.marketingcloudapis.com/`)

#### Step 3: Configure Backend for SFMC

1. Edit `backend/.env` and add SFMC credentials:
   ```bash
   # Salesforce Marketing Cloud (SFMC) - Optional
   SFMC_CLIENT_ID=your_sfmc_client_id_here
   SFMC_CLIENT_SECRET=your_sfmc_client_secret_here
   SFMC_REDIRECT_URI=http://localhost:3001/auth/sfmc/callback
   ```

2. Restart your backend server:
   ```bash
   npm run dev
   ```

### Using SFMC in the POC

1. Open http://localhost:5173
2. Scroll down to the **"Connect Marketing Cloud"** section
3. Click **"Connect Marketing Cloud"**
4. Enter your SFMC subdomain in the modal (e.g., `mc563885gzs27c5t9-63k636ttgm`)
5. Click **Connect**
6. Login to Marketing Cloud when prompted
7. Click **Allow** on the OAuth consent screen
8. View your SFMC data (Subscribers, Campaigns, Data Extensions, Journeys, Automations)

### SFMC OAuth Flow

The SFMC flow is similar to CRM but with key differences:

```javascript
// 1. User enters subdomain → Backend stores it
POST /auth/sfmc/initiate?subdomain=mc563885gzs27c5t9-63k636ttgm

// 2. Backend redirects to SFMC auth URL
GET https://mc563885gzs27c5t9-63k636ttgm.auth.marketingcloudapis.com/v2/authorize?
  response_type=code&
  client_id={SFMC_CLIENT_ID}&
  redirect_uri={SFMC_REDIRECT_URI}&
  state={random_state}

// 3. SFMC redirects back with code
GET http://localhost:3001/auth/sfmc/callback?code=ABC123...&state=xyz789...

// 4. Backend exchanges code for tokens (JSON body, not form-encoded!)
POST https://{subdomain}.auth.marketingcloudapis.com/v2/token
Content-Type: application/json
Body: {
  "grant_type": "authorization_code",
  "client_id": "{SFMC_CLIENT_ID}",
  "client_secret": "{SFMC_CLIENT_SECRET}",
  "code": "ABC123...",
  "redirect_uri": "{SFMC_REDIRECT_URI}"
}

Response: {
  "access_token": "...",
  "refresh_token": "...",
  "expires_in": 1079, // ~18 minutes!
  "rest_instance_url": "https://mc563885gzs27c5t9-63k636ttgm.rest.marketingcloudapis.com/"
}
```

### Token Auto-Refresh for SFMC

Because SFMC tokens expire in just **18 minutes** (vs 2 hours for CRM), the backend aggressively manages token refresh:

```javascript
// backend/services/sfmcApiService.js

// Check if token expires in next 5 minutes
if (isTokenExpired(accountId, 300)) {
  await refreshSfmcToken(accountId)
}

// Make API call
const response = await axios.get(endpoint, {
  headers: { Authorization: `Bearer ${accessToken}` }
})
```

### SFMC API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/sfmc/initiate` | Start SFMC OAuth (requires subdomain param) |
| GET | `/auth/sfmc/callback` | SFMC OAuth callback handler |
| GET | `/auth/sfmc/orgs` | List all connected SFMC accounts |
| GET | `/auth/sfmc/orgs/:accountId` | Get specific SFMC account info |
| DELETE | `/auth/sfmc/orgs/:accountId` | Disconnect SFMC account |
| GET | `/api/sfmc/subscribers` | Fetch subscribers list |
| GET | `/api/sfmc/campaigns` | Fetch campaigns |
| GET | `/api/sfmc/dataextensions` | Fetch data extensions |
| GET | `/api/sfmc/journeys` | Fetch journeys |
| GET | `/api/sfmc/automations` | Fetch automations |

### Finding Your SFMC Subdomain

Your subdomain appears in various Marketing Cloud URLs:

```
Login URL: https://mc563885gzs27c5t9-63k636ttgm.marketingcloudapis.com
                   └─────────────────────────────┘
                          This is your subdomain

Auth URL:  https://mc563885gzs27c5t9-63k636ttgm.auth.marketingcloudapis.com
                   └─────────────────────────────┘
                          Same subdomain

REST API:  https://mc563885gzs27c5t9-63k636ttgm.rest.marketingcloudapis.com
                   └─────────────────────────────┘
                          Same subdomain
```

**Tip**: Just paste your full URL into the modal — the backend automatically extracts the subdomain!

---

## �🐛 Troubleshooting

### "Missing required environment variables"

**Problem**: Backend won't start, shows missing env vars.

**Solution**: 
1. Make sure you copied `backend/.env.example` to `backend/.env`
2. Fill in all values, especially `SF_CLIENT_ID` and `SF_CLIENT_SECRET`

---

### "redirect_uri_mismatch"

**Problem**: OAuth fails with "redirect_uri_mismatch" error.

**Solution**:
1. Check your Connected App callback URL: `http://localhost:3001/auth/salesforce/callback`
2. Check `backend/.env`: `SF_REDIRECT_URI=http://localhost:3001/auth/salesforce/callback`
3. They must match EXACTLY (including http vs https, trailing slash, etc.)

---

### "invalid_client_id" or "invalid_client"

**Problem**: OAuth fails during token exchange.

**Solution**:
1. Wait 2-10 minutes after creating your Connected App (Salesforce propagation delay)
2. Verify Consumer Key and Secret in `backend/.env` match your Connected App
3. Make sure you clicked "Manage Consumer Details" to reveal the secret

---

### Tokens expire immediately / constant 401 errors

**Problem**: API calls fail with 401, refresh doesn't work.

**Solution**:
1. Check your Connected App has `refresh_token` and `offline_access` scopes
2. Verify `full` scope is also selected
3. Try disconnecting and reconnecting the org

---

### Sandbox connection fails

**Problem**: Clicking "Connect Sandbox Org" doesn't work.

**Solution**:
1. Sandbox OAuth uses `https://test.salesforce.com` instead of `https://login.salesforce.com`
2. Your Connected App must be created in a PRODUCTION org to work with both
3. When connecting, use sandbox credentials (e.g., `user@company.com.sandbox`)

---

## 📚 Additional Resources

- [Salesforce OAuth 2.0 Docs](https://help.salesforce.com/s/articleView?id=sf.remoteaccess_oauth_web_server_flow.htm)
- [Connected Apps Overview](https://help.salesforce.com/s/articleView?id=sf.connected_app_overview.htm)
- [REST API Developer Guide](https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/)
- [SOQL Reference](https://developer.salesforce.com/docs/atlas.en-us.soql_sosl.meta/soql_sosl/)

---

## 🤝 Contributing

This is a POC for educational purposes. Feel free to:
- Fork and extend it
- Add database persistence
- Implement webhook listeners
- Add more Salesforce API features
- Submit issues or improvements

---

## 📄 License

MIT License - feel free to use this in your own projects!

---

## 🎉 What's Next?

Now that you understand the OAuth flow, you can:

1. **Add Database Persistence**: Replace in-memory Map with PostgreSQL + encryption
2. **Implement User Accounts**: Multi-tenant SaaS with user<->org relationships
3. **Build Real Features**: Use Salesforce data to power your SaaS product
4. **Deploy to Production**: 
   - Host on AWS/GCP/Azure
   - Use HTTPS with proper SSL
   - Update callback URL in Connected App
   - Use environment variables for all secrets
5. **Create a Managed Package**: Bundle your Connected App for easy customer setup
6. **Add Webhooks**: Listen to Salesforce Platform Events or Change Data Capture

---

## 🙋 Questions?

If you have questions about this POC, Salesforce OAuth, or building SaaS integrations:

- Open an issue in this repo
- Check the Salesforce Developer Forums
- Review the Troubleshooting section above

**Happy Building! 🚀**
