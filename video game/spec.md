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

**Script load order in `index.html`:**
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

**Owner: Module 1.** All other modules read from and write to `window.GameState`. Do not store authoritative state in module-local variables — use GameState.

```javascript
window.GameState = {
  // Game phase
  phase: 'start', // 'start' | 'playing' | 'gameover' | 'win'
  score: 0,
  round: 1,

  // Canvas (set by engine.js on init)
  canvas: null,
  ctx: null,
  width: 800,
  height: 600,

  // Player
  player: {
    x: 388,        // starting x (pixels, top-left of hitbox)
    y: 500,        // starting y
    width: 20,
    height: 20,
    speed: 3,      // pixels per frame at 60fps
    crouching: false,
    inventory: [], // array of food item objects grabbed this round
  },

  // Detection meter (0–100)
  detection: 0,

  // Map data (populated by Map.init())
  walls: [],    // [{ x, y, w, h }, ...] — solid collision rects
  foods: [],    // [{ id, x, y, w, h, label, points, grabbed }, ...]
  exitZone: { x: 340, y: 20, w: 120, h: 30 }, // where player escapes

  // Workers (populated by Workers.init())
  workers: [], // array of worker objects (defined in workers.js)

  // Input (set by engine.js keydown/keyup listeners)
  keys: {}, // e.g. { 'w': true, 'ArrowUp': true, 'Shift': true }
};
```

---

## Module 1 — Core Engine & Game Loop

**Files:** `js/state.js`, `js/engine.js`, `index.html`

### Responsibilities
- Define `window.GameState` (the full object above)
- Create and size the canvas (800 × 600), append to `#game-container`
- Set up `keydown` / `keyup` listeners that write to `GameState.keys`
- Run the main game loop via `requestAnimationFrame`
- Manage phase transitions: start → playing → gameover / win
- Call other module functions in the correct order each frame (see loop order below)

### Game Loop Order (each frame)
```
1. Map.draw(ctx)
2. Player.update()
3. Player.draw(ctx)
4. Workers.update()
5. Workers.draw(ctx)
6. UI.draw(ctx)
```

> Update logic (steps 2 and 4) only runs when `GameState.phase === 'playing'`.
> Draw calls (1, 3, 5, 6) run every frame so screens render correctly.
> Clear the canvas at the start of every frame: `ctx.clearRect(0, 0, 800, 600)`.

### Phase Transitions
- `'start'` → `'playing'`: triggered by UI start button click
- `'playing'` → `'gameover'`: triggered by Workers module when `GameState.detection >= 100`
- `'playing'` → `'win'`: triggered by Player module when player exits with food
- `'gameover'` or `'win'` → `'playing'`: triggered by UI restart/next-round button

### Exposed API
```javascript
window.Engine = {
  init(),   // called once on page load — sets up canvas, listeners, starts loop
  reset(),  // resets GameState values, calls Map.reset(), Player.reset(), Workers.reset()
};
```

### `init()` startup sequence
```
Engine.init()
  → create canvas, set GameState.canvas + GameState.ctx
  → Map.init()
  → Player.init()
  → Workers.init()
  → UI.init()
  → requestAnimationFrame(loop)
```

### Notes for Claude
- Use delta time if possible: `const dt = (timestamp - lastTime) / 1000` — pass dt to update functions or use it internally.
- Canvas should be styled with `display: block; margin: 0 auto;` centered on the page.
- The engine does not handle collision or detection — those belong to the Player and Workers modules.

---

## Module 2 — Map & Dining Hall

**File:** `js/map.js`

### Responsibilities
- Define the dining hall layout as a set of walls and counters
- Place food items at fixed counter positions on `init()`
- Populate `GameState.walls` and `GameState.foods` and confirm `GameState.exitZone`
- Draw the map: floor, walls, counters, ungrabbed food items

### Dining Hall Layout
```
+----------------------------------------------+  y=0
|  [EXIT DOOR — top center, x=340 w=120]       |
|  [====== FOOD COUNTER A (top) ===========]   |  y=60
|                                              |
|      [tables]          [tables]              |
|                                              |
|  [====== FOOD COUNTER B (middle) ========]   |  y=280
|                                              |
|      [tables]          [tables]              |
|                                              |
|           [PLAYER START ZONE]                |  y=500
+----------------------------------------------+  y=600
```

### Wall Rects (add to `GameState.walls`)

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

> Counter A separates the exit area from the main floor. Counter B separates the lower zone. The player starts below Counter B and must navigate around/between tables to reach Counter A food, then exit.

### Food Items (add to `GameState.foods`)

Place all food items on or just in front of the two counters. Each food item is a 24×24 hitbox.

| id | x | y | label | points |
|----|---|---|-------|--------|
| 0  | 100 | 95  | Pizza    | 50 |
| 1  | 180 | 95  | Pasta    | 45 |
| 2  | 260 | 95  | Soup     | 35 |
| 3  | 340 | 95  | Sandwich | 30 |
| 4  | 420 | 95  | Muffin   | 25 |
| 5  | 500 | 95  | Coffee   | 20 |
| 6  | 580 | 95  | Apple    | 10 |
| 7  | 660 | 95  | Cookies  | 15 |
| 8  | 140 | 315 | Pizza    | 50 |
| 9  | 300 | 315 | Pasta    | 45 |
| 10 | 460 | 315 | Sandwich | 30 |
| 11 | 620 | 315 | Coffee   | 20 |

Food item structure:
```javascript
{ id: 0, x: 100, y: 95, w: 24, h: 24, label: 'Pizza', points: 50, grabbed: false }
```

### Draw Instructions
- Floor: fill canvas with `#c8b89a` (warm tile color)
- Walls/counters: fill `#5a4a3a` (dark wood)
- Tables: fill `#8b6f47` (medium wood)
- Food items (not grabbed): draw a 24×24 colored square with a 10px label above in white, 9px sans-serif
  - Pizza: `#e84040`, Pasta: `#f0c060`, Soup: `#e09030`, Sandwich: `#c8a060`
  - Muffin: `#8b4513`, Coffee: `#4a2c0a`, Apple: `#cc2200`, Cookies: `#d4a050`
- Exit zone: draw a `#00cc66` rectangle at `GameState.exitZone` with label "EXIT" in black

### Exposed API
```javascript
window.Map = {
  init(),       // populate GameState.walls and GameState.foods
  draw(ctx),    // render floor, walls, tables, ungrabbed food
  reset(),      // set all foods grabbed = false, re-populate GameState.foods
};
```

### Notes for Claude
- Do not draw food items where `food.grabbed === true`.
- Draw order: floor first, then walls/counters/tables, then food items, then exit zone.
- `reset()` should restore all food items to `grabbed: false` (do not recreate from scratch — just reset the grabbed flag and re-assign `GameState.foods`).

