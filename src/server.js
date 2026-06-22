import { app } from "./app.js";
import { config } from "./config.js";
import { initDatabase } from "./db/repository.js";
import { runScan } from "./services/monitorService.js";

let timer;

function setupScanTimer() {
  if (!config.enableInternalTimer) {
    console.log("[info] Internal timer disabled (Vercel environment detected)");
    console.log(
      "[info] Use /api/scan endpoint or Vercel cron to trigger scans",
    );
    return;
  }

  timer = setInterval(async () => {
    try {
      const output = await runScan();
      console.log(`[scan] new=${output.newEvents} at ${output.scannedAt}`);
    } catch (error) {
      console.error("[scan] failed", error.message);
    }
  }, config.scanIntervalSeconds * 1000);
}

async function bootstrap() {
  console.log(`hot-monitor running at http://localhost:${config.port}`);
  await initDatabase();
  setupScanTimer();
  try {
    await runScan();
  } catch {
    // Ignore bootstrap scan failure.
  }
}

if (!config.isVercel) {
  app.listen(config.port, () => {
    bootstrap().catch((error) => {
      console.error("[startup] bootstrap failed", error);
    });
  });
}

process.on("SIGINT", () => {
  if (timer) {
    clearInterval(timer);
  }
  process.exit(0);
});

export default app;
