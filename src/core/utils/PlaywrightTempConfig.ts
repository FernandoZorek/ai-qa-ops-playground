// src/core/utils/PlaywrightTempConfig.ts
import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

export function createTempConfig(testFile: string) {
  return defineConfig({
    testDir: '.',
    testMatch: testFile,
    
    fullyParallel: true,
    reporter: [['line']],
    
    use: {
      baseURL: process.env.APP_URL || 'http://localhost:3000',
    },

    projects: [
      {
        name: 'chromium',
        use: { 
          ...require('@playwright/test').devices['Desktop Chrome'],
          headless: true 
        },
      },
    ],
    
    timeout: 30000,
  });
}