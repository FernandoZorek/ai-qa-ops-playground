import { execSync } from 'child_process';
import fs from 'fs';
import { DiscoveryAgent } from './agents/DiscoveryAgent';
import { HealerAgent } from './agents/HealerAgent';
import { waitForApp } from './utils/wait-for-app';
import { ScenarioManager } from './core/ScenarioManager';
import dotenv from 'dotenv';
import { Logger } from './core/Logger';

dotenv.config();

Logger.init();

async function main() {
  const scenario = process.argv[2];
  const appUrl = process.env.APP_URL || 'http://sut-app:3000';

  if (!scenario) {
    Logger.info('AI Test Pipeline');
    ScenarioManager.printAvailableScenarios();
    process.exit(0);
  }

  try {
    Logger.section(`Starting AI Pipeline for: [${scenario}]`);
    await waitForApp(appUrl);

    const context = ScenarioManager.findScenarioContext(scenario);
    if (!context) {
      Logger.warn(`Cenário '${scenario}' não encontrado em src/prompts/scenarios/`);
      Logger.warn('Verificando se já existe um teste gerado anteriormente...');
    }

    let testFile = ScenarioManager.getTestOutputPath(scenario, context || undefined);

    if (!fs.existsSync(testFile)) {
      Logger.info(`Test not found. Generating fresh test for [${scenario}]...`);
      const discoverer = new DiscoveryAgent();
      const discoveryResult = await discoverer.run(scenario, appUrl);

      if (!discoveryResult.isValid) {
        Logger.warn(`Initial generation failed. Passing directly to HealerAgent...`);
        const healer = new HealerAgent();
        
        const success = await healer.healFromCode(
          discoveryResult.code, 
          scenario, 
          appUrl,
          discoveryResult.context,
          discoveryResult.error || 'Unknown validation error'
        );

        if (!success) {
          Logger.error(`Self-healing failed after ${process.env.HEALER_MAX_RETRIES || 3} attempts.`);
          process.exit(1);
        }
        
        testFile = ScenarioManager.getTestOutputPath(scenario, discoveryResult.context);
        Logger.info(`Test healed and saved to: ${testFile}`);
      } else {
        Logger.info(`Test generated and saved to: ${testFile}`);
      }
    } else {
      Logger.info(`Using existing test: [${context || 'general'}] ${scenario}.spec.ts`);
    }

    try {
      Logger.section(`Running Playwright test: ${scenario}...`);
      execSync(`npx playwright test "${testFile}" --reporter=list`, { 
        stdio: 'inherit',
        env: { ...process.env, FORCE_COLOR: 'true' }
      });
      Logger.section(`Success! Test [${scenario}] passed.\n`);
      
    } catch (testError: any) {
      Logger.warn(`Test failed. Initializing Self-Healing with Memory...`);
      
      const healer = new HealerAgent();
      const success = await healer.heal(testFile, scenario, appUrl);

      if (success) {
        Logger.info(`Self-healing successful after retries!\n`);
      } else {
        Logger.error(`Self-healing failed after ${process.env.HEALER_MAX_RETRIES || 3} attempts.`);
        process.exit(1);
      }
    }

  } catch (error: any) {
    Logger.error(`Pipeline failed for [${scenario}]: ${error.message}\n`);
    process.exit(1);
  }
}

main();