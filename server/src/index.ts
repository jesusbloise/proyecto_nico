
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.js";
import { adminRouter } from "./routes/admin.js";
import { namesRouter } from "./routes/names.js";
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

console.log("[env-check]", {
  PGPASSWORD: process.env.PGPASSWORD,
  PGPASSWORD_type: typeof process.env.PGPASSWORD,
  DATABASE_URL: process.env.DATABASE_URL,
});



const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/names", namesRouter);

const PORT = Number(process.env.PORT || 5179);
app.listen(PORT, "0.0.0.0", () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});
