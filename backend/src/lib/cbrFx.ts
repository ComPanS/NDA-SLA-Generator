/**
 * FX rates from Central Bank of Russia daily JSON (RUB base).
 * rates[currency] = units of foreign currency per 1 RUB (so multiply RUB amount by rates.USD to get USD).
 */

const CBR_URL = 'https://www.cbr-xml-daily.ru/daily_json.js';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

const TARGET_CODES = ['USD', 'EUR', 'GBP', 'THB'] as const;

export type BillingFxCurrency = 'RUB' | (typeof TARGET_CODES)[number];

export interface FxRatesResponse {
  base: 'RUB';
  /** Foreign currency units per 1 RUB */
  rates: Record<BillingFxCurrency, number>;
  source: 'cbr';
  updated_at: string;
}

type CacheEntry = { data: FxRatesResponse; expiresAt: number };

let cache: CacheEntry | null = null;

function parseCbrResponse(json: unknown): FxRatesResponse {
  const root = json as {
    Date?: string;
    Timestamp?: string;
    Valute?: Record<string, { CharCode?: string; Nominal?: number; Value?: number }>;
  };
  const valute = root.Valute;
  if (!valute || typeof valute !== 'object') {
    throw new Error('CBR response missing Valute');
  }

  const rates: Record<string, number> = { RUB: 1 };

  for (const code of TARGET_CODES) {
    const row = valute[code];
    if (!row || row.Value == null || !row.Nominal) continue;
    const rubPerUnit = row.Value / row.Nominal;
    if (rubPerUnit <= 0) continue;
    rates[code] = 1 / rubPerUnit;
  }

  for (const code of TARGET_CODES) {
    if (rates[code] === undefined) {
      throw new Error(`CBR response missing rate for ${code}`);
    }
  }

  const updated =
    root.Timestamp || root.Date || new Date().toISOString();

  return {
    base: 'RUB',
    rates: rates as Record<BillingFxCurrency, number>,
    source: 'cbr',
    updated_at: typeof updated === 'string' ? updated : new Date().toISOString(),
  };
}

export async function getFxRatesRubBase(): Promise<FxRatesResponse> {
  const now = Date.now();
  if (cache && now < cache.expiresAt) {
    return cache.data;
  }

  const res = await fetch(CBR_URL, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`CBR fetch failed: ${res.status}`);
  }
  const json = (await res.json()) as unknown;
  const data = parseCbrResponse(json);

  cache = { data, expiresAt: now + CACHE_TTL_MS };
  return data;
}
