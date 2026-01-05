import { useState } from "react";
import { api, setToken } from "../api";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const nav = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const res = await api.register(email, password);
      setToken(res.token);
      nav("/app", { replace: true });
    } catch (e: any) {
      setError(e.message || "Register failed");
    }
  }

  return (
    <div className="auth-shell">
      <div className="card">
        <h2 className="auth-title">Register</h2>
        <p className="auth-sub">Create an account (min 8 chars password).</p>

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
            autoComplete="new-password"
          />

          <button className="btn btn-primary" type="submit">
            Create account
          </button>

          <div className="footer-link">
            Already have an account? <Link to="/login">Login</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
