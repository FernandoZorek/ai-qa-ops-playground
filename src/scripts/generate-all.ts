import fs from 'fs';
import path from 'path';
import { DiscoveryAgent } from '../agents/DiscoveryAgent';

async function generateAll() {
  const scenarioDir = path.join(__dirname, '../prompts/scenarios');
  const scenarios = fs.readdirSync(scenarioDir)
    .filter(file => file.endsWith('.txt'))
    .map(file => file.replace('.txt', ''));

  console.log(`📂 Found ${scenarios.length} scenarios. Starting bulk generation...`);

  const agent = new DiscoveryAgent();
  const appUrl = process.env.APP_URL || 'http://sut-app:3000';

  for (const scenario of scenarios) {
    try {
      console.log(`\n🤖 Generating: ${scenario}...`);
      await agent.run(scenario, appUrl);
      console.log(`✅ ${scenario} created.`);
    } catch (err: any) {
      console.error(`❌ Failed ${scenario}:`, err.message);
    }
  }
}

generateAll();