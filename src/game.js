/* FROHG - a Doodle-Jump style pixel game. Everything renders on a low-res canvas, then scaled up pixel-perfect. */
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

const POTION = '#7851f2'; // potion / tongue-power colour
const CP = { k: '#0a0a0a', y: '#fab530', o: '#e0801e', c: '#ffecb4' }; // gold coin palette (from the coin reference)
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
// frog colour skins: the greens (a dark, d deep, b mid, c light) and the belly (g, h) are remapped per skin.
// Patterned skins add spots or stripes on top of the skin. The eyes and outline stay the same.
const SKINS = {
  green: {},
  yellow: { a: '#5a4a10', d: '#b8901c', b: '#e8c22c', c: '#fff05a', g: '#fff3cf', h: '#f0d49a' },
  blue: { a: '#14284f', d: '#2f5aa8', b: '#3f7fe0', c: '#7fb8ff', g: '#e2f3ff', h: '#b4d6f0' },
  magenta: { a: '#4a1040', d: '#a0287e', b: '#d83aa8', c: '#ff7ad6', g: '#ffe2f5', h: '#f0b6dc' },
  white: { a: '#5a6070', d: '#b4bcca', b: '#dde2ec', c: '#ffffff', g: '#fff3c8', h: '#f0d898' },
  dart: { a: '#0c1c4a', d: '#1f4fc4', b: '#2f78f0', c: '#5ec8ff', g: '#9ee6ff', h: '#5ec0f0', spots: '#0a0a14' },        // poison dart frog: blue with black spots
  tiger: { a: '#4a2008', d: '#c4561a', b: '#f07a22', c: '#ffb04a', g: '#fff0d8', h: '#f0d0a8', stripes: '#2a1206' },     // orange with dark stripes
};
const SKIN_IDS = Object.keys(SKINS);
const skinPal = id => Object.assign({}, ASSETS.frogPal, SKINS[id] || {});
const FROG_SKINS = {};
function frogFrames(id) {
  if (FROG_SKINS[id]) return FROG_SKINS[id];
  const sk = SKINS[id] || {}, pal = skinPal(id), out = {};
  for (const k in ASSETS.frog) {
    const rows = ASSETS.frog[k].map((r, y) => r.split('').map((ch, x) => {
      if (!'bcd'.includes(ch)) return ch;
      if (sk.spots) { const v = Math.sin((x * 0.9 + 3) * 12.9898 + (y * 1.1 + 5) * 78.233) * 43758.5; if (v - Math.floor(v) < 0.2 && y > 1) return 'S'; }
      if (sk.stripes && (x + Math.floor(y / 2)) % 6 === 0 && y > 1) return 'S';
      return ch;
    }).join(''));
    out[k] = makeSprite(rows, Object.assign({}, pal, { S: sk.spots || sk.stripes || pal.a }));
  }
  return (FROG_SKINS[id] = out);
}
const FROG = frogFrames('green');
const FROG_W = FROG.sit.width; // 38

const CLOUD_PALS = {
  day: ASSETS.cloudPal,
  eve: tintPal(ASSETS.cloudPal, h => mixHex(h, '#ffb088', 0.45)),
  night: tintPal(ASSETS.cloudPal, h => mixHex(h, '#2a2050', 0.7)),
  dawn: tintPal(ASSETS.cloudPal, h => mixHex(h, '#ffc7d0', 0.4)),
};
const CLOUDS = {};
for (const k in CLOUD_PALS) CLOUDS[k] = ASSETS.clouds.map(c => makeSprite(c.rows, CLOUD_PALS[k]));

const ASSETS_POTION_ROWS = ['....kkkkk....',
    '....kmmmk....',
    '....knnnk....',
    '....kqwqk....',
    '...kkqwqkk...',
    '..kqqqqqqqk..',
    '.kqppppppPqk.',
    'kwpaappppppPk',
    'kwpawppppppPk',
    'kwpappppwpPPk',
    'kwppppppppPPk',
    '.kwpppppPPPk.',
    '..kkPPPPPkk..',
    '....kkkkk....'];
