# GitChat — Exhaustive Implementation Plan
## Version 1.0.0 | For AI-assisted construction

---

> **HOW TO USE THIS DOCUMENT**  
> Build phases in exact order. Each file has its exact path, all imports required, complete logic for non-trivial files, and precise interface specs for simpler ones. Every gotcha is called out with a ⚠️ warning. Do not deviate from file paths, package versions, or architectural decisions without explicit justification.

---

## PHASE 0: Prerequisites

### 0.1 Required System Dependencies

```bash
# 1. Node.js 20 LTS (REQUIRED — LanceDB and Xenova require Node 18+)
nvm install 20 && nvm use 20 && nvm alias default 20
node --version   # Must output v20.x.x

# 2. C++ Build Tools (REQUIRED — vectordb has native addons)
# macOS:
xcode-select --install
# Ubuntu/Debian:
sudo apt-get update && sudo apt-get install -y build-essential python3
# Windows: Install "Visual Studio Build Tools 2022" with C++ workload

# 3. Verify npm
npm --version   # Must be 9.x or 10.x
```

### 0.2 Project Root Structure

```
gitchat/
├── frontend/       (Vite + React SPA)
├── backend/        (Express.js API)
├── package.json    (root workspace scripts)
├── .gitignore
└── README.md
```

Create the root:
```bash
mkdir gitchat && cd gitchat
mkdir frontend backend
```

### 0.3 Root `package.json`

```json
{
  "name": "gitchat-workspace",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "concurrently \"npm run dev --prefix frontend\" \"npm run dev --prefix backend\" --names \"FRONTEND,BACKEND\" --prefix-colors \"cyan,green\"",
    "install:all": "npm install --prefix frontend && npm install --prefix backend",
    "start:frontend": "npm run dev --prefix frontend",
    "start:backend": "npm run dev --prefix backend"
  },
  "devDependencies": {
    "concurrently": "^9.0.0"
  }
}
```

```bash
# In gitchat/ root:
npm install
```

### 0.4 Root `.gitignore`

```gitignore
node_modules/
.env
.env.local
vector_store/
dist/
build/
.cache/
.DS_Store
Thumbs.db
.vscode/
.idea/
*.swp
*.log
npm-debug.log*
```

---

## PHASE 1: Backend — Project Scaffold

### 1.1 Initialize `backend/package.json`

```bash
cd backend
npm init -y
```

Edit `backend/package.json` to exactly:

```json
{
  "name": "gitchat-backend",
  "version": "1.0.0",
  "type": "module",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "lint": "eslint src/",
    "format": "prettier --write src/"
  }
}
```

> ⚠️ **CRITICAL**: `"type": "module"` is required. All backend files use `import`/`export` ES module syntax. No `require()`.

### 1.2 Install All Backend Packages

Run in exact order:

```bash
# Web framework + middleware
npm install express cors helmet morgan compression

# Rate limiting + env
npm install express-rate-limit dotenv

# GitHub API client
npm install @octokit/rest

# Local embedding model (downloads ~23MB model on first run — cached after)
npm install @xenova/transformers

# Vector database (requires C++ build tools installed first!)
npm install vectordb
# If build fails on macOS Apple Silicon: npm install vectordb --build-from-source --arch=arm64
# If build fails on Linux: npm install --build-from-source vectordb

# Anthropic SDK
npm install @anthropic-ai/sdk

# Utilities
npm install uuid zod

# Dev deps
npm install -D nodemon eslint prettier
```

### 1.3 Create Backend Directory Structure

```bash
mkdir -p src/{routes,services,middleware,utils,schemas}
touch src/{app.js,server.js}
touch src/routes/{repo.js,chat.js}
touch src/services/{githubService.js,chunkingService.js,embeddingService.js,vectorStoreService.js,llmService.js}
touch src/middleware/{errorHandler.js,rateLimiter.js,validateRequest.js,sseMiddleware.js}
touch src/utils/{urlParser.js,fileFilter.js,sessionManager.js,logger.js,tokenCounter.js}
touch src/schemas/{repoSchemas.js,chatSchemas.js}
touch src/errors.js
touch .env .env.example nodemon.json
```

### 1.4 `backend/nodemon.json`

```json
{
  "watch": ["src"],
  "ext": "js,json",
  "ignore": ["src/tests/*", "vector_store/*"],
  "delay": 200,
  "env": { "NODE_ENV": "development" }
}
```

### 1.5 `backend/.env.example`

```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

ANTHROPIC_API_KEY=your_anthropic_api_key_here
GITHUB_TOKEN=your_github_token_here_optional

SESSION_TTL_MINUTES=30
MAX_REPO_SIZE_MB=200
MAX_FILE_SIZE_KB=1000
MAX_FILES_TO_PROCESS=1000

CHUNK_SIZE=1500
CHUNK_OVERLAP=200
TOP_K_RESULTS=5
MIN_RELEVANCE_SCORE=0.30
MAX_HISTORY_TURNS=6

VECTOR_STORE_PATH=./vector_store
EMBEDDING_MODEL=Xenova/all-MiniLM-L6-v2
EMBEDDING_BATCH_SIZE=16

LLM_MODEL=claude-sonnet-4-20250514
LLM_MAX_TOKENS=2048
LLM_TEMPERATURE=0.2
```

Copy to `.env` and fill real values before running.

---

## PHASE 2: Backend — Utilities

### 2.1 `src/errors.js`

All custom error classes. Other services `throw` these; the global handler catches them.

```javascript
// src/errors.js
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
  }
}

export class RepoNotFoundError extends AppError {
  constructor() { super('Repository not found. Please check the URL.', 404, 'REPO_NOT_FOUND'); }
}

export class RepoPrivateError extends AppError {
  constructor() { super('Repository is private. GitChat only works with public repositories.', 403, 'REPO_PRIVATE'); }
}

export class RepoEmptyError extends AppError {
  constructor() { super('Repository has no processable files.', 422, 'REPO_EMPTY'); }
}

export class RateLimitError extends AppError {
  constructor(message, retryAfter) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.retryAfter = retryAfter;
  }
}

export class SessionNotFoundError extends AppError {
  constructor() { super('Session not found or expired.', 404, 'SESSION_NOT_FOUND'); }
}

export class EmbeddingError extends AppError {
  constructor(msg = 'Embedding generation failed.') { super(msg, 500, 'EMBEDDING_ERROR'); }
}

export class ValidationError extends AppError {
  constructor(msg) { super(msg, 400, 'VALIDATION_ERROR'); }
}
```

### 2.2 `src/utils/logger.js`

