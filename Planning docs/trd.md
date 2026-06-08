# Technical Requirements Document (TRD)
## GitChat — Conversational Intelligence for GitHub Repositories

---

| Field            | Value                                          |
|------------------|------------------------------------------------|
| **Product Name** | GitChat                                        |
| **Version**      | 1.0.0                                          |
| **Status**       | Active Draft                                   |
| **Date**         | June 2026                                      |
| **Document Type**| Technical Requirements & Architecture          |

---

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Frontend — Technology Stack](#2-frontend--technology-stack)
3. [Frontend — Component Architecture](#3-frontend--component-architecture)
4. [Frontend — State Management](#4-frontend--state-management)
5. [Frontend — Routing & Navigation](#5-frontend--routing--navigation)
6. [Frontend — Animation Architecture (Framer Motion)](#6-frontend--animation-architecture-framer-motion)
7. [Backend — Technology Stack](#7-backend--technology-stack)
8. [Backend — Project Structure](#8-backend--project-structure)
9. [Backend — API Specification](#9-backend--api-specification)
10. [RAG Pipeline — Technical Deep Dive](#10-rag-pipeline--technical-deep-dive)
11. [GitHub Integration (Octokit)](#11-github-integration-octokit)
12. [Embedding Service (@xenova/transformers)](#12-embedding-service-xenovatransformers)
13. [Vector Store (LanceDB)](#13-vector-store-lancedb)
14. [LLM Integration (Anthropic Claude)](#14-llm-integration-anthropic-claude)
15. [Session Management](#15-session-management)
16. [Security Architecture](#16-security-architecture)
17. [Error Handling Strategy](#17-error-handling-strategy)
18. [Environment Configuration](#18-environment-configuration)
19. [Package Installation Guide](#19-package-installation-guide)
20. [Development Tooling](#20-development-tooling)
21. [Data Models & Schemas](#21-data-models--schemas)
22. [Performance Considerations](#22-performance-considerations)

---

## 1. System Architecture Overview

### 1.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BROWSER (React SPA)                          │
│  ┌──────────┐  ┌────────────────┐  ┌──────────────────────────┐    │
│  │ Landing  │  │   Ingestion    │  │     Chat Interface        │    │
│  │  Page    │  │   Progress     │  │  (SSE Consumer)           │    │
│  └──────────┘  └────────────────┘  └──────────────────────────┘    │
│              HTTP REST + Server-Sent Events (SSE)                    │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   EXPRESS.JS API SERVER (Node.js 20)                 │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐    │
│  │  POST       │  │  POST        │  │  GET/DELETE              │    │
│  │  /api/repo  │  │  /api/chat   │  │  /api/repo/session       │    │
│  │  /ingest    │  │  /message    │  │  /:sessionId             │    │
│  └──────┬──────┘  └──────┬───────┘  └─────────────────────────┘    │
│         │                │                                           │
│  ┌──────▼──────────────────────────────────────────────────────┐    │
│  │                    SERVICE LAYER                             │    │
│  │  GithubService  │  ChunkingService  │  EmbeddingService     │    │
│  │  VectorStoreService  │  LLMService  │  SessionManager       │    │
│  └──────┬───────────────────────┬──────────────────────┬───────┘    │
└─────────┼───────────────────────┼──────────────────────┼────────────┘
          │                       │                       │
          ▼                       ▼                       ▼
┌─────────────────┐   ┌───────────────────┐   ┌──────────────────────┐
│  GITHUB API     │   │  LANCEDB          │   │  ANTHROPIC CLAUDE    │
│  api.github.com │   │  (Local Disk)     │   │  API                 │
│  (Octokit REST) │   │  vector_store/    │   │  api.anthropic.com   │
└─────────────────┘   └───────────────────┘   └──────────────────────┘
                                │
                       ┌────────▼─────────┐
                       │  @xenova/         │
                       │  transformers     │
                       │  (Local ONNX)     │
                       │  Embedding Model  │
                       └──────────────────┘
```

### 1.2 Communication Protocols

| Communication | Protocol | Notes |
|--------------|----------|-------|
| Browser → Express (standard requests) | HTTP REST (JSON) | POST, GET, DELETE |
| Express → Browser (streaming) | Server-Sent Events (SSE) | `text/event-stream` |
| Express → GitHub API | HTTPS REST | Via `@octokit/rest` |
| Express → LanceDB | In-process function call | Local disk I/O |
| Express → Anthropic Claude API | HTTPS REST (streaming) | Via `@anthropic-ai/sdk` |
| Express → Embedding Model | In-process ONNX inference | Via `@xenova/transformers` |

### 1.3 Technology Decision Rationale

| Decision | Choice | Alternatives Considered | Rationale |
|----------|--------|------------------------|-----------|
| Frontend framework | React 18 | Next.js, Vue 3, Svelte | Widest ecosystem, familiar, Vite for fast DX |
| Animation library | Framer Motion | CSS only, React Spring | Best API for complex spring animations, layout animations |
| Embedding model | `all-MiniLM-L6-v2` | OpenAI Ada, Cohere | **No API key required**, local inference, 384 dims is sufficient for code retrieval |
| Vector database | LanceDB (`vectordb`) | Chroma, Qdrant, Pinecone, Weaviate | **No Docker server required**, native Node.js support, in-process, perfect for dev |
| LLM | Claude Sonnet (Anthropic) | OpenAI GPT-4, Gemini | High quality, streaming support, strong code comprehension |
| GitHub client | `@octokit/rest` | Axios with raw GitHub API | Official client, typed responses, rate limit handling built-in |

---

## 2. Frontend — Technology Stack

### 2.1 Core Dependencies

| Package | Version | Purpose | Install Command |
|---------|---------|---------|----------------|
| `react` | `^18.3.0` | UI component framework | Included with Vite template |
| `react-dom` | `^18.3.0` | DOM rendering | Included with Vite template |
| `vite` | `^5.4.0` | Build tool & dev server | Included with Vite template |
| `@vitejs/plugin-react` | `^4.3.0` | Vite React plugin | Included with Vite template |

### 2.2 UI & Styling

| Package | Version | Purpose | Install Command |
|---------|---------|---------|----------------|
| `tailwindcss` | `^3.4.0` | Utility-first CSS | `npm install -D tailwindcss` |
| `postcss` | `^8.4.0` | CSS processing | `npm install -D postcss` |
| `autoprefixer` | `^10.4.0` | CSS vendor prefixes | `npm install -D autoprefixer` |
| `@tailwindcss/typography` | `^0.5.0` | Prose/markdown styling | `npm install @tailwindcss/typography` |
| `@tailwindcss/forms` | `^0.5.0` | Form element base styles | `npm install @tailwindcss/forms` |

### 2.3 Animation

| Package | Version | Purpose | Install Command |
|---------|---------|---------|----------------|
| `framer-motion` | `^11.0.0` | Physics animations, layout animations, presence | `npm install framer-motion` |

### 2.4 Data Fetching & Communication

| Package | Version | Purpose | Install Command |
|---------|---------|---------|----------------|
| `axios` | `^1.7.0` | HTTP client with interceptors | `npm install axios` |

> **Note on SSE:** The browser's native `EventSource` API is used for SSE streaming. No additional package is needed.

### 2.5 Content Rendering

| Package | Version | Purpose | Install Command |
|---------|---------|---------|----------------|
| `react-markdown` | `^9.0.0` | Markdown → React component renderer | `npm install react-markdown` |
| `remark-gfm` | `^4.0.0` | GitHub Flavored Markdown plugin (tables, strikethrough) | `npm install remark-gfm` |
| `react-syntax-highlighter` | `^15.5.0` | Syntax-highlighted code blocks | `npm install react-syntax-highlighter` |

### 2.6 Icons & UX

| Package | Version | Purpose | Install Command |
|---------|---------|---------|----------------|
| `lucide-react` | `^0.400.0` | Icon set (Send, Copy, Check, ChevronDown, etc.) | `npm install lucide-react` |
| `uuid` | `^10.0.0` | Session ID generation on client | `npm install uuid` |

### 2.7 Development Dependencies

| Package | Version | Purpose | Install Command |
|---------|---------|---------|----------------|
| `eslint` | `^9.0.0` | Linting | `npm install -D eslint` |
| `prettier` | `^3.0.0` | Code formatting | `npm install -D prettier` |
| `eslint-plugin-react` | `^7.35.0` | React-specific lint rules | `npm install -D eslint-plugin-react` |
| `eslint-config-prettier` | `^9.0.0` | Disable eslint rules conflicting with prettier | `npm install -D eslint-config-prettier` |

---

## 3. Frontend — Component Architecture

### 3.1 Full Directory Structure

```
frontend/
├── public/
│   ├── favicon.ico
│   └── fonts/                      # Self-hosted font fallbacks (optional)
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppHeader.jsx         # Top bar: logo, repo name badge, "Change Repo" btn, info toggle
│   │   │   └── RepoInfoSidebar.jsx   # Collapsible right panel with repo metadata
│   │   │
│   │   ├── landing/
│   │   │   ├── LandingPage.jsx       # Root landing view, orchestrates entrance animations
│   │   │   ├── AnimatedLogo.jsx      # Letter-by-letter stagger animation for "GitChat"
│   │   │   ├── RepoUrlInput.jsx      # URL input field with validation state management
│   │   │   ├── UrlValidationError.jsx # Inline error display below input
│   │   │   └── ExampleChips.jsx      # Clickable example repo chips
│   │   │
│   │   ├── ingestion/
│   │   │   ├── IngestionView.jsx     # Root ingestion view, receives SSE events from parent
│   │   │   ├── PhaseStepIndicator.jsx # Phase 1/4, 2/4 step indicator with animated transitions
│   │   │   ├── AnimatedProgressBar.jsx # Striped, animated progress fill bar
│   │   │   ├── FileProcessingTicker.jsx # Rolling display of current file being processed
│   │   │   ├── IngestionStats.jsx    # "X of Y files processed", ETA display
│   │   │   ├── CompletionSummary.jsx # Success state card with stats + "Start Chatting" btn
│   │   │   └── SkippedFilesPanel.jsx # Collapsible list of skipped files
│   │   │
│   │   ├── chat/
│   │   │   ├── ChatView.jsx          # Root chat view, layout orchestrator
│   │   │   ├── MessageList.jsx       # Virtualized scroll area for all messages
│   │   │   ├── MessageBubble.jsx     # Single message (user/assistant/system/error)
│   │   │   ├── UserMessage.jsx       # Right-aligned user message bubble
│   │   │   ├── AssistantMessage.jsx  # Left-aligned assistant message with markdown + sources
│   │   │   ├── SystemMessage.jsx     # Centered system notification (e.g., "Repo loaded")
│   │   │   ├── StreamingCursor.jsx   # Blinking | cursor during generation
│   │   │   ├── TypingIndicator.jsx   # Bouncing squares while waiting for first token
│   │   │   ├── SourceChunksPanel.jsx # Collapsible accordion with retrieved chunks
│   │   │   ├── SourceChunkCard.jsx   # Individual source chunk with score + content
│   │   │   ├── SuggestedQuestions.jsx # Starter chips for empty chat state
│   │   │   ├── ChatInput.jsx         # Auto-expanding textarea + Send button
│   │   │   └── ScrollToBottomBtn.jsx # Floating "↓" button when scrolled up
│   │   │
│   │   └── shared/
│   │       ├── Button.jsx            # Neo-brutalism button (primary, ghost, danger variants)
│   │       ├── Input.jsx             # Styled text input with error/focus states
│   │       ├── CodeBlock.jsx         # Syntax-highlighted code block with copy button
│   │       ├── Modal.jsx             # Confirmation modal with focus trap + Escape handler
│   │       ├── Toast.jsx             # Toast notification (error, success, warning)
│   │       ├── ToastContainer.jsx    # Manages multiple stacked toasts
│   │       ├── RelevanceBadge.jsx    # Score badge with color-coded relevance
│   │       ├── LanguagePill.jsx      # Colored programming language tag
│   │       └── Loader.jsx            # Bouncing squares loader (neo-brutalism style)
│   │
│   ├── context/
│   │   ├── AppContext.jsx            # Global state: appPhase, sessionId, repoInfo
│   │   └── ToastContext.jsx          # Toast queue management
│   │
│   ├── hooks/
│   │   ├── useIngestion.js           # Manages SSE connection for ingestion, progress state
│   │   ├── useChat.js                # Send message, receive SSE stream, manage message list
│   │   ├── useSSE.js                 # Generic EventSource hook (reconnect, cleanup)
│   │   ├── useAutoScroll.js          # Detects manual scroll-up, manages scroll-to-bottom btn
│   │   ├── useClipboard.js           # Copy-to-clipboard with confirmation state
│   │   ├── useGitHubUrl.js           # URL parsing + client-side validation logic
│   │   └── useSession.js             # Session ID generation + sessionStorage persistence
│   │
│   ├── utils/
│   │   ├── api.js                    # Axios instance with base URL, interceptors
│   │   ├── urlParser.js              # GitHub URL normalization (all format variants)
│   │   ├── validators.js             # Client-side validation functions
│   │   └── formatters.js            # formatRelativeTime(), formatFileSize(), formatNumber()
│   │
│   ├── styles/
│   │   ├── globals.css               # CSS custom properties, base reset, font imports
│   │   └── animations.css            # Keyframe animations (shimmer, stripe, blink-cursor)
│   │
│   ├── constants/
│   │   ├── exampleRepos.js           # Array of example repository URLs with metadata
│   │   └── suggestedQuestions.js     # Array of starter question strings
│   │
│   ├── App.jsx                       # Top-level: AppContext provider, phase-based render
│   └── main.jsx                      # ReactDOM.createRoot, StrictMode
│
├── index.html                        # HTML template with Google Fonts link
├── vite.config.js                    # Vite config (proxy to backend in dev)
├── tailwind.config.js                # Tailwind theme extension (neo-brutalism tokens)
├── postcss.config.js                 # PostCSS config (autoprefixer)
└── package.json
```

### 3.2 Component Responsibilities Summary

**`App.jsx`**
- Provides `AppContext` and `ToastContext`
- Conditionally renders `LandingPage`, `IngestionView`, or `ChatView` based on `appPhase`
- Wraps children in `AnimatePresence` for page-level transitions

**`useIngestion.js`** (custom hook)
```javascript
// Returns:
{
  startIngestion: (repoUrl) => Promise<void>,  // Opens SSE, updates progress state
  progress: IngestionProgressState,             // { phase, percentage, currentFile, ... }
  isComplete: boolean,
  error: string | null,
  cancel: () => void                            // Closes SSE, calls DELETE /api/repo/session
}
```

**`useChat.js`** (custom hook)
```javascript
// Returns:
{
  messages: Message[],
  isStreaming: boolean,
  sendMessage: (text: string) => Promise<void>,  // Opens SSE, appends tokens
  clearChat: () => void,
  inputValue: string,
  setInputValue: (v: string) => void
}
```

**`useSSE.js`** (generic)
```javascript
// Generic EventSource management
// - Opens connection to url
// - Calls onMessage(event) for each SSE event
// - Calls onError(event) on connection error
// - Auto-reconnects up to maxRetries (default: 3) times on error
// - Returns { close: () => void }
```

---

## 4. Frontend — State Management

### 4.1 Global App State (`AppContext`)

```typescript
interface AppState {
  appPhase: 'landing' | 'ingesting' | 'chat';
  sessionId: string;                  // UUID v4, generated on app mount
  repoUrl: string;                    // Current or last entered URL (for re-ingestion)
  repoInfo: RepoInfo | null;          // Populated after ingestion completes
  ingestionProgress: IngestionProgress | null;
}

interface RepoInfo {
  owner: string;
  name: string;
  fullName: string;                   // "owner/repo"
  description: string;
  stars: number;
  primaryLanguage: string;
  languages: string[];
  totalFiles: number;
  totalChunks: number;
  ingestedAt: Date;
}

interface IngestionProgress {
  phase: string;                      // e.g., "Phase 2/4: Reading file contents"
  phaseNumber: number;                // 1–4
  percentage: number;                 // 0–100
  currentFile: string;
  processedFiles: number;
  totalFiles: number;
  estimatedSecondsRemaining: number;
  skippedFiles: string[];
}
```

### 4.2 Chat State

Chat state is managed locally in `ChatView.jsx` via `useChat.js` hook and is not global context (no need to share outside chat).

```typescript
interface Message {
  id: string;                         // UUID v4
  role: 'user' | 'assistant' | 'system' | 'error';
  content: string;                    // Full or partial (during streaming)
  isStreaming: boolean;               // True while SSE tokens are incoming
  sources: SourceChunk[] | null;      // Populated before streaming starts
  timestamp: Date;
  error: boolean;                     // True if this is an error message
}

interface SourceChunk {
  filePath: string;
  fileName: string;
  chunkIndex: number;
  content: string;
  score: number;                      // 0.0–1.0 cosine similarity
  language: string;
}
```

### 4.3 Toast State (`ToastContext`)

```typescript
interface Toast {
  id: string;
  type: 'error' | 'success' | 'warning' | 'info';
  message: string;
  duration: number;                   // ms, default 5000
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}
```

---

## 5. Frontend — Routing & Navigation

### 5.1 Routing Strategy

GitChat uses **phase-based conditional rendering** rather than URL routing. This is intentional:
- There are only 3 "screens" (landing, ingesting, chat) — traditional routing would add unnecessary complexity
- The session state (sessionId, repoInfo) is critical and lives in memory; page navigation would lose it
- URLs don't need to be shareable or bookmarkable (v1 scope)

```jsx
// App.jsx — Phase-based rendering
<AnimatePresence mode="wait">
  {appPhase === 'landing' && (
    <motion.div key="landing" {...pageTransitionProps}>
      <LandingPage />
    </motion.div>
  )}
  {appPhase === 'ingesting' && (
    <motion.div key="ingesting" {...pageTransitionProps}>
      <IngestionView />
    </motion.div>
  )}
  {appPhase === 'chat' && (
    <motion.div key="chat" {...pageTransitionProps}>
      <ChatView />
    </motion.div>
  )}
</AnimatePresence>
```

### 5.2 Vite Dev Proxy

To avoid CORS during development, Vite proxies `/api` requests to the backend:

```javascript
// vite.config.js
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path  // Keep /api prefix
      }
    }
  }
})
```

---

## 6. Frontend — Animation Architecture (Framer Motion)

### 6.1 Animation Constants (`src/styles/animations.js`)

```javascript
// Reusable Framer Motion variants — import where needed

export const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, y: -20, transition: { duration: 0.25, ease: 'easeIn' } }
}

export const buttonVariants = {
  rest:  { x: 0, y: 0, boxShadow: '4px 4px 0px #0A0A0A' },
  hover: { x: 2, y: 2, boxShadow: '2px 2px 0px #0A0A0A', transition: { duration: 0.08 } },
  tap:   { x: 4, y: 4, boxShadow: '0px 0px 0px #0A0A0A', transition: { duration: 0.05 } }
}

export const shakeVariants = {
  shake: {
    x: [0, -8, 8, -6, 6, -3, 3, 0],
    transition: { duration: 0.45, ease: 'easeInOut' }
  }
}

export const userMessageVariants = {
  initial: { opacity: 0, x: 30, scale: 0.94 },
  animate: { opacity: 1, x: 0, scale: 1, transition: { type: 'spring', stiffness: 400, damping: 30 } }
}

export const assistantMessageVariants = {
  initial: { opacity: 0, x: -30, scale: 0.94 },
  animate: { opacity: 1, x: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 28 } }
}

export const staggerContainer = {
  animate: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } }
}

export const staggerItem = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 350, damping: 28 } }
}

export const accordionVariants = {
  open: {
    height: 'auto',
    opacity: 1,
    transition: { height: { duration: 0.25, ease: 'easeOut' }, opacity: { duration: 0.2 } }
  },
  closed: {
    height: 0,
    opacity: 0,
    transition: { height: { duration: 0.2, ease: 'easeIn' }, opacity: { duration: 0.15 } }
  }
}

export const stampVariants = {
  initial: { scale: 0, rotate: -8, opacity: 0 },
  animate: {
    scale: [0, 1.15, 0.95, 1.05, 1],
    rotate: [-8, 3, -2, 1, 0],
    opacity: 1,
    transition: { type: 'spring', duration: 0.6, bounce: 0.5 }
  }
}

export const scrollButtonVariants = {
  hidden: { scale: 0, opacity: 0, transition: { duration: 0.15 } },
  visible: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 400, damping: 25 } }
}
```

### 6.2 Custom CSS Keyframes (`src/styles/animations.css`)

```css
/* Striped progress bar animation */
@keyframes progress-stripes {
  0%   { background-position: 0 0; }
  100% { background-position: 40px 0; }
}

/* Shimmer for skeleton loaders */
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* Blinking cursor */
@keyframes blink-cursor {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}

/* Pulse for "scroll to bottom" button when new message arrives */
@keyframes pulse-ring {
  0%   { transform: scale(1); box-shadow: 4px 4px 0px #0A0A0A; }
  50%  { transform: scale(1.06); box-shadow: 6px 6px 0px #0A0A0A; }
  100% { transform: scale(1); box-shadow: 4px 4px 0px #0A0A0A; }
}

/* Background grid movement */
@keyframes grid-drift {
  0%   { background-position: 0 0; }
  100% { background-position: 40px 40px; }
}

/* Success flash on progress bar completion */
@keyframes success-flash {
  0%   { background-color: #FFE500; }
  50%  { background-color: #00FF87; }
  100% { background-color: #FFE500; }
}
```

---

## 7. Backend — Technology Stack

### 7.1 Core Runtime & Framework

| Package | Version | Purpose | Install |
|---------|---------|---------|---------|
| `node` | `20.x LTS` | JavaScript runtime | System install (see §19) |
| `express` | `^4.21.0` | HTTP server framework | `npm install express` |

### 7.2 Middleware & Security

| Package | Version | Purpose | Install |
|---------|---------|---------|---------|
| `cors` | `^2.8.5` | Cross-Origin Resource Sharing | `npm install cors` |
| `helmet` | `^8.0.0` | Security HTTP headers | `npm install helmet` |
| `morgan` | `^1.10.0` | HTTP request logging | `npm install morgan` |
| `express-rate-limit` | `^7.4.0` | Rate limiting middleware | `npm install express-rate-limit` |
| `compression` | `^1.7.4` | Gzip compression for responses | `npm install compression` |

### 7.3 Core Services

| Package | Version | Purpose | Install |
|---------|---------|---------|---------|
| `@octokit/rest` | `^21.0.0` | Official GitHub REST API client | `npm install @octokit/rest` |
| `@xenova/transformers` | `^2.17.0` | Local ML inference (embeddings) | `npm install @xenova/transformers` |
| `vectordb` | `^0.4.0` | LanceDB — local vector database | `npm install vectordb` |
| `@anthropic-ai/sdk` | `^0.32.0` | Anthropic Claude API client | `npm install @anthropic-ai/sdk` |

### 7.4 Utilities

| Package | Version | Purpose | Install |
|---------|---------|---------|---------|
| `dotenv` | `^16.4.0` | Environment variable loading | `npm install dotenv` |
| `uuid` | `^10.0.0` | UUID v4 generation | `npm install uuid` |
| `zod` | `^3.23.0` | Runtime schema validation | `npm install zod` |

### 7.5 Development Dependencies

| Package | Version | Purpose | Install |
|---------|---------|---------|---------|
| `nodemon` | `^3.1.0` | Auto-restart on file change | `npm install -D nodemon` |
| `eslint` | `^9.0.0` | Linting | `npm install -D eslint` |
| `prettier` | `^3.3.0` | Code formatting | `npm install -D prettier` |

---

## 8. Backend — Project Structure

```
backend/
├── src/
│   ├── app.js                      # Express app instantiation, middleware, route mounting
│   ├── server.js                   # HTTP server start, port binding, graceful shutdown
│   │
│   ├── routes/
│   │   ├── repo.js                 # /api/repo/ingest, /api/repo/status/:id, /api/repo/session/:id
│   │   └── chat.js                 # /api/chat/message
│   │
│   ├── services/
│   │   ├── githubService.js        # Octokit wrapper: repo metadata, file tree, file content
│   │   ├── chunkingService.js      # Recursive character text splitter
│   │   ├── embeddingService.js     # @xenova/transformers singleton, embed(), embedBatch()
│   │   ├── vectorStoreService.js   # LanceDB table CRUD: upsert chunks, search, delete session
│   │   └── llmService.js           # Prompt assembly, Claude streaming call, standalone Q rewrite
│   │
│   ├── middleware/
│   │   ├── errorHandler.js         # Global error handler (catches all thrown errors)
│   │   ├── rateLimiter.js          # Per-route rate limiters (ingestion vs chat vs general)
│   │   ├── validateRequest.js      # Zod schema validation middleware factory
│   │   └── sseMiddleware.js        # Sets SSE headers, provides res.sendEvent() helper
│   │
│   ├── utils/
│   │   ├── urlParser.js            # GitHub URL normalization (same logic as frontend, shared)
│   │   ├── sessionManager.js       # In-memory session store + TTL cleanup timer
│   │   ├── fileFilter.js           # INCLUDE/EXCLUDE lists, binary detection
│   │   ├── logger.js               # Timestamped console logger (info, warn, error)
│   │   └── tokenCounter.js         # Rough character-to-token estimator
│   │
│   └── schemas/
│       ├── repoSchemas.js          # Zod schemas: IngestRequest, SessionIdParam
│       └── chatSchemas.js          # Zod schemas: ChatMessageRequest
│
├── vector_store/                   # LanceDB data directory (auto-created, gitignored)
├── .env                            # Environment variables (gitignored)
├── .env.example                    # Template with all required keys
├── .gitignore
└── package.json
```

### 8.1 `app.js` Structure

```javascript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';

import { globalRateLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import repoRoutes from './routes/repo.js';
import chatRoutes from './routes/chat.js';
import { EmbeddingService } from './services/embeddingService.js';
import { VectorStoreService } from './services/vectorStoreService.js';

dotenv.config();

const app = express();

// Security & parsing middleware
app.use(helmet({ contentSecurityPolicy: false }));  // CSP off for SSE compatibility
app.use(cors({ origin: process.env.FRONTEND_URL, methods: ['GET', 'POST', 'DELETE'] }));
app.use(compression());
app.use(express.json({ limit: '10kb' }));
app.use(morgan('dev'));
app.use(globalRateLimiter);

// Routes
app.use('/api/repo', repoRoutes);
app.use('/api/chat', chatRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Global error handler (must be last)
app.use(errorHandler);

// Pre-warm the embedding model on startup
EmbeddingService.initialize().then(() => {
  console.log('[EmbeddingService] Model loaded and ready');
}).catch(console.error);

// Initialize LanceDB
VectorStoreService.initialize().then(() => {
  console.log('[VectorStoreService] LanceDB ready at', process.env.VECTOR_STORE_PATH);
}).catch(console.error);

export default app;
```

---

## 9. Backend — API Specification

### 9.1 `POST /api/repo/ingest`

**Purpose:** Start ingestion of a GitHub repository. Returns an SSE stream.

**Request Validation (Zod):**
```javascript
const IngestRequest = z.object({
  repoUrl: z.string().url().includes('github.com'),
  sessionId: z.string().uuid()
});
```

**Request Body:**
```json
{
  "repoUrl": "https://github.com/facebook/react",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response Headers:**
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
X-Accel-Buffering: no
```

**SSE Event Types:**

```
data: {"type":"start","repoInfo":{"owner":"facebook","name":"react","description":"...","stars":220000,"primaryLanguage":"JavaScript"}}

data: {"type":"phase","phase":"Phase 1/4: Fetching file tree","phaseNumber":1,"percentage":0}

data: {"type":"progress","phase":"Phase 2/4: Reading file contents","phaseNumber":2,"percentage":23,"currentFile":"packages/react/src/ReactElement.js","processedFiles":47,"totalFiles":203}

data: {"type":"phase","phase":"Phase 3/4: Chunking & processing","phaseNumber":3,"percentage":50}

data: {"type":"phase","phase":"Phase 4/4: Generating embeddings","phaseNumber":4,"percentage":75}

data: {"type":"progress","phaseNumber":4,"percentage":82,"currentFile":"Embedding batch 12/15","processedFiles":180,"totalFiles":203}

data: {"type":"warning","message":"3 files skipped (binary or oversized)","skippedFiles":["assets/logo.png","dist/bundle.min.js","package-lock.json"]}

data: {"type":"complete","summary":{"totalFiles":200,"totalChunks":1847,"languages":["JavaScript","TypeScript","HTML","CSS","Markdown"],"skippedCount":3}}

data: {"type":"error","message":"Repository not found. Please check the URL.","code":"REPO_NOT_FOUND"}
```

**Error Codes:**

| Code | Meaning |
|------|---------|
| `REPO_NOT_FOUND` | GitHub 404 on repo lookup |
| `REPO_PRIVATE` | Repository is not publicly accessible |
| `REPO_EMPTY` | Repository has no commits or no processable files |
| `RATE_LIMIT_EXCEEDED` | GitHub API rate limit hit; includes `retryAfter` seconds |
| `EMBEDDING_ERROR` | Embedding model failed for a batch |
| `INTERNAL_ERROR` | Unexpected server error |

---

### 9.2 `POST /api/chat/message`

**Purpose:** Send a chat message and receive a streaming response via SSE.

**Request Validation (Zod):**
```javascript
const ChatMessageRequest = z.object({
  sessionId: z.string().uuid(),
  message: z.string().min(1).max(2000).trim(),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(4000)
  })).max(12)  // Max 6 turns = 12 messages
});
```

**Request Body:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "How does React's reconciliation algorithm work?",
  "history": [
    { "role": "user", "content": "What does this repository do?" },
    { "role": "assistant", "content": "This is the React source code repository..." }
  ]
}
```

**SSE Event Sequence:**

```
data: {"type":"standalone_question","question":"How does React's reconciliation (diffing) algorithm work internally?"}

data: {"type":"sources","chunks":[{"filePath":"packages/react-reconciler/src/ReactFiber.js","fileName":"ReactFiber.js","chunkIndex":2,"score":0.913,"language":"JavaScript","content":"function createFiber(tag, pendingProps, key, mode) {..."},{"filePath":"packages/react-reconciler/src/ReactFiberBeginWork.js","fileName":"ReactFiberBeginWork.js","chunkIndex":7,"score":0.877,"language":"JavaScript","content":"..."}]}

data: {"type":"token","content":"React's"}
data: {"type":"token","content":" reconciliation"}
data: {"type":"token","content":" algorithm,"}
data: {"type":"token","content":" known"}
data: {"type":"token","content":" as"}
data: {"type":"token","content":" the"}
data: {"type":"token","content":" **Fiber"}
data: {"type":"token","content":" architecture"}
data: {"type":"token","content":"**,"}

... (many more token events)

data: {"type":"done","inputTokens":1847,"outputTokens":423}

data: {"type":"error","message":"LLM API unavailable. Please try again.","retryable":true}
```

---

### 9.3 `GET /api/repo/status/:sessionId`

**Purpose:** Check if a session exists and its vector store is populated.

**Path Param:** `sessionId` — UUID v4

**Response:**
```json
{
  "exists": true,
  "repoInfo": {
    "owner": "facebook",
    "name": "react",
    "totalChunks": 1847,
    "ingestedAt": "2026-06-07T10:23:00.000Z"
  }
}
```

```json
{ "exists": false }
```

---

### 9.4 `DELETE /api/repo/session/:sessionId`

**Purpose:** Clear a session's vector store data from LanceDB and remove it from the session manager.

**Response:**
```json
{ "success": true, "message": "Session cleared." }
```

```json
{ "success": false, "message": "Session not found." }
```

---

## 10. RAG Pipeline — Technical Deep Dive

### 10.1 Complete Pipeline Flow

```
User message
     │
     ▼
[1] Retrieve conversation history (last 6 turns from request)
     │
     ▼
[2] Is message contextually ambiguous? (LLM standalone-question check)
     │ YES: Call Claude with small "reformulate" prompt → get standalone question
     │ NO: Use original message as-is
     ▼
[3] Embed the (standalone) question
    EmbeddingService.embed(standaloneQuestion)
    → float32[384] vector
     │
     ▼
[4] Vector search in LanceDB
    table.vectorSearch(queryVector)
         .metricType('cosine')
         .limit(TOP_K)
         .where(`sessionId = '${sessionId}'`)
         .toArray()
    → Array<LanceDBRow> sorted by score DESC
     │
     ▼
[5] Filter chunks below MIN_RELEVANCE_SCORE (0.30)
     │
     ▼
[6] Send "sources" SSE event to client (chunk metadata + scores)
     │
     ▼
[7] Assemble full LLM prompt:
    - System prompt (with repo context)
    - Retrieved chunks (with file path labels)
    - Conversation history
    - Current question
     │
     ▼
[8] Stream from Claude API
    anthropic.messages.stream({ model, max_tokens, system, messages })
     │
     ├── On content_block_delta → send "token" SSE event
     └── On stream end → send "done" SSE event
```

### 10.2 Standalone Question Rewriter

When the user message appears to be a follow-up (detected by heuristics: short message, contains pronouns like "it", "this", "that", "them", "they"), a lightweight reformulation call is made:

```javascript
// Standalone question rewriter prompt
const REFORMULATE_PROMPT = `Given the following conversation history and a follow-up question, 
rewrite the follow-up question to be a complete, standalone question that can be understood 
without the conversation history. Output ONLY the rewritten question, nothing else.

Conversation:
{history}

Follow-up question: {question}

Standalone question:`;
```

**Heuristics for triggering standalone reformulation:**
- Message length < 20 words AND
- Contains any of: "it", "this", "that", "they", "them", "these", "those", "he", "she", "its"
- OR message starts with: "what about", "how about", "and", "but", "also", "why", "when", "where"
- AND conversation history has ≥ 1 prior turn

---

### 10.3 LLM Prompt Templates

**Full System Prompt:**
```
You are an expert software engineer and code analyst. You help users understand GitHub repositories through conversation.

Repository Context:
- Name: {owner}/{repo}
- Description: {description}
- Primary Language: {primaryLanguage}
- All Detected Languages: {languages}

Your Role:
1. Answer questions using ONLY the repository code and documentation provided as context below.
2. If the context is insufficient to answer fully, say so explicitly — do not invent or assume code that isn't shown.
3. Always mention file paths when referencing specific code (in backticks, e.g., `src/utils/auth.js`).
4. Use markdown formatting: code fences with language tags for code, bullet lists for enumerations.
5. For multi-part questions, use headers (##) to structure your response.
6. Be technically precise. The user is a developer.
7. If the question is unrelated to this repository, politely redirect.
8. Do not repeat the question back to the user.
9. Keep responses focused and avoid padding.
```

**User-side Message Template:**
```
[RETRIEVED REPOSITORY CONTEXT]

--- Source 1: src/reconciler/ReactFiber.js ---
{chunk1.content}

--- Source 2: src/reconciler/ReactFiberBeginWork.js ---
{chunk2.content}

--- Source 3: packages/react/src/ReactElement.js ---
{chunk3.content}

[END OF CONTEXT]

Question: {userMessage}
```

**Conversation History Format (Claude `messages` array):**
```javascript
[
  { role: 'user', content: 'What does this repository do?' },
  { role: 'assistant', content: 'This is the React library source code...' },
  // ... (last N turns)
  { role: 'user', content: '[RETRIEVED CONTEXT]\n...\n\nQuestion: How does reconciliation work?' }
]
```

---

## 11. GitHub Integration (Octokit)

### 11.1 Service Methods

**`githubService.js`** exposes:

```javascript
class GitHubService {
  constructor(token) {
    this.octokit = new Octokit({ auth: token || undefined });
  }

  // Validate repo existence, get metadata
  async getRepoInfo(owner, repo) → RepoMetadata;

  // Fetch full recursive file tree (single API call)
  async getFileTree(owner, repo, branch) → GitHubTreeItem[];

  // Fetch individual file content (base64 decoded)
  async getFileContent(owner, repo, path) → string;

  // Fetch multiple files in parallel batches
  async getFilesInBatches(owner, repo, paths, onProgress) → Map<string, string>;

  // Get rate limit status
  async getRateLimitStatus() → { remaining, reset, resetDate };
}
```

### 11.2 File Tree Fetching

```javascript
async getFileTree(owner, repo, branch = null) {
  // Step 1: Get default branch if not specified
  const repoData = await this.octokit.repos.get({ owner, repo });
  const targetBranch = branch || repoData.data.default_branch;
  
  // Step 2: Get the SHA of the branch's HEAD commit tree
  const branchData = await this.octokit.repos.getBranch({ owner, repo, branch: targetBranch });
  const treeSha = branchData.data.commit.commit.tree.sha;
  
  // Step 3: Fetch entire tree recursively (single API call)
  const treeResponse = await this.octokit.git.getTree({
    owner, repo, tree_sha: treeSha, recursive: '1'
  });
  
  // Return only blob (file) entries, filtering out directories
  return treeResponse.data.tree.filter(item => item.type === 'blob');
}
```

### 11.3 Rate Limit Handling

```javascript
async getFilesInBatches(owner, repo, paths, onProgress, batchSize = 5) {
  const results = new Map();
  
  for (let i = 0; i < paths.length; i += batchSize) {
    const batch = paths.slice(i, i + batchSize);
    
    // Check rate limit before each batch
    const { remaining, resetDate } = await this.getRateLimitStatus();
    if (remaining < 10) {
      const waitMs = resetDate.getTime() - Date.now();
      // Emit rate limit warning via SSE (handled by caller)
      throw new RateLimitError(`Rate limited. Reset in ${Math.ceil(waitMs/1000)}s`, resetDate);
    }
    
    // Fetch batch in parallel
    const batchResults = await Promise.allSettled(
      batch.map(path => this.getFileContent(owner, repo, path))
    );
    
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.set(batch[index], result.value);
      }
      // Rejected files are silently skipped (counted in skippedFiles)
    });
    
    onProgress(Math.min(i + batchSize, paths.length), paths.length, batch[batch.length-1]);
  }
  
  return results;
}
```

---

## 12. Embedding Service (`@xenova/transformers`)

### 12.1 Singleton Pattern

The embedding model is loaded once on server startup to avoid repeated initialization (loading takes ~2–5 seconds):

```javascript
// embeddingService.js
import { pipeline } from '@xenova/transformers';

const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';

class EmbeddingService {
  static instance = null;
  static pipe = null;

  static async initialize() {
    if (this.pipe) return;  // Already loaded
    console.log(`[EmbeddingService] Loading model: ${MODEL_NAME}`);
    this.pipe = await pipeline('feature-extraction', MODEL_NAME, {
      quantized: true  // Use quantized ONNX model (~6MB) for faster loading
    });
    console.log('[EmbeddingService] Model ready');
  }

  static async embed(text) {
    if (!this.pipe) await this.initialize();
    
    // Truncate text to model's max sequence length (256 tokens ≈ 1000 chars)
    const truncated = text.slice(0, 1000);
    
    const output = await this.pipe(truncated, { pooling: 'mean', normalize: true });
    return Array.from(output.data);  // float32[384]
  }

  static async embedBatch(texts) {
    return Promise.all(texts.map(text => this.embed(text)));
  }
}

export { EmbeddingService };
```

### 12.2 Chunk Preprocessing for Embedding

Before embedding, each chunk is preprocessed to include file context:

```javascript
function prepareChunkForEmbedding(chunk) {
  // Prepend file path for grounding (improves retrieval quality)
  return `File: ${chunk.filePath}\n\n${chunk.content}`;
}

function prepareQueryForEmbedding(query) {
  // Queries don't get the file prefix — they're about intent, not location
  return query.trim();
}
```

### 12.3 Model Details

| Property | Value |
|----------|-------|
| Model ID | `Xenova/all-MiniLM-L6-v2` |
| Dimensions | 384 |
| Max sequence length | 256 tokens |
| Model size (quantized) | ~23 MB |
| Inference time (CPU) | 5–15ms per chunk |
| Similarity metric | Cosine similarity |
| Cache location (macOS/Linux) | `~/.cache/huggingface/hub/` |
| Cache location (Windows) | `C:\Users\<user>\.cache\huggingface\hub\` |

---

## 13. Vector Store (LanceDB)

### 13.1 Why LanceDB

LanceDB (`vectordb` npm package) was selected because:
- **No server process required** — it's an embedded database like SQLite
- **Native Node.js support** via a compiled addon
- **Efficient columnar storage** — Apache Arrow format
- **Built-in vector search** with cosine similarity
- **Filterable** — can scope searches to a specific session ID
- **Zero infrastructure** — just a directory on disk (`vector_store/`)

### 13.2 Schema (LanceDB Table)

```javascript
// LanceDB infers schema from the first batch of data
// This is the shape of each record:
const schema = {
  id: 'string',           // UUID v4 — primary identifier for the chunk
  sessionId: 'string',   // UUID v4 — foreign key: owner session
  filePath: 'string',     // "packages/react/src/ReactElement.js"
  fileName: 'string',     // "ReactElement.js"
  extension: 'string',    // ".js"
  language: 'string',     // "JavaScript"
  chunkIndex: 'int32',   // 0, 1, 2, ...
  totalChunks: 'int32',  // Total chunks in this file
  startChar: 'int32',    // Character offset start
  endChar: 'int32',      // Character offset end
  content: 'string',     // The raw chunk text
  vector: 'float32[384]' // The embedding vector
}
```

### 13.3 VectorStoreService Methods

```javascript
class VectorStoreService {
  static db = null;
  static table = null;
  static TABLE_NAME = 'chunks';

  static async initialize() {
    this.db = await connect(process.env.VECTOR_STORE_PATH || './vector_store');
    // Open existing table or create new one on first run
    const tables = await this.db.tableNames();
    if (tables.includes(this.TABLE_NAME)) {
      this.table = await this.db.openTable(this.TABLE_NAME);
    } else {
      // Table is created on first upsert
    }
  }

  // Insert chunks for a session
  static async upsertChunks(chunks) → void;

  // Search for top-K similar chunks within a session
  static async search(sessionId, queryVector, topK = 5) → SearchResult[];

  // Delete all chunks belonging to a session
  static async deleteSession(sessionId) → void;

  // Check if a session has any chunks
  static async sessionExists(sessionId) → boolean;

  // Get chunk count for a session
  static async getChunkCount(sessionId) → number;
}
```

### 13.4 Vector Search Implementation

```javascript
static async search(sessionId, queryVector, topK = 5, minScore = 0.30) {
  const results = await this.table
    .vectorSearch(queryVector)
    .metricType('cosine')
    .limit(topK * 2)  // Fetch more, then filter by score
    .where(`sessionId = '${sessionId}'`)
    .toArray();
  
  // LanceDB returns _distance (lower = more similar for cosine)
  // Convert distance to similarity score: score = 1 - distance
  return results
    .map(row => ({
      ...row,
      score: 1 - row._distance  // Normalize to 0–1
    }))
    .filter(row => row.score >= minScore)
    .slice(0, topK)
    .sort((a, b) => b.score - a.score);
}
```

---

## 14. LLM Integration (Anthropic Claude)

### 14.1 SDK Usage with Streaming

```javascript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function streamChatResponse(systemPrompt, messages, res) {
  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    temperature: 0.2,
    system: systemPrompt,
    messages: messages
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      res.write(`data: ${JSON.stringify({ type: 'token', content: event.delta.text })}\n\n`);
    }
    if (event.type === 'message_stop') {
      const finalMessage = await stream.finalMessage();
      res.write(`data: ${JSON.stringify({
        type: 'done',
        inputTokens: finalMessage.usage.input_tokens,
        outputTokens: finalMessage.usage.output_tokens
      })}\n\n`);
    }
  }
}
```

### 14.2 Model Configuration

| Parameter | Value | Reason |
|-----------|-------|--------|
| Model | `claude-sonnet-4-20250514` | Best balance of quality and speed for code Q&A |
| Max tokens | 2048 | Enough for detailed technical answers |
| Temperature | 0.2 | Low temperature = factual, grounded responses |
| Top-p | default (1.0) | Not modified; temperature control is sufficient |
| Stream | `true` | Enables real-time token delivery |

### 14.3 Token Budget Management

To avoid hitting Claude's context limit, the prompt is assembled with token budgets:

| Component | Max Chars | Approx Tokens |
|-----------|----------|--------------|
| System prompt | 1,500 | ~380 |
| Retrieved chunks (5 × 1500 chars) | 7,500 | ~1,900 |
| Conversation history (6 turns × 800 chars) | 4,800 | ~1,200 |
| Current user message | 2,000 | ~500 |
| **Total input** | **~15,800** | **~3,980** |
| **Output** | — | **2,048** |

Claude Sonnet's context window (200K tokens) is far larger than this budget, so no truncation is needed in practice.

---

## 15. Session Management

### 15.1 In-Memory Session Store

```javascript
// sessionManager.js
const sessions = new Map();  // sessionId → SessionData

const SESSION_TTL = parseInt(process.env.SESSION_TTL_MINUTES) * 60 * 1000;

function createSession(sessionId, repoInfo) {
  sessions.set(sessionId, {
    sessionId,
    repoInfo,
    createdAt: Date.now(),
    lastActivityAt: Date.now()
  });
}

function touchSession(sessionId) {
  const session = sessions.get(sessionId);
  if (session) session.lastActivityAt = Date.now();
}

function deleteSession(sessionId) {
  sessions.delete(sessionId);
}

function getSession(sessionId) {
  return sessions.get(sessionId) || null;
}

// Cleanup timer: runs every 5 minutes, removes expired sessions
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (now - session.lastActivityAt > SESSION_TTL) {
      VectorStoreService.deleteSession(id);  // Async, don't await
      sessions.delete(id);
      logger.info(`[SessionManager] Expired session ${id}`);
    }
  }
}, 5 * 60 * 1000);

export { createSession, touchSession, deleteSession, getSession };
```

### 15.2 Session Lifecycle

```
Client generates sessionId (UUID v4) on app mount
         │
         ▼
POST /api/repo/ingest { sessionId, repoUrl }
         │
         ▼
Backend creates session record
         │
         ▼
Ingestion completes → session marked "ready"
         │
         ▼
Every POST /api/chat/message → touchSession(sessionId) to reset TTL
         │
         ▼
DELETE /api/repo/session/:sessionId → explicit cleanup on "Change Repo"
         │
         OR
         ▼
Inactivity > SESSION_TTL → automatic cleanup by timer
```

---

## 16. Security Architecture

### 16.1 Rate Limiters

```javascript
import rateLimit from 'express-rate-limit';

// Applied globally to all routes
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 200,                    // 200 requests per window per IP
  message: { error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Applied to POST /api/repo/ingest (expensive endpoint)
export const ingestionRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,   // 1 hour
  max: 15,                    // 15 ingestions per IP per hour
  message: { error: 'Too many repository ingestions. Try again later.' }
});

// Applied to POST /api/chat/message
export const chatRateLimiter = rateLimit({
  windowMs: 60 * 1000,        // 1 minute
  max: 40,                    // 40 messages per minute per IP
  message: { error: 'Sending too fast. Please wait a moment.' }
});
```

### 16.2 Input Sanitization

All user inputs are validated with Zod schemas before processing. Additionally:

- `repoUrl`: URL validated, parsed with the same `urlParser.js` utility, restricted to `github.com` host
- `sessionId`: Must be a valid UUID v4 (regex: `/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i`)
- `message`: Length-capped at 2000 characters, trimmed
- `history`: Array of known roles only (`user` | `assistant`), each content capped at 4000 chars

### 16.3 Prompt Injection Mitigation

Repository content is treated as untrusted data:
- Each chunk is labeled with a structured header (`--- Source N: path ---`) that Claude recognizes as data context
- The system prompt explicitly instructs the model to answer only from provided context
- User messages are placed in a clearly delimited "Question:" section
- No user message or repository content is injected into the system prompt

### 16.4 CORS Configuration

```javascript
app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      process.env.FRONTEND_URL,
      'http://localhost:5173',   // Vite dev server
      'http://localhost:4173'    // Vite preview
    ];
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS: Origin not allowed'));
    }
  },
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type'],
  credentials: false
}));
```

### 16.5 Helmet Configuration

```javascript
app.use(helmet({
  contentSecurityPolicy: false,  // Disabled: CSP can break SSE connections
  crossOriginEmbedderPolicy: false
}));
```

---

## 17. Error Handling Strategy

### 17.1 Custom Error Classes

```javascript
// errors.js
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
  }
}

