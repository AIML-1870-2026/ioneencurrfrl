# Enchanted Sprint — Game Design Specification

**Genre:** Endless Runner  
**Theme:** Fantasy Forest  
**Player Character:** Fox  
**Stretch Challenges:** Rhythm Runner, Boss Encounters, Multiplayer Ghost Racing

---

## 1. Overview

Enchanted Sprint is a side-scrolling endless runner set in a glowing, mystical forest. The player controls a sleek fox dashing through an enchanted woodland filled with fairy traps, swinging vines, and bouncing mushrooms. Celtic music drives the rhythm system, syncing obstacles to the beat. Every 60 seconds a forest boss appears. Players can race ghost replays of their previous best runs.

---

## 2. Visual Design

### Color Palette
- Background deep tones: `#0d1b2a` (midnight navy), `#1a2e1a` (dark forest green)
- Glowing accents: `#a8ff78` (mushroom glow), `#f9c784` (fairy light gold), `#c084fc` (magic purple)
- Ground: mossy dark green `#2d4a1e` with a faint glowing edge
- Fox: burnt orange `#e8611a` with white chest patch and black paws

### Parallax Background Layers (back to front)
1. **Sky layer** — deep midnight gradient with drifting stars/fireflies
2. **Distant tree silhouettes** — dark, barely visible towering ancient trees
3. **Mid-forest** — glowing mushroom clusters, hanging vines, mist wisps
4. **Near foliage** — fast-moving foreground leaves and ferns
5. **Ground** — mossy platform with subtle glow line at top edge

### HUD
- Top-left: Current score (glowing gold text)
- Top-right: High score
- Center-top: Rhythm accuracy indicator (pulse circle that lights up on beat)
- Bottom-left: Ghost indicator ("👻 Racing [Name]'s ghost" when active)
- Boss health bar appears at top-center during boss encounters (red, fantasy styled)

---

## 3. Player — The Fox

### Physics
- Runs automatically at a base speed that increases over time
- **Tap SPACE:** Short hop (~1.5x player height)
- **Hold SPACE:** Full jump (~3x player height, float at apex)
- Gravity: snappy on the way up, slightly floaty at apex, fast fall on descent
- Coyote time: 80ms grace window to jump after walking off a ledge
- Max 1 jump (no double jump)

### Animation States
| State | Description |
|---|---|
| Running | 4-frame leg cycle, ears back, tail streams |
| Anticipation | Slight crouch 80ms before jump (squash down) |
| Jump rising | Stretch vertically, ears up, tail droops |
| Jump apex | Slight float pose, ears sideways |
| Falling | Squash/stretch intensifies, legs tuck |
| Landing | Squash flat on impact, dust burst, then spring back |
| Death | Freeze 1 frame → screen shake → fox tumbles → particle burst → fade |

### Juice Effects on the Fox
- **Squash & Stretch:** Applied on jump, landing, and hit
- **Eyes:** Large expressive eyes. Follow jump direction (look up when rising, look down when falling). Widen on near-miss. Blink occasionally when running
- **Speed lines:** Faint horizontal streaks that intensify at high speeds
- **Trail:** Brief ghost-orange afterimage trail during fast movement

---

## 4. Hazards & Obstacles

### 4a. Fairy Traps 🌸
- Beautiful glowing pink/gold flower that pulses with light
- Appears on the ground; occasionally floats at mid-height
- **Behavior:** Pulses gently, looks harmless. On rhythm beat, emits a brief burst of sparkles as a warning. Stationary.
- **Pattern variants:** Single, double (gap between them), triple cluster
- **Death trigger:** Contact with petals

### 4b. Vine Whips 🌿
- Long green vine hanging from above, glowing faintly at the tip
- **Behavior:** Swings in a pendulum arc across the path. Timing matters — swing is synced to the music beat. Fox must jump over the low point or duck under the high point (future: add slide mechanic option)
- **Pattern variants:** Single vine, two vines offset by half-beat, vine + ground obstacle combo
- **Death trigger:** Contact with vine body

### 4c. Bouncing Mushrooms 🍄
- Chunky red-capped mushroom with white spots, glowing rim
- **Behavior:** Hops up and down rhythmically in sync with the music beat. At the beat peak it's at max height; at the valley it's flat on the ground (safe to run through gap)
- **Pattern variants:** Single bouncer, two bouncers at different beat phases (out of sync), mushroom + fairy trap combo
- **Death trigger:** Contact with mushroom cap when raised

