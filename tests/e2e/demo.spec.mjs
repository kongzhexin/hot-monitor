import { test, expect } from "@playwright/test";

test("首页加载并显示品牌标题和健康信息", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/剑来热榜司/);
  await expect(page.locator("h1")).toHaveText("剑来热榜司");
  await expect(page.locator("button[type=submit]")).toHaveText("新增规则");
  await expect(page.locator("#health .pill").first()).toContainText("服务时间");
});

test("通过表单创建规则并切换启用状态", async ({ page }) => {
  const ruleName = `E2E 演示规则 ${Date.now()}`;

  await page.goto("/");

  await page.fill("#name", ruleName);
  await page.selectOption("#type", "topic");
  await page.fill("#query", "playwright demo test");
  await page.selectOption("#priority", "high");

  const [dialog] = await Promise.all([
    page.waitForEvent("dialog"),
    page.click("button[type=submit]"),
  ]);
  await expect(dialog.message()).toContain("规则已创建");
  await dialog.accept();

  const ruleCard = page.locator("#ruleList article", { hasText: ruleName });
  await expect(ruleCard).toBeVisible();
  const toggleBtn = ruleCard.locator("button.toggleBtn");
  await expect(toggleBtn).toHaveText("禁用");

  await toggleBtn.click();
  await expect(toggleBtn).toHaveText("启用");

  await toggleBtn.click();
  await expect(toggleBtn).toHaveText("禁用");
});
