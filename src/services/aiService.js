import { config } from "../config.js";

function clamp(value) {
  return Number(Math.max(0, Math.min(1, value)).toFixed(2));
}

export function heuristicEvaluate(rule, candidate) {
  const text = `${candidate.title} ${candidate.summary}`.toLowerCase();
  const tokens = rule.query
    .split(/\s+/)
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
  const matched = tokens.filter((token) => text.includes(token));
  const coverage = tokens.length ? matched.length / tokens.length : 0;

  return {
    relevance_score: clamp(0.35 + coverage * 0.65),
    authenticity_score: clamp(
      candidate.link.startsWith("https://") ? 0.78 : 0.52,
    ),
    novelty_score: clamp(0.68),
    importance_score: clamp(rule.priority === "high" ? 0.82 : 0.66),
    noise_score: clamp(0.56 - coverage * 0.42),
    reasoning_summary: matched.length
      ? `命中关键词: ${matched.join(", ")}`
      : "范围探索结果，未命中明显关键词",
    matched_entities: matched,
  };
}

function parseJson(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < 0 || end <= start) {
    throw new Error("json not found");
  }
  return JSON.parse(text.slice(start, end + 1));
}

export async function evaluateCandidate(rule, candidate) {
  if (!config.openRouterApiKey) {
    return heuristicEvaluate(rule, candidate);
  }

  const body = {
    model: config.openRouterModel,
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "你是热点审核器。判断内容与规则是否真实相关，是否旧闻翻炒或蹭热点。仅返回 JSON，字段必须包含 relevance_score, authenticity_score, novelty_score, importance_score, noise_score, reasoning_summary, matched_entities。",
      },
      {
        role: "user",
        content: JSON.stringify({ rule, candidate }),
      },
    ],
  };

  try {
    const response = await fetch(
      `${config.openRouterBaseUrl}/chat/completions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.openRouterApiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "hot-monitor",
        },
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      throw new Error(`openrouter ${response.status}`);
    }

    const data = await response.json();
    const raw = data?.choices?.[0]?.message?.content || "{}";
    const parsed = parseJson(raw);

    return {
      relevance_score: clamp(Number(parsed.relevance_score ?? 0)),
      authenticity_score: clamp(Number(parsed.authenticity_score ?? 0)),
      novelty_score: clamp(Number(parsed.novelty_score ?? 0)),
      importance_score: clamp(Number(parsed.importance_score ?? 0)),
      noise_score: clamp(Number(parsed.noise_score ?? 1)),
      reasoning_summary: String(parsed.reasoning_summary ?? ""),
      matched_entities: Array.isArray(parsed.matched_entities)
        ? parsed.matched_entities
        : [],
    };
  } catch {
    return heuristicEvaluate(rule, candidate);
  }
}
