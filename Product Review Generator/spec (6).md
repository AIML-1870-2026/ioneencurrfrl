# Product Review Generator — spec.md

## Project Overview

Build a single-page web application (`index.html`) that allows a user to generate a product review
using OpenAI's chat completions API. The user provides product details, configures review style and
per-aspect sentiment, selects an OpenAI model, and receives a formatted AI-generated review rendered
as HTML. This app is for educational and demonstration purposes only.

---

## Reference Implementation

The `temp/` folder contains my complete LLM Switchboard project (HTML, CSS, and JS files).
This is **NOT** part of the current project — do not include it in the final build or deployment.

Use it as a reference for:
- How to parse a `.env` file for API keys (in-memory only, never persisted)
- The `fetch()` call structure for OpenAI's chat completions API
- Error handling patterns for failed API requests
- How the code is organized across separate files
- The general approach to building a single-page LLM tool

Ignore these Switchboard features (not needed here):
- Anthropic integration (this project is OpenAI-only)
- The model selection dropdown / provider switching logic from the Switchboard
- Structured output mode and JSON schema handling

This project uses unstructured (free-form) responses only.
Render the model's markdown output as formatted HTML.

---

## Key Design Constraints

Every one of these must be reflected in the final implementation:

- **OpenAI models only** — no Anthropic integration, no provider switching. The Switchboard taught
  us that Anthropic's API blocks direct browser requests (CORS). OpenAI allows browser-to-API calls
  without a backend server. This is a deliberate architectural choice, not a limitation.
- **Unstructured responses** — the model returns free-form markdown text, not JSON. No JSON schema
  or structured output mode needed.
