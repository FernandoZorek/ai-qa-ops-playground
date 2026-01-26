import { test, expect } from "@playwright/test";

test("Profile Settings Test", async ({ page }) => {
  await page.goto(process.env.APP_URL);

  // Exploration: Navigate to Profile Settings via the sidebar
  await page.click("text=⚙️ Profile");

  // Interaction: Change the Display Name input
  const displayNameInput = await page.$("input[placeholder='Zorek Master']");
  await displayNameInput.fill("AI Tester Pro");

  // Action: Click the Save Changes button
  const saveButton = await page.$("button:has-text('Save')");
  await saveButton.click();

  // Async Wait: Wait for the button to finish the 'Saving...' state
  await page.waitForSelector("text=Saving...");

  // Validation: Verify the success message becomes visible
  const successMessage = await page.waitForSelector("text=Profile updated successfully!");
  await expect(successMessage).toBeVisible();
});