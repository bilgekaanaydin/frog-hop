/* FROG HOP - a Doodle-Jump style pixel game. Everything renders on a low-res canvas, then scaled up pixel-perfect. */
'use strict';

// ============================================================ helpers
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a, b) => a + Math.random() * (b - a);
const rndi = (a, b) => Math.floor(rnd(a, b + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const hex2rgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const rgb2hex = c => '#' + c.map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
const mixHex = (a, b, t) => { const A = hex2rgb(a), B = hex2rgb(b); return rgb2hex([lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t)]); };

// shared pixel palette used by hand-drawn UI/item sprites
const P = {
  k: '#050403', w: '#ffffff', y: '#f8c53a', Y: '#fff089', o: '#e6a428', r: '#e04040', R: '#8a1c1c',
  b: '#3a6fd8', B: '#1f3f8a', g: '#61a53f', G: '#293f21', c: '#8fd032', p: '#f07aa0', P: '#b03060',
  n: '#8a5a2a', N: '#4a2e12', t: '#d2a86a', s: '#b8c0c8', S: '#6a737c', d: '#3a2a2a', e: '#f2e8a4',
  E: '#d9cc7e', q: '#dff6ff', v: '#8a5cc8', x: '#ff6a3d', i: '#2a2a2a', m: '#c58a4a', l: '#69beff', a: '#ff9fc4'
};

function makeSprite(rows, pal) {
  const h = rows.length, w = Math.max(...rows.map(r => r.length));
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  for (let y = 0; y < h; y++) for (let i = 0; i < rows[y].length; i++) {
    const ch = rows[y][i]; if (ch === '.' || ch === ' ') continue;
    x.fillStyle = pal[ch] || '#ff00ff'; x.fillRect(i, y, 1, 1);
  }
  return c;
}
function flipSprite(c) {
  const o = document.createElement('canvas'); o.width = c.width; o.height = c.height;
  const x = o.getContext('2d'); x.translate(c.width, 0); x.scale(-1, 1); x.drawImage(c, 0, 0); return o;
}
function tintPal(pal, fn) { const o = {}; for (const k in pal) o[k] = fn(pal[k]); return o; }

// ============================================================ assets
const FROG = {}; // name -> canvas
for (const k in ASSETS.frog) FROG[k] = makeSprite(ASSETS.frog[k], ASSETS.frogPal);
const FROG_W = FROG.sit.width; // 38

const CLOUD_PALS = {
  day: ASSETS.cloudPal,
  eve: tintPal(ASSETS.cloudPal, h => mixHex(h, '#ffb088', 0.45)),
  night: tintPal(ASSETS.cloudPal, h => mixHex(h, '#2a2050', 0.7)),
  dawn: tintPal(ASSETS.cloudPal, h => mixHex(h, '#ffc7d0', 0.4)),
};
const CLOUDS = {};
for (const k in CLOUD_PALS) CLOUDS[k] = ASSETS.clouds.map(c => makeSprite(c.rows, CLOUD_PALS[k]));

const ICON = {
  coin: makeSprite(['..kkkk..', '.kyyyyk.', 'kyYyyyok', 'kyYyyyok', 'kyyyyook', 'kyyyoook', '.kyoook.', '..kkkk..'], P),
  coinThin: makeSprite(['..kk..', '.kyyk.', 'kyYyok', 'kyYyok', 'kyyook', 'kyyook', '.kook.', '..kk..'], P),
  coinLine: makeSprite(['.kk.', 'kyok', 'kyok', 'kyok', 'kyok', 'kyok', 'kyok', '.kk.'], P),
  trophy: makeSprite(['kkkkkkkkk', 'kyyyyyyyk', 'kkyYyyykk', '.kyyyyyk.', '..kyyyk..', '...kyk...', '...kyk...', '..kyyyk..', '.kkkkkkk.'], P),
  cart: makeSprite(['kkk.........', '..kkkkkkkkkk', '..kyyyyyyyyk', '..kyyyyyyyyk', '...kyyyyyyk.', '...kkkkkkkk.', '...kwk..kwk.', '....k....k..'], P),
  gear: makeSprite(['....kk....', '.kk.kk.kk.', '.kkkkkkkk.', '..kk..kk..', 'kkkk..kkkk', 'kkkk..kkkk', '..kk..kk..', '.kkkkkkkk.', '.kk.kk.kk.', '....kk....'], P),
  close: makeSprite(['kk...kk', '.kk.kk.', '..kkk..', '..kkk..', '.kk.kk.', 'kk...kk'], P),
  hand: makeSprite(['...kk.....', '..kwwk....', '..kwwk....', '..kwwkkk..', '..kwwkwwkk', 'kkkwwwwwwk', 'kwkwwwwwwk', 'kwwwwwwwwk', '.kwwwwwwk.', '..kwwwwk..', '..kkkkkk..'], P),
  speaker: makeSprite(['....k....', '...kk..k.', '..kwk.k.k', 'kkkwk..kk', 'kwwwk.k.k', 'kkkwk..kk', '..kwk.k.k', '...kk..k.', '....k....'], P),
  vibrate: makeSprite(['k..kkkkk..k', '.k.kwwwk.k.', 'k.kkwwwk.k.', '.k.kwwwk.k.', 'k..kwwwk..k', '.k.kwwwk.k.', 'k..kkkkk..k'], P),
  tilt: makeSprite(['..kkkkk....', '.kwwwwwk...', 'kkkkkkwwk..', '.kwwwwwwwk.', '..kwwwwwwwk', '...kkkkkkkk'], P),
  home: makeSprite(['....kk....', '...kyyk...', '..kyyyyk..', '.kyyyyyyk.', 'kkkyyyykkk', '..kyykkyk.', '..kyykkyk.', '..kkkkkkk.'], P),
  retry: makeSprite(['..kkkkk...', '.kk...kk..', 'kk.....kk.', 'kk....kkkk', 'kk.....kk.', 'kk....k.k.', '.kk..kk...', '..kkkk....'], P),
  heart: makeSprite(['.kk..kk.', 'krrkkrrk', 'krrrrrrk', 'krrrrrrk', '.krrrrk.', '..krrk..', '...kk...'], P),
  glassesTab: makeSprite(['kkkkk.kkkkk', 'kiiiikiiiik', 'kiwiikiwiik', '.kiik.kiik.', '..kk...kk..'], P),
  bolt: makeSprite(['...kk', '..kyk', '.kyyk', 'kyyyk', 'kkkyk', '..kyk', '..kk.'], P),
  star: makeSprite(['..y..', '.yyy.', 'yyyyy', '.yyy.', '..y..'], P),
  tongue: makeSprite(['..kkkkkk..', '.k......k.', 'k...kk...k', 'k..kppk..k', 'k..kppk..k', 'k..kppk..k', 'k.kppppk.k', 'k.kppppk.k', '.k.kkkk.k.', '..kkkkkk..'], P),
  spring: makeSprite(['kkkkkkkkkk', 'ksSsSsSsSk', 'kSsSsSsSsk', '.kkkkkkkk.'], P),
  fly0: makeSprite(['.qqq...qqq.', 'qkqqq.qqqkq', '.qqkkkkkqq.', '..kkikikk..', '..kkkkkkk..', '...kkkkk...'], P),
  fly1: makeSprite(['...........', 'qqqq.k.qqqq', 'qqqkkkkkqqq', '..kkikikk..', '..kkkkkkk..', '...kkkkk...'], P),
  sun: makeSprite(['....kkkk....', '..kkyyyykk..', '.kyyYYYYyyk.', '.kyYYYYYYyk.', 'kyyYYYYYYyyk', 'kyYYYYYYYYyk', 'kyYYYYYYYYyk', 'kyyYYYYYYyyk', '.kyYYYYYYyk.', '.kyyYYYYyyk.', '..kkyyyykk..', '....kkkk....'], P),
  moon: makeSprite(['....kkkk....', '..kkeeeekk..', '.keeeeeekk..', '.keeeeek....', 'keeeeek.....', 'keeeeek.....', 'keeeeek.....', 'keeeeeek....', '.keeeeeek...', '.keeeeeeekk.', '..kkeeeeekk.', '....kkkkk...'], P),
  check: makeSprite(['.......kk', '......kck', '.....kck.', 'kk..kck..', 'kck.kc...', '.kckck...', '..kck....', '...k.....'], P),
  lock: makeSprite(['..kkk..', '.ks.sk.', '.ks.sk.', 'kkkkkkk', 'kyyyyyk', 'kyykyyk', 'kyyyyyk', 'kkkkkkk'], P),
  stars: makeSprite(['y.....y', 'yy...yy', '...y...', '..yyy..', '...y...'], P),
};

// ------------------------------------------------------------ shop items (pixel art anchored on the 38x28 frog grid)
const ITEMS = {
  hat: [
    { id: 'none', name: 'NONE', price: 0 },
    { id: 'leaf', name: 'LEAF', price: 100, ox: 11, oy: -4, rows: ['.......k.......', '......kck......', '..kkkkcGck.....', '.kccccccGGck...', 'kcccGGGcccGGGk.', 'kgggggggggggggk', '.kkkkkkkkkkkkk.'] },
    { id: 'cap', name: 'CAP', price: 150, ox: 11, oy: -5, rows: ['....kkkkkkk.....', '..kkbbbbbbbkk...', '.kbbbbbbBbbbbk..', 'kbbbbbbbbbbbbbk.', 'kBbbbbbbbbbbbbkkkk', 'kBBBBBBBBBBBBBBBBk', '.kkkkkkkkkkkkkkkk.'] },
    { id: 'party', name: 'PARTY', price: 250, ox: 12, oy: -9, rows: ['......ww......', '.....wwww.....', '......kk......', '.....kyyk.....', '.....kppk.....', '....kyyyyk....', '....kppppk....', '...kyyyyyyk...', '...kppppppk...', '..kyyyyyyyyk..', '..kppppppppk..', '.kkkkkkkkkkkk.'] },
    { id: 'tophat', name: 'TOP HAT', price: 400, ox: 11, oy: -8, rows: ['...kkkkkkkkk...', '...kiiiiiiik...', '...kiiiiiiik...', '...kiiiiiiik...', '...kiiiiiiik...', '...krrrrrrrk...', '.kkkiiiiiiikkk.', '.kiiiiiiiiiiik.', '.kkkkkkkkkkkkk.'] },
    { id: 'cowboy', name: 'COWBOY', price: 550, ox: 10, oy: -7, rows: ['.....kkkkkkk.....', '....knnnnnnnk....', '....knnNNNnnk....', 'k...knnnnnnnk...k', 'kn..knnnnnnnk..nk', 'knnnkNNNNNNNknnnk', '.knnnnnnnnnnnnnk.', '..kkkkkkkkkkkkk..'] },
    { id: 'viking', name: 'VIKING', price: 800, ox: 10, oy: -8, rows: ['k...............k', 'kt.............tk', 'ktt...kkkkkkk..ttk', '.kt..kssssssSk.tk.', '.ktkkssssssssSkkt.', '..kkssssSSSSSsskk.', '...kssSSSSSSSSsk..', '...kkkkkkkkkkkkk..'] },
    { id: 'crown', name: 'CROWN', price: 1500, ox: 12, oy: -7, rows: ['k....k...k....k', 'kk..kkk.kkk..kk', 'kykkyyykyyykkyk', 'kyyyyyyyyyyyyyk', 'kyyrryyyyyrryyk', 'kyyyyyyyyyyyyyk', 'kkkkkkkkkkkkkkk'] },
  ],
  glasses: [
    { id: 'none', name: 'NONE', price: 0 },
    { id: 'round', name: 'ROUND', price: 150, ox: 5, oy: 2, rows: ['..kkkk..............kkkk..', '.k....k............k....k.', 'k......k..........k......k', 'k......kkkkkkkkkkkk......k', 'k......k..........k......k', 'k......k..........k......k', '.k....k............k....k.', '..kkkk..............kkkk..'] },
    { id: 'sun', name: 'SHADES', price: 250, ox: 5, oy: 3, rows: ['kkkkkkkk..........kkkkkkkk', 'kiiiiiiikkkkkkkkkkkiiiiiiik', 'kiwiiiiik........kiwiiiiik', 'kiiiiiiik........kiiiiiiik', '.kiiiiik..........kiiiiik.', '..kkkkk............kkkkk..'] },
    { id: 'star', name: 'STAR', price: 400, ox: 4, oy: 1, rows: ['...kk......................kk...', '..kaak....................kaak..', 'kkkaakkk..............kkkaakkk..', 'kaaaaaakkkkkkkkkkkkkkkkaaaaaak..', '.kaaaak................kaaaak...', '.kaakaak..............kaakaak...', 'kkk..kkk..............kkk..kkk..'] },
    { id: 'mono', name: 'MONOCLE', price: 600, ox: 25, oy: 2, rows: ['..kkkk..', '.kyyyyk.', 'ky....yk', 'ky....yk', 'ky....yk', 'ky....yk', '.kyyyyk.', '..kkkk..', '.....k..', '......k.', '.....k..'] },
  ],
  acc: [
    { id: 'none', name: 'NONE', price: 0 },
    { id: 'mustache', name: 'MUSTACHE', price: 150, ox: 12, oy: 9, rows: ['..kkk....kkk..', '.kNNNk..kNNNk.', 'kNNNNNkkNNNNNk', '.kNNNNNNNNNNk.', '..kkkk..kkkk..'] },
    { id: 'bowtie', name: 'BOW TIE', price: 200, ox: 14, oy: 11, rows: ['kk......kk', 'krrk..krrk', 'krrrkkrrrk', 'krrrkRkrrk', 'krrk..krrk', 'kk......kk'] },
    { id: 'flower', name: 'FLOWER', price: 300, ox: 20, oy: -5, rows: ['..kpk..', '.kpppk.', 'kppyppk', 'kpyYypk', 'kppyppk', '.kpppk.', '..kpk..', '...kgk.', '...kg..'] },
    { id: 'scarf', name: 'SCARF', price: 400, ox: 9, oy: 11, rows: ['kkkkkkkkkkkkkkkkkkkk', 'krrrrRrrrrRrrrrRrrrk', 'kRrrrrRrrrrRrrrrRrrk', 'krrrrRrrrrRrrrrRrrrk', 'kkkkkkkkkkkkkkkkkkkk', '...krrrk............', '...kRrrk............', '...krRrk............', '...kkkkk............'] },
    { id: 'chain', name: 'CHAIN', price: 500, ox: 10, oy: 11, rows: ['k................k', '.ky............yk.', '..kyy........yyk..', '...kkyyyyyyyykk...', '.....kkkyykkk.....', '.......kyyk.......', '........kk........'] },
  ],
};
for (const cat in ITEMS) for (const it of ITEMS[cat]) if (it.rows) it.spr = makeSprite(it.rows, P);
const CATS = ['hat', 'glasses', 'acc'];

// ============================================================ save data
const SAVE_KEY = 'froghop_save_v1';
let save = { coins: 0, best: 0, owned: ['hat:none', 'glasses:none', 'acc:none'], eq: { hat: 'none', glasses: 'none', acc: 'none' }, sound: true, vib: true, tilt: false, runs: 0 };
try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s) save = Object.assign(save, s); } catch (e) { }
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { } }

