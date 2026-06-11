# GitChat — Google Stitch Design Prompt

---

## PROJECT OVERVIEW

Design a full web application called **GitChat** — a developer tool that lets users have natural-language AI conversations with any public GitHub repository. Paste a repo URL → AI reads and indexes the codebase → chat with it like a teammate who knows the entire codebase.

The app has **three distinct screens** that transition between each other:

1. **Landing Page** — URL entry
2. **Ingestion Screen** — Real-time processing progress
3. **Chat Interface** — The full conversation UI

---

## DESIGN LANGUAGE: NEO-BRUTALISM (Developer Edition)

This is a hard-edged, raw, high-contrast neo-brutalist design. **Not soft. Not rounded. Not pastel. Not glassy.**

Rules:
- **Zero border-radius** everywhere. All boxes, buttons, inputs, cards, modals are sharp rectangles.
- **2px solid black borders** on every interactive element. Cards use 2px borders.
- **Hard pixel-offset drop shadows** — shadows are `4px 4px 0px #0A0A0A` (no blur, solid offset). Buttons have `4px 4px` rest state. On hover the offset shrinks to `2px 2px`. On click/press it becomes `0px 0px`. This creates a physical press-down tactile effect.
- **All UI labels** (section names, field labels, tags) are uppercase monospace with wide letter-spacing.
- **Bold, heavy typography** for headings. Syne Black (800 weight) for display text. DM Sans for body copy. JetBrains Mono for code and labels.
- Composition feels like a graphic design magazine layout — big type, asymmetric blocks, intentional use of empty space.

---

## COLOR PALETTE — VIVID, DELIBERATE, FULL SPECTRUM

**THE RULE ON BLUE**: Blue is allowed and used, but it must be **electric and bold** — pure cobalt `#0055FF`, not soft, not gradient, not the dominant brand color. Blue is one voice in a loud ensemble. What to avoid entirely: soft periwinkle, muted indigo, gradient blue-to-purple, "trustworthy AI" baby blue, or any palette that is *mostly* blue. Blue here earns its place by contrast with the warm tones around it.

Use this full-spectrum, high-contrast developer color system:

| Token | Hex | Use |
|---|---|---|
| `bg-main` | `#F5EFE0` | Page background (warm cream, like aged paper) |
| `bg-black` | `#0A0A0A` | Borders, shadows, code backgrounds, header |
| `white` | `#FFFFFF` | Surface color for cards, message bubbles |
| `yellow` | `#FFE500` | Primary CTA buttons, user message bubbles, progress bar fill |
| `green` | `#00FF87` | Completed steps, success states, progress complete, code terminal text |
| `blue` | `#0055FF` | Focus rings, links, info states, blockquote accents, phase indicator active step |
| `pink` | `#FF3366` | Errors, danger buttons, invalid states, shaking input border |
| `orange` | `#FF6B00` | Warnings, secondary actions, phase labels, repo badge accent |
| `gray` | `#555555` | Secondary text, placeholder text, subdued labels |

**Why this palette works**: Yellow and blue are direct complements — they create maximum tension and visual energy when placed side-by-side. Green reads as technical/terminal. Orange adds warmth. Pink handles failure states with urgency. None of these colors "blend into each other" — every color has a distinct job and they don't overlap.

**Accent usage logic:**
- Interactive focus ring / active input border: electric blue `#0055FF` with `4px 4px 0px #0055FF` shadow
- Primary button: yellow `#FFE500` background, black text, black 4px shadow
- User chat bubble: yellow `#FFE500`
- AI chat bubble: white `#FFFFFF`
- Active/current phase step: blue `#0055FF`
- Completed phase step: green `#00FF87`
- Success / complete state: green `#00FF87`
- Error / danger: pink `#FF3366`
- Phase labels and repo processing state: orange `#FF6B00`
- Progress bar stripes: yellow + darker yellow (`#FFCC00`) diagonal stripes
- Code terminal blocks: pure black `#0A0A0A` background with green `#00FF87` text
- Links in markdown responses: blue `#0055FF` underlined
- Blockquotes: left border in blue, faint blue-tinted background
- Relevance score badges: green (high) → yellow (medium) → pink (low)

---

## TYPOGRAPHY

