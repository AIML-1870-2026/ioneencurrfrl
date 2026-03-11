// Module 2 — Map & Dining Hall
// Populates GameState.walls and GameState.foods, draws the dining hall.

window.Map = (function () {

  var _time = 0;
  var _particles = [];
  var _MAX_PARTICLES = 40;

  // ── Wall / counter rects ──────────────────────────────────────────────────
  const WALL_DEFS = [
    { x: 0,   y: 0,   w: 800, h: 20  }, // Top wall
    { x: 0,   y: 580, w: 800, h: 20  }, // Bottom wall
    { x: 0,   y: 0,   w: 20,  h: 600 }, // Left wall
    { x: 780, y: 0,   w: 20,  h: 600 }, // Right wall
    { x: 80,  y: 60,  w: 640, h: 40  }, // Counter A
    { x: 80,  y: 280, w: 640, h: 40  }, // Counter B
    { x: 100, y: 160, w: 120, h: 60  }, // Table 1
    { x: 340, y: 160, w: 120, h: 60  }, // Table 2
    { x: 580, y: 160, w: 120, h: 60  }, // Table 3
    { x: 100, y: 380, w: 120, h: 60  }, // Table 4
    { x: 340, y: 380, w: 120, h: 60  }, // Table 5
    { x: 580, y: 380, w: 120, h: 60  }, // Table 6
  ];

  // ── Food definitions ──────────────────────────────────────────────────────
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

  // Ceiling light fixture positions
  const LIGHT_FIXTURES = [
    { x: 200, y: 25 }, { x: 400, y: 25 }, { x: 600, y: 25 },
    { x: 200, y: 245 }, { x: 400, y: 245 }, { x: 600, y: 245 },
    { x: 200, y: 460 }, { x: 400, y: 460 }, { x: 600, y: 460 },
  ];

  // ── Public API ────────────────────────────────────────────────────────────

  function init() {
    GameState.walls = WALL_DEFS.map(function (r) {
      return { x: r.x, y: r.y, w: r.w, h: r.h };
    });
    GameState.foods = FOOD_DEFS.map(function (f) {
      return { id: f.id, x: f.x, y: f.y, w: 24, h: 24,
               label: f.label, points: f.points, color: f.color,
               glow: f.glow, icon: f.icon, grabbed: false };
    });
    GameState.exitZone = { x: 340, y: 20, w: 120, h: 30 };
    _particles = [];
  }

  function reset() {
    GameState.foods.forEach(function (f) { f.grabbed = false; });
  }

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

  // ── Floor ─────────────────────────────────────────────────────────────────

  function _drawFloor(ctx) {
    var TW = 50, TH = 50;

    for (var ty = 0; ty < 600; ty += TH) {
      for (var tx = 0; tx < 800; tx += TW) {
        var alt = ((tx / TW) + (ty / TH)) % 2 === 0;

        // Tile base
        ctx.fillStyle = alt ? '#ddd0bc' : '#ccc0a8';
        ctx.fillRect(tx + 1, ty + 1, TW - 2, TH - 2);

        // Per-tile gloss — top-left to bottom-right gradient
        var g = ctx.createLinearGradient(tx, ty, tx + TW, ty + TH);
        g.addColorStop(0,   'rgba(255,255,255,0.14)');
        g.addColorStop(0.5, 'rgba(255,255,255,0.03)');
        g.addColorStop(1,   'rgba(0,0,0,0.08)');
        ctx.fillStyle = g;
        ctx.fillRect(tx + 1, ty + 1, TW - 2, TH - 2);
      }
    }

    // Grout lines
    ctx.strokeStyle = '#9a8c7c';
    ctx.lineWidth = 1;
    for (var gx = 0; gx <= 800; gx += TW) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, 600); ctx.stroke();
    }
    for (var gy = 0; gy <= 600; gy += TH) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(800, gy); ctx.stroke();
    }
  }

  // ── Walls ─────────────────────────────────────────────────────────────────

  function _drawWalls(ctx) {
    // Outer border — dark paneled wood
    var wallRects = [WALL_DEFS[0], WALL_DEFS[1], WALL_DEFS[2], WALL_DEFS[3]];
    wallRects.forEach(function (r) {
      var g = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h);
      g.addColorStop(0, '#1e1208');
      g.addColorStop(1, '#2e1e10');
      ctx.fillStyle = g;
      ctx.fillRect(r.x, r.y, r.w, r.h);
    });

    // Inner baseboard stripe on all 4 walls
    ctx.fillStyle = '#4a3220';
    ctx.fillRect(20, 16, 760, 4);    // top baseboard
    ctx.fillRect(20, 580, 760, 4);   // bottom baseboard
    ctx.fillRect(16, 20, 4, 560);    // left baseboard
    ctx.fillRect(780, 20, 4, 560);   // right baseboard

    // Ceiling strip (top wall) — fluorescent tube housing
    ctx.fillStyle = '#f0f0e0';
    ctx.fillRect(22, 1, 756, 3);

    // "DINING SERVICES" banner between top wall and Counter A
    _drawBanner(ctx, 400, 44, 'DINING  SERVICES');

    // Left and right wall decorative panels
    _drawWallPanel(ctx, 22, 30, 58, 550);
    _drawWallPanel(ctx, 720, 30, 58, 550);
  }

  function _drawBanner(ctx, cx, cy, text) {
    var w = 280, h = 18;
    // Banner background
    var g = ctx.createLinearGradient(cx - w/2, cy, cx + w/2, cy);
    g.addColorStop(0,   '#1a0a00');
    g.addColorStop(0.1, '#3a2200');
    g.addColorStop(0.5, '#4a3010');
    g.addColorStop(0.9, '#3a2200');
    g.addColorStop(1,   '#1a0a00');
    ctx.fillStyle = g;
    ctx.fillRect(cx - w/2, cy - h/2, w, h);
    // Gold border
    ctx.strokeStyle = '#c8a040';
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - w/2, cy - h/2, w, h);
    // Text
    ctx.fillStyle = '#f0c840';
    ctx.font = 'bold 10px serif';
    ctx.textAlign = 'center';
    ctx.letterSpacing = '3px';
    ctx.fillText(text, cx, cy + 4);
    ctx.textAlign = 'left';
    ctx.letterSpacing = '0px';
  }

  function _drawWallPanel(ctx, x, y, w, h) {
    // Outer panel
    ctx.fillStyle = '#2a1808';
    ctx.fillRect(x, y, w, h);
    // Inner inset
    ctx.fillStyle = '#1a1008';
    ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
    // Highlight edge
    ctx.strokeStyle = 'rgba(180,120,60,0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);
  }

  // ── Light pools ───────────────────────────────────────────────────────────

  function _drawLightPools(ctx) {
    // Draw ceiling fixture + floor pool for each light
    LIGHT_FIXTURES.forEach(function (lf) {
      // Fixture housing
      ctx.fillStyle = '#e8e8d8';
      ctx.fillRect(lf.x - 28, lf.y, 56, 8);
      ctx.fillStyle = '#fffff0';
      ctx.fillRect(lf.x - 22, lf.y + 2, 44, 4);

      // Floor light pool
      var poolY = lf.y + 100;
      var pulse = 0.85 + 0.15 * Math.sin(_time * 0.02 + lf.x * 0.01);
      var g = ctx.createRadialGradient(lf.x, poolY, 0, lf.x, poolY, 120);
      g.addColorStop(0,   'rgba(255,245,200,' + (0.22 * pulse) + ')');
      g.addColorStop(0.6, 'rgba(255,235,160,' + (0.06 * pulse) + ')');
      g.addColorStop(1,   'rgba(255,220,120,0)');
      ctx.fillStyle = g;
      ctx.fillRect(lf.x - 120, poolY - 100, 240, 220);
    });
  }

  // ── Heat lamp glow above counters ─────────────────────────────────────────

  function _drawHeatLampGlow(ctx) {
    var counters = [WALL_DEFS[4], WALL_DEFS[5]];
    counters.forEach(function (r) {
      var pulse = 0.7 + 0.3 * Math.sin(_time * 0.04);
      var g = ctx.createLinearGradient(r.x, r.y - 30, r.x, r.y + r.h);
      g.addColorStop(0,   'rgba(255,80,0,0)');
      g.addColorStop(0.5, 'rgba(255,100,10,' + (0.08 * pulse) + ')');
      g.addColorStop(1,   'rgba(255,60,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(r.x, r.y - 30, r.w, r.h + 30);
    });
  }

  // ── Counters ──────────────────────────────────────────────────────────────

  function _drawCounters(ctx) {
    var counters = [WALL_DEFS[4], WALL_DEFS[5]];
    counters.forEach(function (r) {
      // Drop shadow
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(r.x + 3, r.y + 3, r.w, r.h);

      // Stainless steel gradient
      var g = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
      g.addColorStop(0,    '#c8d8e0');
      g.addColorStop(0.15, '#e8f0f4');
      g.addColorStop(0.4,  '#b8c8d0');
      g.addColorStop(0.7,  '#a0b0b8');
      g.addColorStop(1,    '#889098');
      ctx.fillStyle = g;
      ctx.fillRect(r.x, r.y, r.w, r.h);

      // Horizontal brushed-metal streaks
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 1;
      for (var sy = r.y + 4; sy < r.y + r.h - 4; sy += 5) {
        ctx.beginPath();
        ctx.moveTo(r.x + 4, sy);
        ctx.lineTo(r.x + r.w - 4, sy);
        ctx.stroke();
      }

      // Top metal edge (darker)
      ctx.fillStyle = '#708090';
      ctx.fillRect(r.x, r.y, r.w, 3);

      // Bottom metal edge
      ctx.fillStyle = '#506070';
      ctx.fillRect(r.x, r.y + r.h - 2, r.w, 2);

      // Glass sneeze guard
      var glassH = 14;
      var glassG = ctx.createLinearGradient(r.x, r.y - glassH, r.x, r.y);
      glassG.addColorStop(0, 'rgba(160,210,240,0.08)');
      glassG.addColorStop(1, 'rgba(160,210,240,0.22)');
      ctx.fillStyle = glassG;
      ctx.fillRect(r.x, r.y - glassH, r.w, glassH);
      // Glass edge highlight
      ctx.strokeStyle = 'rgba(200,240,255,0.55)';
      ctx.lineWidth = 1;
      ctx.strokeRect(r.x, r.y - glassH, r.w, glassH);

      // Tray rail at the front
      ctx.fillStyle = '#607080';
      ctx.fillRect(r.x, r.y + r.h, r.w, 4);
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(r.x, r.y + r.h + 1);
      ctx.lineTo(r.x + r.w, r.y + r.h + 1);
      ctx.stroke();
    });
  }

  // ── Tables ────────────────────────────────────────────────────────────────

  function _drawTables(ctx) {
    var tables = WALL_DEFS.slice(6);
    tables.forEach(function (r) {
      // Drop shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      _rr(ctx, r.x + 5, r.y + 5, r.w, r.h, 6);
      ctx.fill();

      // Table top gradient — dark mahogany
      var g = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
      g.addColorStop(0,   '#5c3820');
      g.addColorStop(0.3, '#3e2210');
      g.addColorStop(1,   '#281508');
      ctx.fillStyle = g;
      _rr(ctx, r.x, r.y, r.w, r.h, 6);
      ctx.fill();

      // Wood grain
      ctx.save();
      ctx.beginPath();
      _rr(ctx, r.x, r.y, r.w, r.h, 6);
      ctx.clip();
      ctx.strokeStyle = 'rgba(255,200,100,0.06)';
      ctx.lineWidth = 2;
      for (var gl = r.x - 10; gl < r.x + r.w + 10; gl += 14) {
        ctx.beginPath();
        ctx.moveTo(gl, r.y);
        ctx.bezierCurveTo(gl + 3, r.y + r.h * 0.3, gl - 2, r.y + r.h * 0.7, gl + 1, r.y + r.h);
        ctx.stroke();
      }
      ctx.restore();

      // Rim highlight
      ctx.strokeStyle = 'rgba(180,120,60,0.45)';
      ctx.lineWidth = 1.5;
      _rr(ctx, r.x + 1, r.y + 1, r.w - 2, r.h - 2, 5);
      ctx.stroke();

      // Chairs — small rounded rectangle on each long side
      var chairFill = '#3a2010';
      var chairHighlight = 'rgba(255,180,80,0.2)';
      [[r.x + 10, r.y - 12, 28, 10], [r.x + r.w - 38, r.y - 12, 28, 10],
       [r.x + 10, r.y + r.h + 2,  28, 10], [r.x + r.w - 38, r.y + r.h + 2, 28, 10]
      ].forEach(function (c) {
        _rr(ctx, c[0], c[1], c[2], c[3], 3);
        ctx.fillStyle = chairFill; ctx.fill();
        ctx.strokeStyle = chairHighlight; ctx.lineWidth = 1; ctx.stroke();
      });

      // Table surface gloss
      var gloss = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h * 0.4);
      gloss.addColorStop(0, 'rgba(255,255,255,0.10)');
      gloss.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gloss;
      _rr(ctx, r.x, r.y, r.w, r.h * 0.4, 6);
      ctx.fill();
    });
  }

  // ── Food items ────────────────────────────────────────────────────────────

  function _drawFoods(ctx) {
    GameState.foods.forEach(function (food) {
      if (food.grabbed) return;

      var bob  = Math.sin(_time * 0.05 + food.id * 0.9) * 2.5;
      var fy   = food.y + bob;
      var cx   = food.x + food.w / 2;
      var cy   = fy + food.h / 2;
      var pulse = 0.7 + 0.3 * Math.sin(_time * 0.06 + food.id * 0.7);

      // Outer glow halo
      var halo = ctx.createRadialGradient(cx, cy, 2, cx, cy, 26);
      halo.addColorStop(0,   hexAlpha(food.glow, 0.5 * pulse));
      halo.addColorStop(0.6, hexAlpha(food.glow, 0.15 * pulse));
      halo.addColorStop(1,   hexAlpha(food.glow, 0));
      ctx.fillStyle = halo;
      ctx.fillRect(cx - 26, cy - 26, 52, 52);

      // Plate (white oval)
      ctx.beginPath();
      ctx.ellipse(cx, fy + food.h + 4, 18, 5, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(200,200,200,0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Badge background — rounded square
      _rr(ctx, food.x, fy, food.w, food.h, 6);
      var bg = ctx.createLinearGradient(food.x, fy, food.x, fy + food.h);
      bg.addColorStop(0, _lighten(food.color, 40));
      bg.addColorStop(1, food.color);
      ctx.fillStyle = bg;
      ctx.fill();

      // Badge gloss
      _rr(ctx, food.x + 2, fy + 2, food.w - 4, food.h * 0.45, 4);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fill();

      // Badge border
      _rr(ctx, food.x, fy, food.w, food.h, 6);
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Emoji icon
      ctx.font = '15px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(food.icon, cx, cy + 1);
      ctx.textBaseline = 'alphabetic';

      // Label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur  = 3;
      ctx.fillText(food.label, cx, fy + food.h + 12);
      ctx.shadowBlur = 0;

      // Points badge (top-right corner)
      _drawPointsBadge(ctx, food.x + food.w - 1, fy - 1, food.points);

      ctx.textAlign = 'left';

      // Steam particles
      if (STEAMY_IDS.has(food.id)) {
        _spawnSteam(food.x + 12, fy);
      }
    });
  }

  function _drawPointsBadge(ctx, x, y, points) {
    var badgeW = 20, badgeH = 11;
    _rr(ctx, x - badgeW, y, badgeW, badgeH, 3);
    ctx.fillStyle = '#ffcc00';
    ctx.fill();
    ctx.fillStyle = '#3a1a00';
    ctx.font = 'bold 7px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(points + 'pt', x - badgeW / 2, y + 8);
    ctx.textAlign = 'left';
  }

  // ── EXIT sign ─────────────────────────────────────────────────────────────

  function _drawExit(ctx) {
    var ez    = GameState.exitZone;
    var pulse = 0.6 + 0.4 * Math.sin(_time * 0.07);
    var cx    = ez.x + ez.w / 2;
    var cy    = ez.y + ez.h / 2;

    // Floor glow spread
    var floorGlow = ctx.createRadialGradient(cx, cy + 30, 0, cx, cy + 30, 90);
    floorGlow.addColorStop(0,   'rgba(0,255,120,' + (0.25 * pulse) + ')');
    floorGlow.addColorStop(1,   'rgba(0,255,120,0)');
    ctx.fillStyle = floorGlow;
    ctx.fillRect(cx - 90, cy - 20, 180, 120);

    // Outer neon ring glow
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur  = 20 + 10 * pulse;

    // Sign body
    _rr(ctx, ez.x - 2, ez.y - 2, ez.w + 4, ez.h + 4, 6);
    ctx.fillStyle = 'rgba(0,30,15,0.9)';
    ctx.fill();
    ctx.strokeStyle = '#00cc66';
    ctx.lineWidth   = 2;
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Inner neon fill — pulsing
    _rr(ctx, ez.x, ez.y, ez.w, ez.h, 5);
    var neon = ctx.createLinearGradient(ez.x, ez.y, ez.x, ez.y + ez.h);
    neon.addColorStop(0, 'rgba(0,255,120,' + (0.18 * pulse) + ')');
    neon.addColorStop(1, 'rgba(0,180,80,'  + (0.10 * pulse) + ')');
    ctx.fillStyle = neon;
    ctx.fill();

    // Animated dashed border
    ctx.strokeStyle = 'rgba(0,255,140,' + (0.6 + 0.4 * pulse) + ')';
    ctx.lineWidth    = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.lineDashOffset = -(_time * 0.6 % 9);
    _rr(ctx, ez.x, ez.y, ez.w, ez.h, 5);
    ctx.stroke();
    ctx.setLineDash([]);

    // Blinking arrows
    var arrowAlpha = 0.5 + 0.5 * Math.sin(_time * 0.12);
    ctx.fillStyle = 'rgba(0,255,140,' + arrowAlpha + ')';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('▲ EXIT ▲', cx, cy + 5);
    ctx.textAlign = 'left';
  }

  // ── Particles ─────────────────────────────────────────────────────────────

  function _spawnAmbientDust() {
    if (_particles.length >= _MAX_PARTICLES || Math.random() > 0.25) return;
    var lf = LIGHT_FIXTURES[Math.floor(Math.random() * LIGHT_FIXTURES.length)];
    _particles.push({
      type: 'dust',
      x:    lf.x + (Math.random() - 0.5) * 70,
      y:    lf.y + 10 + Math.random() * 40,
      vx:   (Math.random() - 0.5) * 0.25,
      vy:   -0.15 - Math.random() * 0.35,
      life: 1.0,
      fade: 0.004 + Math.random() * 0.006,
      r:    0.8 + Math.random() * 1.5,
    });
  }

  function _spawnSteam(x, y) {
    if (_particles.length >= _MAX_PARTICLES || Math.random() > 0.15) return;
    _particles.push({
      type: 'steam',
      x:    x + (Math.random() - 0.5) * 8,
      y:    y,
      vx:   (Math.random() - 0.5) * 0.4,
      vy:   -0.5 - Math.random() * 0.6,
      life: 1.0,
      fade: 0.015 + Math.random() * 0.015,
      r:    1.5 + Math.random() * 2,
    });
  }

  function _tickParticles() {
    for (var i = _particles.length - 1; i >= 0; i--) {
      var p = _particles[i];
      p.x    += p.vx;
      p.y    += p.vy;
      p.vx   *= 0.99;
      p.life -= p.fade;
      if (p.life <= 0) { _particles.splice(i, 1); }
    }
  }

  function _drawParticles(ctx) {
    _particles.forEach(function (p) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      if (p.type === 'dust') {
        ctx.fillStyle = 'rgba(255,240,200,' + (p.life * 0.55) + ')';
      } else {
        ctx.fillStyle = 'rgba(220,220,220,' + (p.life * 0.35) + ')';
      }
      ctx.fill();
    });
  }

  // ── Vignette ──────────────────────────────────────────────────────────────

  function _drawVignette(ctx) {
    var g = ctx.createRadialGradient(400, 300, 180, 400, 300, 520);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.52)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 800, 600);
  }

  // ── Utilities ─────────────────────────────────────────────────────────────

  // Rounded rect path helper
  function _rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y,     x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r,  y + h);
    ctx.quadraticCurveTo(x,     y + h, x,     y + h - r);
    ctx.lineTo(x,      y + r);
    ctx.quadraticCurveTo(x,     y,     x + r, y);
    ctx.closePath();
  }

  // hex color → rgba string
  function hexAlpha(hex, a) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }

  // Lighten a hex color by amt (0-255)
  function _lighten(hex, amt) {
    var r = Math.min(255, parseInt(hex.slice(1, 3), 16) + amt);
    var g = Math.min(255, parseInt(hex.slice(3, 5), 16) + amt);
    var b = Math.min(255, parseInt(hex.slice(5, 7), 16) + amt);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  return { init: init, draw: draw, reset: reset };

})();