export class RepoNotFoundError extends AppError {
  constructor() { super('Repository not found.', 404, 'REPO_NOT_FOUND'); }
}

export class RepoPrivateError extends AppError {
  constructor() { super('Repository is private.', 403, 'REPO_PRIVATE'); }
}

export class RateLimitError extends AppError {
  constructor(msg, retryAfter) {
    super(msg, 429, 'RATE_LIMIT_EXCEEDED');
    this.retryAfter = retryAfter;
  }
}

export class SessionNotFoundError extends AppError {
  constructor() { super('Session not found or expired.', 404, 'SESSION_NOT_FOUND'); }
}

export class EmbeddingError extends AppError {
  constructor(msg) { super(msg, 500, 'EMBEDDING_ERROR'); }
}
```

### 17.2 Global Error Handler

```javascript
// middleware/errorHandler.js
export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const response = {
    error: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR'
  };
  
  if (err.retryAfter) response.retryAfter = err.retryAfter;
  
  // Log non-operational errors (programming bugs) more aggressively
  if (!err.isOperational) {
    console.error('[CRITICAL ERROR]', err);
  }
  
  res.status(statusCode).json(response);
}
```

### 17.3 SSE Error Delivery

When an error occurs mid-SSE-stream, it's delivered as an SSE event (not an HTTP error):

```javascript
function sendSseError(res, code, message, extra = {}) {
  res.write(`data: ${JSON.stringify({ type: 'error', code, message, ...extra })}\n\n`);
  res.end();
}
```

---

## 18. Environment Configuration

### 18.1 Backend `.env`

```env
# ============================
# Server Configuration
# ============================
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# ============================
# Anthropic Claude API
# ============================
ANTHROPIC_API_KEY=sk-ant-api03-...

