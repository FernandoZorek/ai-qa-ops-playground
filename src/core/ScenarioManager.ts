import fs from 'fs';
import path from 'path';

export interface ScenarioInfo {
  name: string;
  contextPath: string;
  filePath: string;
}

export class ScenarioManager {
  private static SCENARIOS_BASE_PATH = path.resolve(process.cwd(), 'src/prompts/scenarios');

  static listAllScenarios(): ScenarioInfo[] {
    const scenarios: ScenarioInfo[] = [];

    if (!fs.existsSync(this.SCENARIOS_BASE_PATH)) {
      console.warn(`⚠️ Pasta de cenários não encontrada: ${this.SCENARIOS_BASE_PATH}`);
      return scenarios;
    }

    this.walkDir(this.SCENARIOS_BASE_PATH, '', scenarios);

    return scenarios;
  }

  private static walkDir(currentPath: string, relativePath: string, scenarios: ScenarioInfo[]): void {
    const items = fs.readdirSync(currentPath);

    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const itemRelativePath = relativePath ? `${relativePath}/${item}` : item;

      if (fs.statSync(fullPath).isDirectory()) {
        this.walkDir(fullPath, itemRelativePath, scenarios);
      } else if (this.isFileScenario(item)) {
        const scenarioName = item.replace(/\.(txt|md|json)$/, '');
        scenarios.push({
          name: scenarioName,
          contextPath: relativePath,
          filePath: fullPath
        });
      }
    }
  }

  private static isFileScenario(filename: string): boolean {
    return /\.(txt|md|json)$/.test(filename);
  }

  static findScenario(scenarioName: string): ScenarioInfo | null {
    const allScenarios = this.listAllScenarios();
    return allScenarios.find(s => s.name === scenarioName) || null;
  }

  static findScenarioContext(scenarioName: string): string | null {
    const scenario = this.findScenario(scenarioName);
    return scenario ? scenario.contextPath : null;
  }

  static getTestOutputPath(scenarioName: string, contextPath?: string): string {
    const detectedContext = contextPath || this.findScenarioContext(scenarioName) || 'general';
    
    const TESTS_BASE_PATH = process.env.TESTS_PATH || 'tests';
    
    const outputPath = detectedContext === 'general'
      ? path.resolve(process.cwd(), TESTS_BASE_PATH)
      : path.resolve(process.cwd(), TESTS_BASE_PATH, detectedContext);
    
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }
    
    return path.join(outputPath, `${scenarioName}.spec.ts`);
  }

  static printAvailableScenarios(): void {
    const scenarios = this.listAllScenarios();
    
    console.log('\n📋 Cenários disponíveis:\n');
    
    if (scenarios.length === 0) {
      console.log('   Nenhum cenário encontrado em src/prompts/scenarios/');
      console.log('   Estrutura esperada:');
      console.log('   src/prompts/scenarios/');
      console.log('   ├── sales/');
      console.log('   │   ├── reports/');
      console.log('   │   │   └── monthly.txt');
      console.log('   │   └── dashboard.txt');
      console.log('   └── users/');
      console.log('       └── auth/');
      console.log('           └── login.txt\n');
      return;
    }

    const byContext: Record<string, string[]> = {};
    for (const s of scenarios) {
      const ctx = s.contextPath || 'root';
      if (!byContext[ctx]) byContext[ctx] = [];
      byContext[ctx].push(s.name);
    }

    const sortedContexts = Object.keys(byContext).sort();

    for (const context of sortedContexts) {
      if (context === 'root') {
        console.log(`📁 root/`);
      } else {
        console.log(`📁 ${context}/`);
      }
      byContext[context].sort().forEach(name => {
        console.log(`   • ${name}`);
      });
      console.log();
    }
    
    // console.log('💡 Uso: npm run test <scenario-name>');
    // console.log('   Ex: npm run test monthly\n');
  }
}