import fs from 'fs';
import path from 'path';

export class Reporter {
  static generateHTML() {
    const resultsDir = path.join(process.cwd(), 'test-results');
    const reportPath = path.join(process.cwd(), 'agent-logs', 'dashboard.html');

    if (!fs.existsSync(resultsDir)) return;

    const folders = fs.readdirSync(resultsDir);
    let htmlContent = `
      <html>
      <head>
        <title>AI Agent - Failure Analysis</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-gray-950 text-white p-10">
        <h1 class="text-4xl font-bold mb-8 text-blue-500">🕵️ Agent Debug Dashboard</h1>
        <div class="grid grid-cols-1 gap-8">
    `;

    folders.forEach(folder => {
      const folderPath = path.join(resultsDir, folder);
      if (fs.lstatSync(folderPath).isDirectory()) {
        const screenshot = fs.readdirSync(folderPath).find(f => f.endsWith('.png'));
        const video = fs.readdirSync(folderPath).find(f => f.endsWith('.webm'));

        htmlContent += `
          <div class="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-2xl">
            <h2 class="text-2xl font-semibold mb-4 text-red-400">Scenario: ${folder.split('-')[0]}</h2>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="mb-2 text-gray-400">Último Frame (Erro):</p>
                <img src="../test-results/${folder}/${screenshot}" class="rounded border border-gray-700">
              </div>
              <div>
                <p class="mb-2 text-gray-400">Replay da Ação:</p>
                <video controls class="w-full rounded border border-gray-700">
                  <source src="../test-results/${folder}/${video}" type="video/webm">
                </video>
              </div>
            </div>
          </div>
        `;
      }
    });

    htmlContent += `</div></body></html>`;
    fs.writeFileSync(reportPath, htmlContent);
    console.log(`\n📊 Dashboard visual gerado: agent-logs/dashboard.html`);
  }
}