const ICON = {
  coin: makeSprite(['...kkkkkk...', '..kooyyoyk..', '.koyocccyyk.', 'koyoyyyycyyk', 'kooyoyyoycyk', 'kyoyoyyoycyk', 'kyoyyyyyycyk', 'kooyooooycyk', 'kyyoyyyycyyk', '.kyyocccyyk.', '..kyyyyyyk..', '...kkkkkk...'], CP), // world coin, 12px
  coinBig: makeSprite(['.....kkkkkk.....', '...kkoyyyyokk...', '..koyooccccyyk..', '.koyooyyyyccyyk.', '.kyoyyyyyyyycyk.', 'koooyyyyyyyyccyk', 'kyoyyyoyyoyyycyk', 'kyoyyyoyyoyyycyk', 'kyoyyyyyyyyyycyk', 'kyoyyooooooyycyk', 'koooyoyoyoyyccyk', '.kyoyyyyyyyycyk.', '.kyyooyyyyccyyk.', '..kyyooccccyyk..', '...kkyyyyyykk...', '.....kkkkkk.....'], CP), // UI coin, 16px, drawn at full resolution
  coinThin: makeSprite(['..kkk..', '.koyok.', '.kocck.', 'kyyyyyk', 'kooyock', 'kooyock', 'koyyyck', 'koooock', 'kyyyyyk', '.kocck.', '.kyyyk.', '..kkk..'], CP),
  coinLine: makeSprite(['.k.', 'kok', 'kyk', 'kyk', 'kyk', 'kyk', 'kyk', 'kyk', 'kyk', 'kyk', 'kok', '.k.'], CP),
  trophy: makeSprite(['...kkkkkkkkkk...', '.kkkcyyyyyyokkk.', 'k.kkcyyyyyyokk.k', 'k.kkcyyyyyyokk.k', 'k.kkcyyyyyyokk.k', '.k.kccyyyyyok.k.', '..kkkcyyyyyokk..', '....kkyyyyokk...', '......kcyk......', '......kcyk......', '......kcok......', '.....kcyyok.....', '....kcyyyyok....', '....kkkkkkkk....'], { k: '#0a0a0a', y: '#ffc400', c: '#fff3b0', o: '#e48a00' }), // gold cup with handles
  cart: makeSprite(['kkk...............', '..kkkkkkkkkkkkkkk.', '...kk.k..k...k..k.', '...kkkkkkkkkkkkkk.', '...kk.k..k..k..k..', '...kkkkkkkkkkkkk..', '....k.k.kk..k.k...', '....kkkkkkkkkk....', '....kkkkkkkkkkkk..', '...............k..', '...kkkkkkkkkkkkk..', '....kk......kk....', '....kk......kk....'], P), // solid black cart, basket gaps cut out
  gear: makeSprite(['....kk....', '.kk.kk.kk.', '.kkkkkkkk.', '..kk..kk..', 'kkkk..kkkk', 'kkkk..kkkk', '..kk..kk..', '.kkkkkkkk.', '.kk.kk.kk.', '....kk....'], P),
  close: makeSprite(['kk...kk', '.kk.kk.', '..kkk..', '..kkk..', '.kk.kk.', 'kk...kk'], P),
  hand: makeSprite(['..kk.......', '.kwwk......', '.kwwk......', '.kwwk......', '.kwwkkkkk..', '.kwwkwwkwwk', 'kkwwwwwwwwk', 'kwkwwwwwwwk', 'kwwwwwwwwwk', 'kwwwwwwwwwk', '.kwwwwwwwwk', '..kwwwwwwk.', '..kkkkkkkk.'], P), // pointing hand
  note: makeSprite(['...kkkk', '...kkkk', '...k..k', '...k..k', '...k..k', '.kkk.kk', 'kkkkkkk', '.kk.kk.'], P),
  speaker: makeSprite(['....k....', '...kk..k.', '..kwk.k.k', 'kkkwk..kk', 'kwwwk.k.k', 'kkkwk..kk', '..kwk.k.k', '...kk..k.', '....k....'], P),
  vibrate: makeSprite(['k..kkkkk..k', '.k.kwwwk.k.', 'k.kkwwwk.k.', '.k.kwwwk.k.', 'k..kwwwk..k', '.k.kwwwk.k.', 'k..kkkkk..k'], P),
  tilt: makeSprite(['..kkkkk....', '.kwwwwwk...', 'kkkkkkwwk..', '.kwwwwwwwk.', '..kwwwwwwwk', '...kkkkkkkk'], P),
  home: makeSprite(['....k....', '...kkk...', '..kkkkk..', '.kkkkkkk.', 'kkkkkkkkk', '.kkkkkkk.', '.kkk.kkk.', '.kkk.kkk.', '.kkk.kkk.'], P), // solid house, door cut out
  retry: makeSprite(['..kkkkk...', '.kk...kk..', 'kk.....kk.', 'kk....kkkk', 'kk.....kk.', 'kk....k.k.', '.kk..kk...', '..kkkk....'], P),
  heart: makeSprite(['.kk..kk.', 'krrkkrrk', 'krrrrrrk', 'krrrrrrk', '.krrrrk.', '..krrk..', '...kk...'], P),
  heartEmpty: makeSprite(['.kk..kk.', 'k..kk..k', 'k......k', 'k......k', '.k....k.', '..k..k..', '...kk...'], P),
  glassesTab: makeSprite(['kkkkk.kkkkk', 'kiiiikiiiik', 'kiwiikiwiik', '.kiik.kiik.', '..kk...kk..'], P),
  bolt: makeSprite(['...kk', '..kyk', '.kyyk', 'kyyyk', 'kkkyk', '..kyk', '..kk.'], P),
  star: makeSprite(['..y..', '.yyy.', 'yyyyy', '.yyy.', '..y..'], P),
  potion: makeSprite(ASSETS_POTION_ROWS, Object.assign({}, P, { p: POTION, a: '#a98bff', P: '#4a2bb0' })), // corked potion bottle, purple brew
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
// astronaut helmet: white shell with a grey groove, side ear pieces, dark tinted visor with glare, neck ring
const HELMET_PAL = { k: '#0a0a0c', w: '#f4f2f8', s: '#cdd0da', S: '#6e7880', e: '#a9b8b8', v: 'rgba(40,52,52,0.86)', V: 'rgba(24,30,30,0.94)', h: '#ffffff' };
// wizard hat, barbarian horned helm and plumed knight helmet palettes
const WIZARD_PAL = { k: '#0a0a0c', L: '#b48cff', p: '#7b2fd8', D: '#4a14a0', X: '#2a0a5a', o: '#e8b23a', y: '#ffd666', O: '#b07018', w: '#fff6d6' };
const BARB_PAL = { k: '#0a0a0c', l: '#cedcf2', L: '#a9bde0', M: '#7d92b8', D: '#55688c', V: '#1a1e28' };
const KNIGHT_PAL = { k: '#0a0a0c', M: '#6d7d99', N: '#5c6b87', D: '#46536c', o: '#f0ba40', O: '#b8761c', r: '#ba1c46', R: '#7a0c2a', Q: '#961236', h: '#e85476', S: '#465064', T: '#323a4a' };
const ITEMS = {
  hat: [
    { id: 'none', name: 'NONE', price: 0 },
    { id: 'leaf', name: 'LEAF', price: 100, ox: 11, oy: -4, rows: ['.......k.......', '......kck......', '..kkkkcGck.....', '.kccccccGGck...', 'kcccGGGcccGGGk.', 'kgggggggggggggk', '.kkkkkkkkkkkkk.'] },
    { id: 'cap', name: 'CAP', price: 150, ox: 11, oy: -5, rows: ['....kkkkkkk.....', '..kkbbbbbbbkk...', '.kbbbbbbBbbbbk..', 'kbbbbbbbbbbbbbk.', 'kBbbbbbbbbbbbbkkkk', 'kBBBBBBBBBBBBBBBBk', '.kkkkkkkkkkkkkkkk.'] },
    { id: 'party', name: 'PARTY', price: 250, ox: 12, oy: -9, rows: ['......ww......', '.....wwww.....', '......kk......', '.....kyyk.....', '.....kppk.....', '....kyyyyk....', '....kppppk....', '...kyyyyyyk...', '...kppppppk...', '..kyyyyyyyyk..', '..kppppppppk..', '.kkkkkkkkkkkk.'] },
    { id: 'tophat', name: 'TOP HAT', price: 400, ox: 11, oy: -8, rows: ['...kkkkkkkkk...', '...kiiiiiiik...', '...kiiiiiiik...', '...kiiiiiiik...', '...kiiiiiiik...', '...krrrrrrrk...', '.kkkiiiiiiikkk.', '.kiiiiiiiiiiik.', '.kkkkkkkkkkkkk.'] },
    { id: 'cowboy', name: 'COWBOY', price: 550, ox: 10, oy: -7, rows: ['.....kkkkkkk.....', '....knnnnnnnk....', '....knnNNNnnk....', 'k...knnnnnnnk...k', 'kn..knnnnnnnk..nk', 'knnnkNNNNNNNknnnk', '.knnnnnnnnnnnnnk.', '..kkkkkkkkkkkkk..'] },
    { id: 'viking', name: 'VIKING', price: 800, ox: 10, oy: -8, rows: ['k...............k', 'kt.............tk', 'ktt...kkkkkkk..ttk', '.kt..kssssssSk.tk.', '.ktkkssssssssSkkt.', '..kkssssSSSSSsskk.', '...kssSSSSSSSSsk..', '...kkkkkkkkkkkkk..'] },
    { id: 'crown', name: 'CROWN', price: 1500, ox: 8, oy: -10, rows: ['..........k..........', '..k...k..kwk..k...k..', '.kwk.kwk.kwk.kwk.kwk.', '.kyk.kyk.kyk.kyk.kyk.', '.kyk.kyk.kyk.kyk.kyk.', 'kYyokYyokYyokYyokYyok', 'kYyokYyokYyokYyokYyok', 'kYYYYYYYYYYYYYYYYYYYk', 'kyyyyryyyrwryyyryyyyk', 'kyyyyRyyyRrRyyyRyyyyk', 'koooooooooooooooooook', '.kkkkkkkkkkkkkkkkkkk.'] },
    { id: 'antennae', name: 'ALIEN', price: 350, ox: 8, oy: -9, rows: ['.kkk..............kkk.', 'kcwck............kcwck', 'kccck............kccck', '.kkk.k..........k.kkk.', '......k........k......', '......k........k......', '.......k......k.......', '.......k......k.......', '.......k......k.......', '.......k......k.......'] },
    { id: 'helmet', name: 'ASTRONAUT', price: 900, ox: -4, oy: -12, pal: HELMET_PAL, rows: ['....................kkkkkk....................', '...............kkkkkwwwwwwkkkkk...............', '.............kkwwwwwwwwwwwwwwwwkk.............', '...........kkwwwwwwwwwwwwwwwwwwwwkk...........', '.........kkSSSSSSSSSSSSSSSSSSSSSSSSkk.........', '........kSSSSSSSSSSSSSSSSSSSSSSSSSSSSk........', '.......kwwwwwwwwwwwwwwwwwwwwwwwwwwwsssk.......', '......kwwwwwwwwwwwwwwVVVVwwwwwwwwwwssssk......', '.....kwwwwwwwwwwVVVVVvvvvVVVVVwwwwwsssssk.....', '.....kwwwwwwwwVVvvvvvvvvvvvvvhhhwwwsssssk.....', '.kkkkwwwwwwwVVvvvvvvvvvvvvvvvhhhVVwsssssskkkk.', '.kwwwwwwwwwVvvvvvvvvvvvvvvvvvhhhvvVssssssseek.', '.kwwwwwwwwVvvvvvvvvvvvvvvvvvvvvvvvvVsssssseek.', '.kwwwwwwwVvvvvvvvvvvvvvvvvvhhvvvvvvvVssssseek.', '.kwwwwwwwVvvvvvvvvvvvvvvvvvvvvvvvvvvVssssssek.', '.kwwwwwwVvvvvvvvvvvvvvvvvvvvvvvvvvvvvVsssseek.', '.kwwwwwwVvvvvvvvvvvvvvvvvvvvvvvvvvvvvVsssseek.', '.kwwwwwwVvvvvvvvvvvvvvvvvvvvvvvvvvvvvVsssseek.', '.kwwwwwwVvvvvvvvvvvvvvvvvvvvvvvvvvvvvVsssseek.', '.kwwwwwwwVvvvvvvvvvvvvvvvvvvvvvvvvvvVsssseeek.', '.kkkkkwwwVvvvvvvvvvvvvvvvvvvvvvvvvvvVssskkkkk.', '......kwwwVvvvvvvvvvvvvvvvvvvvvvvvvVsssk......', '.......kwwwVvvvvvvvvvvvvvvvvvvvvvvVsssk.......', '........kwwwVVvvvvvvvvvvvvvvvvvvVVwssk........', '.........kksssVVVVVVVVVVVVVVVVVVssskk.........', '...........kkswwVVVVVVVVVVVVVVwwskk...........', '.............kkwwwwwwVVVVwwwwwwkk.............', '...............kkkkkwwwwwwkkkkk...............', '....................kkkkkk....................'] },
    { id: 'wizard', name: 'WIZARD', price: 700, ox: 4, oy: -21, pal: WIZARD_PAL, rows: ['................................', '..................kkkk..........', '................kkppppkk........', '...............kppDDDDDDkk......', '...............kDDpkkkDDDDkk....', '...............kLpDXk.kkXXDDk...', '...............kLpDXk...kkXXk...', '..............kLppDDk.....kk....', '.............kLpppDDXk..........', '............kLLpppDDXk..........', '...........kLLppppDDXk..........', '..........kLLppppDDDXXk.........', '.........kLLLppppDDDXXk.........', '........kLLLpppppDDDXXk.........', '.......kLLLLpppppDDDDXXk........', '......kLLLLppppppDDDDXXk........', '......kLLLpppppppDDDDXXkk.......', '......koooowwwwwoooooooook......', '......kyyyywyyywyyyyyyyyyk......', '.kkkkkkOOOOwwwwwOOOOOOOOOkkkkkk.', 'kLLLLLLLLppppppppppppDDDDDDDDDDk', 'kLLLLLLLLppppppppppppDDDDDDDDDDk', '.kkkLLLLLppppppppppppDDDDDDDkkk.', '....kkkkkkkkkkkkkkkkkkkkkkkk....'] },
    { id: 'barbarian', name: 'BARBARIAN', price: 1000, ox: -4, oy: -16, pal: BARB_PAL, rows: ['..............................................', '......kkkkkkk....................kkkkkkk......', '....kkLLLLMMLk..................kMMMMMMMkk....', '...klLLMMMMMMk..................kDDDDDMMMLk...', '..klLLMMkkkkk....................kkkkkDDMMLk..', '.kllLLDk............kkkkkk............kDMMLLk.', 'klllLMk........kkkkkMMllMMkkkkk........kDMLLLk', 'klllLMk.....kkkLLMMMMMllMMMDDDDkkk.....kDMLLLk', 'klllLk.....kLLLLLMMMMMllMMMDDDDDDDk.....kMLLLk', 'klllLk...kkLLLLLLMMMMMllMMMDDDDDDDDkk...kMLLLk', 'kllllDk.kLLLLLLLLMMMMMllMMMDDDDDDDDDDk.kDLLLLk', 'kllllLkkLLLLLLLLLMMMMMllMMMDDDDDDDDDDDkkMLLLLk', 'kllllLkkLLLLLLLLLMMMMMllMMMDDDDDDDDDDDkkMLLLLk', 'kllllllLLLLLLLLLLMMMMMllMMMDDDDDDDDDDDDLLLLLLk', 'kllllllLLLLLLLLLLMMMMMllMMMDDDDDDDDDDDDLLLLLLk', 'kllllllLLLLLLLLLLMMMMMllMMMDDDDDDDDDDDDLLLLLLk', 'kLlllllLLLLLLLLLLMMMMMllMMMDDDDDDDDDDDDLLLLLMk', '.klllllLLkkkkkkkkkMMMMlMMMMDkkkkkkkkkDDLLLLLk.', '..kllllLLk.......kMMMMMMMMMDk.......kDDLLLLk..', '..kLLLLLLk.......kMMMMMMMMMDk.......kDDMMMMk..', '...kkMLLLk.......kMMMMMMMMMDk.......kDDMDkk...', '.....kkLLk.......kMMMMMMMMMDk.......kDDkk.....', '......kLLk.......kMMMMMMMMMDk.......kDDk......', '......kLLk.......kMMMMMMMMMDk.......kDDk......', '......kLLk.......kMMMMMMMMMDk.......kDDk......', '......kLLk.......kMMMMMMMMMDk.......kDDk......', '......kLLkkkkkkkkkMMMMMMMMMDkkkkkkkkkDDk......', '......kLLLLLLLLLLMMMkVVVVkMDDDDDDDDDDDDk......', '......kLLLLLLLLLLMMMkVVVVkMDDDDDDDDDDDDk......', '.....kLLLLLLLLLLLMMMkVVVVkMDDDDDDDDDDDDDk.....', '....kMMMMMMMMMMMMMMMMMMMDDDDDDDDDDDDDDDDDk....', '.....kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk.....', '..............................................', '..............................................'] },
    { id: 'knight', name: 'KNIGHT', price: 1200, ox: -1, oy: -25, pal: KNIGHT_PAL, rows: ['..........................................', '................k.kkkk.kkk................', '............kkkkrkrrhrkhQQkkkk............', '..........kkrrhrrhrrhrrhQQhQQhkk..........', '........kkRhrRhrRhrRhrRhQRhQRhQRkk........', '.......krrRrrRrrRrrRrrRQQRQQRQQRQQk.......', '......kRrrRrrRrrRrrRrrRQQRQQRQQRQQRk......', '.....krRrrRrrRrrRrrRrrRQQRQQRQQRQQRQk.....', '....krrRrrRrrRrrRrrRrrRQQRQQRQQRQQRQQk....', '...kRrrRrrRrrRrrRrrRrrRQQRQQRQQRQQRQQRk...', '...kRrrRrrRrrRrrRrrRrrRQQRQQRQQRQQRQQRk...', '..krRrrRrrRrrRrkkkkkkkkkkkkQRQQRQQRQQRQk..', '..kRRRRRRRRRRkk...kSSTTk...kkRRRRRRRRRRk..', '..kRRRRRRRRRk.....kSSTTk.....kRRRRRRRRRk..', '...kkkkkkkkk.....kkSSTTkk.....kkkkkkkkk...', '............kkkkkMNNoONNNkkkkk............', '.........kkkMMMMMMNNoONNNDDDDDkkk.........', '.......kkMMMMMMMMMNNoONNNDDDDDDDDkk.......', '......kMMMMMMMMMMMNNoONNNDDDDDDDDDDk......', '.....kMMMMMMMMMMMMNNoONNNDDDDDDDDDDDk.....', '....kMMMMMMMMMMMMMNNoONNNDDDDDDDDDDDDk....', '...kMMMMMMMMMMMMMMNNooNNNDDDDDDDDDDDDDk...', '..kMMMMMMMMMMMMMMMNooOoNNDDDDDDDDDDDDDDk..', '..kMMMMMMMMMMMMMMMoNoONoNDDDDDDDDDDDDDDk..', '..kooooooooooooooooooooooooooooooooooook..', '..kOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOk..', '..kMMMMokkkkkkkkkkkkkkkkkkkkkkkkkkODDDDk..', '..kMMMMok........................kODDDDk..', '..kMMMMok........................kODDDDk..', '..kMMMMok........................kODDDDk..', '..kMMMMok........................kODDDDk..', '..kMMMMok........................kODDDDk..', '..krMMMokk......................kkODDDRk..', '..krMMMoMMk....................kDDODDDRk..', '..koooooMMk....................kDDOOOOOk..', '...kkkkkkk......................kkkkkkk...', '..........................................', '..........................................'] },
  ],
  glasses: [
    { id: 'none', name: 'NONE', price: 0 },
    { id: 'round', name: 'ROUND', price: 150, ox: 5, oy: 2, rows: ['..kkkk..............kkkk..', '.k....k............k....k.', 'k......k..........k......k', 'k......kkkkkkkkkkkk......k', 'k......k..........k......k', 'k......k..........k......k', '.k....k............k....k.', '..kkkk..............kkkk..'] },
    { id: 'sun', name: 'SHADES', price: 250, ox: 5, oy: 3, rows: ['kkkkkkkk..........kkkkkkkk', 'kiiiiiiikkkkkkkkkkkiiiiiiik', 'kiwiiiiik........kiwiiiiik', 'kiiiiiiik........kiiiiiiik', '.kiiiiik..........kiiiiik.', '..kkkkk............kkkkk..'] },
    { id: 'star', name: 'STAR', price: 400, ox: 4, oy: 1, rows: ['...kk......................kk...', '..kaak....................kaak..', 'kkkaakkk..............kkkaakkk..', 'kaaaaaakkkkkkkkkkkkkkkkaaaaaak..', '.kaaaak................kaaaak...', '.kaakaak..............kaakaak...', 'kkk..kkk..............kkk..kkk..'] },
    { id: 'mono', name: 'MONOCLE', price: 600, ox: 25, oy: 2, rows: ['..kkkk..', '.kyyyyk.', 'ky....yk', 'ky....yk', 'ky....yk', 'ky....yk', '.kyyyyk.', '..kkkk..', '.....k..', '......k.', '.....k..'] },
    { id: 'goggles', name: 'DIVE MASK', price: 450, ox: 2, oy: 1, rows: ['BBBkkkkkkkkkkkkkkkkkkkkkkkkkkkkBBB', 'BBBkbbbbbbbbbbbbbbbbbbbbbbbbbbkBBB', '...kbhq.......bkkkkbbhq.......k...', '...kbq........bbbbbbbq........k...', '...kb.........bbbbbbb.........k...', '...kb.........bbbbbbb.........k...', '...kb........qbbbbbbb........qk...', '...kbbbbbbbbbbbkkkkbbbbbbbbbbbk...', '....kkkkkkkkkkk....kkkkkkkkkkk....'] },
  ],
  acc: [
    { id: 'none', name: 'NONE', price: 0 },
    { id: 'mustache', name: 'MUSTACHE', price: 150, ox: 12, oy: 9, rows: ['..kkk....kkk..', '.kNNNk..kNNNk.', 'kNNNNNkkNNNNNk', '.kNNNNNNNNNNk.', '..kkkk..kkkk..'] },
    { id: 'bowtie', name: 'BOW TIE', price: 200, ox: 14, oy: 11, rows: ['kk......kk', 'krrk..krrk', 'krrrkkrrrk', 'krrrkRkrrk', 'krrk..krrk', 'kk......kk'] },
    { id: 'flower', name: 'FLOWER', price: 300, ox: 20, oy: -5, rows: ['..kpk..', '.kpppk.', 'kppyppk', 'kpyYypk', 'kppyppk', '.kpppk.', '..kpk..', '...kgk.', '...kg..'] },
    { id: 'scarf', name: 'SCARF', price: 400, ox: 9, oy: 11, rows: ['kkkkkkkkkkkkkkkkkkkk', 'krrrrRrrrrRrrrrRrrrk', 'kRrrrrRrrrrRrrrrRrrk', 'krrrrRrrrrRrrrrRrrrk', 'kkkkkkkkkkkkkkkkkkkk', '...krrrk............', '...kRrrk............', '...krRrk............', '...kkkkk............'] },
    { id: 'chain', name: 'CHAIN', price: 500, ox: 10, oy: 11, rows: ['k................k', '.ky............yk.', '..kyy........yyk..', '...kkyyyyyyyykk...', '.....kkkyykkk.....', '.......kyyk.......', '........kk........'] },
    { id: 'snorkel', name: 'SNORKEL', price: 300, ox: 16, oy: -8, rows: ['..................kkkk', '..................kxxk', '..................kxxk', '..................kxxk', '..................kkkk', '..................kyyk', '..................kyyk', '..................kyyk', '..................kyyk', '..................kyyk', '..................kyyk', '..................kyyk', '..................kyyk', '..................kyyk', '..................kyyk', '..................kyyk', '..................kyyk', 'kkkkkkkkkkkkkkkkkkyykk', 'kNNNNNyyyyyyyyyyyyyyyk', 'kkkkkkkkkkkkkkkkkkkkkk'] },
  ],
};
for (const cat in ITEMS) for (const it of ITEMS[cat]) if (it.rows) it.spr = makeSprite(it.rows, it.pal || P);
const CATS = ['skin', 'hat', 'glasses', 'acc'];
ITEMS.skin = [
  { id: 'green', name: 'GREEN', price: 0 }, { id: 'yellow', name: 'YELLOW', price: 200 }, { id: 'blue', name: 'BLUE', price: 200 },
  { id: 'magenta', name: 'MAGENTA', price: 250 }, { id: 'white', name: 'WHITE', price: 300 }, { id: 'dart', name: 'DART FROG', price: 600 },
  { id: 'tiger', name: 'TIGER', price: 600 },
];
for (const it of ITEMS.skin) it.spr = frogFrames(it.id).sit;

// ============================================================ save data
const SAVE_KEY = 'froghop_save_v1';
let save = { coins: 0, best: 0, owned: ['hat:none', 'glasses:none', 'acc:none'], eq: { hat: 'none', glasses: 'none', acc: 'none' }, sound: true, music: true, musicVol: 0.6, vib: true, tilt: false, runs: 0 };
try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s) save = Object.assign(save, s); } catch (e) { }
if (!save.eq.skin) save.eq.skin = 'green'; // saves from before skins existed
if (!save.owned.includes('skin:green')) save.owned.push('skin:green');
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { } }

// ============================================================ canvas / scaling
const BASE_W = 216;
const view = document.getElementById('c');
const vctx = view.getContext('2d');
const g = document.createElement('canvas');
let ctx = g.getContext('2d'); // swapped to the object layer while world objects are drawn
const mainCtx = ctx;
// world objects (platforms, coins, potions, flies) get their own layer so they can fade in at the top of the screen
const og = document.createElement('canvas');
const octx = og.getContext('2d');
let W = BASE_W, H = 384, S = 2, CSS_W = 0, CSS_H = 0, SAFE_TOP = 0;
// reads the iPhone notch / status-bar inset (env(safe-area-inset-top)) so the top bar never hides under it
const safeProbe = document.createElement('div');
safeProbe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:env(safe-area-inset-top,0px);visibility:hidden;pointer-events:none';
document.body.appendChild(safeProbe);
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  CSS_W = Math.min(innerWidth, innerHeight * 0.62); CSS_H = innerHeight;
  const pw = Math.round(CSS_W * dpr), ph = Math.round(CSS_H * dpr);
  S = Math.max(1, Math.round(pw / BASE_W));
  W = Math.ceil(pw / S); H = Math.ceil(ph / S);
  SAFE_TOP = Math.ceil(safeProbe.getBoundingClientRect().height * dpr / S);
  view.width = W * S; view.height = H * S;
  view.style.width = (W * S / dpr) + 'px'; view.style.height = (H * S / dpr) + 'px';
  g.width = W; g.height = H; og.width = W; og.height = H; octx.imageSmoothingEnabled = false;
  ctx.imageSmoothingEnabled = false; vctx.imageSmoothingEnabled = false;
}
addEventListener('resize', resize); resize();

// ============================================================ text: PP NeueBit Bold as a bitmap font
// Glyphs are extracted on the font's own pixel grid by tools/make_font.py (1 font pixel = 1/28 em, cap height 14).
// Text is queued and drawn on the full-resolution canvas at an integer scale, so it stays crisp and keeps
// NeueBit's fine detail instead of being squeezed into the chunky game pixels.
const FONT = ASSETS.font, CAP = FONT.cap;
const glyphCache = {};
function glyph(ch, color, wide = false) {
  const key = (wide ? 'W' : 'N') + color + ch;
  if (key in glyphCache) return glyphCache[key];
  const gd = gOf(ch, wide);
  return (glyphCache[key] = gd.rows.length ? makeSprite(gd.rows, { '#': color }) : null);
}
// brand palette: the logo's lime (#d0f053) and pure black, used across the whole interface
const INK = '#000000', LIME = '#d0f053', LIME_DOT = '#b6d63e', GRAY = '#7d8f32';
const PAPER = LIME; // default UI text / panel colour
const BUILD = '__BUILD__'; // replaced with the build time by build.py, shown on the title screen
const FREE_SHOP = true; // test build: everything in the shop is free
// size keeps its old meaning: the cap height is 7 * round(size / 8) game pixels (8 -> 7px, 16 -> 14px, 24 -> 21px)
const capOf = size => (size || 16) * 7 / 8; // cap height in game pixels (8 -> 7, 12 -> 10.5, 16 -> 14, 24 -> 21)
const fontPx = size => Math.max(1, Math.round(capOf(size) * S / CAP)); // device pixels per font pixel
const TRACK = 1; // extra letter spacing in font pixels: NeueBit is set tight, this opens it up a little
// "bold expanded" face for numbers, button labels and short callouts: a hand-drawn 7px-high pixel font with
// 2px strokes and wide letterforms (in the spirit of Press Start 2P). Lowercase falls back to uppercase.
const WIDE_GLYPHS = {"0":{"rows":[".#####.","##...##","##..###","##.#.##","###..##","##...##",".#####."],"x":0,"y":0,"adv":8},"1":{"rows":["..##..",".###..","..##..","..##..","..##..","..##..","######"],"x":0,"y":0,"adv":7},"2":{"rows":[".#####.","##...##",".....##","..####.",".###...","###....","#######"],"x":0,"y":0,"adv":8},"3":{"rows":["#######","....##.","...##..","..####.",".....##","##...##",".#####."],"x":0,"y":0,"adv":8},"4":{"rows":["...###.","..####.",".##.##.","##..##.","#######","....##.","....##."],"x":0,"y":0,"adv":8},"5":{"rows":["######.","##.....","######.",".....##",".....##","##...##",".#####."],"x":0,"y":0,"adv":8},"6":{"rows":["..####.",".##....","##.....","######.","##...##","##...##",".#####."],"x":0,"y":0,"adv":8},"7":{"rows":["#######","##...##","....##.","...##..","..##...","..##...","..##..."],"x":0,"y":0,"adv":8},"8":{"rows":[".#####.","##...##","##...##",".#####.","##...##","##...##",".#####."],"x":0,"y":0,"adv":8},"9":{"rows":[".#####.","##...##","##...##",".######",".....##","....##.",".####.."],"x":0,"y":0,"adv":8},"A":{"rows":["..###..",".##.##.","##...##","##...##","#######","##...##","##...##"],"x":0,"y":0,"adv":8},"B":{"rows":["######.","##...##","##...##","######.","##...##","##...##","######."],"x":0,"y":0,"adv":8},"C":{"rows":["..####.",".##..##","##.....","##.....","##.....",".##..##","..####."],"x":0,"y":0,"adv":8},"D":{"rows":["#####..","##..##.","##...##","##...##","##...##","##..##.","#####.."],"x":0,"y":0,"adv":8},"E":{"rows":["#######","##.....","##.....","######.","##.....","##.....","#######"],"x":0,"y":0,"adv":8},"F":{"rows":["#######","##.....","##.....","######.","##.....","##.....","##....."],"x":0,"y":0,"adv":8},"G":{"rows":["..#####",".##....","##.....","##..###","##...##",".##..##","..#####"],"x":0,"y":0,"adv":8},"H":{"rows":["##...##","##...##","##...##","#######","##...##","##...##","##...##"],"x":0,"y":0,"adv":8},"I":{"rows":["######","..##..","..##..","..##..","..##..","..##..","######"],"x":0,"y":0,"adv":7},"J":{"rows":["....###",".....##",".....##",".....##","##...##","##...##",".#####."],"x":0,"y":0,"adv":8},"K":{"rows":["##...##","##..##.","##.##..","####...","#####..","##.###.","##..###"],"x":0,"y":0,"adv":8},"L":{"rows":["##.....","##.....","##.....","##.....","##.....","##.....","#######"],"x":0,"y":0,"adv":8},"M":{"rows":["##...##","###.###","#######","#######","##.#.##","##...##","##...##"],"x":0,"y":0,"adv":8},"N":{"rows":["##...##","###..##","####.##","#######","##.####","##..###","##...##"],"x":0,"y":0,"adv":8},"O":{"rows":[".#####.","##...##","##...##","##...##","##...##","##...##",".#####."],"x":0,"y":0,"adv":8},"P":{"rows":["######.","##...##","##...##","##...##","######.","##.....","##....."],"x":0,"y":0,"adv":8},"Q":{"rows":[".#####.","##...##","##...##","##...##","##.####","##..##.",".####.#"],"x":0,"y":0,"adv":8},"R":{"rows":["######.","##...##","##...##","##..###","#####..","##.###.","##..###"],"x":0,"y":0,"adv":8},"S":{"rows":[".####..","##..##.","##.....",".#####.",".....##","##...##",".#####."],"x":0,"y":0,"adv":8},"T":{"rows":["######","..##..","..##..","..##..","..##..","..##..","..##.."],"x":0,"y":0,"adv":7},"U":{"rows":["##...##","##...##","##...##","##...##","##...##","##...##",".#####."],"x":0,"y":0,"adv":8},"V":{"rows":["##...##","##...##","##...##","###.###",".#####.","..###..","...#..."],"x":0,"y":0,"adv":8},"W":{"rows":["##...##","##...##","##.#.##","#######","#######","###.###","##...##"],"x":0,"y":0,"adv":8},"X":{"rows":["##...##","###.###",".#####.","..###..",".#####.","###.###","##...##"],"x":0,"y":0,"adv":8},"Y":{"rows":["##..##","##..##","##..##",".####.","..##..","..##..","..##.."],"x":0,"y":0,"adv":7},"Z":{"rows":["#######","....###","...###.","..###..",".###...","###....","#######"],"x":0,"y":0,"adv":8},"!":{"rows":["##","##","##","##","##","..","##"],"x":0,"y":0,"adv":3},"+":{"rows":["......","..##..","..##..","######","..##..","..##..","......"],"x":0,"y":0,"adv":7},"-":{"rows":["......","......","......","######","......","......","......"],"x":0,"y":0,"adv":7},"%":{"rows":["##...##","##..##.","...##..","..##...",".##....","##..##.","#...##."],"x":0,"y":0,"adv":8},":":{"rows":["..","##","##","..","##","##",".."],"x":0,"y":0,"adv":3},".":{"rows":["..","..","..","..","..","##","##"],"x":0,"y":0,"adv":3},",":{"rows":["..","..","..","..","..","##","#."],"x":0,"y":0,"adv":3},"?":{"rows":[".#####.","##...##","....##.","...##..","...##..",".......","...##.."],"x":0,"y":0,"adv":8},"&":{"rows":[".###...","##.##..",".###...",".###.##","##.###.","##..##.",".###.##"],"x":0,"y":0,"adv":8},"'":{"rows":["##","##",".#","..","..","..",".."],"x":0,"y":0,"adv":3},"/":{"rows":[".....##","....##.","...##..","..##...",".##....","##.....","#......"],"x":0,"y":0,"adv":8}};
const WIDE = { cap: 7, glyphs: WIDE_GLYPHS };
WIDE_GLYPHS[' '] = { rows: [], x: 0, y: 0, adv: 5 };
const isNumeric = str => /^[+\-]?[\d%,.]+$/.test(str);
const fontOf = wide => wide ? WIDE : FONT;
const pxOf = (size, wide) => Math.max(1, Math.round(capOf(size) * S / fontOf(wide).cap)); // device px per font px
const gOf = (ch, wide) => { const f = fontOf(wide).glyphs; return f[ch] || (wide && f[ch.toUpperCase()]) || f['?']; };
function strAdv(str, track = TRACK, wide = false) { let a = 0; for (const ch of str) a += gOf(ch, wide).adv + track; return a - (str.length ? track : 0); }
function textW(str, size = 16, track = TRACK, wide = isNumeric(String(str))) { return strAdv(String(str), track, wide) * pxOf(size, wide) / S; }
// real drawn cap height in game pixels (the integer device-pixel scale can make it differ slightly from capOf)
const textH = (size, wide = false) => fontOf(wide).cap * pxOf(size, wide) / S;
let textQueue = [];
// o: size, color, align ('center' | 'right'), shadow (colour or false), clip (array of [x, y, w, h] in game pixels)
function text(str, x, y, o = {}) { textQueue.push({ str: String(str), x, y, o, alpha: ctx.globalAlpha }); }
// pixel sprite drawn on the full-resolution layer, centred on (cx, cy), at the largest whole device-pixel scale
// that fits maxW x maxH game pixels and stays at most maxScale times its game-pixel size
function hiresSprite(spr, cx, cy, maxW, maxH, maxScale = 1) {
  const k = Math.max(1, Math.floor(Math.min(maxW * S / spr.width, maxH * S / spr.height, maxScale * S)));
  textQueue.push({ spr, k, x: Math.round(cx * S - spr.width * k / 2), y: Math.round(cy * S - spr.height * k / 2), alpha: ctx.globalAlpha });
}
function drawTextNow(t) {
  if (t.spr) { vctx.save(); vctx.globalAlpha = t.alpha; vctx.imageSmoothingEnabled = false; vctx.drawImage(t.spr, t.x, t.y, t.spr.width * t.k, t.spr.height * t.k); vctx.restore(); return; }
  const { str, o } = t, wide = o.wide ?? isNumeric(str), k = pxOf(o.size, wide), kx = k, track = o.track ?? TRACK, w = strAdv(str, track, wide) * kx;
  let x = Math.round(t.x * S), y = Math.round(t.y * S);
  if (o.align === 'center') x -= Math.round(w / 2); else if (o.align === 'right') x -= w;
  vctx.save(); vctx.globalAlpha = t.alpha; vctx.imageSmoothingEnabled = false;
  if (o.clip) { vctx.beginPath(); for (const r of o.clip) vctx.rect(r[0] * S, r[1] * S, r[2] * S, r[3] * S); vctx.clip(); }
  const passes = [];
  if (o.shadow !== false) passes.push([o.shadow || INK, S * (capOf(o.size) >= 21 ? 2 : 1)]);
  passes.push([o.color || PAPER, 0]);
  for (const [col, d] of passes) {
    let cx = x;
    for (const ch of str) {
      const gd = gOf(ch, wide), gl = glyph(ch, col, wide);
      if (gl) vctx.drawImage(gl, cx + gd.x * kx + d, y + gd.y * k + d, gl.width * kx, gl.height * k);
      cx += (gd.adv + track) * kx;
    }
  }
  vctx.restore();
}
// composites everything drawn so far onto the screen: the pixel layer, then the queued text on top of it
function flush() {
  vctx.drawImage(g, 0, 0, W, H, 0, 0, W * S, H * S);
  for (const t of textQueue) drawTextNow(t);
  textQueue = []; ctx.clearRect(0, 0, W, H);
}

