# Meal Plan Zero — Title Page (Module 5)

## Overview

The title page is rendered by `_drawStartScreen(ctx)` inside `js/ui.js`.
It appears when `GameState.phase === 'start'` and fills nearly the full 800×600 canvas.

**Layout:**
- Full-canvas dark panel (760×570, 20px margins)
- Animated pulsing title + tagline
- Three equal columns: Objective | Controls | Legend
- START GAME button centered at the bottom

---

## Helper: `_drawSectionHeader`

Used by all three columns to draw a colored header bar with a left accent stripe.
Place this inside the `window.UI` IIFE alongside the other private helpers.

```javascript
function _drawSectionHeader(ctx, label, x, y, w, color, bgColor) {
  ctx.fillStyle   = bgColor;
  _rr(ctx, x, y, w, 23, 4); ctx.fill();
  ctx.fillStyle   = color;
  _rr(ctx, x, y, 3, 23, 2); ctx.fill();
  ctx.strokeStyle = 'rgba(200,200,200,0.12)';
  ctx.lineWidth   = 1;
  ctx.beginPath(); ctx.moveTo(x + 3, y + 23); ctx.lineTo(x + w, y + 23); ctx.stroke();
  ctx.fillStyle   = color;
  ctx.font        = 'bold 12px sans-serif';
  ctx.textAlign   = 'left';
  ctx.fillText(label, x + 10, y + 16);
}
```

---

## Main Function: `_drawStartScreen`

