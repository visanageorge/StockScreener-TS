import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearToken } from "../api";

import CompanySearch from "../components/CompanySearch";
import Watchlist from "../components/WatchList";
import ScreenerTable from "../components/ScreenerTable";

export default function Dashboard() {
  const [refreshKey, setRefreshKey] = useState(0);
  const nav = useNavigate();

  function refreshAll() {
    setRefreshKey((k) => k + 1);
  }

  function logout() {
    clearToken();
    nav("/login", { replace: true });
  }

  return (
    <div className="container">
      <div className="card">
        <div className="header">
          <div className="brand">
            <h1>Stock Screener</h1>
            <p>Watchlist + Finnhub metrics with snapshot cache.</p>
          </div>

          <div className="actions">
            <button className="btn" onClick={refreshAll}>
              Refresh
            </button>
            <button className="btn btn-danger" onClick={logout}>
              Logout
            </button>
          </div>
        </div>

        <div className="stack">
          <CompanySearch onChanged={refreshAll} />
        </div>
      </div>

      <Watchlist refreshKey={refreshKey} onChanged={refreshAll} />
      <ScreenerTable refreshKey={refreshKey} />
    </div>
  );
}
