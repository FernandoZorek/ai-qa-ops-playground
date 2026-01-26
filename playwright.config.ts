import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const testsDirectory = process.env.TESTS_PATH || 'tests';

export default defineConfig({
  testDir: path.join(__dirname, testsDirectory),
  testMatch: ['**/*.spec.ts', '**/*.temp.spec.ts'],

  fullyParallel: true,
  reporter: [
    ['list'], 
    ['json', { outputFile: 'test-results/report.json' }]
  ],
  
  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
    baseURL: process.env.APP_URL || 'http://localhost:3000',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});