```javascript
// src/utils/logger.js
const pad = (n) => String(n).padStart(2, '0');

function timestamp() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export const logger = {
  info:  (...args) => console.log(`\x1b[36m[${timestamp()}] INFO\x1b[0m`, ...args),
  warn:  (...args) => console.warn(`\x1b[33m[${timestamp()}] WARN\x1b[0m`, ...args),
  error: (...args) => console.error(`\x1b[31m[${timestamp()}] ERROR\x1b[0m`, ...args),
  debug: (...args) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`\x1b[90m[${timestamp()}] DEBUG\x1b[0m`, ...args);
    }
  }
};
```

### 2.3 `src/utils/urlParser.js`

```javascript
// src/utils/urlParser.js
// Shared URL normalization logic (same logic used on frontend too)

/**
 * Parse a GitHub URL string into { owner, repo, branch }
 * Returns null if the input is not a valid GitHub URL.
 * Accepts all formats listed in PRD §6.1.
 */
export function parseGitHubUrl(input) {
  if (!input || typeof input !== 'string') return null;

  let url = input.trim();

  // Prepend protocol if missing
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  // Coerce http to https
  url = url.replace(/^http:\/\//, 'https://');

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  // Host must be github.com or www.github.com
  if (!['github.com', 'www.github.com'].includes(parsed.hostname)) {
    return null;
  }

  // Strip trailing slashes and .git suffix from pathname
  const path = parsed.pathname.replace(/\.git$/, '').replace(/\/$/, '');

  // Split: ['', 'owner', 'repo', 'tree'|'blob', 'branchOrRef', ...rest]
  const parts = path.split('/').filter(Boolean);

  if (parts.length < 2) return null;

  const owner = parts[0];
  const repo = parts[1];
  let branch = null;

  // Extract branch from /tree/{branch} or /blob/{branch}/...
  if (parts.length >= 4 && (parts[2] === 'tree' || parts[2] === 'blob')) {
    branch = parts[3];
  }

  // Validate owner: alphanumeric + hyphens, 1-39 chars, can't start/end with hyphen
  if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(owner) &&
      !/^[a-zA-Z0-9]$/.test(owner)) {
    return null;
  }

  // Validate repo: alphanumeric + hyphens + dots + underscores, 1-100 chars
  if (!/^[a-zA-Z0-9._-]{1,100}$/.test(repo)) {
    return null;
  }

  return { owner, repo, branch };
}
```

### 2.4 `src/utils/fileFilter.js`

This is the full include/exclude filter logic. Reference this when processing the GitHub file tree.

```javascript
// src/utils/fileFilter.js

// All text-based source file extensions to include
const INCLUDE_EXTENSIONS = new Set([
  // Source code
  '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.py', '.pyw',
  '.java', '.go', '.rs', '.cpp', '.cxx', '.cc', '.c', '.h', '.hpp',
  '.cs', '.rb', '.php', '.swift', '.kt', '.kts', '.scala', '.r', '.R',
  '.m', '.mm', '.lua', '.dart', '.ex', '.exs', '.erl', '.hs', '.clj',
  '.cljs', '.ml', '.mli', '.jl', '.nim', '.zig', '.v', '.vhd', '.pl', '.pm',
  // Scripts & automation
  '.sh', '.bash', '.zsh', '.fish', '.ps1', '.psm1', '.bat', '.cmd',
  // Documentation & markup
  '.md', '.mdx', '.rst', '.txt', '.adoc', '.asciidoc', '.tex', '.wiki',
  // Config
  '.json', '.jsonc', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf',
  '.xml', '.properties', '.gradle', '.cmake', '.bazel', '.bzl',
  // Web
  '.html', '.htm', '.css', '.scss', '.sass', '.less', '.svg', '.vue', '.svelte',
  // Data (size-gated separately at 100KB in fileFilter function)
  '.csv', '.tsv',
]);

// Special filenames (no extension) to include
const INCLUDE_FILENAMES = new Set([
  'Makefile', 'Dockerfile', 'Jenkinsfile', 'Gemfile', 'Rakefile',
  'Procfile', 'Brewfile', 'CMakeLists.txt', '.editorconfig',
  '.eslintrc', '.prettierrc', '.babelrc', '.nvmrc', 'BUILD',
]);

// Files to explicitly exclude regardless of extension
const EXCLUDE_FILENAMES = new Set([
  'package-lock.json', 'yarn.lock', 'poetry.lock', 'Pipfile.lock',
  'Cargo.lock', 'composer.lock', 'pnpm-lock.yaml', 'bun.lockb',
]);

// Patterns to exclude (checked against full path)
const EXCLUDE_PATTERNS = [
  /\.min\.js$/,
  /\.min\.css$/,
  /\.map$/,
  /\.snap$/,      // Jest snapshots
  /\.d\.ts$/,     // TypeScript declaration files
];

/**
 * Determine whether a file from the GitHub tree should be processed.
 * @param {string} filePath - Relative file path in the repo (e.g., "src/utils/auth.js")
 * @param {number} fileSizeBytes - File size in bytes
 * @returns {{ include: boolean, reason?: string }}
 */
export function shouldIncludeFile(filePath, fileSizeBytes) {
  const fileName = filePath.split('/').pop();
  const ext = getExtension(filePath);

  // Explicit exclude by filename
  if (EXCLUDE_FILENAMES.has(fileName)) {
    return { include: false, reason: 'lock file or generated file' };
  }

  // Explicit exclude by pattern
  for (const pattern of EXCLUDE_PATTERNS) {
    if (pattern.test(filePath)) {
      return { include: false, reason: 'excluded pattern (minified, map, or declaration file)' };
    }
  }

  // Exclude files that are too large (> 1MB)
  const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE_KB || '1000') * 1024;
  if (fileSizeBytes > MAX_FILE_SIZE) {
    return { include: false, reason: `file exceeds ${MAX_FILE_SIZE / 1024}KB size limit` };
  }

  // Check if special filename (no extension match needed)
  if (INCLUDE_FILENAMES.has(fileName)) {
    return { include: true };
  }

  // Check extension
  if (!ext) {
    // No extension — will need binary detection after fetching content
    return { include: true, needsBinaryCheck: true };
  }

  // Data files: cap at 100KB
  if (['.csv', '.tsv'].includes(ext)) {
    if (fileSizeBytes > 100 * 1024) {
      return { include: false, reason: 'data file exceeds 100KB limit' };
    }
    return { include: true };
  }

  if (!INCLUDE_EXTENSIONS.has(ext)) {
    return { include: false, reason: 'unsupported extension' };
  }

  return { include: true };
}

/**
 * Detect if a string content is binary by checking for null bytes in first 512 chars.
 */
export function isBinaryContent(content) {
  const sample = content.slice(0, 512);
  return sample.includes('\0');
}

/**
 * Get lowercase file extension including the dot, or empty string.
 */
function getExtension(filePath) {
  const lastDot = filePath.lastIndexOf('.');
  const lastSlash = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'));
  if (lastDot > lastSlash && lastDot < filePath.length - 1) {
    return filePath.slice(lastDot).toLowerCase();
  }
  return '';
}

/**
 * Detect primary programming language from a list of file extensions.
 * Returns sorted array of detected language names.
 */
export function detectLanguages(filePaths) {
  const extToLang = {
    '.js': 'JavaScript', '.mjs': 'JavaScript', '.cjs': 'JavaScript', '.jsx': 'JavaScript',
    '.ts': 'TypeScript', '.tsx': 'TypeScript',
    '.py': 'Python', '.pyw': 'Python',
    '.java': 'Java',
    '.go': 'Go',
    '.rs': 'Rust',
    '.cpp': 'C++', '.cxx': 'C++', '.cc': 'C++', '.h': 'C/C++ Header',
    '.c': 'C',
    '.cs': 'C#',
    '.rb': 'Ruby',
    '.php': 'PHP',
    '.swift': 'Swift',
    '.kt': 'Kotlin', '.kts': 'Kotlin',
    '.scala': 'Scala',
    '.r': 'R', '.R': 'R',
    '.lua': 'Lua',
    '.dart': 'Dart',
    '.ex': 'Elixir', '.exs': 'Elixir',
    '.hs': 'Haskell',
    '.md': 'Markdown', '.mdx': 'Markdown',
    '.html': 'HTML', '.htm': 'HTML',
    '.css': 'CSS', '.scss': 'SCSS', '.sass': 'Sass',
    '.vue': 'Vue',
    '.svelte': 'Svelte',
    '.yaml': 'YAML', '.yml': 'YAML',
    '.toml': 'TOML',
    '.json': 'JSON',
    '.sh': 'Shell', '.bash': 'Shell', '.zsh': 'Shell',
    '.sql': 'SQL',
  };

  const counts = {};
  for (const path of filePaths) {
    const ext = getExtension(path);
    const lang = extToLang[ext];
    if (lang) counts[lang] = (counts[lang] || 0) + 1;
  }

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([lang]) => lang);
}

/**
 * Map file extension to language name for chunk metadata.
 */
export function extensionToLanguage(ext) {
  const map = {
    '.js': 'JavaScript', '.mjs': 'JavaScript', '.cjs': 'JavaScript', '.jsx': 'JavaScript',
    '.ts': 'TypeScript', '.tsx': 'TypeScript',
    '.py': 'Python', '.pyw': 'Python',
    '.java': 'Java', '.go': 'Go', '.rs': 'Rust',
    '.cpp': 'C++', '.cxx': 'C++', '.cc': 'C++', '.c': 'C',
    '.h': 'C/C++ Header', '.hpp': 'C/C++ Header',
    '.cs': 'C#', '.rb': 'Ruby', '.php': 'PHP', '.swift': 'Swift',
    '.kt': 'Kotlin', '.kts': 'Kotlin', '.scala': 'Scala',
    '.r': 'R', '.R': 'R', '.lua': 'Lua', '.dart': 'Dart',
    '.ex': 'Elixir', '.exs': 'Elixir', '.hs': 'Haskell',
    '.md': 'Markdown', '.mdx': 'Markdown', '.rst': 'reStructuredText',
    '.html': 'HTML', '.htm': 'HTML',
    '.css': 'CSS', '.scss': 'SCSS', '.sass': 'Sass', '.less': 'Less',
    '.vue': 'Vue', '.svelte': 'Svelte',
    '.yaml': 'YAML', '.yml': 'YAML',
    '.toml': 'TOML', '.json': 'JSON', '.jsonc': 'JSON',
    '.sh': 'Shell', '.bash': 'Shell', '.zsh': 'Shell', '.fish': 'Shell',
    '.sql': 'SQL', '.xml': 'XML', '.svg': 'SVG',
    '.txt': 'Text', '.csv': 'CSV', '.tsv': 'TSV',
  };
  return map[ext?.toLowerCase()] || 'Unknown';
}
```

### 2.5 `src/utils/sessionManager.js`

```javascript
// src/utils/sessionManager.js
import { logger } from './logger.js';

const sessions = new Map();

export function createSession(sessionId, repoInfo) {
  sessions.set(sessionId, {
    sessionId,
    repoInfo,
    createdAt: Date.now(),
    lastActivityAt: Date.now(),
  });
  logger.info(`[Session] Created: ${sessionId} for ${repoInfo.fullName}`);
}

export function touchSession(sessionId) {
  const session = sessions.get(sessionId);
  if (session) {
    session.lastActivityAt = Date.now();
    return true;
  }
  return false;
}

export function getSession(sessionId) {
  return sessions.get(sessionId) || null;
}

export function deleteSession(sessionId) {
  const existed = sessions.has(sessionId);
  sessions.delete(sessionId);
  if (existed) logger.info(`[Session] Deleted: ${sessionId}`);
  return existed;
}

export function getAllSessionIds() {
  return Array.from(sessions.keys());
}

// Cleanup timer: runs every 5 minutes, evicts expired sessions
function startCleanupTimer() {
  setInterval(async () => {
    const ttlMs = parseInt(process.env.SESSION_TTL_MINUTES || '30') * 60 * 1000;
    const now = Date.now();
    for (const [id, session] of sessions.entries()) {
      if (now - session.lastActivityAt > ttlMs) {
        sessions.delete(id);
        // Async cleanup of vector data — import lazily to avoid circular deps
        try {
          const { VectorStoreService } = await import('../services/vectorStoreService.js');
          await VectorStoreService.deleteSession(id);
        } catch (err) {
          logger.warn(`[Session] Failed to cleanup vectors for ${id}:`, err.message);
        }
        logger.info(`[Session] Expired and cleaned: ${id}`);
      }
    }
  }, 5 * 60 * 1000);
}

startCleanupTimer();
```

### 2.6 `src/utils/tokenCounter.js`

```javascript
// src/utils/tokenCounter.js
/**
 * Rough character-to-token estimator.
 * Rule of thumb: ~4 chars per token for English/code text.
 */
export function estimateTokens(text) {
  return Math.ceil((text?.length || 0) / 4);
}

export function estimatePromptTokens(systemPrompt, messages) {
  let total = estimateTokens(systemPrompt);
  for (const msg of messages) {
    total += estimateTokens(msg.content) + 4; // 4 tokens overhead per message
  }
  return total;
}
```

---

## PHASE 3: Backend — Schemas & Middleware

### 3.1 `src/schemas/repoSchemas.js`

```javascript
// src/schemas/repoSchemas.js
import { z } from 'zod';

export const IngestRequestSchema = z.object({
  repoUrl: z.string().min(1, 'repoUrl is required').max(500),
  sessionId: z.string().uuid('sessionId must be a valid UUID v4'),
});

export const SessionIdParamSchema = z.object({
  sessionId: z.string().uuid('sessionId must be a valid UUID v4'),
});
```

### 3.2 `src/schemas/chatSchemas.js`

```javascript
// src/schemas/chatSchemas.js
import { z } from 'zod';

const HistoryMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().max(4000),
});

export const ChatMessageRequestSchema = z.object({
  sessionId: z.string().uuid('sessionId must be a valid UUID v4'),
  message: z.string().min(1).max(2000).trim(),
  history: z.array(HistoryMessageSchema).max(12).default([]),
});
```

### 3.3 `src/middleware/errorHandler.js`

```javascript
// src/middleware/errorHandler.js
import { logger } from '../utils/logger.js';

export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const response = {
    error: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR',
  };

  if (err.retryAfter) response.retryAfter = err.retryAfter;

  if (!err.isOperational) {
    logger.error('[Unhandled Error]', err);
  }

  res.status(statusCode).json(response);
}
```

### 3.4 `src/middleware/rateLimiter.js`

```javascript
// src/middleware/rateLimiter.js
import rateLimit from 'express-rate-limit';

export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.', code: 'RATE_LIMITED' },
});

export const ingestionRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15,
  message: { error: 'Too many repository ingestions. Try again later.', code: 'RATE_LIMITED' },
});

export const chatRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 40,
  message: { error: 'Sending too fast. Please wait a moment.', code: 'RATE_LIMITED' },
});
```

### 3.5 `src/middleware/validateRequest.js`

```javascript
// src/middleware/validateRequest.js
import { ValidationError } from '../errors.js';

/**
 * Middleware factory: validates req.body against a Zod schema.
 * Throws ValidationError (→ 400) if invalid.
 */
export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
      return next(new ValidationError(message));
    }
    req.body = result.data; // Replace with coerced/trimmed values
    next();
  };
}

/**
 * Middleware factory: validates req.params against a Zod schema.
 */
export function validateParams(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      const message = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
      return next(new ValidationError(message));
    }
    req.params = result.data;
    next();
  };
}
```

### 3.6 `src/middleware/sseMiddleware.js`

```javascript
// src/middleware/sseMiddleware.js

/**
 * Sets SSE response headers and adds res.sendEvent() helper.
 * Call this at the top of any SSE endpoint handler.
 */
export function initSSE(req, res) {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',    // Disables nginx proxy buffering
    'Access-Control-Allow-Origin': process.env.FRONTEND_URL || 'http://localhost:5173',
  });
  res.flushHeaders(); // Critical: sends headers immediately so the client opens the stream

  /**
   * Send a single SSE event with JSON payload.
   * @param {object} data - JSON-serializable object
   */
  res.sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    // Flush if res.flush exists (compression middleware can buffer)
    if (typeof res.flush === 'function') res.flush();
  };

  // Handle client disconnect
  const cleanup = () => {
    if (!res.writableEnded) res.end();
  };
  req.on('close', cleanup);
  req.on('aborted', cleanup);
}
```

---

## PHASE 4: Backend — Services

### 4.1 `src/services/githubService.js`

```javascript
// src/services/githubService.js
import { Octokit } from '@octokit/rest';
import { RepoNotFoundError, RepoPrivateError, RateLimitError } from '../errors.js';
import { logger } from '../utils/logger.js';

class GitHubService {
  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN || undefined,
      userAgent: 'GitChat/1.0.0',
    });
  }

  /**
   * Fetch repository metadata from GitHub.
   * Throws RepoNotFoundError, RepoPrivateError, or RateLimitError.
   */
  async getRepoInfo(owner, repo) {
    try {
      const { data } = await this.octokit.repos.get({ owner, repo });
      return {
        owner: data.owner.login,
        name: data.name,
        fullName: data.full_name,
        description: data.description || '',
        stars: data.stargazers_count,
        primaryLanguage: data.language || 'Unknown',
        defaultBranch: data.default_branch,
        sizeKB: data.size,
        isPrivate: data.private,
        isArchived: data.archived,
        htmlUrl: data.html_url,
      };
    } catch (err) {
      if (err.status === 404) throw new RepoNotFoundError();
      if (err.status === 403) {
        if (err.response?.headers?.['x-ratelimit-remaining'] === '0') {
          const resetAt = parseInt(err.response.headers['x-ratelimit-reset'] || '0') * 1000;
          const waitSec = Math.ceil((resetAt - Date.now()) / 1000);
          throw new RateLimitError(`GitHub rate limit exceeded. Resets in ${waitSec}s`, resetAt);
        }
        throw new RepoPrivateError();
      }
      throw err;
    }
  }

  /**
   * Fetch the full recursive file tree for a repo.
   * Returns an array of blob entries: [{ path, size, sha, url }]
   */
  async getFileTree(owner, repo, branch = null) {
    // Step 1: resolve branch
    const repoData = await this.octokit.repos.get({ owner, repo });
    const targetBranch = branch || repoData.data.default_branch;

    // Step 2: get HEAD commit tree SHA
    const branchData = await this.octokit.repos.getBranch({ owner, repo, branch: targetBranch });
    const treeSha = branchData.data.commit.commit.tree.sha;

    // Step 3: fetch full tree recursively (single API call)
    const treeResponse = await this.octokit.git.getTree({
      owner, repo,
      tree_sha: treeSha,
      recursive: '1',
    });

    if (treeResponse.data.truncated) {
      logger.warn(`[GitHub] File tree truncated for ${owner}/${repo} — repo may be very large`);
    }

    // Return only file entries (type === 'blob'), excluding trees (directories)
    return treeResponse.data.tree
      .filter(item => item.type === 'blob')
      .map(item => ({ path: item.path, size: item.size || 0, sha: item.sha, url: item.url }));
  }

  /**
   * Fetch individual file content (returns decoded UTF-8 string).
   * GitHub API returns base64-encoded content.
   */
  async getFileContent(owner, repo, path) {
    const response = await this.octokit.repos.getContent({ owner, repo, path });
    if (response.data.type !== 'file') throw new Error(`Not a file: ${path}`);
    const content = response.data.content; // base64 encoded
    return Buffer.from(content, 'base64').toString('utf-8');
  }

  /**
   * Fetch multiple files in parallel batches of `batchSize`.
   * Calls onProgress(processedCount, totalCount, lastFilePath) after each batch.
   * Returns a Map<filePath, content>.
   * Files that fail to fetch are silently skipped (counted in skippedFiles).
   */
  async getFilesInBatches(owner, repo, paths, onProgress, batchSize = 5) {
    const results = new Map();
    const skippedFiles = [];

    for (let i = 0; i < paths.length; i += batchSize) {
      const batch = paths.slice(i, i + batchSize);

      // Rate limit check before each batch
      try {
        const { data: rateLimit } = await this.octokit.rateLimit.get();
        const remaining = rateLimit.resources.core.remaining;
        if (remaining < 20) {
          const resetAt = rateLimit.resources.core.reset * 1000;
          const waitSec = Math.ceil((resetAt - Date.now()) / 1000);
          throw new RateLimitError(
            `GitHub API rate limit nearly exhausted (${remaining} remaining). Reset in ${waitSec}s.`,
            resetAt
          );
        }
      } catch (err) {
        if (err.code === 'RATE_LIMIT_EXCEEDED') throw err;
        // If rate limit check itself fails, proceed anyway
      }

      // Fetch batch in parallel
      const batchResults = await Promise.allSettled(
        batch.map(path => this.getFileContent(owner, repo, path))
      );

      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.set(batch[index], result.value);
        } else {
          skippedFiles.push(batch[index]);
          logger.debug(`[GitHub] Skipped ${batch[index]}: ${result.reason?.message}`);
        }
      });

      onProgress(
        Math.min(i + batchSize, paths.length),
        paths.length,
        batch[batch.length - 1]
      );
    }

    return { contents: results, skippedFiles };
  }
}

// Export as singleton
export const githubService = new GitHubService();
```

### 4.2 `src/services/chunkingService.js`

```javascript
// src/services/chunkingService.js
import { v4 as uuidv4 } from 'uuid';
import { extensionToLanguage } from '../utils/fileFilter.js';

const CHUNK_SIZE = parseInt(process.env.CHUNK_SIZE || '1500');
const CHUNK_OVERLAP = parseInt(process.env.CHUNK_OVERLAP || '200');
const MIN_CHUNK_SIZE = 100;

// Separators tried in priority order (most preferred first)
const SEPARATORS = ['\n\n', '\n', '. ', ' ', ''];

/**
 * Recursively split text into chunks of <= maxSize using a priority list of separators.
 */
function recursiveSplit(text, separatorIndex, maxSize, overlap) {
  if (text.length <= maxSize) return [text];
  if (separatorIndex >= SEPARATORS.length) {
    // Last resort: character-level split
    const chunks = [];
    for (let i = 0; i < text.length; i += maxSize - overlap) {
      chunks.push(text.slice(i, i + maxSize));
    }
    return chunks;
  }

  const sep = SEPARATORS[separatorIndex];
  if (!sep) return recursiveSplit(text, separatorIndex + 1, maxSize, overlap);

  const parts = text.split(sep);
  const result = [];
  let current = '';

  for (const part of parts) {
    const candidate = current ? current + sep + part : part;
    if (candidate.length <= maxSize) {
      current = candidate;
    } else {
      if (current.length >= MIN_CHUNK_SIZE) {
        result.push(current);
      }
      // Check if this part itself needs splitting
      if (part.length > maxSize) {
        const subChunks = recursiveSplit(part, separatorIndex + 1, maxSize, overlap);
        result.push(...subChunks.slice(0, -1));
        current = subChunks[subChunks.length - 1];
      } else {
        current = part;
      }
    }
  }

  if (current.length >= MIN_CHUNK_SIZE) {
    result.push(current);
  } else if (result.length > 0 && current.length > 0) {
    // Merge tiny trailing chunk into previous
    result[result.length - 1] += sep + current;
  }

  return result.filter(c => c.trim().length > 0);
}

/**
 * Add overlap between consecutive chunks.
 * Takes the last `overlap` characters of chunk[i] and prepends to chunk[i+1].
 */
function addOverlap(chunks, overlap) {
  if (overlap <= 0 || chunks.length <= 1) return chunks;
  const result = [chunks[0]];
  for (let i = 1; i < chunks.length; i++) {
    const prev = chunks[i - 1];
    const overlapText = prev.slice(-overlap);
    result.push(overlapText + chunks[i]);
  }
  return result;
}

/**
 * Chunk a single file's content into overlapping text segments.
 * @param {string} sessionId
 * @param {string} filePath - Relative path in repo
 * @param {string} content - Full file text content
 * @returns {Array<ChunkObject>}
 */
export function chunkFile(sessionId, filePath, content) {
  if (!content || content.trim().length < MIN_CHUNK_SIZE) return [];

  const fileName = filePath.split('/').pop();
  const ext = (() => {
    const i = fileName.lastIndexOf('.');
    return i > 0 ? fileName.slice(i).toLowerCase() : '';
  })();
  const language = extensionToLanguage(ext);

  // Smaller chunks for large files (> 100KB content)
  const maxSize = content.length > 100000 ? 800 : CHUNK_SIZE;

  const rawChunks = recursiveSplit(content, 0, maxSize, 0);
  const chunksWithOverlap = addOverlap(rawChunks, CHUNK_OVERLAP);

  // Calculate character offsets
  let charPos = 0;
  return chunksWithOverlap.map((chunkContent, index) => {
    const startChar = charPos;
    const endChar = startChar + chunkContent.length;
    // Advance position by the original chunk size (before overlap was added)
    charPos = index < rawChunks.length - 1
      ? startChar + rawChunks[index].length
      : endChar;

    return {
      id: uuidv4(),
      sessionId,
      filePath,
      fileName,
      extension: ext,
      language,
      chunkIndex: index,
      totalChunks: chunksWithOverlap.length,
      startChar,
      endChar,
      content: chunkContent.trim(),
    };
  }).filter(c => c.content.length >= MIN_CHUNK_SIZE);
}

/**
 * Chunk all files for a session.
 * @param {string} sessionId
 * @param {Map<string, string>} fileContents - Map of filePath → content
 * @returns {Array<ChunkObject>}
 */
export function chunkAllFiles(sessionId, fileContents) {
  const allChunks = [];
  for (const [filePath, content] of fileContents.entries()) {
    const chunks = chunkFile(sessionId, filePath, content);
    allChunks.push(...chunks);
  }
  return allChunks;
}
```

### 4.3 `src/services/embeddingService.js`

> ⚠️ **CRITICAL**: Use the singleton pattern below exactly. Loading the pipeline multiple times crashes Node.js with `@xenova/transformers`.

```javascript
// src/services/embeddingService.js
import { EmbeddingError } from '../errors.js';
import { logger } from '../utils/logger.js';

const MODEL_NAME = process.env.EMBEDDING_MODEL || 'Xenova/all-MiniLM-L6-v2';
const BATCH_SIZE = parseInt(process.env.EMBEDDING_BATCH_SIZE || '16');

// ⚠️ Import is deferred to avoid top-level await issues with ESM
let pipelineInstance = null;
let initPromise = null;

async function loadModel() {
  if (pipelineInstance) return pipelineInstance;

  logger.info(`[Embedding] Loading model: ${MODEL_NAME}`);

  // Dynamic import to work around ESM top-level await restrictions
  const { pipeline, env } = await import('@xenova/transformers');

  // Configure for Node.js environment
  env.backends.onnx.wasm.numThreads = 1;  // Stability: single thread for ONNX in Node
  env.allowLocalModels = false;            // Always fetch from HuggingFace Hub
  env.useBrowserCache = false;             // Node.js: no browser cache

  pipelineInstance = await pipeline('feature-extraction', MODEL_NAME, {
    quantized: true,  // Use quantized ONNX model (~23MB) — faster to load
  });

  logger.info('[Embedding] Model ready');
  return pipelineInstance;
}

export const EmbeddingService = {
  /**
   * Initialize the model (call this on server startup to pre-warm).
   */
  async initialize() {
    if (!initPromise) {
      initPromise = loadModel();
    }
    await initPromise;
  },

  /**
   * Embed a single text string.
   * @param {string} text
   * @returns {Promise<number[]>} float32 array of length 384
   */
  async embed(text) {
    const pipe = await loadModel();
    // Truncate to ~1000 chars (~256 tokens) — model's max sequence length
    const truncated = (text || '').trim().slice(0, 1000);
    try {
      const output = await pipe(truncated, { pooling: 'mean', normalize: true });
      return Array.from(output.data);  // Convert Float32Array → regular JS array
    } catch (err) {
      throw new EmbeddingError(`Embedding failed: ${err.message}`);
    }
  },

  /**
   * Embed an array of texts in batches.
   * @param {string[]} texts
   * @returns {Promise<number[][]>}
   */
  async embedBatch(texts) {
    const results = [];
    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(batch.map(t => this.embed(t)));
      results.push(...batchResults);
    }
    return results;
  },
};
```

### 4.4 `src/services/vectorStoreService.js`

> ⚠️ **CRITICAL**: `vectordb` v0.4.x API. Do not use `@lancedb/lancedb` (different package). The `connect`, `createTable`, `openTable`, `add`, `vectorSearch`, and `delete` APIs are from the `vectordb` package.

```javascript
// src/services/vectorStoreService.js
import path from 'path';
import { logger } from '../utils/logger.js';

const VECTOR_STORE_PATH = process.env.VECTOR_STORE_PATH || './vector_store';
const TABLE_NAME = 'chunks';
const TOP_K = parseInt(process.env.TOP_K_RESULTS || '5');
const MIN_SCORE = parseFloat(process.env.MIN_RELEVANCE_SCORE || '0.30');

let db = null;
let table = null;

export const VectorStoreService = {
  /**
   * Initialize LanceDB connection. Call once on server startup.
   */
  async initialize() {
    // Lazy import to avoid issues before model initialization
    const { connect } = await import('vectordb');
    const storePath = path.resolve(VECTOR_STORE_PATH);
    db = await connect(storePath);
    logger.info(`[VectorStore] Connected to LanceDB at ${storePath}`);

    const tableNames = await db.tableNames();
    if (tableNames.includes(TABLE_NAME)) {
      table = await db.openTable(TABLE_NAME);
      logger.info('[VectorStore] Opened existing table: chunks');
    } else {
      logger.info('[VectorStore] Table will be created on first write');
    }
  },

  /**
   * Insert an array of chunks (with their embedding vectors) into the table.
   * Creates the table on the first call.
   * @param {Array<ChunkObject & { vector: number[] }>} chunks
   */
  async upsertChunks(chunks) {
    if (!db) throw new Error('[VectorStore] Not initialized. Call initialize() first.');
    if (!chunks || chunks.length === 0) return;

    // LanceDB requires vector as Float32Array
    const records = chunks.map(c => ({
      ...c,
      vector: Array.from(c.vector), // Ensure it's a plain array (LanceDB handles conversion)
    }));

    if (!table) {
      // First write — create the table from the first batch
      table = await db.createTable(TABLE_NAME, records);
      logger.info(`[VectorStore] Created table 'chunks' with ${records.length} initial records`);
    } else {
      await table.add(records);
      logger.debug(`[VectorStore] Added ${records.length} chunks`);
    }
  },

  /**
   * Search for top-K similar chunks for a given session.
   * @param {string} sessionId
   * @param {number[]} queryVector - float32 array of length 384
   * @param {number} topK
   * @returns {Promise<SearchResult[]>} sorted by score descending
   */
  async search(sessionId, queryVector, topK = TOP_K) {
    if (!table) return [];

    // Fetch more than topK, then filter by minimum score
    const fetchCount = topK * 2;

    let results;
    try {
      results = await table
        .vectorSearch(queryVector)
        .limit(fetchCount)
        .where(`sessionId = '${sessionId}'`)
        .toArray();
    } catch (err) {
      logger.error('[VectorStore] Search error:', err.message);
      return [];
    }

    // _distance is L2 distance. For normalized vectors, cosine_sim ≈ 1 - (_distance^2 / 2)
    // But LanceDB with cosine metric returns distance directly as 1 - cosine_sim.
    // We handle both cases by checking if _distance is in [0,2] range (L2) or [0,1] (cosine).
    return results
      .map(row => {
        // Convert distance to similarity score
        // If vectordb used cosine metric: score = 1 - row._distance
        // If vectordb used L2 (default): score = 1 - (row._distance * row._distance / 2)
        // Since we normalize vectors, L2 and cosine give same ranking. Use cosine formula:
        const score = Math.max(0, Math.min(1, 1 - (row._distance || 0)));
        return { ...row, score };
      })
      .filter(row => row.score >= MIN_SCORE)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  },

  /**
   * Delete all chunks belonging to a session.
   * @param {string} sessionId
   */
  async deleteSession(sessionId) {
    if (!table) return;
    try {
      await table.delete(`sessionId = '${sessionId}'`);
      logger.info(`[VectorStore] Deleted all chunks for session: ${sessionId}`);
    } catch (err) {
      logger.warn(`[VectorStore] Error deleting session ${sessionId}:`, err.message);
    }
  },

  /**
   * Check whether a session has any stored chunks.
   */
  async sessionExists(sessionId) {
    if (!table) return false;
    try {
      const results = await table
        .vectorSearch(new Array(384).fill(0))
        .limit(1)
        .where(`sessionId = '${sessionId}'`)
        .toArray();
      return results.length > 0;
    } catch {
      return false;
    }
  },

  /**
   * Count stored chunks for a session.
   */
  async getChunkCount(sessionId) {
    if (!table) return 0;
    try {
      const results = await table
        .vectorSearch(new Array(384).fill(0))
        .limit(100000)
        .where(`sessionId = '${sessionId}'`)
        .toArray();
      return results.length;
    } catch {
      return 0;
    }
  },
};
```

### 4.5 `src/services/llmService.js`

```javascript
// src/services/llmService.js
import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger.js';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const LLM_MODEL = process.env.LLM_MODEL || 'claude-sonnet-4-20250514';
const LLM_MAX_TOKENS = parseInt(process.env.LLM_MAX_TOKENS || '2048');
const LLM_TEMPERATURE = parseFloat(process.env.LLM_TEMPERATURE || '0.2');

// Heuristics: trigger standalone question reformulation if message is short
// and contains ambiguous pronouns or starts with a follow-up phrase.
const AMBIGUOUS_PRONOUNS = ['it', 'this', 'that', 'they', 'them', 'these', 'those', 'its', 'their'];
const FOLLOW_UP_STARTERS = ['what about', 'how about', 'and ', 'but ', 'also ', 'why ', 'when ', 'where '];

function isAmbiguousFollowUp(message, history) {
  if (!history || history.length === 0) return false;
  const words = message.toLowerCase().split(/\s+/);
  if (words.length > 20) return false; // Long messages are self-contained
  const lower = message.toLowerCase();
  const hasAmbiguousPronoun = words.some(w => AMBIGUOUS_PRONOUNS.includes(w));
  const hasFollowUpStart = FOLLOW_UP_STARTERS.some(s => lower.startsWith(s));
  return hasAmbiguousPronoun || hasFollowUpStart;
}

/**
 * Rewrite a follow-up question into a standalone question using a small LLM call.
 * @returns {Promise<string>} The standalone question
 */
export async function rewriteStandaloneQuestion(message, history) {
  const historyText = history
    .slice(-4) // Last 2 turns
    .map(m => `${m.role === 'user' ? 'Human' : 'AI'}: ${m.content}`)
    .join('\n');

  try {
    const response = await client.messages.create({
      model: LLM_MODEL,
      max_tokens: 200,
      temperature: 0,
      messages: [{
        role: 'user',
        content: `Given this conversation and a follow-up question, rewrite the follow-up as a complete standalone question. Output ONLY the rewritten question, nothing else.\n\nConversation:\n${historyText}\n\nFollow-up: ${message}\n\nStandalone question:`,
      }],
    });
    return response.content[0]?.text?.trim() || message;
  } catch (err) {
    logger.warn('[LLM] Standalone question rewrite failed, using original:', err.message);
    return message; // Fallback to original
  }
}

/**
 * Build the full system prompt for a repository chat session.
 */
function buildSystemPrompt(repoInfo) {
  return `You are an expert software engineer and code analyst. You help users understand GitHub repositories through conversation.

Repository Context:
- Name: ${repoInfo.owner}/${repoInfo.name}
- Description: ${repoInfo.description || 'No description provided'}
- Primary Language: ${repoInfo.primaryLanguage || 'Unknown'}

Your Role:
1. Answer questions using ONLY the repository code and documentation provided as context below.
2. If the context is insufficient to answer fully, say so explicitly — do not invent or assume code that isn't shown.
3. Always mention file paths when referencing specific code (in backticks, e.g., \`src/utils/auth.js\`).
4. Use markdown formatting: code fences with language tags for code, bullet lists for enumerations.
5. For multi-part questions, use headers (##) to structure your response.
6. Be technically precise. The user is a developer.
7. If the question is unrelated to this repository, politely redirect: "I'm focused on the ${repoInfo.name} repository. Is there something about the codebase I can help with?"
8. Do not repeat the question back to the user.
9. Keep responses focused and avoid padding.`;
}

/**
 * Build the user-side message with retrieved context injected.
 */
function buildContextualMessage(question, retrievedChunks) {
  const contextBlock = retrievedChunks
    .map((chunk, i) => `--- Source ${i + 1}: ${chunk.filePath} ---\n${chunk.content}`)
    .join('\n\n');

  return `[RETRIEVED REPOSITORY CONTEXT]\n\n${contextBlock}\n\n[END OF CONTEXT]\n\nQuestion: ${question}`;
}

/**
 * Stream a chat response via SSE.
 * Sends: 'standalone_question', 'sources', 'token', 'done' events via res.sendEvent().
 *
 * @param {object} params
 * @param {string} params.message - Raw user message
 * @param {Array} params.history - Conversation history (role/content pairs)
 * @param {Array} params.retrievedChunks - Chunks from vector search
 * @param {object} params.repoInfo - Repository metadata
 * @param {object} params.res - Express response with res.sendEvent() attached
 */
export async function streamChatResponse({ message, history, retrievedChunks, repoInfo, res }) {
  // Step 1: Standalone question reformulation
  let standaloneQuestion = message;
  if (isAmbiguousFollowUp(message, history)) {
    standaloneQuestion = await rewriteStandaloneQuestion(message, history);
  }
  res.sendEvent({ type: 'standalone_question', question: standaloneQuestion });

  // Step 2: Send source chunks to client (before streaming starts)
  const sourcesSummary = retrievedChunks.map(c => ({
    filePath: c.filePath,
    fileName: c.fileName,
    chunkIndex: c.chunkIndex,
    score: c.score,
    language: c.language,
    content: c.content,
  }));
  res.sendEvent({ type: 'sources', chunks: sourcesSummary });

  // Step 3: Build messages array for Claude
  const maxHistory = parseInt(process.env.MAX_HISTORY_TURNS || '6');
  const trimmedHistory = history.slice(-maxHistory * 2); // maxHistory turns = 2x messages

  const contextualMessage = buildContextualMessage(standaloneQuestion, retrievedChunks);
  const messages = [
    ...trimmedHistory,
    { role: 'user', content: contextualMessage },
  ];

  // Step 4: Stream from Claude
  const systemPrompt = buildSystemPrompt(repoInfo);
  const stream = await client.messages.stream({
    model: LLM_MODEL,
    max_tokens: LLM_MAX_TOKENS,
    temperature: LLM_TEMPERATURE,
    system: systemPrompt,
    messages,
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      res.sendEvent({ type: 'token', content: event.delta.text });
    }
    if (event.type === 'message_stop') {
      const final = await stream.finalMessage();
      res.sendEvent({
        type: 'done',
        inputTokens: final.usage.input_tokens,
        outputTokens: final.usage.output_tokens,
      });
    }
  }
}
```

---

## PHASE 5: Backend — Routes

### 5.1 `src/routes/repo.js`

```javascript
// src/routes/repo.js
import { Router } from 'express';
import { validateBody, validateParams } from '../middleware/validateRequest.js';
import { ingestionRateLimiter } from '../middleware/rateLimiter.js';
import { initSSE } from '../middleware/sseMiddleware.js';
import { IngestRequestSchema, SessionIdParamSchema } from '../schemas/repoSchemas.js';
import { githubService } from '../services/githubService.js';
import { chunkAllFiles } from '../services/chunkingService.js';
import { EmbeddingService } from '../services/embeddingService.js';
import { VectorStoreService } from '../services/vectorStoreService.js';
import { createSession, deleteSession, getSession } from '../utils/sessionManager.js';
import { parseGitHubUrl } from '../utils/urlParser.js';
import { shouldIncludeFile, isBinaryContent, detectLanguages } from '../utils/fileFilter.js';
import { logger } from '../utils/logger.js';

const router = Router();

// POST /api/repo/ingest — Start repository ingestion, stream progress via SSE
router.post('/ingest', ingestionRateLimiter, validateBody(IngestRequestSchema), async (req, res, next) => {
  const { repoUrl, sessionId } = req.body;
  initSSE(req, res);

  try {
    // 1. Parse and validate URL
    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) {
      res.sendEvent({ type: 'error', code: 'INVALID_URL', message: 'Please enter a valid GitHub repository URL.' });
      return res.end();
    }
    const { owner, repo, branch } = parsed;

    // 2. Fetch repository metadata (validates existence + public access)
    const repoInfo = await githubService.getRepoInfo(owner, repo);
    if (repoInfo.isPrivate) {
      res.sendEvent({ type: 'error', code: 'REPO_PRIVATE', message: 'Repository is private. GitChat only supports public repositories.' });
      return res.end();
    }

    res.sendEvent({ type: 'start', repoInfo: {
      owner: repoInfo.owner,
      name: repoInfo.name,
      fullName: repoInfo.fullName,
      description: repoInfo.description,
      stars: repoInfo.stars,
      primaryLanguage: repoInfo.primaryLanguage,
    }});

    if (repoInfo.isArchived) {
      res.sendEvent({ type: 'warning', message: 'This repository is archived and may not be actively maintained.' });
    }

    // 3. Phase 1: Fetch file tree
    res.sendEvent({ type: 'phase', phase: 'Phase 1/4: Fetching file tree', phaseNumber: 1, percentage: 0 });
    const allTreeItems = await githubService.getFileTree(owner, repo, branch);

    // Apply file filters
    const MAX_FILES = parseInt(process.env.MAX_FILES_TO_PROCESS || '1000');
    const filterable = allTreeItems.filter(item => {
      const check = shouldIncludeFile(item.path, item.size);
      return check.include;
    }).slice(0, MAX_FILES);

    if (filterable.length === 0) {
      res.sendEvent({ type: 'error', code: 'REPO_EMPTY', message: 'No text-based source files found in this repository.' });
      return res.end();
    }

    const skippedCount = allTreeItems.length - filterable.length;
    const filePaths = filterable.map(f => f.path);

    res.sendEvent({ type: 'phase', phase: 'Phase 2/4: Reading file contents', phaseNumber: 2, percentage: 10 });

    // 4. Phase 2: Fetch file contents in batches
    const skippedFiles = [];
    const { contents, skippedFiles: fetchSkipped } = await githubService.getFilesInBatches(
      owner, repo, filePaths,
      (processed, total, lastFile) => {
        const pct = 10 + Math.round((processed / total) * 30); // 10-40%
        res.sendEvent({ type: 'progress', phaseNumber: 2, percentage: pct, currentFile: lastFile, processedFiles: processed, totalFiles: total });
      }
    );
    skippedFiles.push(...fetchSkipped);

    // Filter binary files
    const textContents = new Map();
    for (const [path, content] of contents.entries()) {
      if (!isBinaryContent(content)) {
        textContents.set(path, content);
      } else {
        skippedFiles.push(path);
      }
    }

    // 5. Phase 3: Chunking
    res.sendEvent({ type: 'phase', phase: 'Phase 3/4: Chunking & processing', phaseNumber: 3, percentage: 40 });
    const allChunks = chunkAllFiles(sessionId, textContents);

    if (allChunks.length === 0) {
      res.sendEvent({ type: 'error', code: 'REPO_EMPTY', message: 'No processable content found after filtering.' });
      return res.end();
    }

    res.sendEvent({ type: 'progress', phaseNumber: 3, percentage: 50, currentFile: 'Processing chunks...', processedFiles: textContents.size, totalFiles: textContents.size });

    // 6. Phase 4: Embeddings
    res.sendEvent({ type: 'phase', phase: 'Phase 4/4: Generating embeddings', phaseNumber: 4, percentage: 50 });

    const embeddingBatchSize = parseInt(process.env.EMBEDDING_BATCH_SIZE || '16');
    const chunkedVectors = [];

    for (let i = 0; i < allChunks.length; i += embeddingBatchSize) {
      const batch = allChunks.slice(i, i + embeddingBatchSize);
      const texts = batch.map(c => `File: ${c.filePath}\n\n${c.content}`);
      const vectors = await EmbeddingService.embedBatch(texts);

      for (let j = 0; j < batch.length; j++) {
        chunkedVectors.push({ ...batch[j], vector: vectors[j] });
      }

      const pct = 50 + Math.round(((i + embeddingBatchSize) / allChunks.length) * 45);
      res.sendEvent({
        type: 'progress',
        phaseNumber: 4,
        percentage: Math.min(95, pct),
        currentFile: `Embedding batch ${Math.ceil((i + embeddingBatchSize) / embeddingBatchSize)} / ${Math.ceil(allChunks.length / embeddingBatchSize)}`,
        processedFiles: Math.min(i + embeddingBatchSize, allChunks.length),
        totalFiles: allChunks.length,
      });
    }

    // 7. Store in LanceDB
    await VectorStoreService.deleteSession(sessionId); // Clear any previous data for this session
    await VectorStoreService.upsertChunks(chunkedVectors);

    // 8. Register session
    const detectedLanguages = detectLanguages(Array.from(textContents.keys()));
    const fullRepoInfo = {
      ...repoInfo,
      languages: detectedLanguages,
      totalFiles: textContents.size,
      totalChunks: allChunks.length,
      ingestedAt: new Date().toISOString(),
    };
    createSession(sessionId, fullRepoInfo);

    if (skippedCount + skippedFiles.length > 0) {
      res.sendEvent({
        type: 'warning',
        message: `${skippedCount + skippedFiles.length} files were skipped (binary, lock files, or oversized)`,
        skippedFiles: skippedFiles.slice(0, 20), // Show max 20
      });
    }

    res.sendEvent({
      type: 'complete',
      summary: {
        totalFiles: textContents.size,
        totalChunks: allChunks.length,
        languages: detectedLanguages,
        skippedCount: skippedCount + skippedFiles.length,
        repoInfo: fullRepoInfo,
      },
    });

    res.end();
  } catch (err) {
    logger.error('[Ingest] Error:', err.message);
    res.sendEvent({ type: 'error', code: err.code || 'INTERNAL_ERROR', message: err.message || 'An unexpected error occurred.' });
    res.end();
  }
});

// GET /api/repo/status/:sessionId — Check if session is active
router.get('/status/:sessionId', validateParams(SessionIdParamSchema), async (req, res) => {
  const { sessionId } = req.params;
  const session = getSession(sessionId);

  if (!session) {
    return res.json({ exists: false });
  }

  res.json({
    exists: true,
    repoInfo: {
      owner: session.repoInfo.owner,
      name: session.repoInfo.name,
      totalChunks: session.repoInfo.totalChunks,
      ingestedAt: session.repoInfo.ingestedAt,
    },
  });
});

// DELETE /api/repo/session/:sessionId — Clear a session
router.delete('/session/:sessionId', validateParams(SessionIdParamSchema), async (req, res) => {
  const { sessionId } = req.params;
  const existed = deleteSession(sessionId);

  // Async vector cleanup (don't await)
  VectorStoreService.deleteSession(sessionId).catch(err =>
    logger.warn('[Route] Failed to delete vectors for session:', err.message)
  );

  res.json({
    success: existed,
    message: existed ? 'Session cleared.' : 'Session not found.',
  });
});

export default router;
```

### 5.2 `src/routes/chat.js`

```javascript
// src/routes/chat.js
import { Router } from 'express';
import { validateBody } from '../middleware/validateRequest.js';
import { chatRateLimiter } from '../middleware/rateLimiter.js';
import { initSSE } from '../middleware/sseMiddleware.js';
import { ChatMessageRequestSchema } from '../schemas/chatSchemas.js';
import { EmbeddingService } from '../services/embeddingService.js';
import { VectorStoreService } from '../services/vectorStoreService.js';
import { streamChatResponse } from '../services/llmService.js';
import { getSession, touchSession } from '../utils/sessionManager.js';
import { logger } from '../utils/logger.js';

const router = Router();

// POST /api/chat/message — Send a message, receive SSE streamed response
router.post('/message', chatRateLimiter, validateBody(ChatMessageRequestSchema), async (req, res) => {
  const { sessionId, message, history } = req.body;
  initSSE(req, res);

  try {
    // 1. Validate session
    const session = getSession(sessionId);
    if (!session) {
      res.sendEvent({ type: 'error', code: 'SESSION_NOT_FOUND', message: 'Your session has expired. Please reload the repository.', retryable: false });
      return res.end();
    }
    touchSession(sessionId);

    // 2. Embed the query
    const queryVector = await EmbeddingService.embed(message);

    // 3. Vector search
    const retrievedChunks = await VectorStoreService.search(sessionId, queryVector);

    if (retrievedChunks.length === 0) {
      // No relevant context found — still respond, but with empty context
      res.sendEvent({ type: 'sources', chunks: [] });
    }

    // 4. Stream response from LLM
    await streamChatResponse({
      message,
      history,
      retrievedChunks,
      repoInfo: session.repoInfo,
      res,
    });

    res.end();
  } catch (err) {
    logger.error('[Chat] Error:', err.message);
    res.sendEvent({
      type: 'error',
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'Failed to get a response. Please try again.',
      retryable: true,
    });
    res.end();
  }
});

export default router;
```

### 5.3 `src/app.js`

```javascript
// src/app.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';

dotenv.config();

import { globalRateLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import repoRoutes from './routes/repo.js';
import chatRoutes from './routes/chat.js';
import { EmbeddingService } from './services/embeddingService.js';
import { VectorStoreService } from './services/vectorStoreService.js';
import { logger } from './utils/logger.js';

const app = express();

// Security & parsing middleware
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'http://localhost:5173',
      'http://localhost:4173',
    ];
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS: Origin not allowed'));
    }
  },
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type'],
  credentials: false,
}));

app.use(compression());
app.use(express.json({ limit: '10kb' }));
app.use(morgan('dev'));
app.use(globalRateLimiter);

// Routes
app.use('/api/repo', repoRoutes);
app.use('/api/chat', chatRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' }));

// Global error handler (must be last)
app.use(errorHandler);

// Pre-warm on startup (non-blocking)
EmbeddingService.initialize()
  .then(() => logger.info('[App] Embedding model ready'))
  .catch(err => logger.error('[App] Embedding model failed to load:', err.message));

VectorStoreService.initialize()
  .then(() => logger.info('[App] LanceDB ready'))
  .catch(err => logger.error('[App] LanceDB failed to initialize:', err.message));

export default app;
```

### 5.4 `src/server.js`

```javascript
// src/server.js
import app from './app.js';
import { logger } from './utils/logger.js';

const PORT = parseInt(process.env.PORT || '3001');

const server = app.listen(PORT, () => {
  logger.info(`[Server] GitChat backend running on http://localhost:${PORT}`);
});

// Graceful shutdown
const shutdown = (signal) => {
  logger.info(`[Server] ${signal} received. Shutting down gracefully...`);
  server.close(() => {
    logger.info('[Server] Closed all connections.');
    process.exit(0);
  });
  setTimeout(() => {
    logger.warn('[Server] Forcing shutdown after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  logger.error('[Server] Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('[Server] Unhandled Rejection:', reason);
});
```

---

## PHASE 6: Frontend — Project Scaffold

### 6.1 Create Vite + React App

```bash
cd gitchat/
npm create vite@latest frontend -- --template react
cd frontend
npm install
```

### 6.2 Install All Frontend Packages

```bash
# Animation
npm install framer-motion

# HTTP client
npm install axios

# Markdown rendering
npm install react-markdown remark-gfm

# Syntax highlighting
npm install react-syntax-highlighter

# Icons
npm install lucide-react

# UUID
npm install uuid

# Tailwind
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install @tailwindcss/typography @tailwindcss/forms

# Dev tools
npm install -D eslint prettier eslint-plugin-react eslint-config-prettier
```

### 6.3 Create Directory Structure

```bash
mkdir -p src/{components/{layout,landing,ingestion,chat,shared},context,hooks,utils,styles,constants}
```

### 6.4 `tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body:    ['DM Sans', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      colors: {
        'neo-black':  '#0A0A0A',
        'neo-cream':  '#F5EFE0',
        'neo-white':  '#FFFFFF',
        'neo-yellow': '#FFE500',
        'neo-green':  '#00FF87',
        'neo-pink':   '#FF3366',
        'neo-blue':   '#0055FF',
        'neo-orange': '#FF6B00',
        'neo-gray':   '#555555',
      },
      boxShadow: {
        'neo-sm': '2px 2px 0px #0A0A0A',
        'neo':    '4px 4px 0px #0A0A0A',
        'neo-lg': '6px 6px 0px #0A0A0A',
        'neo-blue': '4px 4px 0px #0055FF',
        'neo-green': '4px 4px 0px #00FF87',
      },
      borderRadius: {
        'neo': '0px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
}
```

### 6.5 `vite.config.js`

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'framer':       ['framer-motion'],
          'markdown':     ['react-markdown', 'react-syntax-highlighter'],
        },
      },
    },
  },
})
```

### 6.6 `index.html`

Replace the Vite default `index.html` with:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>GitChat — Talk to any GitHub repository</title>
    <meta name="description" content="Have natural language conversations with any public GitHub repository using AI-powered code intelligence." />
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

---

## PHASE 7: Frontend — Base Styles & Constants

### 7.1 `src/styles/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-bg:               #F5EFE0;
  --color-surface:          #FFFFFF;
  --color-border:           #0A0A0A;
  --color-text-primary:     #0A0A0A;
  --color-text-secondary:   #555555;
  --color-accent-yellow:    #FFE500;
  --color-accent-green:     #00FF87;
  --color-accent-pink:      #FF3366;
  --color-accent-blue:      #0055FF;
  --color-accent-orange:    #FF6B00;
  --color-code-bg:          #0A0A0A;
  --color-code-text:        #F5EFE0;
}

*, *::before, *::after {
  box-sizing: border-box;
}

html, body, #root {
  height: 100%;
  margin: 0;
  padding: 0;
}

body {
  background-color: var(--color-bg);
  color: var(--color-text-primary);
  font-family: 'DM Sans', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Focus styles for accessibility */
:focus-visible {
  outline: 2px solid var(--color-accent-blue);
  outline-offset: 2px;
}

/* Scrollbar styling */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: var(--color-bg); }
::-webkit-scrollbar-thumb { background: var(--color-border); }
::-webkit-scrollbar-thumb:hover { background: #333; }

/* Prevent horizontal overflow on body */
body { overflow-x: hidden; }
```

### 7.2 `src/styles/animations.css`

```css
/* Striped progress bar */
@keyframes progress-stripes {
  0%   { background-position: 0 0; }
  100% { background-position: 40px 0; }
}

/* Shimmer for skeleton loaders */
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}

/* Blinking cursor during streaming */
@keyframes blink-cursor {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}

/* Pulse ring on scroll-to-bottom button when new message arrives */
@keyframes pulse-ring {
  0%   { transform: scale(1); box-shadow: 4px 4px 0px #0A0A0A; }
  50%  { transform: scale(1.06); box-shadow: 6px 6px 0px #0A0A0A; }
  100% { transform: scale(1); box-shadow: 4px 4px 0px #0A0A0A; }
}

/* Background dot grid movement on landing page */
@keyframes grid-drift {
  0%   { background-position: 0 0; }
  100% { background-position: 40px 40px; }
}

/* Success flash on progress bar at 100% */
@keyframes success-flash {
  0%   { background-color: #FFE500; }
  50%  { background-color: #00FF87; }
  100% { background-color: #FFE500; }
}

/* Classes to use in JSX */
.streaming-cursor {
  display: inline-block;
  width: 2px;
  height: 1em;
  background-color: var(--color-text-primary);
  margin-left: 2px;
  vertical-align: text-bottom;
  animation: blink-cursor 0.7s step-end infinite;
}

.progress-bar-fill {
  background-image: repeating-linear-gradient(
    45deg,
    #FFE500,
    #FFE500 10px,
    #FFCC00 10px,
    #FFCC00 20px
  );
  background-size: 40px 100%;
  animation: progress-stripes 0.8s linear infinite;
}

.skeleton {
  background: linear-gradient(90deg, #E8E2D4 25%, #F5EFE0 50%, #E8E2D4 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

.scroll-btn-pulse {
  animation: pulse-ring 1.5s ease-in-out infinite;
}

.landing-grid-bg {
  background-image: radial-gradient(circle, #0A0A0A 1px, transparent 1px);
  background-size: 30px 30px;
  animation: grid-drift 8s linear infinite;
  opacity: 0.08;
}
```

### 7.3 `src/styles/animations.js` — Framer Motion Variants

```javascript
// src/styles/animations.js
// All Framer Motion variants — import these in components instead of defining inline

export const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, y: -20, transition: { duration: 0.25, ease: 'easeIn' } },
};

export const buttonVariants = {
  rest:  { x: 0, y: 0, boxShadow: '4px 4px 0px #0A0A0A' },
  hover: { x: 2, y: 2, boxShadow: '2px 2px 0px #0A0A0A', transition: { duration: 0.08 } },
  tap:   { x: 4, y: 4, boxShadow: '0px 0px 0px #0A0A0A', transition: { duration: 0.05 } },
};

export const buttonGhostVariants = {
  rest:  { x: 0, y: 0, boxShadow: '2px 2px 0px #0A0A0A' },
  hover: { x: 1, y: 1, boxShadow: '1px 1px 0px #0A0A0A', transition: { duration: 0.08 } },
  tap:   { x: 2, y: 2, boxShadow: '0px 0px 0px #0A0A0A', transition: { duration: 0.05 } },
};

export const shakeVariants = {
  shake: {
    x: [0, -8, 8, -6, 6, -3, 3, 0],
    transition: { duration: 0.45, ease: 'easeInOut' },
  },
};

export const userMessageVariants = {
  initial: { opacity: 0, x: 30, scale: 0.94 },
  animate: { opacity: 1, x: 0, scale: 1, transition: { type: 'spring', stiffness: 400, damping: 30 } },
};

export const assistantMessageVariants = {
  initial: { opacity: 0, x: -30, scale: 0.94 },
  animate: { opacity: 1, x: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 28 } },
};

export const staggerContainer = {
  animate: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

export const staggerItem = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 350, damping: 28 } },
};

export const accordionVariants = {
  open: {
    height: 'auto', opacity: 1,
    transition: { height: { duration: 0.25, ease: 'easeOut' }, opacity: { duration: 0.2 } },
  },
  closed: {
    height: 0, opacity: 0,
    transition: { height: { duration: 0.2, ease: 'easeIn' }, opacity: { duration: 0.15 } },
  },
};

export const stampVariants = {
  initial: { scale: 0, rotate: -8, opacity: 0 },
  animate: {
    scale: [0, 1.15, 0.95, 1.05, 1],
    rotate: [-8, 3, -2, 1, 0],
    opacity: 1,
    transition: { type: 'spring', duration: 0.6, bounce: 0.5 },
  },
};

export const scrollButtonVariants = {
  hidden:  { scale: 0, opacity: 0, transition: { duration: 0.15 } },
  visible: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 400, damping: 25 } },
};

export const toastVariants = {
  initial: { opacity: 0, x: 60, y: -10 },
  animate: { opacity: 1, x: 0, y: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } },
  exit:    { opacity: 0, x: 60, transition: { duration: 0.2, ease: 'easeIn' } },
};

export const modalBackdropVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 0.5, transition: { duration: 0.2 } },
  exit:    { opacity: 0, transition: { duration: 0.15 } },
};

export const modalBoxVariants = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 350, damping: 28 } },
  exit:    { scale: 0.9, opacity: 0, transition: { duration: 0.15 } },
};

