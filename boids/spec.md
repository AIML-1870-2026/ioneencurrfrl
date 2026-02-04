# Code Quest · Boids

## 1 — Overview: What are "Boids," and what is emergent behavior?

Boids (Craig Reynolds, 1987) show how lifelike flocking can arise from simple local rules—no leader, no central plan. Each boid follows just three behaviors:

- **Separation** — don't crowd your neighbors
- **Alignment** — steer toward the average heading of nearby boids
- **Cohesion** — move toward the average position of nearby boids

From these tiny rules, **emergent behavior** appears: smooth flocks that split and rejoin, swirl, and "decide" where to go—without any bird knowing a global goal. This is a core idea in complex systems: **local interactions → global patterns**. You'll notice a few themes as you play:

- **Self-organization:** Order forms without a supervisor.
- **Phase changes:** Small parameter shifts (e.g., neighbor radius) can flip the whole system's behavior—calm → chaotic.
- **Tradeoffs:** Too much separation scatters the flock; too much cohesion clumps it; alignment smooths motion but can make the group sluggish.

---

## 2 — Starling Murmurations

A murmuration is a massive, fluid cloud of starlings that ripples, twists, and splits as if it were a single organism. No bird is "in charge." Instead, each starling follows simple local rules—keep some distance, match direction, and stay with the group—while reacting quickly to nearby neighbors. From those local interactions, the dramatic global shapes emerge.

### What's going on locally?

- **Separation** — avoid getting too close (no mid-air collisions).
- **Alignment** — match the direction/speed of nearby birds.
- **Cohesion** — steer toward the local center of your neighbors.
- **Limited attention** — track only a handful of nearest neighbors within a forward field of view.

### Why the shapes morph so fast

- **Information waves** — a sudden turn (e.g., predator) propagates neighbor-to-neighbor across the flock.
- **Edge dynamics** — the outer boundary continually re-forms as birds enter/exit local clusters.
- **Balance of forces** — small shifts in spacing/alignment flip the flock from sheets to swirls or branching "ribbons."

### Why starlings do this

- **Predator evasion** — coordinated motion confuses attackers.
- **Safety & foraging** — grouping helps locate roosts/food and reduces individual risk.
- **Efficiency** — matching nearby motion reduces wasted energy.

### Connect it to Boids

The same three rules (separation, alignment, cohesion) power the Boids mini-lab.

**Parameter intuition:**

- increase alignment → smoother sheets.
- increase cohesion → tighter clumps.
- increase separation → fragmentation.
- adjust neighbor radius → faster/slower "information" spread across the group.
- Field of view often looks more bird-like than 360° awareness.

### How to "read" your images

- Watch for **waves** (dark bands) traveling across the flock during turns.
- Check the **edge**: ripples vs. smooth outlines hint at the alignment/cohesion balance.
- Notice **splits/merges**: local rules scaling to flock-level reorganizations.
- **Try it:** In the demo, set a "High Alignment", then gradually increase separation. Watch sheets become ribbed and then fragment as spacing wins over cohesion.

---

## 3 — How this connects to LLM "intelligence"

Large Language Models (LLMs) also show emergent effects. At small scales, a model may only mimic phrases; at larger scales (more data/parameters), new abilities seem to "switch on" (e.g., multi-step reasoning, tool use with guidance). While the mechanisms differ—boids are agents in space and LLMs are giant neural networks—the rhyme is useful:

- **Local computations, global behavior:** Each neuron/attention head makes simple calculations on local signals; together, they create coherent text, plans, and explanations—much like simple boid rules create a flock.
- **Sensitivity to parameters and context:** In boids, neighbor radius or weights reshape behavior. In LLMs, temperature, top-p, system prompts, and examples reshape style, creativity, and reliability—small nudges, big outcomes.
- **No single "boss" for intelligence:** There isn't one neuron that "understands." Intelligence emerges from many parts coordinating—just as there's no single boid that leads the flock.

As you tune Boids, think of yourself as "prompting" a complex system: you set conditions and constraints, and watch global behavior emerge from simple local rules. That mindset will help you reason about LLMs, too—how to steer them, why they sometimes fail, and how small, well-chosen adjustments can unlock qualitatively new behavior.

---

## 4 — Boids Mini-Lab

**Main Task:** Turn the provided Boids demo into an interactive, insight-friendly mini-lab.

### You must add:

**Controls (UI):** Sliders or inputs for at least these five parameters:

- Separation weight
- Alignment weight
- Cohesion weight
- Neighbor radius
- Max speed (or max steering force)

**Presets:** Three buttons that snap the flock into distinct behaviors, for example:

- **Schooling** — high alignment, medium cohesion, low separation
- **Chaotic swarm** — low alignment, low cohesion, small neighbor radius
- **Tight cluster** — high cohesion, moderate separation

**Basic instrumentation:**

- On-screen readouts: FPS, boid count, average speed, and average neighbor count
- Reset and Pause/Resume controls

**UX polish:**

- Clear labels + tooltips for each control (plain English)
- Visible boundary rule (wrap or bounce) and a toggle to switch between them

### Stretch Challenge (choose any 3):

- **Perception cone:** Only consider neighbors within a forward field-of-view; compare to omnidirectional sensing.
- **Obstacle avoidance:** Add circular obstacles; boids must steer around them.
- **Leaders / predators:** Tag a leader boid to follow, or add a predator that boids try to evade.
- **Heterogeneous species:** Two flocks with different weights/radii; explore inter-flock dynamics.
- **Spatial partitioning:** Use a uniform grid (or quadtree) to cut neighbor checks from O(n²) to ~O(n); show FPS gains at 1k boids.
- **Web Workers:** Move the update loop off the main thread for smoother UI.
- **Live charting:** Plot average neighbor count, speed variance, or flock compactness over time.
- **Preset export:** Save current params to JSON and reload via a sharable URL query string.
- **Interaction toys:** Mouse attract/repel, click-to-spawn boids, or a "painted" obstacle field.
- **Trails & themes:** Add motion trails and a theming toggle (Minimal / Neon / Nature).

### Success Checklist

- Controls update behavior in real time and feel smooth.
- Presets feel meaningfully different (not tiny tweaks).
- Readouts are accurate and useful.
- Clear labels/tooltips; no mystery knobs.
