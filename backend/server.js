const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ quiet: true });

const app = express();

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow: no origin (curl/Postman), localhost, LAN (192.168.x.x),
    // localtunnel (loca.lt), ngrok, and any tunnel service
    if (
      !origin ||
      origin.startsWith('http://localhost') ||
      origin.startsWith('http://127.0.0.1') ||
      /^https?:\/\/192\.168\./.test(origin) ||
      origin.endsWith('.loca.lt') ||
      origin.endsWith('.ngrok.io') ||
      origin.endsWith('.ngrok-free.app') ||
      origin.endsWith('.trycloudflare.com')
    ) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all for dev — restrict in production
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize Database
const { initializeDB } = require('./db');
initializeDB();

// Routes
app.use('/api/orders', require('./routes/orders'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/portfolio', require('./routes/portfolio'));
app.use('/api/settings', require('./routes/settings'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Classic Studio API is running 🚀' });
});

// ─── Serve Frontend Production Build ───────────────────────────────────────
const FRONTEND_BUILD = path.join(__dirname, '..', 'frontend', 'dist');
if (require('fs').existsSync(FRONTEND_BUILD)) {
  app.use(express.static(FRONTEND_BUILD));
  // SPA fallback — all non-API routes return index.html (Express 5 compatible)
  app.use((req, res, next) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      res.sendFile(path.join(FRONTEND_BUILD, 'index.html'));
    } else {
      next();
    }
  });
  console.log('🌐 Serving frontend build from:', FRONTEND_BUILD);
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Catch unhandled errors so process doesn't silently die
process.on('uncaughtException', (err) => {
  console.error('\n❌ Uncaught Exception:', err.message);
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use!`);
    console.error('   → Pehle purani process kill karo: taskkill /F /IM node.exe');
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('\n❌ Unhandled Rejection:', reason);
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📦 Environment: development`);
  console.log(`🗄️  Database: SQLite (editor.db)`);
  console.log(`🌐 Network:   http://192.168.1.3:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} pehle se use ho raha hai!`);
    console.error('   Purani process kill karo, phir start karo:');
    console.error('   → taskkill /F /IM node.exe');
  } else {
    console.error('Server start error:', err);
  }
  process.exit(1);
});
