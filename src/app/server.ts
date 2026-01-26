import express, { Request, Response } from 'express';

const app = express();
const port = Number(process.env.APP_PORT) || 3000;
const version = process.env.APP_VERSION || 'v1';

app.get('/', (req: Request, res: Response) => {
  const isV2 = version === 'v2';
  
  const menuId = isV2 ? "sidebar-toggle-new" : "old-menu-btn";
  const reportLink = isV2 ? "nav-analytics" : "nav-reports";
  const reportText = isV2 ? "📊 Analytics Dashboard" : "📊 Sales Reports";

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>ERP Enterprise - ${version}</title>
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-gray-900 text-white font-sans flex">
        <nav id="sidebar" class="w-64 bg-gray-800 p-6 h-screen border-r border-gray-700">
            <h2 class="text-xl font-bold mb-10 text-blue-400">ERP Cloud ${version}</h2>
            <ul class="space-y-4">
                <li><a href="#" id="${reportLink}" class="hover:text-blue-300 flex items-center">${reportText}</a></li>
                <li><a href="#" id="nav-users" class="hover:text-blue-300 flex items-center">👥 User Management</a></li>
                <li><a href="#" id="nav-settings" class="hover:text-blue-300 flex items-center">⚙️ Profile</a></li>
            </ul>
        </nav>

        <main class="flex-1 p-10 relative">
            <button id="${menuId}" class="md:hidden bg-blue-600 p-2 rounded mb-4">Open Menu</button>
            <div id="content-area">
                <h1 class="text-3xl font-bold">Welcome to Dashboard</h1>
                <p class="mt-4 text-gray-400">Select an option from the sidebar to start.</p>
            </div>
        </main>

        <script>
            const area = document.getElementById('content-area');

            // --- SCENARIO 1: REPORTS ---
            document.getElementById('${reportLink}').addEventListener('click', () => {
                area.innerHTML = '<div class="animate-pulse">Generating report...</div>';
                setTimeout(() => {
                    area.innerHTML = \`
                        <h1 class="text-2xl mb-4">${reportText}</h1>
                        <button id="fetch-data" class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded">Download JSON Data</button>
                        <pre id="json-output" class="mt-6 bg-black p-4 rounded text-green-400 hidden border border-gray-700"></pre>
                    \`;
                    document.getElementById('fetch-data').addEventListener('click', () => {
                        const output = document.getElementById('json-output');
                        const data = "${version}" === "v2" 
                            ? { status: "success", data: { amount: 2750.00, currency: "BRL" } }
                            : { status: "success", data: { total: 1500.50, currency: "BRL" } };
                        output.textContent = JSON.stringify(data, null, 2);
                        output.classList.remove('hidden');
                    });
                }, 1000);
            });

            // --- SCENARIO 2: USER MANAGEMENT ---
            document.getElementById('nav-users').addEventListener('click', () => {
                area.innerHTML = \`
                    <h1 class="text-2xl mb-4">Users</h1>
                    <table class="w-full bg-gray-800 rounded">
                        <thead><tr class="text-left border-b border-gray-700"><th class="p-2">Name</th><th>Action</th></tr></thead>
                        <tbody>
                            <tr>
                                <td class="p-2">John Doe</td>
                                <td><button class="bg-red-500 px-2 py-1 rounded text-sm" onclick="alert('User Deleted')">Delete</button></td>
                            </tr>
                        </tbody>
                    </table>\`;
            });

            // --- SCENARIO 3: PROFILE ---
            document.getElementById('nav-settings').addEventListener('click', () => {
                area.innerHTML = \`
                    <h1 class="text-2xl mb-4">Profile Settings</h1>
                    <input type="text" id="user-name" class="bg-gray-700 p-2 rounded mb-4 w-full" value="Zorek Master">
                    <button id="save-profile" class="bg-blue-600 px-4 py-2 rounded">Save</button>
                    <p id="save-status" class="mt-4 text-green-400 hidden">✅ Profile updated successfully!</p>
                \`;
                document.getElementById('save-profile').addEventListener('click', (e) => {
                    e.target.innerText = 'Saving...';
                    setTimeout(() => {
                        document.getElementById('save-status').classList.remove('hidden');
                        e.target.innerText = 'Save';
                    }, 1500);
                });
            });
        </script>
    </body>
    </html>
  `);
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 SUT running at http://0.0.0.0:${port} (${version})`);
});