import { pool } from "../db.js";

export async function initDb() {
  await pool.query(`
    create table if not exists users (
      id text primary key,
      email text unique not null,
      password_hash text not null,
      role text not null default 'user',
      credits integer not null default 0,
      used_credits integer not null default 0,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  `);

  await pool.query(`
    create table if not exists sessions (
      token text primary key,
      user_id text not null references users(id) on delete cascade,
      expires_at timestamptz not null,
      created_at timestamptz not null default now()
    );
  `);

  await pool.query(`
    create index if not exists idx_sessions_user_id on sessions(user_id);
  `);

  await pool.query(`
    create index if not exists idx_sessions_expires_at on sessions(expires_at);
  `);

  console.log("[db] tables ready");
}