// ============================================================ canvas / scaling
const BASE_W = 216;
const view = document.getElementById('c');
const vctx = view.getContext('2d');
const g = document.createElement('canvas');
const ctx = g.getContext('2d');
let W = BASE_W, H = 384, S = 2, CSS_W = 0, CSS_H = 0;
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  CSS_W = Math.min(innerWidth, innerHeight * 0.62); CSS_H = innerHeight;
  const pw = Math.round(CSS_W * dpr), ph = Math.round(CSS_H * dpr);
  S = Math.max(1, Math.round(pw / BASE_W));
  W = Math.ceil(pw / S); H = Math.ceil(ph / S);
  view.width = W * S; view.height = H * S;
  view.style.width = (W * S / dpr) + 'px'; view.style.height = (H * S / dpr) + 'px';
  g.width = W; g.height = H;
  ctx.imageSmoothingEnabled = false; vctx.imageSmoothingEnabled = false;
}
addEventListener('resize', resize); resize();

// ============================================================ text
const FONT = 'PPNeueBit';
function text(str, x, y, o = {}) {
  const size = o.size || 16;
  ctx.font = `bold ${size}px ${FONT}, monospace`;
  ctx.textAlign = o.align || 'left'; ctx.textBaseline = 'top';
  x = Math.round(x); y = Math.round(y);
  if (o.shadow !== false) { ctx.fillStyle = o.shadow || '#1b1a2e'; const d = size >= 24 ? 2 : 1; ctx.fillText(str, x + d, y + d); }
  ctx.fillStyle = o.color || '#ffffff'; ctx.fillText(str, x, y);
}
function textW(str, size = 16) { ctx.font = `bold ${size}px ${FONT}, monospace`; return ctx.measureText(str).width; }

