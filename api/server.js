/**
 * Vercel Serverless Function: api/server.js
 * Bertindak sebagai Secure Serverless Reverse Proxy antara Frontend dan Google Apps Script.
 * URL Google Apps Script tersimpan aman di server-side (process.env.GAS_URL) dan TIDAK PERNAH bocor ke browser.
 */

export default async function handler(req, res) {
  // Set CORS headers untuk keamanan
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Metode HTTP tidak diizinkan. Gunakan POST.' });
  }

  // Ambil URL Google Apps Script dari Environment Variable Vercel atau default backend
  const gasUrl = process.env.GAS_URL || process.env.GOOGLE_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbxrzmTAm9oJbZZLjZFBwhlZoflK-xU0_Jq27Y2FS2YrI4mdKKAL-nDn0Zxer4nj1tH1/exec';

  try {
    const { action, args } = req.body || {};

    if (!action) {
      return res.status(400).json({ success: false, error: 'Parameter "action" wajib disertakan.' });
    }

    // Teruskan panggilan dari server Vercel ke Google Apps Script (Bebas Masalah CORS & Iframe!)
    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify({
        action: action,
        args: args || []
      }),
      redirect: 'follow'
    });

    const data = await response.json();
    return res.status(200).json(data);

  } catch (err) {
    console.error('[Vercel Proxy Error]:', err);
    return res.status(500).json({
      success: false,
      error: 'Gagal menghubungi database Google Apps Script: ' + err.message
    });
  }
}
