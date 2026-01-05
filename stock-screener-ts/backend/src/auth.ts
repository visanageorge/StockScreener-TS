import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

export type JwtUser = { id: number; email: string };

export function signToken(user: { id: number; email: string }): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Missing JWT_SECRET");
  return jwt.sign({ id: user.id, email: user.email }, secret, { expiresIn: "2h" });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? "";
  const [type, token] = header.split(" ");

  if (type !== "Bearer" || !token) return res.status(401).json({ error: "Missing token" });

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("Missing JWT_SECRET");

    const decoded = jwt.verify(token, secret) as JwtUser;

    // harden: accept string numbers too
    const id = typeof decoded.id === "string" ? Number(decoded.id) : decoded.id;
    if (!Number.isFinite(id)) return res.status(401).json({ error: "Invalid token payload" });

    req.user = { id, email: decoded.email };
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
