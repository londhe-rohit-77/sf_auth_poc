# 🎨 Project Visual Overview

```
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║          SALESFORCE OAUTH POC - CLIENTELL STYLE                  ║
║                                                                  ║
║     Full-Stack Application Demonstrating SaaS OAuth Flow        ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────┐
│  📚 DOCUMENTATION LAYER                                          │
├──────────────────────────────────────────────────────────────────┤
│  • README.md            - Complete guide & architecture          │
│  • QUICKSTART.md        - 5-minute setup                         │
│  • PROJECT_STRUCTURE.md - File organization                      │
│  • CONTRIBUTING.md      - Developer guide                        │
│  • SETUP_SUMMARY.md     - What you built                         │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  🎨 FRONTEND LAYER (React + Vite + Tailwind)                     │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Home.jsx   │  │ Callback.jsx │  │Dashboard.jsx │          │
│  │              │  │              │  │              │          │
│  │ • OAuth flow │→ │ • Success    │→ │ • Data tabs  │          │
│  │   steps      │  │   animation  │  │ • SOQL query │          │
│  │ • Connect    │  │ • Countdown  │  │ • API calls  │          │
│  │   buttons    │  │ • Redirect   │  │              │          │
│  │ • Org list   │  │              │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  Components:                                                     │
│  ├─ OrgCard.jsx       (Connected org display)                   │
│  └─ ApiExplorer.jsx   (HTTP request visualizer)                 │
│                                                                  │
│  Configuration:                                                  │
│  ├─ vite.config.js    (Dev server + proxy)                      │
│  ├─ tailwind.config.js (Styling)                                │
│  └─ package.json      (Dependencies)                            │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                            ↕ HTTP (Axios)
┌──────────────────────────────────────────────────────────────────┐
│  ⚙️  BACKEND LAYER (Node.js + Express)                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  server.js - Express Server                             │    │
│  │  • CORS middleware                                      │    │
│  │  • Session management                                   │    │
│  │  • Route mounting                                       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Routes:                                                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  /auth (auth.js)                                         │   │
│  │  ├─ GET  /salesforce/connect    → Start OAuth           │   │
│  │  ├─ GET  /salesforce/callback   → Handle callback       │   │
│  │  ├─ GET  /orgs                  → List orgs             │   │
│  │  ├─ DELETE /orgs/:id            → Disconnect            │   │
│  │  └─ POST /refresh/:id           → Refresh token         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  /api (salesforce.js)                                    │   │
│  │  ├─ GET  /:orgId/info           → Org info              │   │
│  │  ├─ GET  /:orgId/accounts       → Accounts              │   │
│  │  ├─ GET  /:orgId/opportunities  → Opportunities         │   │
│  │  ├─ GET  /:orgId/leads          → Leads                 │   │
│  │  ├─ GET  /:orgId/contacts       → Contacts              │   │
│  │  └─ POST /:orgId/query          → Custom SOQL           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Services:                                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  tokenStore.js - In-Memory Token Storage                │   │
│  │  • save(orgId, data)                                     │   │
│  │  • get(orgId)                                            │   │
│  │  • getAll()                                              │   │
│  │  • delete(orgId)                                         │   │
│  │  • updateAccessToken(orgId, token)                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  sfApi.js - Salesforce API Client                       │   │
│  │  • callSalesforceApi(orgId, path, method, body)         │   │
│  │  • Automatic token refresh on 401                       │   │
│  │  • Error handling                                        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                        ↕ HTTPS (OAuth + REST API)
┌──────────────────────────────────────────────────────────────────┐
│  ☁️  SALESFORCE LAYER                                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  OAuth 2.0 Endpoints:                                            │
│  • /services/oauth2/authorize    (Login & consent)              │
│  • /services/oauth2/token        (Token exchange & refresh)     │
│                                                                  │
│  REST API v60.0:                                                 │
│  • /services/data/v60.0/query    (SOQL queries)                 │
│  • /services/data/v60.0/sobjects (Object operations)            │
│                                                                  │
│  Identity API:                                                   │
│  • /id/{orgId}/{userId}          (User/org info)                │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

╔══════════════════════════════════════════════════════════════════╗
║                    OAUTH FLOW SEQUENCE                           ║
╚══════════════════════════════════════════════════════════════════╝

  User               Frontend            Backend           Salesforce
   │                    │                   │                   │
   │  1. Click Connect  │                   │                   │
   │───────────────────>│                   │                   │
   │                    │                   │                   │
   │                    │  2. GET /auth/    │                   │
   │                    │    salesforce/    │                   │
   │                    │    connect        │                   │
   │                    │──────────────────>│                   │
   │                    │                   │                   │
   │                    │                   │  3. Generate      │
   │                    │                   │     state,        │
   │                    │                   │     redirect      │
   │                    │                   │──────────────────>│
   │                    │                   │                   │
   │                    │  4. Salesforce Login Page             │
   │                    │<──────────────────────────────────────│
   │  5. Enter creds    │                   │                   │
   │  6. Click "Allow"  │                   │                   │
   │───────────────────>│───────────────────────────────────────>│
   │                    │                   │                   │
   │                    │                   │  7. Callback with │
   │                    │                   │     auth code     │
   │                    │                   │<──────────────────│
   │                    │                   │                   │
   │                    │                   │  8. Exchange code │
   │                    │                   │     for tokens    │
   │                    │                   │──────────────────>│
   │                    │                   │                   │
   │                    │                   │  9. Access +      │
   │                    │                   │     Refresh token │
   │                    │                   │<──────────────────│
   │                    │                   │                   │
   │                    │                   │ 10. Fetch user/   │
   │                    │                   │     org info      │
   │                    │                   │──────────────────>│
   │                    │                   │<──────────────────│
   │                    │                   │                   │
   │                    │                   │ 11. Store tokens  │
   │                    │                   │     in memory     │
   │                    │                   │                   │
   │                    │ 12. Redirect      │                   │
   │                    │    to success     │                   │
   │                    │<──────────────────│                   │
   │                    │                   │                   │
   │ 13. Success page!  │                   │                   │
   │<───────────────────│                   │                   │
   │                    │                   │                   │

╔══════════════════════════════════════════════════════════════════╗
║                    TOKEN REFRESH FLOW                            ║
╚══════════════════════════════════════════════════════════════════╝

  Frontend            Backend                         Salesforce
     │                   │                                  │
     │  API Request      │                                  │
     │──────────────────>│                                  │
     │                   │                                  │
     │                   │  Query with access_token         │
     │                   │─────────────────────────────────>│
     │                   │                                  │
     │                   │  401 Unauthorized (token expired)│
     │                   │<─────────────────────────────────│
     │                   │                                  │
     │                   │  POST /token with refresh_token  │
     │                   │─────────────────────────────────>│
     │                   │                                  │
     │                   │  New access_token                │
     │                   │<─────────────────────────────────│
     │                   │                                  │
     │                   │  Update tokenStore               │
     │                   │                                  │
     │                   │  Retry original request          │
     │                   │─────────────────────────────────>│
     │                   │                                  │
     │                   │  200 OK + Data                   │
     │                   │<─────────────────────────────────│
     │                   │                                  │
     │  Response data    │                                  │
     │<──────────────────│                                  │
     │                   │                                  │

╔══════════════════════════════════════════════════════════════════╗
║                    TECHNOLOGY STACK                              ║
╚══════════════════════════════════════════════════════════════════╝

  ┌────────────────┬──────────────────────────────────────────┐
  │ CATEGORY       │ TECHNOLOGY                               │
  ├────────────────┼──────────────────────────────────────────┤
  │ Backend        │ Node.js 18+                              │
  │ Framework      │ Express.js 4.18                          │
  │ Frontend       │ React 18                                 │
  │ Build Tool     │ Vite 5.0                                 │
  │ Styling        │ Tailwind CSS 3.3                         │
  │ Routing        │ React Router 6                           │
  │ HTTP Client    │ Axios 1.6                                │
  │ Sessions       │ express-session 1.17                     │
  │ Token Storage  │ In-Memory Map (POC only)                 │
  │ Environment    │ dotenv 16.0                              │
  └────────────────┴──────────────────────────────────────────┘

╔══════════════════════════════════════════════════════════════════╗
║                    FILE COUNT                                    ║
╚══════════════════════════════════════════════════════════════════╝

  Total Files: 27

  📚 Documentation:    5 files
     • README.md
     • QUICKSTART.md
     • PROJECT_STRUCTURE.md
     • CONTRIBUTING.md
     • SETUP_SUMMARY.md

  ⚙️  Backend:         7 files
     • server.js
     • routes/auth.js
     • routes/salesforce.js
     • services/tokenStore.js
     • services/sfApi.js
     • package.json
     • .env.example

  🎨 Frontend:        11 files
     • index.html
     • main.jsx
     • App.jsx
     • pages/Home.jsx
     • pages/Callback.jsx
     • pages/Dashboard.jsx
     • components/OrgCard.jsx
     • components/ApiExplorer.jsx
     • vite.config.js
     • tailwind.config.js
     • package.json

  🔧 Configuration:    4 files
     • package.json (root)
     • .gitignore
     • postcss.config.js
     • index.css

╔══════════════════════════════════════════════════════════════════╗
║                    FEATURES IMPLEMENTED                           ║
╚══════════════════════════════════════════════════════════════════╝

  ✅ OAuth 2.0 Web Server Flow
  ✅ CSRF Protection (state parameter)
  ✅ Token Exchange & Storage
  ✅ Automatic Token Refresh
  ✅ Multi-Org Support
  ✅ Production & Sandbox Orgs
  ✅ Salesforce REST API Integration
  ✅ SOQL Query Execution
  ✅ Pre-built Object Queries (Accounts, Opportunities, Leads, Contacts)
  ✅ Custom Query Runner
  ✅ Table & JSON View Modes
  ✅ Connection Management (Connect/Disconnect)
  ✅ Org Information Display
  ✅ Real-time Status Indicators
  ✅ Error Handling & Logging
  ✅ Responsive UI Design
  ✅ Educational API Visualizer

╔══════════════════════════════════════════════════════════════════╗
║                    READY TO USE!                                 ║
╚══════════════════════════════════════════════════════════════════╝

  Next Steps:
  1. Create Salesforce Connected App (5 min)
  2. Configure backend/.env
  3. npm run install:all
  4. npm run dev
  5. Open http://localhost:5173
  6. Connect & Explore!

  Documentation:
  • Quick Start  → QUICKSTART.md
  • Full Guide   → README.md
  • Code Details → PROJECT_STRUCTURE.md
  • Extending    → CONTRIBUTING.md
  • Summary      → SETUP_SUMMARY.md (this file)

  🎉 Happy Building! 🚀
```