- **Display headings**: Syne, 800 weight — used for the big "GitChat" logo, major headings
- **Body text**: DM Sans, 400/500 weight — messages, descriptions, form labels
- **Monospace labels / code**: JetBrains Mono — uppercase section labels, code snippets, terminal output, file paths, repo names, percentages

---

## GLOBAL ANIMATION RULES

Every element should feel alive. These are the interaction contracts:

### Button Press Physics (ALL buttons)
- **Rest state**: box-shadow `4px 4px 0px #0A0A0A`
- **Hover**: element physically moves `+2px right, +2px down`, shadow shrinks to `2px 2px 0px #0A0A0A`. Duration: 80ms.
- **Click/Tap (active)**: element moves `+4px right, +4px down`, shadow becomes `0px 0px 0px #0A0A0A`. Duration: 50ms. Releases back to rest on pointer-up. This feels like pressing a physical rubber stamp.

### Page Transitions
Each screen enters with `opacity: 0 → 1` and a `translateY(20px) → 0` ease-out over 350ms. Exits with `opacity 1 → 0`, `translateY: 0 → -20px` over 250ms. Screens never coexist — strict one-at-a-time swap.

### Scroll-triggered entrance animations
Messages entering the chat list slide in with spring physics:
- User messages: enter from right (`translateX 30px → 0, scale 0.94 → 1`), spring stiffness 400, damping 30
- AI messages: enter from left (`translateX -30px → 0, scale 0.94 → 1`), spring stiffness 300, damping 28

### Hover micro-interactions (general)
- All clickable chips/tags: same press-down effect as buttons
- Navigation links: underline animation, color shift
- Accordion / collapsible items: chevron rotates 180° smoothly, content height animates with `height: 0 → auto`

---

## SCREEN 1: LANDING PAGE

**Purpose**: A single-focus screen where users paste a GitHub repo URL and hit Analyze.

### Background
Full-screen dot grid pattern: small dots (1px) arranged in a 30px × 30px grid, color `#0A0A0A` at 8% opacity over the cream background. The entire dot grid slowly drifts diagonally (down-right) in an infinite CSS animation at 8 seconds/cycle, giving a subtle flowing texture feeling. It's barely visible — atmospheric, not distracting.

### Layout
Vertically and horizontally centered content block, max-width 680px, centered on screen.

### Giant Logo: "GitChat"
- Font: Syne, 800 weight
- Desktop size: 80px. Mobile: 52px.
- Tight letter-spacing, black color
- The letter **"C"** in "Chat" (the 4th character) is colored **orange** (`#FF5400`) — the only letter that breaks the black, giving the logo personality
- **On page load**: Each letter animates in sequentially with a staggered spring bounce — letters drop from `translateY: -25px, opacity: 0` to their final position, with 70ms stagger between each letter. It's bouncy and playful (spring stiffness 300, damping 25). Total animation takes ~0.7s.

### Tagline
Below the logo, body text in DM Sans, `#555555`, 18px:
> "Have natural language conversations with any public GitHub repository."
Fades in with `opacity: 0 → 1, translateY: 20px → 0` starting at 400ms after page load.

### URL Input + CTA
A wide full-width input group that slides up at 600ms:

**Input field (left, flex-grow):**
- Background white, 2px solid black border, no border radius
- Placeholder text in gray monospace: `https://github.com/owner/repository`
- Font: JetBrains Mono, 14px
- On **focus**: the border changes to electric blue `#0055FF` with a `4px 4px 0px #0055FF` shadow. This is the sharp, pure cobalt blue — vivid and high-contrast, not a soft "AI trustworthy" blue.
- Height: 52px

**Analyze button (right, attached, no gap):**
- Background: yellow `#FFE500`, 2px solid black border, no border radius
- Text: "ANALYZE →" in bold uppercase DM Sans
- Padding: 0 24px
- Has the full press-down shadow animation on hover/tap
- When loading (after submit): shows a small spinning border loader inline, text changes to "ANALYZING..."

**Error state:**
- A pink `#FF3366` banner with 2px black border appears below the input
- The entire input row physically shakes left-right using a keyframe animation (x: 0, -8, +8, -6, +6, -3, +3, 0 over 450ms)
- Small error text in the banner, white, 12px monospace

