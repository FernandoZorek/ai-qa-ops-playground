import { test, expect } from "@playwright/test";

test("Navigate to Sales Reports, download JSON data, and validate response", async ({ page }) => {
  await page.goto(process.env.APP_URL);

  // Exploration: Navigate to Sales Reports
  await page.click("text=Sales Reports");

  // Interaction: Download JSON Data
  await page.waitForSelector("text=Download JSON Data");
  await page.click("text=Download JSON Data");

  // Data Validation
  const jsonData = await page.innerText("#json-output");
  const data = JSON.parse(jsonData);

  expect(data.status).toBe("success");
  expect(data.data).not.toBe(undefined);
  expect(data.data.total || data.data.amount).toMatch(/^-?\d+(\.\d+)?$/);
});