---

## 5. Pattern Library (Obstacle Chunks)

Each chunk is a guaranteed-completable sequence. The game randomly sequences these chunks with valid transitions.

| # | Name | Description |
|---|---|---|
| 1 | **Solo Fairy** | Single fairy trap on ground, wide gap before and after |
| 2 | **Double Fairy** | Two fairy traps with a clear jump gap between them |
| 3 | **Mushroom Solo** | One bouncing mushroom, timed to jump over at beat |
| 4 | **Vine Crossing** | Single vine swing, jump required at beat |
| 5 | **Fairy + Vine** | Fairy trap then immediately vine whip — jump clears both |
| 6 | **Mushroom Pair (phased)** | Two mushrooms offset by half beat — hop-hop rhythm |
| 7 | **Triple Fairy** | Three fairies in tight cluster, single large jump clears all |
| 8 | **Vine + Mushroom** | Vine followed by bouncing mushroom — two-beat sequence |
| 9 | **Platform Hop** | Elevated platform segment — jump up, run across, jump down |
| 10 | **Near Miss Alley** | Two fairy traps with barely-clearable gaps — tests precision |
| 11 | **Empty Stretch** | Brief clear section — breathing room, lets player recover |
| 12 | **Rhythm Burst** | 4 obstacles each on a beat — pure rhythm challenge (late game) |

**Transition Rules:**
- Every chunk ends with ≥ 0.8s of clear ground
- Chunks are sorted into difficulty tiers (Easy: 1,3,11 | Medium: 2,4,5,6,9 | Hard: 7,8,10,12)
- Early game: only Easy chunks. Medium unlocks at 30s. Hard unlocks at 90s.

---

## 6. Rhythm Runner System 🎵

### Music
- **Style:** Mystical Celtic — live flute, harp arpeggios, bodhran drum beat
- **Tempo:** 120 BPM (0.5s per beat)
- **Tracks:** 3 tracks that crossfade as speed/intensity increases
  - Track 1 (0–60s): Gentle harp and flute, sparse percussion
  - Track 2 (60–120s): Adds bodhran drum and low strings
  - Track 3 (120s+): Full ensemble with driving rhythm, adds electric touches

### Beat System
- Beat timestamps are manually defined for each music track
- Obstacles are spawned at beat-aligned times based on screen travel distance
- Vine swings and mushroom bounces are visually synchronized to the beat

### Scoring
- **Base score:** +1 per meter traveled
- **On-beat jump bonus:** +50 points if jump input lands within ±80ms of a beat
- **Near-miss bonus:** +25 points if obstacle passes within 20px without collision
- **Combo multiplier:** Consecutive on-beat jumps stack a 1.1x multiplier (max 3x)
- **Rhythm accuracy grade:** Shown on game over screen (S / A / B / C)

### Visual Feedback
- Beat pulse ring radiates from fox on each beat
- HUD rhythm indicator flashes gold on beat
- "PERFECT!" / "GOOD!" / "MISS!" text appears on jump timing (floating, fades fast)

---

## 7. Difficulty Progression

| Time | Speed Multiplier | Chunk Pool | Notes |
|---|---|---|---|
| 0–30s | 1.0x | Easy only | Tutorial feel, wide gaps |
| 30–60s | 1.2x | Easy + Medium | Rhythm starts mattering |
| 60–90s | 1.4x | Medium dominant | First boss at 60s |
| 90–120s | 1.6x | Medium + Hard | Music shifts to Track 3 |
| 120s+ | 1.8x → 2.5x cap | All chunks | Max speed reached at 180s |

---

## 8. Boss Encounters 👹

A boss appears every 60 seconds of survival. Boss encounter pauses normal chunk generation.

### Boss 1: The Fairy Queen (60s)
- Giant fairy floats above the path, raining sparkle projectiles
- **Phase:** 15 seconds long
- **Pattern:** Projectiles drop on beats — dodge by timing jumps
- **Victory:** Survive 15s → boss retreats, brief fanfare, score bonus +500

### Boss 2: The Vine Titan (120s)
- Enormous vine serpent weaves across the screen
- **Pattern:** Body segments cross at different heights, must jump through gaps
- **Victory:** Survive 20s → score bonus +1000