### Example Repo Chips
6 monospace chips below the input row, arranged in a flex-wrap row, with 70ms stagger entrance animation:

```
facebook/react     vercel/next.js     expressjs/express
vitejs/vite        tailwindlabs/tailwindcss     anthropics/sdk-python
```

Each chip:
- Background white, 2px black border, JetBrains Mono 12px
- Box shadow: `2px 2px 0px #0A0A0A` at rest
- On hover: press-down effect (shadow `1px 1px`, moves +1 +1)
- On click: fills the input with the repo URL

### Footer hint
Very small monospace text at bottom center: `Only public repositories are supported`

---

## SCREEN 2: INGESTION / PROCESSING SCREEN

**Purpose**: Displays real-time progress as the backend processes the GitHub repo. 4 sequential phases, each with live stats.

### Layout
Centered card, ~520px wide, cream background, 2px black border, `6px 6px 0px #0A0A0A` shadow. Padding 32px. On a page with the same dot-grid background as the landing page.

### Repo Header
Top of card:
- GitHub Octocat icon (16px) + repo full name in JetBrains Mono bold 14px: e.g. `facebook/react`
- Small "processing…" label in orange `#FF5400` uppercase tracking-widest 10px below it

### Giant Percentage
Centered, Syne 800, 72px, pure black: shows the live processing percentage from 0% → 100%.
Update smoothly with a spring number counter animation (number ticks up, not jumps).
Below it, tiny monospace gray text: "FILES PROCESSED"

### Striped Progress Bar
Full width, height 24px, 2px black border, `3px 3px 0px #0A0A0A` shadow:
- **Fill**: Diagonal repeating stripe pattern: alternating yellow `#FFE500` and slightly darker yellow `#FFCC00` at 45-degree angle, stripe width 10px
- **Animation**: The stripe pattern moves rightward continuously (CSS `background-position` animation, 0.8s linear infinite) — like a conveyor belt or construction zone warning. Very satisfying.
- When complete: fill color transitions to **green** `#00FF87` and the stripes stop — static green fill with a brief flash/pulse.

### 4-Step Phase Indicator
Below the progress bar, 4 horizontal pill-segments representing the 4 phases:

```
[FETCHING FILE TREE] [READING FILES] [CHUNKING] [GENERATING EMBEDDINGS]
```

Each segment is a flat rectangle, 2px height, border `1px solid #0A0A0A`. Colors:
- Completed phase: green `#00FF87`
- Active phase: electric blue `#0055FF`
- Pending phase: cream `#F5EFE0`

Transitions between states are smooth color fades (300ms).

Above the segments: the current phase label animates with a crossfade (old label fades out, new fades in) in orange `#FF5400` uppercase monospace.

### File Processing Ticker (terminal-style)
A black `#0A0A0A` terminal box, 2px border, monospace green `#00FF87` text, 12px:
```
→ src/components/chat/MessageList.jsx
```
Files slide in from the bottom and slide out the top as new files are processed. Animation: `translateY: 10px → 0, opacity: 0 → 1` on enter; `translateY: 0 → -10px, opacity: 1 → 0` on exit. Duration 150ms. This looks like a live terminal feed.

### Stats Row
Monospace 12px, spaced apart:
- Left: `247 of 812 files` — numbers in bold black, "of" and "files" in gray
- Right: `~42s remaining` in orange `#FF5400`

### Cancel Button
Ghost style — 2px black border, transparent background, "CANCEL" text — at the very bottom. Has the press-down hover effect. On hover, background becomes pink `#FF3366`.

---

## SCREEN 3: CHAT INTERFACE

The main application screen. Split into three zones: header, message area, input bar.

### Header Bar (fixed, full width)
Height 56px. Background: pure white `#FFFFFF`. Bottom border: `2px solid #0A0A0A`. No box shadow.

**Left**: "GitChat" wordmark in Syne bold 20px. The "C" is orange `#FF5400` as before.

**Center**: Repo badge — a pill with 2px black border, `2px 2px 0px #0A0A0A` shadow, cream background:
- GitHub icon + repo name in JetBrains Mono 12px: `facebook/react`
- Small info (ℹ) icon button to the right — opens the repo info sidebar. On hover: icon turns orange.

