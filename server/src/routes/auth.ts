import { Router } from "express";
import { z } from "zod";
import { createSession, createUser, destroySession, verifyLogin } from "../lib/authDb.js";
import { requireAuth } from "../middlewares/auth.js";

export const authRouter = Router();

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post("/login", async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, message: "INVALID DATA." });

  const { email, password } = parsed.data;
  const v = await verifyLogin(email, password);
  if (!v.ok) return res.status(401).json({ ok: false, message: v.message });

  const token = await createSession(v.userId);
  return res.json({ ok: true, token, user: v.user });
});

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

authRouter.post("/register", async (req, res) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, message: "INVALID DATA." });

  const { email, password } = parsed.data;
  const c = await createUser(email, password);
  if (!c.ok) return res.status(400).json({ ok: false, message: c.message });

  const token = await createSession(c.userId);
  return res.json({ ok: true, token, user: c.user });
});

authRouter.post("/logout", requireAuth, async (req, res) => {
  const token = (req as any).token as string;
  await destroySession(token);
  return res.json({ ok: true });
});

// ✅ NUEVO: /me
authRouter.get("/me", requireAuth, (req, res) => {
  const u = (req as any).user;
  return res.json({ ok: true, user: u });
});