// pixel panel: lime box, black border, hard black drop shadow
function panel(x, y, w, h, fill = LIME) {
  x = Math.round(x); y = Math.round(y);
  ctx.fillStyle = INK; ctx.fillRect(x + 2, y + 2, w, h);
  ctx.fillStyle = INK; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = fill; ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
}
// default button is black with lime text; o.fill = LIME gives the light variant.
// o.pressed draws the selected state: sunk into its shadow with an inner black frame. Returns the pixel offset used.
function button(b, label, o = {}) {
  const p = o.pressed ? 2 : 0, x = b.x + p, y = b.y + p, w = b.w, h = b.h;
  const fill = o.fill || INK, color = o.color || (fill === INK ? LIME : INK);
  if (!p) { ctx.fillStyle = INK; ctx.fillRect(x + 2, y + 2, w, h); }
  ctx.fillStyle = INK; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = fill; ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
  if (p) { ctx.fillStyle = INK; ctx.fillRect(x + 2, y + 2, w - 4, 1); ctx.fillRect(x + 2, y + h - 3, w - 4, 1); ctx.fillRect(x + 2, y + 2, 1, h - 4); ctx.fillRect(x + w - 3, y + 2, 1, h - 4); }
  if (label) text(label, x + w / 2, y + (h - textH(o.size || 16, true)) / 2, { align: 'center', size: o.size || 16, color, shadow: false, wide: true });
  if (o.icon) hiresSprite(o.icon, x + w / 2, y + h / 2, w - 8, h - 8, 1);
  return p;
}
const hit = (b, px, py) => px >= b.x && px <= b.x + b.w + 2 && py >= b.y && py <= b.y + b.h + 2;
// dotted background used by the shop
function dotBackground(bg = LIME, dot = LIME_DOT) {
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = dot; for (let y = 2; y < H; y += 6) for (let x = 2; x < W; x += 6) ctx.fillRect(x, y, 1, 1);
}

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
  glass: () => { tone(2400, 900, 0.12, 'square', 0.05); tone(1800, 500, 0.2, 'triangle', 0.06, 0.03); tone(3000, 1200, 0.1, 'square', 0.03, 0.08); },
  squish: () => { tone(160, 70, 0.25, 'sawtooth', 0.07); tone(90, 60, 0.2, 'square', 0.05, 0.05); },
  levelup: () => { [523, 659, 784, 1046].forEach((f, i) => tone(f, f, 0.12, 'square', 0.08, i * 0.09)); },
  oneup: () => { [659, 784, 1318, 1046, 1175, 1568].forEach((f, i) => tone(f, f, 0.1, 'square', 0.07, i * 0.08)); },
  revive: () => { tone(300, 900, 0.3, 'triangle', 0.1); tone(600, 1200, 0.25, 'square', 0.05, 0.1); },
  buzz: () => tone(180, 160, 0.15, 'sawtooth', 0.03),
};
function vibrate(ms) { if (save.vib && navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) { } } }


// ============================================================ music: "Frohg Hop", a looping 8-bit frog song
// Sequenced live with Web Audio: square-wave lead with frog-like octave hops, triangle bass, noise drums,
// and a little "ribbit" croak at the end of phrases. Toggle and volume live in the settings panel.
const BPM = 138, STEP = 60 / BPM / 2;                 // one step = an eighth note
const NOTE = n => { const m = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }; return 12 * (+n.slice(-1) + 1) + m[n[0]] + (n[1] === '#' ? 1 : 0); };
const hz = midi => 440 * Math.pow(2, (midi - 69) / 12);
// melody: 8 steps per bar, '.' = hold/rest, 'R' = ribbit croak
const SONG_LEAD = [
  'E5 . G5 E5 C5 . G4 .', 'A4 . C5 E5 A5 . G5 .', 'F5 . A5 F5 C5 . A4 C5', 'D5 . B4 D5 G5 . R .',
  'E5 G5 C6 . G5 E5 C5 .', 'A5 G5 E5 . C5 E5 A5 .', 'F5 . E5 . D5 . C5 .', 'B4 . D5 . C5 . R .',
  'A5 . A5 G5 F5 . C5 .', 'B5 . B5 A5 G5 . D5 .', 'G5 . E5 . B4 . E5 .', 'C6 . B5 A5 E5 . . .',
  'F5 A5 C6 A5 F5 A5 C6 .', 'G5 B5 D6 B5 G5 B5 D6 .', 'E6 . D6 C6 G5 . E5 .', 'D5 . G5 . R . R .',
].map(b => b.split(' '));
const SONG_BASS = ['C3', 'A2', 'F2', 'G2', 'C3', 'A2', 'F2', 'G2', 'F2', 'G2', 'E2', 'A2', 'F2', 'G2', 'C3', 'G2'];
const BASS_PAT = [0, null, 12, null, 0, 0, 12, 7];   // oom-pah with octave hops
const music = { gain: null, step: 0, next: 0, timer: null, noise: null };
function musicLevel() { return save.music ? save.musicVol * 0.3 : 0; }
function musicApplyVolume() { if (music.gain && ac) music.gain.gain.setTargetAtTime(musicLevel(), ac.currentTime, 0.05); }
function mNote(type, f, t, dur, vol, slideTo) {
  const o = ac.createOscillator(), gn = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  gn.gain.setValueAtTime(0.0001, t); gn.gain.linearRampToValueAtTime(vol, t + 0.005);
  gn.gain.setValueAtTime(vol, t + dur * 0.7); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(gn); gn.connect(music.gain); o.start(t); o.stop(t + dur + 0.02);
}
function mNoise(t, dur, vol, hp) {
  const src = ac.createBufferSource(), f = ac.createBiquadFilter(), gn = ac.createGain();
  src.buffer = music.noise; f.type = 'highpass'; f.frequency.value = hp;
  gn.gain.setValueAtTime(vol, t); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f); f.connect(gn); gn.connect(music.gain); src.start(t); src.stop(t + dur + 0.02);
}
function ribbit(t) { mNote('sawtooth', 420, t, 0.07, 0.11, 160); mNote('sawtooth', 360, t + 0.1, 0.09, 0.11, 130); }
function scheduleStep(n, t) {
  const bar = Math.floor(n / 8) % SONG_LEAD.length, k = n % 8, cell = SONG_LEAD[bar][k];
  // lead: hold until the next note
  if (cell === 'R') ribbit(t);
  else if (cell !== '.') { let len = 1; while (k + len < 8 && SONG_LEAD[bar][k + len] === '.') len++; mNote('square', hz(NOTE(cell)), t, STEP * len * 0.92, 0.075); }
  // bass
  const bp = BASS_PAT[k]; if (bp !== null) mNote('triangle', hz(NOTE(SONG_BASS[bar]) + bp), t, STEP * 0.9, 0.22);
  // drums: kick on 1 and 3, snare on 2 and 4, soft hats on the off-beats
  if (k === 0 || k === 4) mNote('sine', 140, t, 0.12, 0.35, 45);
  if (k === 2 || k === 6) mNoise(t, 0.09, 0.16, 1800);
  if (k % 2 === 1) mNoise(t, 0.03, 0.05, 7000);
}
function musicTick() {
  if (!ac || !music.gain) return;
  while (music.next < ac.currentTime + 0.15) { scheduleStep(music.step, music.next); music.step++; music.next += STEP; }
}
function musicStart() {
  if (!ac || music.timer) return;
  music.gain = ac.createGain(); music.gain.gain.value = musicLevel(); music.gain.connect(ac.destination);
  const len = ac.sampleRate * 0.5; music.noise = ac.createBuffer(1, len, ac.sampleRate);
  const d = music.noise.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  music.step = 0; music.next = ac.currentTime + 0.1;
  music.timer = setInterval(musicTick, 25);
}

// ============================================================ game constants
const GRAV = 1000, JUMP_V = 420, SPRING_V = 640, SUPER_V = 840, MOVE_SPEED = 150, PLAT_H = 6;
const EXP_LAND = 8, EXP_COIN = 6, EXP_FLY = 25, TONGUE_TIME = 10, TONGUE_RANGE = 84;
const JUMP_BOOST_PER_LEVEL = 0.04, JUMP_BOOST_MAX = 0.24, LIFE_EVERY_LEVELS = 3, MAX_LIVES = 2;
const expNeeded = level => 100 + 40 * (level - 1);
const jumpBoost = () => 1 + Math.min(JUMP_BOOST_MAX, JUMP_BOOST_PER_LEVEL * (game.level - 1));
const DAY_CYCLE = 3200; // px of height per full day/night cycle

let scene = 'title'; // title | play | dead | shop
let settingsOpen = false;
const game = {};
const input = { touchX: null, keys: {}, tiltX: 0 };

function camY0() { return -Math.round(H * 0.22); }

function newGame() {
  game.frog = { x: W / 2, y: 0, vx: 0, vy: 0, prevY: 0, anim: 'sit', landT: 9, dizzy: 0, blink: 0, blinkT: rnd(2, 4) };
  game.camY = camY0(); game.maxY = 0; game.score = 0; game.runCoins = 0;
  game.exp = 0; game.level = 1; game.lives = 0; game.levelUpT = 0; game.oneUpT = 0; game.eatT = 0; game.invuln = 0;
  game.superT = 0; game.tongueT = 0; game.tongue = null; game.charged = false;
  game.plats = []; game.coins = []; game.flies = []; game.items = []; game.parts = []; game.floaters = [];
  game.genY = 20; game.lastType = 'normal'; game.nextItemY = rnd(220, 320); game.shake = 0; game.time = 0; game.deadT = 0;
  game.clouds = [{ par: 0.3, genY: -200, list: [] }, { par: 0.6, genY: -200, list: [] }];
  game.space = { genY: -1e9, list: [], comets: [], cometT: 1.5, order: null };
  game.started = false; game.newBest = false; game.introT = 0;
  genUpTo(game.camY + H + 120);
  genClouds();
}

const diffAt = y => clamp(y / 4500, 0, 1);

function genUpTo(limit) {
  while (game.genY < limit) {
    const d = diffAt(game.genY);
    let gap = lerp(34, 70, d) * rnd(0.85, 1.1);
    if (game.lastType === 'swamp') gap = Math.min(gap, 46); // a swamp bounce is weaker: keep the next platform in reach
    game.genY += gap;
    addPlatformBand(game.genY, d, gap);
  }
}
function addPlatformBand(y, d, gap) {
  const w = Math.round(lerp(46, 32, d));
  let type = 'normal';
  const r = Math.random();
  const pc = (game.lastType === 'crumble' || y < 150) ? 0 : 0.03 + 0.16 * d; // glass: shatters after one bounce
  const pm = y < 120 ? 0 : 0.05 + 0.22 * d;                                  // moving (yellow pill)
  const ps = (game.lastType === 'swamp' || y < 200) ? 0 : 0.03 + 0.1 * d;     // swamp: weak, muddy bounce
  if (r < pc) type = 'crumble'; else if (r < pc + pm) type = 'moving'; else if (r < pc + pm + ps) type = 'swamp';
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
  if (Math.random() < 0.16 && type !== 'crumble') {
    const n = rndi(1, 2);
    for (let i = 0; i < n; i++) game.coins.push({ x: p.x + p.w / 2 + (i - (n - 1) / 2) * 14, y: y + 17, t: rnd(0, 6), on: type === 'moving' ? p : null, dx: (i - (n - 1) / 2) * 14, taken: false });
  } else if (Math.random() < 0.05) { // a single coin floating between platforms
    game.coins.push({ x: rnd(30, W - 30), y: y + 30, t: rnd(0, 6), on: null, taken: false });
  }
  // flies
  if (y > 200 && Math.random() < 0.14 + 0.3 * d) {
    const bx = rnd(30, W - 30), by = y + gap * 0.55;
    game.flies.push({ bx, by, t: rnd(0, 6), amp: rnd(25, 60), sp: rnd(1.1, 2.0) + d, x: bx, y: by, esc: false, dead: false });
  }
  // tongue power-up
  if (y > game.nextItemY) {
    game.items.push({ x: rnd(30, W - 30), y: y + 24, t: rnd(0, 6), taken: false });
    game.nextItemY = y + rnd(380, 600);
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

function addFloater(x, y, str) { game.floaters.push({ x, y, str: str.toUpperCase(), color: LIME, life: 0.9 }); }
function burst(x, y, n, colors, spd = 60, life = 0.5, gravity = 300) {
  for (let i = 0; i < n; i++) { const a = rnd(0, Math.PI * 2), s = rnd(spd * 0.3, spd); game.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rnd(life * 0.6, life), max: life, c: pick(colors), g: gravity }); }
}