---

## Module 3 — Player Character

**File:** `js/player.js`

### Responsibilities
- Read `GameState.keys` and move the player each frame
- Collide with all rects in `GameState.walls` (AABB — no passing through counters or tables)
- Detect food pickup when player overlaps a food item (press E or auto-grab on overlap)
- Detect win condition: player is in `GameState.exitZone` with at least one item in inventory
- Implement crouch: hold Shift to halve speed and shrink detection radius
- Draw the player

### Controls

| Key | Action |
|-----|--------|
| W or ArrowUp | Move up |
| A or ArrowLeft | Move left |
| S or ArrowDown | Move down |
| D or ArrowRight | Move right |
| Shift | Crouch (hold) |
| E | Grab nearby food |

### Movement & Collision
- Normal speed: `GameState.player.speed` (3 px/frame)
- Crouch speed: `GameState.player.speed * 0.5`
- Set `GameState.player.crouching = true` when Shift is held
- AABB collision resolution: move in X and Y separately — if collision after X move, revert X; same for Y. This prevents wall sticking.
- Player cannot walk through any rect in `GameState.walls`

### Food Pickup
- On `E` keypress (or overlap with any food): find the nearest `food` in `GameState.foods` where `food.grabbed === false` and distance from player center to food center ≤ 40px
- If found: set `food.grabbed = true`, push food into `GameState.player.inventory`, add `food.points` to `GameState.score`
- Only grab one food per keypress

### Win Condition
- Each frame: check if player hitbox overlaps `GameState.exitZone`
- If yes AND `GameState.player.inventory.length > 0`: set `GameState.phase = 'win'`

### Player Visuals
- Draw a 20×20 circle (use `ctx.arc`) at player center
- Normal: `#3399ff` (blue)
- Crouching: `#1a66cc` (darker blue, slightly smaller — 14px radius)
- Draw a 6px white dot indicating facing direction (track last non-zero movement vector)
- Draw a small inventory badge: number of items grabbed, bottom-right of player, yellow `#ffdd00` text

### Exposed API
```javascript
window.Player = {
  init(),           // set player to start position, clear inventory
  update(),         // read keys, move, check pickups, check win
  draw(ctx),        // render player
  reset(),          // same as init — called between rounds
  getHitbox(),      // returns { x, y, w, h } — player's current collision rect
  detectionRadius() // returns 60 normally, 35 when crouching
};
```

### Notes for Claude
- Use `GameState.keys['e']` for E key. Track a `prevKeys` snapshot to detect keydown (not held).
- `detectionRadius()` is called by the Workers module — return the correct value based on `GameState.player.crouching`.
- On `'win'` or `'gameover'` phase, `update()` should do nothing (engine only calls update when phase is `'playing'`, but guard anyway).

---

## Module 4 — Worker AI & Detection

**File:** `js/workers.js`

### Responsibilities
- Create 3 cafeteria workers with patrol routes
- Move workers along their patrol paths each frame
- Cast a vision cone from each worker — detect if the player is inside it
- Raise or lower `GameState.detection` based on whether player is seen
- Escalate worker state based on detection level
- Trigger game over when `GameState.detection >= 100`
- Draw workers and their vision cones

### Worker Object Structure
```javascript
{
  x: 200,              // current x (center)
  y: 150,              // current y (center)
  radius: 14,          // draw size
  angle: Math.PI / 2,  // facing direction in radians (0 = right, PI/2 = down)
  speed: 1.2,          // patrol speed px/frame
  state: 'patrol',     // 'patrol' | 'alert' | 'chase'
  visionRange: 150,    // px
  visionAngle: Math.PI / 3, // 60° cone
  patrolPath: [        // waypoints to loop through
    { x: 200, y: 150 },
    { x: 200, y: 420 },
  ],
  pathIndex: 0,
  pathDir: 1,          // 1 = forward, -1 = reverse
}
```

### Three Workers & Patrol Routes

| Worker | Patrol Path | Notes |
|--------|-------------|-------|
| Worker A | (200, 150) ↔ (600, 150) | Patrols along Counter A (top) |
| Worker B | (150, 350) ↔ (650, 350) | Patrols between counters |
| Worker C | (400, 420) ↔ (400, 560) | Guards the player start zone |

Workers patrol back and forth along their path (bounce at each endpoint — reverse `pathDir`).

### Detection Logic

Each frame while `phase === 'playing'`:

1. For each worker, check if player is in vision cone:
   - Compute vector from worker center to player center
   - `dist` = vector magnitude
   - `angleToPlayer` = `Math.atan2(dy, dx)`
   - `angleDiff` = absolute difference between `angleToPlayer` and `worker.angle` (wrapped to -PI..PI)
   - **Detected** if: `dist <= worker.visionRange` AND `Math.abs(angleDiff) <= worker.visionAngle / 2`

2. Detection meter update per frame:
   - Any worker detects player (normal): `GameState.detection += 3`
   - Any worker detects player (player crouching): `GameState.detection += 1.5`
   - No worker detects player: `GameState.detection -= 0.5`
   - Clamp: `GameState.detection = Math.max(0, Math.min(100, GameState.detection))`

3. Worker state transitions:
   - `detection < 40`: all workers stay in `'patrol'`
   - `detection >= 40`: nearest worker enters `'alert'` — visionRange increases to 220, visionAngle to PI/2
   - `detection >= 80`: nearest worker enters `'chase'` — moves toward player position at speed 2.5
   - `detection >= 100`: set `GameState.phase = 'gameover'`

4. In `'alert'` state: worker stops patrolling and slowly rotates toward player
5. In `'chase'` state: worker moves directly toward player; other workers enter `'alert'`

### Worker Visuals
- Worker body: 14px radius circle, `#cc3300` (red)
- Vision cone: semi-transparent filled triangle, apex at worker center
  - Patrol state: `rgba(255, 220, 100, 0.18)` (yellow tint)
  - Alert state: `rgba(255, 100, 0, 0.28)` (orange tint)
  - Chase state: `rgba(255, 0, 0, 0.38)` (red tint)
- Facing indicator: small white dot 18px ahead of worker center
- Alert state: draw `!` above worker in orange `#ff6600`, 14px bold
- Chase state: draw `!!` above worker in red, 16px bold

Vision cone drawing:
```javascript
ctx.beginPath();
ctx.moveTo(worker.x, worker.y);
ctx.arc(worker.x, worker.y, worker.visionRange,
        worker.angle - worker.visionAngle / 2,
        worker.angle + worker.visionAngle / 2);
ctx.closePath();
ctx.fillStyle = coneColor;
ctx.fill();
```

