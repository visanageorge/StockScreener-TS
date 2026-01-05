import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import type { ScreenerItem } from "../api";

/** Praguri (culori) */
const THRESHOLDS = {
  pe: { min: 5, max: 25 },
  pb: { max: 3 },
  roe: { goodMin: 0.15, badMax: 0.1 },
  eps: { goodMin: 0 },
  marketCap: { goodMin: 10e9, badMax: 2e9 }
};

type ClassName = "good" | "bad" | "mid" | "na";
type ShowMode = "all" | "good" | "bad";

function fmtNum(n: number | null | undefined, maxDecimals = 4) {
  if (n === null || n === undefined || Number.isNaN(n)) return "-";
  return n.toFixed(Math.min(maxDecimals, 4));
}

function roeToRatio(roe: number | null | undefined) {
  if (roe === null || roe === undefined || Number.isNaN(roe)) return null;
  return roe > 1 ? roe / 100 : roe; // acceptă procente sau ratio
}

function fmtPct(roe: number | null | undefined) {
  const r = roeToRatio(roe);
  if (r === null) return "-";
  return `${(r * 100).toFixed(2)}%`;
}

/** ✅ Normalizează marketCap în USD (Finnhub poate veni în milioane) */
function normalizeMarketCap(mc: number | null | undefined): number | null {
  if (mc === null || mc === undefined || Number.isNaN(mc)) return null;

  // dacă e mic (ex: 2500000), e aproape sigur în "milioane"
  if (mc < 100_000_000) return mc * 1_000_000;

  return mc; // presupunem USD deja
}

/** Market Cap doar M/B/T cu 2 zecimale */
function fmtMarketCap(mc: number | null | undefined) {
  const usd = normalizeMarketCap(mc);
  if (usd === null) return "-";

  const abs = Math.abs(usd);
  const sign = usd < 0 ? "-" : "";

  if (abs >= 1e12) return `${sign}${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(2)}M`;
  return `${sign}${abs.toFixed(2)}`;
}

function peClass(pe: number | null | undefined): ClassName {
  if (pe === null || pe === undefined || Number.isNaN(pe)) return "na";
  return pe >= THRESHOLDS.pe.min && pe <= THRESHOLDS.pe.max ? "good" : "bad";
}
function pbClass(pb: number | null | undefined): ClassName {
  if (pb === null || pb === undefined || Number.isNaN(pb)) return "na";
  return pb <= THRESHOLDS.pb.max ? "good" : "bad";
}
function roeClass(roe: number | null | undefined): ClassName {
  const r = roeToRatio(roe);
  if (r === null) return "na";
  if (r >= THRESHOLDS.roe.goodMin) return "good";
  if (r < THRESHOLDS.roe.badMax) return "bad";
  return "mid";
}
function epsClass(eps: number | null | undefined): ClassName {
  if (eps === null || eps === undefined || Number.isNaN(eps)) return "na";
  return eps > THRESHOLDS.eps.goodMin ? "good" : "bad";
}
function mcClass(mc: number | null | undefined): ClassName {
  const usd = normalizeMarketCap(mc);
  if (usd === null) return "na";
  if (usd >= THRESHOLDS.marketCap.goodMin) return "good";
  if (usd < THRESHOLDS.marketCap.badMax) return "bad";
  return "mid";
}

function isRowGood(i: ScreenerItem) {
  return (
    peClass(i.pe) === "good" &&
    pbClass(i.pb) === "good" &&
    roeClass(i.roe) === "good" &&
    epsClass(i.eps) === "good" &&
    mcClass(i.marketCap) === "good" &&
    !i.error
  );
}

function isRowBad(i: ScreenerItem) {
  if (i.error) return true;
  return (
    peClass(i.pe) === "bad" ||
    pbClass(i.pb) === "bad" ||
    roeClass(i.roe) === "bad" ||
    epsClass(i.eps) === "bad" ||
    mcClass(i.marketCap) === "bad"
  );
}

