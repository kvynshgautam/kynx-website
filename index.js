const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

// Manifest info
const RELEASE_INFO = {
  version_name: "0.9.37",
  version_code: 47,
  release_name: "Build 47: Official Instant QR Scanner & 6-Digit Web Deck Pairing",
  apk_filename: "KYNX-latest.apk",
  file_size: "65.3 MB",
  sha256: "1816a40c0fb3af259281f463a6ab76517eb33e5e43eea5d41d951775d80b8841",
  release_date: "November 17, 2026",
  developer: "KG",
  min_android: "Android 8.0+ (API 26) to Android 16 (16 KB Compatible)",
  changelog: [
    "Official Linked Devices: Instant 6-digit pairing code & Google Play zero-permission QR camera scanner.",
    "KYNX Web Deck Live: Direct email/password login with 2FA OTP verification & automated live pairing.",
    "Hardware-encrypted WebRTC Bridge: Live messaging & WebRTC call signaling sync between mobile & desktop.",
    "Mesh AirDrop & Universal Clipboard: Zero-internet P2P file transfers and clipboard synchronization.",
    "16 KB Page-Size Architecture: Fully compliant with Android 15 & 16 (API 35/36/37)."
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
    return res.download(apkPath, 'KYNX-v0.9.33.apk');
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
