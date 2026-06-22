import express from "express";
import cors from "cors";
import { config } from "./config.js";
import {
  createRule,
  listHotspots,
  listNotifications,
  listRules,
  patchRule,
} from "./db/repository.js";
import { evaluateCandidate } from "./services/aiService.js";
import { runScan, summarizeTrends } from "./services/monitorService.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    now: new Date().toISOString(),
    openRouterEnabled: Boolean(config.openRouterApiKey),
  });
});

app.get("/api/rules", async (_req, res) => {
  const rules = await listRules();
  res.json({ data: rules });
});

app.post("/api/rules", async (req, res) => {
  const { name, type, query, priority } = req.body || {};
  if (!name || !type || !query) {
    return res.status(400).json({ error: "name/type/query 必填" });
  }
  if (!["keyword", "topic"].includes(type)) {
    return res.status(400).json({ error: "type 仅支持 keyword/topic" });
  }
  const rule = await createRule({ name, type, query, priority });
  return res.status(201).json({ data: rule });
});

app.patch("/api/rules/:id", async (req, res) => {
  const rule = await patchRule(req.params.id, req.body || {});
  if (!rule) {
    return res.status(404).json({ error: "rule not found" });
  }
  return res.json({ data: rule });
});

app.get("/api/hotspots", async (_req, res) => {
  const hotspots = await listHotspots(200);
  res.json({ data: hotspots });
});

app.get("/api/trends", async (_req, res) => {
  const trends = await summarizeTrends();
  res.json({ data: trends });
});

app.get("/api/notifications", async (_req, res) => {
  const notifications = await listNotifications(200);
  res.json({ data: notifications });
});

app.post("/api/scan", async (_req, res) => {
  const result = await runScan();
  res.json({ data: result });
});

app.post("/api/skills/validate", async (req, res) => {
  const { payload, query } = req.body || {};
  if (!payload || !query) {
    return res.status(400).json({ error: "payload/query 必填" });
  }
  const ai = await evaluateCandidate(
    {
      id: "skill-validate",
      name: "Skill Validate",
      type: "keyword",
      query,
      priority: "high",
    },
    payload,
  );
  return res.json({ data: ai });
});

export { app };
