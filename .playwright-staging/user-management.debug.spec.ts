import { test, expect } from "@playwright/test";

test("Delete User", async ({ page }) => {
  await page.goto(process.env.APP_URL);

  await page.click("text=User Management");

  await page.waitForSelector("text=John Doe");

  const deleteButton = await page.waitForSelector("text=Delete");

  await deleteButton.click();

  const dialog = await page.waitForEvent('dialog');

  expect(dialog.type()).toBe('alert');

  await dialog.dismiss();
});