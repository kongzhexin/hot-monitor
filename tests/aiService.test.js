import test from "node:test";
import assert from "node:assert/strict";
import { heuristicEvaluate } from "../src/services/aiService.js";

test("heuristicEvaluate returns bounded scores", () => {
  const rule = { query: "openai model release", priority: "high" };
  const candidate = {
    title: "OpenAI model release",
    summary: "New model is available for api users",
    link: "https://example.com",
  };

  const result = heuristicEvaluate(rule, candidate);
  assert.ok(result.relevance_score >= 0 && result.relevance_score <= 1);
  assert.ok(result.authenticity_score >= 0 && result.authenticity_score <= 1);
  assert.ok(result.matched_entities.includes("openai"));
});