**Right**: Ghost button "⟳ CHANGE REPO" — uppercase 11px monospace, 2px border. On hover: cream background, press-down effect.

### Message Area (scrollable, fills remaining height)
Background: the cream `#F5EFE0`.

**Empty state** (no messages yet):
Centered vertically in the area. Small monospace gray label: `TRY ASKING...`
Below it, 6 suggested question chips in a flex-wrap centered layout, animated in with 70ms stagger:
- Each chip: white background, 2px black border, `2px 2px 0px #0A0A0A` shadow, DM Sans 13px
- On hover: press-down effect + blue `#0055FF` border tint
- On click: the chip text prefills the input

**User message bubble (right-aligned):**
- Max width 75% of message area
- Small label above: `YOU` in gray uppercase monospace 10px
- Bubble: yellow `#FFE500` background, 2px black border, `3px 3px 0px #0A0A0A` shadow
- Text: DM Sans 14px, black
- Enters from the right with spring animation

**AI message bubble (left-aligned):**
- Max width 85%
- Small label above: `GITCHAT` in gray uppercase monospace 10px
- Bubble: white background, 2px black border, `3px 3px 0px #0A0A0A` shadow
- Error state: pink `#FF3366` border instead
- Supports rich markdown rendering: headers, bold, italic, tables, lists
- Inline code: cream background `#F5EFE0`, 1px border, JetBrains Mono
- Enters from the left with spring animation

**Code blocks inside AI messages:**
- Full-width within the bubble
- Header bar: pure black background with language label (`JAVASCRIPT`, `PYTHON`, etc.) in lime `#C8FF00` JetBrains Mono 10px uppercase on the left, `COPY` button on the right in gray that turns white on hover
- Code area: pure black background `#0A0A0A`, JetBrains Mono 13px, `oneDark` syntax theme colors
- 2px border, `4px 4px 0px #555555` shadow (gray shadow on dark block)

**Typing indicator** (shown while waiting for first token):
- Appears as an AI bubble container
- Inside: 3 small 6px squares bounce in a staggered wave animation — up-down-up with ~100ms stagger between squares. The squares are black on white background.

**Streaming cursor** (shown while AI is actively streaming text):
- A thin 2px-wide vertical bar at the end of the text, same height as the text line
- Blinks on/off at 0.7s interval (step animation, not ease)

**Source chunks accordion** (appears below AI message after response):
- A collapsible section triggered by a `▸ Sources (5)` row
- Folder icon + "Sources (N)" label + chevron arrow on the right
- Border: `2px solid rgba(10,10,10,0.3)`, no shadow
- Inside: individual source cards, each showing:
  - Header: file path in monospace (truncated), relevance score badge in top-right (green/yellow/coral based on score)
  - Preview: first 3 lines of code in monospace on white
  - `Show more` toggle if content is long — chevron rotates on expand, content slides in
- Background of card header: cream

**Scroll-to-bottom floating button:**
- Fixed position, bottom-right of the message area (not the whole screen), above the input
- Round-ish but still sharp-cornered (square, actually)
- Yellow `#FFE500`, 2px black border, `3px 3px 0px #0A0A0A` shadow
- Contains a down-arrow chevron icon
- Appears/disappears with a spring scale animation (scale 0 → 1)
- When new messages arrive while user is scrolled up: the button pulses (scale 1 → 1.06 → 1, shadow grows) on repeat

**System messages** (e.g., "Chat cleared. Repository still loaded."):
- Centered horizontally
- Pill shape: cream background, 1px black/30% border, gray monospace 11px text

### Chat Input Bar (fixed at bottom)
Background: white, top border `2px solid #0A0A0A`. Padding 16px.

**Textarea:**
- Auto-growing (expands with content, starts at 1 row, max 5 rows)
- White background, 2px black border, JetBrains Mono 14px
- Focus: electric blue `#0055FF` border, `4px 4px 0px #0055FF` shadow — the same cobalt blue focus treatment as the landing page input
- Placeholder: `Ask anything about this repo...` in gray
- Disabled (grayed out, 50% opacity) while AI is streaming a response

