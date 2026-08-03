// ---------------------------------------------------------------------------
// PIXEL CHARACTERS
//
// Three 12x16 pixel people, drawn from the family photos. Every character is
// a grid of letters looked up in its own palette, so changing a colour here
// re-skins the whole sprite:
//
//   h hair    s skin    e eyes    b top
//   p bottoms k shoes   d facial hair
//
// The three are built to read apart instantly at this tiny size -- Asha by her
// dark cropped afro and orange top, Naomi by her big light curls and small
// stature, Fabian by his silver hair and black top.
// ---------------------------------------------------------------------------

export const palettes = {
  // Deep brown skin, close-cropped dark afro. Orange top, teal shorts.
  asha: {
    h: '#1b1310',
    s: '#7d4b2f',
    e: '#fbf3e8', // light eyes read clearly against deep skin
    b: '#f5884b',
    p: '#2f8fa0',
    k: '#f2ece0',
    o: '#ffd94a',
  },
  // Warm tan skin, big caramel curls. Orange dress, blue beneath.
  naomi: {
    h: '#7d4e2c',
    s: '#c98a5e',
    e: '#241610',
    b: '#f4712f',
    p: '#4aa3c4',
    k: '#ff9ec0',
    o: '#ffffff',
  },
  // Fair skin, blond hair going grey, light stubble. Black top.
  fabian: {
    h: '#ddc07c',
    s: '#e3b892',
    e: '#2a2018',
    b: '#2b2f38',
    p: '#3f7fa8',
    k: '#4a4f57',
    d: '#b9b2a6',
    o: '#ffffff',
  },
};

// Each hair style is the three rows above the face, plus whether the hair
// also frames the face and falls onto the shoulders.
const styles = {
  // cropped afro with a big puff tied on top -- pinched at the base so the
  // puff reads as its own ball rather than merging into the rest of the hair
  afro: {
    top: [
      '...hhhhhh...',
      '..hhhhhhhh..',
      '..hhhhhhhh..',
      '...hhhhhh...',
      '..hhhhhhhh..',
      '.hhhhhhhhhh.',
      '.hhhhhhhhhh.',
    ],
    faceSide: 'h',
    torsoSide: 's',
  },
  // big voluminous curls, past the shoulders -- wider than the afro, but left
  // open around the face so it does not swallow her eyes
  curls: {
    top: ['.hhhhhhhhhh.', '.hhhhhhhhhh.', '.hhhhhhhhhh.'],
    faceSide: 'h',
    torsoSide: 'h',
  },
  // short and neat
  crop: {
    top: ['...hhhhhh...', '..hhhhhhhh..', '..hhhhhhhh..'],
    faceSide: 's',
    torsoSide: 's',
  },
};

function face(style, beard) {
  const x = style.faceSide;
  return [
    ...style.top,
    `..${x}sssssss${x}.`,
    `..${x}se.s.es${x}.`,
    `..${x}sssssss${x}.`,
    '...ssssss...',
    beard ? '....dddd....' : '....ssss....',
  ];
}

function torso(style, child) {
  const x = style.torsoSide;
  return child
    ? ['..bbbbbbbb..', `.${x}bbbbbbbb${x}.`, '..bbbbbbbb..']
    : ['..bbbbbbbb..', `.${x}bbbbbbbb${x}.`, '.sbbbbbbbbs.', '..bbbbbbbb..'];
}

const legs = {
  stand: ['..pppppppp..', '..ppp..ppp..', '..kk....kk..'],
  walkA: ['..pppppppp..', '..pp....ppp.', '..kk.....kk.'],
  walkB: ['..pppppppp..', '.ppp....pp..', '.kk.....kk..'],
  jump: ['..pppppppp..', '.ppp....ppp.', '.kk.......k.'],
};

// A child loses a torso row and a leg row, so Naomi ends up visibly shorter
// than her parents without any scaling -- which would blur the pixel art.
const childLegs = {
  stand: ['..pppppppp..', '..kk....kk..'],
  walkA: ['..pp....ppp.', '..kk.....kk.'],
  walkB: ['.ppp....pp..', '.kk.....kk..'],
  jump: ['.ppp....ppp.', '.kk.......k.'],
};

function frames(styleName, { beard = false, child = false } = {}) {
  const style = styles[styleName];
  const head = face(style, beard);
  const body = torso(style, child);
  const set = child ? childLegs : legs;
  const out = {};
  for (const [name, legRows] of Object.entries(set)) {
    out[name] = [...head, ...body, ...legRows];
  }
  return out;
}

// Everyone draws at exactly one pixel per cell. Fractional scaling blurs the
// art once the canvas is stretched up to a phone, so the height difference is
// baked into the grids instead.
export const characters = {
  asha: { frames: frames('afro'), palette: palettes.asha, scale: 1 },
  naomi: { frames: frames('curls', { child: true }), palette: palettes.naomi, scale: 1 },
  fabian: { frames: frames('crop', { beard: true }), palette: palettes.fabian, scale: 1 },
};

export const SPRITE_W = 12;
export const SPRITE_H = 16;

// The puff on top of her head swells with every tumble into a pit, so her hair
// grows through the run. Capped so it stays on screen.
const MAX_PUFFS = 8;

