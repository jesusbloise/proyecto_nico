import crypto from "crypto";
import type { Role } from "./storage.js";

type Session = {
  token: string;
  userId: string;
  email: string;
  role: Role;
  createdAt: number;
};

const sessions = new Map<string, Session>();

export function createSession(payload: Omit<Session, "createdAt">) {
  const token = payload.token;
  sessions.set(token, { ...payload, createdAt: Date.now() });
  return token;
}

export function makeToken() {
  return crypto.randomBytes(24).toString("hex");
}

export function getSession(token: string) {
  return sessions.get(token) ?? null;
}

export function destroySession(token: string) {
  sessions.delete(token);
}
