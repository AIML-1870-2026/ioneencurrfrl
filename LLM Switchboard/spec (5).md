# LLM Switchboard — spec.md

## Project Overview

A single-file `index.html` LLM Switchboard that lets users interact with OpenAI and Anthropic language models via their APIs. Supports both unstructured (free text) and structured (JSON schema) output modes, side-by-side model comparison, response metrics, a prompt library, and a structured output validator. Serves as reference infrastructure for future AI agent projects.

---

## Aesthetic & Design Direction

**Style:** Soft glassmorphism — frosted glass panels floating over a blurred gradient mesh background. Everything feels like it's suspended in light.

**Color Palette (CSS variables):**
```css
--bg-gradient: radial-gradient(ellipse at 20% 50%, #c9d6ff, #e2e2f0, #fbc2eb);
--glass-bg: rgba(255, 255, 255, 0.18);
--glass-border: rgba(255, 255, 255, 0.45);
--glass-shadow: 0 8px 32px rgba(100, 100, 180, 0.18);
--blur: blur(18px);
--accent: #7c6ef7;
--accent-secondary: #f472b6;
--text-primary: #1e1b4b;
--text-secondary: #6b7280;
--success: #10b981;
--error: #ef4444;
--warning: #f59e0b;
```

**Typography:**
- Display/headings: `'Cormorant Garamond'` (Google Fonts) — elegant, high-contrast serif
- Body/UI: `'DM Sans'` (Google Fonts) — clean, modern, readable
- Code/JSON: `'JetBrains Mono'` (Google Fonts) — crisp monospace

**Motion:**
- Page load: staggered fade-up reveals for each glass panel (animation-delay)
- Button interactions: subtle scale + glow on hover
- Response area: smooth height expansion when content arrives
- Mode toggle: sliding pill animation
- Streaming text: typewriter effect for unstructured responses

**Background:**
- Fixed animated gradient mesh that slowly shifts hue (CSS `@keyframes` on background-position)
- Subtle noise texture overlay (SVG filter) to add depth

---

## Layout

Single-page app. No routing. Vertical scroll on smaller viewports; on desktop (≥1024px), a two-column layout for the main workspace.

### Sections (top to bottom):

1. **Header Bar** — App title "LLM Switchboard", tagline, key status indicators
2. **API Key Panel** (glass card) — Provider tabs (OpenAI / Anthropic), key entry, status badge
3. **Control Bar** (glass card) — Provider selector, model dropdown, output mode toggle (Unstructured / Structured)
4. **Prompt & Schema Area** (glass card) — Prompt textarea, schema editor (visible only in structured mode), example prompt/schema selectors, prompt library button
5. **Send Button** — Full-width, prominent, accent gradient
6. **Response Panel** (glass card, full-width) — Unstructured: rendered text with typewriter effect. Structured: split view (raw JSON left, validated fields right)
7. **Metrics Bar** — Response time, token count, response length (appears after each response)
8. **Comparison Panel** (glass card, appears when comparison mode is active) — Side-by-side responses from two different models
9. **Prompt Library Drawer** — Slides in from right; lists saved prompts with load/delete actions

---

## API Key Handling

- **Entry methods:** Manual paste (password input field) AND file upload (.env or CSV)
  - `.env` parsing: look for lines matching `OPENAI_API_KEY=...` and `ANTHROPIC_API_KEY=...`
  - CSV parsing: look for rows with provider name in column 1 and key in column 2
- **Storage:** In-memory only — keys held in a JS object, never written to `localStorage`, `sessionStorage`, or cookies
- **Privacy guarantee:** Displayed prominently as a badge: "🔒 Keys stored in memory only — never saved"
- **Key status:** Each provider shows a badge: `● Connected` (green) / `○ Not set` (gray) after key is entered
- **Clear keys:** Button to wipe all keys from memory and reset UI

---

## Provider & Model Support

