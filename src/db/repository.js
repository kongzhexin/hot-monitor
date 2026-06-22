import { prisma } from "./client.js";

const DEFAULT_RULES = [
  {
    id: "rule-model-updates",
    name: "大模型更新监控",
    type: "keyword",
    query: "OpenAI Claude Gemini Llama model release",
    priority: "high",
  },
  {
    id: "rule-ai-programming",
    name: "AI 编程范围发现",
    type: "topic",
    query: "AI programming coding agent copilot cursor",
    priority: "normal",
  },
];

function toIso(value) {
  return value instanceof Date ? value.toISOString() : value;
}

function mapRule(rule) {
  return {
    ...rule,
    createdAt: toIso(rule.createdAt),
    updatedAt: toIso(rule.updatedAt),
  };
}

function mapHotspot(item) {
  let ai = {};
  try {
    ai = JSON.parse(item.aiJson || "{}");
  } catch {
    ai = {};
  }

  return {
    id: item.id,
    ruleId: item.ruleId,
    ruleName: item.ruleName,
    type: item.type,
    query: item.query,
    title: item.title,
    summary: item.summary,
    link: item.link,
    source: item.source,
    publishedAt: toIso(item.publishedAt),
    scannedAt: toIso(item.scannedAt),
    ai,
    score: item.score,
  };
}

function mapNotification(item) {
  return {
    ...item,
    createdAt: toIso(item.createdAt),
  };
}

export async function initDatabase() {
  const count = await prisma.rule.count();
  if (count > 0) {
    return;
  }

  const now = new Date();
  await prisma.rule.createMany({
    data: DEFAULT_RULES.map((rule) => ({
      ...rule,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    })),
  });
}

export async function listRules() {
  const rows = await prisma.rule.findMany({ orderBy: { updatedAt: "desc" } });
  return rows.map(mapRule);
}

export async function listEnabledRules() {
  const rows = await prisma.rule.findMany({
    where: { enabled: true },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(mapRule);
}

export async function createRule(input) {
  const timestamp = new Date();
  const row = await prisma.rule.create({
    data: {
      id: `rule-${Math.random().toString(36).slice(2, 10)}`,
      name: input.name,
      type: input.type,
      query: input.query,
      priority: input.priority || "normal",
      enabled: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  });

  return mapRule(row);
}

export async function patchRule(id, patch) {
  const row = await prisma.rule.findUnique({ where: { id } });
  if (!row) {
    return null;
  }

  const next = await prisma.rule.update({
    where: { id },
    data: {
      name: patch.name ?? row.name,
      type: patch.type ?? row.type,
      query: patch.query ?? row.query,
      priority: patch.priority ?? row.priority,
      enabled: patch.enabled ?? row.enabled,
      updatedAt: new Date(),
    },
  });

  return mapRule(next);
}

export async function listHotspots(limit = 200) {
  const rows = await prisma.hotspot.findMany({
    orderBy: { scannedAt: "desc" },
    take: limit,
  });
  return rows.map(mapHotspot);
}

export async function saveHotspot(event) {
  const row = await prisma.hotspot.upsert({
    where: { id: event.id },
    create: {
      id: event.id,
      ruleId: event.ruleId,
      ruleName: event.ruleName,
      type: event.type,
      query: event.query,
      title: event.title,
      summary: event.summary,
      link: event.link,
      source: event.source,
      publishedAt: new Date(event.publishedAt),
      scannedAt: new Date(event.scannedAt),
      aiJson: JSON.stringify(event.ai),
      score: event.score,
    },
    update: {
      scannedAt: new Date(event.scannedAt),
      aiJson: JSON.stringify(event.ai),
      score: event.score,
      summary: event.summary,
    },
  });

  return mapHotspot(row);
}

export async function listNotifications(limit = 200) {
  const rows = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(mapNotification);
}

export async function saveNotification(item) {
  const row = await prisma.notification.upsert({
    where: { id: item.id },
    create: {
      id: item.id,
      title: item.title,
      message: item.message,
      source: item.source,
      score: item.score,
      reason: item.reason,
      link: item.link,
      createdAt: new Date(item.createdAt),
    },
    update: {
      message: item.message,
      score: item.score,
      reason: item.reason,
      createdAt: new Date(item.createdAt),
    },
  });

  return mapNotification(row);
}

export async function isSeen(ruleId, link) {
  const row = await prisma.seenLink.findUnique({
    where: {
      ruleId_link: {
        ruleId,
        link,
      },
    },
  });

  return Boolean(row);
}

export async function markSeen(ruleId, link) {
  try {
    await prisma.seenLink.create({
      data: {
        ruleId,
        link,
      },
    });
  } catch {
    // Ignore duplicate seen records.
  }
}