// pixel panel (cream box with dark border + drop shadow) like the reference UI
function panel(x, y, w, h, fill = P.e) {
  x = Math.round(x); y = Math.round(y);
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x + 2, y + 3, w, h);
  ctx.fillStyle = P.d; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = fill; ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
  ctx.fillStyle = P.E; ctx.fillRect(x + 1, y + h - 3, w - 2, 2);
}
function button(b, label, o = {}) {
  const pressed = b.pressed ? 1 : 0;
  const x = b.x, y = b.y + pressed, w = b.w, h = b.h;
  ctx.fillStyle = P.d; ctx.fillRect(x, y + 3 - pressed, w, h);
  ctx.fillStyle = P.d; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = o.fill || P.y; ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
  ctx.fillStyle = o.hi || '#ffe98a'; ctx.fillRect(x + 1, y + 1, w - 2, 1);
  if (label) text(label, x + w / 2, y + (h - (o.size || 16)) / 2 + 1, { align: 'center', size: o.size || 16, color: o.color || P.d, shadow: false });
  if (o.icon) ctx.drawImage(o.icon, Math.round(x + (w - o.icon.width) / 2), Math.round(y + (h - o.icon.height) / 2));
}
const hit = (b, px, py) => px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h;

// ============================================================ audio
let ac = null;
function audioInit() { if (ac) return; try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } }
function tone(f0, f1, dur, type = 'square', vol = 0.12, delay = 0) {
  if (!ac || !save.sound) return;
  const t = ac.currentTime + delay;
  const o = ac.createOscillator(), gn = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
  gn.gain.setValueAtTime(vol, t); gn.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(gn); gn.connect(ac.destination); o.start(t); o.stop(t + dur + 0.02);
}
const sfx = {
  jump: () => tone(300, 620, 0.13, 'triangle', 0.14),
  spring: () => { tone(400, 1300, 0.22, 'square', 0.1); },
  superjump: () => { tone(200, 1600, 0.4, 'sawtooth', 0.12); tone(800, 1800, 0.3, 'square', 0.06, 0.05); },
  coin: () => { tone(1100, 1100, 0.06, 'square', 0.08); tone(1650, 1650, 0.1, 'square', 0.08, 0.06); },
  land: () => tone(140, 90, 0.06, 'square', 0.05),
  hit: () => { tone(220, 70, 0.25, 'square', 0.14); },
  eat: () => { tone(900, 150, 0.18, 'sawtooth', 0.1); tone(300, 700, 0.1, 'square', 0.06, 0.15); },
  pickup: () => { tone(500, 900, 0.1, 'square', 0.08); tone(900, 1400, 0.12, 'square', 0.08, 0.1); },
  charged: () => { tone(600, 1200, 0.1, 'square', 0.07); tone(900, 1800, 0.15, 'square', 0.07, 0.1); },
  die: () => { tone(500, 60, 0.6, 'sawtooth', 0.14); },
  ui: () => tone(900, 700, 0.05, 'square', 0.06),
  buy: () => { tone(800, 800, 0.08, 'square', 0.08); tone(1000, 1000, 0.08, 'square', 0.08, 0.08); tone(1300, 1300, 0.14, 'square', 0.08, 0.16); },
  nope: () => tone(200, 120, 0.2, 'square', 0.08),
  crumble: () => tone(160, 60, 0.2, 'sawtooth', 0.06),
  buzz: () => tone(180, 160, 0.15, 'sawtooth', 0.03),
};
function vibrate(ms) { if (save.vib && navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) { } } }

// ============================================================ game constants
const GRAV = 1000, JUMP_V = 420, SPRING_V = 640, SUPER_V = 840, MOVE_SPEED = 150, PLAT_H = 6;
const POWER_LAND = 6, POWER_COIN = 12, POWER_FLY = 30, TONGUE_TIME = 9, TONGUE_RANGE = 64;
const DAY_CYCLE = 3200; // px of height per full day/night cycle

let scene = 'title'; // title | play | dead | shop
let settingsOpen = false;
const game = {};
const input = { touchX: null, keys: {}, tiltX: 0 };

function camY0() { return -Math.round(H * 0.22); }

function newGame() {
  game.frog = { x: W / 2, y: 0, vx: 0, vy: 0, prevY: 0, anim: 'sit', animT: 0, dizzy: 0, blink: 0, blinkT: rnd(2, 4) };
  game.camY = camY0(); game.maxY = 0; game.score = 0; game.runCoins = 0;
  game.power = 0; game.superT = 0; game.tongueT = 0; game.tongue = null; game.charged = false;
  game.plats = []; game.coins = []; game.flies = []; game.items = []; game.parts = []; game.floaters = [];
  game.genY = 20; game.lastType = 'normal'; game.nextItemY = rnd(320, 450); game.shake = 0; game.time = 0; game.deadT = 0;
  game.clouds = [{ par: 0.3, genY: -200, list: [] }, { par: 0.6, genY: -200, list: [] }];
  game.started = false; game.newBest = false;
  genUpTo(game.camY + H + 120);
  genClouds();
}

const diffAt = y => clamp(y / 4500, 0, 1);

function genUpTo(limit) {
  while (game.genY < limit) {
    const d = diffAt(game.genY);
    const gap = lerp(34, 70, d) * rnd(0.85, 1.1);
    game.genY += gap;
    addPlatformBand(game.genY, d, gap);
  }
}
function addPlatformBand(y, d, gap) {
  const w = Math.round(lerp(46, 32, d));
  let type = 'normal';
  const r = Math.random();
  const pc = (game.lastType === 'crumble' || y < 150) ? 0 : 0.03 + 0.18 * d;
  const pm = y < 120 ? 0 : 0.05 + 0.25 * d;
  if (r < pc) type = 'crumble'; else if (r < pc + pm) type = 'moving';
  const p = { x: rnd(6, W - w - 6), y, w, type, alive: true, t: rnd(0, 6), broken: false, fallV: 0,
    vx: type === 'moving' ? (rnd(28, 45) + 55 * d) * (Math.random() < 0.5 ? -1 : 1) : 0,
    spring: type === 'normal' && y > 100 && Math.random() < 0.07 };
  game.plats.push(p); game.lastType = type;
  // a second platform in the same band now and then: gives the player an easier route
  if (d > 0.25 && Math.random() < 0.25) {
    const w2 = Math.round(w * 0.9);
    let x2 = rnd(6, W - w2 - 6); if (Math.abs(x2 - p.x) < w + 10) x2 = (p.x + w + 20 + rnd(0, 40)) % (W - w2 - 6);
    game.plats.push({ x: x2, y: y + rndi(-6, 6), w: w2, type: 'normal', alive: true, t: rnd(0, 6), broken: false, fallV: 0, vx: 0, spring: false });
  }
  // coins on the platform
  if (Math.random() < 0.36 && type !== 'crumble') {
    const n = rndi(1, 3);
    for (let i = 0; i < n; i++) game.coins.push({ x: p.x + p.w / 2 + (i - (n - 1) / 2) * 11, y: y + 16, t: rnd(0, 6), on: type === 'moving' ? p : null, dx: (i - (n - 1) / 2) * 11, taken: false });
  } else if (Math.random() < 0.12) { // an arc of coins in the air
    const cx = rnd(30, W - 30);
    for (let i = 0; i < 5; i++) game.coins.push({ x: cx + (i - 2) * 12, y: y + 30 + Math.sin(i / 4 * Math.PI) * 14, t: i * 0.3, on: null, taken: false });
  }
  // flies
  if (y > 260 && Math.random() < 0.05 + 0.24 * d) {
    game.flies.push({ bx: rnd(30, W - 30), by: y + gap * 0.55, t: rnd(0, 6), amp: rnd(25, 60), sp: rnd(1.1, 2.0) + d, x: 0, y: 0, esc: false, dead: false });
  }
  // tongue power-up
  if (y > game.nextItemY) {
    game.items.push({ x: rnd(30, W - 30), y: y + 24, t: rnd(0, 6), taken: false });
    game.nextItemY = y + rnd(650, 1000);
  }
}
function genClouds() {
  for (const L of game.clouds) {
    const limit = game.camY * L.par + H + 60;
    while (L.genY < limit) {
      L.genY += L.par < 0.5 ? rnd(40, 90) : rnd(70, 140);
      const idx = L.par < 0.5 ? rndi(0, 7) : rndi(3, 10);
      L.list.push({ x: rndi(-20, W - 20), y: L.genY, i: idx });
    }
    L.list = L.list.filter(c => (c.y - game.camY * L.par) > -60);
  }
}

