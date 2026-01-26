import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { PromptEngine } from '../core/PromptEngine';
import { LLMFactory } from '../core/llm/LLMFactory';
import { AgentUtils } from '../core/utils/AgentUtils';
import { ScenarioManager } from '../core/ScenarioManager';
import { Logger } from '../core/Logger';

export class DiscoveryAgent {
  private llm = LLMFactory.create();

  async run(
    scenarioName: string, 
    targetUrl: string
  ): Promise<{ 
    code: string; 
    isValid: boolean; 
    error?: string;
    context: string;
  }> {
    const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    Logger.info(`Navigating to ${targetUrl}...`);
    await page.goto(targetUrl, { waitUntil: 'networkidle' });
    const pageData = await page.content();
    await browser.close();

    const fullPrompt = PromptEngine.buildTestPrompt(scenarioName, pageData);
    Logger.info(`AI is generating initial test for: ${scenarioName}...`);
    
    const response = await this.llm.generate({ prompt: fullPrompt });
    
    const cleanCode = AgentUtils.processAIResponse(response, scenarioName, 'DISCOVERY');

    const context = ScenarioManager.findScenarioContext(scenarioName) || 'general';

    const validation = await this.validateInMemory(cleanCode, scenarioName);
    
    if (validation.isValid) {
      const finalFilePath = ScenarioManager.getTestOutputPath(scenarioName, context);
      fs.writeFileSync(finalFilePath, cleanCode);
      Logger.info(`Success! Fresh test saved: [${context}] ${scenarioName}.spec.ts`);
    } else {
      Logger.warn(`Discovery validation failed.`);
      Logger.warn(`Error: ${validation.error || 'Unknown error'}`);
      Logger.warn(`Passing code directly to HealerAgent...\n`);
    }

    return { 
      code: cleanCode, 
      isValid: validation.isValid,
      error: validation.error,
      context
    };
  }

  private async validateInMemory(code: string, scenarioName: string): Promise<{ isValid: boolean; error?: string }> {
    const tempDir = path.join(process.cwd(), '.playwright-staging');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    
    const tempFile = path.join(tempDir, `${scenarioName}.staging.spec.ts`);
    const tempConfigFile = path.join(tempDir, `playwright.config.${scenarioName}.ts`);

    Logger.debug(`VALIDATION DEBUG - Generated Code:`);
    Logger.debug(`Code length: ${code.length} characters`);
    Logger.debug(`Has 'import': ${code.includes('import')}`);
    Logger.debug(`Has 'test(': ${code.includes('test(')}`);
    Logger.debug(`Has 'expect': ${code.includes('expect')}`);
    Logger.verbose(`\n--- CODE START ---\n${code}\n--- CODE END ---\n`);

    try {
      const sanitizedCode = AgentUtils.sanitizeForValidation(code);
      
      fs.writeFileSync(tempFile, sanitizedCode);

      const templatePath = path.join(__dirname, '../core/utils/playwright.temp.config.template.ts');
      const templateContent = fs.readFileSync(templatePath, 'utf-8');
      
      const configContent = templateContent.replace(
        '{{TEST_FILE_PATH}}',
        tempFile.replace(/\\/g, '\\\\')
      );
      
      fs.writeFileSync(tempConfigFile, configContent);

      const { execSync } = require('child_process');
      
      Logger.debug(`Executing validation...\n`);
      
      execSync(`npx playwright test --config="${tempConfigFile}"`, {
        stdio: 'pipe',
        cwd: process.cwd(),
        env: { ...process.env, FORCE_COLOR: 'false' }
      });
      
      Logger.info(`Validation PASSED!\n`);
      return { isValid: true };
    } catch (error: any) {
      Logger.error(`Validation FAILED!\n`);
      
      let errorOutput = '';
      
      if (error.stdout) {
        if (Buffer.isBuffer(error.stdout)) {
          errorOutput += error.stdout.toString('utf-8');
        } else {
          errorOutput += error.stdout;
        }
      }
      
      if (error.stderr) {
        if (Buffer.isBuffer(error.stderr)) {
          errorOutput += error.stderr.toString('utf-8');
        } else {
          errorOutput += error.stderr;
        }
      }
      
      if (!errorOutput && error.message) {
        errorOutput = error.message;
      }

      errorOutput = errorOutput.replace(/\x1b\[[0-9;]*m/g, '').replace(/\r/g, '');

      Logger.warn(`--- VALIDATION ERROR OUTPUT ---`);
      Logger.warn(errorOutput);
      Logger.warn(`--- END ERROR OUTPUT ---\n`);

      let relevantError = errorOutput;
      const failedTestMatch = errorOutput.match(/×\s+[^\n]+(?:\n\s+.*)+/);
      if (failedTestMatch) {
        relevantError = failedTestMatch[0];
      } else {
        const lines = errorOutput.split('\n').filter(line => line.trim() !== '');
        relevantError = lines.slice(-20).join('\n');
      }

      return { isValid: false, error: relevantError.trim() };
    } finally {
      if (fs.existsSync(tempFile)) {
        try { fs.unlinkSync(tempFile); } catch (e) {  }
      }
      if (fs.existsSync(tempConfigFile)) {
        try { fs.unlinkSync(tempConfigFile); } catch (e) {  }
      }
    }
  }
}