# ============================
# GitHub API (optional but strongly recommended)
# Without this: 60 requests/hour (unauthenticated)
# With this: 5,000 requests/hour
# Token needs only: public_repo scope (read-only)
# Create at: https://github.com/settings/tokens
# ============================
GITHUB_TOKEN=ghp_...

# ============================
# Session Configuration
# ============================
SESSION_TTL_MINUTES=30

# ============================
# Repository Ingestion Limits
# ============================
MAX_REPO_SIZE_MB=200          # Warn if repo > this size
MAX_FILE_SIZE_KB=1000         # Skip files larger than this
MAX_FILES_TO_PROCESS=1000     # Hard cap on file count per ingestion

# ============================
# RAG Configuration
# ============================
CHUNK_SIZE=1500               # Max characters per chunk
CHUNK_OVERLAP=200             # Overlap between chunks
TOP_K_RESULTS=5               # Chunks to retrieve per query
MIN_RELEVANCE_SCORE=0.30      # Minimum cosine similarity threshold
MAX_HISTORY_TURNS=6           # Number of conversation turns to include

# ============================
# Vector Store (LanceDB)
# ============================
VECTOR_STORE_PATH=./vector_store

# ============================
# Embedding Model
# ============================
EMBEDDING_MODEL=Xenova/all-MiniLM-L6-v2
EMBEDDING_BATCH_SIZE=16