export const sidebarVariants = {
  initial: { x: '100%', opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 280, damping: 28 } },
  exit:    { x: '100%', opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } },
};

export const letterVariants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } },
};
```

### 7.4 `src/constants/exampleRepos.js`

```javascript
// src/constants/exampleRepos.js
export const EXAMPLE_REPOS = [
  { label: 'facebook/react',         url: 'https://github.com/facebook/react' },
  { label: 'vercel/next.js',         url: 'https://github.com/vercel/next.js' },
  { label: 'expressjs/express',      url: 'https://github.com/expressjs/express' },
  { label: 'anthropics/anthropic-sdk-python', url: 'https://github.com/anthropics/anthropic-sdk-python' },
  { label: 'vitejs/vite',            url: 'https://github.com/vitejs/vite' },
  { label: 'tailwindlabs/tailwindcss', url: 'https://github.com/tailwindlabs/tailwindcss' },
];
```

### 7.5 `src/constants/suggestedQuestions.js`

```javascript
// src/constants/suggestedQuestions.js
export const SUGGESTED_QUESTIONS = [
  'What does this repository do?',
  'Explain the main entry point',
  'List the key dependencies and why they are used',
  'How are errors handled in this codebase?',
  'What design patterns are used?',
  'How are tests structured?',
];
```

---

## PHASE 8: Frontend — Utilities

### 8.1 `src/utils/api.js`

```javascript
// src/utils/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Request interceptor: add session ID from storage if available
api.interceptors.request.use(config => config, error => Promise.reject(error));

