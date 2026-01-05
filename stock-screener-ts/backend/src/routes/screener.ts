import { Router } from "express";
import type { Request, Response } from "express";
import { prisma } from "../db";
import { requireAuth } from "../auth";
import { getOrRefreshSnapshot } from "../services/snapshot";

export const screenerRouter = Router();
screenerRouter.use(requireAuth);

screenerRouter.get("/", async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const list = await prisma.watchlist.findMany({
    where: { userId },
    include: { company: true },
    orderBy: { createdAt: "desc" }
  });

  const results: any[] = [];

  for (const item of list) {
    const symbol = item.company.symbol;

    try {
      const snap = await getOrRefreshSnapshot(symbol);
      results.push({
        ...snap.data,
        symbol,
        name: item.company.name,
        fetchedAt: snap.fetchedAt,
        source: snap.source,
        });

    } catch {
      results.push({ symbol, name: item.company.name, error: "failed_to_fetch_metrics" });
    }
  }

  res.json({ items: results });
});
