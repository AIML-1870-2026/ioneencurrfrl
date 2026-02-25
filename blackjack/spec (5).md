# Blackjack Game — Design Specification

## Visual Design

### Color Palette
- **Background:** Deep charcoal / near-black (`#0d0d1a`, `#13131f`) — dark enough to make pastels pop
- **Table surface:** Deep twilight purple (`#1a1028`) — evokes a magical night sky
- **Accent / highlight:** Soft lavender (`#c084fc`) as primary accent; sky blue (`#7dd3fc`) and rose pink (`#f9a8d4`) as secondary accents
- **Text (primary):** Off-white (`#f5f0ff`) with a faint lavender tint
- **Text (secondary):** Muted lavender-gray (`#9d8faa`)
- **Button hover states:** Glowing lavender or pink halo (box-shadow)
- **Danger / loss color:** Soft rose / magenta (`#e879a0`)
- **Success / win color:** Mint green (`#6ee7b7`) or bright lavender

### Typography
- **Headings / score displays:** `'Cinzel'` or `'Raleway'` from Google Fonts — elegant and slightly magical
- **Body / buttons:** Clean sans-serif (`'Inter'` or system-ui)
- Suit symbols use custom pony-inspired icons (see below) rather than standard Unicode suits

### Card Style — Pony-Inspired (Original Design, No IP)
- Cards have a dark (`#1e1535`) face with pastel-colored suit symbols and rank text
- **Four custom suits** (no existing IP — purely original):
  - ★ **Stars** (lavender) — replaces spades
  - ♥ **Hearts** (rose pink) — kept as-is
  - ✦ **Gems / Crystals** (sky blue) — replaces diamonds
  - ⁂ **Horseshoes** (mint green) — replaces clubs
- Card backs feature a sparkle / starfield pattern in deep purple with scattered pastel stars — rendered as inline SVG or CSS pattern
- Cards rendered with a soft glowing border in their suit color
- Slight drop shadow for depth

### Overall Aesthetic
- "Enchanted casino" — dark and sophisticated but with a whimsical, magical spark
- Pastel glows and starfield textures against deep dark backgrounds
- Playful but not childish — think premium magical night sky
- No MLP characters, logos, or trademarked imagery anywhere
- Subtle sparkle/shimmer CSS animation on win states

---

## Layout

### Desktop Layout (≥ 768px)
```
┌──────────────────────────────────────────┐
│  BLACKJACK             Balance: $1,000   │  ← Header bar
├──────────────────────────────────────────┤
│         DEALER  (score: ?)               │
│         [ card ] [ card-back ]           │  ← Dealer area
├──────────────────────────────────────────┤
│                                          │
│         PLAYER  (score: 14)              │
│         [ card ] [ card ]                │  ← Player area
│                                          │
├──────────────────────────────────────────┤
│  Bet: $50   [ -10 ] [ -5 ] [ +5 ] [+10] │  ← Bet controls
│             [ Deal ]                     │
├──────────────────────────────────────────┤
│  [ Hit ]  [ Stand ]  [ Double ]          │  ← Action buttons
│  [ Split ]  [ Insurance ]                │
└──────────────────────────────────────────┘
```

### Mobile Layout (< 768px)
- Single-column, stacked vertically
- Cards scale down; smaller font sizes
- Bet adjustment buttons stay full-width row
- Action buttons in a 2×2 or 2×3 grid

---

## Game States

The game has three distinct states that control which UI elements are visible and interactive:

### 1. BETTING State
- Bet adjustment buttons (`-50`, `-10`, `-5`, `+5`, `+10`, `+50`) are enabled
- Current bet amount is clearly displayed (large, gold text)
- **Deal** button is enabled (only if bet > 0 and balance ≥ bet)
- Action buttons (Hit, Stand, Double, Split, Insurance) are **hidden or disabled**
- Player balance displayed prominently

### 2. PLAYING State
- Bet adjustment buttons are **disabled** (bet locked in)
- Current bet remains displayed
- Deal button is **hidden or disabled**
- Action buttons shown based on legality:
  - **Hit** — always available while < 21
  - **Stand** — always available
  - **Double Down** — only on first two cards AND player has sufficient balance
  - **Split** — only when first two cards have equal value AND player has sufficient balance
  - **Insurance** — only when dealer's up-card is an Ace, offered once at start of round; disappears after player decides
- Dealer's hole card shown face-down

### 3. ROUND COMPLETE State
- All action buttons **disabled**
- Dealer's hole card revealed; dealer plays out hand
- Outcome message displayed clearly:
  - "Blackjack! You win $75" (gold/green)
  - "You win $50" (gold)
  - "Push — Bet returned" (neutral)
  - "Bust! You lose $50" (red)
  - "Dealer wins. You lose $50" (red)