// Response interceptor: unwrap errors
api.interceptors.response.use(
  response => response,
  error => {
    const message = error.response?.data?.error || error.message || 'Network error';
    error.message = message;
    return Promise.reject(error);
  }
);

export default api;
```

### 8.2 `src/utils/urlParser.js`

Copy the exact same `parseGitHubUrl` function from the backend's `src/utils/urlParser.js`. The logic is identical — keep both files in sync.

### 8.3 `src/utils/validators.js`

```javascript
// src/utils/validators.js
import { parseGitHubUrl } from './urlParser.js';

export function validateGitHubUrl(input) {
  if (!input || !input.trim()) {
    return { valid: false, message: 'Please enter a GitHub repository URL.' };
  }
  const parsed = parseGitHubUrl(input.trim());
  if (!parsed) {
    return { valid: false, message: 'Please enter a valid GitHub repository URL (e.g., github.com/owner/repo).' };
  }
  return { valid: true, parsed };
}

export function validateMessage(text) {
  if (!text || !text.trim()) {
    return { valid: false, message: 'Please type a message.' };
  }
  if (text.length > 2000) {
    return { valid: false, message: `Message too long (${text.length}/2000 characters).` };
  }
  return { valid: true };
}
```

### 8.4 `src/utils/formatters.js`

```javascript
// src/utils/formatters.js

