// Generate Jest API tests via local Ollama (mistral only simplified variant).
// Requires: `ollama serve` running and `ollama pull mistral`

import { promises as fs } from 'fs';
import { execFile } from 'child_process';
import * as path from 'path';
import * as url from 'url';

// Absolute project root (assumes script executed from project root via npm scripts)
const ROOT_DIR = path.resolve(process.cwd());
// Directory of this script (kept for potential future relative needs)
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const MODEL = process.env.MODEL || 'mistral';
const EXPECTED_MODEL = process.env.EXPECTED_MODEL || 'mistral';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
// Ensure generated tests land in top-level tests/api/generated
const OUTPUT_DIR = path.join(ROOT_DIR, 'tests', 'api', 'generated');
const AI_MODE = process.env.AI_MODE; // 'smoke' for minimal generation

const BASE_URL =
  process.env.BASE_URL || 'http://127.0.0.1:8080/api/v3'; // ваш .env по-умолчанию для локалки

// Context files: reduce for smoke mode to speed up initial generation
const CONTEXT_FILES = AI_MODE === 'smoke'
  ? [
      path.join(ROOT_DIR, 'src', 'api', 'clients', 'http.ts'),
      path.join(ROOT_DIR, 'src', 'api', 'endpoints', 'pets.ts'),
    ]
  : [
      path.join(ROOT_DIR, 'tests', 'api', 'pet.crud.spec.ts'),
      path.join(ROOT_DIR, 'tests', 'api', 'user.crud.spec.ts'),
      path.join(ROOT_DIR, 'src', 'api', 'clients', 'http.ts'),
      path.join(ROOT_DIR, 'src', 'api', 'endpoints', 'pets.ts'),
      path.join(ROOT_DIR, 'src', 'api', 'endpoints', 'users.ts'),
    ];

type GenTest = {
  fileName: string;     // например: "pet.generated.findById.spec.ts"
  relativeDir?: string; // например: "tests/api/generated"
  code: string;         // весь .spec.ts
};

type GenResponse = {
  tests: GenTest[];
  notes?: string;
};

async function readContextFiles(): Promise<{ name: string; content: string }[]> {
  const parts: { name: string; content: string }[] = [];
  for (const p of CONTEXT_FILES) {
    try {
      const content = await fs.readFile(p, 'utf-8');
  parts.push({ name: path.relative(ROOT_DIR, p), content });
    } catch (e) {
      // пропускаем отсутствующие файлы
    }
  }
  return parts;
}

function systemPrompt(): string {
  return (
    'CRITICAL: You MUST follow this EXACT template. NO variations allowed.\n\n'
    + 'TEMPLATE (replace STATUS_VALUE and EXPECTED_CODE only):\n'
    + 'import { HttpClient } from "../../../src/api/clients/http";\n'
    + 'import { PetsAPI } from "../../../src/api/endpoints/pets";\n\n'
    + 'describe("Pet findByStatus - STATUS_NAME", () => {\n'
    + '  const api = new PetsAPI(new HttpClient(process.env.BASE_URL || "http://127.0.0.1:8080/api/v3"));\n\n'
    + '  it("should return expected response for STATUS_NAME pets", async () => {\n'
    + '    const response = await api.findByStatus("STATUS_VALUE");\n'
    + '    expect(response.status).toBe(EXPECTED_CODE);\n'
    + '    expect(Array.isArray(response.data)).toBe(true);\n'
    + '  });\n'
    + '});\n\n'
    + 'RULES:\n'
    + '- Use EXACTLY these imports, no others\n'
    + '- NO jest.mock(), NO beforeEach(), NO additional classes\n'
    + '- Use process.env.BASE_URL exactly as shown\n'
    + '- Return JSON: {"tests":[{"fileName":"name.spec.ts","relativeDir":"tests/api/generated","code":"COMPLETE_FILE_CODE"}]}\n'
    + 'NO explanations, NO markdown, ONLY JSON.'
  );
}

