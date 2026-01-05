import { prisma } from "../db.js";
import { fetchStockMetrics, type StockMetrics } from "./stocks.js";


const TTL_MINUTES = 15;

function isFresh(fetchedAt: Date) {
  const ageMs = Date.now() - new Date(fetchedAt).getTime();
  return ageMs < TTL_MINUTES * 60 * 1000;
}

export type SnapshotResult = {
  source: "cache" | "api";
  fetchedAt: Date;
  data: StockMetrics;
};

export async function getOrRefreshSnapshot(symbol: string): Promise<SnapshotResult> {
  const normSymbol = symbol.trim().toUpperCase();

  const company = await prisma.company.upsert({
    where: { symbol: normSymbol },
    update: {},
    create: { symbol: normSymbol },
  });

  const latest = await prisma.snapshot.findFirst({
    where: { companyId: company.id },
    orderBy: { fetchedAt: "desc" },
  });

  if (latest && isFresh(latest.fetchedAt)) {
    const parsed = JSON.parse(latest.data) as StockMetrics;
    return { source: "cache", fetchedAt: latest.fetchedAt, data: parsed };
  }

  const metrics = await fetchStockMetrics(normSymbol);

  const created = await prisma.snapshot.create({
    data: {
      companyId: company.id,
      fetchedAt: new Date(),
      data: JSON.stringify(metrics),
    },
  });

  return { source: "api", fetchedAt: created.fetchedAt, data: metrics };
}