// ------------------------------------------------------------ landing / bouncing
function land(p) {
  const f = game.frog;
  f.y = p ? p.y : 0; f.prevY = f.y;
  const boost = jumpBoost(); // every level makes the frog jump a little higher
  let v = JUMP_V * boost, kind = 'jump';
  if (game.charged) { v = SUPER_V * boost; kind = 'super'; game.charged = false; game.superT = 0.7; game.shake = 4; addFloater(f.x, f.y + 40, 'SUPER!', P.Y); }
  else if (p && p.spring) { v = SPRING_V * boost; kind = 'spring'; p.springT = 0.3; }
  else if (p && p.type === 'swamp') { v = JUMP_V * boost * 0.8; kind = 'swamp'; p.splashT = 0.4; }
  f.vy = v; f.landT = 0; // restarts the squash -> stretch animation
  if (p) {
    if (p.type === 'crumble') { p.alive = false; p.broken = true; sfx.glass(); burst(p.x + p.w / 2, p.y, 12, ['#dff6ff', '#8ed8ff', '#ffffff', '#3b2d6b'], 70, 0.6); }
    addExp(EXP_LAND);
  }
  if (kind === 'swamp') burst(f.x, f.y, 8, ['#4f6b2a', '#7a9a3a', '#2f4a1a'], 60, 0.45, 300);
  else burst(f.x, f.y, kind === 'super' ? 14 : 4, kind === 'super' ? [P.Y, P.y, P.w] : ['#ffffff', '#dddddd'], kind === 'super' ? 120 : 40, 0.35, kind === 'super' ? 0 : 200);
  if (kind === 'jump') sfx.jump(); else if (kind === 'spring') sfx.spring(); else if (kind === 'swamp') sfx.squish(); else sfx.superjump();
  vibrate(kind === 'super' ? 40 : 8);
}
function addExp(n) {
  game.exp += n;
  while (game.exp >= expNeeded(game.level)) {
    game.exp -= expNeeded(game.level); game.level++;
    game.charged = true; game.levelUpT = 1.4; sfx.levelup(); vibrate([20, 30, 20]);
    if (game.level % LIFE_EVERY_LEVELS === 0 && game.lives < MAX_LIVES) { game.lives++; game.oneUpT = 1.6; sfx.oneup(); }
  }
}
// with a spare life the frog comes back on a platform instead of dying
function respawn() {
  const f = game.frog;
  game.lives--; game.invuln = 2.5; f.dizzy = 0; game.tongue = null;
  let p = null;
  for (const q of game.plats) if (q.alive && q.type !== 'crumble' && q.y > game.camY + H * 0.3 && q.y < game.camY + H * 0.75 && (!p || q.y > p.y)) p = q;
  if (!p) { p = { x: W / 2 - 24, y: game.camY + H * 0.5, w: 48, type: 'normal', alive: true, t: 0, broken: false, fallV: 0, vx: 0, spring: false }; game.plats.push(p); }
  f.x = p.x + p.w / 2; f.y = p.y + 2; f.prevY = f.y; f.vx = 0; f.vy = JUMP_V * jumpBoost(); f.landT = 0;
  for (const fl of game.flies) if (Math.abs(fl.y - f.y) < 120) fl.esc = true;
  sfx.revive(); vibrate(30); game.shake = 2;
  burst(f.x, f.y + 10, 16, [P.Y, P.w, '#8fd032'], 90, 0.6, 0);
  addFloater(f.x, f.y + 44, 'SAVED!', P.Y);
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
  // --- animation state: squash on landing, then stretch, then frames by vertical speed
  f.landT += dt;
  if (f.landT < 0.05) f.anim = 'crouch2';
  else if (f.landT < 0.09) f.anim = 'crouch1';
  else if (f.landT < 0.15) f.anim = 'stretch1';
  // in the air the legs stay out (they only fold on touching a platform): fully stretched while rising,
  // half out around the apex, reaching down again as the frog falls towards the next landing
  else f.anim = f.vy > 220 ? 'jump' : f.vy > -260 ? 'stretch1' : 'jump';
  if (f.dizzy > 0) f.dizzy -= dt;
  if (game.superT > 0) { game.superT -= dt; if (f.vy > 0) game.parts.push({ x: f.x + rnd(-8, 8), y: f.y + rnd(0, 10), vx: rnd(-20, 20), vy: -60, life: 0.4, max: 0.4, c: pick([P.Y, P.y, P.w]), g: 0 }); }
  if (game.tongueT > 0) game.tongueT -= dt;
  if (game.levelUpT > 0) game.levelUpT -= dt;
  if (game.oneUpT > 0) game.oneUpT -= dt;
  if (game.eatT > 0) game.eatT -= dt;
  if (game.invuln > 0) game.invuln -= dt;
  // --- platforms
  for (const p of game.plats) {
    p.t += dt;
    if (p.vx) { p.x += p.vx * dt; if (p.x < 2) { p.x = 2; p.vx = Math.abs(p.vx); } else if (p.x + p.w > W - 2) { p.x = W - 2 - p.w; p.vx = -Math.abs(p.vx); } }
    if (p.broken) { p.fallV += GRAV * dt * 0.6; p.y -= p.fallV * dt; }
    if (p.springT > 0) p.springT -= dt;
    if (p.splashT > 0) p.splashT -= dt;
  }
  // --- coins
  for (const c of game.coins) {
    if (c.taken) continue; c.t += dt;
    if (c.on) c.x = c.on.x + c.on.w / 2 + c.dx;
    if (Math.abs(c.x - f.x) < 16 && c.y > f.y - 5 && c.y < f.y + 31) {
      c.taken = true; game.runCoins++; addExp(EXP_COIN); sfx.coin(); addFloater(c.x, c.y + 6, '+1', P.Y);
      burst(c.x, c.y, 5, [P.Y, P.y, P.w], 50, 0.35, 0);
    }
  }
  // --- tongue power-up pickups
  for (const it of game.items) {
    if (it.taken) continue; it.t += dt;
    if (Math.abs(it.x - f.x) < 16 && it.y > f.y - 6 && it.y < f.y + 32) {
      it.taken = true; game.tongueT = TONGUE_TIME; sfx.pickup(); vibrate(15); game.eatT = 1.6;
      burst(it.x, it.y, 8, [POTION, '#a98bff', P.w], 60, 0.4, 0);
    }
  }
  // --- flies
  for (const fl of game.flies) {
    if (fl.dead) continue; fl.t += dt;
    if (fl.esc) { fl.y += 220 * dt; fl.x += 140 * dt; if (fl.y - game.camY > H + 40) fl.dead = true; continue; }
    fl.x = fl.bx + Math.sin(fl.t * fl.sp) * fl.amp;
    fl.y = fl.by + Math.cos(fl.t * fl.sp * 1.6) * 6;
    const dx = fl.x - f.x, dy = fl.y - (f.y + 14);
    // the tongue shoots straight sideways, so only flies roughly at mouth height get caught
    if (game.tongueT > 0 && !game.tongue && Math.abs(dx) < TONGUE_RANGE && Math.abs(dy) < 20 && Math.abs(dx) > 6 && fl.y - game.camY > 10) {
      game.tongue = { fly: fl, t: 0, dur: 0.5, ate: false, dir: dx > 0 ? 1 : -1 }; fl.targeted = true;
    } else if (!fl.targeted && Math.abs(dx) < 12 && fl.y > f.y + 2 && fl.y < f.y + 28) {
      if (game.superT > 0 || game.tongueT > 0 || game.invuln > 0) { fl.esc = true; }
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
    T.fly.y += ((f.y + 14) - T.fly.y) * Math.min(1, 14 * dt); // the fly gets pulled onto the tongue line
    if (!T.ate && T.t >= T.dur * 0.5) {
      T.ate = true; T.fly.dead = true; sfx.eat(); vibrate(20);
      game.runCoins += 2; addExp(EXP_FLY); addFloater(T.fly.x, T.fly.y + 8, 'YUM +2', P.p);
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
  updateSpace(dt);
  // cleanup
  const cut = game.camY - 80;
  game.plats = game.plats.filter(p => p.y > cut);
  game.coins = game.coins.filter(c => !c.taken && c.y > cut);
  game.flies = game.flies.filter(fl => !fl.dead && fl.y > cut - 100);
  game.items = game.items.filter(it => !it.taken && it.y > cut);
  if (game.shake > 0) game.shake = Math.max(0, game.shake - 12 * dt);
  // --- death (or a second chance with a spare life)
  if (f.y < game.camY - 30) { if (game.lives > 0) respawn(); else die(); }
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

// ------------------------------------------------------------ outer space (score 1800 -> 2000)
const SPACE_FROM = 800, SPACE_TO = 1000;
const spaceAmt = () => clamp((game.camY / 10 - SPACE_FROM) / (SPACE_TO - SPACE_FROM), 0, 1);
const hash2 = (x, y) => { const v = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453; return v - Math.floor(v); };
// pixel planet: banded / spotted sphere lit from the top-left, dark 1px rim, optional flat ring
function makePlanet(r, opt) {
  const ring = opt.ring ? Math.round(r * 1.9) : 0, pad = 1;
  const w = 2 * Math.max(r, ring) + 1 + pad * 2, h = 2 * r + 1 + pad * 2;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d'), cx = (w - 1) / 2, cy = (h - 1) / 2;
  const inside = (px, py) => (px - cx) ** 2 + (py - cy) ** 2 <= (r + 0.35) ** 2;
  const ringPx = (front) => {
    if (!opt.ring) return;
    for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
      const e = ((px - cx) / ring) ** 2 + ((py - cy) / (r * 0.42)) ** 2;
      if (e > 0.78 && e < 1.05 && ((py >= cy) === front) && !(front === false && inside(px, py))) {
        x.fillStyle = e < 0.9 ? opt.ring[0] : opt.ring[1]; x.fillRect(px, py, 1, 1);
      }
    }
  };
  ringPx(false);
  for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
    if (!inside(px, py)) continue;
    const nx = (px - cx) / r, ny = (py - cy) / r;
    const edge = !inside(px + 1, py) || !inside(px - 1, py) || !inside(px, py + 1) || !inside(px, py - 1);
    let col;
    if (opt.land) col = hash2(Math.floor(px / 2) + opt.seed, Math.floor(py / 2)) > 0.62 ? opt.land : opt.bands[0];
    else col = opt.bands[Math.floor((ny + 1) / 2 * opt.bands.length * 1.5 + hash2(py, opt.seed) * 0.6) % opt.bands.length];
    if (opt.spot && Math.abs(nx - opt.spot[0]) < 0.28 && Math.abs(ny - opt.spot[1]) < 0.16) col = opt.spot[2];
    const light = nx * 0.55 + ny * 0.55;
    if (light > 0.45) col = mixHex(col, '#0b0820', 0.45); else if (light > 0.15) col = mixHex(col, '#0b0820', 0.2);
    else if (light < -0.6) col = mixHex(col, '#ffffff', 0.35);
    if (edge) col = mixHex(col, '#0b0820', 0.55);
    x.fillStyle = col; x.fillRect(px, py, 1, 1);
  }
  ringPx(true);
  return c;
}
const PLANETS = [
  makePlanet(9, { bands: ['#e9c98f', '#d6a865', '#f2dcae', '#c99556'], ring: ['#f0d9a8', '#b98f55'], seed: 1 }),                // ringed (Saturn)
  makePlanet(13, { bands: ['#ead6b6', '#c79a6b', '#f3e4cc', '#b9825a', '#dcbc94'], spot: [0.25, 0.35, '#c4563a'], seed: 2 }),   // gas giant (Jupiter)
  makePlanet(7, { bands: ['#2f7fe0'], land: '#46c25a', seed: 3 }),                                                               // earth-like
  makePlanet(6, { bands: ['#e2643c', '#c94a2c', '#e87a4c'], spot: [-0.2, 0.1, '#7a2a1a'], seed: 4 }),                           // Mars
  makePlanet(8, { bands: ['#3d6fe0', '#2f58c4', '#4a86f2'], ring: ['#bcd2ff', '#6f8fd8'], seed: 5 }),                            // Neptune with a thin ring
  makePlanet(4, { bands: ['#9a98a6', '#7d7b8a', '#b4b2c0'], seed: 6 }),                                                          // little grey moon
  makePlanet(10, { bands: ['#a64dd8', '#7d2fb0', '#c271ea'], seed: 7 }),                                                         // violet planet
  makePlanet(5, { bands: ['#2fc4b2', '#1f9c8e', '#5ee0cf'], seed: 8 }),                                                          // teal moon
];
const SPACE_STAR_COLS = ['#ffffff', '#8fd8ff', '#b9a6ff', '#c77dff', '#ff8a5c', '#5ac8ff'];
const SPACE_STARS = []; for (let i = 0; i < 110; i++) { const r = Math.random(); SPACE_STARS.push({ x: Math.random(), y: Math.random(), tw: rnd(0, 6), sp: rnd(1.5, 4), kind: r < 0.6 ? 0 : r < 0.85 ? 1 : r < 0.96 ? 2 : 3, c: pick(SPACE_STAR_COLS) }); }
function starShape(x, y, kind, col) {
  ctx.fillStyle = col; ctx.fillRect(x, y, 1, 1);
  if (kind >= 1) { ctx.fillRect(x - 1, y, 3, 1); ctx.fillRect(x, y - 1, 1, 3); }
  if (kind >= 2) { ctx.globalAlpha *= 0.6; ctx.fillRect(x - 2, y, 1, 1); ctx.fillRect(x + 2, y, 1, 1); ctx.fillRect(x, y - 2, 1, 1); ctx.fillRect(x, y + 2, 1, 1); }
  if (kind >= 3) { ctx.fillRect(x - 3, y, 1, 1); ctx.fillRect(x + 3, y, 1, 1); ctx.fillRect(x, y - 3, 1, 1); ctx.fillRect(x, y + 3, 1, 1); ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y, 1, 1); }
}
const PLANET_PAR = 0.22;
function genSpace() {
  const sp = game.space, top = game.camY * PLANET_PAR;
  if (spaceAmt() <= 0) return;
  if (sp.genY < top) sp.genY = top + H * 0.55;
  while (sp.genY < top + H + 60) {
    sp.genY += rnd(95, 160);
    sp.order = sp.order && sp.order.length ? sp.order : PLANETS.map((_, i) => i).sort(() => Math.random() - 0.5);
    sp.list.push({ i: sp.order.pop(), x: rnd(-6, W - 20), y: sp.genY });
  }
  sp.list = sp.list.filter(p => H - (p.y - top) < H + 60);
}
function updateSpace(dt) {
  const amt = spaceAmt();
  genSpace();
  const sp = game.space;
  sp.cometT -= dt;
  if (amt > 0.6 && sp.cometT <= 0) {
    sp.cometT = rnd(2.2, 4.5);
    sp.comets.push({ x: rnd(W * 0.35, W + 30), y: rnd(-20, H * 0.25), vx: -rnd(70, 110), vy: rnd(55, 90), life: 4, hue: pick([['#ffffff', '#8fd8ff', '#5a6cff'], ['#ffffff', '#c77dff', '#6a3cff'], ['#fff3c0', '#ff9a5c', '#c4403a']]) });
  }
  for (const c of sp.comets) { c.x += c.vx * dt; c.y += c.vy * dt; c.life -= dt; }
  sp.comets = sp.comets.filter(c => c.life > 0 && c.x > -60 && c.y < H + 60);
}
function drawSpace(amt) {
  // sparkly stars
  const tile = H * 2;
  for (const s of SPACE_STARS) {
    const x = Math.round(s.x * W), y = Math.round((((s.y * tile - game.camY * 0.1) % tile) + tile) % tile);
    if (y > H + 3) continue;
    ctx.globalAlpha = amt * (0.55 + 0.45 * Math.sin(game.time * s.sp + s.tw));
    starShape(x, y, s.kind, s.c);
  }
  // planets drifting by
  const top = game.camY * PLANET_PAR;
  for (const p of game.space.list) {
    const spr = PLANETS[p.i], y = Math.round(H - (p.y - top));
    if (y < -spr.height || y > H) continue;
    ctx.globalAlpha = amt; ctx.drawImage(spr, Math.round(p.x), y);
  }
  // comets: bright head, tail fading along the path
  for (const c of game.space.comets) {
    const len = 30, dx = -c.vx / Math.hypot(c.vx, c.vy), dy = -c.vy / Math.hypot(c.vx, c.vy);
    for (let i = len; i >= 0; i--) {
      const t = i / len, px = Math.round(c.x + dx * i * 1.3), py = Math.round(c.y + dy * i * 1.3);
      ctx.globalAlpha = amt * Math.pow(1 - t, 0.8) * clamp(c.life, 0, 1);
      ctx.fillStyle = t < 0.12 ? c.hue[0] : t < 0.45 ? c.hue[1] : c.hue[2];
      const sz = t < 0.08 ? 3 : t < 0.5 ? 2 : 1; ctx.fillRect(px - (sz >> 1), py - (sz >> 1), sz, sz);
      if (t > 0.15 && i % 3 === 0) { ctx.globalAlpha *= 0.6; ctx.fillRect(px + (i % 2 ? 2 : -2), py + (i % 2 ? -1 : 1), 1, 1); } // sparks
    }
    ctx.globalAlpha = amt * clamp(c.life, 0, 1); ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(c.x) - 1, Math.round(c.y), 3, 1); ctx.fillRect(Math.round(c.x), Math.round(c.y) - 1, 1, 3);
  }
  ctx.globalAlpha = 1;
}