export function formatRelativeTime(dateOrIso) {
  const date = dateOrIso instanceof Date ? dateOrIso : new Date(dateOrIso);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60)  return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatNumber(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000)    return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export function truncatePath(path, maxLen = 60) {
  if (!path || path.length <= maxLen) return path;
  const parts = path.split('/');
  if (parts.length > 3) {
    return `.../${parts.slice(-2).join('/')}`;
  }
  return '...' + path.slice(-(maxLen - 3));
}
```

---

## PHASE 9: Frontend — Context

### 9.1 `src/context/AppContext.jsx`

```jsx
// src/context/AppContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // appPhase drives which screen is shown: 'landing' | 'ingesting' | 'chat'
  const [appPhase, setAppPhase] = useState('landing');

  // Session ID: generated once per app mount, persisted in sessionStorage
  const [sessionId] = useState(() => {
    const stored = sessionStorage.getItem('gitchat_session_id');
    if (stored) return stored;
    const newId = uuidv4();
    sessionStorage.setItem('gitchat_session_id', newId);
    return newId;
  });

  const [repoUrl, setRepoUrl] = useState('');
  const [repoInfo, setRepoInfo] = useState(null);     // Set after ingestion completes
  const [ingestionProgress, setIngestionProgress] = useState(null);
  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(false);

  return (
    <AppContext.Provider value={{
      appPhase, setAppPhase,
      sessionId,
      repoUrl, setRepoUrl,
      repoInfo, setRepoInfo,
      ingestionProgress, setIngestionProgress,
      isInfoPanelOpen, setIsInfoPanelOpen,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
```

### 9.2 `src/context/ToastContext.jsx`

```jsx
// src/context/ToastContext.jsx
import { createContext, useContext, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ type = 'info', message, duration = 5000 }) => {
    const id = uuidv4();
    setToasts(prev => [...prev, { id, type, message, duration }]);
    // Auto-remove after duration
    setTimeout(() => removeToast(id), duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
```

---

## PHASE 10: Frontend — Hooks

### 10.1 `src/hooks/useSession.js`

```javascript
// src/hooks/useSession.js
// Session ID management — already handled in AppContext.
// This hook provides a convenience getter.
import { useAppContext } from '../context/AppContext';
export function useSession() {
  const { sessionId } = useAppContext();
  return { sessionId };
}
```

### 10.2 `src/hooks/useGitHubUrl.js`

```javascript
// src/hooks/useGitHubUrl.js
import { useState, useCallback } from 'react';
import { validateGitHubUrl } from '../utils/validators';

export function useGitHubUrl() {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  const handleChange = useCallback((e) => {
    setUrl(e.target.value);
    if (error) setError(''); // Clear error on edit
  }, [error]);

  const validate = useCallback(() => {
    const result = validateGitHubUrl(url);
    if (!result.valid) {
      setError(result.message);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return null;
    }
    setError('');
    return result.parsed;
  }, [url]);

  const setUrlFromChip = useCallback((chipUrl) => {
    setUrl(chipUrl);
    setError('');
  }, []);

  return { url, error, isShaking, handleChange, validate, setUrlFromChip };
}
```

### 10.3 `src/hooks/useSSE.js`

> ⚠️ **CRITICAL**: Native `EventSource` only supports GET. This hook uses `fetch` + `ReadableStream` to support POST + SSE. This is the correct implementation for all SSE endpoints in GitChat.

```javascript
// src/hooks/useSSE.js
import { useRef, useCallback } from 'react';

/**
 * Generic SSE-over-fetch hook.
 * Supports POST requests that return text/event-stream responses.
 */
export function useSSE() {
  const abortControllerRef = useRef(null);

  /**
   * Open an SSE connection to url using fetch.
   * @param {string} url
   * @param {object} options - { method, body (object to JSON.stringify), headers }
   * @param {object} handlers - { onMessage(parsedData), onError(err), onClose() }
   */
  const connect = useCallback(async (url, options = {}, handlers = {}) => {
    const { onMessage, onError, onClose } = handlers;

    // Abort any existing connection
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(url, {
        method: options.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          ...(options.headers || {}),
        },
        body: options.body != null ? JSON.stringify(options.body) : undefined,
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        let errorData;
        try { errorData = await response.json(); } catch { errorData = {}; }
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE format: events separated by double newline
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? ''; // Keep the incomplete last part

        for (const part of parts) {
          if (!part.trim()) continue;
          for (const line of part.split('\n')) {
            if (line.startsWith('data: ')) {
              const raw = line.slice(6).trim();
              if (raw === '[DONE]') break; // Optional OpenAI-style terminator
              try {
                const parsed = JSON.parse(raw);
                onMessage?.(parsed);
              } catch {
                // Malformed SSE line — skip
              }
            }
          }
        }
      }

      onClose?.();
    } catch (err) {
      if (err.name !== 'AbortError') {
        onError?.(err);
      }
    }
  }, []);

  const close = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
  }, []);

  return { connect, close };
}
```

### 10.4 `src/hooks/useIngestion.js`

```javascript
// src/hooks/useIngestion.js
import { useState, useCallback } from 'react';
import { useSSE } from './useSSE';

const initialProgress = {
  phase: 'Phase 1/4: Fetching file tree',
  phaseNumber: 1,
  percentage: 0,
  currentFile: '',
  processedFiles: 0,
  totalFiles: 0,
  estimatedSecondsRemaining: null,
  skippedFiles: [],
};

export function useIngestion() {
  const [progress, setProgress] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState(null);
  const [completionSummary, setCompletionSummary] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const { connect, close } = useSSE();

  const startIngestion = useCallback(async (repoUrl, sessionId) => {
    setProgress({ ...initialProgress });
    setIsComplete(false);
    setError(null);
    setCompletionSummary(null);
    setStartTime(Date.now());

    await connect(
      '/api/repo/ingest',
      { method: 'POST', body: { repoUrl, sessionId } },
      {
        onMessage: (data) => {
          switch (data.type) {
            case 'start':
              // repoInfo available early — could store it
              break;

            case 'phase':
              setProgress(prev => ({
                ...(prev || initialProgress),
                phase: data.phase,
                phaseNumber: data.phaseNumber,
                percentage: data.percentage,
              }));
              break;

            case 'progress': {
              const elapsed = (Date.now() - (startTime || Date.now())) / 1000;
              const rate = data.processedFiles / elapsed;
              const remaining = rate > 0 ? Math.ceil((data.totalFiles - data.processedFiles) / rate) : null;
              setProgress(prev => ({
                ...(prev || initialProgress),
                phaseNumber: data.phaseNumber,
                percentage: data.percentage,
                currentFile: data.currentFile || '',
                processedFiles: data.processedFiles,
                totalFiles: data.totalFiles,
                estimatedSecondsRemaining: elapsed > 5 ? remaining : null,
              }));
              break;
            }

            case 'warning':
              setProgress(prev => ({
                ...(prev || initialProgress),
                skippedFiles: data.skippedFiles || [],
              }));
              break;

            case 'complete':
              setProgress(prev => ({ ...(prev || initialProgress), percentage: 100 }));
              setCompletionSummary(data.summary);
              setIsComplete(true);
              break;

            case 'error':
              setError(data.message || 'Ingestion failed.');
              break;
          }
        },
        onError: (err) => {
          setError(err.message || 'Connection error during ingestion.');
        },
      }
    );
  }, [connect, startTime]);

  const cancel = useCallback(() => {
    close();
    setProgress(null);
    setError(null);
  }, [close]);

  return { startIngestion, progress, isComplete, error, completionSummary, cancel };
}
```

### 10.5 `src/hooks/useChat.js`

```javascript
// src/hooks/useChat.js
import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useSSE } from './useSSE';
import { validateMessage } from '../utils/validators';

export function useChat(sessionId) {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const { connect } = useSSE();

  const sendMessage = useCallback(async (text) => {
    const trimmed = text?.trim();
    const validation = validateMessage(trimmed);
    if (!validation.valid) return;

    const userMsgId = uuidv4();
    const assistantMsgId = uuidv4();

    // Add user message immediately
    const userMessage = {
      id: userMsgId,
      role: 'user',
      content: trimmed,
      isStreaming: false,
      sources: null,
      timestamp: new Date(),
      error: false,
    };

    // Add empty assistant message with streaming flag
    const assistantMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      isStreaming: true,
      sources: null,
      timestamp: new Date(),
      error: false,
    };

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setIsStreaming(true);
    setInputValue('');

    // Build history from current messages (exclude the new ones just added)
    const historyForApi = messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .filter(m => !m.error && !m.isStreaming)
      .slice(-12) // Last 6 turns = 12 messages
      .map(m => ({ role: m.role, content: m.content }));

    await connect(
      '/api/chat/message',
      {
        method: 'POST',
        body: { sessionId, message: trimmed, history: historyForApi },
      },
      {
        onMessage: (data) => {
          switch (data.type) {
            case 'sources':
              // Attach sources to the assistant message
              setMessages(prev => prev.map(m =>
                m.id === assistantMsgId ? { ...m, sources: data.chunks || [] } : m
              ));
              break;

            case 'token':
              // Append token to assistant message content
              setMessages(prev => prev.map(m =>
                m.id === assistantMsgId
                  ? { ...m, content: m.content + data.content }
                  : m
              ));
              break;

            case 'done':
              setMessages(prev => prev.map(m =>
                m.id === assistantMsgId ? { ...m, isStreaming: false } : m
              ));
              setIsStreaming(false);
              break;

            case 'error':
              setMessages(prev => prev.map(m =>
                m.id === assistantMsgId
                  ? { ...m, content: data.message || 'An error occurred.', isStreaming: false, error: true }
                  : m
              ));
              setIsStreaming(false);
              break;
          }
        },
        onError: (err) => {
          setMessages(prev => prev.map(m =>
            m.id === assistantMsgId
              ? { ...m, content: err.message || 'Connection error. Please try again.', isStreaming: false, error: true }
              : m
          ));
          setIsStreaming(false);
        },
        onClose: () => {
          // Ensure streaming is set to false if connection closes unexpectedly
          setIsStreaming(false);
          setMessages(prev => prev.map(m =>
            m.id === assistantMsgId ? { ...m, isStreaming: false } : m
          ));
        },
      }
    );
  }, [connect, messages, sessionId]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setIsStreaming(false);
    setInputValue('');
  }, []);

  return { messages, isStreaming, sendMessage, clearChat, inputValue, setInputValue };
}
```

### 10.6 `src/hooks/useAutoScroll.js`

```javascript
// src/hooks/useAutoScroll.js
import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Manages auto-scroll behavior in a scrollable container.
 * - Auto-scrolls to bottom when new content arrives, UNLESS user has scrolled up.
 * - Shows a "↓ New message" button when user is scrolled up and new content arrives.
 * - Re-enables auto-scroll when user scrolls back to bottom.
 */
export function useAutoScroll(containerRef, dependencies = []) {
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [newMessageWhileScrolledUp, setNewMessageWhileScrolledUp] = useState(false);
  const isAtBottomRef = useRef(true); // Ref version for use in event handler

  const checkIfAtBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return true;
    const threshold = 50; // px from bottom — within this = "at bottom"
    return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  }, [containerRef]);

  const scrollToBottom = useCallback((smooth = true) => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
    setShowScrollButton(false);
    setNewMessageWhileScrolledUp(false);
    setIsAtBottom(true);
    isAtBottomRef.current = true;
  }, [containerRef]);

  // Listen for manual scroll events
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleScroll = () => {
      const atBottom = checkIfAtBottom();
      isAtBottomRef.current = atBottom;
      setIsAtBottom(atBottom);
      if (atBottom) {
        setShowScrollButton(false);
        setNewMessageWhileScrolledUp(false);
      }
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [containerRef, checkIfAtBottom]);

  // Auto-scroll when dependencies (messages) change
  useEffect(() => {
    if (isAtBottomRef.current) {
      // User is at bottom — auto-scroll
      scrollToBottom(false);
    } else {
      // User scrolled up — show notification button
      setShowScrollButton(true);
      setNewMessageWhileScrolledUp(true);
    }
  }, dependencies); // eslint-disable-line react-hooks/exhaustive-deps

  return { isAtBottom, showScrollButton, newMessageWhileScrolledUp, scrollToBottom };
}
```

### 10.7 `src/hooks/useClipboard.js`

```javascript
// src/hooks/useClipboard.js
import { useState, useCallback } from 'react';

export function useClipboard(timeout = 2000) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), timeout);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), timeout);
    }
  }, [timeout]);

  return { copied, copy };
}
```

---

## PHASE 11: Frontend — Shared Components

All shared components live in `src/components/shared/`. They implement the neo-brutalism design system exactly as specified in PRD §7.

### 11.1 `src/components/shared/Button.jsx`

```jsx
// Props: variant ('primary'|'ghost'|'danger'), children, onClick, disabled, loading, type, className
// Primary: yellow background, 4px hard black shadow; shifts on hover/tap
// Ghost: transparent background, 2px shadow
// Danger: pink background
import { motion } from 'framer-motion';
import { buttonVariants, buttonGhostVariants } from '../../styles/animations';

const variantMap = {
  primary: {
    base: 'bg-neo-yellow text-neo-black border-2 border-neo-black font-bold text-sm uppercase tracking-wide px-6 py-3',
    motionVariants: buttonVariants,
  },
  ghost: {
    base: 'bg-transparent text-neo-black border-2 border-neo-black font-bold text-sm uppercase tracking-wide px-6 py-3',
    motionVariants: buttonGhostVariants,
  },
  danger: {
    base: 'bg-neo-pink text-white border-2 border-neo-black font-bold text-sm uppercase tracking-wide px-6 py-3',
    motionVariants: buttonVariants,
  },
};

