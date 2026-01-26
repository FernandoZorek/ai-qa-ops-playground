import fs from 'fs';
import path from 'path';
import { LLMFactory } from '../core/llm/LLMFactory';
import { PromptEngine } from '../core/PromptEngine';
import { AgentUtils } from '../core/utils/AgentUtils';
import { chromium } from 'playwright';
import { ScenarioManager } from '../core/ScenarioManager';
import { Logger } from '../core/Logger';

export class HealerAgent {
  private llm = LLMFactory.create();
  private maxRetries = parseInt(process.env.HEALER_MAX_RETRIES || '3', 10);

  async heal(testPath: string, scenarioName: string, url: string): Promise<boolean> {
    const failureHistory: string[] = [];
    const tempTestPath = this.getTempTestPath(scenarioName);
    let attempts = 0;

    while (attempts < this.maxRetries) {
      attempts++;
      Logger.info(`[Attempt ${attempts}] Trying to heal: ${scenarioName}`);

      const browser = await chromium.launch({ 
        headless: true, 
        args: ['--no-sandbox', '--disable-dev-shm-usage', '--single-process'] 
      });
      const page = await browser.newPage();
      
      try {
        await page.goto(url);
        const currentHtml = await page.content();
        await browser.close();

        const baseCode = fs.existsSync(tempTestPath) 
          ? fs.readFileSync(tempTestPath, 'utf-8') 
          : fs.readFileSync(testPath, 'utf-8');

        const prompt = PromptEngine.buildHealPrompt(scenarioName, currentHtml, baseCode, failureHistory);
        const response = await this.llm.generate({ prompt });
        
        const cleanCode = AgentUtils.processAIResponse(response, scenarioName, `HEAL_ATTEMPT_${attempts}`);
        fs.writeFileSync(tempTestPath, cleanCode.trim());

        try {
          await this.validateWithTempConfig(tempTestPath, scenarioName);
          
          fs.renameSync(tempTestPath, testPath);
          Logger.info(`Success! Healed on attempt ${attempts}`);
          return true; 

        } catch (testError: any) {
          const fullErrorOutput = testError.stdout?.toString() || testError.message;
          const relevantError = fullErrorOutput.split('FAILED').pop() || fullErrorOutput;
          
          Logger.warn(`Attempt ${attempts} failed. Error captured for AI.`);
          failureHistory.push(`Attempt ${attempts} failed with error: ${relevantError.trim()}`);
        }

      } catch (err: any) {
        if (browser) await browser.close();
        failureHistory.push(`System error: ${err.message}`);
      }
    }

    if (fs.existsSync(tempTestPath)) fs.unlinkSync(tempTestPath);
    return false;
  }

  async healFromCode(
    initialCode: string, 
    scenarioName: string, 
    url: string,
    context: string,
    initialError?: string
  ): Promise<boolean> {
    const failureHistory: string[] = [];
    const finalTestPath = ScenarioManager.getTestOutputPath(scenarioName, context);
    
    if (initialError) {
      failureHistory.push(`Initial generation failed: ${initialError}`);
    }

    let attempts = 0;
    let currentCode = initialCode;

    while (attempts < this.maxRetries) {
      attempts++;
      Logger.info(`[Attempt ${attempts}/${this.maxRetries}] Healing generated test: [${context}] ${scenarioName}`);

      const browser = await chromium.launch({ 
        headless: true, 
        args: ['--no-sandbox', '--disable-dev-shm-usage', '--single-process'] 
      });
      const page = await browser.newPage();
      
      try {
        await page.goto(url);
        const currentHtml = await page.content();
        await browser.close();

        const prompt = PromptEngine.buildHealPrompt(scenarioName, currentHtml, currentCode, failureHistory);
        const response = await this.llm.generate({ prompt });
        
        currentCode = AgentUtils.processAIResponse(response, scenarioName, `HEAL_ATTEMPT_${attempts}`);
        
        Logger.debug(`Code length: ${currentCode.length} characters`);
        Logger.debug(`Has 'import': ${currentCode.includes('import')}`);
        Logger.debug(`Has 'test(': ${currentCode.includes('test(')}`);
        Logger.debug(`Has 'expect': ${currentCode.includes('expect')}`);
        Logger.verbose(`\n--- CODE START ---\n${currentCode}\n--- CODE END ---\n`);

        const validation = await this.validateCodeInMemory(currentCode, scenarioName);
        
        if (validation.isValid) {
          fs.writeFileSync(finalTestPath, currentCode.trim());
          Logger.info(`Success! Healed and saved on attempt ${attempts}`);
          return true;
        } else {
          Logger.warn(`Attempt ${attempts} failed validation.`);
          Logger.warn(`Error: ${validation.error || 'Unknown error'}`);
          Logger.warn(`Retrying...\n`);
        }

      } catch (err: any) {
        if (browser) await browser.close();
        Logger.error(`System error: ${err.message}`);
        failureHistory.push(`System error: ${err.message}`);
      }
    }

    Logger.error(`All ${this.maxRetries} attempts failed.\n`);
    return false;
  }

