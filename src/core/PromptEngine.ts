// src/core/PromptEngine.ts
import fs from 'fs';
import path from 'path';
import { ScenarioManager } from './ScenarioManager';

export class PromptEngine {
  private static getFile(filePath: string): string {
    return fs.readFileSync(path.join(__dirname, filePath), 'utf-8');
  }

  /**
   * Carrega o conteúdo do cenário (lida com subpastas automaticamente)
   */
  private static loadScenarioContent(scenarioName: string): string {
    const scenarioInfo = ScenarioManager.findScenario(scenarioName);
    
    if (!scenarioInfo) {
      console.warn(`⚠️ Cenário '${scenarioName}' não encontrado. Usando cenário genérico.`);
      return `Test scenario: ${scenarioName}\nPlease generate a Playwright test for this functionality.`;
    }

    try {
      return fs.readFileSync(scenarioInfo.filePath, 'utf-8');
    } catch (error) {
      console.error(`❌ Erro ao ler cenário ${scenarioInfo.filePath}:`, error);
      throw error;
    }
  }

  static buildTestPrompt(scenarioName: string, pageData: any): string {
    const template = this.getFile('../prompts/templates/discovery-template.txt');
    const base = this.getFile('../prompts/templates/base-prompt.txt');
    const guidelines = this.getFile('../prompts/templates/guidelines.txt');
    const scenario = this.loadScenarioContent(scenarioName);

    return template
      .replace('{{BASE_PROMPT}}', base)
      .replace('{{INTENT}}', scenario)
      .replace('{{GUIDELINES}}', guidelines)
      .replace('{{HTML}}', JSON.stringify(pageData))
      .trim();
  }

  static buildHealPrompt(scenarioName: string, html: string, oldCode: string, history: string[]): string {
    const template = this.getFile('../prompts/templates/heal-template.txt');
    const guidelines = this.getFile('../prompts/templates/guidelines.txt');
    const scenario = this.loadScenarioContent(scenarioName);

    const historyText = history.length > 0 
      ? history.join('\n') 
      : 'No previous attempts failed yet.';

    return template
      .replace('{{INTENT}}', scenario)
      .replace('{{OLD_CODE}}', oldCode)
      .replace('{{HISTORY}}', historyText)
      .replace('{{HTML}}', html)
      .replace('{{GUIDELINES}}', guidelines)
      .trim();
  }

  /**
   * ✅ FORÇA estrutura mínima de teste se o código não tiver
   */
  static ensureTestStructure(code: string, scenarioName: string): string {
    // Remove comentários e espaços extras para análise
    const clean = code.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '').trim();
    
    // Verifica se tem estrutura mínima
    const hasImport = /import\s+.*['"]@playwright\/test['"]/.test(clean);
    const hasTestBlock = /test\(\s*['"`]/.test(clean) || /test\.describe\(/.test(clean);
    
    if (hasImport && hasTestBlock) {
      return code; // Já está correto
    }
    
    // ✅ ADICIONA estrutura mínima automaticamente
    console.warn(`⚠️ Code missing test structure. Adding minimal wrapper...`);
    
    return `import { test, expect } from '@playwright/test';

test('${scenarioName} test', async ({ page }) => {
  ${code.split('\n').map(line => `  ${line}`).join('\n')}
});
`;
  }
}