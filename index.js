const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

// Manifest info
const RELEASE_INFO = {
  version_name: "0.9.33",
  version_code: 43,
  release_name: "Build 43: Liquid Touch Pager & High-Speed Bottom Navigation",
  apk_filename: "KYNX-latest.apk",
  file_size: "59.95 MB",
  sha256: "3ca78f3224e55c69270bb3ad75241f63135ce725902cac6be108da0efe6c1733",
  release_date: "November 16, 2026",
  developer: "KG",
  min_android: "Android 8.0+ (API 26) to Android 15",
  changelog: [
    "Liquid Touch Bottom Navigation Bar: Physics-based sliding pill indicator with real-time gesture tracking.",
    "120 FPS Horizontal Pager: Fluid thumb swipe between Chats, Contacts, Calls, Status, and Settings.",
    "Instant Pre-Caching: Zero-lag beyondBoundsPageCount pre-warming eliminates stutter and blank frames.",
    "Hardware Acceleration: GPU graphicsLayer translations for native 120Hz responsiveness.",
    "Haptic Micro-Feedback: Subtle spring bounce and haptic click on tab touch."
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

// Direct APK download route
app.get('/download/apk', (req, res) => {
  const apkPath = path.join(__dirname, 'public', 'downloads', 'KYNX-latest.apk');
  if (fs.existsSync(apkPath)) {
    return res.download(apkPath, 'KYNX-v0.9.32.apk');
  }
  
  // Cloud fallback (GitHub Releases or Render backend)
  const cloudUrl = process.env.APK_DOWNLOAD_URL || 'https://github.com/kvynshgautam/kynx-website/releases/download/v0.9.32/KYNX-v0.9.32.apk';
  res.redirect(cloudUrl);
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