function addFloater(x, y, str, color) { game.floaters.push({ x, y, str, color: color || P.Y, life: 0.9 }); }
function burst(x, y, n, colors, spd = 60, life = 0.5, gravity = 300) {
  for (let i = 0; i < n; i++) { const a = rnd(0, Math.PI * 2), s = rnd(spd * 0.3, spd); game.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rnd(life * 0.6, life), max: life, c: pick(colors), g: gravity }); }
}

// ------------------------------------------------------------ landing / bouncing
function land(p) {
  const f = game.frog;
  f.y = p ? p.y : 0; f.prevY = f.y;
  let v = JUMP_V, kind = 'jump';
  if (game.power >= 100) { v = SUPER_V; kind = 'super'; game.power = 0; game.charged = false; game.superT = 0.7; game.shake = 4; addFloater(f.x, f.y + 40, 'SUPER!', P.Y); }
  else if (p && p.spring) { v = SPRING_V; kind = 'spring'; p.springT = 0.3; }
  f.vy = v; f.anim = 'crouch'; f.animT = kind === 'jump' ? 0.07 : 0.1;
  if (p) {
    if (p.type === 'crumble') { p.alive = false; p.broken = true; sfx.crumble(); burst(p.x + p.w / 2, p.y, 6, [P.n, P.m, P.t], 50, 0.5); }
    if (kind === 'jump') addPower(POWER_LAND);
  }
  burst(f.x, f.y, kind === 'super' ? 14 : 4, kind === 'super' ? [P.Y, P.y, P.w] : ['#ffffff', '#dddddd'], kind === 'super' ? 120 : 40, 0.35, kind === 'super' ? 0 : 200);
  if (kind === 'jump') sfx.jump(); else if (kind === 'spring') sfx.spring(); else sfx.superjump();
  vibrate(kind === 'super' ? 40 : 8);
}
function addPower(n) {
  if (game.power >= 100) return;
  game.power = Math.min(100, game.power + n);
  if (game.power >= 100 && !game.charged) { game.charged = true; sfx.charged(); addFloater(game.frog.x, game.frog.y + 44, 'CHARGED!', P.Y); }
}

// ------------------------------------------------------------ one physics step
function step(dt) {
  const f = game.frog;
  game.time += dt;
  // --- input / horizontal movement
  let dir = inputDir();
  if (f.dizzy > 0) dir *= 0.45;
  f.vx += (dir * MOVE_SPEED - f.vx) * Math.min(1, 10 * dt);
  f.x += f.vx * dt;
  if (f.x < -FROG_W / 2) f.x += W + FROG_W; else if (f.x > W + FROG_W / 2) f.x -= W + FROG_W;
  // --- vertical
  f.prevY = f.y; f.vy -= GRAV * dt; f.y += f.vy * dt;
  if (f.vy < 0) {
    let landed = null;
    for (const p of game.plats) {
      if (!p.alive) continue;
      if (f.prevY >= p.y && f.y <= p.y && Math.abs(f.x - (p.x + p.w / 2)) < p.w / 2 + 8) { landed = p; break; }
    }
    if (landed) land(landed);
    else if (f.prevY >= 0 && f.y <= 0 && game.maxY < 200) land(null);
  }
  if (f.y > game.maxY) game.maxY = f.y;
  game.score = Math.floor(game.maxY / 10);
  // --- animation state
  if (f.animT > 0) { f.animT -= dt; if (f.animT <= 0) f.anim = 'jump'; }
  else f.anim = f.vy > 120 ? 'jump' : f.vy < -100 ? 'fall' : 'sit';
  if (f.dizzy > 0) f.dizzy -= dt;
  if (game.superT > 0) { game.superT -= dt; if (f.vy > 0) game.parts.push({ x: f.x + rnd(-8, 8), y: f.y + rnd(0, 10), vx: rnd(-20, 20), vy: -60, life: 0.4, max: 0.4, c: pick([P.Y, P.y, P.w]), g: 0 }); }
  if (game.tongueT > 0) game.tongueT -= dt;
  // --- platforms
  for (const p of game.plats) {
    p.t += dt;
    if (p.vx) { p.x += p.vx * dt; if (p.x < 2) { p.x = 2; p.vx = Math.abs(p.vx); } else if (p.x + p.w > W - 2) { p.x = W - 2 - p.w; p.vx = -Math.abs(p.vx); } }
    if (p.broken) { p.fallV += GRAV * dt * 0.6; p.y -= p.fallV * dt; }
    if (p.springT > 0) p.springT -= dt;
  }
  // --- coins
  for (const c of game.coins) {
    if (c.taken) continue; c.t += dt;
    if (c.on) c.x = c.on.x + c.on.w / 2 + c.dx;
    if (Math.abs(c.x - f.x) < 14 && c.y > f.y - 4 && c.y < f.y + 30) {
      c.taken = true; game.runCoins++; addPower(POWER_COIN); sfx.coin(); addFloater(c.x, c.y + 6, '+1', P.Y);
      burst(c.x, c.y, 5, [P.Y, P.y, P.w], 50, 0.35, 0);
    }
  }
  // --- tongue power-up pickups
  for (const it of game.items) {
    if (it.taken) continue; it.t += dt;
    if (Math.abs(it.x - f.x) < 16 && it.y > f.y - 6 && it.y < f.y + 32) {
      it.taken = true; game.tongueT = TONGUE_TIME; sfx.pickup(); vibrate(15); addFloater(it.x, it.y + 8, 'TONGUE!', P.p);
      burst(it.x, it.y, 8, [P.p, P.a, P.w], 60, 0.4, 0);
    }
  }
  // --- flies
  for (const fl of game.flies) {
    if (fl.dead) continue; fl.t += dt;
    if (fl.esc) { fl.y += 220 * dt; fl.x += 140 * dt; if (fl.y - game.camY > H + 40) fl.dead = true; continue; }
    fl.x = fl.bx + Math.sin(fl.t * fl.sp) * fl.amp;
    fl.y = fl.by + Math.cos(fl.t * fl.sp * 1.6) * 6;
    const dx = fl.x - f.x, dy = fl.y - (f.y + 14);
    if (game.tongueT > 0 && !game.tongue && dx * dx + dy * dy < TONGUE_RANGE * TONGUE_RANGE && fl.y - game.camY > 10) {
      game.tongue = { fly: fl, t: 0, dur: 0.32, ate: false }; fl.targeted = true;
    } else if (!fl.targeted && Math.abs(dx) < 12 && fl.y > f.y + 2 && fl.y < f.y + 28) {
      if (game.superT > 0 || game.tongueT > 0) { fl.esc = true; }
      else if (f.dizzy <= 0) {
        f.dizzy = 1.1; fl.esc = true; sfx.hit(); vibrate(60);
        f.vy = Math.min(f.vy, -60); f.vx = (dx > 0 ? -1 : 1) * 130; game.shake = 3;
        burst(f.x, f.y + 20, 6, [P.w, P.Y], 70, 0.4, 0);
      }
    } else if (!fl.esc && Math.abs(dx) < 50 && Math.abs(dy) < 40 && Math.random() < dt * 2) sfx.buzz();
  }
  // --- tongue animation / eating
  if (game.tongue) {
    const T = game.tongue; T.t += dt;
    if (!T.ate && T.t >= T.dur * 0.5) {
      T.ate = true; T.fly.dead = true; sfx.eat(); vibrate(20);
      game.runCoins += 2; addPower(POWER_FLY); addFloater(T.fly.x, T.fly.y + 8, 'YUM +2', P.p);
      burst(T.fly.x, T.fly.y, 6, [P.q, P.w, P.k], 50, 0.35, 100);
    }
    if (T.t >= T.dur) game.tongue = null;
  }
  // --- particles & floaters
  for (const pt of game.parts) { pt.life -= dt; pt.vy -= pt.g * dt; pt.x += pt.vx * dt; pt.y += pt.vy * dt; }
  game.parts = game.parts.filter(pt => pt.life > 0);
  for (const fl of game.floaters) { fl.life -= dt; fl.y += 30 * dt; }
  game.floaters = game.floaters.filter(fl => fl.life > 0);
  // --- camera
  const target = f.y - H * 0.5;
  if (target > game.camY) game.camY = target;
  genUpTo(game.camY + H + 120);
  genClouds();
  // cleanup
  const cut = game.camY - 80;
  game.plats = game.plats.filter(p => p.y > cut);
  game.coins = game.coins.filter(c => !c.taken && c.y > cut);
  game.flies = game.flies.filter(fl => !fl.dead && fl.y > cut - 100);
  game.items = game.items.filter(it => !it.taken && it.y > cut);
  if (game.shake > 0) game.shake = Math.max(0, game.shake - 12 * dt);
  // --- death
  if (f.y < game.camY - 30) die();
}
function die() {
  scene = 'dead'; game.deadT = 0; sfx.die(); vibrate([40, 40, 80]); game.shake = 5;
  save.coins += game.runCoins; save.runs++;
  if (game.score > save.best) { save.best = game.score; game.newBest = true; }
  persist();
}

