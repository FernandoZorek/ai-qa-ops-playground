# 🤖 Autonomous AI-QA Agent Framework

An advanced, goal-oriented QA automation ecosystem that leverages Large Language Models (LLMs) and Playwright to autonomously discover, generate, and self-heal E2E test suites.


## 🎮 Playground & Production Ready

This framework is currently configured as a **high-fidelity playground** for experimenting with AI-driven testing. However, it was built with a modular "Agent-First" architecture, meaning it can be **easily adapted for production environments**. By swapping the local System Under Test (SUT) with your production or staging URLs and refining the prompt guidelines, you can deploy these autonomous agents to maintain your enterprise CI/CD pipelines.

---

## 🌟 Key Features

* **Autonomous Discovery**: Generates full Playwright test scripts from high-level natural language "User Stories" (Scenarios).
* **Self-Healing Engine**: Automatically detects test failures caused by UI changes (ID changes, text updates, structural shifts) and re-architects the code in real-time.
* **Agent Reasoning (Observability)**: Every decision made by the AI is logged in a "Chain of Thought" format, allowing human oversight of the agent's logic.
* **Environment Aware**: Seamlessly switches between application versions (v1, v2) via environment variables to demonstrate resilience against breaking changes.
* **Visual Debug Dashboard**: Consolidates failure screenshots, execution videos, and AI reasoning into a single, easy-to-read HTML report.
* **Validation Staging**: The agent never overwrites stable code unless the fix is proven to work. It uses temporary files for validation, ensuring your main test suite remains functional at all times.
* **Recursive Memory**: If a healing attempt fails, the agent stores the error and "learns" what didn't work, avoiding repetitive mistakes in the next retry.
---

### 🚀 Production-Ready: Git Integration & Auto-PR

In a production CI/CD pipeline, you don't want the Agent to simply overwrite files locally. You want a governed process. This framework can be integrated with the GitHub CLI to:

1.  **Detect UI regressions** during the build.
2.  **Trigger the HealerAgent** to fix the code.
3.  **Automate Pull Requests**: Instead of failing the build, the Agent creates a new branch with the fixed selectors and opens a PR for human review.
### 🛡️ Atomic Validation Workflow

To prevent broken code from entering your repository, the `HealerAgent` follows a strict validation protocol:
1.  **Drafting**: Generates a candidate fix in a `*.temp.spec.ts` file.
2.  **Isolated Testing**: Runs Playwright exclusively against the temporary file.
3.  **Promotion**: Only if the test passes (Exit Code 0), the temporary file is renamed to the official `.spec.ts`, replacing the old version.
4.  **Cleanup**: If all retries fail, the temporary files are purged to keep the workspace clean.

**Example Production Workflow:**
```bash
npm run agent:suite && ./src/scripts/git-auto-pr.sh
```

This transforms your QA process from "Detect & Fail" to "Detect, Fix & Propose".

---

## 🏗️ Project Architecture

The project is built on a modular architecture to ensure scalability and easy integration of new LLM providers.
```bash
src/
├── agents/          # Autonomous AI Agents (Discovery, Healer)
├── core/            # Infrastructure (LLM Connectors, Prompt Engines)
├── scripts/         # Orchestration (Suite Runner)
├── prompts/         
│   └── scenarios/   # Goal-oriented test requirements (Plain English)
└── app/             # SUT (System Under Test) - Realistic ERP Dashboard
```

---

## 🚀 Getting Started

### 1. Prerequisites
* Docker & Docker Compose
* OpenAI API Key or Google Gemini API Key

### 2. Environment Setup
Create a .env file in the root directory:
```bash
# --- Application Settings ---
APP_PORT=3000
APP_URL=http://localhost:3000
APP_VERSION=v1

# --- AI Strategy Settings ---
# Options: openai | gemini
LLM_PROVIDER=openai
LLM_MODEL=gpt-4o
LLM_API_KEY=your_api_key_here
LLM_TEMPERATURE=0.1
HEALER_MAX_RETRIES=3

# --- Paths ---
TESTS_PATH=tests
```

### 3. Running the Suite
To trigger the full AI pipeline (Discovery -> Execution -> Healing -> Reporting):
```bash
docker compose run --rm ai-agent npm run agent:suite
```

---

## 🛠️ Operational Commands
| Command | Description |
| :--- | :--- |
| npm run agent:generate <scenario> | Generates or updates a specific test scenario. |
| npm run agent:suite | Scans all scenarios, runs tests, and triggers healing for failures. |
| npm run start:app:v1 | Launches the ERP System in Version 1. |
| npm run start:app:v2 | Launches the ERP System in Version 2 (Breaking changes). |
| npm run test:run | Manual Playwright execution for debugging purposes. |

---

## 🧠 Agent Observability & Reasoning

This framework goes beyond traditional automation by logging the "Thought Process" of the agent. When a test fails or a new one is generated, the agent explains its strategy in agent-logs/thoughts.log.

Example Agent Insight: "I noticed that the 'Sales Reports' link text changed to 'Analytics' in Version 2. I have updated the locator to use a more resilient Role-based selector and adjusted the data validation to look for the 'amount' field instead of 'total'."



---

## 📊 Visual Reporting & Debugging

When a critical failure occurs (even after a healing attempt), the framework generates a Visual Dashboard at agent-logs/dashboard.html.

* **Failure Screenshots**: Visual proof of the UI state at the moment of failure.
* **Video Recording**: Full replay of the agent's interaction with the browser.
* **Error Context**: Deep dive into why the code failed (e.g., Dialog/Alert deadlocks).



---

## 📜 Natural Language Scenarios

Stop writing brittle code. Start writing intent.
Example Scenario (user-management.txt):
1. Navigate to the User Management section.
2. Locate the user "John Doe" in the table.
3. Click the "Delete" button.
4. Handle the browser confirmation alert.

The agent automatically handles DOM traversal, asynchronous waits, and complex event listeners like native browser dialogs.