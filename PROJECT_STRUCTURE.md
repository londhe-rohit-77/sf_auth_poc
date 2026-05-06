# 📂 Project Structure

```
sf-connect-poc/
│
├── 📄 README.md                    # Comprehensive documentation
├── 📄 QUICKSTART.md                # 5-minute setup guide
├── 📄 package.json                 # Root package with concurrently scripts
├── 📄 .gitignore                   # Git ignore rules
│
├── 📁 backend/                     # Node.js + Express backend
│   ├── 📄 server.js               # Main Express server
│   ├── 📄 package.json            # Backend dependencies
│   ├── 📄 .env.example            # Environment variables template
│   │
│   ├── 📁 routes/
│   │   ├── 📄 auth.js            # OAuth flow routes
│   │   └── 📄 salesforce.js      # Salesforce API proxy
│   │
│   └── 📁 services/
│       ├── 📄 tokenStore.js      # In-memory token storage
│       └── 📄 sfApi.js           # SF API caller with auto-refresh
│
└── 📁 frontend/                    # React + Vite frontend
    ├── 📄 index.html              # HTML entry point
    ├── 📄 package.json            # Frontend dependencies
    ├── 📄 vite.config.js          # Vite config with proxy
    ├── 📄 tailwind.config.js      # Tailwind CSS config
    ├── 📄 postcss.config.js       # PostCSS config
    │
    └── 📁 src/
        ├── 📄 main.jsx            # React entry point
        ├── 📄 App.jsx             # Main app with routing
        ├── 📄 index.css           # Global styles + Tailwind
        │
        ├── 📁 pages/
        │   ├── 📄 Home.jsx        # Landing page + org list
        │   ├── 📄 Callback.jsx    # OAuth callback handler
        │   └── 📄 Dashboard.jsx   # Data explorer dashboard
        │
        └── 📁 components/
            ├── 📄 OrgCard.jsx     # Connected org card
            └── 📄 ApiExplorer.jsx # API request visualizer
```

## File Descriptions

### Root Level

- **README.md**: Complete documentation with architecture, setup, and troubleshooting
- **QUICKSTART.md**: Condensed 5-minute setup guide
- **package.json**: Root package with scripts to run both backend and frontend
- **.gitignore**: Prevents committing sensitive files like `.env` and `node_modules`

### Backend (`/backend`)

#### Main Files
- **server.js**: Express server setup, middleware, routes mounting, health check
- **package.json**: Backend dependencies (express, axios, cors, dotenv, express-session)
- **.env.example**: Template for environment variables (copy to `.env`)

#### Routes
- **routes/auth.js**: 
  - `GET /auth/salesforce/connect` - Start OAuth flow
  - `GET /auth/salesforce/callback` - Handle OAuth callback
  - `GET /auth/orgs` - List connected orgs
  - `DELETE /auth/orgs/:orgId` - Disconnect org
  - `POST /auth/refresh/:orgId` - Manual token refresh

- **routes/salesforce.js**:
  - `GET /api/:orgId/info` - Get org info
  - `GET /api/:orgId/accounts` - Fetch Accounts
  - `GET /api/:orgId/opportunities` - Fetch Opportunities
  - `GET /api/:orgId/leads` - Fetch Leads
  - `GET /api/:orgId/contacts` - Fetch Contacts
  - `POST /api/:orgId/query` - Run custom SOQL

#### Services
- **services/tokenStore.js**: In-memory Map-based token storage with methods:
  - `save(orgId, data)` - Store org connection
  - `get(orgId)` - Retrieve org data
  - `getAll()` - List all orgs (no tokens)
  - `delete(orgId)` - Remove org
  - `updateAccessToken(orgId, token)` - Update after refresh

- **services/sfApi.js**: Salesforce API wrapper with:
  - `callSalesforceApi(orgId, path, method, body)` - Make SF API call
  - Automatic token refresh on 401
  - Error handling for SF API errors

### Frontend (`/frontend`)

#### Configuration
- **vite.config.js**: Vite setup with proxy to backend (`/auth` & `/api`)
- **tailwind.config.js**: Tailwind CSS configuration
- **postcss.config.js**: PostCSS with Tailwind + Autoprefixer
- **index.html**: HTML shell with root div

#### Source Files
- **main.jsx**: React 18 entry point with StrictMode
- **App.jsx**: Main component with React Router and navbar
- **index.css**: Global styles + Tailwind directives

#### Pages
- **pages/Home.jsx**: 
  - Left: OAuth flow explanation with visual steps
  - Right: Connected orgs list
  - Connect buttons (Production & Sandbox)

- **pages/Callback.jsx**:
  - Handles OAuth callback
  - Shows loading → success → countdown → redirect
  - Error handling

- **pages/Dashboard.jsx**:
  - Org header with connection info
  - Tabs: Accounts, Opportunities, Leads, Contacts, Query Explorer
  - Data tables with fetch/refresh
  - Custom SOQL query runner
  - Table/JSON view toggle

#### Components
- **components/OrgCard.jsx**:
  - Displays connected org info
  - Pulsing "Connected" indicator
  - Sandbox badge
  - "View Dashboard" and "Disconnect" buttons
  - Time ago formatting

- **components/ApiExplorer.jsx**:
  - Visualizes actual HTTP request to Salesforce
  - Shows endpoint, headers, query, response
  - Educational component for understanding API calls

## Key Concepts

### OAuth Flow
1. User clicks "Connect" → Backend redirects to SF
2. User logs in + authorizes → SF sends code to backend
3. Backend exchanges code for tokens → Stores in tokenStore
4. User redirected to frontend success page

### Token Management
- **Access Token**: Short-lived (~2hr), used for API calls
- **Refresh Token**: Long-lived, used to get new access tokens
- **Auto-Refresh**: On 401, backend refreshes and retries automatically

### Architecture Pattern
```
Frontend (React) 
    ↓ HTTP requests
Backend (Express) - proxy & auth handler
    ↓ OAuth & API calls
Salesforce APIs
```

## Technology Choices

| Choice | Reason |
|--------|--------|
| **Express** | Simple, well-documented Node.js framework |
| **Vite** | Fast dev server, modern build tool |
| **React Router** | Standard React routing solution |
| **Tailwind** | Rapid UI development with utility classes |
| **Axios** | Better error handling than fetch |
| **In-Memory Map** | Simple for POC (use DB in production) |

## Next Steps

To extend this POC:
1. Add PostgreSQL/MongoDB for token persistence
2. Implement user accounts and multi-tenancy
3. Add more Salesforce objects (Cases, Tasks, Events)
4. Implement webhooks (Platform Events)
5. Add bulk data operations
6. Deploy to production with HTTPS

---

**Happy Coding!** 🚀
