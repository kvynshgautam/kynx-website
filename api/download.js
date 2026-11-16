module.exports = (req, res) => {
  // Direct APK redirect (points to GitHub release or fallback)
  const downloadUrl = process.env.APK_DOWNLOAD_URL || 'https://github.com/kvynshgautam/kynx-website/releases/download/v0.9.32/KYNX-v0.9.32.apk';
  res.writeHead(302, { Location: downloadUrl });
  res.end();
};
