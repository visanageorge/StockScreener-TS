import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

export type JwtUser = { id: string; email: string };

export function signToken(user: { id: string; email: string }): string {
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
    req.user = decoded;
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
