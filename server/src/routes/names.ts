import { Router } from "express";
import { z } from "zod";
import { pool } from "../db.js";
import { requireAuth } from "../middlewares/auth.js";

export const namesRouter = Router();

namesRouter.use(requireAuth);

const GenerateSchema = z.object({
  filename: z.string().trim().min(1).max(300),
});

namesRouter.post("/generate", async (req, res) => {
  const parsed = GenerateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "INVALID DATA." });
  }

  const u = (req as any).user as {
    id: string;
    role: "admin" | "user";
    credits: number;
  };

  // Admin: no cobra
  if (u.role === "admin") {
    return res.json({
      ok: true,
      filename: parsed.data.filename,
      charged: false,
      credits: u.credits,
    });
  }

  // User: cobra 1 crédito (atómico)
  const { rows } = await pool.query(
    `update users
     set credits = credits - 1,
         used_credits = used_credits + 1,
         updated_at = now()
     where id = $1 and credits >= 1
     returning credits, used_credits`,
    [u.id]
  );

  if (!rows.length) {
    return res.status(403).json({ ok: false, message: "NO CREDITS." });
  }

  return res.json({
    ok: true,
    filename: parsed.data.filename,
    charged: true,
    credits: Number(rows[0].credits ?? 0),
    usedCredits: Number(rows[0].used_credits ?? 0),
  });
});
