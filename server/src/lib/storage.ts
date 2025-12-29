import fs from "fs";
import path from "path";

export type Role = "admin" | "user";

export type User = {
  id: string;
  email: string;
  passwordHash: string;
  role: Role;
  credits: number;
  usedCredits: number;
  createdAt: string;
  updatedAt: string;
};

const DATA_PATH = path.resolve(process.cwd(), "data", "users.json");

function ensureFile() {
  const dir = path.dirname(DATA_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_PATH)) fs.writeFileSync(DATA_PATH, JSON.stringify([]), "utf-8");
}

export function readUsers(): User[] {
  ensureFile();
  const raw = fs.readFileSync(DATA_PATH, "utf-8");
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? (parsed as User[]) : [];
}

export function writeUsers(users: User[]) {
  ensureFile();
  fs.writeFileSync(DATA_PATH, JSON.stringify(users, null, 2), "utf-8");
}
