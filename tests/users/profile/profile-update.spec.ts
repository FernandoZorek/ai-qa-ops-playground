import { test, expect } from '@playwright/test';

test('Profile settings update', async ({ page }) => {
  // Navigate to the application
  await page.goto(process.env.APP_URL);

  // Navigate to 'Profile Settings' via the sidebar
  await page.click('text=⚙️ Profile');

  // Change the 'Display Name' input
  await page.fill('#user-name', 'AI Tester Pro');

  // Click the 'Save Changes' button
  await page.click('#save-profile');

  // Wait for the button to finish the 'Saving...' state
  await page.waitForFunction(() => {
    const button = document.querySelector('#save-profile');
    return button && button.innerText === 'Save';
  });

  // Verify the success message
  await expect(page.locator('#save-status')).toBeVisible();
});