**Send button (attached right):**
- Square: 52px × 52px
- Yellow `#FFE500` background, 2px black border, 4px black shadow
- Contains a large arrow-right icon (→)
- Full press-down effect on hover/tap
- While streaming: icon changes to a square STOP icon, background turns pink `#FF3366` with white icon — clicking it aborts the stream

**Character counter** (appears when approaching limit):
- Tiny monospace text at bottom-right of input: `1847 / 2000` in gray, turns coral when near limit

### Repo Info Sidebar (overlay from right)
Triggered by the info (ℹ) button in the header.

**Mobile**: Takes full screen width as a bottom sheet that slides up.
**Desktop**: 320px wide panel that slides in from the right edge.

Animation: `translateX: 100% → 0` with spring physics (stiffness 280, damping 28). Overlay backdrop fades to 40% black behind it.

Sidebar contents:
- Header: "REPO INFO" label + close (×) button. 2px bottom border.
- Section: repo full name in Syne bold 22px, description below in gray DM Sans
- Stats row: ⭐ 42.3K stars, 🕒 "analyzed 3m ago"
- Language pills: tags for each detected language (JavaScript, TypeScript, etc.). Each pill has a color from the palette (cycling through yellow, green, orange, magenta, coral). 2px border, press-down hover.
- Two stat cards (grid-2-col): FILES card + CHUNKS card. Each has an icon, gray label, big bold number in Syne. 2px border, `2px 2px 0px #0A0A0A` shadow.
- All content slides in staggered after the panel opens (each section appears 50ms after the previous)

### Toast Notifications (top-right stack)
Each toast:
- Width 280px, fixed top-right with 16px margin
- 2px black border, white or color-coded background:
  - Success: green `#00FF87` border + green tint background
  - Error: coral `#FF4040` border + coral tint
  - Info: orange `#FF5400` border + light orange
  - Warning: yellow `#FFE500` border + yellow tint
- Monospace text 12px, black
- Small × close button right
- Enters sliding in from the right with spring. Exits sliding right. Auto-dismisses after 5s.
- Progress line at bottom depletes from full-width to 0 over the duration (like a countdown timer bar).

### Confirmation Modal
For "Change Repo" confirmation:
- Centered overlay, dark backdrop at 50% opacity (fades in)
- Modal box: white, 2px black border, `6px 6px 0px #0A0A0A` shadow, max-width 380px
- Title in Syne bold 18px, description in gray DM Sans 14px
- Two buttons side-by-side right-aligned: "CANCEL" (ghost) + "YES, CHANGE REPO" (danger — pink `#FF3366` background with white text)
- Modal scales in with spring (scale 0.9 → 1, opacity 0 → 1)

---

## RESPONSIVE BEHAVIOR

**Desktop (≥768px):**
- Sidebar overlays from right at 320px width
- Message max-width 75% (user) / 85% (AI)
- Landing max-width 680px

**Mobile (<768px):**
- Sidebar becomes full bottom sheet
- Input bar stacks (textarea above, button below)
- Logo font size 52px
- Message bubbles can be up to 90% width
- Header simplifies (center repo badge hidden, only icons)

---

## ILLUSTRATION / ICONOGRAPHY

- Icons: Lucide icons exclusively (modern outline style, 18px default, 14px small)
- No emoji (except repo language icons if applicable)
- GitHub Octocat: use SVG inline
- Arrow in CTA buttons: Unicode → or Lucide `ArrowRight`
- Loading spinner: thin border circle with 1 segment colored (CSS spin animation), matches button color

---

## WHAT THIS SHOULD FEEL LIKE

Imagine a developer tool designed by someone who loves brutalist graphic design magazines. It has the energy of a terminal combined with a risograph-printed zine. Every click feels physical. Colors are bold and deliberate. Nothing is soft or rounded. Text is expressive. The UI rewards careful use — hover states reveal depth, animations communicate state, nothing happens without reason.

It should feel like this was made by someone with taste, not generated by a template.

---

## SCREENS TO GENERATE

Please generate all three screens in sequence:

1. **Landing Page** — full desktop view, dark dot-grid background, giant staggered logo, URL input
2. **Ingestion Screen** — centered card with progress bar, terminal ticker, phase steps
3. **Chat Interface** — full application view, header + message list (showing a few user and AI messages including a code block) + input bar

Show hover states and active animations where possible (especially the button press-down effect and focus states).