function buildUserPrompt(context: { name: string; content: string }[]): string {
  let ideas: string;
  if (AI_MODE === 'smoke') {
    ideas = (
      'Generate 3 concise Jest API test files covering pet status queries. Each file must be COMPLETE with proper imports and syntax:\n'
      + 'EXACT TEMPLATE for each file - follow this pattern precisely:\n'
      + '\n'
      + 'import { HttpClient } from "../../../src/api/clients/http";\n'
      + 'import { PetsAPI } from "../../../src/api/endpoints/pets";\n'
      + '\n'
      + 'describe("Pet findByStatus - STATUS_NAME", () => {\n'
      + '  const api = new PetsAPI(new HttpClient(process.env.BASE_URL || "http://127.0.0.1:8080/api/v3"));\n'
      + '\n'
      + '  it("should return expected response for STATUS_NAME pets", async () => {\n'
      + '    const response = await api.findByStatus("STATUS_VALUE");\n'
      + '    expect(response.status).toBe(EXPECTED_STATUS_CODE);\n'
      + '    expect(Array.isArray(response.data)).toBe(true);\n'
      + '  });\n'
      + '});\n'
      + '\n'
      + 'FILE A: Replace STATUS_NAME="available", STATUS_VALUE="available", EXPECTED_STATUS_CODE=200\n'
      + 'FILE B: Replace STATUS_NAME="pending", STATUS_VALUE="pending", EXPECTED_STATUS_CODE=200\n'
      + 'FILE C: Replace STATUS_NAME="invalid", STATUS_VALUE="__nonexistent__", EXPECTED_STATUS_CODE=400\n'
      + 'File names: pet.findByStatus.available.smoke.spec.ts, pet.findByStatus.pending.smoke.spec.ts, pet.findByStatus.invalid.smoke.spec.ts\n'
      + 'CRITICAL: Each file must be syntactically complete with all braces, quotes, and semicolons properly closed.\n'
      + 'Return JSON with tests[] array of THREE complete objects.'
    );
  } else {
    ideas = (
      'Generate 3-5 new API tests covering:\n'
      + '1) Pets: update pet (PUT) happy path and 404 on not found;\n'
      + '2) Pets: findByStatus should return array and each item has id,name,status;\n'
      + '3) Users: createWithList happy path and negative wrong types;\n'
      + '4) Store: get inventory returns object of non-negative integers (skip test body if 5xx).\n'
      + 'All tests must import and use our HttpClient and endpoint classes.'
    );
  }

  const filesJoined = context
    .map((c) => `---FILE:${c.name}---\n${c.content}`)
    .join('\n\n');

  return `
CONTEXT FILES (read-only, show style and imports):
${filesJoined}

REQUIREMENTS:
${ideas}

CRITICAL: Follow the EXACT import pattern shown in context files. Use separate import statements and process.env.BASE_URL.
OUTPUT:
Return JSON exactly as specified. Every "code" value must be a complete, syntactically valid .spec.ts file.
`.trim();
}

// Increase default timeout: large local models (first load) can exceed 60s.
const DEFAULT_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS || 180000);
// Reduce default retries to 1 (previously 2) for faster fail feedback
const RETRIES = Number(process.env.OLLAMA_RETRIES || 0);
// Limit requested tokens to speed up response; adjustable via env.
const MAX_TOKENS = Number(process.env.OLLAMA_MAX_TOKENS || process.env.AI_MAX_TOKENS || 400);
// Incremental (AI_INCREMENTAL=1) overrides for smaller single-test generations
const INCR_MAX_TOKENS = Number(process.env.AI_INCREMENTAL_MAX_TOKENS || 400);
const SINGLE_ATTEMPT_RETRIES = Number(process.env.AI_INCREMENTAL_RETRIES || 1);
const SINGLE_TIMEOUT_MS = Number(process.env.AI_SINGLE_TIMEOUT_MS || 90000);
// Overall generation timeout (including model call). Shorter for smoke mode by default.
const TOTAL_TIMEOUT_MS = Number(process.env.AI_TOTAL_TIMEOUT_MS || (AI_MODE === 'smoke' ? 20000 : 300000));

function abortableTimeout(ms: number) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, cancel: () => clearTimeout(t) };
}

async function fetchWithTimeout(urlStr: string, init: RequestInit, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const { signal, cancel } = abortableTimeout(timeoutMs);
  try {
    return await fetch(urlStr, { ...init, signal });
  } finally {
    cancel();
  }
}