function inputDir() {
  let d = 0;
  if (input.keys.ArrowLeft || input.keys.KeyA) d -= 1;
  if (input.keys.ArrowRight || input.keys.KeyD) d += 1;
  if (input.touchX !== null) d += clamp((input.touchX - game.frog.x) / 18, -1, 1);
  if (save.tilt) d += clamp(input.tiltX / 18, -1, 1);
  return clamp(d, -1, 1);
}

// ============================================================ rendering
const sy = y => Math.round(H - (y - game.camY));

const SKY_KEYS = [[0, '#2f8fe0', '#a8e4ff'], [0.28, '#2f8fe0', '#a8e4ff'], [0.42, '#5b3f8f', '#ff9c5a'], [0.55, '#0e0c2c', '#2c2558'], [0.78, '#0e0c2c', '#2c2558'], [0.9, '#4a3b8f', '#ffb0a8'], [1, '#2f8fe0', '#a8e4ff']];
function dayPhase() { return ((Math.max(0, game.camY - camY0()) / DAY_CYCLE) % 1 + 1) % 1; }
function skyAt(ph) {
  for (let i = 0; i < SKY_KEYS.length - 1; i++) {
    const a = SKY_KEYS[i], b = SKY_KEYS[i + 1];
    if (ph >= a[0] && ph <= b[0]) { const t = (ph - a[0]) / (b[0] - a[0]); return { top: mixHex(a[1], b[1], t), bot: mixHex(a[2], b[2], t) }; }
  }
  return { top: SKY_KEYS[0][1], bot: SKY_KEYS[0][2] };
}
function nightAmount(ph) { return ph < 0.42 ? 0 : ph < 0.55 ? (ph - 0.42) / 0.13 : ph < 0.78 ? 1 : ph < 0.9 ? 1 - (ph - 0.78) / 0.12 : 0; }
const CLOUD_SEGS = [[0, 'day'], [0.35, 'eve'], [0.5, 'night'], [0.82, 'dawn'], [0.95, 'day'], [1.001, 'day']];
function cloudBlend(ph) {
  for (let i = 0; i < CLOUD_SEGS.length - 1; i++) {
    if (ph >= CLOUD_SEGS[i][0] && ph < CLOUD_SEGS[i + 1][0]) {
      const next = CLOUD_SEGS[i + 1][0], a = CLOUD_SEGS[i][1], b = CLOUD_SEGS[i + 1][1];
      if (a !== b && ph > next - 0.06) return [a, b, (ph - (next - 0.06)) / 0.06];
      return [a, a, 0];
    }
  }
  return ['day', 'day', 0];
}
const STARS = []; for (let i = 0; i < 70; i++) STARS.push({ x: Math.random(), y: Math.random(), tw: rnd(0, 6), big: Math.random() < 0.2 });

