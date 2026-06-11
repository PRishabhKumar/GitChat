# AntiGravity Build Prompt — GitChat Frontend

---

## YOUR MISSION

Build the complete frontend for **GitChat** — a React SPA that lets users paste a public GitHub repository URL, watch it get indexed in real time, then have a natural language AI conversation with the codebase.

**Start by fetching the design from the connected Stitch MCP server.** Pull the generated screens and extract exact color values, spacing, shadow tokens, typography sizes, and component visual specs. Everything you build must match that design — use it as the visual source of truth throughout this build.

This is a `frontend/` directory only. The backend already exists at `http://localhost:3001`. Do not touch any backend files.

---

## TECH STACK

| Layer | Tool | Version |
|---|---|---|
| Build | Vite | `^5.4.0` |
| UI | React | `^18.3.0` |
| Styling | Tailwind CSS | `^3.4.0` |
| Animation | Framer Motion | `^11.0.0` |
| HTTP | Axios | `^1.7.0` |
| Markdown | react-markdown + remark-gfm | `^9.0.0` / `^4.0.0` |
| Syntax highlighting | react-syntax-highlighter | `^15.5.0` |
| Icons | lucide-react | `^0.400.0` |
| IDs | uuid | `^10.0.0` |
| Tailwind plugins | @tailwindcss/typography, @tailwindcss/forms | `^0.5.0` |

---

## STEP 1 — BOOTSTRAP

```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install

# Animate
npm install framer-motion

# HTTP + markdown + icons + IDs
npm install axios react-markdown remark-gfm react-syntax-highlighter lucide-react uuid

# Tailwind
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install -D @tailwindcss/typography @tailwindcss/forms

# Dev
npm install -D eslint prettier eslint-plugin-react eslint-config-prettier
```

---

## STEP 2 — DIRECTORY STRUCTURE

Create exactly this structure inside `frontend/src/`:

```
src/
├── components/
│   ├── layout/
│   │   ├── AppHeader.jsx
│   │   └── RepoInfoSidebar.jsx
│   ├── landing/
│   │   ├── AnimatedLogo.jsx
│   │   ├── ExampleChips.jsx
│   │   ├── LandingPage.jsx
│   │   ├── RepoUrlInput.jsx
│   │   └── UrlValidationError.jsx
│   ├── ingestion/
│   │   ├── AnimatedProgressBar.jsx
│   │   ├── CompletionSummary.jsx
│   │   ├── FileProcessingTicker.jsx
│   │   ├── IngestionStats.jsx
│   │   ├── IngestionView.jsx
│   │   ├── PhaseStepIndicator.jsx
│   │   └── SkippedFilesPanel.jsx
│   ├── chat/
│   │   ├── AssistantMessage.jsx
│   │   ├── ChatInput.jsx
│   │   ├── ChatView.jsx
│   │   ├── MessageList.jsx
│   │   ├── ScrollToBottomBtn.jsx
│   │   ├── SourceChunkCard.jsx
│   │   ├── SourceChunksPanel.jsx
│   │   ├── StreamingCursor.jsx
│   │   ├── SuggestedQuestions.jsx
│   │   ├── SystemMessage.jsx
│   │   ├── TypingIndicator.jsx
│   │   └── UserMessage.jsx
│   └── shared/
│       ├── Button.jsx
│       ├── Input.jsx
│       ├── CodeBlock.jsx
│       ├── LanguagePill.jsx
│       ├── Loader.jsx
│       ├── Modal.jsx
│       ├── RelevanceBadge.jsx
│       ├── Toast.jsx
│       └── ToastContainer.jsx
├── context/
│   ├── AppContext.jsx
│   └── ToastContext.jsx
├── hooks/
│   ├── useAutoScroll.js
│   ├── useChat.js
│   ├── useClipboard.js
│   ├── useGitHubUrl.js
│   ├── useIngestion.js
│   ├── useSession.js
│   └── useSSE.js
├── utils/
│   ├── api.js
│   ├── formatters.js
│   ├── urlParser.js
│   └── validators.js
├── styles/
│   ├── animations.css
│   ├── animations.js
│   └── globals.css
├── constants/
│   ├── exampleRepos.js
│   └── suggestedQuestions.js
├── App.jsx
└── main.jsx
```

---

## STEP 3 — CONFIG FILES

