/**
 * Vercel Cron 端点
 * 用于在 Vercel 环境中定期触发扫描
 *
 * 配置方式：在 vercel.json 中配置 cron，例如：
 * "crons": [
 *   {
 *     "path": "/api/cron-scan",
 *     "schedule": "0 * * * *"  // 每小时的第 0 分钟运行
 *   }
 * ]
 */

import { runScan } from "../src/services/monitorService.js";
import { initDatabase } from "../src/db/repository.js";

export default async function handler(req, res) {
  // 验证请求来自 Vercel Cron
  if (req.headers["x-vercel-cron"] !== "true") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // 初始化数据库连接
    await initDatabase();

    // 执行扫描
    const result = await runScan();

    return res.status(200).json({
      ok: true,
      timestamp: new Date().toISOString(),
      result,
    });
  } catch (error) {
    console.error("[cron-scan] error:", error.message);
    return res.status(500).json({
      error: "Scan failed",
      message: error.message,
    });
  }
}