  private getTempTestPath(scenarioName: string): string {
    const TESTS_BASE_PATH = process.env.TESTS_PATH || 'tests';
    return path.resolve(process.cwd(), TESTS_BASE_PATH, `${scenarioName}.temp.spec.ts`);
  }

  private async validateCodeInMemory(code: string, scenarioName: string): Promise<{ isValid: boolean; error?: string }> {
    const tempDir = path.join(process.cwd(), '.playwright-staging');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    
    const tempFile = path.join(tempDir, `${scenarioName}.validate.spec.ts`);
    const tempConfigFile = path.join(tempDir, `playwright.config.validate.${scenarioName}.ts`);

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
      execSync(`npx playwright test --config="${tempConfigFile}"`, {
        stdio: 'pipe',
        cwd: process.cwd(),
        env: { ...process.env, FORCE_COLOR: 'false' }
      });
      
      return { isValid: true };
    } catch (error: any) {
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

      Logger.warn(`--- VALIDATION ERROR ---`);
      Logger.warn(errorOutput);
      Logger.warn(`--- END ERROR ---\n`);

      return { isValid: false, error: errorOutput.trim() };
    } finally {
      if (fs.existsSync(tempFile)) {
        try { fs.unlinkSync(tempFile); } catch (e) {  }
      }
      if (fs.existsSync(tempConfigFile)) {
        try { fs.unlinkSync(tempConfigFile); } catch (e) {  }
      }
    }
  }

  private async validateWithTempConfig(testFile: string, scenarioName: string): Promise<void> {
    const tempDir = path.join(process.cwd(), '.playwright-staging');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    
    const tempConfigFile = path.join(tempDir, `playwright.config.${scenarioName}.ts`);

    const templatePath = path.join(__dirname, '../core/utils/playwright.temp.config.template.ts');
    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    
    const configContent = templateContent.replace(
      '{{TEST_FILE_PATH}}',
      testFile.replace(/\\/g, '\\\\')
    );
    
    fs.writeFileSync(tempConfigFile, configContent);

    const testCode = fs.readFileSync(testFile, 'utf-8');
    const sanitizedCode = AgentUtils.sanitizeForValidation(testCode);
    fs.writeFileSync(testFile, sanitizedCode);

    try {
      const { execSync } = require('child_process');
      
      execSync(`npx playwright test --config="${tempConfigFile}"`, {
        stdio: 'pipe',
        cwd: process.cwd(),
        env: { ...process.env, FORCE_COLOR: 'false' }
      });
    } catch (error: any) {
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

      if (errorOutput.includes('No tests found')) {
        Logger.error(`CRITICAL: Test file has no valid test structure!`);
        Logger.error(`File: ${testFile}`);
        Logger.error(`Content:`);
        Logger.error(fs.readFileSync(testFile, 'utf-8'));
      }

      throw new Error(errorOutput.trim());
    } finally {
      if (fs.existsSync(tempConfigFile)) {
        try { fs.unlinkSync(tempConfigFile); } catch (e) {  }
      }
    }
  }
}