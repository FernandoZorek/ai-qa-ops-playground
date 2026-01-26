// src/utils/wait-for-app.ts
import axios from 'axios';

/**
 * Utility to ensure the SUT is up before starting agents
 */
export async function waitForApp(url: string, retries = 10) {
  for (let i = 0; i < retries; i++) {
    try {
      await axios.get(url);
      console.log('✅ App is up and running!');
      return;
    } catch (e) {
      console.log(`Waiting for app at ${url}... (${i + 1}/${retries})`);
      await new Promise(res => setTimeout(res, 2000));
    }
  }
  throw new Error('App failed to start in time.');
}