import { useEffect, useState } from "react";
import { api } from "../api";
import type { WatchlistItem } from "../api";

export default function Watchlist({
  refreshKey,
  onChanged
}: {
  refreshKey: number;
  onChanged?: () => void;
}) {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await api.getWatchlist();
      setItems(res.items || []);
    } catch (e: any) {
      setError(e.message || "Failed to load watchlist");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  async function remove(symbol: string) {
    setError("");
    try {
      await api.removeFromWatchlist(symbol);
      await load();
      onChanged?.();
    } catch (e: any) {
      setError(e.message || "Failed to remove");
    }
  }

  return (
    <div className="card">
      <div className="header">
        <div className="brand">
          <h1 style={{ fontSize: 16, margin: 0 }}>Watchlist</h1>
          <p>Symbols you track</p>
        </div>

        <div className="actions">
          <span className="pill">{items.length} items</span>
          <button className="btn" onClick={load} disabled={loading}>
            Reload
          </button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}
      {loading && <div className="muted">Loading…</div>}

      {!loading && !items.length && <div className="muted">No items yet. Add from search.</div>}

      {!!items.length && (
        <ul className="list">
          {items.map((i) => (
            <li className="list-item" key={i.symbol}>
              <div>
                <div><b>{i.symbol}</b></div>
                <div className="small">{i.name ?? ""}</div>
              </div>
              <button className="btn btn-danger" onClick={() => remove(i.symbol)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