export default function ScreenerTable({ refreshKey }: { refreshKey: number }) {
  const [items, setItems] = useState<ScreenerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filters
  const [q, setQ] = useState("");
  const [show, setShow] = useState<ShowMode>("all");
  const [peMax, setPeMax] = useState("");
  const [pbMax, setPbMax] = useState("");
  const [roeMinPct, setRoeMinPct] = useState(""); // %
  const [epsMin, setEpsMin] = useState("");
  const [mcMinB, setMcMinB] = useState(""); // B

  function resetFilters() {
    setQ("");
    setShow("all");
    setPeMax("");
    setPbMax("");
    setRoeMinPct("");
    setEpsMin("");
    setMcMinB("");
  }

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await api.getScreener();
      setItems(res.items || []);
    } catch (e: any) {
      setError(e.message || "Failed to load screener");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  useEffect(() => {
    const id = setInterval(() => load(), 30000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    const peMaxN = peMax.trim() ? Number(peMax) : null;
    const pbMaxN = pbMax.trim() ? Number(pbMax) : null;
    const roeMinN = roeMinPct.trim() ? Number(roeMinPct) / 100 : null; // % -> ratio
    const epsMinN = epsMin.trim() ? Number(epsMin) : null;

    return items.filter((i) => {
      // text filter
      if (query) {
        const hay = `${i.symbol ?? ""} ${i.name ?? ""}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }

      // show mode
      if (show === "good" && !isRowGood(i)) return false;
      if (show === "bad" && !isRowBad(i)) return false;

      // numeric filters
      if (peMaxN !== null) {
        if (i.pe === null || i.pe === undefined) return false;
        if (!(i.pe <= peMaxN)) return false;
      }

      if (pbMaxN !== null) {
        if (i.pb === null || i.pb === undefined) return false;
        if (!(i.pb <= pbMaxN)) return false;
      }

      if (roeMinN !== null) {
        const r = roeToRatio(i.roe);
        if (r === null) return false;
        if (!(r >= roeMinN)) return false;
      }

      if (epsMinN !== null) {
        if (i.eps === null || i.eps === undefined) return false;
        if (!(i.eps >= epsMinN)) return false;
      }

      

      return true;
    });
  }, [items, q, show, peMax, pbMax, roeMinPct, epsMin, mcMinB]);

  return (
    <div className="card">
      <div className="header" style={{ alignItems: "flex-start" }}>
        <div className="brand">
          <h1 style={{ fontSize: 16, margin: 0 }}>Screener</h1>
          <p>Rules: P/E 5–25, P/B ≤3, ROE ≥15%, EPS &gt;0, MarketCap ≥10B</p>
          <div className="small">
            Showing <b>{filtered.length}</b> / {items.length}
          </div>
        </div>

        <div className="actions" style={{ flexWrap: "wrap", justifyContent: "flex-end" }}>
          {loading && <span className="pill">Loading…</span>}
          <button className="btn" onClick={load} disabled={loading}>
            Reload
          </button>
          <button className="btn" onClick={resetFilters}>
            Reset filters
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="stack" style={{ marginBottom: 12 }}>
        <div className="row" style={{ flexWrap: "wrap" }}>
          <input
            className="input"
            style={{ maxWidth: 320 }}
            placeholder="Search symbol or name…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <div className="row" style={{ gap: 8 }}>
            <span className="small">Show:</span>
            <select
              className="input"
              style={{ width: 160 }}
              value={show}
              onChange={(e) => setShow(e.target.value as ShowMode)}
            >
              <option value="all">All</option>
              <option value="good">Good only</option>
              <option value="bad">Bad only</option>
            </select>
          </div>

          <span className="pill">Filters</span>
        </div>

        <div className="row" style={{ flexWrap: "wrap" }}>
          <input
            className="input"
            style={{ width: 140 }}
            placeholder="P/E max"
            value={peMax}
            onChange={(e) => setPeMax(e.target.value)}
            inputMode="decimal"
          />
          <input
            className="input"
            style={{ width: 140 }}
            placeholder="P/B max"
            value={pbMax}
            onChange={(e) => setPbMax(e.target.value)}
            inputMode="decimal"
          />
          <input
            className="input"
            style={{ width: 160 }}
            placeholder="ROE min (%)"
            value={roeMinPct}
            onChange={(e) => setRoeMinPct(e.target.value)}
            inputMode="decimal"
          />
          <input
            className="input"
            style={{ width: 140 }}
            placeholder="EPS min"
            value={epsMin}
            onChange={(e) => setEpsMin(e.target.value)}
            inputMode="decimal"
          />
        </div>
      </div>

      {error && <div className="error">{error}</div>}
      {!loading && !items.length && <div className="muted">No data yet. Add symbols to watchlist.</div>}
      {!loading && !!items.length && filtered.length === 0 && <div className="muted">No results match your filters.</div>}

      {!!filtered.length && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Name</th>
                <th className="num">P/E</th>
                <th className="num">P/B</th>
                <th className="num">ROE</th>
                <th className="num">EPS</th>
                <th className="num">Market Cap</th>
                <th>Source</th>
                <th>Fetched</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => (
                <tr key={i.symbol}>
                  <td><b>{i.symbol}</b></td>
                  <td className="small">{i.name ?? "-"}</td>

                  <td className="num"><span className={`val ${peClass(i.pe)}`}>{fmtNum(i.pe, 4)}</span></td>
                  <td className="num"><span className={`val ${pbClass(i.pb)}`}>{fmtNum(i.pb, 4)}</span></td>
                  <td className="num"><span className={`val ${roeClass(i.roe)}`}>{fmtPct(i.roe)}</span></td>
                  <td className="num"><span className={`val ${epsClass(i.eps)}`}>{fmtNum(i.eps, 4)}</span></td>
                  <td className="num"><span className={`val ${mcClass(i.marketCap)}`}>{fmtMarketCap(i.marketCap)}</span></td>

                  <td>{i.error ? `ERR: ${i.error}` : i.source ?? "-"}</td>
                  <td className="small">{i.fetchedAt ? new Date(i.fetchedAt).toLocaleString() : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
