import crypto from "crypto";
import { evaluateCandidate } from "./aiService.js";
import { fetchCandidates } from "./sourceService.js";
import {
  isSeen,
  listEnabledRules,
  listHotspots,
  markSeen,
  saveHotspot,
} from "../db/repository.js";
import { sendNotification } from "./notificationService.js";

function score(ai) {
  const value =
    ai.relevance_score * 0.35 +
    ai.authenticity_score * 0.25 +
    ai.novelty_score * 0.15 +
    ai.importance_score * 0.25 -
    ai.noise_score * 0.2;
  return Number(Math.max(0, Math.min(1, value)).toFixed(2));
}

function keywordHit(rule, candidate) {
  const text = `${candidate.title} ${candidate.summary}`.toLowerCase();
  return rule.query
    .split(/\s+/)
    .filter(Boolean)
    .some((token) => text.includes(token.toLowerCase()));
}

function shouldNotify(rule, event) {
  if (event.score < 0.55) {
    return false;
  }
  return rule.priority === "high" ? event.score >= 0.62 : event.score >= 0.7;
}

function buildEvent(rule, candidate, ai, scannedAt) {
  const id = crypto
    .createHash("sha1")
    .update(`${rule.id}|${candidate.link}`)
    .digest("hex")
    .slice(0, 16);

  return {
    id,
    ruleId: rule.id,
    ruleName: rule.name,
    type: rule.type,
    query: rule.query,
    title: candidate.title,
    summary: candidate.summary,
    link: candidate.link,
    source: candidate.source,
    publishedAt: candidate.publishedAt,
    scannedAt,
    ai,
    score: score(ai),
  };
}

export async function runScan() {
  const scannedAt = new Date().toISOString();
  const rules = await listEnabledRules();
  const candidates = await fetchCandidates();
  let newEvents = 0;

  for (const rule of rules) {
    for (const candidate of candidates) {
      if (!candidate.link) {
        continue;
      }

      if (await isSeen(rule.id, candidate.link)) {
        continue;
      }

      if (rule.type === "keyword" && !keywordHit(rule, candidate)) {
        continue;
      }

      const ai = await evaluateCandidate(rule, candidate);
      const event = buildEvent(rule, candidate, ai, scannedAt);
      await markSeen(rule.id, candidate.link);

      if (event.score < 0.45) {
        continue;
      }

      await saveHotspot(event);
      newEvents += 1;

      if (shouldNotify(rule, event)) {
        await sendNotification({
          id: `ntf-${event.id}`,
          title: `[${rule.priority.toUpperCase()}] ${event.title}`,
          message: event.summary.slice(0, 180),
          source: event.source,
          score: event.score,
          reason: event.ai.reasoning_summary,
          link: event.link,
          createdAt: scannedAt,
        });
      }
    }
  }

  return {
    scannedAt,
    candidates: candidates.length,
    activeRules: rules.length,
    newEvents,
  };
}

export async function summarizeTrends() {
  const hotspots = await listHotspots(150);
  return summarizeFromEvents(hotspots);
}

export function summarizeFromEvents(events) {
  const map = new Map();
  for (const item of events) {
    const prev = map.get(item.ruleName) || {
      topic: item.ruleName,
      count: 0,
      scoreSum: 0,
    };
    prev.count += 1;
    prev.scoreSum += item.score;
    map.set(item.ruleName, prev);
  }

  return Array.from(map.values())
    .map((item) => ({
      topic: item.topic,
      count: item.count,
      avgScore: Number((item.scoreSum / item.count).toFixed(2)),
    }))
    .sort((a, b) => b.count - a.count);
}