function drawSky() {
  const ph = dayPhase(), sk = skyAt(ph), night = nightAmount(ph);
  const band = 6;
  for (let y = 0; y < H; y += band) { ctx.fillStyle = mixHex(sk.top, sk.bot, y / H); ctx.fillRect(0, y, W, band); }
  if (night > 0.02) {
    const tile = H * 2;
    for (const s of STARS) {
      const x = Math.round(s.x * W), y = Math.round((((s.y * tile - game.camY * 0.15) % tile) + tile) % tile);
      if (y > H) continue;
      const tw = 0.6 + 0.4 * Math.sin(game.time * 3 + s.tw);
      ctx.globalAlpha = night * tw; ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y, 1, 1);
      if (s.big) { ctx.fillRect(x - 1, y, 1, 1); ctx.fillRect(x + 1, y, 1, 1); ctx.fillRect(x, y - 1, 1, 1); ctx.fillRect(x, y + 1, 1, 1); }
    }
    ctx.globalAlpha = 1;
  }
  // sun & moon
  // the sun sets (slides down behind the horizon) while the moon rises
  const bodyY = 26 + Math.round(((game.camY * 0.05) % 20 + 20) % 20);
  const sunY = bodyY + Math.round(night * (H * 0.9)), moonY = bodyY + Math.round((1 - night) * (H * 0.9));
  if (night < 1) ctx.drawImage(ICON.sun, W - 44, sunY);
  if (night > 0) ctx.drawImage(ICON.moon, W - 44, moonY);
}
function drawClouds() {
  const [a, b, t] = cloudBlend(dayPhase());
  for (const L of game.clouds) {
    const alpha = L.par < 0.5 ? 0.7 : 1;
    for (const c of L.list) {
      const y = Math.round(H - (c.y - game.camY * L.par));
      const sprA = CLOUDS[a][c.i];
      if (y < -40 || y > H + 10) continue;
      ctx.globalAlpha = alpha; ctx.drawImage(sprA, c.x, y);
      if (t > 0) { ctx.globalAlpha = alpha * t; ctx.drawImage(CLOUDS[b][c.i], c.x, y); }
    }
  }
  ctx.globalAlpha = 1;
}
function drawGround() {
  const gy = sy(0);
  if (gy > H + 30) return;
  // hills silhouette (parallax)
  const hy = Math.round(H - (0 - game.camY * 0.5));
  ctx.fillStyle = '#2f6b2f';
  for (let i = 0; i < 6; i++) { const cx = ((i * 61 + 20) % (W + 60)) - 30, r = 22 + (i % 3) * 10; ctx.beginPath(); ctx.arc(cx, hy + 6, r, Math.PI, 0); ctx.fill(); }
  ctx.fillStyle = '#245524';
  for (let i = 0; i < 5; i++) { const cx = ((i * 83 + 50) % (W + 60)) - 30, r = 14 + (i % 2) * 8; ctx.beginPath(); ctx.arc(cx, hy + 6, r, Math.PI, 0); ctx.fill(); }
  // reeds / cattails
  for (let i = 0; i < 7; i++) {
    const x = (i * 37 + 9) % W, h = 14 + (i % 3) * 4;
    ctx.fillStyle = '#3d7a2a'; ctx.fillRect(x, gy - h, 1, h);
    ctx.fillStyle = '#6b4a2a'; ctx.fillRect(x - 1, gy - h, 3, 5);
    ctx.fillStyle = '#8fd032'; ctx.fillRect(x + 2, gy - h + 6, 1, 4);
  }
  // grass
  ctx.fillStyle = P.k; ctx.fillRect(0, gy - 1, W, 1);
  ctx.fillStyle = '#8fd032'; ctx.fillRect(0, gy, W, 2);
  ctx.fillStyle = '#61a53f'; ctx.fillRect(0, gy + 2, W, 5);
  ctx.fillStyle = '#3d7a2a'; for (let x = 0; x < W; x += 7) ctx.fillRect(x + (x % 14 ? 2 : 0), gy + 3 + (x % 21 === 0 ? 2 : 0), 2, 1);
  // dirt
  ctx.fillStyle = '#6b4a2a'; ctx.fillRect(0, gy + 7, W, 10);
  ctx.fillStyle = '#4a2e12'; for (let x = 3; x < W; x += 11) ctx.fillRect(x, gy + 9 + (x % 22 === 3 ? 4 : 0), 3, 2);
  ctx.fillStyle = P.k; ctx.fillRect(0, gy + 17, W, 1);
  // water
  ctx.fillStyle = '#2f7fd0'; ctx.fillRect(0, gy + 18, W, Math.max(0, H - gy - 18));
  ctx.fillStyle = '#8fd0ff';
  for (let row = 0; row < 6; row++) {
    const yy = gy + 22 + row * 9; if (yy > H) break;
    const off = Math.round(Math.sin(game.time * 1.5 + row) * 4);
    for (let x = -10; x < W + 10; x += 22) ctx.fillRect(x + off + row * 7, yy, 7, 1);
  }
  // lily pads on the water
  ctx.fillStyle = '#61a53f'; ctx.fillRect(18, gy + 26, 12, 3); ctx.fillRect(W - 40, gy + 34, 14, 3);
  ctx.fillStyle = '#8fd032'; ctx.fillRect(19, gy + 26, 10, 1); ctx.fillRect(W - 39, gy + 34, 12, 1);
}
function drawPlat(p) {
  const x = Math.round(p.x), y = sy(p.y), w = p.w, h = PLAT_H;
  if (y < -10 || y > H + 10) return;
  let body = '#61a53f', hi = '#8fd032', dark = '#3d7a2a';
  if (p.type === 'moving') { body = '#a8743e'; hi = '#d2a86a'; dark = '#6b4a2a'; }
  if (p.type === 'crumble') { body = '#c08a3a'; hi = '#e0b060'; dark = '#8a5a2a'; }
  ctx.fillStyle = P.k; ctx.fillRect(x + 1, y, w - 2, h); ctx.fillRect(x, y + 1, 1, h - 2); ctx.fillRect(x + w - 1, y + 1, 1, h - 2);
  ctx.fillStyle = body; ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
  ctx.fillStyle = hi; ctx.fillRect(x + 2, y + 1, w - 4, 1);
  ctx.fillStyle = dark; ctx.fillRect(x + 2, y + h - 2, w - 4, 1);
  if (p.type === 'normal') { for (let i = 4; i < w - 4; i += 7) ctx.fillRect(x + i, y + 2, 2, 1); }
  else if (p.type === 'moving') { ctx.fillStyle = dark; for (let i = 3; i < w - 3; i += 9) ctx.fillRect(x + i, y + 2, 4, 1); ctx.fillStyle = hi; ctx.fillRect(x + 5, y + 3, 2, 1); }
  else { ctx.fillStyle = P.k; for (let i = 6; i < w - 6; i += 10) { ctx.fillRect(x + i, y + 1, 1, 2); ctx.fillRect(x + i + 1, y + 3, 1, 2); } }
  if (p.spring) { const sp = ICON.spring, sx = Math.round(x + w / 2 - sp.width / 2); const comp = p.springT > 0 ? 2 : 0; ctx.drawImage(sp, 0, 0, sp.width, sp.height, sx, y - sp.height + 1 + comp, sp.width, sp.height - comp); }
}
function drawFrogAt(cx, feetY, anim, lean, blink, eq) {
  const spr = FROG[anim] || FROG.sit;
  const x0 = Math.round(cx - FROG_W / 2), y0 = Math.round(feetY - spr.height);
  if (lean) { const half = Math.floor(spr.height / 2); ctx.drawImage(spr, 0, 0, spr.width, half, x0 + lean, y0, spr.width, half); ctx.drawImage(spr, 0, half, spr.width, spr.height - half, x0, y0 + half, spr.width, spr.height - half); }
  else ctx.drawImage(spr, x0, y0);
  if (blink && anim === 'sit') { ctx.fillStyle = '#61a53f'; ctx.fillRect(x0 + 7, y0 + 4, 5, 4); ctx.fillRect(x0 + 26, y0 + 4, 5, 4); ctx.fillStyle = '#293f21'; ctx.fillRect(x0 + 7, y0 + 7, 5, 1); ctx.fillRect(x0 + 26, y0 + 7, 5, 1); }
  for (const cat of ['glasses', 'acc', 'hat']) {
    const it = ITEMS[cat].find(i => i.id === (eq || save.eq)[cat]);
    if (it && it.spr) ctx.drawImage(it.spr, x0 + it.ox + (lean && it.oy < 8 ? lean : 0), y0 + it.oy);
  }
  return { x0, y0, h: spr.height };
}
function drawFrog() {
  const f = game.frog;
  const lean = Math.abs(f.vx) > 50 ? Math.sign(f.vx) : 0;
  const pos = drawFrogAt(f.x, sy(f.y), f.anim, lean, f.blink > 0, null);
  if (f.x < FROG_W / 2) drawFrogAt(f.x + W + FROG_W, sy(f.y), f.anim, lean, f.blink > 0, null);
  else if (f.x > W - FROG_W / 2) drawFrogAt(f.x - W - FROG_W, sy(f.y), f.anim, lean, f.blink > 0, null);
  if (f.dizzy > 0) { ctx.fillStyle = P.Y; for (let i = 0; i < 3; i++) { const a = game.time * 6 + i * 2.1; ctx.fillRect(Math.round(f.x + Math.cos(a) * 11), pos.y0 - 5 + Math.round(Math.sin(a) * 3), 2, 2); } }
  if (game.tongueT > 0 && !game.tongue) { // ready tongue: little pink tip at the mouth
    ctx.fillStyle = P.p; ctx.fillRect(Math.round(f.x - 1), pos.y0 + 11, 3, 1);
  }
}
function drawTongue() {
  const T = game.tongue; if (!T) return;
  const f = game.frog, k = T.t / T.dur, ext = k < 0.5 ? k * 2 : (1 - k) * 2;
  const mx = Math.round(f.x), my = sy(f.y) - 17; // mouth
  const tx = Math.round(mx + (T.fly.x - f.x) * ext), ty = Math.round(my + (sy(T.fly.y) - my) * ext);
  ctx.strokeStyle = P.k; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(tx, ty); ctx.stroke();
  ctx.strokeStyle = P.p; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(tx, ty); ctx.stroke();
  ctx.fillStyle = P.k; ctx.fillRect(tx - 3, ty - 3, 6, 6); ctx.fillStyle = P.a; ctx.fillRect(tx - 2, ty - 2, 4, 4);
}
const FLY_L = [flipSprite(ICON.fly0), flipSprite(ICON.fly1)];
function drawFly(fl) {
  const y = sy(fl.y), x = Math.round(fl.x);
  if (y < -10 || y > H + 10) return;
  const fr = Math.abs(Math.floor(game.time * 24)) % 2;
  const right = fl.esc || Math.cos(fl.t * fl.sp) > 0;
  const spr = right ? [ICON.fly0, ICON.fly1][fr] : FLY_L[fr];
  ctx.drawImage(spr, x - 5, y - 3);
  if (game.tongueT > 0 && !fl.esc) { ctx.fillStyle = P.p; ctx.fillRect(x - 1, y - 10, 2, 2); }
}
const COIN_FRAMES = [ICON.coin, ICON.coinThin, ICON.coinLine, ICON.coinThin];
function drawCoin(c) {
  const y = sy(c.y), fr = COIN_FRAMES[Math.abs(Math.floor(c.t * 6)) % 4];
  if (y < -10 || y > H + 10) return;
  ctx.drawImage(fr, Math.round(c.x - fr.width / 2), y - 4);
}
function drawItem(it) {
  const y = sy(it.y) + Math.round(Math.sin(it.t * 3) * 2), x = Math.round(it.x);
  if (y < -14 || y > H + 14) return;
  ctx.globalAlpha = 0.25 + 0.15 * Math.sin(it.t * 5); ctx.fillStyle = P.p; ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
  ctx.drawImage(ICON.tongue, x - 5, y - 5);
}
function drawWorld() {
  ctx.save();
  if (game.shake > 0) ctx.translate(Math.round(rnd(-game.shake, game.shake)), Math.round(rnd(-game.shake, game.shake)));
  drawSky(); drawClouds(); drawGround();
  // best-score line
  if (save.best > 0 && scene !== 'title') {
    const by = sy(save.best * 10);
    if (by > 10 && by < H) { ctx.fillStyle = 'rgba(255,255,255,0.6)'; for (let x = 0; x < W; x += 6) ctx.fillRect(x, by, 3, 1); ctx.drawImage(ICON.trophy, 4, by - 10); text('' + save.best, 16, by - 13, { size: 16 }); }
  }
  for (const p of game.plats) drawPlat(p);
  for (const c of game.coins) drawCoin(c);
  for (const it of game.items) drawItem(it);
  for (const pt of game.parts) { ctx.globalAlpha = clamp(pt.life / pt.max * 1.5, 0, 1); ctx.fillStyle = pt.c; const s = pt.life > pt.max * 0.5 ? 2 : 1; ctx.fillRect(Math.round(pt.x), sy(pt.y), s, s); }
  ctx.globalAlpha = 1;
  drawFrog(); drawTongue();
  for (const fl of game.flies) drawFly(fl);
  for (const fl of game.floaters) { ctx.globalAlpha = clamp(fl.life * 2, 0, 1); text(fl.str, fl.x, sy(fl.y), { size: 16, align: 'center', color: fl.color }); }
  ctx.globalAlpha = 1;
  ctx.restore();
}