### Exposed API
```javascript
window.Workers = {
  init(),       // create the 3 worker objects, assign to GameState.workers
  update(),     // move workers, run detection, update GameState.detection
  draw(ctx),    // render workers and vision cones
  reset(),      // reset workers to starting positions and patrol state
};
```

### Notes for Claude
- Call `Player.detectionRadius()` if you want to also check whether the player is "hiding" behind something (stretch goal: wall occlusion). For the base game, skip occlusion — just use the cone check.
- Detection should only run when `GameState.phase === 'playing'`. Guard at the top of `update()`.
- Worker angle updates smoothly toward their patrol direction: `worker.angle = Math.atan2(dy, dx)` where dy/dx is the direction toward next waypoint.

---

## Module 5 — UI, HUD & Screens

**File:** `js/ui.js`

### Responsibilities
- Draw the in-game HUD during `'playing'` phase
- Render the Start Screen when `phase === 'start'`
- Render the Game Over screen when `phase === 'gameover'`
- Render the Win screen when `phase === 'win'`
- Handle button clicks (start, retry, next round) via canvas mouse events
- (Optional) Play sound effects at key moments

### HUD Elements (drawn over gameplay)

| Element | Position | Details |
|---------|----------|---------|
| Detection meter | Top-right, x=580 y=12 w=200 h=18 | Background `#333`, fill `#cc3300` scaled by `detection/100`. Label "BUSTED" in white 10px above bar |
| Score | Top-left, x=20 y=24 | White, 16px, `"Score: " + GameState.score` |
| Inventory | Top-center, x=340 y=24 | White, 14px, `GameState.player.inventory.length + " items"` |
| Round | Top-left, x=20 y=44 | Gray `#aaa`, 12px, `"Round " + GameState.round` |

Detection meter color transitions:
- 0–49%: `#33cc33` (green)
- 50–79%: `#ff9900` (orange)
- 80–100%: `#cc3300` (red)

### Start Screen

Drawn as a centered 480×320 dark box (`rgba(0,0,0,0.88)`) at x=160, y=140:

```
MEAL PLAN ZERO          (white, 32px bold, centered)
Your meal plan ran out. (gray #aaa, 14px, centered)
You're hungry. The dining hall is open.

[ START GAME ]          (button — white text on #336699 bg)

WASD — Move             (gray #888, 11px)
Shift — Crouch (less visible)
E — Grab food
Reach the EXIT to escape
```

### Game Over Screen

Centered 420×260 dark box at x=190, y=170:

```
CAUGHT.                         (red #cc3300, 28px bold)
Banned from the dining hall.    (gray #aaa, 14px)
Also still hungry.

Food stolen: N items            (white, 14px)
Score: N pts                    (white, 16px bold)

[ TRY AGAIN ]                   (button — white on #993300)
```

### Win Screen

Centered 420×260 dark box at x=190, y=170:

```
ESCAPED.                        (green #33cc66, 28px bold)
Round N complete.               (gray #aaa, 14px)

Food stolen: N items            (white, 14px)
Score: N pts                    (white, 16px bold)

[ NEXT ROUND ]                  (button — white on #336633)
```

### Button Interaction
- Store button rects as `{ x, y, w, h }` when drawing them
- Add a `'mousedown'` listener to the canvas on `init()`
- On click: check if `(mx, my)` falls within any active button rect
  - Start button → `Engine.reset()` then `GameState.phase = 'playing'`
  - Try Again button → `Engine.reset()` then `GameState.phase = 'playing'`
  - Next Round button → `GameState.round++`, `Engine.reset()`, `GameState.phase = 'playing'`

### Sound Effects (Optional)

Use `new Audio(src)` for simplicity. Suggested cues:

| Event | File | Notes |
|-------|------|-------|
| Food grabbed | `assets/sounds/grab.wav` | Short click/rustle |
| Detection spike (>50) | `assets/sounds/alert.wav` | Sting sound |
| Game over | `assets/sounds/caught.wav` | Buzzer/stinger |
| Win | `assets/sounds/escape.wav` | Positive chime |

If no sound files are available, skip — do not let missing audio break the game.

### Exposed API
```javascript
window.UI = {
  init(),     // attach canvas mousedown listener
  draw(ctx),  // draw HUD during 'playing', or correct screen based on phase
};
```

### Notes for Claude
- All screens are drawn on the canvas — no HTML `<div>` overlays.
- Draw screens on top of a partially rendered game frame (map still visible underneath) using semi-transparent backgrounds for depth.
- The detection meter should feel urgent: flash the meter label when detection > 80.
- Track a `lastDetectionLevel` variable to trigger sound only when crossing thresholds, not every frame.

---

## Difficulty Scaling (Round 2+)

When `GameState.round > 1`, the engine passes round number to `Workers.reset()`. Workers module should scale:

| Round | Worker speed | Vision range | Patrol speed |
|-------|-------------|--------------|--------------|
| 1 | 1.2 | 150px | 1.2 |
| 2 | 1.5 | 170px | 1.5 |
| 3 | 1.8 | 190px | 1.7 |
| 4+ | 2.0 | 210px | 2.0 |

Apply formula: `baseValue + (round - 1) * increment`, capped at round 4 values.

---

## Integration Checklist

When all modules are done and ready to merge:

- [ ] Scripts load in correct order (`state.js` first, `engine.js` last)
- [ ] `Engine.init()` calls `Map.init()`, `Player.init()`, `Workers.init()`, `UI.init()`
- [ ] Canvas clears each frame before drawing
- [ ] Player collides with all walls (cannot walk through counters or tables)
- [ ] Food is grabbable and disappears when grabbed
- [ ] Detection meter rises when player is in vision cone
- [ ] Detection meter drains when player is out of sight
- [ ] Game over triggers at detection 100
- [ ] Win triggers when player exits with food
- [ ] Crouching reduces speed and detection gain
- [ ] Start screen shows on load; game starts on button click
- [ ] Game over screen shows score and retry button
- [ ] Win screen shows score and next round button
- [ ] Round counter increments; workers get slightly harder
- [ ] No console errors in browser DevTools

---

## Deployment

1. Create a folder `meal-plan-zero/` in the class GitHub org repo
2. Push all files — `index.html`, `style.css`, `js/`, `assets/`
3. Enable GitHub Pages (Settings → Pages → branch: main, root folder)
4. Game runs at: `https://[class-org].github.io/[repo-name]/meal-plan-zero/`
5. Test in a fresh browser tab (incognito) to confirm all assets load via relative paths

**No server required — 100% static, 100% client-side.**

---

## Stretch Goals

