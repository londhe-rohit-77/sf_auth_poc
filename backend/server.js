/**
 * Salesforce OAuth POC - Backend Server
 * Demonstrates Clientell-style OAuth flow where SaaS provider owns the Connected App
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const authRoutes = require('./routes/auth');
const salesforceRoutes = require('./routes/salesforce');
const sfmcAuthRoutes = require('./routes/sfmcAuth');
const sfmcApiRoutes = require('./routes/sfmcApi');

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Validate required environment variables
const requiredEnvVars = [
  'SF_CLIENT_ID',
  'SF_CLIENT_SECRET',
  'SF_REDIRECT_URI',
  'SESSION_SECRET'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('\n💡 Copy backend/.env.example to backend/.env and fill in your values');
  process.exit(1);
}

// Middleware
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware (must be initialized before routes)
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true, // Changed to true for OAuth flow
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    sameSite: 'lax', // Allow cookies on redirects
    maxAge: 1000 * 60 * 60 // 1 hour
  }
}));

// Routes - More specific routes must come before general routes
app.use('/auth/sfmc', sfmcAuthRoutes);
app.use('/api/sfmc', sfmcApiRoutes);
app.use('/auth', authRoutes);
app.use('/api', salesforceRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'SF Connect POC Backend',
    version: '1.0.0',
    endpoints: {
      auth: '/auth',
      api: '/api'
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n🚀 SF Connect POC Backend Server Started');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📍 Server:      http://localhost:${PORT}`);
  console.log(`🌐 Frontend:    ${FRONTEND_URL}`);
  console.log(`🔗 Callback:    ${process.env.SF_REDIRECT_URI}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Ready to handle OAuth flows\n');
});

module.exports = app;
