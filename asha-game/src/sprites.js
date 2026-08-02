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
  // Fair skin, silver hair, grey stubble. Black top.
  fabian: {
    h: '#dcdcd4',
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
  // cropped round afro
  afro: {
    top: ['..hhhhhhhh..', '.hhhhhhhhhh.', '.hhhhhhhhhh.'],
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

// Draws a sprite standing with its feet at (x, y), centred horizontally on x.
export function drawSprite(ctx, who, frameName, x, y, faceLeft) {
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
