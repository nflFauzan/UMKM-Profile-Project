/**
 * Express Server for Takka Steel Company Profile
 * Serves static files and data
 */

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve data directory (JSON + images)
app.use('/data', express.static(path.join(__dirname, 'data')));

// Fallback to index.html for SPA-like behavior
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/data')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    next();
  }
});

app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   Takka Steel - Company Profile Server   ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('');
  console.log(`🌐 Server berjalan di: http://localhost:${PORT}`);
  console.log('📁 Serving from: ./public');
  console.log('📊 Data from: ./data');
  console.log('');
  console.log('Tekan Ctrl+C untuk menghentikan server');
});
