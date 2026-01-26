import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: '.',
  testMatch: '{{TEST_FILE_PATH}}',
  
  fullyParallel: true,
  reporter: [['line']],
  
  use: {
    baseURL: process.env.APP_URL || 'http://localhost:3000',
    screenshot: 'off',
    video: 'off',
    trace: 'off',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...require('@playwright/test').devices['Desktop Chrome'] },
    },
  ],
  
  timeout: 30000,
});