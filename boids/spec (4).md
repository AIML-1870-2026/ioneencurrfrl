# Pink Boids — Mini-Lab spec.md

## Project Overview
An interactive browser-based Boids flocking simulation demonstrating emergent behavior through three simple rules: **Separation**, **Alignment**, and **Cohesion**. Built as a single HTML file with a control panel on the left and a full-height canvas on the right. Themed in pink/purple psychedelic aesthetic by default, with additional theme options.

---

## Emergent Behavior Concept
Boids simulate flocking behavior (birds, fish, insects) using only three local rules per agent:
1. **Separation** — avoid crowding nearby flockmates
2. **Alignment** — steer toward average heading of neighbors
3. **Cohesion** — move toward the center of nearby flockmates

Complex, realistic flocking emerges naturally from these simple individual rules — no central controller, no blueprint required.

---

## Visual Themes (3 Total)

### Default: Pink / Psychedelic
- Background: `#120018` (near-black deep purple)
- Panel: `#1a0022`
- Border: `#3a1050`
- Text: `#e8d0f0` (soft lavender)
- Accent: `#ff5fa2` (hot pink)
- Accent 2: `#c74eff` (electric purple)
- Slider track: `#2a1038`
- Button bg: `#2a1038`
- Button hover: `#3d1850`

### Nature Theme
- Background: `#0a1a0a` (deep forest green)
- Accent: `#44cc66` (bright green)
- Accent 2: `#22aa88` (teal)
- Text: `#c0e8c0`

### Minimal Theme
- Background: `#111111`
- Accent: `#ffffff`
- Accent 2: `#888888`
- Text: `#cccccc`

**Theme switching**: Three theme buttons in the control panel. Active theme applies CSS class to `<body>` using CSS custom properties (`--bg`, `--accent`, etc.).

---

## Layout

```
┌──────────────────┬──────────────────────────────────────┐
│  CONTROL PANEL   │                                      │
│  (280px fixed)   │         CANVAS (flex: 1)             │
│                  │         Full height, full width      │
│  - Readouts      │         Boids simulation             │
│  - Core Rules    │         Mouse interaction circle     │
│  - Perception    │                                      │
│  - Trail         │                                      │
│  - Boid Count    │                                      │
│  - Boundary      │                                      │
│  - Mouse         │                                      │
│  - Presets       │                                      │
│  - Themes        │                                      │
│  - Transport     │                                      │
└──────────────────┴──────────────────────────────────────┘
```

- `overflow: hidden` on body (no scrollbars on canvas)
- Panel scrolls internally if content overflows
- Canvas resizes on window resize (boid positions clamped)

---

## Control Panel Sections

### 1. Readouts (Live Stats)
Real-time display updated every frame:
- **FPS** — frames per second (calculated every 500ms)
- **Boids** — current boid count
- **Avg Speed** — average speed across all boids (1 decimal)
- **Avg Neighbors** — average neighbor count per boid (1 decimal)

---

### 2. Core Rules (Sliders)
All sliders show live value next to label. Hover shows tooltip explaining the parameter.

| Parameter | ID | Min | Max | Step | Default | Description |
|---|---|---|---|---|---|---|
| Separation | `r-sep` | 0 | 5 | 0.1 | 1.5 | Avoid crowding nearby flockmates |
| Alignment | `r-ali` | 0 | 5 | 0.1 | 1.0 | Steer toward average heading of neighbors |
| Cohesion | `r-coh` | 0 | 5 | 0.1 | 1.0 | Move toward center of nearby flockmates |
| Neighbor Radius | `r-rad` | 10 | 200 | 1 | 50 | Perception range in pixels |
| Max Speed | `r-spd` | 1 | 12 | 0.5 | 4 | Top speed per boid |
| Max Force | `r-frc` | 0.01 | 1 | 0.01 | 0.2 | Max steering force per frame |

---

### 3. Perception
| Parameter | ID | Min | Max | Step | Default | Description |
|---|---|---|---|---|---|---|
| FOV (degrees) | `r-fov` | 30 | 360 | 10 | 360 | Field of view. 360 = omnidirectional. Lower = forward-only cone (more bird-like) |

---

### 4. Trail Length
| Parameter | ID | Min | Max | Step | Default | Description |
|---|---|---|---|---|---|---|
| Trail Length | `r-trail` | 0 | 40 | 1 | 0 | Motion trail behind each boid. 0 = no trail |

---

### 5. Boid Count
| Parameter | ID | Min | Max | Step | Default | Description |
|---|---|---|---|---|---|---|
| Boid Count | `r-cnt` | 10 | 500 | 10 | 150 | Number of boids. Dynamically adds/removes boids without full respawn |

---

### 6. Boundary Behavior
Two toggle buttons (one active at a time):
- **Wrap** (`btn-wrap`) — boids wrap around edges (toroidal space) *(default)*
- **Bounce** (`btn-bounce`) — boids reflect off edges

---

### 7. Mouse Interaction
Three toggle buttons (one active at a time):
- **None** (`mi-none`) — mouse has no effect *(default)*
- **Attract** (`mi-attract`) — boids steer toward mouse (green circle indicator, `rgba(100,255,100,0.15)`)
- **Repel** (`mi-repel`) — boids flee from mouse (red circle indicator, `rgba(255,100,100,0.15)`)