# ============================
# LLM Configuration
# ============================
LLM_MODEL=claude-sonnet-4-20250514
LLM_MAX_TOKENS=2048
LLM_TEMPERATURE=0.2
```

### 18.2 Backend `.env.example`

This file should be committed to the repository (with no real values):

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

### 18.3 Frontend `.env`

```env
VITE_API_BASE_URL=http://localhost:3001
```

---

## 19. Package Installation Guide

### 19.1 System Prerequisites

#### Node.js 20 LTS

**macOS (using Homebrew):**
```bash
brew install node@20
# Or via nvm (recommended):
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc  # or ~/.zshrc
nvm install 20
nvm use 20
nvm alias default 20
```

**Ubuntu/Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Windows:**
Download installer from: https://nodejs.org/en/download/  
(Choose the LTS version, currently 20.x)

**Verify:**
```bash
node --version  # Should print v20.x.x
npm --version   # Should print 9.x or 10.x
```

#### C++ Build Tools (Required for `vectordb` native addon)

**macOS:**
```bash
xcode-select --install
# When prompted, click "Install" in the dialog
# Verify: xcode-select -p  → /Library/Developer/CommandLineTools
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install -y build-essential python3
```

**Windows:**
Option A — Visual Studio Build Tools (recommended):
1. Download: https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022
2. Install "C++ build tools" workload
3. Restart PowerShell/Command Prompt

Option B — via npm (if admin access available):
```bash
npm install -g windows-build-tools
```

---

### 19.2 Complete Frontend Installation

```bash
# 1. Create React app with Vite
npm create vite@latest frontend -- --template react
cd frontend