- **Wall occlusion**: workers cannot see through Counter A or Counter B — add raycast check against wall rects
- **Noise mechanic**: running (no crouch) emits a radius that alert workers can hear even without line of sight
- **Multiple exits**: two escape routes, one guarded more heavily
- **Leaderboard**: top 5 scores stored in `localStorage`, shown on win screen
- **Animated sprites**: replace circles with spritesheet characters
- **Background music**: looping ambient cafeteria audio via Web Audio API

---

## Current Implementation — `index.html`

> Modules 1 (State), 2 (Map), and 5 (UI) are implemented below as a single self-contained file.
> Modules 3 (Player) and 4 (Workers) are stubbed — paste them in when your teammates finish.
> Open this file directly in a browser to run the game.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Meal Plan Zero</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #0a0806;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    canvas { display: block; }
    #info { color: #444; font: 11px monospace; margin-top: 8px; text-align: center; }
  </style>
</head>
<body>
  <div id="game-container"></div>
  <div id="info">meal-plan-zero &nbsp;|&nbsp; modules: state · map · ui</div>

<!-- ═══════════════════════════════════════════════════════════
     MODULE 1 — Shared Game State
     Owner: Module 1 teammate. Do not modify this block.
════════════════════════════════════════════════════════════ -->
<script>
window.GameState = {
  phase:  'start',
  score:  0,
  round:  1,

  canvas: null,
  ctx:    null,
  width:  800,
  height: 600,

  player: {
    x: 388, y: 500,
    width: 20, height: 20,
    speed: 3,
    crouching: false,
    inventory: [],
  },

  detection: 0,

  walls:    [],
  foods:    [],
  exitZone: { x: 340, y: 20, w: 120, h: 30 },

  workers: [],
  keys:    {},
};
</script>

<!-- ═══════════════════════════════════════════════════════════
     MODULE 2 — Map & Dining Hall
