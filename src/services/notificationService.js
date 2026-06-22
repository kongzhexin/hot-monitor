import { config } from "../config.js";
import { saveNotification } from "../db/repository.js";

export async function sendNotification(payload) {
  await saveNotification(payload);

  if (!config.alertWebhookUrl) {
    return;
  }

  try {
    await fetch(config.alertWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // Non-blocking webhook failures.
  }
}