# 2. Install base dependencies (from Vite template)
npm install

# 3. Animation library
npm install framer-motion

# 4. HTTP client
npm install axios

# 5. Markdown rendering + GFM plugin
npm install react-markdown remark-gfm

# 6. Syntax highlighting for code blocks
npm install react-syntax-highlighter

# 7. Icon set
npm install lucide-react

# 8. UUID generation (for session IDs)
npm install uuid

# 9. Tailwind CSS and plugins
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p  # Generates tailwind.config.js and postcss.config.js
npm install @tailwindcss/typography @tailwindcss/forms

# 10. Development tooling (optional but recommended)
npm install -D eslint prettier eslint-plugin-react eslint-config-prettier

# Verify installation
npm list --depth=0
```

**After installation, configure `tailwind.config.js`:**
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body:    ['DM Sans', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace']
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
      },
      boxShadow: {
        'neo-sm':  '2px 2px 0px #0A0A0A',
        'neo':     '4px 4px 0px #0A0A0A',
        'neo-lg':  '6px 6px 0px #0A0A0A',
        'neo-blue':'4px 4px 0px #0055FF',
      },
      borderRadius: { 'neo': '0px' }
    }
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms')
  ]
}
```

**Add Tailwind directives to `src/styles/globals.css`:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  --color-bg: #F5EFE0;
  --color-surface: #FFFFFF;
  --color-border: #0A0A0A;
  --color-text-primary: #0A0A0A;
  --color-text-secondary: #555555;
  --color-accent-yellow: #FFE500;
  --color-accent-green: #00FF87;
  --color-accent-pink: #FF3366;
  --color-accent-blue: #0055FF;
  --color-accent-orange: #FF6B00;
}

