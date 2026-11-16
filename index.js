const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

// Manifest info
const RELEASE_INFO = {
  version_name: "0.9.32",
  version_code: 42,
  release_name: "Build 42: Turbo Media & Privacy Engine",
  apk_filename: "KYNX-latest.apk",
  file_size: "59.94 MB",
  sha256: "2f1793a875bfb33d976fd7df3f93b722e23d9de40f47c999473bb85a2a7fa1cc",
  release_date: "November 16, 2026",
  developer: "KG",
  min_android: "Android 8.0+ (API 26) to Android 15",
  changelog: [
    "① View-Once Media Engine: Photos and videos self-destruct upon viewing and auto-purge permanently from disk.",
    "Hardware Screenshot Protection: Enforced via FLAG_SECURE / SecureFlagPolicy to block recording and capture.",
    "Native 120fps Fast Gestures: Swipe-right on any bubble to reply with haptic spring physics, and double-tap to quick-react ❤️.",
    "Long-Press Send Actions: Tap to send, or long-press to choose 🔕 Send Silently or ⏰ Schedule Message.",
    "5 Procedural Cyber GPU Wallpapers: Obsidian Abyss, Violet Aurora, Midnight Nebula, Emerald Matrix, Cyberpunk Crimson."
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
