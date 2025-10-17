# 🧠 QA Automation Framework (TypeScript · Jest · Allure · Swagger Petstore)

## 📋 Overview

This repository contains a **TypeScript-based API automation framework** built with **Jest** and **Allure**.  
It demonstrates a maintainable and scalable architecture for REST API testing using the **Swagger Petstore** (`https://petstore3.swagger.io/api/v3`) as the sample API.

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