import { Router } from "express";
import type { Request, Response } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../auth.js";
import { getOrRefreshSnapshot } from "../services/snapshot.js";


export const screenerRouter = Router();
screenerRouter.use(requireAuth);

screenerRouter.get("/", async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const list = await prisma.watchlist.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });

  const companyIds = list.map((x) => x.companyId);
  const companies = await prisma.company.findMany({ where: { id: { in: companyIds } } });
  const cmap = new Map(companies.map((c) => [c.id, c]));

  const results: any[] = [];

  for (const item of list) {
    const c = cmap.get(item.companyId);
    const symbol = c?.symbol ?? "";

    try {
      const snap = await getOrRefreshSnapshot(symbol);
      results.push({
        symbol,
        name: c?.name ?? null,
        fetchedAt: snap.fetchedAt,
        source: snap.source,
        ...snap.data
      });
    } catch {
      results.push({ symbol, name: c?.name ?? null, error: "failed_to_fetch_metrics" });
    }
  }

  res.json({ items: results });
});
