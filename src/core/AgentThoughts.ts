import fs from 'fs';
import path from 'path';

export class AgentThoughts {
  static log(scenario: string, action: string, reasoning: string) {
    const logPath = path.join(process.cwd(), 'agent-logs');
    if (!fs.existsSync(logPath)) fs.mkdirSync(logPath);

    const timestamp = new Date().toISOString();
    const message = `[${timestamp}] [Scenario: ${scenario}] [Action: ${action}]\nREASONING: ${reasoning}\n${'-'.repeat(50)}\n`;
    
    fs.appendFileSync(path.join(logPath, 'thoughts.log'), message);
    console.log(`\n🧠 AGENT THOUGHTS: ${reasoning}\n`);
  }
}