### `tailwind.config.js`
```js
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
        'neo-sm':    '2px 2px 0px #0A0A0A',
        'neo':       '4px 4px 0px #0A0A0A',
        'neo-lg':    '6px 6px 0px #0A0A0A',
        'neo-blue':  '4px 4px 0px #0055FF',
        'neo-green': '4px 4px 0px #00FF87',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
}
```

### `vite.config.js`
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
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

### `index.html`
Replace the Vite default with:
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>GitChat — Talk to any GitHub repository</title>
    <meta name="description" content="Have natural language conversations with any public GitHub repository using AI-powered code intelligence." />
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

## STEP 4 — BASE STYLES

### `src/styles/globals.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-bg:             #F5EFE0;
  --color-surface:        #FFFFFF;
  --color-border:         #0A0A0A;
  --color-text-primary:   #0A0A0A;
  --color-text-secondary: #555555;
  --color-accent-yellow:  #FFE500;
  --color-accent-green:   #00FF87;
  --color-accent-pink:    #FF3366;
  --color-accent-blue:    #0055FF;
  --color-accent-orange:  #FF6B00;
  --color-code-bg:        #0A0A0A;
  --color-code-text:      #F5EFE0;
}

*, *::before, *::after { box-sizing: border-box; }

html, body, #root { height: 100%; margin: 0; padding: 0; }

body {
  background-color: var(--color-bg);
  color: var(--color-text-primary);
  font-family: 'DM Sans', sans-serif;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}

:focus-visible { outline: 2px solid var(--color-accent-blue); outline-offset: 2px; }

::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: var(--color-bg); }
::-webkit-scrollbar-thumb { background: var(--color-border); }
::-webkit-scrollbar-thumb:hover { background: #333; }
```

### `src/styles/animations.css`
```css
@keyframes progress-stripes {
  0%   { background-position: 0 0; }
  100% { background-position: 40px 0; }
}

@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}

@keyframes blink-cursor {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}

