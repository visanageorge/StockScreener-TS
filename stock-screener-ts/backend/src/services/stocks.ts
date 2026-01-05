const FINNHUB_KEY = process.env.FINNHUB_TOKEN;
const BASE = "https://finnhub.io/api/v1";

export type StockMetrics = {
  pe: number | null;
  pb: number | null;
  roe: number | null;
  eps: number | null;
  marketCap: number | null;
};


export async function fetchStockMetrics(symbol: string): Promise<StockMetrics> {
  if (!FINNHUB_KEY) throw new Error("Missing FINNHUB_TOKEN");

  const url = `${BASE}/stock/metric?symbol=${encodeURIComponent(symbol)}&metric=all&token=${FINNHUB_KEY}`;
  const r = await fetch(url);

  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(`Finnhub error ${r.status}: ${text}`);
  }

  const json: any = await r.json();
  const m = json?.metric ?? {};

  return {
    pe: m.peTTM ?? null,
    pb: m.pb ?? null,
    roe: m.roeTTM ?? null,
    eps: m.epsTTM ?? null,
    marketCap: m.marketCapitalization ?? null,
  };

}
