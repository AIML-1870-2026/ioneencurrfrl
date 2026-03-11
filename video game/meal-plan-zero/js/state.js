// Module 1 — Shared Game State
// Owner: Module 1 teammate. Do not modify this file.

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