════════════════════════════════════════════════════════════ -->
<script>
window.Map = (function () {

  var _time = 0;
  var _particles = [];
  var _MAX_PARTICLES = 40;

  const WALL_DEFS = [
    { x: 0,   y: 0,   w: 800, h: 20  },
    { x: 0,   y: 580, w: 800, h: 20  },
    { x: 0,   y: 0,   w: 20,  h: 600 },
    { x: 780, y: 0,   w: 20,  h: 600 },
    { x: 80,  y: 60,  w: 640, h: 40  },
    { x: 80,  y: 280, w: 640, h: 40  },
    { x: 100, y: 160, w: 120, h: 60  },
    { x: 340, y: 160, w: 120, h: 60  },
    { x: 580, y: 160, w: 120, h: 60  },
    { x: 100, y: 380, w: 120, h: 60  },
    { x: 340, y: 380, w: 120, h: 60  },
    { x: 580, y: 380, w: 120, h: 60  },
  ];

  const FOOD_DEFS = [
    { id: 0,  x: 100, y: 95,  label: 'Pizza',    points: 50, color: '#ff5555', glow: '#ff2020', icon: '🍕' },
    { id: 1,  x: 180, y: 95,  label: 'Pasta',    points: 45, color: '#f5c842', glow: '#e0a800', icon: '🍝' },
    { id: 2,  x: 260, y: 95,  label: 'Soup',     points: 35, color: '#f09030', glow: '#cc6600', icon: '🍜' },
    { id: 3,  x: 340, y: 95,  label: 'Sandwich', points: 30, color: '#d4a96a', glow: '#a07030', icon: '🥪' },
    { id: 4,  x: 420, y: 95,  label: 'Muffin',   points: 25, color: '#c4693a', glow: '#8b3010', icon: '🧁' },
    { id: 5,  x: 500, y: 95,  label: 'Coffee',   points: 20, color: '#7a5030', glow: '#4a2800', icon: '☕' },
    { id: 6,  x: 580, y: 95,  label: 'Apple',    points: 10, color: '#e83030', glow: '#aa0000', icon: '🍎' },
    { id: 7,  x: 660, y: 95,  label: 'Cookies',  points: 15, color: '#e0b060', glow: '#b07820', icon: '🍪' },
    { id: 8,  x: 140, y: 315, label: 'Pizza',    points: 50, color: '#ff5555', glow: '#ff2020', icon: '🍕' },
    { id: 9,  x: 300, y: 315, label: 'Pasta',    points: 45, color: '#f5c842', glow: '#e0a800', icon: '🍝' },
    { id: 10, x: 460, y: 315, label: 'Sandwich', points: 30, color: '#d4a96a', glow: '#a07030', icon: '🥪' },
    { id: 11, x: 620, y: 315, label: 'Coffee',   points: 20, color: '#7a5030', glow: '#4a2800', icon: '☕' },
  ];

  const STEAMY_IDS = new Set([0, 1, 2, 5, 8, 9, 11]);

  const LIGHT_FIXTURES = [
    { x: 200, y: 25 }, { x: 400, y: 25 }, { x: 600, y: 25 },
    { x: 200, y: 245 }, { x: 400, y: 245 }, { x: 600, y: 245 },
    { x: 200, y: 460 }, { x: 400, y: 460 }, { x: 600, y: 460 },
  ];

  function init() {
    GameState.walls = WALL_DEFS.map(function (r) { return { x: r.x, y: r.y, w: r.w, h: r.h }; });
    GameState.foods = FOOD_DEFS.map(function (f) {
      return { id: f.id, x: f.x, y: f.y, w: 24, h: 24,
               label: f.label, points: f.points, color: f.color,
               glow: f.glow, icon: f.icon, grabbed: false };
    });
    GameState.exitZone = { x: 340, y: 20, w: 120, h: 30 };
    _particles = [];
  }

  function reset() { GameState.foods.forEach(function (f) { f.grabbed = false; }); }

  function draw(ctx) {
    _time++;
    _tickParticles();
    _spawnAmbientDust();
    _drawFloor(ctx);
    _drawWalls(ctx);
    _drawLightPools(ctx);
    _drawHeatLampGlow(ctx);
    _drawCounters(ctx);
    _drawTables(ctx);
    _drawFoods(ctx);
    _drawExit(ctx);
    _drawParticles(ctx);
    _drawVignette(ctx);
  }

  function _drawFloor(ctx) {
    var TW = 50, TH = 50;
    for (var ty = 0; ty < 600; ty += TH) {
      for (var tx = 0; tx < 800; tx += TW) {
        var alt = ((tx / TW) + (ty / TH)) % 2 === 0;
        ctx.fillStyle = alt ? '#ddd0bc' : '#ccc0a8';
        ctx.fillRect(tx + 1, ty + 1, TW - 2, TH - 2);
        var g = ctx.createLinearGradient(tx, ty, tx + TW, ty + TH);
        g.addColorStop(0,   'rgba(255,255,255,0.14)');
        g.addColorStop(0.5, 'rgba(255,255,255,0.03)');
        g.addColorStop(1,   'rgba(0,0,0,0.08)');
        ctx.fillStyle = g;
        ctx.fillRect(tx + 1, ty + 1, TW - 2, TH - 2);
      }
    }
    ctx.strokeStyle = '#9a8c7c'; ctx.lineWidth = 1;
    for (var gx = 0; gx <= 800; gx += TW) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, 600); ctx.stroke(); }
    for (var gy = 0; gy <= 600; gy += TH) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(800, gy); ctx.stroke(); }
  }

  function _drawWalls(ctx) {
    [WALL_DEFS[0], WALL_DEFS[1], WALL_DEFS[2], WALL_DEFS[3]].forEach(function (r) {
      var g = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h);
      g.addColorStop(0, '#1e1208'); g.addColorStop(1, '#2e1e10');
      ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
    });
    ctx.fillStyle = '#4a3220';
    ctx.fillRect(20, 16, 760, 4); ctx.fillRect(20, 580, 760, 4);
    ctx.fillRect(16, 20, 4, 560); ctx.fillRect(780, 20, 4, 560);
    ctx.fillStyle = '#f0f0e0'; ctx.fillRect(22, 1, 756, 3);
    _drawBanner(ctx, 400, 44, 'DINING  SERVICES');
    _drawWallPanel(ctx, 22, 30, 58, 550);
    _drawWallPanel(ctx, 720, 30, 58, 550);
  }

  function _drawBanner(ctx, cx, cy, text) {
    var w = 280, h = 18;
    var g = ctx.createLinearGradient(cx - w/2, cy, cx + w/2, cy);
    g.addColorStop(0, '#1a0a00'); g.addColorStop(0.1, '#3a2200');
    g.addColorStop(0.5, '#4a3010'); g.addColorStop(0.9, '#3a2200'); g.addColorStop(1, '#1a0a00');
    ctx.fillStyle = g; ctx.fillRect(cx - w/2, cy - h/2, w, h);
    ctx.strokeStyle = '#c8a040'; ctx.lineWidth = 1; ctx.strokeRect(cx - w/2, cy - h/2, w, h);
    ctx.fillStyle = '#f0c840'; ctx.font = 'bold 10px serif'; ctx.textAlign = 'center';
    ctx.letterSpacing = '3px'; ctx.fillText(text, cx, cy + 4);
    ctx.textAlign = 'left'; ctx.letterSpacing = '0px';
  }

  function _drawWallPanel(ctx, x, y, w, h) {
    ctx.fillStyle = '#2a1808'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#1a1008'; ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
    ctx.strokeStyle = 'rgba(180,120,60,0.2)'; ctx.lineWidth = 1;
    ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);
  }

  function _drawLightPools(ctx) {
    LIGHT_FIXTURES.forEach(function (lf) {
      ctx.fillStyle = '#e8e8d8'; ctx.fillRect(lf.x - 28, lf.y, 56, 8);
      ctx.fillStyle = '#fffff0'; ctx.fillRect(lf.x - 22, lf.y + 2, 44, 4);
      var poolY = lf.y + 100;
      var pulse = 0.85 + 0.15 * Math.sin(_time * 0.02 + lf.x * 0.01);
      var g = ctx.createRadialGradient(lf.x, poolY, 0, lf.x, poolY, 120);
      g.addColorStop(0,   'rgba(255,245,200,' + (0.22 * pulse) + ')');
      g.addColorStop(0.6, 'rgba(255,235,160,' + (0.06 * pulse) + ')');
      g.addColorStop(1,   'rgba(255,220,120,0)');
      ctx.fillStyle = g; ctx.fillRect(lf.x - 120, poolY - 100, 240, 220);
    });
  }

  function _drawHeatLampGlow(ctx) {
    [WALL_DEFS[4], WALL_DEFS[5]].forEach(function (r) {
      var pulse = 0.7 + 0.3 * Math.sin(_time * 0.04);
      var g = ctx.createLinearGradient(r.x, r.y - 30, r.x, r.y + r.h);
      g.addColorStop(0, 'rgba(255,80,0,0)');
      g.addColorStop(0.5, 'rgba(255,100,10,' + (0.08 * pulse) + ')');
      g.addColorStop(1, 'rgba(255,60,0,0)');
      ctx.fillStyle = g; ctx.fillRect(r.x, r.y - 30, r.w, r.h + 30);
    });
  }

  function _drawCounters(ctx) {
    [WALL_DEFS[4], WALL_DEFS[5]].forEach(function (r) {
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(r.x + 3, r.y + 3, r.w, r.h);
      var g = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
      g.addColorStop(0, '#c8d8e0'); g.addColorStop(0.15, '#e8f0f4');
      g.addColorStop(0.4, '#b8c8d0'); g.addColorStop(0.7, '#a0b0b8'); g.addColorStop(1, '#889098');
      ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1;
      for (var sy = r.y + 4; sy < r.y + r.h - 4; sy += 5) {
        ctx.beginPath(); ctx.moveTo(r.x + 4, sy); ctx.lineTo(r.x + r.w - 4, sy); ctx.stroke();
      }
      ctx.fillStyle = '#708090'; ctx.fillRect(r.x, r.y, r.w, 3);
      ctx.fillStyle = '#506070'; ctx.fillRect(r.x, r.y + r.h - 2, r.w, 2);
      var glassH = 14;
      var glassG = ctx.createLinearGradient(r.x, r.y - glassH, r.x, r.y);
      glassG.addColorStop(0, 'rgba(160,210,240,0.08)'); glassG.addColorStop(1, 'rgba(160,210,240,0.22)');
      ctx.fillStyle = glassG; ctx.fillRect(r.x, r.y - glassH, r.w, glassH);
      ctx.strokeStyle = 'rgba(200,240,255,0.55)'; ctx.lineWidth = 1;
      ctx.strokeRect(r.x, r.y - glassH, r.w, glassH);
      ctx.fillStyle = '#607080'; ctx.fillRect(r.x, r.y + r.h, r.w, 4);
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(r.x, r.y + r.h + 1); ctx.lineTo(r.x + r.w, r.y + r.h + 1); ctx.stroke();
    });
  }

  function _drawTables(ctx) {
    WALL_DEFS.slice(6).forEach(function (r) {
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; _rr(ctx, r.x + 5, r.y + 5, r.w, r.h, 6); ctx.fill();
      var g = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
      g.addColorStop(0, '#5c3820'); g.addColorStop(0.3, '#3e2210'); g.addColorStop(1, '#281508');
      ctx.fillStyle = g; _rr(ctx, r.x, r.y, r.w, r.h, 6); ctx.fill();
      ctx.save(); ctx.beginPath(); _rr(ctx, r.x, r.y, r.w, r.h, 6); ctx.clip();
      ctx.strokeStyle = 'rgba(255,200,100,0.06)'; ctx.lineWidth = 2;
      for (var gl = r.x - 10; gl < r.x + r.w + 10; gl += 14) {
        ctx.beginPath();
        ctx.moveTo(gl, r.y);
        ctx.bezierCurveTo(gl + 3, r.y + r.h * 0.3, gl - 2, r.y + r.h * 0.7, gl + 1, r.y + r.h);
        ctx.stroke();
      }
      ctx.restore();
      ctx.strokeStyle = 'rgba(180,120,60,0.45)'; ctx.lineWidth = 1.5;
      _rr(ctx, r.x + 1, r.y + 1, r.w - 2, r.h - 2, 5); ctx.stroke();
      [[r.x + 10, r.y - 12, 28, 10], [r.x + r.w - 38, r.y - 12, 28, 10],
       [r.x + 10, r.y + r.h + 2, 28, 10], [r.x + r.w - 38, r.y + r.h + 2, 28, 10]
      ].forEach(function (c) {
        _rr(ctx, c[0], c[1], c[2], c[3], 3);
        ctx.fillStyle = '#3a2010'; ctx.fill();
        ctx.strokeStyle = 'rgba(255,180,80,0.2)'; ctx.lineWidth = 1; ctx.stroke();
      });
      var gloss = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h * 0.4);
      gloss.addColorStop(0, 'rgba(255,255,255,0.10)'); gloss.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gloss; _rr(ctx, r.x, r.y, r.w, r.h * 0.4, 6); ctx.fill();
    });
  }

  function _drawFoods(ctx) {
    GameState.foods.forEach(function (food) {
      if (food.grabbed) return;
      var bob = Math.sin(_time * 0.05 + food.id * 0.9) * 2.5;
      var fy  = food.y + bob;
      var cx  = food.x + food.w / 2;
      var cy  = fy + food.h / 2;
      var pulse = 0.7 + 0.3 * Math.sin(_time * 0.06 + food.id * 0.7);
      var halo = ctx.createRadialGradient(cx, cy, 2, cx, cy, 26);
      halo.addColorStop(0,   hexAlpha(food.glow, 0.5 * pulse));
      halo.addColorStop(0.6, hexAlpha(food.glow, 0.15 * pulse));
      halo.addColorStop(1,   hexAlpha(food.glow, 0));
      ctx.fillStyle = halo; ctx.fillRect(cx - 26, cy - 26, 52, 52);
      ctx.beginPath(); ctx.ellipse(cx, fy + food.h + 4, 18, 5, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fill();
      ctx.strokeStyle = 'rgba(200,200,200,0.5)'; ctx.lineWidth = 1; ctx.stroke();
      _rr(ctx, food.x, fy, food.w, food.h, 6);
      var bg = ctx.createLinearGradient(food.x, fy, food.x, fy + food.h);
      bg.addColorStop(0, _lighten(food.color, 40)); bg.addColorStop(1, food.color);
      ctx.fillStyle = bg; ctx.fill();
      _rr(ctx, food.x + 2, fy + 2, food.w - 4, food.h * 0.45, 4);
      ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fill();
      _rr(ctx, food.x, fy, food.w, food.h, 6);
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.font = '15px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(food.icon, cx, cy + 1); ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 3;
      ctx.fillText(food.label, cx, fy + food.h + 12); ctx.shadowBlur = 0;
      _drawPointsBadge(ctx, food.x + food.w - 1, fy - 1, food.points);
      ctx.textAlign = 'left';
      if (STEAMY_IDS.has(food.id)) _spawnSteam(food.x + 12, fy);
    });
  }

  function _drawPointsBadge(ctx, x, y, points) {
    var badgeW = 20, badgeH = 11;
    _rr(ctx, x - badgeW, y, badgeW, badgeH, 3);
    ctx.fillStyle = '#ffcc00'; ctx.fill();
    ctx.fillStyle = '#3a1a00'; ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(points + 'pt', x - badgeW / 2, y + 8); ctx.textAlign = 'left';
  }

  function _drawExit(ctx) {
    var ez = GameState.exitZone;
    var pulse = 0.6 + 0.4 * Math.sin(_time * 0.07);
    var cx = ez.x + ez.w / 2, cy = ez.y + ez.h / 2;
    var floorGlow = ctx.createRadialGradient(cx, cy + 30, 0, cx, cy + 30, 90);
    floorGlow.addColorStop(0, 'rgba(0,255,120,' + (0.25 * pulse) + ')');
    floorGlow.addColorStop(1, 'rgba(0,255,120,0)');
    ctx.fillStyle = floorGlow; ctx.fillRect(cx - 90, cy - 20, 180, 120);
    ctx.shadowColor = '#00ff88'; ctx.shadowBlur = 20 + 10 * pulse;
    _rr(ctx, ez.x - 2, ez.y - 2, ez.w + 4, ez.h + 4, 6);
    ctx.fillStyle = 'rgba(0,30,15,0.9)'; ctx.fill();
    ctx.strokeStyle = '#00cc66'; ctx.lineWidth = 2; ctx.stroke();
    ctx.shadowBlur = 0;
    _rr(ctx, ez.x, ez.y, ez.w, ez.h, 5);
    var neon = ctx.createLinearGradient(ez.x, ez.y, ez.x, ez.y + ez.h);
    neon.addColorStop(0, 'rgba(0,255,120,' + (0.18 * pulse) + ')');
    neon.addColorStop(1, 'rgba(0,180,80,'  + (0.10 * pulse) + ')');
    ctx.fillStyle = neon; ctx.fill();
    ctx.strokeStyle = 'rgba(0,255,140,' + (0.6 + 0.4 * pulse) + ')';
    ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]); ctx.lineDashOffset = -(_time * 0.6 % 9);
    _rr(ctx, ez.x, ez.y, ez.w, ez.h, 5); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(0,255,140,' + (0.5 + 0.5 * Math.sin(_time * 0.12)) + ')';
    ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('▲ EXIT ▲', cx, cy + 5); ctx.textAlign = 'left';
  }

  function _spawnAmbientDust() {
    if (_particles.length >= _MAX_PARTICLES || Math.random() > 0.25) return;
    var lf = LIGHT_FIXTURES[Math.floor(Math.random() * LIGHT_FIXTURES.length)];
    _particles.push({ type: 'dust', x: lf.x + (Math.random() - 0.5) * 70, y: lf.y + 10 + Math.random() * 40,
      vx: (Math.random() - 0.5) * 0.25, vy: -0.15 - Math.random() * 0.35,
      life: 1.0, fade: 0.004 + Math.random() * 0.006, r: 0.8 + Math.random() * 1.5 });
  }

  function _spawnSteam(x, y) {
    if (_particles.length >= _MAX_PARTICLES || Math.random() > 0.15) return;
    _particles.push({ type: 'steam', x: x + (Math.random() - 0.5) * 8, y: y,
      vx: (Math.random() - 0.5) * 0.4, vy: -0.5 - Math.random() * 0.6,
      life: 1.0, fade: 0.015 + Math.random() * 0.015, r: 1.5 + Math.random() * 2 });
  }

  function _tickParticles() {
    for (var i = _particles.length - 1; i >= 0; i--) {
      var p = _particles[i]; p.x += p.vx; p.y += p.vy; p.vx *= 0.99; p.life -= p.fade;
      if (p.life <= 0) _particles.splice(i, 1);
    }
  }

  function _drawParticles(ctx) {
    _particles.forEach(function (p) {
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.type === 'dust'
        ? 'rgba(255,240,200,' + (p.life * 0.55) + ')'
        : 'rgba(220,220,220,' + (p.life * 0.35) + ')';
      ctx.fill();
    });
  }

  function _drawVignette(ctx) {
    var g = ctx.createRadialGradient(400, 300, 180, 400, 300, 520);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.52)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 800, 600);
  }

  function _rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }

  function hexAlpha(hex, a) {
    return 'rgba(' + parseInt(hex.slice(1,3),16) + ',' + parseInt(hex.slice(3,5),16) + ',' + parseInt(hex.slice(5,7),16) + ',' + a + ')';
  }

  function _lighten(hex, amt) {
    return 'rgb(' + Math.min(255, parseInt(hex.slice(1,3),16)+amt) + ',' + Math.min(255, parseInt(hex.slice(3,5),16)+amt) + ',' + Math.min(255, parseInt(hex.slice(5,7),16)+amt) + ')';
  }

  return { init: init, draw: draw, reset: reset };
})();
</script>