export function Button({ variant = 'primary', children, onClick, disabled, loading, type = 'button', className = '' }) {
  const { base, motionVariants } = variantMap[variant] || variantMap.primary;
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      variants={motionVariants}
      initial="rest"
      whileHover={!disabled && !loading ? 'hover' : undefined}
      whileTap={!disabled && !loading ? 'tap' : undefined}
      className={`${base} relative inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-body ${className}`}
      style={{ borderRadius: 0 }}
    >
      {loading && (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </motion.button>
  );
}
```

### 11.2 `src/components/shared/Input.jsx`

```jsx
// Props: value, onChange, onBlur, placeholder, error (bool), disabled, autoFocus, type
// Focus state: blue neo-shadow (4px 4px 0px #0055FF)
export function Input({ value, onChange, onBlur, placeholder, error, disabled, autoFocus, type = 'text', className = '', ...props }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      disabled={disabled}
      autoFocus={autoFocus}
      className={`
        w-full bg-neo-white text-neo-black font-body text-sm
        border-2 ${error ? 'border-neo-pink' : 'border-neo-black'}
        px-4 py-3 outline-none
        transition-shadow duration-150
        focus:shadow-neo-blue focus:border-neo-blue
        placeholder:text-neo-gray
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      style={{ borderRadius: 0 }}
      {...props}
    />
  );
}
```

### 11.3 `src/components/shared/CodeBlock.jsx`

```jsx
// Renders a syntax-highlighted code block with a copy button.
// Uses react-syntax-highlighter with a dark theme on black background.
import { lazy, Suspense } from 'react';
import { Copy, Check } from 'lucide-react';
import { useClipboard } from '../../hooks/useClipboard';

// Lazy-load syntax highlighter (large bundle)
const SyntaxHighlighter = lazy(() =>
  import('react-syntax-highlighter').then(m => ({ default: m.Prism }))
);
const { oneDark } = await import('react-syntax-highlighter/dist/esm/styles/prism');

export function CodeBlock({ language = 'text', children }) {
  const { copied, copy } = useClipboard();
  const code = String(children).replace(/\n$/, '');

  return (
    <div
      className="relative my-2 border-2 border-neo-black"
      style={{ boxShadow: '4px 4px 0px #555555', borderRadius: 0 }}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-neo-black border-b border-gray-700">
        <span className="text-xs font-mono text-neo-green uppercase tracking-widest">{language}</span>
        <button
          onClick={() => copy(code)}
          className="flex items-center gap-1 text-xs font-body text-gray-400 hover:text-white transition-colors"
          aria-label="Copy code"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
      {/* Code content */}
      <Suspense fallback={<pre className="p-4 bg-neo-black text-neo-green font-mono text-xs overflow-x-auto">{code}</pre>}>
        <SyntaxHighlighter
          language={language}
          style={oneDark}
          customStyle={{
            margin: 0,
            background: '#0A0A0A',
            padding: '16px',
            fontSize: '13px',
            borderRadius: 0,
          }}
          showLineNumbers={false}
          wrapLongLines={false}
        >
          {code}
        </SyntaxHighlighter>
      </Suspense>
    </div>
  );
}
```

> ⚠️ The `await import()` for `oneDark` above is a module-level dynamic import. If this causes issues in Vite, import it statically: `import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'` at the top of the file.

### 11.4 `src/components/shared/Modal.jsx`

```jsx
// Confirmation modal with focus trap + Escape key close.
// Props: isOpen (bool), title (string), message (string), onConfirm, onCancel, confirmLabel, confirmVariant
import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { modalBackdropVariants, modalBoxVariants } from '../../styles/animations';
import { Button } from './Button';

export function Modal({ isOpen, title, message, onConfirm, onCancel, confirmLabel = 'Confirm', confirmVariant = 'primary' }) {
  const confirmRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    // Focus the confirm button when modal opens
    setTimeout(() => confirmRef.current?.focus(), 100);

    // Trap Escape key
    const handleKey = (e) => { if (e.key === 'Escape') onCancel?.(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onCancel]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <motion.div
            variants={modalBackdropVariants}
            initial="initial" animate="animate" exit="exit"
            className="absolute inset-0 bg-neo-black cursor-pointer"
            onClick={onCancel}
          />
          {/* Modal box */}
          <motion.div
            variants={modalBoxVariants}
            initial="initial" animate="animate" exit="exit"
            className="relative z-10 bg-neo-white border-2 border-neo-black p-6 max-w-sm w-full"
            style={{ boxShadow: '6px 6px 0px #0A0A0A', borderRadius: 0 }}
          >
            <h2 className="font-display font-bold text-lg text-neo-black mb-2">{title}</h2>
            <p className="font-body text-sm text-neo-gray mb-6">{message}</p>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={onCancel}>Cancel</Button>
              <Button ref={confirmRef} variant={confirmVariant} onClick={onConfirm}>{confirmLabel}</Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
```

### 11.5 `src/components/shared/Toast.jsx`

```jsx
// Single toast notification. Props: id, type ('error'|'success'|'warning'|'info'), message, duration, onRemove
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { toastVariants } from '../../styles/animations';

const typeStyles = {
  error:   'bg-neo-pink text-white',
  success: 'bg-neo-green text-neo-black',
  warning: 'bg-neo-orange text-white',
  info:    'bg-neo-blue text-white',
};

export function Toast({ id, type = 'info', message, duration = 5000, onRemove }) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    const interval = setInterval(() => setTimeLeft(prev => prev - 100), 100);
    return () => clearInterval(interval);
  }, []);

  const progressPct = (timeLeft / duration) * 100;

  return (
    <motion.div
      layout
      variants={toastVariants}
      initial="initial" animate="animate" exit="exit"
      className={`relative overflow-hidden border-2 border-neo-black min-w-[280px] max-w-sm ${typeStyles[type]}`}
      style={{ boxShadow: '4px 4px 0px #0A0A0A', borderRadius: 0 }}
      role="alert"
    >
      <div className="flex items-start justify-between gap-3 p-4">
        <p className="font-body text-sm font-medium">{message}</p>
        <button onClick={() => onRemove(id)} className="flex-shrink-0 hover:opacity-70" aria-label="Dismiss">
          <X size={16} />
        </button>
      </div>
      {/* Progress bar countdown */}
      <div
        className="absolute bottom-0 left-0 h-1 bg-current opacity-30 transition-all"
        style={{ width: `${progressPct}%`, transition: 'width 100ms linear' }}
      />
    </motion.div>
  );
}
```

### 11.6 `src/components/shared/ToastContainer.jsx`

```jsx
// Renders the stacked toast queue in top-right corner.
import { AnimatePresence } from 'framer-motion';
import { useToast } from '../../context/ToastContext';
import { Toast } from './Toast';

export function ToastContainer() {
  const { toasts, removeToast } = useToast();
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map(toast => (
          <Toast key={toast.id} {...toast} onRemove={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
}
```

### 11.7 `src/components/shared/RelevanceBadge.jsx`

```jsx
// Displays a relevance score (0-1) as a percentage with color coding.
// Props: score (0.0-1.0)
export function RelevanceBadge({ score }) {
  const pct = Math.round(score * 100);
  const color = pct >= 80 ? 'bg-neo-green text-neo-black' :
                pct >= 60 ? 'bg-neo-yellow text-neo-black' :
                            'bg-neo-orange text-white';
  return (
    <span
      className={`inline-block font-mono text-xs font-bold px-2 py-0.5 border border-neo-black ${color}`}
      style={{ borderRadius: 0 }}
    >
      {pct}% match
    </span>
  );
}
```

### 11.8 `src/components/shared/LanguagePill.jsx`

```jsx
// Small colored badge for a programming language name.
// Props: language (string)
const langColors = {
  'JavaScript': 'bg-neo-yellow text-neo-black',
  'TypeScript': 'bg-neo-blue text-white',
  'Python': 'bg-neo-green text-neo-black',
  'Rust': 'bg-neo-orange text-white',
  'Go': 'bg-cyan-400 text-neo-black',
  'Ruby': 'bg-neo-pink text-white',
  'Java': 'bg-orange-400 text-neo-black',
  'C++': 'bg-purple-500 text-white',
  'C#': 'bg-green-600 text-white',
  'PHP': 'bg-indigo-500 text-white',
  'Swift': 'bg-red-500 text-white',
  'Kotlin': 'bg-violet-500 text-white',
};

export function LanguagePill({ language }) {
  const colorClass = langColors[language] || 'bg-neo-black text-neo-cream';
  return (
    <span
      className={`inline-block font-body text-xs font-bold uppercase tracking-wide px-2 py-0.5 border border-neo-black ${colorClass}`}
      style={{ borderRadius: '2px' }}
    >
      {language}
    </span>
  );
}
```

### 11.9 `src/components/shared/Loader.jsx`

```jsx
// Three bouncing squares — neo-brutalism loading indicator.
// Props: size ('sm'|'md'), className
import { motion } from 'framer-motion';

export function Loader({ size = 'md', className = '' }) {
  const s = size === 'sm' ? 'w-2 h-2' : 'w-3 h-3';
  return (
    <div className={`flex items-center gap-1 ${className}`} aria-label="Loading...">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className={`${s} bg-neo-black`}
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.12, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}
```

---

## PHASE 12: Frontend — Layout Components

### 12.1 `src/components/layout/AppHeader.jsx`

```jsx
// Top navigation bar visible only during 'chat' phase.
// Props: none — reads from AppContext
// Renders: GitChat logo (left), repo badge + info toggle (center/right), "Change Repo" button (right)
// State: manages confirm modal for repo change
import { useState } from 'react';
import { Info, RefreshCw } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../shared/Button';
import { Modal } from '../shared/Modal';
import api from '../../utils/api';

export function AppHeader({ onClearChat, hasChatMessages }) {
  const { sessionId, repoInfo, setAppPhase, setRepoInfo, setIsInfoPanelOpen } = useAppContext();
  const { addToast } = useToast();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChangeRepo = () => {
    if (hasChatMessages) {
      setShowConfirm(true);
    } else {
      doChangeRepo();
    }
  };

  const doChangeRepo = async () => {
    setShowConfirm(false);
    try {
      await api.delete(`/repo/session/${sessionId}`);
    } catch { /* ignore */ }
    setRepoInfo(null);
    setAppPhase('landing');
    onClearChat?.();
  };

  return (
    <header
      className="flex items-center justify-between px-4 py-3 border-b-2 border-neo-black bg-neo-white"
      style={{ boxShadow: '0 2px 0px #0A0A0A' }}
    >
      {/* Logo */}
      <span className="font-display font-bold text-xl text-neo-black tracking-tight">
        Git<span className="text-neo-blue">Chat</span>
      </span>

      {/* Center: repo badge */}
      {repoInfo && (
        <div
          className="flex items-center gap-2 border-2 border-neo-black px-3 py-1 bg-neo-cream"
          style={{ boxShadow: '2px 2px 0px #0A0A0A', borderRadius: 0 }}
        >
          <span className="font-mono text-xs font-medium text-neo-black truncate max-w-[200px]">
            {repoInfo.fullName}
          </span>
          <button
            onClick={() => setIsInfoPanelOpen(true)}
            className="text-neo-gray hover:text-neo-black transition-colors"
            aria-label="Repository info"
          >
            <Info size={14} />
          </button>
        </div>
      )}

      {/* Right: Change Repo button */}
      <Button variant="ghost" onClick={handleChangeRepo} className="text-xs px-3 py-2">
        <RefreshCw size={13} />
        Change Repo
      </Button>

      {/* Confirmation modal */}
      <Modal
        isOpen={showConfirm}
        title="Change Repository?"
        message="Changing the repository will clear your current chat. Are you sure?"
        onConfirm={doChangeRepo}
        onCancel={() => setShowConfirm(false)}
        confirmLabel="Yes, change repo"
        confirmVariant="danger"
      />
    </header>
  );
}
```

### 12.2 `src/components/layout/RepoInfoSidebar.jsx`

```jsx
// Collapsible right panel with repository metadata.
// On desktop: slides in from right. On mobile: bottom sheet.
// Props: none — reads from AppContext
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Code, Database, Clock } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { LanguagePill } from '../shared/LanguagePill';
import { formatRelativeTime, formatNumber } from '../../utils/formatters';
import { sidebarVariants } from '../../styles/animations';

export function RepoInfoSidebar() {
  const { repoInfo, isInfoPanelOpen, setIsInfoPanelOpen } = useAppContext();

  // Close on Escape
  useEffect(() => {
    if (!isInfoPanelOpen) return;
    const handle = (e) => { if (e.key === 'Escape') setIsInfoPanelOpen(false); };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [isInfoPanelOpen, setIsInfoPanelOpen]);

  if (!repoInfo) return null;

  return (
    <AnimatePresence>
      {isInfoPanelOpen && (
        <>
          {/* Backdrop (mobile) */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-neo-black z-30 md:hidden"
            onClick={() => setIsInfoPanelOpen(false)}
          />
          {/* Sidebar panel */}
          <motion.aside
            variants={sidebarVariants}
            initial="initial" animate="animate" exit="exit"
            className="fixed right-0 top-0 h-full w-80 bg-neo-white border-l-2 border-neo-black z-40 overflow-y-auto"
            style={{ boxShadow: '-4px 0px 0px #0A0A0A' }}
            role="complementary"
            aria-label="Repository information"
          >
            {/* Panel header */}
            <div className="flex items-center justify-between p-4 border-b-2 border-neo-black">
              <h2 className="font-display font-bold text-base">Repo Info</h2>
              <button onClick={() => setIsInfoPanelOpen(false)} className="hover:text-neo-blue" aria-label="Close panel">
                <X size={18} />
              </button>
            </div>

            {/* Panel content */}
            <div className="p-4 space-y-4">
              <div>
                <p className="font-mono text-xs text-neo-gray mb-1">REPOSITORY</p>
                <p className="font-display font-bold text-lg leading-tight">{repoInfo.fullName}</p>
                {repoInfo.description && (
                  <p className="font-body text-sm text-neo-gray mt-1">{repoInfo.description}</p>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Star size={14} className="text-neo-yellow" />
                  <span className="font-mono font-bold">{formatNumber(repoInfo.stars)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={14} className="text-neo-blue" />
                  <span className="font-body text-neo-gray">{formatRelativeTime(repoInfo.ingestedAt)}</span>
                </div>
              </div>

              <div>
                <p className="font-mono text-xs text-neo-gray mb-2">LANGUAGES</p>
                <div className="flex flex-wrap gap-1">
                  {(repoInfo.languages || []).slice(0, 8).map(lang => (
                    <LanguagePill key={lang} language={lang} />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="border-2 border-neo-black p-3" style={{ boxShadow: '2px 2px 0px #0A0A0A' }}>
                  <div className="flex items-center gap-1 mb-1">
                    <Code size={12} />
                    <p className="font-mono text-xs text-neo-gray">FILES</p>
                  </div>
                  <p className="font-display font-bold text-xl">{formatNumber(repoInfo.totalFiles)}</p>
                </div>
                <div className="border-2 border-neo-black p-3" style={{ boxShadow: '2px 2px 0px #0A0A0A' }}>
                  <div className="flex items-center gap-1 mb-1">
                    <Database size={12} />
                    <p className="font-mono text-xs text-neo-gray">CHUNKS</p>
                  </div>
                  <p className="font-display font-bold text-xl">{formatNumber(repoInfo.totalChunks)}</p>
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
```

---

## PHASE 13: Frontend — Landing Page

### 13.1 `src/components/landing/AnimatedLogo.jsx`

```jsx
// Animates "GitChat" letter by letter on mount with stagger.
import { motion } from 'framer-motion';
import { letterVariants, staggerContainer } from '../../styles/animations';

export function AnimatedLogo() {
  const text = 'GitChat';
  return (
    <motion.h1
      className="font-display font-black text-5xl md:text-7xl text-neo-black tracking-tight leading-none"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      aria-label="GitChat"
    >
      {text.split('').map((char, i) => (
        <motion.span key={i} variants={letterVariants}>
          {char === 'C' && i === 3
            ? <span className="text-neo-blue">{char}</span>
            : char}
        </motion.span>
      ))}
    </motion.h1>
  );
}
```

### 13.2 `src/components/landing/UrlValidationError.jsx`

```jsx
// Inline error message below the URL input.
// Props: message (string)
export function UrlValidationError({ message }) {
  if (!message) return null;
  return (
    <div
      className="flex items-start gap-2 mt-2 p-2 bg-neo-pink border-2 border-neo-black"
      style={{ boxShadow: '2px 2px 0px #0A0A0A', borderRadius: 0 }}
      role="alert"
      aria-live="polite"
    >
      <span className="text-white font-body text-xs font-medium">{message}</span>
    </div>
  );
}
```

### 13.3 `src/components/landing/ExampleChips.jsx`

```jsx
// Clickable chips that pre-fill the URL input.
// Props: onSelect (fn that receives the URL string)
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem, buttonGhostVariants } from '../../styles/animations';
import { EXAMPLE_REPOS } from '../../constants/exampleRepos';

export function ExampleChips({ onSelect }) {
  return (
    <motion.div
      className="flex flex-wrap gap-2 mt-4"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {EXAMPLE_REPOS.map(repo => (
        <motion.button
          key={repo.url}
          variants={{ ...staggerItem, ...buttonGhostVariants }}
          initial="initial"
          animate="animate"
          whileHover="hover"
          whileTap="tap"
          onClick={() => onSelect(repo.url)}
          className="font-mono text-xs text-neo-black bg-neo-white border-2 border-neo-black px-3 py-1.5 cursor-pointer"
          style={{ boxShadow: '2px 2px 0px #0A0A0A', borderRadius: 0 }}
        >
          {repo.label}
        </motion.button>
      ))}
    </motion.div>
  );
}
```

### 13.4 `src/components/landing/RepoUrlInput.jsx`

```jsx
// URL input + submit button. Manages shake animation on error.
// Props: onSubmit (fn that receives repoUrl string after validation)
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { shakeVariants } from '../../styles/animations';
import { Input } from '../shared/Input';
import { Button } from '../shared/Button';
import { UrlValidationError } from './UrlValidationError';
import { ExampleChips } from './ExampleChips';
import { useGitHubUrl } from '../../hooks/useGitHubUrl';

export function RepoUrlInput({ onSubmit, isLoading }) {
  const { url, error, isShaking, handleChange, validate, setUrlFromChip } = useGitHubUrl();

  const handleSubmit = (e) => {
    e?.preventDefault?.();
    const parsed = validate();
    if (parsed) onSubmit?.(url.trim());
  };

  return (
    <div className="w-full max-w-2xl">
      <motion.form
        animate={isShaking ? 'shake' : 'rest'}
        variants={shakeVariants}
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="flex gap-0">
          <Input
            type="url"
            value={url}
            onChange={handleChange}
            placeholder="https://github.com/owner/repository"
            error={!!error}
            disabled={isLoading}
            autoFocus
            aria-label="GitHub repository URL"
            aria-describedby={error ? 'url-error' : undefined}
            className="flex-1"
          />
          <Button
            type="submit"
            variant="primary"
            loading={isLoading}
            disabled={isLoading}
            className="flex-shrink-0"
          >
            Analyze <ArrowRight size={16} />
          </Button>
        </div>
      </motion.form>

      <AnimatePresence>
        {error && (
          <motion.div
            id="url-error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
          >
            <UrlValidationError message={error} />
          </motion.div>
        )}
      </AnimatePresence>

      <ExampleChips onSelect={setUrlFromChip} />
    </div>
  );
}
```

### 13.5 `src/components/landing/LandingPage.jsx`

```jsx
// Root landing view. Orchestrates staggered entrance animations.
// Calls setAppPhase('ingesting') after URL validation passes.
import { motion } from 'framer-motion';
import { AnimatedLogo } from './AnimatedLogo';
import { RepoUrlInput } from './RepoUrlInput';
import { useAppContext } from '../../context/AppContext';

export function LandingPage() {
  const { setAppPhase, setRepoUrl } = useAppContext();

  const handleSubmit = (url) => {
    setRepoUrl(url);
    setAppPhase('ingesting');
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-8 overflow-hidden">
      {/* Animated dot-grid background */}
      <div className="absolute inset-0 landing-grid-bg pointer-events-none" />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center text-center gap-6 max-w-3xl w-full">
        {/* Logo with letter stagger */}
        <AnimatedLogo />

        {/* Tagline */}
        <motion.p
          className="font-body text-lg md:text-xl text-neo-gray max-w-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.4, duration: 0.4, ease: 'easeOut' } }}
        >
          Have natural language conversations with any public GitHub repository.
        </motion.p>

        {/* URL input */}
        <motion.div
          className="w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.6, duration: 0.35, ease: 'easeOut' } }}
        >
          <RepoUrlInput onSubmit={handleSubmit} />
        </motion.div>
      </div>
    </div>
  );
}
```

---

## PHASE 14: Frontend — Ingestion Components

### 14.1 `src/components/ingestion/AnimatedProgressBar.jsx`

```jsx
// Striped animated progress bar.
// Props: percentage (0-100), isComplete (bool)
export function AnimatedProgressBar({ percentage, isComplete }) {
  return (
    <div
      className="w-full h-6 border-2 border-neo-black bg-neo-cream overflow-hidden"
      style={{ boxShadow: '3px 3px 0px #0A0A0A', borderRadius: 0 }}
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full transition-all duration-300 ease-out ${isComplete ? 'bg-neo-green' : 'progress-bar-fill'}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
```

### 14.2 `src/components/ingestion/PhaseStepIndicator.jsx`

```jsx
// Shows current phase as a 4-step indicator.
// Props: currentPhase (1-4), phaseLabel (string)
import { motion, AnimatePresence } from 'framer-motion';

const PHASES = [
  'Fetching file tree',
  'Reading file contents',
  'Chunking & processing',
  'Generating embeddings',
];

export function PhaseStepIndicator({ currentPhase, phaseLabel }) {
  return (
    <div className="space-y-2">
      {/* Phase label with crossfade animation */}
      <AnimatePresence mode="wait">
        <motion.p
          key={phaseLabel}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="font-mono text-xs font-bold uppercase tracking-widest text-neo-blue"
        >
          {phaseLabel}
        </motion.p>
      </AnimatePresence>

      {/* 4 step dots */}
      <div className="flex gap-2">
        {PHASES.map((_, i) => {
          const phase = i + 1;
          const isActive   = phase === currentPhase;
          const isComplete = phase < currentPhase;
          return (
            <div
              key={i}
              className={`h-2 flex-1 border border-neo-black transition-colors duration-300 ${
                isComplete ? 'bg-neo-green' : isActive ? 'bg-neo-yellow' : 'bg-neo-cream'
              }`}
              style={{ borderRadius: 0 }}
            />
          );
        })}
      </div>
    </div>
  );
}
```

### 14.3 `src/components/ingestion/FileProcessingTicker.jsx`

```jsx
// Rolling monospace display of the currently processing file.
// Props: currentFile (string)
import { motion, AnimatePresence } from 'framer-motion';
import { truncatePath } from '../../utils/formatters';

export function FileProcessingTicker({ currentFile }) {
  return (
    <div
      className="border-2 border-neo-black bg-neo-black px-3 py-2 overflow-hidden"
      style={{ borderRadius: 0 }}
    >
      <AnimatePresence mode="popLayout">
        <motion.p
          key={currentFile}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -10, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="font-mono text-xs text-neo-green truncate"
        >
          {currentFile ? `→ ${truncatePath(currentFile, 60)}` : '→ Initializing...'}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
```

### 14.4 `src/components/ingestion/IngestionStats.jsx`

```jsx
// Shows "X of Y files processed" and ETA.
// Props: processedFiles, totalFiles, estimatedSecondsRemaining
export function IngestionStats({ processedFiles, totalFiles, estimatedSecondsRemaining }) {
  const eta = estimatedSecondsRemaining != null
    ? estimatedSecondsRemaining < 60
      ? `~${estimatedSecondsRemaining}s remaining`
      : `~${Math.ceil(estimatedSecondsRemaining / 60)}m remaining`
    : null;

  return (
    <div className="flex items-center justify-between text-xs font-mono text-neo-gray">
      <span>
        <span className="font-bold text-neo-black">{processedFiles}</span>
        {' '}of{' '}
        <span className="font-bold text-neo-black">{totalFiles}</span>
        {' '}files
      </span>
      {eta && <span className="text-neo-blue font-medium">{eta}</span>}
    </div>
  );
}
```

### 14.5 `src/components/ingestion/SkippedFilesPanel.jsx`

```jsx
// Collapsible list of skipped files.
// Props: skippedFiles (string[]), skippedCount (number)
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { accordionVariants } from '../../styles/animations';

export function SkippedFilesPanel({ skippedFiles = [], skippedCount = 0 }) {
  const [open, setOpen] = useState(false);
  if (skippedCount === 0) return null;

  return (
    <div className="border border-neo-black text-xs">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 font-mono text-neo-gray hover:bg-neo-cream transition-colors"
      >
        <span>{skippedCount} files skipped (binary, lock files, or oversized)</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            variants={accordionVariants}
            initial="closed" animate="open" exit="closed"
            className="overflow-hidden"
          >
            <ul className="px-3 pb-2 space-y-0.5 max-h-32 overflow-y-auto">
              {skippedFiles.map((f, i) => (
                <li key={i} className="font-mono text-xs text-neo-gray truncate">{f}</li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

### 14.6 `src/components/ingestion/CompletionSummary.jsx`

```jsx
// Success state card shown when ingestion completes.
// Props: summary ({ totalFiles, totalChunks, languages, skippedCount, repoInfo }), onStartChat
import { motion } from 'framer-motion';
import { ArrowRight, Star } from 'lucide-react';
import { stampVariants } from '../../styles/animations';
import { LanguagePill } from '../shared/LanguagePill';
import { Button } from '../shared/Button';
import { formatNumber } from '../../utils/formatters';

export function CompletionSummary({ summary, onStartChat }) {
  const { repoInfo } = summary;

  return (
    <motion.div
      className="w-full border-2 border-neo-black bg-neo-white p-6"
      style={{ boxShadow: '6px 6px 0px #0A0A0A', borderRadius: 0 }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 280, damping: 25 } }}
    >
      {/* Stamp */}
      <motion.div
        variants={stampVariants}
        initial="initial"
        animate="animate"
        className="inline-block mb-4 border-4 border-neo-green px-4 py-2"
        style={{ rotate: '-2deg', borderRadius: 0 }}
      >
        <span className="font-display font-black text-neo-green text-xl tracking-widest">✓ READY</span>
      </motion.div>

      <h2 className="font-display font-bold text-2xl text-neo-black mb-1">{repoInfo.fullName}</h2>
      {repoInfo.description && (
        <p className="font-body text-sm text-neo-gray mb-4">{repoInfo.description}</p>
      )}

      {/* Stats row */}
      <div className="flex flex-wrap gap-4 mb-4 text-sm font-mono">
        <span><strong>{formatNumber(summary.totalFiles)}</strong> files</span>
        <span><strong>{formatNumber(summary.totalChunks)}</strong> chunks</span>
        <span className="flex items-center gap-1">
          <Star size={12} className="text-neo-yellow" />
          <strong>{formatNumber(repoInfo.stars)}</strong>
        </span>
      </div>

      {/* Languages */}
      <div className="flex flex-wrap gap-1 mb-6">
        {(summary.languages || []).slice(0, 6).map(lang => (
          <LanguagePill key={lang} language={lang} />
        ))}
      </div>

      {/* CTA */}
      <Button variant="primary" onClick={onStartChat} className="w-full justify-center">
        Start Chatting <ArrowRight size={16} />
      </Button>
    </motion.div>
  );
}
```

### 14.7 `src/components/ingestion/IngestionView.jsx`

```jsx
// Root ingestion orchestrator. Calls useIngestion hook, streams progress.
// Transitions to 'chat' phase on completion.
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useIngestion } from '../../hooks/useIngestion';
import { AnimatedProgressBar } from './AnimatedProgressBar';
import { PhaseStepIndicator } from './PhaseStepIndicator';
import { FileProcessingTicker } from './FileProcessingTicker';
import { IngestionStats } from './IngestionStats';
import { SkippedFilesPanel } from './SkippedFilesPanel';
import { CompletionSummary } from './CompletionSummary';
import { Button } from '../shared/Button';

