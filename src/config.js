import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 3000),
  openRouterApiKey: process.env.OPENROUTER_API_KEY || "",
  openRouterModel: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
  openRouterBaseUrl:
    process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
  alertWebhookUrl: process.env.ALERT_WEBHOOK_URL || "",
  scanIntervalSeconds: Number(process.env.SCAN_INTERVAL_SECONDS || 300),
};