// Draws a sprite standing with its feet at (x, y), centred horizontally on x.
// opts.puffs stacks extra hair balls above the head.
export function drawSprite(ctx, who, frameName, x, y, faceLeft, opts = {}) {
  const c = characters[who];
  const rows = c.frames[frameName] || c.frames.stand;
  const s = c.scale;
  const w = SPRITE_W * s;
  const h = rows.length * s; // characters are not all the same height

  ctx.save();
  ctx.translate(Math.round(x), Math.round(y - h));
  if (faceLeft) {
    ctx.translate(w / 2, 0);
    ctx.scale(-1, 1);
    ctx.translate(-w / 2, 0);
  }
  ctx.translate(-w / 2, 0);

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (let col = 0; col < row.length; col++) {
      const ch = row[col];
      if (ch === '.') continue;
      const colour = c.palette[ch];
      if (!colour) continue;
      ctx.fillStyle = colour;
      // The slight overdraw keeps neighbouring pixels from showing seams
      // once the whole canvas is scaled up on a phone.
      ctx.fillRect(col * s, r * s, s + 0.02, s + 0.02);
    }
  }

  // The puff, sitting on top of the head and growing with every tumble.
  const n = Math.min(opts.puffs || 0, MAX_PUFFS);
  if (n > 0) {
    const w = 6 + n * 1.6;          // 7.6 wide at one fall, 18.8 at eight
    const h = 3 + n * 0.9;
    ctx.fillStyle = c.palette.h;
    for (let r = 0; r < Math.round(h); r++) {
      // an ellipse, drawn a row at a time so it stays properly pixelated
      const t = ((r + 0.5) / h) * 2 - 1;
      const half = Math.round((w / 2) * Math.sqrt(Math.max(0, 1 - t * t)));
      if (half <= 0) continue;
      ctx.fillRect((6 - half) * s, (r - Math.round(h)) * s, half * 2 * s + 0.02, s + 0.02);
    }
  }

  ctx.restore();
}

// ---------------------------------------------------------------------------
// THE ANIMALS
//
// One friend per chapter. Each joins when its chapter begins and then follows
// her for the rest of the game, so the parade behind her grows chapter by
// chapter. Small and chunky, so they still read at a few pixels tall.
// ---------------------------------------------------------------------------

export const animals = {
  chicken: {
    palette: { w: '#fdfdf8', s: '#e2ded0', c: '#e0483c', b: '#f0a63c', e: '#241a14' },
    rows: [
      '...cc....',
      '..cccc...',
      '..wwwwb..',
      '.wwewwbb.',
      'swwwwwww.',
      '.swwwwws.',
      '..ssss...',
      '..b..b...',
    ],
  },
  pelican: {
    flies: true,
    palette: { w: '#f6f6f2', g: '#c9cdd2', y: '#f0b83c', e: '#241a14', o: '#e09a34' },
    rows: [
      '...www...',
      '..wwwww..',
      '..wewww..',
      '..wwwyyyy',
      '.wgggwyy.',
      '.wggggw..',
      '.wwwww...',
      '..o.o....',
    ],
  },
  raccoon: {
    palette: { g: '#9aa0a8', d: '#3b3f47', w: '#e8ebee', e: '#1a1a1e', n: '#2a2c30' },
    rows: [
      '.........',
      '..ddd....',
      '.wwwww...',
      '.dedew...',
      '.wwnww...',
      'gggggggd.',
      'gggggggdg',
      '.g.g.g.dg',
    ],
  },
  dodo: {
    palette: { b: '#8ea3b8', l: '#b9c8d6', y: '#f0c04c', e: '#1c1c22', o: '#e0a83c' },
    rows: [
      '....bbb..',
      '...bbbbb.',
      '...bebbyy',
      '...bbbbyy',
      '..bbbbb..',
      '.lbbbbb..',
      '.lllbbb..',
      '...o.o...',
    ],
  },
  mantis: {
    palette: { g: '#5fbf5a', d: '#3d8f3a', e: '#1c2a1c', l: '#8ede84' },
    rows: [
      '.......dd',
      '......ggg',
      '.d....geg',
      '.dd..gggg',
      '..dggggg.',
      '.lgggggd.',
      '.g.g.g...',
      '..d...d..',
    ],
  },
  redpanda: {
    palette: { r: '#c96a34', w: '#f4ece0', d: '#3a2a20', e: '#1a1210', t: '#a8542a' },
    rows: [
      '.........',
      '..w...w..',
      '.rwwwwwr.',
      '.wewrrew.',
      '.wwwwwww.',
      'rrrrrrrtt',
      'rrrrrrrtt',
      '.d.d.d...',
    ],
  },
  capuchin: {
    palette: { n: '#6b4a30', f: '#f0dcc0', d: '#3a2618', e: '#1a1210' },
    rows: [
      '...ddd...',
      '..dfffd..',
      '..fefef..',
      '..ffffn..',
      '.nnnnnn..',
      'nnnnnnnn.',
      '.n.n.nnnn',
      '.d.d....n',
    ],
  },
};

export const ANIMAL_W = 9;
export const ANIMAL_H = 8;

// Draws an animal with its feet at (x, y), centred on x.
export function drawAnimal(ctx, key, x, y, faceLeft) {
  const a = animals[key];
  if (!a) return;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y - ANIMAL_H));
  if (faceLeft) {
    ctx.translate(ANIMAL_W / 2, 0);
    ctx.scale(-1, 1);
    ctx.translate(-ANIMAL_W / 2, 0);
  }
  ctx.translate(-ANIMAL_W / 2, 0);
  for (let r = 0; r < a.rows.length; r++) {
    const row = a.rows[r];
    for (let c = 0; c < row.length; c++) {
      const ch = row[c];
      if (ch === '.') continue;
      const colour = a.palette[ch];
      if (!colour) continue;
      ctx.fillStyle = colour;
      ctx.fillRect(c, r, 1.02, 1.02);
    }
  }
  ctx.restore();
}

// A soft shadow under a character, so jumps read clearly against the ground.
export function drawShadow(ctx, x, groundY, strength = 0.25) {
  ctx.save();
  ctx.globalAlpha = strength;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(Math.round(x), Math.round(groundY), 7, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
