import { useEffect, useState } from "react";
import { api } from "../api";
import type { SearchItem } from "../api";

export default function CompanySearch({ onChanged }: { onChanged?: () => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) {
      setResults([]);
      setError("");
      return;
    }

    const id = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.searchCompanies(query);
        setResults(res.items || []);
      } catch (e: any) {
        setError(e.message || "Search failed");
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(id);
  }, [q]);

  async function add(symbol: string, name: string) {
    setError("");
    try {
      await api.addToWatchlist(symbol, name);
      setResults([]);
      setQ("");
      onChanged?.();
    } catch (e: any) {
      setError(e.message || "Failed to add");
    }
  }

  return (
    <div className="card">
      <div className="header" style={{ marginBottom: 8 }}>
        <div>
          <h3 style={{ margin: 0 }}>Search</h3>
          <div className="small">Type at least 2 characters.</div>
        </div>
        {loading && <span className="pill">Loading…</span>}
      </div>

      <input
        className="input"
        placeholder="AAPL, MSFT, TSLA…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {error && <div className="error" style={{ marginTop: 10 }}>{error}</div>}

      {!!results.length && (
        <ul className="list">
          {results.map((r) => (
            <li className="list-item" key={r.symbol}>
              <div>
                <div><b>{r.symbol}</b></div>
                <div className="small">{r.name}</div>
              </div>
              <button className="btn btn-primary" onClick={() => add(r.symbol, r.name)}>
                Add
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