```javascript
function _drawStartScreen(ctx) {
  var bx = 20, by = 15, bw = 760, bh = 570;
  _drawOverlay(ctx);
  _drawPanel(ctx, bx, by, bw, bh);

  var cx = bx + bw / 2;

  // ── Animated title ──────────────────────────────────────────────────────
  var pulse = 0.22 + 0.14 * Math.sin(_time * 0.04);
  ctx.shadowColor = 'rgba(255,255,255,' + pulse + ')';
  ctx.shadowBlur  = 24;
  ctx.fillStyle   = '#ffffff';
  ctx.font        = 'bold 46px serif';
  ctx.textAlign   = 'center';
  ctx.fillText('MEAL PLAN ZERO', cx, by + 62);
  ctx.shadowBlur  = 0;

  ctx.fillStyle = 'rgba(160,130,100,0.85)';
  ctx.font      = 'italic 13px serif';
  ctx.fillText("Your meal plan ran out.  You're hungry.  The dining hall is open.", cx, by + 83);

  // Gradient title divider
  var dg = ctx.createLinearGradient(bx + 30, 0, bx + bw - 30, 0);
  dg.addColorStop(0,   'rgba(255,255,255,0)');
  dg.addColorStop(0.35,'rgba(255,255,255,0.18)');
  dg.addColorStop(0.65,'rgba(255,255,255,0.18)');
  dg.addColorStop(1,   'rgba(255,255,255,0)');
  ctx.strokeStyle = dg;
  ctx.lineWidth   = 1;
  ctx.beginPath(); ctx.moveTo(bx + 30, by + 96); ctx.lineTo(bx + bw - 30, by + 96); ctx.stroke();

  // ── Three-column layout ─────────────────────────────────────────────────
  var col1x = bx + 42,  col1w = 212;
  var col2x = bx + 278, col2w = 220;
  var col3x = bx + 522, col3w = 216;
  var colTop = by + 108;

  // Column separators
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth   = 1;
  [bx + 270, bx + 514].forEach(function (sx) {
    ctx.beginPath(); ctx.moveTo(sx, by + 102); ctx.lineTo(sx, by + 486); ctx.stroke();
  });

  // ── OBJECTIVE ───────────────────────────────────────────────────────────
  _drawSectionHeader(ctx, '🎯  OBJECTIVE', col1x, colTop, col1w, '#ffcc44', 'rgba(255,204,68,0.14)');

  ctx.fillStyle = '#bbbbbb';
  ctx.font      = '12px sans-serif';
  ctx.textAlign = 'left';
  [
    'You snuck out at midnight —',
    'meal plan: empty,',
    'stomach: very loud.',
    '',
    'Sneak through the dining hall.',
    'Grab as much food as you can.',
    'Reach the glowing EXIT before',
    'the staff catches you.',
    '',
    'More items = more points.',
    'Survive more rounds to win.',
  ].forEach(function (line, i) {
    if (line) ctx.fillText(line, col1x + 6, colTop + 36 + i * 18);
  });

  // ── CONTROLS ────────────────────────────────────────────────────────────
  _drawSectionHeader(ctx, '🎮  CONTROLS', col2x, colTop, col2w, '#44aaff', 'rgba(68,170,255,0.12)');

  [
    { key: 'W A S D',  desc: 'Move around'      },
    { key: '↑ ↓ ← →',  desc: 'Move around'      },
    { key: 'Shift',    desc: 'Crouch — stealth' },
    { key: 'E',        desc: 'Grab nearby food' },
  ].forEach(function (c, i) {
    var ky = colTop + 36 + i * 38;
    ctx.fillStyle   = 'rgba(255,255,255,0.09)';
    _rr(ctx, col2x + 2, ky - 14, 88, 22, 4); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth   = 1;
    _rr(ctx, col2x + 2, ky - 14, 88, 22, 4); ctx.stroke();
    ctx.fillStyle   = '#eeeeee';
    ctx.font        = 'bold 11px monospace';
    ctx.textAlign   = 'center';
    ctx.fillText(c.key, col2x + 46, ky + 1);
    ctx.fillStyle   = '#999999';
    ctx.font        = '11px sans-serif';
    ctx.textAlign   = 'left';
    ctx.fillText(c.desc, col2x + 96, ky + 1);
  });

  // Tip box
  var tipY = colTop + 36 + 4 * 38 + 8;
  ctx.fillStyle   = 'rgba(68,170,255,0.07)';
  _rr(ctx, col2x, tipY, col2w - 4, 54, 5); ctx.fill();
  ctx.strokeStyle = 'rgba(68,170,255,0.2)';
  ctx.lineWidth   = 1;
  _rr(ctx, col2x, tipY, col2w - 4, 54, 5); ctx.stroke();
  ctx.fillStyle   = '#44aaff';
  ctx.font        = 'bold 10px sans-serif';
  ctx.textAlign   = 'left';
  ctx.fillText('💡  TIP', col2x + 10, tipY + 16);
  ctx.fillStyle   = '#777777';
  ctx.font        = '10px sans-serif';
  ctx.fillText('Crouching dramatically reduces', col2x + 10, tipY + 31);
  ctx.fillText('how fast workers detect you.', col2x + 10, tipY + 44);

  // ── LEGEND ──────────────────────────────────────────────────────────────
  _drawSectionHeader(ctx, '📖  LEGEND', col3x, colTop, col3w, '#ff8855', 'rgba(255,136,85,0.12)');

  var legY = colTop + 36;

  // Detection meter mini-preview
  ctx.fillStyle = '#bbbbbb';
  ctx.font      = 'bold 10px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Detection Meter', col3x + 4, legY);
  var bx2 = col3x + 4, by2 = legY + 5, bw2 = col3w - 14, bh2 = 13;
  var mg = ctx.createLinearGradient(bx2, 0, bx2 + bw2, 0);
  mg.addColorStop(0,   '#33cc33');
  mg.addColorStop(0.5, '#ff9900');
  mg.addColorStop(1,   '#cc3300');
  ctx.fillStyle = mg;
  _rr(ctx, bx2, by2, bw2, bh2, 3); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth   = 1;
  _rr(ctx, bx2, by2, bw2, bh2, 3); ctx.stroke();
  ctx.fillStyle = '#666666';
  ctx.font      = '9px sans-serif';
  ctx.textAlign = 'left';   ctx.fillText('Safe',   bx2,             by2 + bh2 + 11);
  ctx.textAlign = 'center'; ctx.fillText('Risky',  bx2 + bw2 / 2,  by2 + bh2 + 11);
  ctx.textAlign = 'right';  ctx.fillText('BUSTED', bx2 + bw2,      by2 + bh2 + 11);
  ctx.textAlign = 'left';

  legY += bh2 + 30;

  // Icon legend items
  [
    { icon: '🍔', name: 'Food Items',   desc: 'Press E nearby to grab' },
    { icon: '🚪', name: 'EXIT Sign',    desc: 'Reach here with food!'  },
    { icon: '👷', name: 'Dining Staff', desc: 'Avoid — raises detection'},
    { icon: '🧍', name: 'Crouched You', desc: 'Shift to reduce profile' },
  ].forEach(function (leg, i) {
    var ly = legY + i * 52;
    ctx.font      = '22px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(leg.icon, col3x + 2, ly + 16);
    ctx.fillStyle = '#dddddd';
    ctx.font      = 'bold 11px sans-serif';
    ctx.fillText(leg.name, col3x + 32, ly + 9);
    ctx.fillStyle = '#777777';
    ctx.font      = '10px sans-serif';
    ctx.fillText(leg.desc, col3x + 32, ly + 22);
  });

  // ── Bottom area ─────────────────────────────────────────────────────────
  var botY = by + 488;
  var bdg = ctx.createLinearGradient(bx + 30, 0, bx + bw - 30, 0);
  bdg.addColorStop(0,   'rgba(255,255,255,0)');
  bdg.addColorStop(0.35,'rgba(255,255,255,0.14)');
  bdg.addColorStop(0.65,'rgba(255,255,255,0.14)');
  bdg.addColorStop(1,   'rgba(255,255,255,0)');
  ctx.strokeStyle = bdg;
  ctx.lineWidth   = 1;
  ctx.beginPath(); ctx.moveTo(bx + 30, botY); ctx.lineTo(bx + bw - 30, botY); ctx.stroke();

  _drawButton(ctx, cx - 115, botY + 14, 230, 50, '▶  START GAME', '#2255aa', function () {
    Engine.reset();
    GameState.phase = 'playing';
  });

  ctx.fillStyle = '#3a3028';
  ctx.font      = '10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Round ' + GameState.round + '  |  High Score: ' + GameState.score, cx, by + bh - 9);
  ctx.textAlign = 'left';
}
```

---

## Where It Lives

- **File:** `js/ui.js` inside `window.UI = (function () { ... })()`
- **Called by:** `draw(ctx)` when `GameState.phase === 'start'`
- **Depends on:** `_drawOverlay`, `_drawPanel`, `_drawButton`, `_drawSectionHeader`, `_rr` (all private helpers in the same IIFE)
- **Animates via:** `_time` counter incremented every frame in `draw()`

## Column Layout (800×600 canvas)

| Column     | x start | width | Header color |
|------------|---------|-------|--------------|
| Objective  | 62      | 212   | Gold `#ffcc44` |
| Controls   | 298     | 220   | Blue `#44aaff` |
| Legend     | 542     | 216   | Orange `#ff8855` |

Vertical separators at x = 290 and x = 534.
Panel: x=20, y=15, w=760, h=570.