- **New Round** / **Deal Again** button appears prominently
- If balance = $0, offer a "Rebuy" option to reset to $1,000

---

## Blackjack Rules

### Deck
- Standard single 52-card deck
- Shuffled at the start of each round (or when deck is exhausted)
- Fisher-Yates shuffle algorithm for fairness

### Card Values
- Number cards (2–10): face value
- Face cards (J, Q, K): 10
- Ace: 11, reduced to 1 if hand would bust

### Deal
- Player receives 2 cards face-up
- Dealer receives 1 card face-up, 1 card face-down (hole card)

### Player Actions
- **Hit:** Draw one card; if total > 21, player busts (loses bet)
- **Stand:** End turn; dealer plays out
- **Double Down:** Double the bet, receive exactly one more card, then stand
- **Split:** When two cards have equal value, split into two separate hands; each hand gets one additional card dealt; player plays each hand in sequence; original bet applies to each hand; re-splitting is **not** supported in this implementation
- **Insurance:** Offered when dealer shows an Ace; costs half the original bet; pays 2:1 if dealer has blackjack; if dealer does not have blackjack, insurance bet is lost and round continues normally

### Dealer Rules
- Dealer must hit on soft 16 and below
- Dealer must stand on soft 17 and above
- Hole card is revealed after player stands (or busts)

### Payouts
| Outcome | Payout |
|---|---|
| Player blackjack (no dealer blackjack) | 1.5× bet (pays 3:2) |
| Player wins normally | 1× bet |
| Push (tie) | Bet returned |
| Player loses | Bet forfeited |
| Insurance win | 2:1 on insurance bet |
| Insurance loss | Insurance bet forfeited |

### Natural Blackjack Edge Cases
- **Player blackjack, dealer no blackjack:** Player wins 1.5× immediately
- **Both have blackjack:** Push — bet returned
- **Dealer blackjack, player no blackjack:** Player loses bet (insurance pays if taken)
- A blackjack is **only** an Ace + 10-value card on the initial two-card deal; a 21 reached by hitting is not a blackjack

---

## Animations & Transitions

- **Card deal:** Cards slide in from a central "deck" position to their slots (CSS translate + opacity transition, ~300ms each, staggered 150ms between cards)
- **Card flip:** Dealer hole card flips from back to front when revealed (CSS 3D rotateY, ~400ms)
- **Bust / win:** Brief shake animation on player area for bust; brief glow/pulse on win
- **Button interactions:** Subtle scale-down on press (transform: scale(0.96))
- All animations respect `prefers-reduced-motion` media query — disable animations if user has set this preference

---

## Testing Scenarios

The following must be verified manually after building:

### Required (from assignment)
1. **Player blackjack, dealer no blackjack** — payout must be exactly 1.5× bet (e.g. bet $100 → win $150, balance increases by $150)
2. **Both player and dealer blackjack** — result is a push; bet returned, balance unchanged

### Additional Correctness Tests
3. **Player bust** — hitting to >21 immediately ends round as a loss
4. **Dealer bust** — dealer hitting to >21 means player wins (if not already bust)
5. **Push at 21 (non-blackjack)** — e.g. player hits to 21 over multiple cards, dealer also reaches 21; result is push
6. **Soft ace handling** — Ace counts as 11 unless it would bust the hand, then counts as 1; verify with hand like [A, 6, 8] → should total 15, not bust
7. **Double down** — bet doubles, exactly one card dealt, player cannot hit again
8. **Split** — two equal cards split into two playable hands; each uses original bet amount
9. **Insurance — dealer has blackjack** — insurance pays 2:1, main bet lost
10. **Insurance — dealer no blackjack** — insurance bet lost, round continues normally
11. **Balance enforcement** — player cannot bet more than current balance; double/split disabled if insufficient funds
12. **Deck completeness** — all 52 cards present; no duplicates (can verify by logging deck contents before shuffle)

---

## Implementation Notes for Claude Code

- Deliver as a **single self-contained HTML file** (HTML + CSS + JS inline)
- Cards are rendered entirely via HTML/CSS/SVG — no external card image assets needed; each card is a styled `div` with rank text and custom suit symbol (★ ♥ ✦ ⁂) colored per suit; card back is a CSS sparkle/starfield pattern
- Suit color map: Stars → lavender `#c084fc`, Hearts → rose `#f9a8d4`, Gems → sky blue `#7dd3fc`, Horseshoes → mint `#6ee7b7`
- No external frameworks required; vanilla JS is fine
- Use CSS custom properties (variables) for the color palette to make theming easy
- Store game state in a plain JS object (no localStorage required)
- Ensure all button enabled/disabled states are enforced in JS (not just visually hidden)
- Code should be readable and commented for each major section (deal, evaluate hand, payout, etc.)