export function IngestionView() {
  const { sessionId, repoUrl, setAppPhase, setRepoInfo } = useAppContext();
  const { startIngestion, progress, isComplete, error, completionSummary, cancel } = useIngestion();
  const started = useRef(false);

  // Start ingestion on mount (only once)
  useEffect(() => {
    if (!started.current && repoUrl && sessionId) {
      started.current = true;
      startIngestion(repoUrl, sessionId);
    }
  }, [repoUrl, sessionId, startIngestion]);

  // On completion, store repoInfo in context; auto-transition after 2s
  useEffect(() => {
    if (isComplete && completionSummary?.repoInfo) {
      setRepoInfo(completionSummary.repoInfo);
      const timer = setTimeout(() => setAppPhase('chat'), 2000);
      return () => clearTimeout(timer);
    }
  }, [isComplete, completionSummary, setAppPhase, setRepoInfo]);

  const handleCancel = () => {
    cancel();
    setAppPhase('landing');
  };

  const handleStartChat = () => {
    if (completionSummary?.repoInfo) setRepoInfo(completionSummary.repoInfo);
    setAppPhase('chat');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <p className="font-display font-bold text-xl">Analyzing Repository</p>
          {!isComplete && (
            <button onClick={handleCancel} className="flex items-center gap-1 text-xs font-body text-neo-gray hover:text-neo-black">
              <X size={14} /> Cancel
            </button>
          )}
        </div>

        {/* Error state */}
        {error && !isComplete && (
          <div className="border-2 border-neo-pink bg-neo-pink/10 p-4">
            <p className="font-body text-sm text-neo-pink font-medium mb-3">{error}</p>
            <Button variant="ghost" onClick={handleCancel}>← Try Another Repo</Button>
          </div>
        )}

        {/* Progress UI */}
        {!error && progress && (
          <>
            <PhaseStepIndicator currentPhase={progress.phaseNumber} phaseLabel={progress.phase} />
            <AnimatedProgressBar percentage={progress.percentage} isComplete={isComplete} />
            {!isComplete && (
              <>
                <IngestionStats
                  processedFiles={progress.processedFiles}
                  totalFiles={progress.totalFiles}
                  estimatedSecondsRemaining={progress.estimatedSecondsRemaining}
                />
                <FileProcessingTicker currentFile={progress.currentFile} />
                <SkippedFilesPanel skippedFiles={progress.skippedFiles} skippedCount={progress.skippedFiles?.length} />
              </>
            )}
          </>
        )}

        {/* Completion summary */}
        {isComplete && completionSummary && (
          <CompletionSummary summary={completionSummary} onStartChat={handleStartChat} />
        )}
      </div>
    </div>
  );
}
```

---

## PHASE 15: Frontend — Chat Components

### 15.1 `src/components/chat/StreamingCursor.jsx`

```jsx
// Blinking cursor shown at the end of a streaming response.
export function StreamingCursor() {
  return <span className="streaming-cursor" aria-hidden="true" />;
}
```

### 15.2 `src/components/chat/TypingIndicator.jsx`

```jsx
// Three bouncing squares shown while waiting for first token.
import { Loader } from '../shared/Loader';

export function TypingIndicator() {
  return (
    <div
      className="inline-flex items-center px-4 py-3 border-2 border-neo-black bg-neo-white"
      style={{ boxShadow: '3px 3px 0px #0A0A0A', borderRadius: 0 }}
    >
      <Loader size="sm" />
    </div>
  );
}
```

### 15.3 `src/components/chat/SourceChunkCard.jsx`

```jsx
// Single source chunk with score, file path, and expandable content.
// Props: chunk ({ filePath, fileName, chunkIndex, score, language, content })
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { RelevanceBadge } from '../shared/RelevanceBadge';
import { accordionVariants } from '../../styles/animations';
import { truncatePath } from '../../utils/formatters';