function drawSky() {
  const ph = dayPhase(), sk = skyAt(ph), night = nightAmount(ph), space = spaceAmt();
  const top = mixHex(sk.top, '#06061a', space), bot = mixHex(sk.bot, '#241048', space);
  const band = 6;
  for (let y = 0; y < H; y += band) { ctx.fillStyle = mixHex(top, bot, y / H); ctx.fillRect(0, y, W, band); }
  const starA = Math.max(night, space);
  if (starA > 0.02) {
    const tile = H * 2;
    for (const s of STARS) {
      const x = Math.round(s.x * W), y = Math.round((((s.y * tile - game.camY * 0.15) % tile) + tile) % tile);
      if (y > H) continue;
      const tw = 0.6 + 0.4 * Math.sin(game.time * 3 + s.tw);
      ctx.globalAlpha = starA * tw; ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y, 1, 1);
      if (s.big) { ctx.fillRect(x - 1, y, 1, 1); ctx.fillRect(x + 1, y, 1, 1); ctx.fillRect(x, y - 1, 1, 1); ctx.fillRect(x, y + 1, 1, 1); }
    }
    ctx.globalAlpha = 1;
  }
  // sun & moon share a fixed spot in the upper right: at dusk the sun sinks a little and fades out while the
  // moon rises into the same spot and fades in (and the reverse at dawn); both fade away in space
  const baseY = SAFE_TOP + 58, sx = W - 40, sink = 18;
  if (night < 1) { ctx.globalAlpha = (1 - night) * (1 - space); ctx.drawImage(ICON.sun, sx, baseY + Math.round(night * sink)); }
  if (night > 0) { ctx.globalAlpha = night * (1 - space); ctx.drawImage(ICON.moon, sx, baseY + Math.round((1 - night) * sink)); }
  ctx.globalAlpha = 1;
  if (space > 0) drawSpace(space);
}
function drawClouds() {
  const [a, b, t] = cloudBlend(dayPhase()), fade = 1 - spaceAmt();
  if (fade <= 0) return;
  for (const L of game.clouds) {
    const alpha = (L.par < 0.5 ? 0.7 : 1) * fade;
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
// icy mountain ranges on the horizon: two parallax layers with stepped pixel slopes and snow caps
const MOUNTAINS = [
  { par: 0.08, peaks: [[0.05, 46], [0.22, 70], [0.42, 56], [0.6, 82], [0.8, 60], [0.98, 48]], body: '#8fa9cf', shade: '#7b95bd', snow: '#eef6ff', snowShade: '#cfe1f5' },
  { par: 0.16, peaks: [[0.12, 40], [0.33, 58], [0.52, 36], [0.72, 64], [0.92, 44]], body: '#5e7aa6', shade: '#4d6792', snow: '#dceeff', snowShade: '#b5cfe8' },
];
function drawMountains() {
  const night = nightAmount(dayPhase());
  for (const L of MOUNTAINS) {
    const base = Math.round(H + camY0() + (game.camY - camY0()) * L.par) + 2;
    if (base < -10) continue;
    const body = mixHex(L.body, '#1a1838', night * 0.7), shade = mixHex(L.shade, '#14122c', night * 0.7);
    const snow = mixHex(L.snow, '#8a86b8', night * 0.6), snowShade = mixHex(L.snowShade, '#6e6a9c', night * 0.6);
    // fill below the ridge line so the range reads as a solid mass
    ctx.fillStyle = body; ctx.fillRect(0, base, W, Math.max(0, H - base));
    for (const [px, ph] of L.peaks) {
      const cx = Math.round(px * W), top = base - ph;
      for (let r = 0; r < ph; r++) {
        const half = Math.floor(r * 0.9) + 1, y = top + r;
        if (y < 0 || y > H) continue;
        const isSnow = r < 9 + (ph % 5);
        ctx.fillStyle = isSnow ? snow : body; ctx.fillRect(cx - half, y, half + 1, 1);
        ctx.fillStyle = isSnow ? snowShade : shade; ctx.fillRect(cx + 1, y, half, 1);
        if (isSnow && r > 4 && r % 3 === 0) { ctx.fillStyle = body; ctx.fillRect(cx - half, y, 2, 1); } // jagged snow edge
      }
    }
  }
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
// pixel pill: rounded ends, navy outline, white highlight along the top (like the reference platform art)
const PILL_OUTLINE = '#2b1d4e';
function pill(x, y, w, h, fill, hi, outline = PILL_OUTLINE, glow) {
  const inset = r => (r === 0 || r === h - 1) ? 2 : (r === 1 || r === h - 2) ? 1 : 0;
  if (glow) { ctx.save(); ctx.globalAlpha *= glow[1]; ctx.fillStyle = glow[0]; ctx.fillRect(x + 2, y - 1, w - 4, h + 2); ctx.fillRect(x, y + 1, w, h - 2); ctx.restore(); }
  ctx.fillStyle = outline;
  for (let r = 0; r < h; r++) ctx.fillRect(x + inset(r), y + r, w - 2 * inset(r), 1);
  ctx.fillStyle = fill;
  for (let r = 1; r < h - 1; r++) { const i = inset(r) + 1; ctx.fillRect(x + i, y + r, w - 2 * i, 1); }
  if (hi) { ctx.fillStyle = hi; ctx.fillRect(x + 3, y + 1, w - 6, 1); ctx.fillRect(x + 2, y + 2, 1, 1); ctx.fillRect(x + w - 3, y + 2, 1, 1); }
}
// platform colours on earth and in space (neon violet / pink / alien slime / crystal), blended by altitude
const PLAT_COLS = {
  normal: { earth: ['#8cc63f', '#ffffff'], space: ['#7a5cff', '#d6ccff'] },
  moving: { earth: ['#ffb400', '#ffffff'], space: ['#ff4fd8', '#ffd0f5'] },
  swamp: { earth: ['#5a7a2e', '#8aa84a', '#9ec25a', '#3f5a1e'], space: ['#1fae7a', '#5cf0b0', '#9dffd6', '#0f6e4c'] },
  crumble: { earth: ['#bfefff', '#ffffff', '#7fcbe8'], space: ['#9fe8ff', '#ffffff', '#4fb6e8'] },
};
const platCol = (type, i, amt) => { const c = PLAT_COLS[type]; return amt <= 0 ? c.earth[i] : amt >= 1 ? c.space[i] : mixHex(c.earth[i], c.space[i], amt); };
function drawPlat(p) {
  const x = Math.round(p.x), y = sy(p.y), w = p.w, h = PLAT_H + 1;
  if (y < -10 || y > H + 10) return;
  const amt = spaceAmt(), outline = amt > 0 ? mixHex(PILL_OUTLINE, '#0d0726', amt) : PILL_OUTLINE;
  const glow = amt > 0 ? [platCol(p.type, 0, 1), 0.25 * amt * (0.8 + 0.2 * Math.sin(p.t * 3))] : null; // soft neon halo in space
  if (p.type === 'normal') pill(x, y, w, h, platCol('normal', 0, amt), platCol('normal', 1, amt), outline, glow);
  else if (p.type === 'moving') pill(x, y, w, h, platCol('moving', 0, amt), platCol('moving', 1, amt), outline, glow);
  else if (p.type === 'swamp') {
    pill(x, y, w, h, platCol('swamp', 0, amt), platCol('swamp', 1, amt), outline, glow);
    // bubbles that pop in the mud (alien slime in space)
    ctx.fillStyle = platCol('swamp', 2, amt);
    for (let i = 0; i < 3; i++) { const ph = (p.t * 1.5 + i * 1.7) % 2; if (ph < 1.2) { const bx = x + 6 + ((i * 13 + Math.floor(p.t / 2) * 7) % Math.max(1, w - 12)); ctx.fillRect(bx, y + 2 + Math.round(ph * 1.5), ph < 0.6 ? 1 : 2, ph < 0.6 ? 1 : 2); } }
    if (p.splashT > 0) { ctx.fillStyle = platCol('swamp', 3, amt); ctx.fillRect(x + 2, y + 1, w - 4, 2); }
  } else { // glass: pale cyan, see-through look, crack lines
    pill(x, y, w, h, platCol('crumble', 0, amt), platCol('crumble', 1, amt), outline, glow);
    ctx.fillStyle = platCol('crumble', 2, amt);
    for (let i = 5; i < w - 5; i += 9) { ctx.fillRect(x + i, y + 2, 1, 1); ctx.fillRect(x + i + 1, y + 3, 1, 1); ctx.fillRect(x + i + 2, y + 4, 1, 1); ctx.fillRect(x + i + 1, y + 1, 1, 1); }
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x + w - 10, y + 3, 4, 1);
  }
  if (p.spring) { const sp = ICON.spring, sx = Math.round(x + w / 2 - sp.width / 2); const comp = p.springT > 0 ? 2 : 0; ctx.drawImage(sp, 0, 0, sp.width, sp.height, sx, y - sp.height + 1 + comp, sp.width, sp.height - comp); }
}
function drawFrogAt(cx, feetY, anim, lean, blink, eq) {
  const eqs = eq || save.eq, frames = frogFrames(eqs.skin || 'green'), pal = skinPal(eqs.skin || 'green');
  const spr = frames[anim] || frames.sit;
  const x0 = Math.round(cx - spr.width / 2), y0 = Math.round(feetY - spr.height);
  const wo = (spr.width - FROG_W) / 2; // wider squash/spread frames keep accessories centred
  if (lean) { const half = Math.floor(spr.height / 2); ctx.drawImage(spr, 0, 0, spr.width, half, x0 + lean, y0, spr.width, half); ctx.drawImage(spr, 0, half, spr.width, spr.height - half, x0, y0 + half, spr.width, spr.height - half); }
  else ctx.drawImage(spr, x0, y0);
  if (blink) { // eyelids: the eyes sit at the same rows in every frame (top-anchored)
    const ex = x0 + wo, ey = y0 + (anim === 'crouch2' ? 3 : 4);
    ctx.fillStyle = pal.b; ctx.fillRect(ex + 7, ey, 5, 4); ctx.fillRect(ex + 26, ey, 5, 4);
    ctx.fillStyle = pal.a; ctx.fillRect(ex + 7, ey + 3, 5, 1); ctx.fillRect(ex + 26, ey + 3, 5, 1);
  }
  for (const cat of ['glasses', 'acc', 'hat']) {
    const it = ITEMS[cat].find(i => i.id === (eq || save.eq)[cat]);
    if (it && it.spr) ctx.drawImage(it.spr, x0 + wo + it.ox + (lean && it.oy < 8 ? lean : 0), y0 + it.oy);
  }
  return { x0, y0, h: spr.height };
}
// tongue-power radar: crisp pixel rings pulse outwards and fade, a sweep beam rotates and leaves a fading trail
function pixelRing(cx, cy, r, col) {
  ctx.fillStyle = col;
  const n = Math.max(12, Math.round(r * 6.3));
  let lx = null, ly = null;
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2, x = Math.round(cx + Math.cos(a) * r), y = Math.round(cy + Math.sin(a) * r);
    if (x !== lx || y !== ly) ctx.fillRect(x, y, 1, 1);
    lx = x; ly = y;
  }
}
// tongue power: circles spread out from the frog's centre and fade as they grow (crisp pixel rings)
function drawRadar(cx, cy) {
  const base = ctx.globalAlpha, R = 34, end = game.tongueT < 3 ? clamp(game.tongueT / 3, 0.35, 1) : 1;
  for (let i = 0; i < 4; i++) {
    const k = (game.time * 0.7 + i / 4) % 1, r = 2 + k * (R - 2), fade = Math.pow(1 - k, 1.4) * end;
    if (r < 3) continue;
    ctx.globalAlpha = base * fade; pixelRing(cx, cy, r, '#d8caff');
    ctx.globalAlpha = base * 0.75 * fade; pixelRing(cx, cy, r - 1, POTION);
  }
  ctx.globalAlpha = base;
}
function drawFrog() {
  const f = game.frog;
  const lean = Math.abs(f.vx) > 50 ? Math.sign(f.vx) : 0;
  if (game.invuln > 0 && Math.floor(game.time * 12) % 2 === 0) ctx.globalAlpha = 0.45; // respawn flicker
  if (game.tongueT > 0) drawRadar(Math.round(f.x), sy(f.y) - 14);
  const pos = drawFrogAt(f.x, sy(f.y), f.anim, lean, f.blink > 0, null);
  if (f.x < FROG_W / 2) drawFrogAt(f.x + W + FROG_W, sy(f.y), f.anim, lean, f.blink > 0, null);
  else if (f.x > W - FROG_W / 2) drawFrogAt(f.x - W - FROG_W, sy(f.y), f.anim, lean, f.blink > 0, null);
  if (f.dizzy > 0) { ctx.fillStyle = P.Y; for (let i = 0; i < 3; i++) { const a = game.time * 6 + i * 2.1; ctx.fillRect(Math.round(f.x + Math.cos(a) * 11), pos.y0 - 5 + Math.round(Math.sin(a) * 3), 2, 2); } }
  if (game.tongueT > 0 && !game.tongue) { // ready tongue: little pink tip at the mouth
    ctx.fillStyle = P.p; ctx.fillRect(Math.round(f.x - 1), pos.y0 + 11, 3, 1);
  }
  if (game.tongue) { // open mouth while the tongue is out
    const mx = Math.round(f.x) - 5, my = pos.y0 + (f.anim === 'jump' ? 11 : f.anim === 'stretch1' || f.anim === 'fall1' || f.anim === 'fall2' ? 10 : 9);
    ctx.fillStyle = P.k; ctx.fillRect(mx, my, 11, 4); ctx.fillStyle = '#7a1030'; ctx.fillRect(mx + 1, my + 1, 9, 2);
  }
  ctx.globalAlpha = 1;
}
function drawTongue() {
  const T = game.tongue; if (!T) return;
  const f = game.frog, k = T.t / T.dur, ext = k < 0.5 ? Math.min(1, k * 2.4) : Math.max(0, (1 - k) * 2);
  // straight horizontal shot from the mouth, like a classic side-view frog tongue
  const my = sy(f.y) - 17, mx = Math.round(f.x + T.dir * 4);
  const len = Math.round(Math.abs(T.fly.x - f.x) * ext), tx = mx + T.dir * len, ty = my;
  const x0 = Math.min(mx, tx), x1 = Math.max(mx, tx);
  ctx.fillStyle = P.k; ctx.fillRect(x0 - 1, my - 3, x1 - x0 + 2, 6);
  ctx.fillStyle = P.p; ctx.fillRect(x0, my - 2, x1 - x0, 4);
  ctx.fillStyle = P.a; ctx.fillRect(x0, my - 2, x1 - x0, 1);
  ctx.fillStyle = P.k; ctx.fillRect(tx - 4, ty - 4, 8, 8); ctx.fillStyle = P.p; ctx.fillRect(tx - 3, ty - 3, 6, 6); ctx.fillStyle = P.a; ctx.fillRect(tx - 2, ty - 3, 3, 1);
  if (k >= 0.5) { const spr = T.dir > 0 ? ICON.fly1 : FLY_L[1]; ctx.drawImage(spr, tx - 5, ty - 3); } // the fly rides the tongue back into the mouth
}
const FLY_L = [flipSprite(ICON.fly0), flipSprite(ICON.fly1)];
// HUD hearts, drawn at the same size as the UI coin: outline, highlight, shade and a glint
const HEART_ROWS = ['..kkkk...kkkk..', '.khhrrk.krrrrk.', 'khhwhrrkrrrrrdk', 'khwwrrrrrrrrrdk', 'khhrrrrrrrrrrdk', 'khrrrrrrrrrrddk', '.krrrrrrrrrrdk.', '.krrrrrrrrrddk.', '..krrrrrrrddk..', '...krrrrrddk...', '....krrrddk....', '.....krddk.....', '......kdk......', '.......k.......'];
ICON.heartBig = makeSprite(HEART_ROWS, { k: '#0a0a0c', r: '#e8323c', d: '#a8142a', h: '#ff8a8a', w: '#ffffff' });
ICON.heartBigEmpty = makeSprite(HEART_ROWS, { k: '#0a0a0c', r: 'rgba(10,10,24,0.45)', d: 'rgba(10,10,24,0.55)', h: 'rgba(255,255,255,0.2)', w: 'rgba(255,255,255,0.3)' });
// the same potion with a red brew, cross-faded in as the tongue power runs out
ICON.potionRed = makeSprite(ASSETS_POTION_ROWS, Object.assign({}, P, { p: '#e8322a', a: '#ff7a6e', P: '#8f1410' }));
function drawFly(fl) {
  const y = sy(fl.y), x = Math.round(fl.x);
  if (y < -10 || y > H + 10) return;
  if (game.tongue && game.tongue.fly === fl && game.tongue.t >= game.tongue.dur * 0.5) return; // drawn on the tongue tip instead
  const fr = Math.abs(Math.floor(game.time * 24)) % 2;
  const right = fl.esc || Math.cos(fl.t * fl.sp) > 0;
  const spr = right ? [ICON.fly0, ICON.fly1][fr] : FLY_L[fr];
  ctx.drawImage(spr, x - 5, y - 3);
  if (game.tongueT > 0 && !fl.esc) { ctx.fillStyle = POTION; ctx.fillRect(x - 1, y - 10, 2, 2); }
}
const COIN_FRAMES = [ICON.coin, ICON.coinThin, ICON.coinLine, ICON.coinThin];
function drawCoin(c) {
  const y = sy(c.y), fr = COIN_FRAMES[Math.abs(Math.floor(c.t * 6)) % 4];
  if (y < -10 || y > H + 10) return;
  ctx.drawImage(fr, Math.round(c.x - fr.width / 2), y - Math.floor(fr.height / 2));
}
// tongue power-up: a corked potion bottle that bobs and sparkles
function drawItem(it) {
  const y = sy(it.y) + Math.round(Math.sin(it.t * 3) * 2), x = Math.round(it.x);
  if (y < -16 || y > H + 16) return;
  ctx.globalAlpha = 0.18 + 0.1 * Math.sin(it.t * 5); ctx.fillStyle = POTION; ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
  const pt = ICON.potion; ctx.drawImage(pt, x - Math.floor(pt.width / 2), y - Math.floor(pt.height / 2));
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 3; i++) { const ph = (it.t * 1.3 + i * 0.33) % 1; if (ph < 0.5) { const a = i * 2.1 + Math.floor(it.t * 1.3) * 1.3; ctx.fillRect(x + Math.round(Math.cos(a) * 10), y + Math.round(Math.sin(a) * 9), 1, 1); } }
}
// objects coming in from the top start transparent and become fully opaque as they move down into view
function fadeTop(c) {
  const a = SAFE_TOP + 6, b = SAFE_TOP + 70;
  const gr = c.createLinearGradient(0, a, 0, b);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,1)');
  c.globalCompositeOperation = 'destination-in'; c.fillStyle = gr; c.fillRect(0, 0, W, H);
  c.globalCompositeOperation = 'source-over';
}
function drawWorld() {
  const shx = game.shake > 0 ? Math.round(rnd(-game.shake, game.shake)) : 0, shy = game.shake > 0 ? Math.round(rnd(-game.shake, game.shake)) : 0;
  ctx.save(); ctx.translate(shx, shy);
  drawSky(); drawMountains(); drawClouds(); drawGround();
  // best-score line
  if (save.best > 0 && scene !== 'title') {
    const by = sy(save.best * 10);
    if (by > 10 && by < H) { ctx.fillStyle = 'rgba(255,255,255,0.6)'; for (let x = 0; x < W; x += 6) ctx.fillRect(x, by, 3, 1); ctx.drawImage(ICON.trophy, 4, by - 10); text('' + save.best, 16, by - 13, { size: 8 }); }
  }
  ctx.restore();
  // platforms, coins, potions, particles and flies on the object layer, faded at the top
  ctx = octx; ctx.clearRect(0, 0, W, H); ctx.save(); ctx.translate(shx, shy);
  for (const p of game.plats) drawPlat(p);
  for (const c of game.coins) drawCoin(c);
  for (const it of game.items) drawItem(it);
  for (const pt of game.parts) { ctx.globalAlpha = clamp(pt.life / pt.max * 1.5, 0, 1); ctx.fillStyle = pt.c; const s = pt.life > pt.max * 0.5 ? 2 : 1; ctx.fillRect(Math.round(pt.x), sy(pt.y), s, s); }
  ctx.globalAlpha = 1;
  for (const fl of game.flies) drawFly(fl);
  ctx.restore(); fadeTop(octx);
  ctx = mainCtx; ctx.drawImage(og, 0, 0);
  // the frog is always fully visible
  ctx.save(); ctx.translate(shx, shy);
  drawFrog(); drawTongue();
  for (const fl of game.floaters) { ctx.globalAlpha = clamp(fl.life * 2, 0, 1); text(fl.str, fl.x, sy(fl.y), { size: 8, align: 'center', color: fl.color, wide: true }); }
  ctx.globalAlpha = 1;
  ctx.restore();
}

