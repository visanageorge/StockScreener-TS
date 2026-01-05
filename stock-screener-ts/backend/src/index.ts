import express from "express";
import cors from "cors";
import helmet from "helmet";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

import { prisma } from "./db";
import { signToken } from "./auth";
import { watchlistRouter } from "./routes/watchlist";
import { screenerRouter } from "./routes/screener";
import searchRouter from "./routes/search";

dotenv.config();

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.use("/watchlist", watchlistRouter);
app.use("/screener", screenerRouter);
app.use("/search", searchRouter);

// REGISTER
app.post("/auth/register", async (req, res) => {
  const email = (req.body?.email || "").toString().trim().toLowerCase();
  const password = (req.body?.password || "").toString().trim();

  if (!email || !password) return res.status(400).json({ error: "Email and password required" });
  if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 chars" });

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: passwordHash },
      select: { id: true, email: true }
    });

    const token = signToken(user);
    return res.json({ token, user });
  } catch {
    return res.status(400).json({ error: "User already exists" });
  }
});

// LOGIN
app.post("/auth/login", async (req, res) => {
  const email = (req.body?.email || "").toString().trim().toLowerCase();
  const password = (req.body?.password || "").toString().trim();

  if (!email || !password) return res.status(400).json({ error: "Email and password required" });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = signToken({ id: user.id, email: user.email });
  return res.json({ token, user: { id: user.id, email: user.email } });
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`API running on http://localhost:${port}`));
