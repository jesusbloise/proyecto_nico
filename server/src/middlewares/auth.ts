import type { Request, Response, NextFunction } from "express";
import { getUserByToken } from "../lib/authDb.js";

function readBearerToken(req: Request): string | null {
  const h = String(req.headers.authorization || "");
  if (!h) return null;
  if (!h.toLowerCase().startsWith("bearer ")) return null;
  const t = h.slice("bearer ".length).trim();
  return t ? t : null;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = readBearerToken(req);
  if (!token) return res.status(401).json({ ok: false, message: "NO TOKEN." });

  const u = await getUserByToken(token);
  if (!u) return res.status(401).json({ ok: false, message: "INVALID TOKEN." });

  // lo dejamos en req para usarlo en requireAdmin o futuros middlewares
  (req as any).user = u;
  (req as any).token = token;

  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const u = (req as any).user as { role?: string } | undefined;
  if (!u) return res.status(401).json({ ok: false, message: "UNAUTHORIZED." });

  if (u.role !== "admin") {
    return res.status(403).json({ ok: false, message: "FORBIDDEN." });
  }

  next();
}