// ------------------------------------------------------------ HUD / screens
const uiCoin = (x, y, size = 9) => hiresSprite(ICON.coinBig, x + size / 2, y + 3.5, size, size); // UI coin centred on the text line
function drawCoinCounter(x, y, n, color = LIME, shadow) { uiCoin(x, y, 12); text('' + n, x + 14, y, { size: 8, color, shadow }); }
function iconButton(x, y, icon, fn, o = {}) {
  const b = addBtn(x, y, 20, 20, fn);
  button(b, null, { icon, fill: o.fill || LIME });
  return b;
}
// logo-style box: lime face, 2px black outline and a stepped black 3D extrusion down-right
function logoPanel(x, y, w, h, depth = 4) {
  x = Math.round(x); y = Math.round(y);
  ctx.fillStyle = INK;
  for (let i = depth; i >= 1; i--) ctx.fillRect(x + i, y + i, w, h);
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = LIME; ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
}
function drawHUD() {
  flush(); // world text (floaters) stays under the HUD
  const top = SAFE_TOP, blinkOn = Math.floor(game.time * 6) % 2 === 0;
  // left column, stacked under the safe area: coins, EXP bar, hearts (outlined so they read on any sky)
  drawCoinCounter(6, top + 5, game.runCoins);
  const bw = 66, bh = 11, bx = 7, by = top + 22; // a few pixels of air between the coin, EXP bar and hearts
  const frac = clamp(game.exp / expNeeded(game.level), 0, 1), fw = Math.round(bw * frac);
  ctx.fillStyle = INK; ctx.fillRect(bx - 2, by - 2, bw + 4, bh + 4);
  ctx.fillStyle = LIME;
  const rowW = r => Math.max(0, Math.min(bw, fw - Math.floor(r / 2))); // stepped diagonal edge
  for (let r = 0; r < bh; r++) ctx.fillRect(bx, by + r, rowW(r), 1);
  // labels flip colour where they cross the fill edge: black on lime, lime on black
  const ly = by + (bh - textH(8)) / 2;
  const labels = (col, clip) => { text('EXP', bx + 3, ly, { size: 8, color: col, shadow: false, clip }); text('LV' + game.level, bx + bw - 3, ly, { size: 8, align: 'right', color: col, shadow: false, clip }); };
  const fillClip = [], emptyClip = [];
  for (let r = 0; r < bh; r++) { fillClip.push([bx, by + r, rowW(r), 1]); emptyClip.push([bx + rowW(r), by + r, bw - rowW(r), 1]); }
  labels(INK, fillClip); labels(LIME, emptyClip);
  // hearts: the current life plus spare lives, empty outlines for the slots still to earn
  // hearts: same size as the coin and left-aligned with it; filled for the current + spare lives, empty for the rest
  const hy = by + bh + 7;
  for (let i = 0; i < 1 + MAX_LIVES; i++) hiresSprite(i <= game.lives ? ICON.heartBig : ICON.heartBigEmpty, 6 + 6 + i * 14, hy + 6, 12, 12);
  if (game.charged && blinkOn) text('SUPER JUMP!', 6 + (1 + MAX_LIVES) * 14 + 3, hy + 2, { size: 8 });
  // right column: score, and the tongue timer under it while the potion is active
  text('' + game.score, W - 6, top + 4, { size: 16, align: 'right' });
  if (game.tongueT > 0) {
    const pt = ICON.potion, tx = W - pt.width - 5, ty = top + 4 + Math.ceil(textH(16)) + 5; // below the score and its shadow
    // running out: over the last 3 seconds the bar and the brew turn red, and both blink in the final second
    const warn = clamp((3 - game.tongueT) / 3, 0, 1), blinkOff = game.tongueT < 1 && Math.floor(game.time * 10) % 2 === 0;
    if (!blinkOff) {
      ctx.drawImage(pt, tx, ty - 2);
      if (warn > 0) { ctx.globalAlpha = warn; ctx.drawImage(ICON.potionRed, tx, ty - 2); ctx.globalAlpha = 1; }
    }
    ctx.fillStyle = INK; ctx.fillRect(tx - 37, ty + 3, 33, 7);
    ctx.fillStyle = blinkOff ? INK : mixHex(LIME, '#ff3b30', warn); ctx.fillRect(tx - 36, ty + 4, Math.round(31 * game.tongueT / TONGUE_TIME), 5);
  }
  // level-up / 1UP banners
  // small banners on the left, under the hearts: they slide in from the edge, hold, then fade out.
  // The title sits on the lime face; an optional subtitle goes in a black strip at the bottom (like the EXP bar).
  // Returns the bottom edge so banners can stack.
  const banner = (t, dur, y0, title, sub) => {
    const k = 1 - t / dur, ease = 1 - Math.pow(1 - clamp(k / 0.18, 0, 1), 3);
    // bold expanded face for both lines
    const BS = 6, border = 2, pad = 2, padX = 4, lineH = Math.round(textH(BS, true)); // small bold expanded text
    const pw = Math.round(Math.max(textW(title, BS, 1, true), sub ? textW(sub, BS, 1, true) : 0) + 2 * (padX + border));
    const titleBlock = pad * 2 + lineH, subBlock = sub ? lineH + 4 : 0;
    const ph = border * 2 + titleBlock + subBlock;
    const px = Math.round(6 - (1 - ease) * (pw + 12)), py = Math.round(y0);
    ctx.globalAlpha = clamp(t * 3, 0, 1);
    logoPanel(px, py, pw, ph, 2);
    text(title, px + pw / 2, py + border + pad, { size: BS, track: 1, align: 'center', color: INK, shadow: false, wide: true });
    if (sub) {
      ctx.fillStyle = INK; ctx.fillRect(px + border, py + border + titleBlock, pw - 2 * border, subBlock);
      text(sub, px + pw / 2, py + border + titleBlock + 2, { size: BS, track: 1, align: 'center', color: LIME, shadow: false, wide: true });
    }
    ctx.globalAlpha = 1;
    return y0 + ph + 6;
  };
  let bannerY = top + 60;
  if (game.levelUpT > 0) bannerY = banner(game.levelUpT, 1.4, bannerY, 'LEVEL UP', 'JUMP +' + Math.round((jumpBoost() - 1) * 100) + '%');
  if (game.oneUpT > 0) bannerY = banner(game.oneUpT, 1.6, bannerY, '+1UP', 'EXTRA LIFE');
  if (game.eatT > 0) bannerY = banner(game.eatT, 1.6, bannerY, 'EAT THE FLIES!', null);
}
let buttons = [];
function addBtn(x, y, w, h, fn) { const b = { x, y, w, h, fn }; buttons.push(b); return b; }

// ------------------------------------------------------------ logo (vector SVG, drawn on the full-resolution canvas so it stays sharp)
const LOGO = new Image();
LOGO.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(ASSETS.logoSvg);
const LOGO_ASPECT = 117 / 253;
const easeOutBounce = t => { const n = 7.5625, d = 2.75; if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75; if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375; return n * (t -= 2.625 / d) * t + 0.984375; };
function logoRect() {
  const w = Math.min(W - 24, 180), h = Math.round(w * LOGO_ASPECT), x = Math.round((W - w) / 2);
  const restY = Math.round(SAFE_TOP + H * 0.1 + Math.sin(game.time * 3) * 2);
  const t = clamp((game.introT - 0.1) * 1.4, 0, 1);
  return { x, y: Math.round(restY - (1 - easeOutBounce(t)) * (restY + h + 10)), w, h, restY };
}
function drawLogo() {
  if (!LOGO.complete || !LOGO.naturalWidth) return;
  const r = logoRect();
  vctx.imageSmoothingEnabled = true; vctx.imageSmoothingQuality = 'high';
  vctx.drawImage(LOGO, r.x * S, r.y * S, r.w * S, r.h * S);
  vctx.imageSmoothingEnabled = false;
}

