# Product Requirements Document (PRD)
## GitChat — Conversational Intelligence for GitHub Repositories

---

| Field            | Value                                          |
|------------------|------------------------------------------------|
| **Product Name** | GitChat                                        |
| **Version**      | 1.0.0                                          |
| **Status**       | Active Draft                                   |
| **Date**         | June 2026                                      |
| **Authors**      | Engineering Team                               |
| **Reviewers**    | Faculty Mentors, Product Lead                  |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Non-Goals](#3-goals--non-goals)
4. [User Personas](#4-user-personas)
5. [User Stories & Acceptance Criteria](#5-user-stories--acceptance-criteria)
6. [Feature Specifications](#6-feature-specifications)
7. [Design System — Neo-Brutalism](#7-design-system--neo-brutalism)
8. [Animation & Micro-Interaction Specification](#8-animation--micro-interaction-specification)
9. [Non-Functional Requirements](#9-non-functional-requirements)
10. [Error States & Edge Cases](#10-error-states--edge-cases)
11. [Out of Scope (v1.0)](#11-out-of-scope-v10)
12. [Success Metrics](#12-success-metrics)
13. [Risks & Mitigations](#13-risks--mitigations)
14. [Appendix](#14-appendix)

---

## 1. Executive Summary

GitChat is a full-stack web application that enables users to have natural language conversations with any public GitHub repository. By fetching, chunking, and embedding the entire text-based content of a repository into a local vector knowledge base, the system supports semantic question-answering powered by a Retrieval-Augmented Generation (RAG) pipeline backed by Claude (Anthropic's LLM).

A user pastes a public GitHub repository URL, waits for the ingestion pipeline to process the codebase, and then immediately begins asking questions in plain English — receiving accurate, source-grounded, markdown-formatted answers that stream in real time.

The user interface is built around a **neo-brutalism** design aesthetic: bold black borders, hard offset box-shadows, high-contrast accent colors, and chunky typography — but elevated with fluid Framer Motion animations and thoughtful micro-interactions that make each interaction feel crisp, responsive, and premium.

---

## 2. Problem Statement

### 2.1 The Developer's Dilemma

Developers, researchers, students, and open-source contributors regularly need to navigate unfamiliar codebases. The conventional workflow is slow and cognitively expensive:

- **Clone the repository** (can take minutes for large repos)
- **Read README files** (often outdated or sparse)
- **Manually browse the file tree** (no semantic understanding)
- **Use `grep` or IDE search** (keyword-only, no context)
- **Read source code line by line** (requires deep domain knowledge)

GitHub's native search is restricted to keyword matching. It doesn't understand *intent*. Asking "how does this project handle authentication?" returns files containing the word "auth" — not an explanation of the auth flow.

### 2.2 The Opportunity

Large language models excel at synthesizing and explaining code and documentation. RAG systems allow grounding LLMs in specific knowledge bases, eliminating hallucination. The combination enables genuinely useful, accurate answers about a repository's internals.

### 2.3 Who Suffers Without This

| Persona | Pain Point |
|---------|-----------|
| CS Students | Overwhelmed by real-world repo complexity with no guide |
| Open-Source Contributors | Can't understand conventions or architecture before contributing |
| Senior Engineers | Slow due-diligence on third-party libraries before adoption |
| Technical Researchers | Studying software architectures without tooling |
| Interview Prep | Studying well-known open-source projects under time pressure |

---

## 3. Goals & Non-Goals

### 3.1 Goals

- Allow any user to paste a **public GitHub repository URL** and begin a semantic conversation with its contents in under 5 minutes
- **Ingest all text-based files** (source code, docs, config, scripts) into a searchable vector knowledge base without any local setup by the user
- Deliver **accurate, grounded, source-cited answers** using Claude as the LLM backend, with retrieved repository chunks as context
- **Stream responses in real time** so users see text as it's generated (< 2s to first token)
- Show **live ingestion progress** with file name, phase, percentage, and ETA
- Maintain **conversational context** across multiple turns within a session
- Provide a **visually exceptional experience** using a neo-brutalism design system with smooth Framer Motion animations and polished micro-interactions
- Support **session isolation** — each browser session has its own vector store namespace
- Enable users to **switch repositories** without a page refresh

### 3.2 Non-Goals for v1.0

- ❌ Private repository support (OAuth + GitHub App)
- ❌ User accounts, authentication, or persistent cross-session history
- ❌ Multi-repository queries in a single session
- ❌ Code execution, modification, or write operations (no PRs, no issues)
- ❌ Non-GitHub platforms (GitLab, Bitbucket, Sourcehut)
- ❌ Native mobile app
- ❌ Collaborative/shared chat sessions
- ❌ Repository diffing or version comparison
- ❌ Export/share conversation transcripts (v2 candidate)
- ❌ Admin dashboard, analytics, or usage tracking UI

---

## 4. User Personas

### 4.1 Arjun — The CS Student
- **Age:** 21, final-year B.Tech, Surat
- **Tech Level:** Intermediate. Comfortable with JavaScript, learning system design.
- **Goal:** Understand how famous open-source projects are structured for interviews and learning
- **Frustration:** "I clone React or Linux and have no idea where to even start reading."
- **Usage Pattern:** Asks high-level questions first ("What does this do?"), then drills in ("How does reconciliation work?")
- **Key Needs:** Plain-language explanations, code examples, architectural overviews

### 4.2 Sarah — The Senior Backend Engineer
- **Age:** 31, 7 years experience, evaluating open-source libraries for production use
- **Tech Level:** Expert. Reads code fluently in 5+ languages.
- **Goal:** Rapid technical due diligence before adopting a new dependency
- **Frustration:** "I need to know if this library handles concurrency correctly, not read 40 files to find out."
- **Usage Pattern:** Highly specific, technical questions. Multiple follow-ups.
- **Key Needs:** Precise, accurate answers with source references. Code quotes.

### 4.3 Marco — The Open-Source Contributor
- **Age:** 26, software engineer, contributing to projects on weekends
- **Goal:** Understand project conventions before making a PR
- **Frustration:** "Projects rarely document their internal conventions. I need to reverse-engineer them."
- **Usage Pattern:** Asks about patterns, naming, test structure, then asks follow-up "where would I add X?"
- **Key Needs:** Pattern identification, convention detection, architectural guidance

### 4.4 Priya — The Technical Recruiter Turning Engineer
- **Age:** 28, transitioning from technical recruitment to development
- **Goal:** Quickly understand what a well-known open-source repo does for portfolio building
- **Frustration:** "GitHub is intimidating. I need someone to walk me through it."
- **Usage Pattern:** High-level, broad questions. Appreciates clear formatting.
- **Key Needs:** Non-intimidating UI, clear answers, suggested starter questions

---

## 5. User Stories & Acceptance Criteria

### Epic 1: Repository URL Input & Validation

---

**US-001: Submit a GitHub Repository URL**
> *As a user, I want to paste a GitHub repository URL and initiate ingestion so that I can begin chatting with it.*

**Acceptance Criteria:**
- [ ] The input field is the primary focused element on page load (autofocus)
- [ ] The field accepts and normalizes all valid GitHub URL formats (see §6.1 URL Parsing)
- [ ] Client-side validation runs on blur and on submit
- [ ] Pressing `Enter` in the input field submits the form
- [ ] Clicking the "Analyze Repository" button submits the form
- [ ] The button shows a loading spinner state during validation (replaces button text)
- [ ] The button is disabled while loading to prevent double-submit
- [ ] Invalid URL format shows an inline error with red border on the input and a descriptive message below it
- [ ] After a failed validation, the input border shakes with a CSS/Framer Motion shake animation (200ms, 3 oscillations)
- [ ] The error message is specific: "Not a valid GitHub URL format", "Repository not found", "Repository is private", etc.
- [ ] Successful URL validation immediately transitions to the ingestion progress view

---

**US-002: See Example Repository Quick-Fill Chips**
> *As a user, I want to see example repository URLs I can click to pre-fill the input so that I can explore the tool without having to think of a repo myself.*

**Acceptance Criteria:**
- [ ] 4–6 example repository chips are shown below the URL input
- [ ] Each chip shows a truncated repo name (e.g., "facebook/react", "vercel/next.js", "torvalds/linux")
- [ ] Clicking a chip fills the input field with the full URL (does not auto-submit)
- [ ] Chips have hover animations consistent with neo-brutalism micro-interactions
- [ ] Chips are visible on desktop; on mobile, they wrap to a second row

---

**US-003: URL Normalization**
> *As a user, I want the system to accept various GitHub URL formats so that I don't have to worry about exact formatting.*

**Acceptance Criteria:**
- [ ] The following URL formats are all parsed correctly:
  - `https://github.com/owner/repo`
  - `https://github.com/owner/repo/`
  - `https://github.com/owner/repo.git`
  - `https://github.com/owner/repo/tree/main`
  - `https://github.com/owner/repo/tree/develop`
  - `https://github.com/owner/repo/blob/main/README.md`
  - `https://www.github.com/owner/repo`
  - `github.com/owner/repo` (no protocol)
  - `http://github.com/owner/repo` (http coerced to https)
- [ ] The extracted `owner` and `repo` values are logged and sent to the backend
- [ ] The branch from `/tree/{branch}` is preserved and used during ingestion if specified (else defaults to repo's default branch)

---

### Epic 2: Repository Ingestion

---

**US-004: View Real-Time Ingestion Progress**
> *As a user, I want to see live progress as files are fetched, chunked, and embedded so that I know the system is working and can estimate wait time.*

**Acceptance Criteria:**
- [ ] Progress view replaces the URL input immediately after submission
- [ ] A progress bar shows overall completion (0%–100%) with animated fill
- [ ] The progress bar uses a striped, animated pattern in the primary accent color (not a plain solid fill)
- [ ] A phase indicator shows the current pipeline stage:
  - `Phase 1/4: Fetching file tree`
  - `Phase 2/4: Reading file contents`
  - `Phase 3/4: Chunking & processing`
  - `Phase 4/4: Generating embeddings`
- [ ] The currently-being-processed file name is shown in a rolling text display (monospace font, truncated if > 60 chars)
- [ ] A "X of Y files processed" counter is visible
- [ ] An estimated time remaining is displayed after 5 seconds of processing (calculated from rate of progress)
- [ ] If the repo has no processable files, a clear message is shown with a "Try Another Repo" button
- [ ] A cancel button is available to abort ingestion and return to the URL input

---

**US-005: View Ingestion Completion Summary**
> *As a user, I want to see a satisfying completion state with key repository stats before entering the chat so that I feel confident the system has fully loaded the repo.*

**Acceptance Criteria:**
- [ ] At 100%, a success animation plays (e.g., animated checkmark or "READY" stamp with a thud effect)
- [ ] A summary card is shown with:
  - Repository full name (`owner/repo`)
  - Total files ingested
  - Total chunks generated
  - Detected programming languages (as colored pills)
  - Repository description (from GitHub API)
  - Star count
- [ ] A "Start Chatting →" button appears with a pulse/glow animation
- [ ] Auto-transition to the chat interface occurs after 2 seconds if the user doesn't click
- [ ] The transition is animated (fade + slide, no flicker)

---

**US-006: File Type Filtering Transparency**
> *As a user, I want to know which files were skipped and why so that I understand the scope of the knowledge base.*

**Acceptance Criteria:**
- [ ] The summary card shows a note: "X files were skipped (binary files, lock files, or files > 1MB)"
- [ ] Optionally, a collapsible "Skipped Files" list is available showing file names and skip reasons
- [ ] The note is shown in a subdued style (not alarming)

---

### Epic 3: Chat Interface

---

**US-007: Send a Question and Receive a Streamed Answer**
> *As a user, I want to type a question and see the AI's answer appear progressively so that I don't feel like I'm waiting.*

**Acceptance Criteria:**
- [ ] A text input (textarea) is fixed at the bottom of the chat view
- [ ] Pressing `Enter` submits the message
- [ ] Pressing `Shift+Enter` inserts a newline within the message
- [ ] Clicking the "Send" button (or icon button) submits the message
- [ ] The Send button shows a loading state after click (spinner replaces icon)
- [ ] The input is disabled while a response is streaming
- [ ] The user's message appears immediately in the chat list (before the response arrives), right-aligned, with a "You" label
- [ ] An assistant message bubble appears immediately with a "typing" indicator (animated dots or blinking cursor)
- [ ] Tokens stream into the assistant bubble as they arrive from the backend SSE
- [ ] A blinking cursor (|) is appended at the end of the streaming text and disappears when streaming completes
- [ ] The "Send" button re-enables after streaming completes

---

**US-008: View Source Chunks Used for the Answer**
> *As a user, I want to see exactly which parts of the repository were used to generate the answer so that I can verify accuracy.*

**Acceptance Criteria:**
- [ ] Below each assistant message, a "📂 Sources (X)" collapsed section is shown
- [ ] Clicking it expands a panel with the top retrieved chunks (max 5)
- [ ] Each source card shows:
  - File path (monospace, clickable-looking but no action in v1)
  - Chunk index
  - Relevance score as a percentage (e.g., "91% match")
  - Relevance score is color-coded: green (>80%), amber (60–80%), orange (<60%)
  - The first 3 lines of the chunk content, with a "Show more" toggle for the rest
- [ ] The panel uses an accordion animation (smooth height expansion)
- [ ] Tapping "Show more" expands the full chunk content in a monospace pre-formatted block
- [ ] The sources panel is collapsed by default to keep the chat clean

---

**US-009: Rendered Markdown with Syntax Highlighting**
> *As a user, I want AI responses to be beautifully formatted with proper markdown rendering so that code, lists, and headings are easy to read.*

**Acceptance Criteria:**
- [ ] Headings (H1–H4) are rendered with proper hierarchy and bold weight
- [ ] Bold (`**text**`) and italic (`*text*`) are rendered
- [ ] Inline code (backtick) is rendered in a monospace font with a distinct background
- [ ] Code blocks (triple-backtick) are rendered with:
  - Language label in top-left
  - Syntax highlighting (language-specific token colors)
  - Horizontal scrolling for long lines
  - "Copy" button (clipboard icon) in top-right
  - "Copied!" confirmation for 2 seconds post-click
  - Line numbers (optional, can be toggled in settings panel)
- [ ] Ordered lists (`1. 2. 3.`) and unordered lists (`- * +`) are rendered properly
- [ ] Tables render with styled headers and bordered cells
- [ ] Blockquotes are styled with a left border in accent color
- [ ] Links open in a new tab (`target="_blank"` with `rel="noopener noreferrer"`)

---

**US-010: Multi-Turn Conversational Context**
> *As a user, I want to ask follow-up questions without repeating context so that the conversation feels natural.*

**Acceptance Criteria:**
- [ ] The last 6 conversation turns (3 user, 3 assistant) are included in every LLM request
- [ ] Follow-up questions resolve correctly (e.g., "What about X?" after "How is Y handled?" correctly refers to Y)
- [ ] The system generates a standalone reformulation of ambiguous follow-ups before embedding (using a brief LLM call)
- [ ] All past messages remain visible in the scrollable chat history
- [ ] A "Clear Chat" button in the header resets the conversation but keeps the repo loaded
- [ ] Clearing the chat shows a confirmation toast: "Chat cleared. Repository still loaded."

---

**US-011: Suggested Starter Questions**
> *As a user, I want to see pre-written starter questions in the empty chat so that I know what kinds of questions are possible.*

**Acceptance Criteria:**
- [ ] When no messages have been sent, 6 suggestion chips are displayed in the center of the chat area
- [ ] Suggestions include:
  - "What does this repository do?"
  - "Explain the main entry point"
  - "List the key dependencies"
  - "How are errors handled in this codebase?"
  - "What design patterns are used?"
  - "How are tests structured?"
- [ ] Clicking a chip fills the input field with that text (does not auto-send)
- [ ] All chips disappear once the first message is sent
- [ ] Chips animate in with a stagger effect on page load

---

**US-012: Auto-Scroll with Manual Override**
> *As a user, I want the chat to stay scrolled to the bottom as responses stream in, but I also want to scroll up to read previous messages without being yanked back down.*

**Acceptance Criteria:**
- [ ] Chat auto-scrolls to the bottom when a new message appears or is streaming
- [ ] If the user manually scrolls up (wheel or touch), auto-scroll is suspended
- [ ] When auto-scroll is suspended and a new message arrives, a floating "↓ New message" button appears in the bottom-right corner of the chat area
- [ ] Clicking the floating button smoothly scrolls to the bottom and re-enables auto-scroll
- [ ] Auto-scroll re-enables automatically when the user manually scrolls back to the bottom

---

**US-013: Chat Input Growth**
> *As a user, I want the message input to expand as I type longer messages so that I can see what I'm writing.*

**Acceptance Criteria:**
- [ ] The textarea starts at 1 row height
- [ ] It auto-grows with content up to a maximum of 5 rows
- [ ] Beyond 5 rows, it becomes internally scrollable
- [ ] The input contracts back when text is deleted

---

### Epic 4: Repository Management

---

**US-014: Switch Repositories Without Page Reload**
> *As a user, I want to analyze a different repository without refreshing the page so that the experience feels like a true SPA.*

**Acceptance Criteria:**
- [ ] A "Change Repo" button is visible in the chat header at all times
- [ ] If no chat messages exist, clicking it returns directly to the URL input
- [ ] If chat messages exist, a confirmation modal appears: "Changing the repository will clear your current chat. Are you sure?"
- [ ] The modal has "Yes, change repo" (accent-colored) and "Cancel" (ghost) buttons
- [ ] After confirmation, the backend session is cleared via `DELETE /api/repo/session/:sessionId`
- [ ] A new session ID is generated on the frontend
- [ ] The UI returns to the URL input with an entrance animation

---

**US-015: Repository Info Panel**
> *As a user, I want to see key metadata about the loaded repository at a glance.*

**Acceptance Criteria:**
- [ ] A collapsible info sidebar is accessible from the chat header (info icon or "Repo Info" label)
- [ ] The panel shows:
  - Full repository name and owner
  - Repository description
  - GitHub star count (with ⭐ icon)
  - Primary programming language (colored badge)
  - All detected languages (as mini pills)
  - Total files ingested
  - Total chunks in the knowledge base
  - Ingestion timestamp ("Loaded 3 minutes ago")
- [ ] The sidebar slides in from the right with a smooth animation
- [ ] Clicking outside the sidebar or pressing `Escape` closes it
- [ ] On mobile, the sidebar is a bottom sheet

---

**US-016: Session Expiry Handling**
> *As a user, I want to be clearly informed if my session has expired and given an easy path to recover.*

**Acceptance Criteria:**
- [ ] Sessions expire after 30 minutes of backend inactivity
- [ ] If the user sends a message after session expiry, they receive a specific error: "Your session has expired."
- [ ] A "Reload Repository" button appears in place of the error (re-triggers ingestion for the same URL)
- [ ] The URL is preserved in the frontend state so re-ingestion is one click

---

## 6. Feature Specifications

### 6.1 URL Parsing & Normalization

The frontend `urlParser.js` utility must handle and normalize all the following formats into `{ owner, repo, branch }`:

| Input Format | Parsed Output |
|-------------|--------------|
| `https://github.com/vercel/next.js` | `{ owner: 'vercel', repo: 'next.js', branch: null }` |
| `https://github.com/vercel/next.js/` | `{ owner: 'vercel', repo: 'next.js', branch: null }` |
| `https://github.com/vercel/next.js.git` | `{ owner: 'vercel', repo: 'next.js', branch: null }` |
| `https://github.com/vercel/next.js/tree/canary` | `{ owner: 'vercel', repo: 'next.js', branch: 'canary' }` |
| `https://github.com/vercel/next.js/blob/main/README.md` | `{ owner: 'vercel', repo: 'next.js', branch: 'main' }` |
| `github.com/vercel/next.js` | `{ owner: 'vercel', repo: 'next.js', branch: null }` |
| `http://github.com/vercel/next.js` | `{ owner: 'vercel', repo: 'next.js', branch: null }` (coerce to https) |
| `https://www.github.com/vercel/next.js` | `{ owner: 'vercel', repo: 'next.js', branch: null }` |

**Validation Rules (client-side):**
- Owner: alphanumeric characters and hyphens, max 39 chars
- Repo: alphanumeric characters, hyphens, dots, and underscores, max 100 chars
- Neither owner nor repo can start or end with a hyphen
- The host must be `github.com` or `www.github.com`

**Validation Rules (server-side):**
- Check repository existence via GitHub API `GET /repos/{owner}/{repo}`
- If response is 404 → "Repository not found"
- If response includes `private: true` → "Repository is private"
- If response includes `archived: true` → show warning (do not block)
- If size > 500 (GitHub's size in KB × 1000) → show large-repo warning

---

### 6.2 Ingestion Pipeline Detail

#### 6.2.1 File Fetching Strategy

The backend uses the GitHub Git Trees API for efficiency:

```
GET /repos/{owner}/{repo}/git/trees/{tree_sha}?recursive=1
```

This returns the entire file tree in a single API call, avoiding the need for recursive directory traversal.

**Processable File Extensions (include list):**

*Source Code:*
`.js`, `.mjs`, `.cjs`, `.ts`, `.tsx`, `.jsx`, `.py`, `.pyw`, `.java`, `.go`, `.rs`, `.cpp`, `.cxx`, `.cc`, `.c`, `.h`, `.hpp`, `.cs`, `.rb`, `.php`, `.swift`, `.kt`, `.kts`, `.scala`, `.r`, `.R`, `.m`, `.mm`, `.lua`, `.dart`, `.ex`, `.exs`, `.erl`, `.hs`, `.clj`, `.cljs`, `.ml`, `.mli`, `.jl`, `.nim`, `.zig`, `.v`, `.vhd`, `.pl`, `.pm`

*Scripts & Automation:*
`.sh`, `.bash`, `.zsh`, `.fish`, `.ps1`, `.psm1`, `.bat`, `.cmd`, `Makefile`, `Dockerfile`, `.travis.yml`, `Jenkinsfile`, `.circleci/config.yml`, `.github/workflows/*.yml`

*Documentation & Markup:*
`.md`, `.mdx`, `.rst`, `.txt`, `.adoc`, `.asciidoc`, `.tex`, `.wiki`

*Configuration:*
`.json`, `.jsonc`, `.yaml`, `.yml`, `.toml`, `.ini`, `.cfg`, `.conf`, `.env.example`, `.env.sample`, `.xml`, `.properties`, `.gradle`, `.cmake`, `CMakeLists.txt`, `.bazel`, `.bzl`, `BUILD`

*Web:*
`.html`, `.htm`, `.css`, `.scss`, `.sass`, `.less`, `.svg`, `.vue`, `.svelte`

*Data (size-gated at 100KB):*
`.csv`, `.tsv`

**Explicit Exclude List (even if text):**
`package-lock.json`, `yarn.lock`, `poetry.lock`, `Pipfile.lock`, `Cargo.lock`, `composer.lock`, `pnpm-lock.yaml`, `bun.lockb`, `*.min.js`, `*.min.css`, `*.map`, `*.d.ts` (TypeScript declaration files, optional), `*.snap` (Jest snapshots)

**Binary Detection:**
Files with no recognized extension are inspected for null bytes in the first 512 bytes of content. If null bytes are found, the file is skipped.

**File Size Limit:**
- Individual file content > 1MB (1,048,576 bytes) is skipped
- Files > 100KB but < 1MB are chunked more aggressively (smaller chunk size: 800 chars)

---

#### 6.2.2 Concurrency & Rate Limiting

- GitHub API file content is fetched in **parallel batches of 5** files
- After each batch, check the `X-RateLimit-Remaining` response header
- If remaining < 20, insert a pause until `X-RateLimit-Reset` timestamp
- Progress updates are sent via SSE as each batch completes
- If the GitHub token is authenticated: 5,000 requests/hour budget
- If unauthenticated: 60 requests/hour (warn the user for repos with > 50 files)

---

#### 6.2.3 Text Chunking Algorithm

**Strategy: Recursive Character Text Splitter**

Split priority (attempts each separator in order, recursing until chunks fit):
1. `\n\n` (paragraph/function boundaries)
2. `\n` (line breaks)
3. `. ` (sentence boundaries, for prose files)
4. ` ` (word boundaries)
5. `` (character-level, last resort)

**Parameters:**
| Parameter | Value | Notes |
|-----------|-------|-------|
| `chunkSize` | 1,500 chars | ~375 tokens for typical English/code |
| `chunkOverlap` | 200 chars | Preserves context across boundaries |
| `minChunkSize` | 100 chars | Chunks smaller than this are merged with neighbors |

**Per-Chunk Metadata:**
```json
{
  "id": "uuid-v4",
  "sessionId": "session-uuid",
  "filePath": "src/utils/auth.js",
  "fileName": "auth.js",
  "extension": ".js",
  "language": "JavaScript",
  "chunkIndex": 3,
  "totalChunks": 8,
  "startChar": 4200,
  "endChar": 5700,
  "content": "...",
  "contentHash": "sha256-hash-of-content"
}
```

**Language-Aware Splitting (Enhanced):**
For recognized code files, attempt to split at:
- Function definitions: `function `, `const `, `def `, `func `, `public `, `private `
- Class boundaries: `class `, `struct `, `interface `
- Only if these produce chunks within size limits; otherwise fall back to recursive char split

---

#### 6.2.4 Embedding Generation

- **Model:** `Xenova/all-MiniLM-L6-v2` (local ONNX, 384-dimensional embeddings)
- **Batching:** 16 chunks per embedding batch
- **Preprocessing:** Trim whitespace, normalize Unicode, prepend file path as context:
  `"File: src/utils/auth.js\n\n{chunkContent}"`
- **Normalization:** L2 normalize all vectors (required for cosine similarity)
- **Storage:** Embedded vectors stored in LanceDB table with full metadata

---

### 6.3 RAG Query Pipeline

**Step 1: Query Preprocessing**
- Trim and normalize user message
- Check if the message is a follow-up question by evaluating conversation history
- If it's a contextual follow-up (ambiguous without history), run a "standalone question generator" LLM call:
  - Lightweight call to Claude with history + question → returns a standalone, self-contained question
  - Example: "How does it work?" + history → "How does React's reconciliation algorithm work?"
- Cap message length at 2,000 characters (truncate with notification if exceeded)

**Step 2: Query Embedding**
- Embed the (potentially rewritten) standalone question using the same `all-MiniLM-L6-v2` model
- This is a single embedding call, not a batch

**Step 3: Vector Search**
- Search LanceDB table for the current session
- Metric: **Cosine similarity**
- Top-K: **5 results** (configurable via env var)
- Filter: `sessionId = '...'` (strict session isolation)
- Minimum relevance threshold: **0.30** (chunks below this are excluded, even if in top-K)

**Step 4: Context Construction**
The retrieved chunks are assembled into a structured context block for the LLM prompt. Each chunk is labeled with its source file.

**Step 5: Prompt Assembly**
Full prompt includes:
1. System prompt (role, behavior, formatting instructions)
2. Repository metadata (name, owner, description, primary language)
3. Retrieved context chunks (labeled by file)
4. Conversation history (last 6 turns)
5. Current user question

**Step 6: Streaming LLM Call**
- Model: `claude-sonnet-4-20250514`
- Temperature: 0.2
- Max tokens: 2,048
- Streaming via SSE

**Step 7: Response Delivery**
- SSE stream sends:
  1. `sources` event (with retrieved chunk metadata) — sent immediately before streaming starts
  2. `token` events (one per streamed token)
  3. `done` event (signals completion)

---

### 6.4 System Prompt Design

```
You are an expert software engineer and technical analyst specializing in understanding codebases.
You are helping a user explore and understand a specific GitHub repository through conversation.

Repository: {repoOwner}/{repoName}
Description: {repoDescription}
Primary Language: {primaryLanguage}

IMPORTANT INSTRUCTIONS:
1. Use ONLY the provided code context to answer questions. Never invent information about the codebase.
2. If the context doesn't contain enough information to fully answer the question, be transparent: say "Based on the available context..." and note what you cannot determine.
3. When referencing code, always mention the file path in backticks (e.g., `src/utils/auth.js`).
4. Format your responses with markdown: use code blocks with language tags, use bullet lists for enumerations, use headings for long multi-part answers.
5. For code examples, always use fenced code blocks with the appropriate language identifier.
6. Be precise and technical. The user is a developer who can handle accurate, detailed explanations.
7. If asked something unrelated to the repository, politely redirect: "I'm focused on the {repoName} repository. Is there something about the codebase I can help with?"
8. Keep answers focused and structured. Avoid unnecessary padding or repetition.
```

---

### 6.5 Chat Interface Layout Specification

**Three-Panel Layout (Desktop):**
```
┌─────────────────────────────────────────────────────┐
│ HEADER: [GitChat Logo] [Repo: owner/repo ▼] [⚙ Info] [Change Repo]    │
├──────────────────────────────┬──────────────────────┤
│                              │                      │
│    CHAT MESSAGE LIST         │   REPO INFO PANEL    │
│    (scrollable, flex-grow)   │   (collapsible)      │
│                              │                      │
│                              │                      │
├──────────────────────────────┴──────────────────────┤
│ CHAT INPUT AREA: [________________________] [Send →] │
└─────────────────────────────────────────────────────┘
```

**Mobile Layout (< 768px):**
- Header collapses to logo + hamburger menu
- Repo Info Panel becomes a bottom sheet (accessed via icon in header)
- Full-width chat area
- Input fixed to bottom with padding for iOS safe area

---

## 7. Design System — Neo-Brutalism

### 7.1 Philosophy

Neo-brutalism is raw, honest, and unapologetic. It rejects the soft gradients and rounded corners of "corporate design" in favor of bold borders, high contrast, and a physical-feeling interaction model (buttons that visually "press"). GitChat's neo-brutalism is **intentional, not accidental** — every element is precisely crafted to feel bold yet usable.

### 7.2 Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-bg` | `#F5EFE0` | App background (warm cream) |
| `--color-surface` | `#FFFFFF` | Cards, panels, message bubbles |
| `--color-border` | `#0A0A0A` | All borders (hard black) |
| `--color-text-primary` | `#0A0A0A` | Primary text |
| `--color-text-secondary` | `#555555` | Metadata, captions |
| `--color-accent-yellow` | `#FFE500` | Primary accent, CTA buttons, progress bar |
| `--color-accent-green` | `#00FF87` | Success states, high relevance scores |
| `--color-accent-pink` | `#FF3366` | Error states, destructive actions |
| `--color-accent-blue` | `#0055FF` | Links, secondary actions |
| `--color-accent-orange` | `#FF6B00` | Warning states, medium relevance |
| `--color-user-bubble` | `#FFE500` | User message background |
| `--color-assistant-bubble` | `#FFFFFF` | Assistant message background |
| `--color-code-bg` | `#0A0A0A` | Code block backgrounds (inverted) |
| `--color-code-text` | `#F5EFE0` | Code text (warm white on black) |

### 7.3 Typography

| Role | Font | Weight | Size |
|------|------|--------|------|
| App Name / Display | `Syne` | 800 (ExtraBold) | 48–72px |
| Section Headings | `Syne` | 700 (Bold) | 24–32px |
| Body Text | `DM Sans` | 400/500 | 14–16px |
| Monospace / Code | `JetBrains Mono` | 400 | 13px |
| Labels / Chips | `DM Sans` | 700 | 11–12px (uppercase, tracked) |
| Button Text | `DM Sans` | 700 | 14px |

**Font Loading:**
```html
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### 7.4 Border & Shadow System

All elements in the UI follow the same shadow convention: **solid, offset, non-blurred box shadows** using `--color-border`.

| Variant | CSS Value | Usage |
|---------|-----------|-------|
| `shadow-neo-sm` | `2px 2px 0px #0A0A0A` | Small cards, chips, tags |
| `shadow-neo` | `4px 4px 0px #0A0A0A` | Standard cards, message bubbles |
| `shadow-neo-lg` | `6px 6px 0px #0A0A0A` | Primary CTA buttons, modals |
| `shadow-neo-hover` | `2px 2px 0px #0A0A0A` | Hovered state (reduced shadow = appears to lift closer) |
| `shadow-neo-pressed` | `0px 0px 0px #0A0A0A` | Pressed/active state (no shadow = fully pressed) |

**Border radius:** `0px` on all structural elements. Maximum `2px` on tags/chips (deliberate exception).

**Border width:** `2px solid #0A0A0A` on all interactive elements. `1px solid #0A0A0A` on dividers.

### 7.5 Spacing Grid

All spacing uses a **4px base grid**: 4, 8, 12, 16, 24, 32, 48, 64, 96px.

### 7.6 Component Specifications

**Button (Primary):**
```css
background: var(--color-accent-yellow);
border: 2px solid var(--color-border);
box-shadow: 4px 4px 0px #0A0A0A;
padding: 12px 24px;
font-weight: 700;
border-radius: 0px;
transform-origin: center;
transition: transform 80ms, box-shadow 80ms;
```

Hover: `transform: translate(2px, 2px); box-shadow: 2px 2px 0px #0A0A0A;`  
Active: `transform: translate(4px, 4px); box-shadow: 0px 0px 0px #0A0A0A;`

**Button (Ghost/Secondary):**
```css
background: transparent;
border: 2px solid var(--color-border);
box-shadow: 2px 2px 0px #0A0A0A;
```

**Input Field:**
```css
background: var(--color-surface);
border: 2px solid var(--color-border);
box-shadow: none;
outline: none;
transition: box-shadow 150ms, border-color 150ms;
```
Focus: `box-shadow: 4px 4px 0px #0055FF; border-color: #0055FF;` (blue neo-shadow on focus)

**Message Bubble (User):**
```css
background: var(--color-accent-yellow);
border: 2px solid var(--color-border);
box-shadow: 3px 3px 0px #0A0A0A;
padding: 12px 16px;
border-radius: 0px;
max-width: 75%;
margin-left: auto;
```

**Message Bubble (Assistant):**
```css
background: var(--color-surface);
border: 2px solid var(--color-border);
box-shadow: 3px 3px 0px #0A0A0A;
padding: 16px 20px;
border-radius: 0px;
max-width: 85%;
```

**Progress Bar:**
```css
background: var(--color-bg);
border: 2px solid var(--color-border);
height: 24px;
box-shadow: 3px 3px 0px #0A0A0A;
```
Fill: Animated CSS `background-size` striped pattern:
```css
background-image: repeating-linear-gradient(
  45deg,
  #FFE500,
  #FFE500 10px,
  #FFCC00 10px,
  #FFCC00 20px
);
background-size: 200% 100%;
animation: progress-stripes 1s linear infinite;
```

**Code Block:**
```css
background: #0A0A0A;
border: 2px solid #0A0A0A;
box-shadow: 4px 4px 0px #555555;
color: var(--color-accent-green);
font-family: 'JetBrains Mono', monospace;
```

**Toast / Alert:**
```css
background: var(--color-accent-pink);
border: 2px solid var(--color-border);
box-shadow: 4px 4px 0px #0A0A0A;
color: #FFFFFF;
```

---

## 8. Animation & Micro-Interaction Specification

### 8.1 Page Transitions

**Landing → Ingestion:**
- Landing page slides up and fades out (`y: 0 → -40, opacity: 1 → 0`, 300ms)
- Ingestion view slides up from below (`y: 40 → 0, opacity: 0 → 1`, 400ms, 50ms delay after landing exits)

**Ingestion → Chat:**
- Ingestion summary scales up to full opacity → scales down to 90% and fades
- Chat interface fades and slides in from y:30
- Total transition: 800ms with `ease-out` curve

### 8.2 Landing Page Entrance

On mount:
1. App logo letters stagger in from `y: -20, opacity: 0` with 80ms delay per letter
2. Tagline slides in from `y: 20, opacity: 0` with 400ms delay
3. URL input box slides in from `y: 20, opacity: 0` with 600ms delay
4. CTA button slides in from `y: 20, opacity: 0` with 700ms delay
5. Example chips stagger in from `opacity: 0` with 800ms delay and 60ms between each chip
6. Subtle animated grid background (CSS `background-position` animation, infinite loop)

### 8.3 Button Press Mechanics

All primary buttons use spring-based physical press simulation:

```javascript
// Framer Motion variants
const buttonVariants = {
  rest: { x: 0, y: 0, boxShadow: "4px 4px 0px #0A0A0A" },
  hover: { 
    x: 2, y: 2, 
    boxShadow: "2px 2px 0px #0A0A0A",
    transition: { duration: 0.08, ease: "easeIn" }
  },
  press: { 
    x: 4, y: 4, 
    boxShadow: "0px 0px 0px #0A0A0A",
    transition: { duration: 0.05, ease: "easeIn" }
  }
}
```

### 8.4 Input Shake Animation (Validation Error)

```javascript
const shakeVariants = {
  shake: {
    x: [0, -8, 8, -8, 8, -4, 4, 0],
    transition: { duration: 0.4, ease: "easeInOut" }
  }
}
```

Triggered by: invalid URL submission, empty message send.

### 8.5 Chat Message Entrance

**User message:**
```javascript
{
  initial: { opacity: 0, x: 30, scale: 0.95 },
  animate: { opacity: 1, x: 0, scale: 1, transition: { type: 'spring', stiffness: 400, damping: 30 } }
}
```

**Assistant message:**
```javascript
{
  initial: { opacity: 0, x: -30, scale: 0.95 },
  animate: { opacity: 1, x: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 28 } }
}
```

### 8.6 Streaming Cursor

A blinking `|` character appended to the end of streaming text:
```css
@keyframes blink-cursor {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
.streaming-cursor {
  display: inline-block;
  width: 2px;
  height: 1em;
  background: #0A0A0A;
  margin-left: 2px;
  animation: blink-cursor 0.7s step-end infinite;
}
```

### 8.7 Progress Bar Animation

- Bar fill transitions with `transition: width 300ms ease-out` for smooth incremental updates
- Stripe animation: `animation: progress-stripes 0.8s linear infinite`
- Phase label switches with a `crossfade` transition (old fades out, new fades in, 200ms)

### 8.8 Ingestion Completion Stamp Effect

When progress hits 100%:
1. The progress bar briefly flashes (background color pulse: yellow → green → yellow)
2. A "✓ READY" badge appears with `scale: 0 → 1.2 → 1.0` spring animation and a slight rotation (`rotate: -3 → 0`)
3. The badge uses a rubber stamp aesthetic: thick border, slight rotation, JetBrains Mono font

### 8.9 Source Chunk Accordion

The source chunk panel uses `AnimatePresence` with height animation:
```javascript
{
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto', opacity: 1, transition: { height: { duration: 0.25 }, opacity: { duration: 0.2 } } },
  exit: { height: 0, opacity: 0, transition: { duration: 0.2 } }
}
```

### 8.10 Loading States

**"AI is thinking" indicator:**
Three squares that bounce sequentially (staggered `y: 0 → -8 → 0` animation with 100ms stagger):
```
  ■ ■ ■  (each bounces with 100ms stagger delay)
```
Using `--color-border` for squares, on `--color-surface` background, bordered box.

**Skeleton loader for repo info panel:**
Pulsing placeholder blocks using:
```css
animation: shimmer 1.5s ease-in-out infinite;
background: linear-gradient(90deg, #E8E2D4 25%, #F5EFE0 50%, #E8E2D4 75%);
background-size: 200% 100%;
```

### 8.11 Toast Notifications

Entrance: slide in from top-right, `y: -20 → 0, opacity: 0 → 1`, 250ms spring
Exit: slide out to top-right, `y: 0 → -20, opacity: 1 → 0`, 200ms ease-in
Auto-dismiss after 5 seconds with a countdown progress bar shrinking from full width to 0 at the bottom of the toast.

### 8.12 Modal Entrance

```javascript
// Backdrop: opacity 0 → 0.5
// Modal box: scale(0.9) → scale(1), opacity 0 → 1, 200ms ease-out
```
Dismissal: reverse of above, 150ms ease-in.

### 8.13 Relevance Score Badge Animation

When source chunks expand:
- Score badges count up from 0% to the actual value with a 600ms easing animation
- Color transitions simultaneously: white → green/amber/orange

### 8.14 "Scroll to Bottom" Button

Appears with `scale: 0 → 1, opacity: 0 → 1` spring animation when user scrolls up.
Disappears with `scale: 1 → 0, opacity: 1 → 0` when user is at the bottom.
Pulses subtly (scale: 1 → 1.05 → 1, 1.5s infinite) when a new message arrives while scrolled up.

---

## 9. Non-Functional Requirements

### 9.1 Performance Targets

| Metric | Target |
|--------|--------|
| Time to first byte (landing page) | < 500ms |
| Largest Contentful Paint (LCP) | < 2s |
| First Contentful Paint (FCP) | < 1s |
| URL validation round-trip | < 800ms |
| Time to first streamed token (after send) | < 2s |
| Vector search latency | < 200ms |
| Small repo ingestion (< 50 files) | < 30s |
| Medium repo ingestion (50–300 files) | 30–120s |
| Large repo ingestion (300–1000 files) | 2–8 minutes |

### 9.2 Concurrency

- Backend must handle at least 10 simultaneous ingestion sessions
- Each session's vector data is strictly isolated by session ID
- Node.js event loop must not be blocked by heavy embedding computations (use worker threads if needed)

### 9.3 Reliability

- Streaming responses must handle partial failures gracefully (partial response shown with error)
- Network interruptions during ingestion must be recoverable (user can retry)
- Backend crash does not lose conversation history on the frontend (stored in React state)

### 9.4 Accessibility

- All interactive elements reachable via `Tab` in logical order
- All icon-only buttons have `aria-label` attributes
- `aria-live="polite"` on the streaming message area for screen readers
- `aria-describedby` on error messages linking to the input they describe
- Focus trapped within modals while open
- `Escape` key closes modals and sidebars
- Color contrast minimum: WCAG AA (4.5:1 for body text, 3:1 for large text)
- The neo-brutalism palette has been chosen with contrast as a primary constraint

### 9.5 Browser Support

| Browser | Minimum Version |
|---------|----------------|
| Chrome | 100 |
| Firefox | 100 |
| Safari | 16 |
| Edge | 100 |
| Chrome Android | 100 |
| iOS Safari | 16 |

### 9.6 Security

- GitHub token is never exposed to the client
- All user inputs are sanitized server-side before use in prompts
- Session IDs are UUIDs (not guessable, not sequential)
- CORS strictly limited to known frontend origin
- Rate limiting on all API endpoints
- No user PII collected or stored

---

## 10. Error States & Edge Cases

| Scenario | User-Facing Message | UI Treatment | Recovery |
|----------|--------------------|-|----------|
| Invalid URL format | "Please enter a valid GitHub repository URL (e.g., github.com/owner/repo)" | Inline error below input, red border, shake animation | Edit URL |
| Repository not found (404) | "Repository not found. Double-check the URL and try again." | Inline error | Edit URL |
| Repository is private | "This repository is private. GitChat only works with public repositories." | Inline error + info icon | Edit URL |
| Repository is empty | "This repository has no files yet." | Inline error | Edit URL |
| No processable text files | "No text-based source files were found in this repository." | Inline error with file type explanation | Edit URL |
| GitHub API rate limit exceeded | "GitHub API rate limit reached. Available again in [X] minutes." | Warning banner with countdown timer | Wait or provide token |
| File fetch error (individual file) | Non-blocking warning: "X files could not be read and were skipped." | Toast warning | Proceed with partial data |
| Embedding model not loaded | "Embedding model is initializing. Please wait a moment." | Loading state on backend | Auto-retry after 3s |
| LLM API error | "Couldn't get a response right now. Please try again." | Error bubble in chat with retry button | Retry |
| LLM rate limit | "Rate limit reached. Please wait a few seconds before sending another message." | Toast + input blocked for 10s | Auto-unlock |
| Session expired (30 min idle) | "Your session has expired. Reload the repository to continue." | System message in chat + "Reload" button | Re-ingest same URL |
| Network disconnection | "Connection lost. Check your internet connection." | Persistent banner at top with retry | Auto-retry every 10s |
| Message too long (>2000 chars) | "Your message is too long. Maximum 2,000 characters." | Character counter goes red, send blocked | User edits |
| Very large repository (>500MB) | "This is a very large repository (~X GB). Processing may take 10+ minutes and may be incomplete." | Warning modal with "Proceed" / "Cancel" | User choice |
| Zero relevant chunks found | "I couldn't find relevant context in the repository for that question. Try rephrasing." | Shown as assistant message with no sources | User rephrases |
| Backend server down | "GitChat is temporarily unavailable. Please try again later." | Full-page error state with retry | Retry |
| Ingestion cancelled by user | "Ingestion cancelled. You can analyze a different repository." | Info message, back to URL input | Enter new URL |

---

## 11. Out of Scope (v1.0)

These features are explicitly deferred to future versions:

- **v2 Candidates:** Export/share conversation, line-number links to GitHub source, user accounts, repository comparison, PR/issue creation from chat, dark mode
- **v3 Candidates:** Private repositories (OAuth), GitLab/Bitbucket support, team collaboration, admin dashboard

---

## 12. Success Metrics

### 12.1 Technical Metrics

| Metric | Target | Measurement Method |
|--------|--------|-|
| Successful ingestion rate | > 95% for valid public repos | Error rate tracking |
| Mean time to first streamed token | < 2 seconds | Frontend timing |
| Vector search P95 latency | < 300ms | Backend logging |
| Embedding generation rate | > 10 chunks/second | Performance testing |
| Session isolation integrity | 100% (no cross-session leakage) | Integration tests |

### 12.2 User Experience Metrics

| Metric | Target | Measurement Method |
|--------|--------|-|
| Answer quality rating | > 4.0/5.0 | In-chat thumbs up/down |
| Average messages per session | > 5 | Session analytics |
| Chat session abandonment rate | < 20% after ingestion | Frontend events |
| Animation jank (CLS) | < 0.1 | Lighthouse |
| Time to interactive (TTI) | < 3 seconds | Lighthouse |

---

## 13. Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| GitHub API rate limiting on large repos | High | High | Authenticated token, concurrency control, progress transparency |
| Very large repos (1000+ files) causing timeouts | Medium | High | Hard file count cap (1000), streaming progress, cancel option |
| `@xenova/transformers` slow on first load (model download) | High | Medium | Pre-warm on backend startup, show loading state |
| LanceDB native build failures on some environments | Medium | High | Document prerequisites clearly, provide Docker fallback |
| Prompt injection via repository content | Low | Medium | System prompt hardening, content length limits |
| LLM hallucination on weak context | Medium | Medium | Clear "not enough context" fallback, source attribution |
| CORS misconfiguration in production | Low | High | Explicit origin whitelist, tested in staging |
| Memory leak in long-running sessions | Medium | Medium | Session TTL cleanup, memory monitoring |

---

## 14. Appendix

### 14.1 Glossary

| Term | Definition |
|------|-----------|
| **RAG** | Retrieval-Augmented Generation — combining vector search with LLM generation |
| **Chunk** | A substring of a source file, used as the atomic unit for embedding and retrieval |
| **Embedding** | A vector representation of text in high-dimensional space |
| **Cosine Similarity** | A metric for measuring the angle between two vectors; used to find semantically similar chunks |
| **LLM** | Large Language Model (Claude Sonnet) |
| **SSE** | Server-Sent Events — a browser API for unidirectional server-to-client streaming |
| **Session** | A unique user interaction identified by a UUID; owns an isolated vector store namespace |
| **Top-K** | The K most similar vectors retrieved from the vector store for a given query |
| **LanceDB** | A local, file-based vector database with a Node.js client |
| **Neo-Brutalism** | A UI design aesthetic characterized by bold borders, hard shadows, raw typography, and high contrast |

### 14.2 Referenced Tools & Libraries

Full installation details are in the accompanying TRD document.

- React 18, Vite 5, Tailwind CSS 3, Framer Motion 11
- Express.js 4, Node.js 20
- `@octokit/rest` v20
- `@xenova/transformers` v2
- `vectordb` (LanceDB) v0.x
- `@anthropic-ai/sdk` v0.x
- `uuid`, `zod`, `helmet`, `cors`, `morgan`, `express-rate-limit`