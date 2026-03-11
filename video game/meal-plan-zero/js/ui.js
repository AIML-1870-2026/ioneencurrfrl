// Module 5 — UI, HUD & Screens
// Draws HUD during gameplay and all overlay screens. Handles button clicks.

window.UI = (function () {

  var _buttons = [];       // active button rects for this frame
  var _time    = 0;
  var _sounds  = {};
  var _lastDetection = 0;

  // ── Sound ─────────────────────────────────────────────────────────────────

  function _loadSound(key, src) {
    try { _sounds[key] = new Audio(src); } catch (e) {}
  }

  function _playSound(key) {
    if (!_sounds[key]) return;
    try { _sounds[key].currentTime = 0; _sounds[key].play().catch(function () {}); } catch (e) {}
  }

  // ── Public API ────────────────────────────────────────────────────────────

  function init() {
    _loadSound('grab',   'assets/sounds/grab.wav');
    _loadSound('alert',  'assets/sounds/alert.wav');
    _loadSound('caught', 'assets/sounds/caught.wav');
    _loadSound('escape', 'assets/sounds/escape.wav');

    GameState.canvas.addEventListener('mousedown', function (e) {
      var rect = GameState.canvas.getBoundingClientRect();
      var mx   = (e.clientX - rect.left) * (GameState.width  / rect.width);
      var my   = (e.clientY - rect.top)  * (GameState.height / rect.height);
      _buttons.forEach(function (btn) {
        if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
          btn.action();
        }
      });
    });

    // Pointer cursor when hovering buttons
    GameState.canvas.addEventListener('mousemove', function (e) {
      var rect    = GameState.canvas.getBoundingClientRect();
      var mx      = (e.clientX - rect.left) * (GameState.width  / rect.width);
      var my      = (e.clientY - rect.top)  * (GameState.height / rect.height);
      var onBtn   = _buttons.some(function (btn) {
        return mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h;
      });
      GameState.canvas.style.cursor = onBtn ? 'pointer' : 'default';
    });
  }

  function draw(ctx) {
    _time++;
    _buttons = []; // rebuild hit-list each frame

    // Sound triggers (threshold crossings only)
    if (GameState.phase === 'playing') {
      if (_lastDetection < 50 && GameState.detection >= 50) _playSound('alert');
    }
    _lastDetection = GameState.detection;

    if      (GameState.phase === 'playing')  _drawHUD(ctx);
    else if (GameState.phase === 'start')    _drawStartScreen(ctx);
    else if (GameState.phase === 'gameover') _drawGameOverScreen(ctx);
    else if (GameState.phase === 'win')      _drawWinScreen(ctx);
  }

  // ── HUD ───────────────────────────────────────────────────────────────────

  function _drawHUD(ctx) {
    // Score — top left
    ctx.fillStyle = '#ffffff';
    ctx.font      = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur  = 4;
    ctx.fillText('Score: ' + GameState.score, 20, 24);

    // Round — below score
    ctx.fillStyle = '#aaaaaa';
    ctx.font      = '12px sans-serif';
    ctx.fillText('Round ' + GameState.round, 20, 42);

    // Inventory count — top center
    ctx.fillStyle = '#ffffff';
    ctx.font      = '14px sans-serif';
    ctx.textAlign = 'center';
    var itemCount = GameState.player.inventory.length;
    ctx.fillText(itemCount + (itemCount === 1 ? ' item' : ' items'), 400, 24);

    ctx.shadowBlur  = 0;
    ctx.textAlign   = 'left';

    // Detection meter — top right
    _drawDetectionMeter(ctx);
  }

  function _drawDetectionMeter(ctx) {
    var mx = 578, my = 12, mw = 202, mh = 18;
    var pct   = Math.min(1, GameState.detection / 100);
    var flash = GameState.detection > 80 && (_time % 18 < 9);

    // Label
    ctx.font      = 'bold 10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillStyle = flash ? '#ff3333' : 'rgba(255,255,255,0.75)';
    ctx.fillText('BUSTED', mx + mw, my - 3);

    // Meter track
    ctx.fillStyle = '#222222';
    _rr(ctx, mx, my, mw, mh, 3); ctx.fill();

    // Meter fill — color by level
    var fillColor = pct < 0.5 ? '#33cc33' : pct < 0.8 ? '#ff9900' : '#cc3300';
    if (flash) fillColor = '#ff0000';
    var grad = ctx.createLinearGradient(mx, my, mx, my + mh);
    grad.addColorStop(0,   _lightenHex(fillColor, 40));
    grad.addColorStop(1,   fillColor);
    ctx.fillStyle = grad;
    _rr(ctx, mx, my, mw * pct, mh, 3); ctx.fill();

    // Gloss on meter fill
    if (pct > 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      _rr(ctx, mx, my, mw * pct, mh * 0.45, 3); ctx.fill();
    }

    // Track border
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth   = 1;
    _rr(ctx, mx, my, mw, mh, 3); ctx.stroke();

    // Percentage label inside bar
    ctx.fillStyle   = 'rgba(255,255,255,0.85)';
    ctx.font        = 'bold 10px sans-serif';
    ctx.textAlign   = 'center';
    ctx.fillText(Math.round(GameState.detection) + '%', mx + mw / 2, my + mh - 4);
    ctx.textAlign   = 'left';
  }

  // ── Start Screen ──────────────────────────────────────────────────────────

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

  // ── Game Over Screen ──────────────────────────────────────────────────────

  function _drawGameOverScreen(ctx) {
    var bx = 190, by = 165, bw = 420, bh = 270;
    _drawOverlay(ctx);
    _drawPanel(ctx, bx, by, bw, bh);

    var cx = bx + bw / 2;
    ctx.textAlign = 'center';

    // "CAUGHT."
    ctx.shadowColor = '#cc3300';
    ctx.shadowBlur  = 16;
    ctx.fillStyle   = '#cc3300';
    ctx.font        = 'bold 30px serif';
    ctx.fillText('CAUGHT.', cx, by + 52);
    ctx.shadowBlur  = 0;

    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(bx + 30, by + 64, bw - 60, 1);

    ctx.fillStyle = '#aaaaaa';
    ctx.font      = '14px sans-serif';
    ctx.fillText('Banned from the dining hall.', cx, by + 86);
    ctx.fillText('Also still hungry.', cx, by + 106);

    ctx.fillStyle = '#dddddd';
    ctx.font      = '14px sans-serif';
    ctx.fillText('Food stolen: ' + GameState.player.inventory.length + ' item(s)', cx, by + 138);
    ctx.font      = 'bold 18px sans-serif';
    ctx.fillText('Score: ' + GameState.score + ' pts', cx, by + 162);

    _drawButton(ctx, cx - 85, by + 182, 170, 42, '↺  TRY AGAIN', '#882200', function () {
      Engine.reset();
      GameState.phase = 'playing';
    });

    ctx.textAlign = 'left';
  }

  // ── Win Screen ────────────────────────────────────────────────────────────

  function _drawWinScreen(ctx) {
    var bx = 190, by = 165, bw = 420, bh = 270;
    _drawOverlay(ctx);
    _drawPanel(ctx, bx, by, bw, bh);

    var cx = bx + bw / 2;
    ctx.textAlign = 'center';

    // "ESCAPED."
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur  = 18;
    ctx.fillStyle   = '#33cc66';
    ctx.font        = 'bold 30px serif';
    ctx.fillText('ESCAPED.', cx, by + 52);
    ctx.shadowBlur  = 0;

    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(bx + 30, by + 64, bw - 60, 1);

    ctx.fillStyle = '#aaaaaa';
    ctx.font      = '14px sans-serif';
    ctx.fillText('Round ' + GameState.round + ' complete.', cx, by + 86);

    ctx.fillStyle = '#dddddd';
    ctx.font      = '14px sans-serif';
    ctx.fillText('Food stolen: ' + GameState.player.inventory.length + ' item(s)', cx, by + 124);
    ctx.font      = 'bold 18px sans-serif';
    ctx.fillText('Score: ' + GameState.score + ' pts', cx, by + 150);

    _drawButton(ctx, cx - 85, by + 172, 170, 42, '▶  NEXT ROUND', '#1a5e2a', function () {
      GameState.round++;
      Engine.reset();
      GameState.phase = 'playing';
    });

    ctx.textAlign = 'left';
  }

  // ── Shared draw helpers ───────────────────────────────────────────────────

  function _drawOverlay(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, GameState.width, GameState.height);
  }

  function _drawPanel(ctx, x, y, w, h) {
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    _rr(ctx, x + 6, y + 6, w, h, 12); ctx.fill();

    // Body
    var bg = ctx.createLinearGradient(x, y, x, y + h);
    bg.addColorStop(0, 'rgba(18,14,10,0.96)');
    bg.addColorStop(1, 'rgba(8,6,4,0.96)');
    ctx.fillStyle = bg;
    _rr(ctx, x, y, w, h, 12); ctx.fill();

    // Border
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.lineWidth   = 1;
    _rr(ctx, x, y, w, h, 12); ctx.stroke();

    // Top edge highlight
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.moveTo(x + 12, y + 1);
    ctx.lineTo(x + w - 12, y + 1);
    ctx.stroke();
  }

  function _drawButton(ctx, x, y, w, h, label, color, action) {
    _buttons.push({ x: x, y: y, w: w, h: h, action: action });

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    _rr(ctx, x + 3, y + 3, w, h, 7); ctx.fill();

    // Body gradient
    var bg = ctx.createLinearGradient(x, y, x, y + h);
    bg.addColorStop(0, _lightenHex(color, 30));
    bg.addColorStop(1, color);
    ctx.fillStyle = bg;
    _rr(ctx, x, y, w, h, 7); ctx.fill();

    // Gloss
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    _rr(ctx, x + 2, y + 2, w - 4, h * 0.45, 5); ctx.fill();

    // Border
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth   = 1;
    _rr(ctx, x, y, w, h, 7); ctx.stroke();

    // Label
    ctx.fillStyle   = '#ffffff';
    ctx.font        = 'bold 14px sans-serif';
    ctx.textAlign   = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur  = 4;
    ctx.fillText(label, x + w / 2, y + h / 2 + 5);
    ctx.shadowBlur  = 0;
  }

  // ── Utilities ─────────────────────────────────────────────────────────────

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

  function _rr(ctx, x, y, w, h, r) {
    if (w <= 0) return;
    r = Math.min(r, w / 2, h / 2);
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

  function _lightenHex(hex, amt) {
    var r = Math.min(255, parseInt(hex.slice(1, 3), 16) + amt);
    var g = Math.min(255, parseInt(hex.slice(3, 5), 16) + amt);
    var b = Math.min(255, parseInt(hex.slice(5, 7), 16) + amt);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  return { init: init, draw: draw };

})();