export function SourceChunkCard({ chunk }) {
  const [expanded, setExpanded] = useState(false);
  const preview = chunk.content.split('\n').slice(0, 3).join('\n');

  return (
    <div className="border border-neo-black text-xs" style={{ borderRadius: 0 }}>
      {/* Header row */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-neo-cream">
        <span className="font-mono text-neo-black truncate flex-1" title={chunk.filePath}>
          {truncatePath(chunk.filePath, 50)}
        </span>
        <RelevanceBadge score={chunk.score} />
      </div>

      {/* Preview content */}
      <pre className="px-3 py-2 font-mono text-xs text-neo-gray bg-white overflow-hidden leading-relaxed">
        {preview}
        {chunk.content.split('\n').length > 3 && !expanded && '...'}
      </pre>

      {/* Expand / collapse */}
      {chunk.content.split('\n').length > 3 && (
        <>
          <button
            onClick={() => setExpanded(o => !o)}
            className="w-full flex items-center justify-center gap-1 py-1 border-t border-neo-black/20 text-neo-gray hover:bg-neo-cream transition-colors font-body"
          >
            <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={12} />
            </motion.span>
            {expanded ? 'Show less' : 'Show more'}
          </button>
          <AnimatePresence>
            {expanded && (
              <motion.div variants={accordionVariants} initial="closed" animate="open" exit="closed">
                <pre className="px-3 py-2 font-mono text-xs text-neo-gray bg-white overflow-x-auto leading-relaxed border-t border-neo-black/20">
                  {chunk.content}
                </pre>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
```

### 15.4 `src/components/chat/SourceChunksPanel.jsx`

```jsx
// Collapsible panel showing all retrieved source chunks for a message.
// Props: sources (SourceChunk[])
import { useState } from 'react';
import { ChevronDown, Folder } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { accordionVariants } from '../../styles/animations';
import { SourceChunkCard } from './SourceChunkCard';

export function SourceChunksPanel({ sources = [] }) {
  const [open, setOpen] = useState(false);
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-2 border-2 border-neo-black/30" style={{ borderRadius: 0 }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-mono text-neo-gray hover:bg-neo-cream transition-colors"
      >
        <Folder size={12} />
        <span className="font-medium">Sources ({sources.length})</span>
        <motion.span className="ml-auto" animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={12} />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            variants={accordionVariants}
            initial="closed" animate="open" exit="closed"
            className="overflow-hidden"
          >
            <div className="p-2 space-y-2 border-t-2 border-neo-black/20">
              {sources.map((chunk, i) => (
                <SourceChunkCard key={`${chunk.filePath}-${chunk.chunkIndex}-${i}`} chunk={chunk} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

### 15.5 `src/components/chat/UserMessage.jsx`

```jsx
// Right-aligned user message bubble.
// Props: message ({ content, timestamp })
import { motion } from 'framer-motion';
import { userMessageVariants } from '../../styles/animations';

export function UserMessage({ message }) {
  return (
    <motion.div
      className="flex justify-end"
      variants={userMessageVariants}
      initial="initial"
      animate="animate"
    >
      <div className="flex flex-col items-end gap-1 max-w-[75%]">
        <span className="font-mono text-xs text-neo-gray uppercase tracking-widest">You</span>
        <div
          className="bg-neo-yellow border-2 border-neo-black px-4 py-3 text-sm font-body text-neo-black"
          style={{ boxShadow: '3px 3px 0px #0A0A0A', borderRadius: 0 }}
        >
          {message.content}
        </div>
      </div>
    </motion.div>
  );
}
```

### 15.6 `src/components/chat/AssistantMessage.jsx`

```jsx
// Left-aligned assistant message with markdown rendering.
// Shows TypingIndicator when content is empty and still streaming.
// Shows StreamingCursor at end of content while streaming.
// Props: message ({ content, isStreaming, sources, error })
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { assistantMessageVariants } from '../../styles/animations';
import { CodeBlock } from '../shared/CodeBlock';
import { StreamingCursor } from './StreamingCursor';
import { TypingIndicator } from './TypingIndicator';
import { SourceChunksPanel } from './SourceChunksPanel';

export function AssistantMessage({ message }) {
  const isEmpty = !message.content && message.isStreaming;

  return (
    <motion.div
      className="flex justify-start"
      variants={assistantMessageVariants}
      initial="initial"
      animate="animate"
    >
      <div className="flex flex-col gap-1 max-w-[85%]">
        <span className="font-mono text-xs text-neo-gray uppercase tracking-widest">GitChat</span>

        {isEmpty ? (
          <TypingIndicator />
        ) : (
          <div
            className={`bg-neo-white border-2 border-neo-black px-5 py-4 text-sm font-body ${
              message.error ? 'border-neo-pink' : 'border-neo-black'
            }`}
            style={{ boxShadow: '3px 3px 0px #0A0A0A', borderRadius: 0 }}
            aria-live="polite"
          >
            <div className="prose prose-sm max-w-none
              prose-headings:font-display prose-headings:font-bold prose-headings:text-neo-black
              prose-code:font-mono prose-code:bg-neo-cream prose-code:px-1 prose-code:border prose-code:border-neo-black/30 prose-code:text-neo-black
              prose-pre:p-0 prose-pre:bg-transparent prose-pre:border-none
              prose-blockquote:border-l-4 prose-blockquote:border-neo-blue prose-blockquote:bg-blue-50 prose-blockquote:pl-3
              prose-a:text-neo-blue prose-a:underline
              prose-strong:font-bold prose-strong:text-neo-black
            ">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    if (!inline && match) {
                      return <CodeBlock language={match[1]}>{children}</CodeBlock>;
                    }
                    return <code className={className} {...props}>{children}</code>;
                  },
                  a({ href, children }) {
                    return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
            {message.isStreaming && <StreamingCursor />}
          </div>
        )}

        {/* Source chunks panel (shown after streaming starts/completes) */}
        {!isEmpty && message.sources !== null && (
          <SourceChunksPanel sources={message.sources} />
        )}
      </div>
    </motion.div>
  );
}
```

### 15.7 `src/components/chat/SystemMessage.jsx`

```jsx
// Centered notification (e.g., "Chat cleared. Repository still loaded.")
// Props: message (string)
export function SystemMessage({ message }) {
  return (
    <div className="flex justify-center my-2">
      <div
        className="border border-neo-black/30 bg-neo-cream px-4 py-2 text-xs font-mono text-neo-gray"
        style={{ borderRadius: 0 }}
      >
        {message}
      </div>
    </div>
  );
}
```

### 15.8 `src/components/chat/SuggestedQuestions.jsx`

```jsx
// 6 starter chips shown in empty chat state.
// Chips animate in with stagger; disappear on first message.
// Props: onSelect (fn that receives the question string)
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem, buttonGhostVariants } from '../../styles/animations';
import { SUGGESTED_QUESTIONS } from '../../constants/suggestedQuestions';

export function SuggestedQuestions({ onSelect }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 py-12">
      <p className="font-mono text-xs uppercase tracking-widest text-neo-gray">
        Try asking...
      </p>
      <motion.div
        className="flex flex-wrap justify-center gap-2 max-w-xl"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {SUGGESTED_QUESTIONS.map((q, i) => (
          <motion.button
            key={i}
            variants={{ ...staggerItem, ...buttonGhostVariants }}
            initial="initial"
            animate="animate"
            whileHover="hover"
            whileTap="tap"
            onClick={() => onSelect(q)}
            className="font-body text-sm text-neo-black bg-neo-white border-2 border-neo-black px-4 py-2 cursor-pointer"
            style={{ boxShadow: '2px 2px 0px #0A0A0A', borderRadius: 0 }}
          >
            {q}
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}
```

### 15.9 `src/components/chat/ChatInput.jsx`

```jsx
// Auto-expanding textarea fixed at bottom of chat.
// Grows from 1 to 5 rows; Enter submits, Shift+Enter inserts newline.
// Props: value, onChange, onSubmit, disabled (bool), isStreaming (bool)
import { useRef, useEffect } from 'react';
import { SendHorizonal } from 'lucide-react';

export function ChatInput({ value, onChange, onSubmit, disabled, isStreaming }) {
  const ref = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    const lineHeight = 24; // px per line
    const maxLines = 5;
    const newHeight = Math.min(el.scrollHeight, lineHeight * maxLines + 24);
    el.style.height = `${newHeight}px`;
    el.style.overflowY = el.scrollHeight > newHeight ? 'auto' : 'hidden';
  }, [value]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && !isStreaming && value.trim()) onSubmit?.();
    }
  };

  const characterCount = value.length;
  const isOver = characterCount > 2000;

  return (
    <div className="border-t-2 border-neo-black bg-neo-white p-3">
      <div
        className="flex items-end gap-2 border-2 border-neo-black bg-neo-white focus-within:shadow-neo-blue focus-within:border-neo-blue transition-shadow duration-150"
        style={{ borderRadius: 0 }}
      >
        <textarea
          ref={ref}
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about this repository..."
          disabled={disabled || isStreaming}
          rows={1}
          className="flex-1 resize-none outline-none border-none bg-transparent font-body text-sm text-neo-black placeholder:text-neo-gray/60 px-3 py-2.5 min-h-[44px]"
          style={{ scrollbarWidth: 'none' }}
          aria-label="Message input"
          aria-describedby={isOver ? 'char-limit-warning' : undefined}
        />
        <div className="flex items-end pb-2 pr-2 gap-2">
          {/* Character counter — only shows near limit */}
          {characterCount > 1800 && (
            <span
              id="char-limit-warning"
              className={`font-mono text-xs ${isOver ? 'text-neo-pink' : 'text-neo-gray'}`}
            >
              {characterCount}/2000
            </span>
          )}
          <button
            onClick={onSubmit}
            disabled={disabled || isStreaming || !value.trim() || isOver}
            className="p-2 bg-neo-black text-neo-white hover:bg-neo-blue transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ borderRadius: 0 }}
            aria-label="Send message"
          >
            <SendHorizonal size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 15.10 `src/components/chat/ScrollToBottomBtn.jsx`

```jsx
// Floating "↓ New message" button that appears when user scrolls up.
// Props: onClick, isVisible (bool), isPulsing (bool — new message arrived)
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import { scrollButtonVariants } from '../../styles/animations';

export function ScrollToBottomBtn({ onClick, isVisible, isPulsing }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          variants={scrollButtonVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={onClick}
          className={`absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-2 bg-neo-black text-neo-white font-body text-xs font-bold border-2 border-neo-black ${isPulsing ? 'scroll-btn-pulse' : ''}`}
          style={{ boxShadow: '4px 4px 0px #0A0A0A', borderRadius: 0 }}
          aria-label="Scroll to bottom"
        >
          <ArrowDown size={14} />
          New message
        </motion.button>
      )}
    </AnimatePresence>
  );
}
```

### 15.11 `src/components/chat/MessageList.jsx`

```jsx
// Scrollable message list with auto-scroll behavior.
// Renders all message types: user, assistant, system, error.
// Props: messages (Message[]), isStreaming (bool)
import { useRef } from 'react';
import { useAutoScroll } from '../../hooks/useAutoScroll';
import { UserMessage } from './UserMessage';
import { AssistantMessage } from './AssistantMessage';
import { SystemMessage } from './SystemMessage';
import { SuggestedQuestions } from './SuggestedQuestions';
import { ScrollToBottomBtn } from './ScrollToBottomBtn';

export function MessageList({ messages, isStreaming, onSelectSuggestion }) {
  const containerRef = useRef(null);
  const msgCount = messages.filter(m => m.role !== 'system').length;
  const { showScrollButton, newMessageWhileScrolledUp, scrollToBottom } = useAutoScroll(containerRef, [msgCount, isStreaming]);

  return (
    <div className="relative flex-1 overflow-hidden">
      <div
        ref={containerRef}
        className="h-full overflow-y-auto px-4 py-6 space-y-4"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {/* Show suggested questions when empty */}
        {messages.length === 0 && (
          <SuggestedQuestions onSelect={onSelectSuggestion} />
        )}

        {messages.map(msg => {
          if (msg.role === 'system') return <SystemMessage key={msg.id} message={msg.content} />;
          if (msg.role === 'user')   return <UserMessage   key={msg.id} message={msg} />;
          return <AssistantMessage key={msg.id} message={msg} />;
        })}
      </div>

      {/* Scroll to bottom button */}
      <ScrollToBottomBtn
        onClick={() => scrollToBottom()}
        isVisible={showScrollButton}
        isPulsing={newMessageWhileScrolledUp}
      />
    </div>
  );
}
```

### 15.12 `src/components/chat/ChatView.jsx`

```jsx
// Root chat view — layout orchestrator.
import { useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useChat } from '../../hooks/useChat';
import { useToast } from '../../context/ToastContext';
import { AppHeader } from '../layout/AppHeader';
import { RepoInfoSidebar } from '../layout/RepoInfoSidebar';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';

export function ChatView() {
  const { sessionId } = useAppContext();
  const { addToast } = useToast();
  const { messages, isStreaming, sendMessage, clearChat, inputValue, setInputValue } = useChat(sessionId);

  const hasChatMessages = messages.filter(m => m.role === 'user' || m.role === 'assistant').length > 0;

  const handleSend = useCallback(() => {
    if (!inputValue.trim()) return;
    sendMessage(inputValue);
  }, [inputValue, sendMessage]);

  const handleClearChat = useCallback(() => {
    clearChat();
    addToast({ type: 'info', message: 'Chat cleared. Repository still loaded.' });
  }, [clearChat, addToast]);

  const handleSelectSuggestion = useCallback((question) => {
    setInputValue(question);
  }, [setInputValue]);

  return (
    <div className="flex flex-col h-screen bg-neo-cream">
      {/* Header */}
      <AppHeader onClearChat={handleClearChat} hasChatMessages={hasChatMessages} />

      {/* Body: message list + optional sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <MessageList
            messages={messages}
            isStreaming={isStreaming}
            onSelectSuggestion={handleSelectSuggestion}
          />
          <ChatInput
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onSubmit={handleSend}
            isStreaming={isStreaming}
          />
        </div>
      </div>

      {/* Repo info sidebar (overlays from right) */}
      <RepoInfoSidebar />
    </div>
  );
}
```

---

## PHASE 16: Frontend — App Entry Points

### 16.1 `src/App.jsx`

```jsx
// Top-level: provides context, phase-based rendering.
import { AnimatePresence, motion } from 'framer-motion';
import { AppProvider, useAppContext } from './context/AppContext';
import { ToastProvider } from './context/ToastContext';
import { ToastContainer } from './components/shared/ToastContainer';
import { LandingPage } from './components/landing/LandingPage';
import { IngestionView } from './components/ingestion/IngestionView';
import { ChatView } from './components/chat/ChatView';
import { pageVariants } from './styles/animations';

function AppContent() {
  const { appPhase } = useAppContext();

  return (
    <div className="h-screen">
      <AnimatePresence mode="wait">
        {appPhase === 'landing' && (
          <motion.div key="landing" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="h-full">
            <LandingPage />
          </motion.div>
        )}
        {appPhase === 'ingesting' && (
          <motion.div key="ingesting" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="h-full">
            <IngestionView />
          </motion.div>
        )}
        {appPhase === 'chat' && (
          <motion.div key="chat" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="h-full">
            <ChatView />
          </motion.div>
        )}
      </AnimatePresence>
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AppProvider>
  );
}
```

### 16.2 `src/main.jsx`

```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles/globals.css';
import './styles/animations.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

---

## PHASE 17: Running the Application

### 17.1 Backend: Create `.env` from `.env.example`

```bash
cd backend/
cp .env.example .env
# Edit .env and fill:
# ANTHROPIC_API_KEY=sk-ant-api03-...
# GITHUB_TOKEN=ghp_... (optional but strongly recommended)
```

### 17.2 First-Run: Pre-download Embedding Model

Run this once before starting the server to avoid the model download blocking the first request:

```bash
cd backend/
node -e "
import('@xenova/transformers').then(({ pipeline }) =>
  pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', { quantized: true })
).then(() => { console.log('Model ready'); process.exit(0); })
.catch(e => { console.error(e); process.exit(1); });
"
```

### 17.3 Start Both Servers

```bash
# From project root:
npm run dev

# Or individually:
npm run start:backend   # Express on :3001
npm run start:frontend  # Vite on :5173
```

### 17.4 Verify Health

```bash
curl http://localhost:3001/health
# → {"status":"ok","timestamp":"..."}
```

---

## PHASE 18: Known Gotchas & Final Checklist

| # | Issue | Fix |
|---|-------|-----|
| 1 | `vectordb` build fails | Install C++ build tools (§0.2), then `npm install vectordb --build-from-source` |
| 2 | `@xenova/transformers` hangs on first start | Pre-download model (§17.2) |
| 3 | SSE streaming doesn't work | Verify `res.flushHeaders()` is called in `sseMiddleware.js`, Vite proxy is set for `/api` |
| 4 | CORS errors in browser | Verify `FRONTEND_URL` in `.env` matches your Vite dev server URL exactly |
| 5 | LanceDB table not found on search | Call `VectorStoreService.initialize()` in `app.js` before routes |
| 6 | Framer Motion `motion.div` key conflicts | Ensure every `AnimatePresence` child has a stable `key` prop |
| 7 | React 18 StrictMode double-effect | `useRef(started)` guard in `IngestionView` prevents double ingestion |
| 8 | `useAutoScroll` not firing | Pass `[msgCount, isStreaming]` as the dependency array in `MessageList` |
| 9 | Code blocks crash with `await import` for theme | Import `oneDark` statically at top of `CodeBlock.jsx` instead |
| 10 | `sessionStorage` not persisting across tabs | By design (§3.2). Each tab gets its own session. |

---

## Appendix: Full Dependency Tree Summary

### Backend `package.json` (final)

```json
{
  "name": "gitchat-backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.32.0",
    "@octokit/rest": "^21.0.0",
    "@xenova/transformers": "^2.17.0",
    "compression": "^1.7.4",
    "cors": "^2.8.5",
    "dotenv": "^16.4.0",
    "express": "^4.21.0",
    "express-rate-limit": "^7.4.0",
    "helmet": "^8.0.0",
    "morgan": "^1.10.0",
    "uuid": "^10.0.0",
    "vectordb": "^0.4.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "eslint": "^9.0.0",
    "nodemon": "^3.1.0",
    "prettier": "^3.3.0"
  }
}
```

### Frontend `package.json` (final)

```json
{
  "name": "gitchat-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.7.0",
    "framer-motion": "^11.0.0",
    "lucide-react": "^0.400.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-markdown": "^9.0.0",
    "react-syntax-highlighter": "^15.5.0",
    "remark-gfm": "^4.0.0",
    "uuid": "^10.0.0"
  },
  "devDependencies": {
    "@tailwindcss/forms": "^0.5.0",
    "@tailwindcss/typography": "^0.5.0",
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^9.0.0",
    "postcss": "^8.4.0",
    "prettier": "^3.0.0",
    "tailwindcss": "^3.4.0",
    "vite": "^5.4.0"
  }
}
```