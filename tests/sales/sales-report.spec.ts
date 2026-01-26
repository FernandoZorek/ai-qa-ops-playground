import { test, expect } from '@playwright/test';

test('Sales Reports JSON Data Validation', async ({ page }) => {
  // Navigate to the application
  await page.goto(process.env.APP_URL);

  // Click on the 'Sales Reports' link in the navigation menu
  await page.click('text=📊 Sales Reports');

  // Wait for the reports page to load
  await page.waitForSelector('text=📊 Sales Reports', { state: 'visible' });

  // Click the 'Download JSON Data' button
  await page.click('text=Download JSON Data');

  // Wait for the JSON output to be visible
  const jsonOutput = await page.waitForSelector('#json-output', { state: 'visible' });

  // Capture and parse the JSON data
  const jsonData = await jsonOutput.textContent();
  const data = JSON.parse(jsonData);

  // Validate the JSON data
  expect(data.status).toBe('success');
  expect(data.data).toHaveProperty('currency');
  expect(typeof data.data.amount === 'number' || typeof data.data.total === 'number').toBe(true);
});