// ------------------------------------------------------------ HUD / screens
function drawCoinCounter(x, y, n) { ctx.drawImage(ICON.coin, x, y + 2); text('' + n, x + 11, y, { size: 16, color: P.Y }); }
function drawHUD() {
  drawCoinCounter(5, 4, game.runCoins);
  text('' + game.score, W / 2, 2, { size: 24, align: 'center' });
  // power bar
  const bw = 56, bx = Math.round(W / 2 - bw / 2), by = 26;
  const full = game.power >= 100, blinkOn = Math.floor(game.time * 6) % 2 === 0;
  ctx.fillStyle = P.k; ctx.fillRect(bx - 1, by - 1, bw + 2, 8);
  ctx.fillStyle = '#2a2a3a'; ctx.fillRect(bx, by, bw, 6);
  ctx.fillStyle = full ? (blinkOn ? P.Y : P.y) : '#8fd032'; ctx.fillRect(bx, by, Math.round(bw * game.power / 100), 6);
  if (!full) { ctx.fillStyle = '#c8ff80'; ctx.fillRect(bx, by, Math.round(bw * game.power / 100), 1); }
  ctx.drawImage(ICON.bolt, bx - 8, by - 1);
  if (full && blinkOn) text('SUPER JUMP!', W / 2, by + 9, { size: 16, align: 'center', color: P.Y });
  // tongue timer
  if (game.tongueT > 0) {
    const tx = W - 14, ty = 6; ctx.drawImage(ICON.tongue, tx, ty);
    ctx.fillStyle = P.k; ctx.fillRect(tx - 32, ty + 3, 30, 5); ctx.fillStyle = P.p; ctx.fillRect(tx - 31, ty + 4, Math.round(28 * game.tongueT / TONGUE_TIME), 3);
  }
}
let buttons = [];
function addBtn(x, y, w, h, fn) { const b = { x, y, w, h, fn }; buttons.push(b); return b; }

function drawTitle() {
  // frog idle on the ground
  const bob = Math.sin(game.time * 3) * 2;
  text('FROG', W / 2 + 1, H * 0.13 + bob, { size: 48, align: 'center', color: P.y, shadow: P.d });
  text('HOP', W / 2, H * 0.13 + 40 + bob, { size: 48, align: 'center', color: P.y, shadow: P.d });
  const by = H * 0.13 + 96;
  ctx.drawImage(ICON.trophy, Math.round(W / 2 - 18), by + 1); text('' + save.best, W / 2 - 4, by - 1, { size: 16 });
  drawCoinCounter(5, 4, save.coins);
  const cart = addBtn(W - 26, 2, 24, 22, () => { scene = 'shop'; shopTab = 0; });
  ctx.drawImage(ICON.cart, cart.x + 6, cart.y + 6);
  const gear = addBtn(2, 20, 22, 22, () => { settingsOpen = true; });
  ctx.drawImage(ICON.gear, gear.x + 6, gear.y + 6);
  // tap hint
  if (Math.floor(game.time * 2) % 2 === 0) { const hy = sy(0) + 24; ctx.drawImage(ICON.hand, W / 2 - 22, hy + Math.round(Math.sin(game.time * 8))); text('TAP!', W / 2 + 10, hy, { size: 16, color: P.Y }); }
  if (save.runs < 3) text('HOLD & DRAG TO MOVE', W / 2, sy(0) + 40, { size: 16, align: 'center', color: '#ffffff' });
}
function drawDead() {
  const t = clamp(game.deadT * 2.2, 0, 1), ease = 1 - Math.pow(1 - t, 3);
  ctx.fillStyle = 'rgba(20,10,30,' + (0.45 * ease) + ')'; ctx.fillRect(0, 0, W, H);
  if (game.deadT < 0.25) return;
  const pw = W - 36, ph = 164, px = 18, py = Math.round(H * 0.5 - ph / 2 - 10 + (1 - ease) * 40);
  panel(px, py, pw, ph);
  text('SPLASH!', W / 2, py + 6, { size: 24, align: 'center', color: P.d, shadow: false });
  text('' + game.score, W / 2, py + 30, { size: 48, align: 'center', color: P.d, shadow: P.E });
  if (game.newBest) { if (Math.floor(game.time * 4) % 2 === 0) text('NEW BEST!', W / 2, py + 76, { size: 16, align: 'center', color: '#c03030', shadow: false }); }
  else { ctx.drawImage(ICON.trophy, Math.round(W / 2 - 18), py + 78); text('' + save.best, W / 2 - 4, py + 76, { size: 16, color: P.d, shadow: false }); }
  ctx.drawImage(ICON.coin, Math.round(W / 2 - 16), py + 96); text('+' + game.runCoins, W / 2 - 4, py + 94, { size: 16, color: P.d, shadow: false });
  if (game.deadT < 0.6) return;
  const rb = addBtn(px + 12, py + ph - 48, pw - 24, 22, () => { newGame(); startGame(); });
  button(rb, 'RETRY', { size: 16 });
  const hb = addBtn(px + 12, py + ph - 24, (pw - 28) / 2, 18, () => { newGame(); scene = 'title'; });
  button(hb, null, { icon: ICON.home, fill: P.e });
  const sb = addBtn(px + 16 + (pw - 28) / 2, py + ph - 24, (pw - 28) / 2, 18, () => { scene = 'shop'; shopTab = 0; });
  button(sb, null, { icon: ICON.cart, fill: P.e });
}
let shopTab = 0, shopMsg = null;
function drawShop() {
  ctx.fillStyle = '#3b2a3f'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#463250'; for (let y = 0; y < H; y += 12) for (let x = (y / 12) % 2 ? 6 : 0; x < W; x += 12) ctx.fillRect(x, y, 1, 1);
  drawCoinCounter(5, 4, save.coins);
  const cb = addBtn(W - 24, 2, 22, 20, () => { scene = game.started ? 'dead' : 'title'; });
  ctx.drawImage(ICON.close, cb.x + 7, cb.y + 7);
  // preview
  const cy = 60;
  ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.arc(W / 2, cy, 28, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(W / 2, cy, 28.5, 0, Math.PI * 2); ctx.stroke();
  drawFrogAt(W / 2, cy + 16 + Math.round(Math.sin(game.time * 3)), 'sit', 0, game.frog.blink > 0, null);
  // tabs
  const tabW = 34, tabY = 98, tabs = [ITEMS.hat[2].spr, ICON.glassesTab, ICON.heart];
  for (let i = 0; i < 3; i++) {
    const tx = Math.round(W / 2 - tabW * 1.5 - 8 + i * (tabW + 8));
    const b = addBtn(tx, tabY, tabW, 26, () => { shopTab = i; });
    ctx.fillStyle = P.d; ctx.fillRect(tx, tabY, tabW, 26);
    ctx.fillStyle = shopTab === i ? P.e : '#8c7d5c'; ctx.fillRect(tx + 1, tabY + 1, tabW - 2, 24);
    const ic = tabs[i]; ctx.drawImage(ic, Math.round(tx + tabW / 2 - ic.width / 2), Math.round(tabY + 13 - ic.height / 2));
    if (shopTab === i) { ctx.fillStyle = P.y; ctx.fillRect(tx + 2, tabY + 28, tabW - 4, 2); }
  }
  // grid
  const cat = CATS[shopTab], list = ITEMS[cat];
  const cols = 4, gap = 4, cw = Math.floor((W - 12 - gap * (cols - 1)) / cols), ch = 44, gx0 = Math.round((W - (cw * cols + gap * (cols - 1))) / 2), gy0 = tabY + 38;
  list.forEach((it, idx) => {
    const col = idx % cols, row = Math.floor(idx / cols);
    const x = gx0 + col * (cw + gap), y = gy0 + row * (ch + gap);
    const key = cat + ':' + it.id, owned = save.owned.includes(key), equipped = save.eq[cat] === it.id;
    addBtn(x, y, cw, ch, () => shopTap(cat, it));
    ctx.fillStyle = P.d; ctx.fillRect(x, y, cw, ch);
    ctx.fillStyle = equipped ? P.e : owned ? '#b8ab7a' : '#6a5a4a'; ctx.fillRect(x + 1, y + 1, cw - 2, ch - 2);
    if (equipped) { ctx.fillStyle = P.y; ctx.fillRect(x - 1, y - 1, cw + 2, 1); ctx.fillRect(x - 1, y + ch, cw + 2, 1); ctx.fillRect(x - 1, y - 1, 1, ch + 2); ctx.fillRect(x + cw, y - 1, 1, ch + 2); }
    if (it.spr) {
      const s = it.spr, sw = Math.min(s.width, cw - 6);
      ctx.globalAlpha = owned ? 1 : 0.55;
      ctx.drawImage(s, Math.round(x + cw / 2 - s.width / 2), Math.round(y + 15 - s.height / 2));
      ctx.globalAlpha = 1;
    } else { ctx.fillStyle = P.d; ctx.fillRect(x + cw / 2 - 5, y + 14, 10, 2); }
    if (owned) { if (equipped) ctx.drawImage(ICON.check, Math.round(x + cw / 2 - 4), y + ch - 14); }
    else {
      const can = save.coins >= it.price;
      ctx.drawImage(ICON.coin, x + 3, y + ch - 12); text('' + it.price, x + 13, y + ch - 14, { size: 16, color: can ? '#ffffff' : '#a89a8a', shadow: can ? P.d : false });
    }
  });
  const nameIt = list.find(i => i.id === save.eq[cat]);
  if (shopMsg && shopMsg.t > 0) { shopMsg.t -= 1 / 60; text(shopMsg.s, W / 2, H - 30, { size: 16, align: 'center', color: shopMsg.c }); }
  else if (nameIt) text(nameIt.name, W / 2, H - 30, { size: 16, align: 'center', color: '#c8b890' });
}
function shopTap(cat, it) {
  const key = cat + ':' + it.id;
  if (save.owned.includes(key)) {
    save.eq[cat] = (save.eq[cat] === it.id && it.id !== 'none') ? 'none' : it.id; persist(); sfx.ui();
  } else if (save.coins >= it.price) {
    save.coins -= it.price; save.owned.push(key); save.eq[cat] = it.id; persist(); sfx.buy(); vibrate(20);
    shopMsg = { s: 'GOT ' + it.name + '!', t: 1.5, c: P.Y };
  } else { sfx.nope(); vibrate(30); shopMsg = { s: 'NEED ' + (it.price - save.coins) + ' MORE', t: 1.2, c: '#ff8080' }; }
}
function drawToggle(x, y, on) {
  ctx.fillStyle = P.d; ctx.fillRect(x, y, 26, 12);
  ctx.fillStyle = on ? '#5fcf4a' : '#8a8a8a'; ctx.fillRect(x + 1, y + 1, 24, 10);
  ctx.fillStyle = on ? '#9af07a' : '#b0b0b0'; ctx.fillRect(x + 1, y + 1, 24, 1);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(on ? x + 15 : x + 2, y + 2, 9, 8);
  ctx.fillStyle = '#d0d0d0'; ctx.fillRect(on ? x + 15 : x + 2, y + 9, 9, 1);
}
function drawSettings() {
  ctx.fillStyle = 'rgba(20,10,30,0.5)'; ctx.fillRect(0, 0, W, H);
  const pw = W - 44, ph = 118, px = 22, py = Math.round(H / 2 - ph / 2 - 20);
  panel(px, py, pw, ph);
  ctx.drawImage(ICON.gear, Math.round(W / 2 - 5), py + 7);
  const cb = addBtn(px + pw - 22, py + 2, 20, 20, () => { settingsOpen = false; });
  ctx.drawImage(ICON.close, cb.x + 7, cb.y + 7);
  const rows = [['speaker', 'sound'], ['vibrate', 'vib'], ['tilt', 'tilt']];
  rows.forEach((r, i) => {
    const y = py + 30 + i * 28;
    ctx.drawImage(ICON[r[0]], px + 22, y + 1);
    const b = addBtn(px + pw - 52, y - 4, 40, 20, () => {
      if (r[1] === 'tilt' && !save.tilt) enableTilt(); else { save[r[1]] = !save[r[1]]; persist(); }
    });
    drawToggle(b.x + 7, b.y + 4, save[r[1]]);
    text(r[1] === 'tilt' ? 'TILT' : r[1] === 'vib' ? 'BUZZ' : 'SOUND', px + 42, y - 2, { size: 16, color: P.d, shadow: false });
  });
}
function enableTilt() {
  const done = () => { save.tilt = true; persist(); };
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission().then(r => { if (r === 'granted') done(); }).catch(() => { });
  } else done();
}

