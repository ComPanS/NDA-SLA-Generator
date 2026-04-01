import { Router } from 'express';

const router = Router();

function readCountryCode(header: string | string[] | undefined): string | null {
  if (!header) return null;
  const raw = Array.isArray(header) ? header[0] : header;
  if (typeof raw !== 'string') return null;
  const v = raw.trim().toUpperCase();
  if (!v || v === 'XX' || v === 'T1') return null;
  if (/^[A-Z]{2}$/.test(v)) return v;
  return null;
}

/**
 * Returns best-effort ISO 3166-1 alpha-2 country from reverse proxy headers (Cloudflare, custom GeoIP).
 * If headers are absent, returns null — client should fall back to Accept-Language / default.
 */
router.get('/geo-hint', (req, res) => {
  const cf = readCountryCode(req.headers['cf-ipcountry']);
  const custom = readCountryCode(req.headers['x-geo-country']);
  const countryCode = cf ?? custom ?? null;
  res.json({ countryCode });
});

export default router;