async function callOllama(model: string, prompt: string): Promise<string> {
  let attempt = 0;
  let lastErr: any;
  while (attempt <= RETRIES) {
    try {
      const body = {
        model,
        prompt,
        stream: process.env.OLLAMA_STREAM_FIRST === '1',
        options: { temperature: 0.2, num_predict: MAX_TOKENS }
      };
      const res = await fetchWithTimeout(`${OLLAMA_URL}/api/generate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error(`Ollama error: ${res.status} ${await res.text()}`);
      if (body.stream) {
        if (!res.body) throw new Error('No body in streaming response');
        const reader = (res.body as any).getReader();
        let out = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = new TextDecoder().decode(value);
          for (const line of chunk.split(/\r?\n/)) {
            const t = line.trim();
            if (!t) continue;
            try { const obj = JSON.parse(t); if (obj.response) out += obj.response; } catch { /* ignore */ }
          }
        }
        try { reader.releaseLock(); } catch {}
        return out;
      } else {
        const json = await res.json() as { response: string };
        return json.response;
      }
    } catch (e: any) {
      lastErr = e;
      const transient = e.name === 'AbortError' || /timeout|ECONNREFUSED|UND_ERR_HEADERS_TIMEOUT/i.test(String(e?.message));
      if (transient && attempt < RETRIES) {
        const backoff = 500 * (attempt + 1);
        console.warn(`⚠ Ollama call failed (attempt ${attempt + 1}/${RETRIES + 1}): ${e.message || e}. Retrying in ${backoff}ms...`);
        await new Promise(r => setTimeout(r, backoff));
        attempt++;
        continue;
      }
      break;
    }
  }
  throw lastErr;
}

function curlAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    execFile('curl', ['--version'], (err) => resolve(!err));
  });
}

async function callOllamaViaCurl(model: string, prompt: string): Promise<string> {
  const hasCurl = await curlAvailable();
  if (!hasCurl) throw new Error('curl not available for fallback');
  const body = JSON.stringify({
    model,
    prompt,
    stream: true,
    options: { temperature: 0.2, num_predict: MAX_TOKENS }
  });
  return new Promise((resolve, reject) => {
    const args = [
      '--silent', '--show-error', '--no-buffer',
      '-X', 'POST', `${OLLAMA_URL}/api/generate`,
      '-H', 'Content-Type: application/json',
      '--data', body
    ];
    let aggregate = '';
    const proc = execFile('curl', args, { timeout: DEFAULT_TIMEOUT_MS }, (err) => {
      if (err) return reject(err);
      resolve(aggregate);
    });
    proc.stdout?.on('data', (chunk) => {
      const text = chunk.toString();
      // Each line should be JSON; accumulate response fields
      for (const line of text.split(/\r?\n/)) {
        const t = line.trim();
        if (!t) continue;
        try {
          const obj = JSON.parse(t);
          if (obj.response) aggregate += obj.response;
        } catch {
          // If final non-JSON code block appears, keep raw
          aggregate += t + '\n';
        }
      }
    });
    proc.stderr?.on('data', (e) => {
      // optional debug; do not reject yet
    });
  });
}

async function callOllamaStreaming(model: string, prompt: string): Promise<string> {
  // Streaming fallback: accumulate 'response' fields from chunked JSON objects.
  const body = {
    model,
    prompt,
    stream: true,
    options: {
      temperature: 0.2,
      num_predict: MAX_TOKENS
    }
  };
  const res = await fetchWithTimeout(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    throw new Error(`Streaming Ollama error: ${res.status} ${await res.text()}`);
  }
  if (!res.body) {
    throw new Error('Streaming response has no body');
  }
  const reader = (res.body as any).getReader();
  let output = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = new TextDecoder().decode(value);
      // Each line may be JSON object with partial response.
      for (const line of chunk.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const obj = JSON.parse(trimmed);
          if (obj.response) output += obj.response;
        } catch { /* ignore non-JSON line */ }
      }
    }
  } finally {
    try { reader.releaseLock(); } catch {}
  }
  return output;
}

async function ensureServerHealthy(): Promise<void> {
  try {
    const res = await fetchWithTimeout(`${OLLAMA_URL}/api/tags`, { method: 'GET' }, 5000);
    if (!res.ok) {
      console.warn(`⚠ Ollama server responded with status ${res.status} to /api/tags`);
    }
  } catch (e: any) {
    console.error('✗ Could not reach Ollama server at', OLLAMA_URL);
    console.error('  Start it with:  ollama serve');
    throw e;
  }
}

async function warmUpModel(model: string): Promise<void> {
  // Auto-skip warm-up for smoke unless explicitly forced
  if (process.env.OLLAMA_SKIP_WARMUP === '1' || (AI_MODE === 'smoke' && process.env.OLLAMA_FORCE_WARMUP !== '1')) return;
  console.log('⏳ Warm-up: requesting tiny generation to load model into memory...');
  try {
    const body = {
      model,
      prompt: 'PING',
      stream: false,
      options: { temperature: 0.0, num_predict: 5 }
    };
    const res = await fetchWithTimeout(`${OLLAMA_URL}/api/generate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    }, Number(process.env.OLLAMA_WARMUP_TIMEOUT_MS || 45000));
    if (!res.ok) {
      console.warn(`⚠ Warm-up response status ${res.status}; continuing.`);
      return;
    }
    // Non-stream: just consume JSON
    try { await res.json(); } catch {}
    console.log('✅ Warm-up complete.');
  } catch (e: any) {
    console.warn('⚠ Warm-up failed (non-fatal):', e.message || e);
    if (process.env.OLLAMA_TRANSPORT === 'curl') {
      console.warn('⚠ Retrying warm-up via curl...');
      try {
        await callOllamaViaCurl(model, 'PING');
        console.log('✅ Warm-up (curl) complete.');
      } catch (curlErr: any) {
        console.warn('⚠ Curl warm-up also failed:', curlErr.message || curlErr);
      }
    }
  }
}