* { box-sizing: border-box; }

body {
  background-color: var(--color-bg);
  color: var(--color-text-primary);
  font-family: 'DM Sans', sans-serif;
  margin: 0;
}
```

**Import in `src/main.jsx`:**
```javascript
import './styles/globals.css'
import './styles/animations.css'
```

---

### 19.3 Complete Backend Installation

```bash
# 1. Create backend directory and initialize
mkdir backend && cd backend
npm init -y

# 2. Update package.json to use ES modules
# Add "type": "module" to package.json (enables import/export syntax)

# 3. Web framework
npm install express

# 4. Middleware and security
npm install cors helmet morgan compression

# 5. Rate limiting
npm install express-rate-limit

# 6. Environment variables
npm install dotenv

# 7. GitHub API client (official, from GitHub)
npm install @octokit/rest
# Documentation: https://octokit.github.io/rest.js/v21

# 8. Local embedding model
# ⚠️ Downloads ~23MB model on first run (cached for subsequent runs)
npm install @xenova/transformers
# Model cache: ~/.cache/huggingface/hub/models--Xenova--all-MiniLM-L6-v2/

# 9. Vector database (requires C++ build tools — see §19.1)
npm install vectordb
# If you get build errors, try:
# npm install vectordb --build-from-source
# Or for ARM Macs:
# npm install vectordb --build-from-source --arch=arm64

