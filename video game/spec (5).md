# Meal Plan Zero — Game Specification

## Overview

A top-down stealth game set in a college dining hall. Your meal plan ran out. You're hungry. The dining hall is open. Navigate the space, grab food off the counters, and reach the exit before cafeteria workers catch you. The more you steal, the higher your score. Get spotted and it's game over.

**Platform:** HTML5 Canvas, pure client-side JavaScript — no server required, deploys directly to GitHub Pages.
**Canvas size:** 800 × 600 px

---

## Team Structure

This game is built by 4–5 members. Each member owns one module and works on it independently using Claude. Modules communicate through a single shared global object (`window.GameState`). All modules must be built and tested in isolation first, then integrated into `index.html`.

| # | Module | File |
|---|--------|------|
| 1 | Core Engine & Game Loop | `js/engine.js` + `js/state.js` |
| 2 | Map & Dining Hall | `js/map.js` |
| 3 | Player Character | `js/player.js` |
| 4 | Worker AI & Detection | `js/workers.js` |
| 5 | UI, HUD & Screens | `js/ui.js` |

> **Prompt for Claude:** When starting your module, paste this entire spec into Claude and say: "I am building Module [N]: [name]. Build only this module. Use the GameState interface and the exposed window.[Module] API exactly as described in the spec."

---

## File Structure

```
meal-plan-zero/
├── index.html          ← entry point, loads all scripts in order
├── style.css           ← base page styles (black background, centered canvas)
├── js/
│   ├── state.js        ← shared game state (Module 1 writes, all modules read/write)
│   ├── engine.js       ← game loop, input handling, phase control (Module 1)
│   ├── map.js          ← dining hall layout, food placement, rendering (Module 2)
│   ├── player.js       ← player movement, collision, food pickup (Module 3)
│   ├── workers.js      ← worker AI, patrol routes, detection logic (Module 4)
│   └── ui.js           ← HUD, start/gameover/win screens, sound (Module 5)
└── assets/
    └── sounds/         ← optional WAV/MP3 files for sound effects
```

**Script load order in index.html:**
```html
<script src="js/state.js"></script>
<script src="js/map.js"></script>
<script src="js/player.js"></script>
<script src="js/workers.js"></script>
<script src="js/ui.js"></script>
<script src="js/engine.js"></script>
```

---

## Shared Game State (`js/state.js`)

**Owner: Module 1.** All other modules read from and write to `window.GameState`.

```javascript
window.GameState = {
  phase: 'start', // 'start' | 'playing' | 'gameover' | 'win'
  score: 0,
  round: 1,
  canvas: null,
  ctx: null,
  width: 800,
  height: 600,
  player: {
    x: 388, y: 500,
    width: 20, height: 20,
    speed: 3,
    crouching: false,
    inventory: [],
  },
  detection: 0,
  walls: [],
  foods: [],
  exitZone: { x: 340, y: 20, w: 120, h: 30 },
  workers: [],
  keys: {},
};
```

---

## Module 1 — Core Engine & Game Loop

**Files:** `js/state.js`, `js/engine.js`, `index.html`

### Responsibilities
- Define `window.GameState`
- Create and size the canvas (800 × 600), append to `#game-container`
- Set up `keydown` / `keyup` listeners that write to `GameState.keys`
- Run the main game loop via `requestAnimationFrame`
- Manage phase transitions

### Game Loop Order (each frame)
```
1. Map.draw(ctx)
2. Player.update()
3. Player.draw(ctx)
4. Workers.update()
5. Workers.draw(ctx)
6. UI.draw(ctx)
```

### Exposed API
```javascript
window.Engine = {
  init(),
  reset(),
};
```

---

## Module 2 — Map & Dining Hall

**File:** `js/map.js`

### Wall Rects

| Label | x | y | w | h |
|-------|---|---|---|---|
| Top wall | 0 | 0 | 800 | 20 |
| Bottom wall | 0 | 580 | 800 | 20 |
| Left wall | 0 | 0 | 20 | 600 |
| Right wall | 780 | 0 | 20 | 600 |
| Counter A | 80 | 60 | 640 | 40 |
| Counter B | 80 | 280 | 640 | 40 |
| Table 1 | 100 | 160 | 120 | 60 |
| Table 2 | 340 | 160 | 120 | 60 |
| Table 3 | 580 | 160 | 120 | 60 |
| Table 4 | 100 | 380 | 120 | 60 |
| Table 5 | 340 | 380 | 120 | 60 |
| Table 6 | 580 | 380 | 120 | 60 |

### Food Items