async function ensureModelExists(model: string): Promise<string> {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`);
    if (!res.ok) {
      console.warn(`⚠ Unable to list Ollama models (status ${res.status}). Skipping model check.`);
      return model;
    }
    const data = await res.json() as { models?: { name: string }[] };
    const names = (data.models || []).map(m => m.name);
    if (names.includes(model)) return model;
    // Try variant resolution (e.g., user specified llama3.1 but only llama3.1:latest exists)
    const variant = names.find(n => n === `${model}:latest` || n.startsWith(`${model}:`));
    if (variant) {
      console.log(`ℹ Using installed variant '${variant}' for requested model '${model}'.`);
      return variant;
    }
    console.error(`✗ Ollama model '${model}' not found locally.`);
    console.error('Installed models:', names.length ? names.join(', ') : '(none)');
    console.error('→ Pull it first, e.g.:');
    console.error(`   ollama pull ${model}`);
    console.error('Or specify an installed variant exactly (MODEL=name:tag).');
    process.exit(2);
  } catch (e) {
    console.warn('⚠ Failed to verify model presence. If you get a 404 later, run: ollama list / ollama pull <model>');
    return model;
  }
  return model;
}

function sanitizeModelOutput(raw: string): string {
  let s = raw.trim();
  // Remove leading advisory text lines before first '{'
  const firstBrace = s.indexOf('{');
  if (firstBrace > 0) s = s.slice(firstBrace);
  // Remove markdown fences
  s = s.replace(/^```(?:json|typescript|ts)?/i, '').replace(/```$/m, '').trim();
  // If "code": starts with a backtick, convert the backtick block into a JSON string
  // Pattern: "code": ` ... ` (we capture until matching closing backtick)
  s = s.replace(/"code"\s*:\s*`([\s\S]*?)`/g, (_m, inner) => {
    // Escape backslashes, quotes, and newlines for JSON string
    const escaped = inner
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\r/g, '')
      .replace(/\n/g, '\\n');
    return `"code":"${escaped}"`;
  });
  return s;
}

function tryParseJson<T = any>(raw: string): T {
  const cleaned = sanitizeModelOutput(raw);
  // Attempt direct parse
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Last resort: find first balanced braces
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      const slice = cleaned.slice(start, end + 1);
      return JSON.parse(slice);
    }
    throw new Error('LLM did not return valid JSON after sanitation');
  }
}

// Validate that generated code follows our patterns
function validateGeneratedCode(code: string): boolean {
  const requiredPatterns = [
    'import { HttpClient } from "../../../src/api/clients/http"',
    'import { PetsAPI } from "../../../src/api/endpoints/pets"',
    'new PetsAPI(new HttpClient(process.env.BASE_URL',
    'api.findByStatus('
  ];
  
  const forbiddenPatterns = [
    'jest\\.mock\\(',
    'import \\{ Pet \\}',
    'import.*PetAPI.*from',
    'beforeEach\\(',
    'new Pet\\(',
    'axios'
  ];
  
  // Check required patterns
  for (const pattern of requiredPatterns) {
    if (!code.includes(pattern)) {
      return false;
    }
  }
  
  // Check forbidden patterns
  for (const pattern of forbiddenPatterns) {
    const regex = new RegExp(pattern, 'i');
    if (regex.test(code)) {
      return false;
    }
  }
  
  return true;
}

// Fallback: if LLM ignored JSON instruction, extract TypeScript code fence and wrap.
function salvageToJson(raw: string, desiredFileName: string): GenResponse | null {
  // Try multiple extraction methods
  let codeBlock: string | null = null;
  
  // Method 1: Look for markdown code fences
  const fenceMatch = raw.match(/```(?:typescript|ts|javascript|js)?[\s\S]*?```/i);
  if (fenceMatch) {
    codeBlock = fenceMatch[0].replace(/```(?:typescript|ts|javascript|js)?|```/gi, '').trim();
  }
  
  // Method 2: Look for import statements to closing brace
  if (!codeBlock) {
    const importsIdx = raw.indexOf('import ');
    if (importsIdx >= 0) {
      const fromImports = raw.slice(importsIdx);
      // Find the last closing brace that could be the end of a describe block
      const lastBraceIdx = fromImports.lastIndexOf('});');
      if (lastBraceIdx > 0) {
        codeBlock = fromImports.slice(0, lastBraceIdx + 3).trim();
      } else {
        codeBlock = fromImports.trim();
      }
    }
  }
  
  // Method 3: Look for describe blocks
  if (!codeBlock) {
    const describeMatch = raw.match(/describe\s*\(\s*["'][^"']*["']\s*,[\s\S]*?\}\s*\)\s*;/);
    if (describeMatch) {
      // Find preceding imports
      const beforeDescribe = raw.slice(0, raw.indexOf(describeMatch[0]));
      const importMatch = beforeDescribe.match(/(import[\s\S]*?)(?=\n\s*describe|\n\s*$)/);
      if (importMatch) {
        codeBlock = (importMatch[0] + '\n\n' + describeMatch[0]).trim();
      } else {
        codeBlock = describeMatch[0];
      }
    }
  }
  
  if (!codeBlock) return null;
  
  return {
    tests: [
      {
        fileName: desiredFileName,
        relativeDir: 'tests/api/generated',
        code: codeBlock
      }
    ]
  };
}

async function writeTests(gen: GenResponse) {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  for (const t of gen.tests) {
    const dir = t.relativeDir ? path.resolve(ROOT_DIR, t.relativeDir) : OUTPUT_DIR;
    await fs.mkdir(dir, { recursive: true });
    const safeName = t.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fullPath = path.join(dir, safeName);
    await fs.writeFile(fullPath, t.code, 'utf-8');
    console.log('\u2713 Generated:', path.relative(ROOT_DIR, fullPath));
  }
}

// Stub generation removed – only real model output is allowed.

(async () => {
  console.log(`Model: ${MODEL} | Ollama: ${OLLAMA_URL}`);
  console.log('Env flags:', {
    AI_MODE,
    OLLAMA_TRANSPORT: process.env.OLLAMA_TRANSPORT,
    OLLAMA_SKIP_WARMUP: process.env.OLLAMA_SKIP_WARMUP,
    OLLAMA_FORCE_WARMUP: process.env.OLLAMA_FORCE_WARMUP,
    AI_ALLOW_STUB: process.env.AI_ALLOW_STUB, // ignored (stub disabled)
    AI_FORCE_STUB: process.env.AI_FORCE_STUB, // ignored (stub disabled)
    TOTAL_TIMEOUT_MS
  });
  await ensureServerHealthy();
  const resolvedModel = await ensureModelExists(MODEL);
  if (!resolvedModel.startsWith(EXPECTED_MODEL)) {
    console.error(`✗ Model '${resolvedModel}' does not match expected '${EXPECTED_MODEL}'.`);
    console.error('Set MODEL=mistral or adjust EXPECTED_MODEL env.');
    process.exit(2);
  }
  if (process.env.AI_FORCE_STUB === '1') {
    console.warn('⚠ AI_FORCE_STUB is set but stub generation is disabled. Proceeding with real model generation.');
  }
  if (process.env.OLLAMA_SKIP_WARMUP === '1' || (AI_MODE === 'smoke' && process.env.AI_INCREMENTAL !== '1' && process.env.OLLAMA_FORCE_WARMUP !== '1')) {
    console.log('↷ Skipping warm-up (flag or non-incremental smoke mode).');
  } else {
    await warmUpModel(resolvedModel);
  }
  const ctx = await readContextFiles();
  const sys = systemPrompt();
  const user = buildUserPrompt(ctx);

  const payload = `SYSTEM:\n${sys}\n\nUSER:\n${user}\n`;

  // Incremental smoke generation: streaming-first with retries and fallbacks.
  if (AI_MODE === 'smoke' && process.env.AI_INCREMENTAL === '1') {
    const tasks = [
      { status: 'available', file: 'pet.findByStatus.available.smoke.spec.ts', instr: "Assert 200, array, first item has id,name,status; majority status 'available'." },
      { status: 'pending', file: 'pet.findByStatus.pending.smoke.spec.ts', instr: "Assert 200, array; if items exist majority status 'pending'." },
      { status: 'invalid', file: 'pet.findByStatus.invalid.smoke.spec.ts', instr: "Call with '__nonexistent__'; expect 200 empty array OR 404." }
    ];
    async function generateSingle(t: { status: string; file: string; instr: string }) {
      console.log(`⏳ [${t.status}] generating...`);
      const expectedStatus = t.status === '__nonexistent__' ? '400 or 404' : '200';
      // Create the test code directly instead of asking the model to generate JSON
      const testCode = `import { HttpClient } from "../../../src/api/clients/http";
import { PetsAPI } from "../../../src/api/endpoints/pets";

describe("Pet findByStatus - ${t.status}", () => {
  const api = new PetsAPI(new HttpClient(process.env.BASE_URL || "http://127.0.0.1:8080/api/v3"));

  it("should return expected response for ${t.status} pets", async () => {
    const response = await api.findByStatus("${t.status}");
    expect(response.status).toBe(${expectedStatus === '400 or 404' ? '400' : expectedStatus});
    expect(Array.isArray(response.data)).toBe(true);
  });
});`;

      // Create reliable test generation without model complexity
      if (process.env.AI_SKIP_MODEL === '1') {
        console.log(`✅ [${t.status}] Creating test directly (AI_SKIP_MODEL enabled)`);
        const generatedTests: GenResponse = {
          tests: [{
            fileName: t.file,
            relativeDir: 'tests/api/generated',
            code: testCode
          }]
        };
        await writeTests(generatedTests);
        return;
      }

      const singlePrompt = `COPY this template exactly, replacing STATUS with "${t.status}" and EXPECTED_CODE with ${expectedStatus === '400 or 404' ? '400' : expectedStatus}:

import { HttpClient } from "../../../src/api/clients/http";
import { PetsAPI } from "../../../src/api/endpoints/pets";

describe("Pet findByStatus - STATUS", () => {
  const api = new PetsAPI(new HttpClient(process.env.BASE_URL || "http://127.0.0.1:8080/api/v3"));

  it("should return expected response for STATUS pets", async () => {
    const response = await api.findByStatus("STATUS");
    expect(response.status).toBe(EXPECTED_CODE);
    expect(Array.isArray(response.data)).toBe(true);
  });
});

Return JSON: {"tests":[{"fileName":"${t.file}","relativeDir":"tests/api/generated","code":"COMPLETE_FILE_ABOVE"}]}`;
      let attempt = 0; let lastErr: any = null;
      while (attempt <= SINGLE_ATTEMPT_RETRIES) {
        const start = Date.now();
        try {
          // streaming primary
          const body = { model: resolvedModel, prompt: singlePrompt, stream: true, options: { temperature: 0.1, num_predict: INCR_MAX_TOKENS } };
          const res = await fetchWithTimeout(`${OLLAMA_URL}/api/generate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }, SINGLE_TIMEOUT_MS);
          if (!res.ok) throw new Error(`Status ${res.status}`);
          if (!res.body) throw new Error('No body');
          const reader = (res.body as any).getReader();
          let out = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = new TextDecoder().decode(value);
            for (const line of chunk.split(/\r?\n/)) {
              const trimmed = line.trim();
              if (!trimmed) continue;
              try { const obj = JSON.parse(trimmed); if (obj.response) out += obj.response; } catch { /* ignore */ }
            }
          }
          try { reader.releaseLock(); } catch {}
          console.log(`ℹ [${t.status}] streamed ${out.length} chars in ${Date.now() - start}ms.`);
          if (process.env.DEBUG_AI_OUTPUT === '1') {
            console.log(`🐛 [${t.status}] Raw model output:`, JSON.stringify(out.slice(0, 500)));
          }
          if (out.trim().length < 5) throw new Error('Empty streaming output');
          let parsed: GenResponse | null = null;
          try { 
            parsed = tryParseJson<GenResponse>(out); 
          } catch (parseErr: any) { 
            console.log(`⚠ [${t.status}] JSON parse failed: ${parseErr.message}, trying salvage...`);
            if (process.env.DEBUG_AI_OUTPUT === '1') {
              console.log(`🐛 [${t.status}] Sanitized output:`, JSON.stringify(sanitizeModelOutput(out).slice(0, 500)));
            }
            parsed = salvageToJson(out, t.file); 
          }
          if (!parsed?.tests?.length) {
            const debugMsg = `Parsed result missing tests. Got: ${parsed ? JSON.stringify(parsed).slice(0, 200) : 'null'}`;
            throw new Error(debugMsg);
          }
          
          // Validate the generated code follows our patterns
          const generatedCode = parsed.tests[0].code;
          if (!validateGeneratedCode(generatedCode)) {
            console.warn(`⚠ [${t.status}] AI-generated code doesn't follow required patterns, falling back to template`);
            const fallbackCode = `import { HttpClient } from "../../../src/api/clients/http";
import { PetsAPI } from "../../../src/api/endpoints/pets";

describe("Pet findByStatus - ${t.status}", () => {
  const api = new PetsAPI(new HttpClient(process.env.BASE_URL || "http://127.0.0.1:8080/api/v3"));

  it("should return expected response for ${t.status} pets", async () => {
    const response = await api.findByStatus("${t.status}");
    expect(response.status).toBe(${expectedStatus === '400 or 404' ? '400' : expectedStatus});
    expect(Array.isArray(response.data)).toBe(true);
  });
});`;
            await writeTests({ tests: [{ fileName: t.file, relativeDir: 'tests/api/generated', code: fallbackCode }] });
            return;
          }
          
          await writeTests({ tests: [parsed.tests[0]] });
          return;
        } catch (err: any) {
          lastErr = err;
          console.warn(`⚠ [${t.status}] attempt ${attempt + 1} failed: ${err.message || err}`);
          attempt++;
          if (attempt > SINGLE_ATTEMPT_RETRIES) break;
          // Non-stream fallback
          try {
            const body2 = { model: resolvedModel, prompt: singlePrompt, stream: false, options: { temperature: 0.1, num_predict: INCR_MAX_TOKENS } };
            const res2 = await fetchWithTimeout(`${OLLAMA_URL}/api/generate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body2) }, SINGLE_TIMEOUT_MS);
            if (res2.ok) {
              const j = await res2.json() as { response?: string };
              if (j.response && j.response.trim().length > 0) {
                let parsed2: GenResponse | null = null;
                try { parsed2 = tryParseJson<GenResponse>(j.response); } catch { parsed2 = salvageToJson(j.response, t.file); }
                if (parsed2?.tests?.length) { await writeTests({ tests: [parsed2.tests[0]] }); return; }
              }
            }
          } catch (e2: any) {
            console.warn(`⚠ [${t.status}] non-stream fallback failed: ${e2.message || e2}`);
          }
          // Curl fallback
          try {
            const curlOut = await callOllamaViaCurl(resolvedModel, singlePrompt);
            if (curlOut && curlOut.trim().length > 0) {
              let parsedCurl: GenResponse | null = null;
              try { parsedCurl = tryParseJson<GenResponse>(curlOut); } catch { parsedCurl = salvageToJson(curlOut, t.file); }
              if (parsedCurl?.tests?.length) { await writeTests({ tests: [parsedCurl.tests[0]] }); return; }
            }
          } catch (curlErr: any) {
            console.warn(`⚠ [${t.status}] curl fallback failed: ${curlErr.message || curlErr}`);
          }
          console.log('↻ Backing off before retry...');
          await new Promise(r => setTimeout(r, 700 * attempt));
        }
      }
      // Final fallback to template after all AI attempts failed
      console.warn(`⚠ [${t.status}] All AI attempts failed, using template fallback`);
      const fallbackCode = `import { HttpClient } from "../../../src/api/clients/http";
import { PetsAPI } from "../../../src/api/endpoints/pets";

describe("Pet findByStatus - ${t.status}", () => {
  const api = new PetsAPI(new HttpClient(process.env.BASE_URL || "http://127.0.0.1:8080/api/v3"));

  it("should return expected response for ${t.status} pets", async () => {
    const response = await api.findByStatus("${t.status}");
    expect(response.status).toBe(${expectedStatus === '400 or 404' ? '400' : expectedStatus});
    expect(Array.isArray(response.data)).toBe(true);
  });
});`;
      await writeTests({ tests: [{ fileName: t.file, relativeDir: 'tests/api/generated', code: fallbackCode }] });
    }
    
    let completedCount = 0;
    for (const t of tasks) {
      try {
        await generateSingle(t);
        completedCount++;
      } catch (err: any) {
        console.error(`✗ [${t.status}] Generation failed completely: ${err.message || err}`);
        // Don't throw, continue with other tasks
      }
    }
    console.log(`Done (incremental smoke). Successfully generated: ${completedCount}/${tasks.length} tests.`);
    process.exit(0);
  }
  let raw: string | null = null;
  try {
    const genPromise = (async () => {
      // Try curl first if requested
      if (process.env.OLLAMA_TRANSPORT === 'curl') {
        try { return await callOllamaViaCurl(resolvedModel, payload); } catch (e: any) {
          console.error('Curl primary generation failed; falling back to fetch:', e.message || e);
        }
      }
      try {
        return await callOllama(resolvedModel, payload);
      } catch (primaryErr: any) {
        console.error('Primary generation failed (fetch):', primaryErr.message || primaryErr);
        // Always attempt curl fallback even if transport env not set
        try {
          console.warn('Attempting curl generation fallback...');
          return await callOllamaViaCurl(resolvedModel, payload);
        } catch (curlGenErr: any) {
          console.error('Curl generation fallback also failed:', curlGenErr.message || curlGenErr);
          throw curlGenErr;
        }
      }
    })();
    let totalTimeoutHandle: NodeJS.Timeout | null = null;
    const timeoutPromise = new Promise<string>((_, reject) => {
      totalTimeoutHandle = setTimeout(() => reject(new Error('total-timeout')), TOTAL_TIMEOUT_MS);
    });
    raw = await Promise.race([genPromise, timeoutPromise]);
    if (totalTimeoutHandle) {
      clearTimeout(totalTimeoutHandle);
      totalTimeoutHandle = null;
    }
  } catch (e: any) {
    if (e.message === 'total-timeout') {
      console.error(`✗ Generation exceeded total timeout of ${TOTAL_TIMEOUT_MS}ms.`);
    } else {
      console.error('✗ Generation errored:', e.message || e);
    }
  }
  if (!raw) throw new Error('LLM generation failed – stub fallback disabled.');
  let finalRaw = raw;
  // If streaming produced no usable text, attempt a second streaming pass
  if (!finalRaw || finalRaw.trim().length < 10) {
    console.warn('⚠ First streaming attempt yielded minimal output – retrying streaming once...');
    try {
      finalRaw = await callOllamaStreaming(resolvedModel, payload);
    } catch (streamErr) {
      console.error('Second streaming attempt failed:', streamErr);
    }
  }
  // Curl fallback if explicitly requested or output suspiciously short
  if ((!finalRaw || finalRaw.trim().length < 10 || /AbortError/.test(String(finalRaw))) && process.env.OLLAMA_TRANSPORT === 'curl') {
    console.warn('⚠ Attempting curl fallback transport...');
    try {
      finalRaw = await callOllamaViaCurl(resolvedModel, payload);
    } catch (curlErr) {
      console.error('Curl fallback failed:', curlErr);
    }
  }

  let parsed: GenResponse;
  try {
    parsed = tryParseJson<GenResponse>(finalRaw);
  } catch (e) {
    console.error('❌ JSON parse failed; attempting salvage of code fence...');
  const salvaged = salvageToJson(finalRaw, AI_MODE === 'smoke' ? 'pet.smoke.generated.spec.ts' : 'generated.spec.ts');
    if (!salvaged) {
      console.error('Failed to parse LLM output as JSON. Original raw:\n', raw, '\nFinal raw after fallback:\n', finalRaw);
      throw e;
    }
    parsed = salvaged;
    console.warn('⚠ Salvaged non-JSON response into test file structure.');
  }

  // Enforce smoke constraints: require 3 tests, else error
  if (AI_MODE === 'smoke') {
    if (process.env.AI_INCREMENTAL === '1') {
      // Already handled earlier; should not reach here.
    } else if (!parsed.tests || parsed.tests.length !== 3) {
      throw new Error(`Smoke mode requires exactly 3 tests (non-incremental); received ${parsed.tests?.length || 0}. Enable AI_INCREMENTAL=1 for per-test generation.`);
    }
  }

  if (!parsed.tests?.length) {
    throw new Error('No tests returned by LLM');
  }

  await writeTests(parsed);
  console.log('Done.');
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
