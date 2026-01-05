const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";
const TOKEN_KEY = "stock_screener_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null | undefined) {
  // IMPORTANT: dacă tokenul e gol/undefined/null, îl ștergem ca să nu fim "authed" din greșeală
  if (token && token.trim()) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

type RequestOpts = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
};

async function request<T>(
  path: string,
  { method = "GET", body, auth = true }: RequestOpts = {}
): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  if (!res.ok) {
    let msg = "";
    try {
      const j = await res.json();
      msg = j?.error || JSON.stringify(j);
    } catch {
      msg = await res.text().catch(() => "");
    }
    throw new Error(msg || `HTTP ${res.status}`);
  }

  const text = await res.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    // în caz că backend-ul trimite plain text
    return { raw: text } as unknown as T;
  }
}

export type AuthResponse = { token: string; user?: { id: string; email: string } };

export type WatchlistItem = {
  symbol: string;
  name?: string | null;
  addedAt?: string;
};
export type WatchlistResponse = { items: WatchlistItem[] };

export type ScreenerItem = {
  symbol: string;
  name?: string | null;
  pe?: number | null;
  pb?: number | null;
  roe?: number | null;
  eps?: number | null;
  marketCap?: number | null;
  source?: string;
  fetchedAt?: string;
  error?: string;
};
export type ScreenerResponse = { items: ScreenerItem[] };

export type SearchItem = { symbol: string; name: string };
export type SearchResponse = { items: SearchItem[] };

export const api = {
  login(email: string, password: string) {
    return request<AuthResponse>("/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false
    });
  },
  register(email: string, password: string) {
    return request<AuthResponse>("/auth/register", {
      method: "POST",
      body: { email, password },
      auth: false
    });
  },
  getWatchlist() {
    return request<WatchlistResponse>("/watchlist");
  },
  addToWatchlist(symbol: string, name?: string) {
    return request<{ symbol: string; name?: string | null; addedAt?: string }>("/watchlist", {
      method: "POST",
      body: { symbol, name }
    });
  },
  removeFromWatchlist(symbol: string) {
    return request<void>(`/watchlist/${encodeURIComponent(symbol)}`, { method: "DELETE" });
  },
  getScreener() {
    return request<ScreenerResponse>("/screener");
  },
  searchCompanies(q: string) {
    return request<SearchResponse>(`/search?q=${encodeURIComponent(q)}`);
  }
};
