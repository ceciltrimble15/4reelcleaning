// Serverless entry point (Vercel / Netlify-style signature).
// Reuses the exact same core handler as the standalone server, so the intake
// engine behaves identically whether deployed as a function or a server.
//
// Deploy note: this file imports from ../backend/src. On Vercel, set the
// project so this function can resolve that path (or vendor backend/src into
// the function bundle). See backend/README.md for deployment details.

import { handleIntake } from '../backend/src/handler.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }
  try {
    // Vercel parses JSON bodies automatically; fall back to {} otherwise.
    const payload = typeof req.body === 'object' && req.body ? req.body : {};
    const result = await handleIntake(payload);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error('[intake-webhook] unhandled error:', err);
    res.status(500).json({ ok: false, error: 'Internal error' });
  }
}
