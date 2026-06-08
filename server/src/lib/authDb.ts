import bcrypt from "bcryptjs";
import crypto from "crypto";
import { pool } from "../db.js";

export type PublicUser = {
  id: string;
  email: string;
  role: "admin" | "user";
  credits: number;
  usedCredits: number;
};

export function makeToken() {
  return crypto.randomBytes(32).toString("hex");
}

export async function ensureDefaultAdmin() {
  const { rows } = await pool.query(
    `select 1 from users where role='admin' limit 1`
  );
  if (rows.length) return;

  const email = process.env.ADMIN_EMAIL || "admin@local.dev";
  const password = process.env.ADMIN_PASSWORD || "admin1234";
  const id = crypto.randomUUID();
  const hash = bcrypt.hashSync(password, 10);

  await pool.query(
    `insert into users(id,email,password_hash,role,credits,used_credits)
     values($1,$2,$3,'admin',0,0)
     on conflict (email) do nothing`,
    [id, email, hash]
  );
}

export async function createUser(email: string, password: string) {
  const id = crypto.randomUUID();
  const hash = bcrypt.hashSync(password, 10);

  try {
    const { rows } = await pool.query(
      `insert into users(id,email,password_hash,role,credits,used_credits)
 values($1,$2,$3,'user',10,0)
 returning id, email, role, credits, used_credits`,
      [id, email, hash]
    );

    const u = rows[0];
    return { ok: true as const, userId: id, user: mapUser(u) };
  } catch (e: any) {
    if (String(e?.code) === "23505") {
      return { ok: false as const, message: "EMAIL ALREADY REGISTERED." };
    }
    return { ok: false as const, message: "SERVER ERROR." };
  }
}

export async function verifyLogin(email: string, password: string) {
  const { rows } = await pool.query(
    `select id, email, password_hash, role, credits, used_credits
     from users where lower(email)=lower($1) limit 1`,
    [email]
  );
  if (!rows.length) return { ok: false as const, message: "USER NOT FOUND." };

  const u = rows[0];
  const ok = bcrypt.compareSync(password, u.password_hash);
  if (!ok) return { ok: false as const, message: "INVALID PASSWORD." };

  return { ok: true as const, userId: u.id as string, user: mapUser(u) };
}

export async function createSession(userId: string) {
  const token = makeToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

  await pool.query(
    `insert into sessions(token,user_id,expires_at) values($1,$2,$3)`,
    [token, userId, expiresAt]
  );

  return token;
}

export async function destroySession(token: string) {
  await pool.query(`delete from sessions where token=$1`, [token]);
}

export async function getUserByToken(token: string): Promise<PublicUser | null> {
  const { rows } = await pool.query(
    `select u.id, u.email, u.role, u.credits, u.used_credits
     from sessions s
     join users u on u.id = s.user_id
     where s.token=$1 and s.expires_at > now()
     limit 1`,
    [token]
  );
  if (!rows.length) return null;
  return mapUser(rows[0]);
}

function mapUser(row: any): PublicUser {
  return {
    id: String(row.id),
    email: row.email,
    role: row.role,
    credits: Number(row.credits ?? 0),
    usedCredits: Number(row.used_credits ?? 0),
  };
}