<!-- ═══════════════════════════════════════════════════════════
     MODULE 5 — UI, HUD & Screens
════════════════════════════════════════════════════════════ -->
<script>
window.UI = (function () {

  var _buttons = [];
  var _time    = 0;
  var _sounds  = {};
  var _lastDetection = 0;

  function _loadSound(key, src) { try { _sounds[key] = new Audio(src); } catch (e) {} }
  function _playSound(key) {
    if (!_sounds[key]) return;
    try { _sounds[key].currentTime = 0; _sounds[key].play().catch(function () {}); } catch (e) {}
  }

  function init() {
    _loadSound('grab',   'assets/sounds/grab.wav');
    _loadSound('alert',  'assets/sounds/alert.wav');
    _loadSound('caught', 'assets/sounds/caught.wav');
    _loadSound('escape', 'assets/sounds/escape.wav');

    GameState.canvas.addEventListener('mousedown', function (e) {
      var rect = GameState.canvas.getBoundingClientRect();
      var mx = (e.clientX - rect.left) * (GameState.width  / rect.width);
      var my = (e.clientY - rect.top)  * (GameState.height / rect.height);
      _buttons.forEach(function (btn) {
        if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) btn.action();
      });
    });

    GameState.canvas.addEventListener('mousemove', function (e) {
      var rect = GameState.canvas.getBoundingClientRect();
      var mx = (e.clientX - rect.left) * (GameState.width  / rect.width);
      var my = (e.clientY - rect.top)  * (GameState.height / rect.height);
      GameState.canvas.style.cursor = _buttons.some(function (btn) {
        return mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h;
      }) ? 'pointer' : 'default';
    });
  }

  function draw(ctx) {
    _time++;
    _buttons = [];
    if (GameState.phase === 'playing' && _lastDetection < 50 && GameState.detection >= 50) _playSound('alert');
    _lastDetection = GameState.detection;
    if      (GameState.phase === 'playing')  _drawHUD(ctx);
    else if (GameState.phase === 'start')    _drawStartScreen(ctx);
    else if (GameState.phase === 'gameover') _drawGameOverScreen(ctx);
    else if (GameState.phase === 'win')      _drawWinScreen(ctx);
  }

  function _drawHUD(ctx) {
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'left';
    ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 4;
    ctx.fillText('Score: ' + GameState.score, 20, 24);
    ctx.fillStyle = '#aaaaaa'; ctx.font = '12px sans-serif';
    ctx.fillText('Round ' + GameState.round, 20, 42);
    ctx.fillStyle = '#ffffff'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
    var n = GameState.player.inventory.length;
    ctx.fillText(n + (n === 1 ? ' item' : ' items'), 400, 24);
    ctx.shadowBlur = 0; ctx.textAlign = 'left';
    _drawDetectionMeter(ctx);
  }

  function _drawDetectionMeter(ctx) {
    var mx = 578, my = 12, mw = 202, mh = 18;
    var pct   = Math.min(1, GameState.detection / 100);
    var flash = GameState.detection > 80 && (_time % 18 < 9);
    ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'right';
    ctx.fillStyle = flash ? '#ff3333' : 'rgba(255,255,255,0.75)';
    ctx.fillText('BUSTED', mx + mw, my - 3);
    ctx.fillStyle = '#222222'; _rr(ctx, mx, my, mw, mh, 3); ctx.fill();
    var fillColor = pct < 0.5 ? '#33cc33' : pct < 0.8 ? '#ff9900' : '#cc3300';
    if (flash) fillColor = '#ff0000';
    var grad = ctx.createLinearGradient(mx, my, mx, my + mh);
    grad.addColorStop(0, _lightenHex(fillColor, 40)); grad.addColorStop(1, fillColor);
    ctx.fillStyle = grad; _rr(ctx, mx, my, mw * pct, mh, 3); ctx.fill();
    if (pct > 0) { ctx.fillStyle = 'rgba(255,255,255,0.15)'; _rr(ctx, mx, my, mw * pct, mh * 0.45, 3); ctx.fill(); }
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1; _rr(ctx, mx, my, mw, mh, 3); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(Math.round(GameState.detection) + '%', mx + mw / 2, my + mh - 4); ctx.textAlign = 'left';
  }

  function _drawStartScreen(ctx) {
    var bx = 160, by = 130, bw = 480, bh = 340, cx = bx + bw / 2;
    _drawOverlay(ctx); _drawPanel(ctx, bx, by, bw, bh);
    ctx.shadowColor = 'rgba(255,255,255,0.3)'; ctx.shadowBlur = 12;
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 34px serif'; ctx.textAlign = 'center';
    ctx.fillText('MEAL PLAN ZERO', cx, by + 58); ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(bx + 40, by + 70); ctx.lineTo(bx + bw - 40, by + 70); ctx.stroke();
    ctx.fillStyle = '#aaaaaa'; ctx.font = '14px sans-serif';
    ctx.fillText("Your meal plan ran out.", cx, by + 94);
    ctx.fillText("You're hungry. The dining hall is open.", cx, by + 114);
    _drawButton(ctx, cx - 95, by + 138, 190, 42, '▶  START GAME', '#2255aa', function () {
      Engine.reset(); GameState.phase = 'playing';
    });
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(bx + 30, by + 200, bw - 60, 1);
    ctx.fillStyle = '#777777'; ctx.font = '11px monospace';
    ['WASD / Arrow Keys — Move', 'Shift — Crouch  (harder to detect)', 'E — Grab nearby food', 'Reach the EXIT with food to escape']
      .forEach(function (line, i) { ctx.fillText(line, cx - 110, by + 222 + i * 18); });
    ctx.textAlign = 'left';
  }

  function _drawGameOverScreen(ctx) {
    var bx = 190, by = 165, bw = 420, bh = 270, cx = bx + bw / 2;
    _drawOverlay(ctx); _drawPanel(ctx, bx, by, bw, bh);
    ctx.textAlign = 'center';
    ctx.shadowColor = '#cc3300'; ctx.shadowBlur = 16;
    ctx.fillStyle = '#cc3300'; ctx.font = 'bold 30px serif';
    ctx.fillText('CAUGHT.', cx, by + 52); ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(bx + 30, by + 64, bw - 60, 1);
    ctx.fillStyle = '#aaaaaa'; ctx.font = '14px sans-serif';
    ctx.fillText('Banned from the dining hall.', cx, by + 86);
    ctx.fillText('Also still hungry.', cx, by + 106);
    ctx.fillStyle = '#dddddd'; ctx.font = '14px sans-serif';
    ctx.fillText('Food stolen: ' + GameState.player.inventory.length + ' item(s)', cx, by + 138);
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('Score: ' + GameState.score + ' pts', cx, by + 162);
    _drawButton(ctx, cx - 85, by + 182, 170, 42, '↺  TRY AGAIN', '#882200', function () {
      Engine.reset(); GameState.phase = 'playing';
    });
    ctx.textAlign = 'left';
  }

  function _drawWinScreen(ctx) {
    var bx = 190, by = 165, bw = 420, bh = 270, cx = bx + bw / 2;
    _drawOverlay(ctx); _drawPanel(ctx, bx, by, bw, bh);
    ctx.textAlign = 'center';
    ctx.shadowColor = '#00ff88'; ctx.shadowBlur = 18;
    ctx.fillStyle = '#33cc66'; ctx.font = 'bold 30px serif';
    ctx.fillText('ESCAPED.', cx, by + 52); ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(bx + 30, by + 64, bw - 60, 1);
    ctx.fillStyle = '#aaaaaa'; ctx.font = '14px sans-serif';
    ctx.fillText('Round ' + GameState.round + ' complete.', cx, by + 86);
    ctx.fillStyle = '#dddddd'; ctx.font = '14px sans-serif';
    ctx.fillText('Food stolen: ' + GameState.player.inventory.length + ' item(s)', cx, by + 124);
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('Score: ' + GameState.score + ' pts', cx, by + 150);
    _drawButton(ctx, cx - 85, by + 172, 170, 42, '▶  NEXT ROUND', '#1a5e2a', function () {
      GameState.round++; Engine.reset(); GameState.phase = 'playing';
    });
    ctx.textAlign = 'left';
  }

  function _drawOverlay(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, GameState.width, GameState.height);
  }

  function _drawPanel(ctx, x, y, w, h) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; _rr(ctx, x + 6, y + 6, w, h, 12); ctx.fill();
    var bg = ctx.createLinearGradient(x, y, x, y + h);
    bg.addColorStop(0, 'rgba(18,14,10,0.96)'); bg.addColorStop(1, 'rgba(8,6,4,0.96)');
    ctx.fillStyle = bg; _rr(ctx, x, y, w, h, 12); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.lineWidth = 1; _rr(ctx, x, y, w, h, 12); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x + 12, y + 1); ctx.lineTo(x + w - 12, y + 1); ctx.stroke();
  }

  function _drawButton(ctx, x, y, w, h, label, color, action) {
    _buttons.push({ x: x, y: y, w: w, h: h, action: action });
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; _rr(ctx, x + 3, y + 3, w, h, 7); ctx.fill();
    var bg = ctx.createLinearGradient(x, y, x, y + h);
    bg.addColorStop(0, _lightenHex(color, 30)); bg.addColorStop(1, color);
    ctx.fillStyle = bg; _rr(ctx, x, y, w, h, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; _rr(ctx, x + 2, y + 2, w - 4, h * 0.45, 5); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1; _rr(ctx, x, y, w, h, 7); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 4;
    ctx.fillText(label, x + w / 2, y + h / 2 + 5); ctx.shadowBlur = 0;
  }

  function _rr(ctx, x, y, w, h, r) {
    if (w <= 0) return;
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }

  function _lightenHex(hex, amt) {
    return 'rgb(' + Math.min(255, parseInt(hex.slice(1,3),16)+amt) + ',' + Math.min(255, parseInt(hex.slice(3,5),16)+amt) + ',' + Math.min(255, parseInt(hex.slice(5,7),16)+amt) + ')';
  }

  return { init: init, draw: draw };
})();
</script>

<!-- ═══════════════════════════════════════════════════════════
     BOOTSTRAP — wires everything together
     (Replace this block when Module 1 engine.js is ready)
════════════════════════════════════════════════════════════ -->
<script>
  (function () {
    var canvas = document.createElement('canvas');
    canvas.width  = 800;
    canvas.height = 600;
    document.getElementById('game-container').appendChild(canvas);

    var ctx = canvas.getContext('2d');
    GameState.canvas = canvas;
    GameState.ctx    = ctx;

    // Stub Engine so UI buttons don't crash before Module 1 is integrated
    window.Engine = {
      reset: function () {
        GameState.score     = 0;
        GameState.detection = 0;
        GameState.player.inventory = [];
        GameState.player.x = 388;
        GameState.player.y = 500;
        Map.reset();
      }
    };

    Map.init();
    UI.init();

    function loop() {
      ctx.clearRect(0, 0, 800, 600);
      Map.draw(ctx);
      UI.draw(ctx);
      requestAnimationFrame(loop);
    }
    loop();
  })();
</script>
</body>
</html>
```