### Boss 3: The Mushroom King (180s)
- Giant mushroom hops toward the player
- **Pattern:** Shockwave on landing (must jump), spore clouds (must duck — add crouch mechanic for this boss only)
- **Victory:** Survive 25s → score bonus +1500

### Boss UI
- Boss health bar at top of screen (time-based, drains as you survive)
- Dramatic music sting on boss appearance
- Screen darkens slightly, boss theme plays over background music
- Boss name card slides in at start of encounter

---

## 9. Multiplayer Ghost Racing 👻

### How It Works
- After each run, the full run is recorded as a ghost (position + animation state at each frame, stored in localStorage)
- Up to 5 ghosts stored (most recent best scores)
- On game start, player can choose to race a ghost (shown as semi-transparent blue fox)
- Ghost fox runs alongside with a nametag ("Your best — 847m")

### Ghost Data Per Frame (stored at 30fps)
- x position (always same, speed-based), y position, animation state, score at that moment

### Visual
- Ghost fox: semi-transparent blue tint, slight shimmer
- "👻 You're ahead!" / "👻 Ghost is ahead!" indicator updates in real time
- At game over: comparison screen shows your score vs ghost score

### Storage
- Use `localStorage` key `enchanted_sprint_ghosts`
- Store as JSON array of run objects: `{ score, date, frames: [...] }`

---

## 10. Juice Effects Summary

| Effect | Trigger | Details |
|---|---|---|
| Squash & Stretch | Jump / Land | Fox compresses on land, stretches on rise |
| Screen Shake | Death, Boss hit | 200ms shake on death, 100ms on boss |
| Dust Particles | Landing | 6–8 small dust puffs spray left on landing |
| Death Particles | Death | Fox bursts into 12 orange particles + sparkles |
| Speed Lines | High speed | Horizontal streaks, opacity tied to speed |
| Beat Pulse | Every beat | Ring radiates from fox |
| Fairy Sparkles | Fairy beat warning | Sparkle burst 1 beat before hazard |
| Combo Flash | Combo milestone | Brief golden flash on fox at 3x, 5x, 10x combo |
| Freeze Frame | Death | 3-frame freeze before death animation |
| Boss Entrance | Boss spawn | Screen flash, camera zoom-out slightly |

---

## 11. UI Screens

### Start Screen
- Title: "Enchanted Sprint" in glowing gold Celtic-style font
- Animated fox running in place in background forest scene
- Buttons: "Run!" / "Ghost Races" / "How to Play"
- Ambient music plays softly

### Game Over Screen
- Fox tumble animation plays once
- Score displayed with animation (counting up)
- Rhythm accuracy grade (S/A/B/C) shown
- High score highlighted if beaten
- Ghost comparison if racing a ghost
- Buttons: "Try Again" / "Race Your Ghost" / "Main Menu"

### Pause Screen (ESC)
- Dim overlay, "PAUSED" text
- Resume / Restart / Main Menu buttons

---

## 12. Audio

| Sound | Trigger |
|---|---|
| Jump (short) | Tap jump — light Celtic harp pluck |
| Jump (full) | Hold jump — fuller harp chord |
| Land | Soft thud + leaf rustle |
| Death | Dramatic sting + tumble crunch |
| On-beat jump | Satisfying chime/bell tone |
| Near miss | Whoosh sound |
| Combo milestone | Rising arpeggio |
| Boss appear | Dramatic horn stab |
| Boss defeat | Victory fanfare |
| Fairy warning | Tinkling sparkle sound |

---

## 13. High Score Persistence

- Use `localStorage` key `enchanted_sprint_highscore`
- Store: `{ score: number, date: string, rhythmGrade: string }`
- Display on start screen and game over screen

---

## 14. Technical Notes

- **Engine:** Vanilla JavaScript + HTML5 Canvas (single `.html` file)
- **Target resolution:** 800×400px canvas, scales to window width
- **Frame rate:** 60fps using `requestAnimationFrame`
- **Audio:** Web Audio API for beat detection timing + Howler.js or `<audio>` elements for SFX
- **No external game engine** — pure canvas drawing
- **Particle system:** Simple array of particle objects updated each frame
- **Asset approach:** All graphics drawn procedurally with Canvas 2D API (no image files needed)

---

## 15. Deployment

- Single `index.html` file
- Deploy to GitHub Pages from main branch
- URL format: `https://[username].github.io/enchanted-sprint/`
