# Readable Explorer — Project Specification

## Overview

**Readable** is an interactive single-page web application that lets users explore how background color, text color, and font size affect readability on digital screens. It calculates and displays the WCAG contrast ratio in real time, includes a WCAG compliance indicator, and features a color blindness simulation sidebar so users can visualize how their chosen colors appear to people with various types of color vision deficiency.

---

## Visual Design

- **Theme:** Dark mode — deep charcoal/slate background (`#1a1a2e` or similar), with subtle panel borders and soft glow effects to separate UI sections
- **Typography:** Clean sans-serif font (e.g. Inter or system-ui)
- **Accent color:** A muted blue or teal for interactive elements (sliders, labels, active states)
- **Layout:** Dashboard — a large central preview area surrounded by control panels

---

## Layout

```
+---------------------------------------------------------------+
|                        Header / Title                         |
+-------------------+---------------------------+---------------+
|                   |                           |               |
|  Background Color |     TEXT PREVIEW AREA     |  Color Vision |
|  Controls         |                           |  Simulation   |
|                   |  [Heading Sample Text]    |  Sidebar      |
|  Text Color       |  [Body sample paragraph]  |               |
|  Controls         |                           |  (Radio       |
|                   |                           |   buttons)    |
|  Font Size        |                           |               |
|  Control          |                           |               |
|                   |                           |               |
+-------------------+---------------------------+---------------+
|  Contrast Ratio | Luminosity Values | WCAG Pass/Fail          |
+---------------------------------------------------------------+
```

- **Left panel:** Background color RGB controls, text color RGB controls, font size control
- **Center:** Live text preview area (heading + body text)
- **Right sidebar:** Color blindness simulation radio buttons
- **Bottom bar:** Contrast ratio, luminosity values, and WCAG compliance indicators

---

## Features

### 1. Background Color Controls

- Three sliders labeled **R**, **G**, **B** (range 0–255)
- Each slider is synchronized with an integer input field
  - Moving the slider updates the number field instantly
  - Typing in the number field updates the slider instantly
  - Input values are clamped to 0–255
- The background color of the preview area updates in real time

### 2. Text Color Controls

- Three sliders labeled **R**, **G**, **B** (range 0–255)
- Same synchronization behavior as background color controls
- The text color in the preview area updates in real time

### 3. Font Size Control

- A single slider (range: 10–72 px, default: 18 px)
- Synchronized with an integer display field (read-only or editable)
- Font size of the sample text in the preview area updates in real time

### 4. Text Preview Area

- Displays two text elements:
  - A **heading** (e.g. `<h2>`: "The Quick Brown Fox")
  - A **body paragraph** (e.g. "Good design is accessible design. The contrast between text and its background directly affects how readable content is for all users, including those with visual impairments.")
- Background color, text color, and font size all apply to this area
- Updates instantly as controls change
- When a color blindness simulation is active, the displayed colors are transformed accordingly

### 5. Contrast Ratio Display

- Displays the calculated WCAG contrast ratio between the current background and text colors
- Format: `X.XX:1` (e.g. `4.52:1`)
- Recalculates automatically whenever either color changes
- Located in the bottom info bar

### 6. Luminosity Displays

- Two labeled values in the bottom info bar:
  - **Background Luminance:** e.g. `0.216`
  - **Text Luminance:** e.g. `0.008`
- Update in real time alongside the contrast ratio

### 7. WCAG Compliance Indicator (Stretch — Option B)

Located in the bottom info bar alongside the contrast ratio and luminance values.

Displays two pass/fail badges:

| Badge | Threshold | Condition |
|---|---|---|
| Normal Text | 4.5:1 | Current font size < 24px |
| Large Text | 3:1 | Current font size >= 24px |

**Visual design:**
- **Pass:** Green background, white text, label "✓ PASS"
- **Fail:** Red background, white text, label "✗ FAIL"
- Both badges always visible; the relevant one (based on current font size) is visually emphasized
- Text labels ("Normal Text" / "Large Text") are always present so the indicator is accessible even without color perception
- Updates automatically whenever the contrast ratio or font size changes

---

## Contrast Ratio Calculation (WCAG)

Follow the WCAG 2.1 relative luminance formula:

### Step 1 — Linearize each RGB channel:
```
for each channel value c in [R, G, B]:
  c_sRGB = c / 255
  if c_sRGB <= 0.04045:
    c_linear = c_sRGB / 12.92
  else:
    c_linear = ((c_sRGB + 0.055) / 1.055) ^ 2.4
```

### Step 2 — Compute relative luminance:
```
L = 0.2126 * R_linear + 0.7152 * G_linear + 0.0722 * B_linear
```

### Step 3 — Compute contrast ratio:
```
ratio = (L_lighter + 0.05) / (L_darker + 0.05)
```
Where `L_lighter` is the higher luminance value and `L_darker` is the lower.

Display as `ratio.toFixed(2) + ":1"`

---

## Stretch Feature: Color Vision Simulation (Option A)

### Controls

Located in the **right sidebar**, a set of radio buttons labeled:

- Normal Vision (default)
- Protanopia (red-blind)
- Deuteranopia (green-blind)
- Tritanopia (blue-blind)
- Monochromacy (complete color blindness)

### Behavior

- When **Normal Vision** is selected: all controls are enabled, the preview renders colors exactly as chosen
- When **any simulation** is selected:
  - The left-panel color controls are **disabled** (grayed out with a note explaining why)
  - The preview area renders the **simulated version** of the chosen colors using color transformation matrices
  - The contrast ratio, luminance values, and WCAG pass/fail badges all update to reflect the simulated colors

### Color Transformation Matrices

Apply these matrices to linearized RGB values:

**Protanopia:**
```
[0.567, 0.433, 0.000]
[0.558, 0.442, 0.000]
[0.000, 0.242, 0.758]
```

**Deuteranopia:**
```
[0.625, 0.375, 0.000]
[0.700, 0.300, 0.000]
[0.000, 0.300, 0.700]
```

**Tritanopia:**
```
[0.950, 0.050, 0.000]
[0.000, 0.433, 0.567]
[0.000, 0.475, 0.525]
```

**Monochromacy:**
```
Convert to grayscale using luminance:
gray = 0.2126 * R + 0.7152 * G + 0.0722 * B
R = G = B = gray
```

---

## Synchronization Behavior Summary

| Action | Result |
|---|---|
| Move RGB slider | Number field updates immediately |
| Type in number field | Slider updates immediately |
| Any color change | Preview background/text color updates |
| Any color change | Contrast ratio recalculates |
| Any color change | Luminance values update |
| Any color change | WCAG pass/fail badges update |
| Font size slider moves | Preview font size updates |
| Font size slider moves | WCAG pass/fail badges update |
| Vision simulation selected | Preview shows transformed colors |
| Vision simulation selected | Color controls disabled |
| Vision simulation selected | Contrast ratio + WCAG badges reflect simulated colors |
| "Normal" selected | Color controls re-enabled |

---

## File Structure

```
readable/
└── index.html   # Single self-contained HTML file (internal CSS + JS, no frameworks)
```

---

## Deployment

- Push to a GitHub repository
- Enable GitHub Pages (Settings → Pages → deploy from `main` branch root)
- Live URL format: `https://[username].github.io/readable/`
