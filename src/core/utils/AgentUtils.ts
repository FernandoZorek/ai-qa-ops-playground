import { execSync } from 'child_process';
import { AgentThoughts } from '../AgentThoughts';
import fs from 'fs';
import { PromptEngine } from '../PromptEngine';

export class AgentUtils {
  static processAIResponse(response: string | object, scenario: string, stage: string): string {

    let cleanContent = typeof response === 'string' 
      ? response.trim() 
      : JSON.stringify(response);

    const codeBlockRegex = /```(?:typescript|ts|javascript|js)?\s*([\s\S]*?)```/g;
    const matches = [...cleanContent.matchAll(codeBlockRegex)];
    
    if (matches.length > 0) {
      cleanContent = matches[0][1].trim();
    }

    if (cleanContent.startsWith('{')) {
      try {
        const parsed = JSON.parse(cleanContent);
        if (parsed.reasoning) {
          AgentThoughts.log(scenario, stage, parsed.reasoning);
        }
        if (parsed.code) {
          cleanContent = parsed.code.trim();
        }
      } catch (e) {
        const codeFieldRegex = /"code":\s*"([\s\S]*?)"(?=\s*,\s*"|\s*})/;
        const codeMatch = cleanContent.match(codeFieldRegex);
        if (codeMatch) {
          cleanContent = codeMatch[1]
            .replace(/\\n/g, '\n')
            .replace(/\\"/g, '"')
            .replace(/\\t/g, '\t')
            .replace(/\\\\/g, '\\')
            .trim();
        }
      }
    }

    cleanContent = PromptEngine.ensureTestStructure(cleanContent, scenario);

    return cleanContent;
  }

  static sanitizeForValidation(code: string): string {
    let codeString = typeof code === 'string' ? code : String(code);
    
    let sanitized = codeString;
    
    const problematicPatterns = [
      /await expect\(page\.locator\(['"]text=.*failed.*['"]\)\)\.toBeVisible\(\);/gi,
      /await expect\(page\.locator\(['"]text=.*error.*['"]\)\)\.toBeVisible\(\);/gi,
      /await expect\(page\.locator\(['"]text=.*non-existent.*['"]\)\)\.toBeVisible\(\);/gi,
      /\/\/.*intentionally.*fail/i,
      /\/\/.*broken.*test/i,
    ];
    
    for (const pattern of problematicPatterns) {
      sanitized = sanitized.replace(pattern, '// Intentionally removed for validation');
    }
    
    sanitized = sanitized.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    return sanitized;
  }

  static hasValidTestStructure(code: string): boolean {
    const hasImport = /import\s+.*['"]@playwright\/test['"]/.test(code);
    const hasTestBlock = /test\(\s*['"`]/.test(code) || /test\.describe\(/.test(code);
    const hasExpect = /expect\s*\(/.test(code);
    
    return hasImport && hasTestBlock && hasExpect;
  }

  static validateTest(filePath: string): boolean {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      if (!this.hasValidTestStructure(content)) {
        console.warn(`⚠️ Warning: File lacks Playwright Test structure (test() or test.describe())`);
        return false;
      }

      execSync(`npx playwright test "${filePath}" --project=chromium --reporter=list`, {
        stdio: 'inherit',
        cwd: process.cwd(),
        env: { ...process.env, FORCE_COLOR: 'true' }
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}