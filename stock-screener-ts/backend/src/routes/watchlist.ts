import { Router } from "express";
import type { Request, Response } from "express";
import { prisma } from "../db";
import { requireAuth } from "../auth";

export const watchlistRouter = Router();
watchlistRouter.use(requireAuth);

watchlistRouter.get("/", async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const items = await prisma.watchlist.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { company: true }
  });

  res.json({
    items: items.map((x: (typeof items)[number]) => ({
      symbol: x.company.symbol,
      name: x.company.name,
      addedAt: x.createdAt
    }))
  });
});

watchlistRouter.post("/", async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { symbol, name } = (req.body ?? {}) as { symbol?: string; name?: string };

  if (!symbol || typeof symbol !== "string") {
    return res.status(400).json({ error: "symbol is required (string)" });
  }

  const normSymbol = symbol.trim().toUpperCase();
  if (!/^[A-Z.\-]{1,10}$/.test(normSymbol)) {
    return res.status(400).json({ error: "invalid symbol format" });
  }

  const company = await prisma.company.upsert({
    where: { symbol: normSymbol },
    update: { name: name?.trim() || undefined },
    create: { symbol: normSymbol, name: name?.trim() || null }
  });

  try {
    const wl = await prisma.watchlist.create({ data: { userId, companyId: company.id } });
    return res.status(201).json({ symbol: company.symbol, name: company.name, addedAt: wl.createdAt });
  } catch {
    return res.status(409).json({ error: "symbol already in watchlist" });
  }
});

watchlistRouter.delete("/:symbol", async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const symbol = (req.params.symbol || "").trim().toUpperCase();

  const company = await prisma.company.findUnique({ where: { symbol } });
  if (!company) return res.status(404).json({ error: "symbol not found" });

  const deleted = await prisma.watchlist.deleteMany({
    where: { userId, companyId: company.id }
  });

  if (deleted.count === 0) return res.status(404).json({ error: "not in watchlist" });
  return res.status(204).send();
});
