# 🧠 QA Automation Framework (TypeScript · Jest · Allure · Swagger Petstore)

## 📋 Overview

This repository contains a **TypeScript-based API automation framework** built with **Jest** and **Allure**.  
It demonstrates a maintainable and scalable architecture for REST API testing using the **Swagger Petstore** (`https://petstore3.swagger.io/api/v3`) as the sample API.
## 🤖 AI-Assisted Test Generation

This project can **generate new Jest API tests** using a **local LLM via Ollama** (free, no API keys).  
The generator reads your existing tests/endpoints as **style/context** and creates new `.spec.ts` files under `tests/api/generated/`.

Test coverage includes:
- CRUD for **Pet**, **User**, and **Store** entities  
- **Negative test cases** (via simulated MCP service)  
- **Property-based** tests adapted for stable execution  

---

## 🧩 Tech Stack

| Component | Purpose |
|------------|----------|
| **TypeScript** | Main project language |
| **Jest** | Testing framework |
| **Axios** | HTTP client |
| **Zod / openapi-typescript** | Type generation & schema validation |
| **Allure** | Test reporting & visualization |
| **faker-js** | Random test data generation |
| **axios-retry** | Request retry mechanism |
| **dotenv** | Environment variables |
| **fast-check** | Property-based test data generator |

---

## 🗂️ Project Structure

```bash
qa-automation-ts/
├── src/
│   ├── api/
│   │   ├── clients/http.ts            # HTTP client (axios + retry)
│   │   ├── endpoints/                 # API endpoints (Pets, Users, Store)
│   │   ├── models/                    # OpenAPI-generated types
│   │   └── index.ts
│   ├── common/
│   │   ├── allure.ts                  # Allure-safe wrappers
│   │   ├── config.ts                  # BASE_URL and test configuration
│   │   └── dataFactory.ts             # Test data factories (Pet, User, Order)
│   └── mcp/swaggerClient.ts           # Simulated MCP service
│
├── tests/
│   ├── api/                           # Core API test suites
│   ├── property-based/                # Property-based API checks
│   └── utils/uniqueId.ts              # Utility ID generator
│
├── .env                               # Environment variables
├── jest.config.ts                     # Jest configuration
├── tsconfig.json                      # TypeScript configuration
├── package.json                       # Dependencies & scripts
└── README.md                          # Documentation
```

---

## ⚙️ Setup, Configuration, and Local Server Run (Full Guide)

### 1️⃣ Clone the repository
```bash
git clone https://github.com/serhii-yurchenko-aqa/api-tests.git
cd qa-automation-ts
```

### 2️⃣ Install dependencies
```bash
npm install
```

### 3️⃣ Create .env
```env
BASE_URL=https://petstore3.swagger.io/api/v3
TIMEOUT=10000
RETRIES=2
LOG_LEVEL=info
```

### 4️⃣ Generate OpenAPI types
```bash
npx openapi-typescript https://petstore3.swagger.io/api/v3/openapi.json -o src/api/models/index.ts
```

### 🐳 Setup Local Swagger Petstore with Docker

#### A. Using Docker Desktop

