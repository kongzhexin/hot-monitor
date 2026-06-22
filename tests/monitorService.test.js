import test from "node:test";
import assert from "node:assert/strict";
import { summarizeFromEvents } from "../src/services/monitorService.js";

test("summarizeTrends aggregates by ruleName", () => {
  const trends = summarizeFromEvents([
    { ruleName: "AI 编程范围发现", score: 0.6 },
    { ruleName: "AI 编程范围发现", score: 0.8 },
    { ruleName: "大模型更新监控", score: 0.9 },
  ]);

  assert.equal(trends[0].topic, "AI 编程范围发现");
  assert.equal(trends[0].count, 2);
  assert.equal(trends[0].avgScore, 0.7);
});