# 10. Anthropic SDK
npm install @anthropic-ai/sdk

# 11. Input validation
npm install zod

# 12. UUID generation
npm install uuid

# 13. Development dependencies
npm install -D nodemon

# 14. Optional: auto-format and lint
npm install -D eslint prettier

# Verify
npm list --depth=0
```

**Update `package.json` scripts:**
```json
{
  "type": "module",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "lint": "eslint src/",
    "format": "prettier --write src/"
  }
}
```

---

### 19.4 Root Workspace Setup (Optional but recommended)

```bash
# In the project root (parent of frontend/ and backend/)
mkdir gitchat && cd gitchat

# Initialize root package.json
npm init -y

# Install concurrently to run both servers from one command
npm install -D concurrently

# Update root package.json:
{
  "scripts": {
    "dev": "concurrently \"npm run dev --prefix frontend\" \"npm run dev --prefix backend\" --names \"FRONTEND,BACKEND\" --prefix-colors \"blue,green\"",
    "install:all": "npm install --prefix frontend && npm install --prefix backend",
    "start:frontend": "npm run dev --prefix frontend",
    "start:backend": "npm run dev --prefix backend"
  }
}
```

---

### 19.5 Troubleshooting Installation Issues

**`vectordb` build fails with "node-pre-gyp error":**
```bash
# 1. Ensure build tools are installed (see §19.1)
# 2. Clear npm cache
npm cache clean --force
# 3. Try building from source
npm install vectordb --build-from-source
# 4. If on Apple Silicon Mac:
npm install vectordb --target_arch=arm64
```

**`@xenova/transformers` hangs on first startup:**
- The model (~23MB) is downloading. This is normal on first run.
- Pre-download it before running:
```bash
node -e "import('@xenova/transformers').then(({ pipeline }) => pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')).then(() => { console.log('Model ready'); process.exit(0); })"
```

**Port already in use:**
```bash
# Find and kill process on port 3001 (backend)
lsof -ti:3001 | xargs kill -9
# Or change PORT in .env
```

**SSE not working (no streaming):**
- Ensure the Vite proxy is configured for `/api` (see §5.2)
- Ensure `res.flushHeaders()` is called immediately after setting SSE headers
- Ensure nginx (if used) is configured with `proxy_buffering off`

---

## 20. Development Tooling

### 20.1 Git Configuration

Root `.gitignore`:
```gitignore
# Dependencies
node_modules/