1. Install Docker Desktop
   👉 [Docker for macOS](https://docs.docker.com/desktop/mac/)

2. Pull the latest Petstore image
   ```bash
   docker pull swaggerapi/petstore3:latest
   ```

3. Run Petstore locally
   ```bash
   docker run -d -p 8080:8080 --name petstore swaggerapi/petstore3:latest
   ```

4. Verify it's running
   ```bash
   curl http://localhost:8080/api/v3/pet/findByStatus?status=available
   ```
   ✅ Expected: JSON list of sample pets.

5. Update your .env
   ```env
   BASE_URL=http://127.0.0.1:8080/api/v3
   ```


### Install Ollama & Generate AI Tests (Mistral Only)

```bash
# Install Ollama (macOS via Homebrew)
brew install ollama

# Start Ollama in a dedicated terminal (keep it running)
ollama serve

# Pull required model (framework is now restricted to mistral)
ollama pull mistral
```

> The generator enforces the expected model: if you run with another model name it will exit. Override with `EXPECTED_MODEL` only if you intentionally change the project default.

### AI Test Generation Scripts

From the project root (with Ollama running):

```bash
# Fast reliable smoke test generation
npm run ai:gen:smoke:inc      # Template-based, completes in 2 seconds, always works

# Experimental: Real AI generation (often broken)
npm run ai:gen:smoke:real     # Ollama/Mistral model - slow, unreliable, wrong patterns
```

### Optional Environment Flags
You can prefix any script with flags to tune behavior:

| Flag | Purpose | Example |
|------|---------|---------|
| `AI_TOTAL_TIMEOUT_MS` | Max overall generation time before timeout | `AI_TOTAL_TIMEOUT_MS=45000 npm run ai:gen:smoke` |
| `OLLAMA_SKIP_WARMUP=1` | Skip model warm‑up step | `OLLAMA_SKIP_WARMUP=1 npm run ai:gen` |
| `AI_FORCE_STUB=1` | Always write stub tests (no model call) | `AI_FORCE_STUB=1 npm run ai:gen:smoke` |
| `AI_ALLOW_STUB=1` | Permit stub fallback if generation fails (full mode) | `AI_ALLOW_STUB=1 npm run ai:gen` |
| `OLLAMA_TRANSPORT=curl` | Use curl fallback first (helps with fetch aborts) | `OLLAMA_TRANSPORT=curl npm run ai:gen` |
| `EXPECTED_MODEL=mistral` | Enforce specific model name (already default) | `EXPECTED_MODEL=mistral npm run ai:gen` |

### What Gets Generated
- Output directory: `tests/api/generated/`
- Smoke mode: 3 status-focused pet tests (`available`, `pending`, `invalid`) – or stub equivalents if model not responsive.
- Full mode: Attempts broader CRUD/test coverage; falls back to stub suite only if flags allow.

### Troubleshooting
| Symptom | Cause | Action |
|---------|-------|--------|
| AbortError / timeouts | Large first-token latency or undici fetch quirk | Add `OLLAMA_TRANSPORT=curl` or increase `AI_TOTAL_TIMEOUT_MS` |
| Model not found | Not pulled locally | `ollama pull mistral` |
| Hangs until timeout | Heavy model cold start | Use `npm run ai:gen:smoke` or `AI_FORCE_STUB=1` |
| Only stub tests every run | Generation failing consistently | Verify Ollama running, check memory/CPU, try curl transport |

### Minimal End-to-End Example
```bash
ollama serve                # Terminal 1
ollama pull mistral         # Pull model (run once)

cd path/to/project          # Terminal 2
npm install                 # Install dependencies
npm run ai:gen:smoke:inc    # Generate smoke tests (fast, reliable)
# OR for actual AI generation (slow, may fail):
# npm run ai:gen:smoke:real
npm test                    # Execute all tests including generated ones
```

### Reset Generated Tests
If you want a clean slate before regenerating:
```bash
rm -f tests/api/generated/*.smoke.spec.ts
```

Then re-run a generation script.

6. Run tests
```bash
   npm test
```

7. Stop container
```bash
   docker stop petstore && docker rm petstore
```

#### B. Using Colima (Docker alternative via Homebrew)

If you don't want to use Docker Desktop:

```bash
brew install colima docker
colima start --cpu 2 --memory 4 --disk 20
docker pull swaggerapi/petstore3:latest
docker run -d -p 8080:8080 --name petstore swaggerapi/petstore3:latest
```

Check and test:
```bash
curl http://localhost:8080/api/v3/pet/findByStatus?status=available
npm test
```

Stop and cleanup:
```bash
docker stop petstore && docker rm petstore
colima stop
```

## 🧪 Run Tests and Reports

Run tests:
```bash
npm test
```

Generate and view Allure reports:
```bash
npm run allure:gen
npm run allure:serve
```

Allure provides:
- Visual test statistics
- JSON attachments for requests/responses
- Step-level detail and summaries

---

## 🔄 Example CI/CD Integration (GitHub Actions)

```yaml
name: API Tests CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm test
      - run: npm run allure:gen
```

---

## 🧰 Useful Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run all test suites |
| `npm run allure:gen` | Generate Allure report |
| `npm run allure:serve` | Serve Allure report locally |
| `npm run build` | Compile TypeScript |
| `npm run lint` | Lint source code |
| `docker ps` | List running containers |
| `docker stop petstore` | Stop local Petstore container |
| `colima start / stop` | Start or stop Docker environment |