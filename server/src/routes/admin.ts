import { Router } from "express";
import { z } from "zod";
import { pool } from "../db.js";
import { requireAuth, requireAdmin } from "../middlewares/auth.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

adminRouter.get("/users", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `select id, email, role, credits, used_credits, created_at
       from users
       order by created_at desc`
    );
    return res.json({ ok: true, users: rows });
  } catch (e) {
    return res.status(500).json({ ok: false, message: "SERVER ERROR." });
  }
});

const CreditsSchema = z.object({
  userId: z.string().min(1),
  addCredits: z.number().int().min(0),
});

adminRouter.post("/credits/add", async (req, res) => {
  const parsed = CreditsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "INVALID DATA." });
  }

  const { userId, addCredits } = parsed.data;

  try {
    const { rows } = await pool.query(
      `update users
       set credits = credits + $2, updated_at = now()
       where id = $1
       returning id, email, role, credits, used_credits`,
      [userId, addCredits]
    );

    if (!rows.length) return res.status(404).json({ ok: false, message: "USER NOT FOUND." });
    return res.json({ ok: true, user: rows[0] });
  } catch (e) {
    return res.status(500).json({ ok: false, message: "SERVER ERROR." });
  }
});

const RoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["admin", "user"]),
});

adminRouter.post("/role/set", async (req, res) => {
  const parsed = RoleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "INVALID DATA." });
  }

  const { userId, role } = parsed.data;

  try {
    const { rows } = await pool.query(
      `update users
       set role = $2, updated_at = now()
       where id = $1
       returning id, email, role, credits, used_credits`,
      [userId, role]
    );

    if (!rows.length) return res.status(404).json({ ok: false, message: "USER NOT FOUND." });
    return res.json({ ok: true, user: rows[0] });
  } catch (e) {
    return res.status(500).json({ ok: false, message: "SERVER ERROR." });
  }
});


// import { Router } from "express";
// import { z } from "zod";
// import { pool } from "../db.js";
// import { requireAuth, requireAdmin } from "../middlewares/auth.js";

// export const adminRouter = Router();

// adminRouter.use(requireAuth, requireAdmin);

// adminRouter.get("/users", async (_req, res) => {
//   const { rows } = await pool.query(
//     `select id, email, role, credits, used_credits, created_at
//      from users
//      order by created_at desc`
//   );
//   return res.json({ ok: true, users: rows });
// });

// const CreditsSchema = z.object({
//   userId: z.string().min(1),
//   addCredits: z.number().int().min(0),
// });

// adminRouter.post("/credits/add", async (req, res) => {
//   const parsed = CreditsSchema.safeParse(req.body);
//   if (!parsed.success) return res.status(400).json({ ok: false, message: "INVALID DATA." });

//   const { userId, addCredits } = parsed.data;

//   const { rows } = await pool.query(
//     `update users
//      set credits = credits + $2, updated_at = now()
//      where id = $1
//      returning id, email, role, credits, used_credits`,
//     [userId, addCredits]
//   );

//   if (!rows.length) return res.status(404).json({ ok: false, message: "USER NOT FOUND." });
//   return res.json({ ok: true, user: rows[0] });
// });

// const RoleSchema = z.object({
//   userId: z.string().min(1),
//   role: z.enum(["admin", "user"]),
// });

// adminRouter.post("/role/set", async (req, res) => {
//   const parsed = RoleSchema.safeParse(req.body);
//   if (!parsed.success) return res.status(400).json({ ok: false, message: "INVALID DATA." });

//   const { userId, role } = parsed.data;

//   const { rows } = await pool.query(
//     `update users
//      set role = $2, updated_at = now()
//      where id = $1
//      returning id, email, role, credits, used_credits`,
//     [userId, role]
//   );

//   if (!rows.length) return res.status(404).json({ ok: false, message: "USER NOT FOUND." });
//   return res.json({ ok: true, user: rows[0] });
// });