# Environment variables
.env
.env.local

# LanceDB data (contains user-specific embeddings, can be large)
vector_store/

# Build output
dist/
build/

# Hugging Face model cache (optional, re-downloads on demand)
.cache/

# OS files
.DS_Store
Thumbs.db

# Editor
.vscode/
.idea/
*.swp

# Logs
*.log
npm-debug.log*
```

### 20.2 Nodemon Configuration (`nodemon.json` in backend/)

```json
{
  "watch": ["src"],
  "ext": "js,json",
  "ignore": ["src/tests/*", "vector_store/*"],
  "delay": 200,
  "env": {
    "NODE_ENV": "development"
  }
}
```

### 20.3 Vite Configuration (`vite.config.js`)

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
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'framer': ['framer-motion'],
          'markdown': ['react-markdown', 'react-syntax-highlighter']
        }
      }
    }
  }
})
```

---

## 21. Data Models & Schemas

### 21.1 GitHub API Response Shape

```typescript
interface RepoMetadata {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string };
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  size: number;              // In KB
  default_branch: string;
  private: boolean;
  archived: boolean;
}

interface GitHubTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size: number;             // In bytes, only for blobs
  url: string;
}
```

### 21.2 Internal Chunk Model

```typescript
interface Chunk {
  id: string;                // UUID v4
  sessionId: string;
  filePath: string;          // Relative path in repo: "src/utils/auth.js"
  fileName: string;          // "auth.js"
  extension: string;         // ".js"
  language: string;          // Detected or inferred: "JavaScript"
  chunkIndex: number;        // 0-indexed
  totalChunks: number;       // Total for this file
  startChar: number;
  endChar: number;
  content: string;           // Raw text of this chunk
  vector: number[];          // float32[384]
}
```

### 21.3 Search Result Model

```typescript
interface SearchResult {
  id: string;
  sessionId: string;
  filePath: string;
  fileName: string;
  language: string;
  chunkIndex: number;
  content: string;
  score: number;             // 0.0–1.0 (higher = more similar)
  _distance: number;         // Raw LanceDB distance (1 - score)
}
```

### 21.4 SSE Event Schema (TypeScript)

```typescript
// Events sent from backend → frontend
type SseEvent =
  | { type: 'start'; repoInfo: RepoMetadataSummary }
  | { type: 'phase'; phase: string; phaseNumber: number; percentage: number }
  | { type: 'progress'; phaseNumber: number; percentage: number; currentFile: string; processedFiles: number; totalFiles: number }
  | { type: 'warning'; message: string; skippedFiles?: string[] }
  | { type: 'complete'; summary: IngestionSummary }
  | { type: 'standalone_question'; question: string }
  | { type: 'sources'; chunks: SourceChunkSummary[] }
  | { type: 'token'; content: string }
  | { type: 'done'; inputTokens: number; outputTokens: number }
  | { type: 'error'; message: string; code: string; retryable?: boolean; retryAfter?: number }
```

---

## 22. Performance Considerations

### 22.1 Frontend

- **Code splitting:** `react-syntax-highlighter` (large bundle) loaded lazily with `React.lazy()`
- **Message virtualization:** For chat histories > 50 messages, consider `@tanstack/react-virtual`
- **Animation perf:** All Framer Motion animations use `transform` and `opacity` (GPU-composited, no layout reflows)
- **SSE management:** `EventSource` is closed immediately when ingestion completes to free the connection

### 22.2 Backend

- **Embedding model warm-up:** `EmbeddingService.initialize()` is called on server start, not on first request
- **Concurrent file fetching:** 5 parallel GitHub API requests per batch — tuned to avoid rate limiting while maximizing throughput
- **LanceDB index:** LanceDB automatically creates an IVF_PQ index after the table grows beyond 256 rows, significantly speeding up vector search
- **Session isolation:** LanceDB `where()` filter ensures each query only scans the current session's chunks
- **Memory:** Large repos (1000+ files) can generate 5,000+ chunks × 384 floats = ~7.5MB of vectors per session — manageable in memory but worth monitoring with multiple concurrent sessions
- **Worker threads:** If embedding becomes a bottleneck, `@xenova/transformers` supports being run in a Node.js Worker thread to avoid blocking the event loop — implement if CPU usage becomes an issue under concurrent load