| id | x | y | label | points |
|----|---|---|-------|--------|
| 0 | 100 | 95 | Pizza | 50 |
| 1 | 180 | 95 | Pasta | 45 |
| 2 | 260 | 95 | Soup | 35 |
| 3 | 340 | 95 | Sandwich | 30 |
| 4 | 420 | 95 | Muffin | 25 |
| 5 | 500 | 95 | Coffee | 20 |
| 6 | 580 | 95 | Apple | 10 |
| 7 | 660 | 95 | Cookies | 15 |
| 8 | 140 | 315 | Pizza | 50 |
| 9 | 300 | 315 | Pasta | 45 |
| 10 | 460 | 315 | Sandwich | 30 |
| 11 | 620 | 315 | Coffee | 20 |

### Exposed API
```javascript
window.Map = { init(), draw(ctx), reset() };
```

---

## Module 3 — Player Character

**File:** `js/player.js`

### Controls

| Key | Action |
|-----|--------|
| W / ArrowUp | Move up |
| A / ArrowLeft | Move left |
| S / ArrowDown | Move down |
| D / ArrowRight | Move right |
| Shift | Crouch (hold) |
| E | Grab nearby food |

### Movement & Collision
- Normal speed: `GameState.player.speed` (3 px/frame)
- Crouch speed: `GameState.player.speed * 0.5`
- AABB collision: move X and Y separately, revert on collision

### Food Pickup
- On E keypress: find nearest non-grabbed food within 40px of player center
- Set `food.grabbed = true`, push to inventory, add points to score

### Win Condition
- Player hitbox overlaps `exitZone` AND `inventory.length > 0` → `phase = 'win'`

### Exposed API
```javascript
window.Player = {
  init(), update(), draw(ctx), reset(),
  getHitbox(),        // { x, y, w, h }
  detectionRadius(),  // 60 normally, 35 when crouching
};
```

---

## Module 4 — Worker AI & Detection

**File:** `js/workers.js`

### Three Workers & Patrol Routes

| Worker | Patrol Path | Notes |
|--------|-------------|-------|
| Worker A | (200, 150) ↔ (600, 150) | Patrols Counter A (top) |
| Worker B | (150, 350) ↔ (650, 350) | Patrols between counters |
| Worker C | (400, 420) ↔ (400, 560) | Guards player start zone |

### Detection Logic
- Vision cone check each frame
- Detected (normal): `detection += 3`
- Detected (crouching): `detection += 1.5`
- Not detected: `detection -= 0.5`
- Clamp 0–100; at 100 → `phase = 'gameover'`

### State Transitions
- `detection < 40`: patrol
- `detection >= 40`: nearest worker → alert
- `detection >= 80`: nearest worker → chase
- `detection >= 100`: game over

### Exposed API
```javascript
window.Workers = { init(), update(), draw(ctx), reset(round) };
```

---

## Module 5 — UI, HUD & Screens

**File:** `js/ui.js`

### HUD Elements

| Element | Position | Details |
|---------|----------|---------|
| Detection meter | Top-right x=580 y=12 w=200 h=18 | Green→orange→red |
| Score | Top-left x=20 y=24 | White 16px |
| Inventory | Top-center x=340 y=24 | White 14px |
| Round | Top-left x=20 y=44 | Gray 12px |

### Screens
- **Start:** dark overlay, title, instructions, START GAME button
- **Game Over:** CAUGHT. message, score, TRY AGAIN button
- **Win:** ESCAPED. message, round complete, score, NEXT ROUND button

### Exposed API
```javascript
window.UI = { init(), draw(ctx) };
```

---

## Difficulty Scaling (Round 2+)

| Round | Worker speed | Vision range |
|-------|-------------|--------------|
| 1 | 1.2 | 150px |
| 2 | 1.5 | 170px |
| 3 | 1.8 | 190px |
| 4+ | 2.0 | 210px |

---

## Integration Checklist

- [ ] Scripts load in correct order (`state.js` first, `engine.js` last)
- [ ] Player collides with all walls
- [ ] Food grabbable and disappears when grabbed
- [ ] Detection meter rises in vision cone, drains out of sight
- [ ] Game over at detection 100
- [ ] Win triggers when player exits with food
- [ ] Crouching reduces speed and detection gain
- [ ] Round counter increments; workers get harder
- [ ] No console errors in browser DevTools

---

## Deployment

1. Push all files to class GitHub org repo
2. Enable GitHub Pages (Settings → Pages → branch: main)
3. Game runs at: `https://aiml-1870-2026.github.io/mynamejohn/meal-plan-zero/`

**No server required — 100% static, 100% client-side.**
