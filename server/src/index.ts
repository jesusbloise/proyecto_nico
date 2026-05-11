import "dotenv/config";
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.js";
import { adminRouter } from "./routes/admin.js";
import { namesRouter } from "./routes/names.js";
import { initDb } from "./lib/initDb.js";
import { ensureDefaultAdmin } from "./lib/authDb.js";

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/names", namesRouter);

const PORT = Number(process.env.PORT || 5179);

async function start() {
  await initDb();
  await ensureDefaultAdmin();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[server] listening on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("[server] failed to start", err);
  process.exit(1);
});