function drawTitle() {
  const it = game.introT, lr = logoRect(); // the logo itself is drawn later on the full-resolution canvas
  if (it > 1.2) {
    // best score in a small box: lime face, black outline and hard shadow, trophy + bold number centred inside
    const bw = 13 + textW('' + save.best, 8), boxW = Math.round(bw + 14), boxH = 17;
    const bx = Math.round(W / 2 - boxW / 2), by = Math.round(lr.restY + lr.h + 6), ty = by + (boxH - textH(8, true)) / 2;
    panel(bx, by, boxW, boxH);
    hiresSprite(ICON.trophy, W / 2 - bw / 2 + 5, by + boxH / 2, 11, 11);
    text('' + save.best, W / 2 - bw / 2 + 13, ty, { size: 8, color: INK, shadow: false });
  }
  drawCoinCounter(5, SAFE_TOP + 5, FREE_SHOP ? 'FREE' : save.coins);
  iconButton(W - 23, SAFE_TOP + 4, ICON.cart, () => { scene = 'shop'; shopTab = 0; });
  iconButton(W - 23, SAFE_TOP + 26, ICON.gear, () => { settingsOpen = true; });
  if (it < 1.6) return; // hints wait for the frog to arrive
  // tap hint
  if (Math.floor(game.time * 2) % 2 === 0) { const hy = sy(0) + 24; ctx.drawImage(ICON.hand, W / 2 - 22, hy + Math.round(Math.sin(game.time * 8))); text('TAP!', W / 2 - 6, hy + 1, { size: 16, color: LIME, wide: true }); }
  if (save.runs < 3) text('HOLD & DRAG TO MOVE', W / 2, sy(0) + 44, { size: 8, align: 'center', color: LIME });
  ctx.globalAlpha = 0.7; text('BUILD ' + BUILD, W - 4, H - 10, { size: 6, align: 'right', color: LIME }); ctx.globalAlpha = 1;
}
function drawDead() {
  flush(); // the dim overlay goes over the HUD text too
  const t = clamp(game.deadT * 2.2, 0, 1), ease = 1 - Math.pow(1 - t, 3);
  ctx.fillStyle = 'rgba(0,0,0,' + (0.5 * ease) + ')'; ctx.fillRect(0, 0, W, H);
  if (game.deadT < 0.25) return;
  const pw = Math.min(W - 28, 190), ph = 160, px = Math.round((W - pw) / 2), py = Math.round(H * 0.5 - ph / 2 - 10 + (1 - ease) * 40);
  panel(px, py, pw, ph);
  text('SPLASH!', W / 2, py + 10, { size: 16, align: 'center', color: INK, shadow: false });
  text('' + game.score, W / 2, py + 30, { size: 32, align: 'center', color: INK, shadow: false });
  const rowY = py + 72;
  if (game.newBest) { if (Math.floor(game.time * 4) % 2 === 0) text('NEW BEST!', W / 2, rowY, { size: 8, align: 'center', color: INK, shadow: false }); }
  else { const bw = 13 + textW('' + save.best, 8); hiresSprite(ICON.trophy, W / 2 - bw / 2 + 5, rowY + 3.5, 11, 11); text('' + save.best, W / 2 - bw / 2 + 13, rowY, { size: 8, color: INK, shadow: false }); }
  const cw = 12 + textW('+' + game.runCoins, 8);
  uiCoin(Math.round(W / 2 - cw / 2), rowY + 11); text('+' + game.runCoins, W / 2 - cw / 2 + 12, rowY + 11, { size: 8, color: INK, shadow: false });
  if (game.deadT < 0.6) return;
  const rb = addBtn(px + 10, py + ph - 58, pw - 22, 24, () => { newGame(); startGame(); });
  button(rb, 'RETRY', { size: 8 });
  const half = Math.floor((pw - 26) / 2);
  const hb = addBtn(px + 10, py + ph - 28, half, 20, () => { newGame(); scene = 'title'; });
  button(hb, null, { icon: ICON.home, fill: LIME });
  const sb = addBtn(px + 14 + half, py + ph - 28, half, 20, () => { scene = 'shop'; shopTab = 0; });
  button(sb, null, { icon: ICON.cart, fill: LIME });
}
let shopTab = 0, shopMsg = null;
const ICON_BOX_W = 30, ICON_BOX_H = 18; // every shop item is scaled to fit this box (in game pixels)
// crops transparent margins so sprites of different canvas sizes centre and scale the same way
const trimCache = new Map();
function trimmed(spr) {
  if (trimCache.has(spr)) return trimCache.get(spr);
  const d = spr.getContext('2d').getImageData(0, 0, spr.width, spr.height).data;
  let x0 = spr.width, y0 = spr.height, x1 = -1, y1 = -1;
  for (let y = 0; y < spr.height; y++) for (let x = 0; x < spr.width; x++) if (d[(y * spr.width + x) * 4 + 3] > 0) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  let out = spr;
  if (x1 >= 0) { out = document.createElement('canvas'); out.width = x1 - x0 + 1; out.height = y1 - y0 + 1; out.getContext('2d').drawImage(spr, -x0, -y0); }
  trimCache.set(spr, out); return out;
}
function drawShop() {
  dotBackground();
  drawCoinCounter(6, SAFE_TOP + 8, FREE_SHOP ? 'FREE' : save.coins, INK, false);
  iconButton(W - 23, SAFE_TOP + 5, ICON.close, () => { scene = game.started ? 'dead' : 'title'; });
  // preview panel with the frog wearing the equipped items
  const pvW = 72, pvH = 50, pvX = Math.round(W / 2 - pvW / 2), pvY = SAFE_TOP + 28;
  panel(pvX, pvY, pvW, pvH, INK);
  drawFrogAt(W / 2, pvY + pvH - 7 + Math.round(Math.sin(game.time * 3)), 'sit', 0, game.frog.blink > 0, null);
  // category tabs (the selected one is pressed in)
  const tabW = 30, tabY = pvY + pvH + 10, tabs = [frogFrames(save.eq.skin).sit, ITEMS.hat[2].spr, ICON.glassesTab, ICON.heart];
  for (let i = 0; i < tabs.length; i++) {
    const tx = Math.round(W / 2 - (tabs.length * tabW + (tabs.length - 1) * 6) / 2 + i * (tabW + 6));
    const b = addBtn(tx, tabY, tabW, 20, () => { shopTab = i; });
    const p = button(b, null, { fill: LIME, pressed: shopTab === i });
    hiresSprite(trimmed(tabs[i]), tx + p + tabW / 2, tabY + p + 10, tabW - 10, 11, 9);
  }
  // item grid
  const cat = CATS[shopTab], list = ITEMS[cat];
  const cols = 3, gap = 7, cw = Math.floor((W - 16 - gap * (cols - 1)) / cols), ch = 42, gx0 = Math.round((W - (cw * cols + gap * (cols - 1))) / 2), gy0 = tabY + 32;
  list.forEach((it, idx) => {
    const col = idx % cols, row = Math.floor(idx / cols);
    const bx0 = gx0 + col * (cw + gap), by0 = gy0 + row * (ch + gap);
    const key = cat + ':' + it.id, owned = save.owned.includes(key), equipped = save.eq[cat] === it.id;
    const b = addBtn(bx0, by0, cw, ch, () => shopTap(cat, it));
    const p = button(b, null, { fill: LIME, pressed: equipped }), x = bx0 + p, y = by0 + p;
    // the item is centred in the card (in the space above the price / check mark) and drawn larger
    // every item is trimmed and fitted to the same box, centred in the card (above the price / check mark if shown)
    const footer = !owned || equipped ? 12 : 0, iconCy = y + 1 + (ch - 2 - footer) / 2;
    if (it.spr) {
      ctx.globalAlpha = owned ? 1 : 0.7;
      hiresSprite(trimmed(it.spr), x + cw / 2, iconCy, ICON_BOX_W, ICON_BOX_H, 9);
      ctx.globalAlpha = 1;
    } else { ctx.fillStyle = INK; ctx.fillRect(x + Math.round(cw / 2) - 5, Math.round(iconCy) - 1, 10, 2); }
    if (owned) { if (equipped) ctx.drawImage(ICON.check, Math.round(x + cw / 2 - 4), y + ch - 12); }
    else {
      const can = FREE_SHOP || save.coins >= it.price, pw = 10 + textW('' + it.price, 8);
      const px = Math.round(x + cw / 2 - pw / 2);
      ctx.globalAlpha = can ? 1 : 0.5; uiCoin(px, y + ch - 12); ctx.globalAlpha = 1;
      text('' + it.price, px + 10, y + ch - 12, { size: 8, color: can ? INK : GRAY, shadow: false });
    }
  });
  const nameIt = list.find(i => i.id === save.eq[cat]);
  const footY = gy0 + Math.ceil(list.length / cols) * (ch + gap) + 6;
  if (shopMsg && shopMsg.t > 0) { shopMsg.t -= 1 / 60; text(shopMsg.s, W / 2, footY, { size: 16, align: 'center', color: shopMsg.c, shadow: false }); }
  else if (nameIt) text(nameIt.name, W / 2, footY, { size: 16, align: 'center', color: INK, shadow: false });
}
function shopTap(cat, it) {
  const key = cat + ':' + it.id;
  if (save.owned.includes(key)) {
    save.eq[cat] = (cat !== 'skin' && save.eq[cat] === it.id && it.id !== 'none') ? 'none' : it.id; persist(); sfx.ui();
  } else if (FREE_SHOP || save.coins >= it.price) {
    if (!FREE_SHOP) save.coins -= it.price;
    save.owned.push(key); save.eq[cat] = it.id; persist(); sfx.buy(); vibrate(20);
    shopMsg = { s: 'GOT ' + it.name + '!', t: 1.5, c: INK };
  } else { sfx.nope(); vibrate(30); shopMsg = { s: 'NEED ' + (it.price - save.coins) + ' MORE', t: 1.2, c: INK }; }
}
// on: black track with a lime knob on the right; off: lime track with a black knob on the left
function drawToggle(x, y, on) {
  ctx.fillStyle = INK; ctx.fillRect(x + 1, y + 1, 26, 12); ctx.fillRect(x, y, 26, 12);
  ctx.fillStyle = on ? INK : LIME; ctx.fillRect(x + 1, y + 1, 24, 10);
  ctx.fillStyle = on ? LIME : INK; ctx.fillRect(on ? x + 15 : x + 2, y + 2, 9, 8);
}
function drawSettings() {
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, W, H);
  const pw = Math.min(W - 36, 170), ph = 160, px = Math.round((W - pw) / 2), py = Math.round(H / 2 - ph / 2 - 20);
  panel(px, py, pw, ph);
  text('SETTINGS', px + 10, py + 9, { size: 8, color: INK, shadow: false });
  iconButton(px + pw - 24, py + 5, ICON.close, () => { settingsOpen = false; });
  const rows = [['note', 'music', 'MUSIC'], ['speaker', 'sound', 'SOUND'], ['vibrate', 'vib', 'BUZZ'], ['tilt', 'tilt', 'TILT']];
  rows.forEach((r, i) => {
    const y = py + 36 + (i === 0 ? 0 : i * 24 + 22);
    ctx.drawImage(ICON[r[0]], px + 12, y);
    text(r[2], px + 28, y + 1, { size: 8, color: INK, shadow: false });
    const b = addBtn(px + pw - 40, y - 4, 32, 18, () => {
      if (r[1] === 'tilt' && !save.tilt) enableTilt(); else { save[r[1]] = !save[r[1]]; persist(); }
      if (r[1] === 'music') musicApplyVolume();
    });
    drawToggle(b.x + 3, b.y + 3, save[r[1]]);
  });
  // music volume slider (tap or drag)
  const sy0 = py + 36 + 22, sx0 = px + 28, sw = pw - 28 - 14;
  text('VOL', px + 12 - 1, sy0 - 1, { size: 8, color: INK, shadow: false, wide: true });
  const tx0 = sx0 + 14, tw = sw - 14, kx = Math.round(tx0 + save.musicVol * tw);
  ctx.fillStyle = INK; ctx.fillRect(tx0, sy0 + 2, tw, 4);
  ctx.fillStyle = save.music ? INK : GRAY; ctx.fillRect(tx0, sy0 + 1, kx - tx0, 6);
  ctx.fillStyle = INK; ctx.fillRect(kx - 3, sy0 - 2, 7, 12); ctx.fillStyle = LIME; ctx.fillRect(kx - 2, sy0 - 1, 5, 10);
  const sb = addBtn(tx0 - 6, sy0 - 6, tw + 12, 20, (x) => { save.musicVol = clamp((x - tx0) / tw, 0, 1); if (save.musicVol > 0 && !save.music) save.music = true; musicApplyVolume(); persist(); });
  sb.drag = true;
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
  game.frog.vy = JUMP_V; game.frog.landT = 0; sfx.jump(); vibrate(8);
}
function toLogical(e) { const r = view.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; }
let activePointer = null, dragBtn = null;
view.addEventListener('pointerdown', e => {
  e.preventDefault();
  audioInit(); if (ac && ac.state === 'suspended') ac.resume(); musicStart();
  const [x, y] = toLogical(e);
  for (const b of buttons) if (hit(b, x, y)) { sfx.ui(); b.fn(x, y); if (b.drag) dragBtn = { id: e.pointerId, fn: b.fn }; return; }
  if (settingsOpen || scene === 'shop' || scene === 'dead') return;
  if (scene === 'title') startGame();
  activePointer = e.pointerId; input.touchX = x;
}, { passive: false });
view.addEventListener('pointermove', e => {
  if (dragBtn && dragBtn.id === e.pointerId) { const [x, y] = toLogical(e); dragBtn.fn(x, y); return; }
  if (activePointer !== e.pointerId) return;
  input.touchX = toLogical(e)[0];
});
const endPointer = e => { if (dragBtn && dragBtn.id === e.pointerId) { dragBtn = null; persist(); } if (activePointer === e.pointerId) { activePointer = null; input.touchX = null; } };
view.addEventListener('pointerup', endPointer); view.addEventListener('pointercancel', endPointer);
addEventListener('keydown', e => {
  input.keys[e.code] = true;
  audioInit(); if (ac && ac.state === 'suspended') ac.resume(); musicStart();
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
  f.blinkT -= dt; if (f.blinkT <= 0) { f.blink = 0.14; f.blinkT = rnd(1.5, 3.5); }
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
    if (scene === 'title') {
      for (const p of game.plats) p.t += dt; for (const c of game.coins) c.t += dt; for (const it of game.items) it.t += dt;
      // intro: the frog hops in from the left edge onto the ground
      game.introT += dt;
      const k = clamp((game.introT - 0.2) / 1.3, 0, 1);
      if (k < 1) {
        f.x = lerp(-24, W / 2, k); const hop = Math.abs(Math.sin(k * Math.PI * 3));
        f.y = hop * 22; f.anim = hop > 0.55 ? 'jump' : hop > 0.2 ? 'stretch1' : 'crouch1'; f.vx = 60;
      } else { f.x = W / 2; f.y = 0; f.anim = 'sit'; f.vx = 0; }
    }
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
  }
  flush();
  if (scene === 'title') drawLogo();
  // the settings overlay goes on top of the logo, so it gets its own pass
  if (settingsOpen && scene !== 'shop') { drawSettings(); flush(); }
}
addEventListener('resize', () => { if (scene === 'title' || scene === 'shop') { newGame(); } });
document.addEventListener('visibilitychange', () => {
  if (document.hidden && scene === 'play') { input.touchX = null; }
  if (ac) { if (document.hidden) ac.suspend(); else ac.resume(); } // no music in the background
});

// ---- boot
newGame();
last = performance.now();
requestAnimationFrame(frame);
