import { useState } from "react";
import { api, setToken } from "../api";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const nav = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const res = await api.login(email, password);
      setToken(res.token);
      nav("/app", { replace: true });
    } catch (e: any) {
      setError(e.message || "Login failed");
    }
  }

  return (
    <div className="auth-shell">
      <div className="card">
        <h2 className="auth-title">Login</h2>
        <p className="auth-sub">Sign in to manage your watchlist and screener.</p>

        <form onSubmit={submit} className="stack">
          {error && <div className="error">{error}</div>}

          <input
            className="input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />

          <input
            className="input"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          <button className="btn btn-primary" type="submit">
            Login
          </button>

          <div className="footer-link">
            No account? <Link to="/register">Register</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
