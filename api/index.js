import { app } from "../src/app.js";
import { initDatabase } from "../src/db/repository.js";

let initialized = false;

async function ensureInitialized() {
  if (initialized) {
    return;
  }
  await initDatabase();
  initialized = true;
}

export default async function handler(req, res) {
  try {
    await ensureInitialized();
    return app(req, res);
  } catch (error) {
    console.error("[api] init error", error);
    res.status(500).json({ error: "Server initialization failed" });
  }
}
