const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

// Manifest info
const RELEASE_INFO = {
  version_name: "0.9.59",
  version_code: 69,
  release_name: "Unified v0.9.59 (Android & iOS Build 69): SDP NULL Repair & 12s Background Call Grace",
  apk_filename: "KYNX-latest.apk",
  file_size: "56.6 MB",
  sha256: "a55ed24bffc325cbe3f5a58bcbcc6661551d006c608ea29d2d0f5f9333d9c047",
  ios_version_name: "0.9.59",
  ios_version_code: 69,
  ipa_filename: "KYNX-v0.9.59.ipa",
  ios_file_size: "7.93 MB",
  ios_sha256: "62b3fca296840de9aa9183895bde9597ec1604bf5258c135b70a5519abad9c99",
  release_date: "25 November 2026",
  developer: "KG",
  min_android: "Android 8.0+ (API 26) to Android 16 (16 KB Compatible)",
  min_ios: "iOS 15.0+ (arm64)",
  changelog: [
    "Unified v0.9.59 (Android & iOS Build 69): Automatic SDP sanitizer preventing SessionDescription NULL errors between Android & iOS.",
    "12-second server call-offer buffer + iOS 30s background WebSocket grace and instant foreground reconnect.",
    "Release-signed (v1+v2+v3) & 16 KB page-aligned universal Android APK (uninstall old debug-signed builds once before upgrading)."
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
const GITHUB_IPA_RELEASE_URL = "https://github.com/kvynshgautam/kynx-website/releases/download/v0.9.59/KYNX-v0.9.59.ipa";

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