### OpenAI
- Works natively from browser (CORS-permissive)
- Models (hardcoded list, with option to refresh dynamically via `/v1/models`):
  - `gpt-4o`
  - `gpt-4o-mini`
  - `gpt-4-turbo`
  - `gpt-3.5-turbo`
- Endpoint: `https://api.openai.com/v1/chat/completions`

### Anthropic
- **Does NOT work directly from browser due to CORS** — Anthropic's API does not send permissive CORS headers
- UI behavior when Anthropic is selected:
  - Show an informational banner (glass card, amber tint): "ℹ️ Anthropic's API is designed for server-side use. Browsers cannot call it directly due to CORS restrictions — this is a security feature, not a bug. In a production app, you'd route requests through your own backend."
  - Disable the Send button for Anthropic
  - Still allow the user to explore the UI, enter keys, and configure prompts
- Models listed (for educational display):
  - `claude-opus-4-5`
  - `claude-sonnet-4-5`
  - `claude-haiku-4-5`

---

## Output Modes

### Unstructured Mode
- Simple `messages` array with user prompt
- System prompt (optional): text area pre-filled with "You are a helpful assistant."
- Response rendered as streaming text with typewriter animation
- Display in a styled `<pre>`-like block with soft background

### Structured Mode
- UI adds a **JSON Schema editor** below the prompt (syntax-highlighted `<textarea>` with `JetBrains Mono`)
- System prompt is auto-set to: "Respond ONLY with valid JSON that matches the provided schema. No explanation, no markdown, no code fences."
- The schema is appended to the user message: `\n\nRespond using this JSON schema:\n${schema}`
- Response display:
  - **Left panel:** Raw JSON response (syntax-highlighted)
  - **Right panel:** Structured Output Validator (see below)

---

## Example Prompts & Schema Templates

### Example Prompts (dropdown selector)
Pre-loaded, selectable from a dropdown labeled "Load example prompt":

1. **Drug Interaction Check** — "What are the known interactions between metformin and ibuprofen? Explain the mechanism and clinical significance."
2. **Compound Profile** — "Describe the chemical properties of aspirin (acetylsalicylic acid)."
3. **Symptom Triage** — "A patient presents with chest tightness, shortness of breath, and mild fever. What are the top differential diagnoses?"
4. **Study Guide** — "Explain how Gibbs free energy relates to whether a reaction is spontaneous."
5. **Creative Story** — "Write a two-paragraph sci-fi story where a biochemist discovers a compound that reverses entropy."
6. **Custom** — user types freely

### Schema Templates (dropdown selector, visible in Structured mode)
Pre-loaded JSON schemas selectable from a dropdown:

1. **Element Profile**
```json
{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "symbol": { "type": "string" },
    "atomic_number": { "type": "integer" },
    "fun_fact": { "type": "string" }
  },
  "required": ["name", "symbol", "atomic_number", "fun_fact"]
}
```

2. **Drug Interaction**
```json
{
  "type": "object",
  "properties": {
    "drug_a": { "type": "string" },
    "drug_b": { "type": "string" },
    "severity": { "type": "string", "enum": ["mild", "moderate", "severe"] },
    "mechanism": { "type": "string" },
    "recommendation": { "type": "string" }
  },
  "required": ["drug_a", "drug_b", "severity", "mechanism", "recommendation"]
}
```

3. **Symptom Triage**
```json
{
  "type": "object",
  "properties": {
    "top_diagnoses": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "diagnosis": { "type": "string" },
          "likelihood": { "type": "string" },
          "reasoning": { "type": "string" }
        }
      }
    },
    "urgency_level": { "type": "string", "enum": ["routine", "urgent", "emergent"] },
    "recommended_tests": { "type": "array", "items": { "type": "string" } }
  },
  "required": ["top_diagnoses", "urgency_level", "recommended_tests"]
}
```

4. **Custom** — blank schema, user writes their own

---

## Structured Output Validator (Stretch Challenge)

After receiving a JSON response in structured mode:

1. **Parse** the response: attempt `JSON.parse()`. If it fails, show a red "Invalid JSON" error with the parse error message.
2. **Validate against schema**: walk the schema's `required` array and `properties`:
   - ✅ **Present & correct type** — green checkmark, field name, value preview
   - ⚠️ **Present but wrong type** — yellow warning, field name, expected vs actual type
   - ❌ **Missing required field** — red X, field name, "missing"
3. **Summary badge**: "X/Y fields matched" in green/yellow/red depending on compliance rate
4. Display as a clean table inside the right panel of the structured response view

---

## Response Metrics (Stretch Challenge)

After every successful response, display a metrics bar below the response panel:

| Metric | Source |
|---|---|
| ⏱ Response time | `Date.now()` diff from send to first token |
| 🔢 Token count | `usage.total_tokens` from API response (if available) |
| 📏 Response length | `response.length` in characters |
| 💰 Est. cost | Rough calculation based on model pricing (hardcoded rates) |

Display as a frosted pill row of stat chips with icons.

---

## Side-by-Side Comparison (Stretch Challenge)

A toggle button "Compare Models" appears in the Control Bar.

When active:
- A second model selector appears (Model B)
- On Send, both models are called simultaneously via `Promise.all()`
- Responses render side-by-side in a two-column glass panel
- Each column shows: model name badge, response text, individual metrics
- Works in both unstructured and structured modes
- If both models return JSON in structured mode, the validator runs on both

---

## Prompt Library (Stretch Challenge)

An in-memory array of saved prompts (lost on page refresh — no persistence).

**Save:** A "💾 Save to Library" button appears after a prompt is typed. Clicking saves `{ id, prompt, schema (if any), mode, timestamp }` to the array.

**Library drawer:** A "📚 Prompt Library" button in the header opens a right-side drawer panel:
- Lists all saved prompts with truncated preview
- Each item has: **Load** (populates prompt + schema fields) and **Delete** buttons
- Empty state: "No saved prompts yet. Type a prompt and click Save."
- Drawer slides in with CSS `transform: translateX()` transition

---

## Error States

| Error | Display |
|---|---|
| No API key | Inline warning under provider selector: "Enter your API key to continue" |
| Invalid API key (401) | Red banner: "Invalid API key. Check your key and try again." |
| Rate limit (429) | Amber banner: "Rate limit reached. Wait a moment and try again." |
| Network error | Red banner: "Network error. Check your connection." |
| Anthropic CORS | Amber informational banner (see Provider section) |
| Invalid JSON response | Red inline error in validator panel |
| Timeout (>30s) | Amber banner: "Request timed out. The model may be overloaded." |

All errors auto-dismiss after 8 seconds or on next request.

---

## Technical Implementation Notes

- **Single file:** Everything in one `index.html` — HTML, CSS (in `<style>`), JS (in `<script>`)
- **No build tools, no npm, no frameworks** — vanilla HTML/CSS/JS only
- **Google Fonts:** Load `Cormorant+Garamond:ital,wght@0,400;0,600;1,400`, `DM+Sans:wght@400;500;600`, and `JetBrains+Mono` via `<link>`
- **API calls:** `fetch()` with `async/await`; wrap in try/catch for all error handling
- **Streaming** (OpenAI): Use `stream: true` with `ReadableStream` / `TextDecoder` for typewriter effect in unstructured mode
- **No streaming** in structured mode (need complete JSON before parsing)
- **Schema editor:** A `<textarea>` styled with JetBrains Mono; basic tab-to-indent behavior via keydown listener
- **File upload:** `<input type="file" accept=".env,.csv,.txt">` with `FileReader` API
- **Comparison:** `Promise.allSettled()` to handle one model failing without breaking the other

---

## File Structure

```
index.html   ← entire app, single file
```

Deploy to GitHub Pages from the repo root or `/docs` folder.

---

## Submission

Live GitHub Pages URL submitted to Canvas.