- **Markdown rendering** — the model's response will contain markdown formatting (bold, lists,
  headings, etc.). The app must render this as properly formatted HTML, not raw text. Use
  [marked.js](https://cdn.jsdelivr.net/npm/marked/marked.min.js) loaded from CDN.
- **API key loaded from `.env`** — same in-memory-only pattern as the Switchboard. The user pastes
  their key at runtime; it is never stored, never written to localStorage, never sent anywhere
  except the OpenAI API.
- **Single-file deployment** — the entire app lives in one `index.html` file (HTML + CSS in
  `<style>` + JS in `<script>`), ready to deploy on GitHub Pages with no build step.
- **No backend / no Node.js runtime** — all API calls happen directly from the browser via
  `fetch()`. Despite the quest description mentioning Node.js, the actual architecture is
  client-side only, consistent with the Switchboard pattern.

---

## Model Selection

Provide two dropdowns that work together:

**Dropdown 1 — Model Family:**
- GPT-4o
- GPT-4.1

**Dropdown 2 — Specific Model** (dynamically updates when family changes):

| Family | Available Models |
|--------|-----------------|
| GPT-4o | gpt-4o, gpt-4o-mini |
| GPT-4.1 | gpt-4.1, gpt-4.1-mini, gpt-4.1-nano |

When the user changes the family dropdown, the model dropdown must immediately repopulate with the
correct models for that family. Default to GPT-4o / gpt-4o on load.

---

## User Inputs

### Section 1 — Product Details

| Field | Type | Required? | Notes |
|-------|------|-----------|-------|
| Product Name | Text input | Required | e.g., "Sony WH-1000XM5" |
| Product Description | Textarea | Required | What it is, who it's for, key features |
| Pros | Textarea | Optional | Things the user liked |
| Cons | Textarea | Optional | Things the user didn't like |
| Use Case | Text input | Optional | e.g., "daily commuting", "home office setup" |

### Section 2 — Review Style (Stretch Challenge: Rich UI Components)

Use **sliders**, not dropdowns, for both of these controls:

- **Tone slider** — continuous range with labeled endpoints: "Casual" ←→ "Formal"
  - Show the current position label dynamically (e.g., "Casual", "Balanced", "Formal")
- **Length slider** — continuous range with labeled endpoints: "Short" ←→ "Long"
  - Show the current position label dynamically (e.g., "Short", "Medium", "Long")

### Section 3 — Sentiment by Aspect (Stretch Challenge: Multiple Sentiment Layers)

Instead of a single overall sentiment control, provide **three individual sliders**, one per aspect:

| Aspect | Slider Range | Labels |
|--------|-------------|--------|
| Price / Value | 1–5 | 1 = Very Negative, 3 = Mixed, 5 = Very Positive |
| Features | 1–5 | 1 = Very Negative, 3 = Mixed, 5 = Very Positive |
| Usability / Experience | 1–5 | 1 = Very Negative, 3 = Mixed, 5 = Very Positive |

Each slider must display its current value as a descriptive label next to it as the user drags
(e.g., "Positive", "Mixed", "Very Negative"). Do not show raw numbers — map to labels:
1 = "Very Negative", 2 = "Negative", 3 = "Mixed", 4 = "Positive", 5 = "Very Positive".

---

## Prompt Construction

Build the system prompt and user message dynamically from all input values.

**System prompt template:**
```
You are a product review writer. Write a realistic, detailed product review based on the
information provided by the user.

Tone: [Casual | Balanced | Formal — based on tone slider position]
Length: [Short (1–2 paragraphs) | Medium (3–4 paragraphs) | Long (5+ paragraphs)]

Reflect the following sentiment for each aspect of the product:
- Price / Value: [Very Negative | Negative | Mixed | Positive | Very Positive]
- Features: [Very Negative | Negative | Mixed | Positive | Very Positive]
- Usability / Experience: [Very Negative | Negative | Mixed | Positive | Very Positive]

Format your response in markdown with clear sections and headings. Do not mention that this
review was AI-generated.
```

**User message template:**
```
Product: [product name]
Description: [description]
Pros: [pros, or "Not provided" if empty]
Cons: [cons, or "Not provided" if empty]
Use Case: [use case, or "Not provided" if empty]
```

Map slider values to labels before inserting into the prompt:
- Tone slider: map position to "Casual", "Balanced", or "Formal"
- Length slider: map position to "Short", "Medium", or "Long"
- Sentiment sliders: 1→"Very Negative", 2→"Negative", 3→"Mixed", 4→"Positive", 5→"Very Positive"

---

## Output Panel

- Render the model's markdown response as formatted HTML using marked.js — never display raw
  markdown text
- Show a loading spinner or animated loading message while the API call is in progress; disable
  the Generate button during this time
- Display a clear, user-friendly error message if the API call fails (invalid key, rate limit,
  network error, etc.)
- Include a **"Copy Review"** button that copies the plain text content of the review to the
  clipboard (not the HTML markup)
- The output panel should appear below the Generate button and be clearly separated from the
  input form

---

## API Key Loading

Use the exact same `.env` in-memory loading pattern from the Switchboard:
- A text input or file loader at the top of the page where the user provides their OpenAI API key
- The key is held in a JavaScript variable only — never written to localStorage, sessionStorage,
  or any external store
- Include a brief note in the UI that the key is not stored anywhere

---

## Visual Design

Match the visual style of the LLM Switchboard found in `temp/` — same color palette, typography,
card/panel layouts, spacing, and overall aesthetic. The Product Review Generator should feel like
it belongs to the same family of tools.

Suggested layout order (top to bottom):
1. Header — app title "Product Review Generator" + short subtitle
2. API Key section — key input with in-memory-only note
3. Model selection — Family dropdown + Model dropdown side by side
4. Product Details section — name, description, pros, cons, use case
5. Review Style section — tone slider + length slider
6. Sentiment section — three aspect sliders with live labels
7. Generate Review button — prominent, full-width or large
8. Output panel — rendered HTML review + Copy button

Group related inputs under clear section headings. Keep the layout clean and readable.

---

## File Structure

```
index.html       ← entire app (HTML + <style> CSS + <script> JS, all inline)
.env             ← API key file (NOT committed to Git; loaded in-memory at runtime)
temp/            ← Switchboard reference code only; excluded from build and deployment
README.md        ← optional
```

---

## What NOT to Build

- No Anthropic API calls or provider switching
- No JSON schema / structured output mode
- No localStorage, sessionStorage, cookies, or any persistent storage of any kind
- No backend server or Node.js runtime required to run the app
- No multi-page routing or separate HTML files
- Do not copy, import, or deploy anything from the `temp/` folder — it is reference only