Mouse interaction radius: **150px** (shown as circle on canvas when active and mouse is in canvas)

---

### 8. Presets
Three preset buttons that set multiple sliders at once:

**School of Fish** (`pre-school`):
- Sep: 0.8, Ali: 3.5, Coh: 1.5, Radius: 75, Speed: 4, Force: 0.2

**Chaos** (`pre-chaos`):
- Sep: 1.0, Ali: 0.3, Coh: 0.3, Radius: 25, Speed: 6, Force: 0.4

**Tight Flock** (`pre-tight`):
- Sep: 1.2, Ali: 0.8, Coh: 4.0, Radius: 80, Speed: 3, Force: 0.15

---

### 9. Themes
Three theme buttons:
- **Pink** (default, no class on body)
- **Nature** (adds class `theme-nature` to body)
- **Minimal** (adds class `theme-minimal` to body)

Active button gets `.active` class styling.

---

### 10. Transport Controls
- **Pause / Resume** (`btn-pause`) — toggles simulation pause. Button text switches between "Pause" and "Resume"
- **Reset** (`btn-reset`) — respawns all boids at random positions. Also unpauses if paused.

---

## Boid Implementation

### Class: `Boid`
**Properties:**
- `x`, `y` — position
- `vx`, `vy` — velocity (random initial direction, speed 2–4)
- `trail` — array of `{x, y}` positions (max length = `P.trailLen`)
- `neighborCount` — updated each frame for stats

**Methods:**

#### `flock(boids)`
Applies the three core rules by scanning all other boids within `P.radius` and within FOV cone:
- **Separation**: Steer away from boids that are too close (< `P.radius * 0.4`)
- **Alignment**: Average velocity of neighbors, normalized and scaled by `P.ali`
- **Cohesion**: Steer toward center of mass of neighbors, scaled by `P.coh`

Each steering vector is limited to `P.maxForce`. FOV check uses dot product of velocity vs. offset vector, compared against `cos(fov/2)`.

#### `applyMouse()`
If `P.mouse !== 'none'` and mouse is within 150px:
- **Attract**: Add force toward mouse
- **Repel**: Add force away from mouse
- Force magnitude: `0.5`

#### `update()`
- Add velocity to position
- Limit speed to `P.maxSpeed`
- Apply boundary behavior (wrap or bounce)
- Update trail array (push current position, trim to `P.trailLen`)

**Wrap**: Position modulo canvas dimensions (with toroidal neighbor detection in flock)

**Bounce**: Reflect velocity component when hitting edge within 20px margin

#### `draw(ctx, color, trailColor)`
- Draw trail as polyline (skip segments that wrap across canvas)
- Trail: `globalAlpha = 0.3`, `lineWidth = 1`
- Draw boid as filled triangle pointing in velocity direction
- Triangle size: 6px, shape: forward tip at `(size, 0)`, back corners at `(-size*0.6, ±size*0.45)`

#### `speed()`
Returns `Math.sqrt(vx² + vy²)`

---

## Simulation Parameters Object `P`

```javascript
const P = {
  sep: 1.5,        // Separation weight
  ali: 1.0,        // Alignment weight
  coh: 1.0,        // Cohesion weight
  radius: 50,      // Neighbor detection radius (px)
  maxSpeed: 4,     // Maximum boid speed
  maxForce: 0.2,   // Maximum steering force
  fov: 360,        // Field of view (degrees)
  trailLen: 0,     // Trail length (frames)
  count: 150,      // Number of boids
  boundary: 'wrap',// 'wrap' or 'bounce'
  mouse: 'none'    // 'none', 'attract', or 'repel'
}
```

---

## Rendering

### Main Loop (`requestAnimationFrame`)
Each frame (when not paused):
1. Clear canvas with theme background color
2. Draw mouse interaction circle (if active and mouse in canvas)
3. `flock()` all boids
4. `applyMouse()` all boids
5. `update()` all boids
6. `draw()` all boids
7. Update FPS counter (every 500ms)
8. Update stats display

### Themes Object
```javascript
const THEMES = {
  '':             { bg: '#120018', boid: '#ff5fa2', trail: '#c74eff' },
  'theme-nature': { bg: '#0a1a0a', boid: '#44cc66', trail: '#22aa88' },
  'theme-minimal':{ bg: '#111111', boid: '#ffffff', trail: '#888888' }
}
```

---

## Tooltip System
Any element with `data-tip="..."` attribute shows a tooltip on hover:
- Appears below the element
- Width: 220px
- Dark background, light text
- Fades in with CSS `opacity` transition (0.2s)
- Implemented purely in CSS using `::after` pseudo-element

---

## Performance Notes
- Boid neighbor detection is O(n²) — runs fine up to ~500 boids
- FPS counter averaged over 500ms windows
- Trail rendering skips segments that wrap across the canvas (avoids long diagonal lines)
- Boid count slider dynamically adds/removes boids (no full respawn needed)

---

## File Structure
```
/
└── index.html    (All HTML, CSS, and JavaScript in one file)
```

---

## Technical Requirements
- Vanilla JavaScript (no libraries/frameworks)
- HTML5 Canvas API
- CSS custom properties for theming
- Single file — no build step required
- Desktop browser optimized
- Responsive canvas (resizes with window)

---

## Deployment
- Ready for GitHub Pages as-is (single `index.html`)
- No dependencies, no build step
- Works offline
