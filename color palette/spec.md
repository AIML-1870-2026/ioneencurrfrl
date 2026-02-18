# RGB Color Studio — Project Specification

## Overview

RGB Color Studio is a dark-themed, single-page interactive web application that teaches users how RGB color mixing works through two side-by-side tools. On the left, a **Stage Spotlight Explorer** lets users drag three colored spotlights (red, green, blue) around a dark stage and watch them blend together in real time, with sliders offering precise control over each primary's intensity. On the right, a **Palette Generator** takes the mixed color from the explorer and generates harmonious color schemes with accessibility awareness. The overall aesthetic is cinematic and moody — a dark stage with vivid glowing light.

---

## Features

- Three draggable RGB spotlights on a dark canvas that blend additively where they overlap
- Intensity sliders (0–255) for each primary color, synced with the spotlight positions
- Live display of the resulting mixed color with its hex code and RGB values
- Palette Generator supporting Complementary and Split-Complementary harmony types
- Palette swatches animate in one-by-one when generated
- "Random Color" button to generate a surprise base color and palette
- Accessible Palette Mode that checks all palette colors against WCAG AA contrast requirements and flags or replaces any that fail
- Hex code display on each palette swatch

---

## Layout

The page is a single full-width view divided into two equal panels side by side, with no tabs or scrolling needed on desktop:

- **Left panel:** Stage Spotlight Explorer (canvas + sliders below)
- **Right panel:** Palette Generator (controls + animated swatches)

A thin glowing divider separates the two panels. A minimal header at the top displays the app title. The page uses a dark background (`#0a0a0f`) throughout.

---

## Explorer Details

### Visual Metaphor
A black stage/theater environment. Three circular spotlight glows — one red, one green, one blue — float above the stage floor. Where they overlap, their light blends additively (red + green = yellow, etc.). The overall effect should feel like real theatrical lighting.

### Controls
- Each spotlight is draggable anywhere within the canvas
- Below the canvas: three labeled sliders (Red, Green, Blue), each 0–255
- Moving a slider changes that spotlight's intensity/brightness, not its position
- Dragging a spotlight does not change its slider value — the two axes are independent
- A color swatch below the sliders shows the currently mixed color with its hex and RGB values displayed underneath

### Animations
- Spotlights have a soft radial gradient glow with a subtle pulse/breathing animation when not being dragged
- Blending regions smoothly update as spotlights move (using canvas `globalCompositeOperation: 'screen'` or equivalent)
- Smooth CSS transitions on the result swatch when the color changes
- When a spotlight is grabbed, its glow intensifies slightly to indicate it's active

### Technical Notes
- Use HTML5 `<canvas>` for the spotlight rendering
- Draw each spotlight as a radial gradient with the primary color fading to transparent
- Use `globalCompositeOperation = 'screen'` on the canvas context for additive blending
- Spotlight intensity (slider value) maps to the alpha/opacity of the gradient

---

## Palette Generator Details

### Harmony Types
Two harmony modes selectable via toggle buttons:
1. **Complementary** — base color + the color directly opposite on the RGB wheel (180° offset in HSL hue)
2. **Split-Complementary** — base color + two colors adjacent to its complement (±30° from the complement)

### Base Color Source
The base color is automatically pulled from the Explorer's current mixed color. There is also a "Random Color" button that generates a random hue at full saturation and sets both the palette and the explorer sliders accordingly.

### Palette Display
- Each palette is shown as a row of large color swatches (min 80px × 120px each)
- Swatches animate in one by one with a fade + slide-up transition when the palette updates
- Each swatch displays its hex code below it in a small monospace font
- Clicking a swatch copies the hex code to clipboard; a brief "Copied!" tooltip confirms it

### Accessible Palette Mode
- A toggle labeled "Accessible Mode" appears above the palette
- When enabled, each swatch pair is checked for WCAG AA contrast ratio (minimum 4.5:1 for normal text)
- Swatches that fail contrast are outlined with a warning indicator (⚠️ icon + red border)
- A small text label shows the contrast ratio for each swatch: e.g., `Contrast: 3.2:1 ✗` or `Contrast: 5.8:1 ✓`
- Uses the WCAG relative luminance formula: `(L1 + 0.05) / (L2 + 0.05)` where luminance = `0.2126*R + 0.7152*G + 0.0722*B` (after linearizing sRGB values)

---

## Interactions

| Action | Result |
|---|---|
| Drag a spotlight | Spotlight moves; blended color in canvas updates in real time |
| Move a slider | That spotlight's intensity updates; mixed color swatch updates |
| Click "Random Color" | Random hue generated; sliders and explorer update; new palette animates in |
| Click Complementary / Split-Complementary toggle | Palette recalculates and re-animates with new swatches |
| Toggle "Accessible Mode" | Each swatch immediately shows contrast ratio and pass/fail indicator |
| Click a palette swatch | Hex code copied to clipboard; "Copied!" tooltip appears for 1.5s |

---

## Visual Style

| Element | Value |
|---|---|
| Background | `#0a0a0f` (near black) |
| Panel backgrounds | `#12121a` |
| Dividers / borders | Subtle glow in the dominant mixed color, `1px` |
| Font | `'Inter'` or `'Space Grotesk'` from Google Fonts |
| Hex/code labels | Monospace: `'JetBrains Mono'` or `'Fira Code'` |
| Slider track | Dark gray with a glowing fill in the slider's primary color |
| Slider thumb | White circle with a subtle drop shadow |
| Swatch animation | `opacity 0 → 1` + `translateY(10px → 0)` staggered by 80ms per swatch |
| Button style | Pill-shaped, dark fill, glowing border in current accent color |
| Contrast pass indicator | Green checkmark `✓` |
| Contrast fail indicator | Red warning `⚠` with red outline on swatch |

---

## Technical Notes

- Single `index.html` file with embedded `<style>` and `<script>` — no build step required
- No external libraries needed; pure vanilla HTML/CSS/JavaScript
- Canvas spotlight blending: use `globalCompositeOperation = 'screen'` for additive light mixing
- HSL color space for palette math: convert mixed RGB → HSL, rotate hue, convert back to RGB
- WCAG luminance: linearize each channel with `c <= 0.04045 ? c/12.92 : ((c+0.055)/1.055)^2.4` before weighting
- Clipboard API: `navigator.clipboard.writeText(hex)` with fallback to `document.execCommand('copy')`
- CSS custom properties for the accent/glow color so it can update dynamically as the mixed color changes
- Responsive: on screens narrower than 768px, stack panels vertically instead of side by side
