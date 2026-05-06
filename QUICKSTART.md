# 🚀 Quick Start Guide

Get up and running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- A Salesforce account (free Developer Edition works)

## Step 1: Create Connected App (5 minutes)

1. Go to https://developer.salesforce.com and sign up (free)
2. Login → Click ⚙️ → Setup
3. Search "App Manager" → New Connected App
4. Fill in:
   - Name: `SF Connect POC`
   - Email: your email
   - ✅ Enable OAuth Settings
   - Callback URL: `http://localhost:3001/auth/salesforce/callback`
   - Scopes: Select `api`, `refresh_token`, and `full`
5. Save → Wait 2 minutes → Manage Consumer Details
6. Copy **Consumer Key** and **Consumer Secret**

## Step 2: Configure Backend (1 minute)

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and paste your credentials:
```
SF_CLIENT_ID=paste_consumer_key_here
SF_CLIENT_SECRET=paste_consumer_secret_here
SF_REDIRECT_URI=http://localhost:3001/auth/salesforce/callback
SESSION_SECRET=change_this_to_any_random_string
```

## Step 3: Install & Run (2 minutes)

```bash
# From project root
npm run install:all
npm run dev
```

## Step 4: Connect! (1 minute)

1. Open http://localhost:5173
2. Click "Connect Production Org"
3. Login to Salesforce
4. Click "Allow"
5. Explore your data! 🎉

## Troubleshooting

**"redirect_uri_mismatch"**: Callback URL in Connected App must exactly match `.env`

**"invalid_client"**: Wait 2-10 minutes after creating Connected App for Salesforce propagation

**Backend won't start**: Make sure `.env` file exists with all values filled in

## What Next?

- Read the full [README.md](./README.md) for architecture details
- Try connecting a sandbox org
- Run custom SOQL queries in the Query Explorer
- Check out the code to see how OAuth works!

---

**Need help?** Check the full README or open an issue.
