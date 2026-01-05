import { Router } from "express";
import type { Request, Response } from "express";

type SearchItem = { symbol: string; name: string };
const router = Router();

router.get("/", async (req: Request, res: Response) => {
  const q = (req.query.q ?? "").toString().trim();
  if (q.length < 2) return res.json({ items: [] as SearchItem[] });

  const token = process.env.FINNHUB_TOKEN;
  if (!token) return res.status(500).json({ error: "Missing FINNHUB_TOKEN" });

  const url = `https://finnhub.io/api/v1/search?q=${encodeURIComponent(q)}`;

  try {
    const r = await fetch(url, { headers: { "X-Finnhub-Token": token } });
    if (!r.ok) {
      const text = await r.text();
      throw new Error(`Finnhub error ${r.status}: ${text}`);
    }

    const data: any = await r.json();
    const items: SearchItem[] = (data.result || []).slice(0, 8).map((x: any) => ({
      symbol: x.symbol,
      name: x.description
    }));

    res.json({ items });
  } catch (e: any) {
    res.status(502).json({ error: e?.message || "Upstream error" });
  }
});

export default router;
