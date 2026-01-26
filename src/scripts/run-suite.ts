// src/runFullSuite.ts
import { execSync } from 'child_process';
import dotenv from 'dotenv';
import { Reporter } from '../core/Reporter';
import { ScenarioManager } from '../core/ScenarioManager';

dotenv.config();

async function runFullSuite() {
  // Usa o ScenarioManager para listar TODOS os cenários recursivamente
  const allScenarios = ScenarioManager.listAllScenarios();

  if (allScenarios.length === 0) {
    console.error('\n❌ Nenhum cenário encontrado em src/prompts/scenarios/');
    console.error('Estrutura esperada:');
    console.error('  src/prompts/scenarios/');
    console.error('  ├── sales/');
    console.error('  │   ├── reports/');
    console.error('  │   │   └── monthly.txt');
    console.error('  │   └── dashboard.txt');
    console.error('  └── users/');
    console.error('      └── auth/');
    console.error('          └── login.txt\n');
    process.exit(1);
  }

  console.log(`\n\x1b[34m=== 🤖 STARTING GLOBAL AI-QA PIPELINE ===\x1b[0m`);
  console.log(`Found ${allScenarios.length} scenarios across multiple levels.\n`);

  const results: { scenario: string; context: string; status: 'PASS' | 'FAIL'; error?: string }[] = [];

  for (const { name: scenario, contextPath: context } of allScenarios) {
    console.log(`\n\x1b[33m--- [${context || 'root'}] Processing: ${scenario} ---\x1b[0m`);
    try {
      execSync(`ts-node src/main.ts ${scenario}`, { 
        stdio: 'inherit',
        env: { ...process.env, FORCE_COLOR: 'true' }
      });
      results.push({ scenario, context: context || 'root', status: 'PASS' });
    } catch (error: any) {
      results.push({ 
        scenario, 
        context: context || 'root', 
        status: 'FAIL',
        error: error.message?.split('\n')[0] || 'Unknown error' 
      });
    }
  }
  
  Reporter.generateHTML();

  console.log(`\n\x1b[34m==========================================\x1b[0m`);
  console.log(`📊 FINAL REPORT - ${new Date().toLocaleString()}`);
  console.log(`==========================================`);
  
  // Agrupa resultados por contexto para melhor visualização
  const contexts = [...new Set(results.map(r => r.context))];
  for (const ctx of contexts) {
    console.log(`\n📁 Context: ${ctx}`);
    const ctxResults = results.filter(r => r.context === ctx);
    ctxResults.forEach(res => {
      const icon = res.status === 'PASS' ? '✅' : '❌';
      const color = res.status === 'PASS' ? '\x1b[32m' : '\x1b[31m';
      console.log(`  ${icon} ${res.scenario.padEnd(25)} : ${color}${res.status}\x1b[0m`);
      if (res.error && res.status === 'FAIL') {
        console.log(`     └─ Error: ${res.error.substring(0, 80)}`);
      }
    });
  }
  
  console.log(`\n==========================================`);
  console.log(`✅ Passed: ${results.filter(r => r.status === 'PASS').length}/${results.length}`);
  console.log(`❌ Failed: ${results.filter(r => r.status === 'FAIL').length}/${results.length}`);
  console.log(`==========================================\n`);

  if (results.some(r => r.status === 'FAIL')) {
    process.exit(1);
  }
}

runFullSuite().catch(err => {
  console.error('❌ Global pipeline failed:', err);
  process.exit(1);
});