// ============================================================ input
function startGame() {
  scene = 'play'; settingsOpen = false; game.started = true;
  game.frog.vy = JUMP_V; game.frog.anim = 'jump'; sfx.jump(); vibrate(8);
}
function toLogical(e) { const r = view.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; }
let activePointer = null;
view.addEventListener('pointerdown', e => {
  e.preventDefault();
  audioInit(); if (ac && ac.state === 'suspended') ac.resume();
  const [x, y] = toLogical(e);
  for (const b of buttons) if (hit(b, x, y)) { sfx.ui(); b.fn(); return; }
  if (settingsOpen || scene === 'shop' || scene === 'dead') return;
  if (scene === 'title') startGame();
  activePointer = e.pointerId; input.touchX = x;
}, { passive: false });
view.addEventListener('pointermove', e => {
  if (activePointer !== e.pointerId) return;
  input.touchX = toLogical(e)[0];
});
const endPointer = e => { if (activePointer === e.pointerId) { activePointer = null; input.touchX = null; } };
view.addEventListener('pointerup', endPointer); view.addEventListener('pointercancel', endPointer);
addEventListener('keydown', e => {
  input.keys[e.code] = true;
  if (e.code === 'Space' || e.code === 'Enter') {
    if (settingsOpen) settingsOpen = false;
    else if (scene === 'title') startGame();
    else if (scene === 'dead' && game.deadT > 0.6) { newGame(); startGame(); }
    else if (scene === 'shop') scene = game.started ? 'dead' : 'title';
  }
  if (e.code === 'Escape' && scene === 'shop') scene = game.started ? 'dead' : 'title';
});
addEventListener('keyup', e => { input.keys[e.code] = false; });
addEventListener('deviceorientation', e => { input.tiltX = e.gamma || 0; });
addEventListener('blur', () => { input.keys = {}; input.touchX = null; });
document.addEventListener('contextmenu', e => e.preventDefault());

// ============================================================ main loop
let last = 0, acc = 0;
const DT = 1 / 120;
function frame(now) {
  requestAnimationFrame(frame);
  let dt = clamp((now - last) / 1000 || 0, 0, 0.05); last = now; // rAF timestamps can precede performance.now() on the first frame
  const f = game.frog;
  // idle blink timer
  f.blinkT -= dt; if (f.blinkT <= 0) { f.blink = 0.12; f.blinkT = rnd(2, 5); }
  if (f.blink > 0) f.blink -= dt;
  if (scene === 'play') {
    acc += dt;
    let n = 0;
    while (acc >= DT && n++ < 8) { step(DT); acc -= DT; if (scene !== 'play') break; }
  } else {
    game.time += dt;
    if (scene === 'dead') {
      game.deadT += dt;
      for (const pt of game.parts) { pt.life -= dt; pt.vy -= pt.g * dt; pt.x += pt.vx * dt; pt.y += pt.vy * dt; }
      game.parts = game.parts.filter(pt => pt.life > 0);
      if (game.shake > 0) game.shake = Math.max(0, game.shake - 12 * dt);
      // the frog keeps falling out of view
      f.vy -= GRAV * dt; f.y += f.vy * dt;
    }
    if (scene === 'title') { for (const p of game.plats) p.t += dt; for (const c of game.coins) c.t += dt; for (const it of game.items) it.t += dt; }
  }
  // ---- render
  buttons = [];
  ctx.clearRect(0, 0, W, H);
  if (scene === 'shop') drawShop();
  else {
    drawWorld();
    if (scene === 'play') drawHUD();
    else if (scene === 'title') drawTitle();
    else if (scene === 'dead') { drawHUD(); drawDead(); }
    if (settingsOpen) drawSettings();
  }
  vctx.drawImage(g, 0, 0, W, H, 0, 0, W * S, H * S);
}
addEventListener('resize', () => { if (scene === 'title' || scene === 'shop') { newGame(); } });
document.addEventListener('visibilitychange', () => { if (document.hidden && scene === 'play') { input.touchX = null; } });

// ---- boot: load the pixel font first so the UI never flashes a fallback font
newGame();
const fontFace = new FontFace(FONT, 'url(data:font/otf;base64,' + ASSETS.fontB64 + ')');
let booted = false;
const boot = () => { if (booted) return; booted = true; last = performance.now(); requestAnimationFrame(frame); };
fontFace.load().then(ff => { document.fonts.add(ff); boot(); }).catch(boot);
setTimeout(boot, 1500);
