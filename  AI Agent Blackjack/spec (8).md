# Blackjack AI Agent — spec.md

## Project overview

A single static webpage (`index.html`) implementing a Blackjack game powered by an LLM AI agent. The agent reads the current game state, calls the Anthropic API for a structured recommendation, and executes the action. No backend, no server — everything runs in the browser.

---

## File structure

```
project-root/
├── index.html        ← entire app (HTML + CSS + JS in one file)
├── temp/             ← reference implementation (DO NOT deploy)
│   └── index.html
└── spec.md
```

---

## Core requirements

### 1. API key loading
- Display a file input that accepts a `.env` file
- Parse the file in-memory using `FileReader`
- Extract `ANTHROPIC_API_KEY=...` via regex
- Store key in a JS variable only — never log it, never send it anywhere except the Anthropic API
- Show a status indicator: "No key loaded" → "API key loaded ✓"

### 2. Blackjack game logic
- Build and shuffle a standard 52-card deck on each new hand
- Deal 2 cards to player, 2 to dealer (one dealer card hidden)
- Scoring rules:
  - Number cards = face value
  - J, Q, K = 10
  - Ace = 11, reduced to 1 if hand would bust
- Dealer must hit on soft 16 or less, stand on 17+
- Detect blackjack (21 on initial 2-card deal)
- Detect bust (score > 21)

### 3. AI recommendation (critical)
- After each deal or hit, call the Anthropic API with this prompt structure:

```
You are a Blackjack strategy expert. The player has: {cards} (score: {score}).
The dealer shows: {dealerUpCard}. Risk profile: {riskMode}.
Respond ONLY with a JSON object, no markdown, no explanation outside JSON.
Format: {"action":"hit","reasoning":"brief explanation under 60 words"}
Action must be exactly one of: hit, stand, double.
```

- API call uses `claude-sonnet-4-20250514`, `max_tokens: 200`
- Parse the JSON response to extract `action` and `reasoning`
- Fallback: if JSON parse fails, use regex to find `{...}` block and retry parse
- **Do not use keyword search on the full response text** — always extract from the structured JSON `action` field

### 4. Console logging (required for grading)
Log the following at each step:
```javascript
console.log('[BJ Agent] Sending to Claude:', { playerCards, playerScore, dealerUp, riskMode });
console.log('[BJ Agent] Raw response:', data);
console.log('[BJ Agent] Parsed action:', parsed.action, '| Reasoning:', parsed.reasoning);
console.log('[BJ Agent] Executing recommendation:', lastRec);
```

### 5. UI controls
- **Deal hand** button — starts a new hand, deducts bet from balance
- **Execute recommendation** button — fires the AI's suggested action; disabled until AI responds
- **Hit** button — manual hit
- **Stand** button — manual stand
- Disable all action buttons at appropriate game phases (idle, playing, ended)

### 6. Balance tracking
- Starting balance: $1,000
- Configurable bet amount via slider ($10–$200, step $10)
- Bet deducted on deal; winnings added on win
- Blackjack pays 1.5x bet
- Push returns bet
- Balance persists across hands within the session

---

## Stretch enhancements

### Enhancement 1 — Performance analytics panel
Display four metric cards that update after every hand:
- **Win rate** — wins / total hands as a percentage
- **Hands played** — total hands this session
- **Net P&L** — cumulative winnings minus losses this session
- **Avg per hand** — net P&L / hands played

### Enhancement 2 — Risk tolerance slider
- Slider with 3 stops: Conservative | Balanced | Aggressive
- Value passed as `riskMode` in every LLM prompt
- Conservative → LLM biases toward standing; Aggressive → LLM biases toward hitting/doubling
- Label updates live as slider moves

### Enhancement 3 — Basic strategy reference matrix
- Collapsible section on the page
- Grid showing player score (8–17) vs dealer up card (2–A)
- Cells color-coded: H (hit, green), S (stand, blue), D (double, amber)
- Helps player compare AI recommendation against standard optimal play

---

## API call structure

```javascript
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true'
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 200,
    messages: [{ role: 'user', content: prompt }]
  })
});
const data = await response.json();
```

---

## JSON parsing logic

```javascript
const text = data.content[0].text.trim();
let parsed;
try {
  parsed = JSON.parse(text);
} catch (e) {
  const match = text.match(/\{[\s\S]*\}/);
  if (match) parsed = JSON.parse(match[0]);
  else throw new Error('Could not extract JSON from response');
}
const action = parsed.action.toLowerCase(); // "hit", "stand", or "double"
const reasoning = parsed.reasoning;
```

---

## .env file format expected

```
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx
```

---

## Reference implementation

The `temp/` folder contains a working static page that demonstrates:
- `.env` file parsing (in-memory via FileReader)
- `fetch()` call structure to the Anthropic API
- Error handling for failed or malformed API responses

Use it as a pattern reference. Do NOT include `temp/` in the final build.

---

## Out of scope

- No backend / server-side code
- No localStorage or sessionStorage (keys must not persist)
- No external CSS frameworks
- No build tools / bundlers — pure vanilla HTML/CSS/JS
