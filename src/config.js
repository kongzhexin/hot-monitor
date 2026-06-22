import dotenv from "dotenv";

dotenv.config();

const isVercel = process.env.VERCEL === "1";
const isDevelopment = process.env.NODE_ENV !== "production";

export const config = {
  port: Number(process.env.PORT || 3000),
  openRouterApiKey: process.env.OPENROUTER_API_KEY || "",
  openRouterModel: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
  openRouterBaseUrl:
    process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
  alertWebhookUrl: process.env.ALERT_WEBHOOK_URL || "",
  scanIntervalSeconds: Number(process.env.SCAN_INTERVAL_SECONDS || 300),
  isVercel,
  isDevelopment,
  // 在 Vercel 环境中禁用内部定时器，使用 cron 代替
  enableInternalTimer: !isVercel || isDevelopment,
};