@keyframes pulse-ring {
  0%   { transform: scale(1); box-shadow: 4px 4px 0px #0A0A0A; }
  50%  { transform: scale(1.06); box-shadow: 6px 6px 0px #0A0A0A; }
  100% { transform: scale(1); box-shadow: 4px 4px 0px #0A0A0A; }
}

@keyframes grid-drift {
  0%   { background-position: 0 0; }
  100% { background-position: 40px 40px; }
}

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
    45deg, #FFE500, #FFE500 10px, #FFCC00 10px, #FFCC00 20px
  );
  background-size: 40px 100%;
  animation: progress-stripes 0.8s linear infinite;
}

.skeleton {
  background: linear-gradient(90deg, #E8E2D4 25%, #F5EFE0 50%, #E8E2D4 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

.scroll-btn-pulse { animation: pulse-ring 1.5s ease-in-out infinite; }

.landing-grid-bg {
  background-image: radial-gradient(circle, #0A0A0A 1px, transparent 1px);
  background-size: 30px 30px;
  animation: grid-drift 8s linear infinite;
  opacity: 0.08;
}
```

### `src/styles/animations.js` — All Framer Motion variants
```js
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
  shake: { x: [0, -8, 8, -6, 6, -3, 3, 0], transition: { duration: 0.45, ease: 'easeInOut' } },
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
  open:   { height: 'auto', opacity: 1, transition: { height: { duration: 0.25, ease: 'easeOut' }, opacity: { duration: 0.2 } } },
  closed: { height: 0, opacity: 0, transition: { height: { duration: 0.2, ease: 'easeIn' }, opacity: { duration: 0.15 } } },
};

export const stampVariants = {
  initial: { scale: 0, rotate: -8, opacity: 0 },
  animate: { scale: [0, 1.15, 0.95, 1.05, 1], rotate: [-8, 3, -2, 1, 0], opacity: 1, transition: { type: 'spring', duration: 0.6, bounce: 0.5 } },
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

---

## STEP 5 — CONSTANTS

### `src/constants/exampleRepos.js`
```js
export const EXAMPLE_REPOS = [
  { label: 'facebook/react',           url: 'https://github.com/facebook/react' },
  { label: 'vercel/next.js',           url: 'https://github.com/vercel/next.js' },
  { label: 'expressjs/express',        url: 'https://github.com/expressjs/express' },
  { label: 'vitejs/vite',              url: 'https://github.com/vitejs/vite' },
  { label: 'tailwindlabs/tailwindcss', url: 'https://github.com/tailwindlabs/tailwindcss' },
  { label: 'anthropics/sdk-python',    url: 'https://github.com/anthropics/anthropic-sdk-python' },
];
```

### `src/constants/suggestedQuestions.js`
```js
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

## STEP 6 — UTILITIES

### `src/utils/urlParser.js`
Parses GitHub URLs into `{ owner, repo, branch }`. Accepts all formats:
- `github.com/owner/repo`
- `https://github.com/owner/repo`
- `https://github.com/owner/repo/tree/branch`
- Prepend `https://` if protocol is missing, coerce `http` → `https`, strip `.git` suffix.
- Validate owner: alphanumeric + hyphens, 1–39 chars, cannot start/end with hyphen.
- Validate repo: alphanumeric + hyphens + dots + underscores, 1–100 chars.
- Return `null` for anything invalid.

### `src/utils/validators.js`
`validateGitHubUrl(input)` → `{ valid: bool, message?: string, parsed?: {owner, repo, branch} }`
`validateMessage(text)` → `{ valid: bool, message?: string }` — max 2000 chars.

### `src/utils/formatters.js`
- `formatRelativeTime(date)` → `"3m ago"`, `"2h ago"`, `"1d ago"`
- `formatFileSize(bytes)` → `"1.2 KB"`, `"3.4 MB"`
- `formatNumber(n)` → `"42.3K"`, `"1.2M"`
- `truncatePath(path, maxLen=60)` → `"...src/utils/foo.js"` for long paths

### `src/utils/api.js`
Axios instance with `baseURL: '/api'`. Response interceptor that extracts `error.response?.data?.error` as the error message.

---

## STEP 7 — CONTEXTS

### `src/context/AppContext.jsx`
State that drives the entire app. Provide all via context:

```
appPhase: 'landing' | 'ingesting' | 'chat'   ← drives which screen renders
sessionId: string  ← UUID generated on mount, stored in sessionStorage under 'gitchat_session_id'
repoUrl: string
repoInfo: object | null   ← set after ingestion completes
ingestionProgress: object | null
isInfoPanelOpen: bool
```

### `src/context/ToastContext.jsx`
```
toasts: [ { id, type, message, duration } ]
addToast({ type, message, duration=5000 })
removeToast(id)
```
Auto-remove each toast after its duration using `setTimeout`.

---

## STEP 8 — HOOKS

### `src/hooks/useSSE.js` — ⚠️ CRITICAL

**Native `EventSource` only supports GET. All GitChat SSE endpoints use POST. You must implement SSE over `fetch` with `ReadableStream`.**

```
connect(url, { method, body }, { onMessage, onError, onClose })
```

- Use `AbortController` — abort any existing connection before opening a new one.
- `fetch` with `{ signal, method: 'POST', body: JSON.stringify(body) }` and `Accept: text/event-stream` header.
- Read the response body as a `ReadableStream` with `getReader()`.
- Buffer incoming chunks, split on `\n\n`, parse each `data: {...}` line as JSON.
- Call `onMessage(parsed)` for each event, `onError(err)` for failures, `onClose()` when stream ends.
- AbortError is NOT an error — ignore it silently.

### `src/hooks/useIngestion.js`
Calls `POST /api/repo/ingest` as SSE. Handles event types:
- `start` → repo info available
- `progress` → `{ phase, phaseNumber, percentage, currentFile, processedFiles, totalFiles, estimatedSecondsRemaining, skippedFiles }`
- `complete` → `{ repoInfo, totalFiles, totalChunks, languages, skippedCount }` — set `isComplete = true`, store `completionSummary`
- `error` → set error message

Returns: `{ progress, isComplete, error, completionSummary, startIngestion, cancel }`

### `src/hooks/useChat.js`
Calls `POST /api/chat/message` as SSE. Manages a `messages` array locally. Each message: `{ id, role, content, isStreaming, sources, timestamp, error }`.

On `sendMessage(text)`:
1. Append user message immediately.
2. Append empty assistant placeholder with `isStreaming: true`.
3. Connect SSE. Handle event types:
   - `sources` → attach `data.chunks` to the assistant message
   - `token` → append `data.content` to assistant message content
   - `done` → set `isStreaming: false` on assistant message
   - `error` → set error text and `isStreaming: false`

Send last 6 turns (12 messages) of `{ role, content }` pairs as `history`.

Returns: `{ messages, isStreaming, sendMessage, clearChat, inputValue, setInputValue }`

### `src/hooks/useGitHubUrl.js`
Wraps URL input state: `{ url, error, isShaking, handleChange, validate, setUrlFromChip }`
On validation failure → set error + trigger shake animation (reset `isShaking` after 500ms).

### `src/hooks/useAutoScroll.js`
Manages auto-scroll on a `containerRef`. Tracks whether user is within 50px of the bottom. When new content arrives: if at bottom → scroll instantly; if scrolled up → show scroll button + set `newMessageWhileScrolledUp`. Re-enable auto-scroll when user scrolls back to bottom.

Returns: `{ isAtBottom, showScrollButton, newMessageWhileScrolledUp, scrollToBottom }`

### `src/hooks/useClipboard.js`
`copy(text)` → writes to clipboard, sets `copied = true` for 2000ms.

---

## STEP 9 — SHARED COMPONENTS

### `Button.jsx`
Props: `variant ('primary'|'ghost'|'danger')`, `children`, `onClick`, `disabled`, `loading`, `type`, `className`

Use `motion.button` from Framer Motion with `buttonVariants` / `buttonGhostVariants`.
- **primary**: `bg-neo-yellow`, 2px black border, black text, bold uppercase
- **ghost**: transparent, 2px black border
- **danger**: `bg-neo-pink`, white text, 2px black border
- All: zero border-radius, `style={{ borderRadius: 0 }}`
- `loading` prop: show spinning border circle loader inline, disable the button
- Disabled: 50% opacity, not-allowed cursor

### `Input.jsx`
White background, 2px black border, zero border-radius, JetBrains Mono 14px.
Focus: `shadow-neo-blue border-neo-blue` (`4px 4px 0px #0055FF`).
Error prop: swap border to `neo-pink`.

### `CodeBlock.jsx`
⚠️ **Import `oneDark` statically at the top of the file** — do NOT use dynamic `await import()` for it. Vite will break.

```js
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
```

Lazy-load `Prism` from `react-syntax-highlighter` with `React.lazy`.
Structure: black header bar with language label (green monospace, uppercase, left) + Copy button (gray, right). Code area: pure black background, 13px JetBrains Mono. `4px 4px 0px #555555` shadow on the whole block.

### `Modal.jsx`
Confirmation dialog. Focus trap: auto-focus the confirm button on open. Escape key calls `onCancel`. `AnimatePresence` with `modalBackdropVariants` (backdrop) and `modalBoxVariants` (box). Zero border-radius, `6px 6px 0px #0A0A0A` shadow.

### `Toast.jsx`
Prop `type`: `error|success|warning|info` — each gets a color:
- error: `bg-neo-pink text-white`
- success: `bg-neo-green text-neo-black`
- warning: `bg-neo-orange text-white`
- info: `bg-neo-blue text-white`

Countdown progress bar at the bottom (depletes over `duration` ms using a `setInterval` counter).
Framer Motion `toastVariants`.

### `ToastContainer.jsx`
Fixed top-right, `z-[100]`, vertical stack, `AnimatePresence mode="popLayout"`.

### `RelevanceBadge.jsx`
Score 0–1 → percentage. Colors:
- ≥80%: `bg-neo-green text-neo-black`
- ≥60%: `bg-neo-yellow text-neo-black`
- <60%: `bg-neo-orange text-white`
Zero border-radius, 1px black border.

### `LanguagePill.jsx`
Map language names to color classes. Key mappings:
```
JavaScript → neo-yellow/black
TypeScript → neo-blue/white
Python → neo-green/black
Rust → neo-orange/white
Ruby → neo-pink/white
```
Fallback: `neo-black/neo-cream`. Bold uppercase, 2px border-radius.

### `Loader.jsx`
Three small squares (`w-2 h-2` for sm, `w-3 h-3` for md), `bg-neo-black`, each bouncing `y: [0, -8, 0]` with 120ms stagger using Framer Motion `animate` prop.

---

## STEP 10 — LAYOUT COMPONENTS

### `AppHeader.jsx`
Fixed header, 56px tall, white background, `border-b-2 border-neo-black`.
- Left: `Git<span className="text-neo-blue">Chat</span>` in Syne bold 20px
- Center: repo badge (repo name in JetBrains Mono + ℹ icon that opens sidebar) — only shown when `repoInfo` exists
- Right: ghost Button "⟳ CHANGE REPO"
- "Change Repo" → if chat has messages show confirmation Modal; otherwise navigate directly to landing
- On confirm → call `DELETE /api/repo/session/:sessionId`, reset `repoInfo`, set phase to `'landing'`

### `RepoInfoSidebar.jsx`
Right-side overlay panel, 320px wide on desktop, full-width bottom sheet on mobile.
`sidebarVariants` for slide animation. Backdrop fades to 40% black on mobile only.
Contents: repo full name, description, stars, time since indexed, language pills, FILES + CHUNKS stat cards.
Close on Escape key and backdrop click.

---

## STEP 11 — LANDING PAGE COMPONENTS

### `AnimatedLogo.jsx`
"GitChat" in Syne 800, 80px desktop / 52px mobile. Letter-by-letter stagger entrance using `staggerContainer` + `letterVariants`. The 4th character (index 3 — "C" in "Chat") is wrapped in `<span className="text-neo-blue">`.

### `RepoUrlInput.jsx`
Uses `useGitHubUrl` hook. Layout: `<Input>` + `<Button variant="primary">` side-by-side with `gap-0` (attached, no gap between them). Button text: "ANALYZE →" / "ANALYZING..." when loading.
Apply `shakeVariants` to the form element using `motion.form` when `isShaking` is true — trigger via `animate={isShaking ? 'shake' : 'rest'}`.

### `ExampleChips.jsx`
6 chips from `EXAMPLE_REPOS`, `staggerContainer` + `staggerItem` + `buttonGhostVariants`. Click → calls `onSelect(repo.url)`.

### `LandingPage.jsx`
Full-height centered layout. Dot-grid background div with class `landing-grid-bg`. Staggered fade-up entrance for tagline (delay 0.4s) and input form (delay 0.6s).

### `UrlValidationError.jsx`
Pink `bg-neo-pink` banner, 2px black border, `2px 2px 0px #0A0A0A` shadow, `role="alert"`, white text.

---

## STEP 12 — INGESTION COMPONENTS

### `AnimatedProgressBar.jsx`
`role="progressbar"`, `aria-valuenow={percentage}`. Inner fill div:
- In progress: `className="progress-bar-fill"` (the animated stripe CSS class)
- Complete: solid `bg-neo-green`
Height 24px, 2px black border, `3px 3px 0px #0A0A0A` shadow.

### `PhaseStepIndicator.jsx`
4 flat rectangle segments. Colors:
- Completed: `bg-neo-green`
- **Active: `bg-neo-blue`** (electric blue, not yellow)
- Pending: `bg-neo-cream`
Phase label above crossfades using `AnimatePresence mode="wait"` with `key={phaseLabel}`. Label text in orange `text-neo-orange`.

### `FileProcessingTicker.jsx`
Black terminal box. Files animate in/out with `AnimatePresence mode="popLayout"` and `key={currentFile}`: enter `y: 10px → 0, opacity: 0 → 1`; exit `y: 0 → -10px, opacity: 1 → 0`. Duration 150ms. Green monospace text.

### `CompletionSummary.jsx`
Spring-animated card on mount. Contains a "READY" stamp element that uses `stampVariants` — it scales in with bounce, slightly rotated (`rotate: '-2deg'`). Green border stamp. Stats row. Language pills. Primary "Start Chatting →" button.

### `IngestionView.jsx`
⚠️ **Guard against React 18 StrictMode double-invocation** — use `const started = useRef(false)` and only call `startIngestion` when `!started.current`. Set `started.current = true` before calling.

On `isComplete`: store repoInfo in context, auto-transition to `'chat'` after 2000ms.

Renders: header row → error state → PhaseStepIndicator → AnimatedProgressBar → IngestionStats → FileProcessingTicker → SkippedFilesPanel → (on complete) CompletionSummary.

---

## STEP 13 — CHAT COMPONENTS

### `UserMessage.jsx`
Right-aligned. Yellow bubble (`bg-neo-yellow`), 2px black border, `3px 3px 0px #0A0A0A` shadow. `userMessageVariants` spring entrance. Label "YOU" in gray mono uppercase above.

### `AssistantMessage.jsx`
Left-aligned. White bubble, 2px black border, `3px 3px 0px #0A0A0A` shadow. Pink border if `message.error`. Label "GITCHAT" above.

Empty + streaming → render `<TypingIndicator />` instead of the bubble.
Use `ReactMarkdown` with `remarkGfm`. Custom `code` renderer: if `!inline && language match` → render `<CodeBlock>`. Custom `a` renderer: `target="_blank" rel="noopener noreferrer"`.
Prose classes: `prose prose-sm max-w-none` with explicit heading/code/blockquote overrides.
Blockquote: `border-l-4 border-neo-blue bg-blue-50 pl-3`.
Inline code: `bg-neo-cream px-1 border border-neo-black/30 font-mono`.
`<StreamingCursor />` appended while `message.isStreaming`.

After the bubble: `<SourceChunksPanel sources={message.sources} />` (only when `message.sources !== null`).

### `TypingIndicator.jsx`
Wraps `<Loader size="sm" />` in a white bubble with the same border/shadow style as an AI message.

### `StreamingCursor.jsx`
`<span className="streaming-cursor" aria-hidden="true" />`

### `SuggestedQuestions.jsx`
Centered, full-height flex column. Gray mono label "TRY ASKING..." above the chip grid. 6 chips with `staggerContainer` + `staggerItem`. On hover: press-down effect + blue border tint. Click calls `onSelect(question)`.

### `SourceChunksPanel.jsx`
Collapsible. Header row: Folder icon + "Sources (N)" + rotating chevron. `accordionVariants` for content. Contains `<SourceChunkCard />` for each chunk.

### `SourceChunkCard.jsx`
Header: file path (truncated) + `<RelevanceBadge>`. Preview: first 3 lines in monospace. "Show more" button toggles expanded view with `accordionVariants`.

### `ChatInput.jsx`
Auto-growing textarea: on each keystroke, set `height: 'auto'` then clamp to `min(scrollHeight, 5*lineHeight+24)`. Enter = submit; Shift+Enter = newline.
Outer wrapper div handles the focus ring (not the textarea itself): `focus-within:shadow-neo-blue focus-within:border-neo-blue`.
Character counter appears when `value.length > 1800`; turns pink when over 2000.
Send button inside the input wrapper: `bg-neo-black text-neo-white hover:bg-neo-blue`. Disabled at 30% opacity when streaming or empty.

### `ScrollToBottomBtn.jsx`
`AnimatePresence` + `scrollButtonVariants`. Black background, white text, ArrowDown icon + "New message". `scroll-btn-pulse` CSS class when `isPulsing`.

### `MessageList.jsx`
Scrollable `div` with `ref={containerRef}`. Call `useAutoScroll(containerRef, [msgCount, isStreaming])` — pass both deps. When messages is empty → render `<SuggestedQuestions>`. Otherwise map messages by role. `<ScrollToBottomBtn>` positioned `absolute bottom-4 right-4`.

### `ChatView.jsx`
Root chat layout: `flex flex-col h-screen bg-neo-cream`.
- `<AppHeader />` at top
- Middle: flex row with `<MessageList>` (flex-1) 
- `<ChatInput>` fixed at bottom
- `<RepoInfoSidebar>` overlays from right
Uses `useChat(sessionId)` hook.

---

## STEP 14 — APP ENTRY POINTS

### `src/App.jsx`
```jsx
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
        {appPhase === 'landing'   && <motion.div key="landing"   variants={pageVariants} initial="initial" animate="animate" exit="exit" className="h-full"><LandingPage /></motion.div>}
        {appPhase === 'ingesting' && <motion.div key="ingesting" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="h-full"><IngestionView /></motion.div>}
        {appPhase === 'chat'      && <motion.div key="chat"      variants={pageVariants} initial="initial" animate="animate" exit="exit" className="h-full"><ChatView /></motion.div>}
      </AnimatePresence>
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider><ToastProvider><AppContent /></ToastProvider></AppProvider>
  );
}
```

### `src/main.jsx`
```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles/globals.css';
import './styles/animations.css';

createRoot(document.getElementById('root')).render(
  <StrictMode><App /></StrictMode>
);
```

---

## STEP 15 — BACKEND API REFERENCE

The backend runs at `http://localhost:3001`. Vite proxies `/api` to it.

| Method | Path | Type | Purpose |
|---|---|---|---|
| POST | `/api/repo/ingest` | SSE stream | Start ingestion. Body: `{ repoUrl, sessionId }` |
| GET | `/api/repo/session/:sessionId` | JSON | Get session/repo info |
| DELETE | `/api/repo/session/:sessionId` | JSON | Clear session |
| POST | `/api/chat/message` | SSE stream | Send chat message. Body: `{ sessionId, message, history }` |
| GET | `/api/health` | JSON | Health check |

**SSE event shapes for `/api/repo/ingest`:**
```
{ type: 'start', repoInfo: {...} }
{ type: 'progress', phase, phaseNumber, percentage, currentFile, processedFiles, totalFiles, estimatedSecondsRemaining, skippedFiles }
{ type: 'complete', repoInfo, totalFiles, totalChunks, languages, skippedCount }
{ type: 'error', message }
```

**SSE event shapes for `/api/chat/message`:**
```
{ type: 'sources', chunks: [...] }
{ type: 'token', content: '...' }
{ type: 'done' }
{ type: 'error', message }
```

---

## STEP 16 — CRITICAL GOTCHAS

| # | Problem | Fix |
|---|---|---|
| 1 | SSE POST not working | Never use `EventSource`. Use `fetch` + `ReadableStream` in `useSSE.js` — see Step 8 |
| 2 | Ingestion fires twice in dev | `useRef(started)` guard in `IngestionView` — React 18 StrictMode mounts twice |
| 3 | `oneDark` crash at runtime | Static import only: `import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'` — no dynamic await |
| 4 | Framer Motion key conflicts | Every `AnimatePresence` child needs a stable unique `key` prop |
| 5 | Auto-scroll not firing | Pass `[msgCount, isStreaming]` as the deps array to `useAutoScroll`, not just `messages` |
| 6 | CORS in browser | Vite proxy handles it. The `Accept: text/event-stream` header must be set on the fetch request |
| 7 | Textarea growing infinitely | Set `el.style.height = 'auto'` before reading `el.scrollHeight`, then clamp |
| 8 | sessionStorage across tabs | Each tab gets its own session — this is intentional. Do not use localStorage |

---

## DESIGN EXTRACTION FROM STITCH

After fetching the Stitch design via MCP, extract and apply:

- **Exact hex values** for any colors shown (match to the palette tokens above — do not deviate unless Stitch used a slightly adjusted shade, in which case use the Stitch value)
- **Spacing and padding** — use Stitch's measured values for padding on cards, input height, header height
- **Font sizes** — match Stitch's rendered sizes for the logo, tagline, body text, mono labels
- **Shadow offsets** — if Stitch adjusted the hard shadow offset from the 4px default, use the adjusted value
- **Component layout details** — exact arrangement of elements inside the ingestion card, header bar, repo info sidebar

If any Stitch component visually differs from the spec above, prefer the Stitch design. The spec describes intent; Stitch has the final pixel-level decisions.

---

## BUILD ORDER

Build in exactly this sequence to avoid import errors:

1. Config files + index.html
2. globals.css + animations.css + animations.js
3. Constants
4. Utilities (urlParser → validators → formatters → api)
5. Contexts (AppContext → ToastContext)
6. Hooks (useSSE → useIngestion → useChat → useGitHubUrl → useAutoScroll → useClipboard → useSession)
7. Shared components (Button → Input → Loader → Toast → ToastContainer → Modal → RelevanceBadge → LanguagePill → CodeBlock)
8. Layout (AppHeader → RepoInfoSidebar)
9. Landing (AnimatedLogo → UrlValidationError → ExampleChips → RepoUrlInput → LandingPage)
10. Ingestion (AnimatedProgressBar → PhaseStepIndicator → FileProcessingTicker → IngestionStats → SkippedFilesPanel → CompletionSummary → IngestionView)
11. Chat (StreamingCursor → TypingIndicator → ScrollToBottomBtn → SystemMessage → UserMessage → SourceChunkCard → SourceChunksPanel → AssistantMessage → SuggestedQuestions → ChatInput → MessageList → ChatView)
12. App.jsx → main.jsx