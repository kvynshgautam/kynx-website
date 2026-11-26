const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

// Manifest info
const RELEASE_INFO = {
  version_name: "0.9.65",
  version_code: 75,
  release_name: "Unified v0.9.65 (Android & iOS Build 75): 720p60 HD Calls & Full Parity",
  apk_filename: "KYNX-latest.apk",
  file_size: "56.04 MB",
  sha256: "79eb65a27d666a0cb3020766d40e25906247b1573c147ab25a66247799dfe831",
  ios_version_name: "0.9.65",
  ios_version_code: 75,
  ipa_filename: "KYNX-v0.9.65.ipa",
  ios_file_size: "10.29 MB",
  ios_sha256: "216572e2172c91dcb85164450b318c3d307fe9d6d98f0454341243cf676d94e4",
  release_date: "26 November 2026",
  developer: "KG",
  min_android: "Android 8.0+ (API 26) to Android 16 (16 KB Compatible)",
  min_ios: "iOS 15.0+ (arm64)",
  changelog: [
    "Unified v0.9.65 (Android & iOS Build 75): Upgraded WebRTC Voice & Video Calls to 720p @ 60fps HD (500 kbps–4.0 Mbps bitrate, hardware H.264 priority, safe 30fps sensor fallback, 48kHz Opus FEC).",
    "Bundled KYNX's exact signature ringtone & notification chime into iOS (.ipa) with Settings previews and local background notification audio.",
    "Cross-platform Android <-> iOS BLE GATT Mesh interop & complete Android-iOS UI parity."
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

// Direct APK & IPA download routes + CDN fallback
const GITHUB_RELEASE_URL = "https://github.com/kvynshgautam/kynx-website/releases/latest/download/KYNX-latest.apk";
const GITHUB_IPA_RELEASE_URL = "https://github.com/kvynshgautam/kynx-website/releases/download/v0.9.65/KYNX-v0.9.65.ipa";

app.get('/download/apk', (req, res) => {
  const apkPath = path.join(__dirname, 'public', 'downloads', 'KYNX-latest.apk');
  if (fs.existsSync(apkPath)) {
    return res.download(apkPath, `KYNX-v${RELEASE_INFO.version_name}.apk`);
  }
  return res.redirect(GITHUB_RELEASE_URL);
});

app.get('/download/ipa', (req, res) => {
  return res.redirect(GITHUB_IPA_RELEASE_URL);
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
