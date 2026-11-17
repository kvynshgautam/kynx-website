const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

// Manifest info
const RELEASE_INFO = {
  version_name: "0.9.38",
  version_code: 48,
  release_name: "Build 48: Dedicated 1-Tap QR Scanner & Instant ISO Web Deck Link",
  apk_filename: "KYNX-latest.apk",
  file_size: "65.3 MB",
  sha256: "48f49a3a392d2c3b9f83359fc04de233752307fbe6c859ce65b0b834c0d87d40",
  release_date: "November 17, 2026",
  developer: "KG",
  min_android: "Android 8.0+ (API 26) to Android 16 (16 KB Compatible)",
  changelog: [
    "Dedicated 1-Tap QR Scanner directly in TopAppBar & 3-dot menu on Chats screen.",
    "True ISO/IEC 18004 QR Matrix rendering on KYNX Web Deck for instant camera acquisition.",
    "kynx://pair deep-link intent handling with automated approval via KYNX app.",
    "Hardware-encrypted WebRTC Bridge: Live messaging & WebRTC call signaling sync between mobile & desktop.",
    "16 KB Page-Size Architecture: Fully compliant with Android 15 & 16."
  ]
};

// Serve static assets from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint for version check
app.get('/api/release', (req, res) => {
  res.json(RELEASE_INFO);
});

// Direct APK download route & CDN fallback
const GITHUB_RELEASE_URL = "https://github.com/kvynshgautam/kynx-website/releases/latest/download/KYNX-latest.apk";

app.get('/download/apk', (req, res) => {
  const apkPath = path.join(__dirname, 'public', 'downloads', 'KYNX-latest.apk');
  if (fs.existsSync(apkPath)) {
    return res.download(apkPath, 'KYNX-v0.9.38.apk');
  }
  return res.redirect(GITHUB_RELEASE_URL);
});

app.get('/downloads/:filename', (req, res) => {
  const apkPath = path.join(__dirname, 'public', 'downloads', req.params.filename);
  if (fs.existsSync(apkPath)) {
    return res.download(apkPath);
  }
  return res.redirect(GITHUB_RELEASE_URL);
});

// KYNX Web Deck route (WhatsApp Web alternative)
app.get('/web', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'web.html'));
});

// Privacy policy route
app.get('/privacy', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'privacy.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: "ok", app: "KYNX Website", version: RELEASE_INFO.version_name, developer: "KG" });
});

// Fallback to index.html for SPA routes (Express 5 compatible)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Local development server listener
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`[KYNX WEB] Server running on port ${PORT}`);
  });
}

// Export for Vercel Serverless Function
module.exports = app;
