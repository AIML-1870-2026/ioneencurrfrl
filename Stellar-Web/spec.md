# Stellar Web - Specification

## Overview
A particle system animation that creates an interactive "stellar web" effect. Particles float across the canvas and form connections with nearby particles, creating a network visualization. Users can interact with the animation using their mouse and customize various attributes through a control panel.

## Features

### Particle System
- Particles spawn at random positions across the canvas
- Each particle moves in a random direction at a configurable speed
- Particles bounce off canvas edges
- Particles are rendered as filled circles

### Connection Lines
- Lines are drawn between particles within a configurable distance
- Line opacity fades based on distance (closer = more opaque)
- Creates a dynamic "web" or "constellation" effect

### Mouse Interaction
- Particles within the mouse attraction radius are pulled toward the cursor
- Connection lines are drawn from nearby particles to the mouse position
- Attraction strength decreases with distance

## Controls

| Control | Range | Default | Description |
|---------|-------|---------|-------------|
| Particle Count | 20 - 400 | 150 | Number of particles on screen |
| Connection Distance | 50 - 250 px | 120 | Maximum distance for particle connections |
| Particle Speed | 0.1 - 3.0 | 1.0 | Movement speed multiplier |
| Particle Size | 1 - 6 px | 2 | Radius of each particle |
| Line Width | 0.2 - 3.0 px | 0.8 | Thickness of connection lines |
| Mouse Attraction | 0 - 300 px | 150 | Radius of mouse interaction (0 = disabled) |
| Particle Color | Color picker | #ff7eb8 | Color of particles |
| Line Color | Color picker | #a54a6f | Color of connection lines |

## Technical Details

### Canvas
- Full-screen responsive canvas
- Dark background (#0a0a1a)
- Motion blur effect via semi-transparent fill each frame

### Animation Loop
1. Clear canvas with semi-transparent overlay (creates trail effect)
2. Calculate and draw connection lines between nearby particles
3. Draw connection lines to mouse (if within range)
4. Update particle positions
5. Draw particles
6. Request next animation frame

### Particle Class
```
Properties:
- x, y: Current position
- vx, vy: Current velocity
- baseVx, baseVy: Base velocity (for speed multiplier)

Methods:
- update(): Apply velocity, mouse attraction, edge bouncing
- draw(): Render particle on canvas
```

## UI Components

### Control Panel
- Fixed position (top-right)
- Glassmorphism styling with blur effect
- Collapsible via toggle button
- Real-time value display for each slider

### Color Scheme (Pink Theme)
- Primary: #ff7eb8
- Secondary: #a54a6f
- Accent: #ffa0c4
- Background: #0a0a1a

## Browser Support
- Modern browsers with Canvas API support
- Requires JavaScript enabled
- Best performance in Chrome/Edge (Chromium-based)
