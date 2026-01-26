import { test, expect } from '@playwright/test';

test('Delete user John Doe', async ({ page }) => {
  // Navigate to the application
  await page.goto(process.env.APP_URL);

  // Click on 'User Management' in the sidebar
  await page.click('text=👥 User Management');

  // Wait for the user table to load
  await page.waitForSelector('table');

  // Locate the user 'John Doe' in the table
  const userRow = await page.locator('tr:has-text("John Doe")');
  await expect(userRow).toBeVisible();

  // Set up dialog handler before clicking the delete button
  page.once('dialog', async dialog => {
    expect(dialog.message()).toBe('User Deleted');
    await dialog.accept();
  });

  // Click the 'Delete' button associated with 'John Doe'
  const deleteButton = userRow.locator('button:text("Delete")');
  await deleteButton.click();
});