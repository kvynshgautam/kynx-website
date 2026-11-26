const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

// Manifest info
const RELEASE_INFO = {
  version_name: "0.9.61",
  version_code: 71,
  release_name: "Unified v0.9.61 (Android & iOS Build 71): Streamlined Chat & Complete Parity",
  apk_filename: "KYNX-latest.apk",
  file_size: "56.04 MB",
  sha256: "a275d52a90a00a319b9db7480056baae1086c72edc998ba631f28ded35c26ec0",
  ios_version_name: "0.9.61",
  ios_version_code: 71,
  ipa_filename: "KYNX-v0.9.61.ipa",
  ios_file_size: "8.33 MB",
  ios_sha256: "7dac03650ca45249e8265a6d0526f19176050fc23d5e3b9761caf6b8826534ce",
  release_date: "26 November 2026",
  developer: "KG",
  min_android: "Android 8.0+ (API 26) to Android 16 (16 KB Compatible)",
  min_ios: "iOS 15.0+ (arm64)",
  changelog: [
    "Unified v0.9.61 (Android & iOS Build 71): Removed Walkie-Talkie PTT mode across both Android & iOS for cleaner message notifications and audio handling.",
    "Multi-peer Group Voice & Video calls, Video/Document file sharing, Face ID + Vault PIN App Lock, Offline local JSON cache, and OTA updater.",
    "Status Photo/Video & Viewers Sheet, Profile Photo Upload, Extended Theme/Bubble/Glass/TextScale Controls, and Blocked Users Manager."
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
const GITHUB_IPA_RELEASE_URL = "https://github.com/kvynshgautam/kynx-website/releases/download/v0.9.61/KYNX-v0.9.61.ipa";

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
