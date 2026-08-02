// ---------------------------------------------------------------------------
// PIXEL CHARACTERS
//
// Every character is a 12x16 grid of letters. Each letter is looked up in that
// character's palette, so changing a colour below re-skins the whole sprite.
//
// TUNE ME once the photos are uploaded: hair, skin, shirt and pants are the
// only values that matter for making these look like us.
// ---------------------------------------------------------------------------

export const palettes = {
  asha: {
    h: '#2b1a14', // hair
    s: '#c98b62', // skin
    e: '#1a1010', // eyes
    b: '#e0577f', // shirt
    p: '#3b4a80', // trousers
    k: '#f2f2f2', // shoes
    o: '#f4c96b', // accent (earrings / detail)
  },
  naomi: {
    h: '#3a2318',
    s: '#d09a72',
    e: '#1a1010',
    b: '#59c2a8',
    p: '#7a4fa8',
    k: '#ffd94a',
    o: '#ffffff',
  },
  fabian: {
    h: '#8a6236',
    s: '#e0b18c',
    e: '#1a1010',
    b: '#4a7fd0',
    p: '#39424f',
    k: '#8b5a3c',
    o: '#ffffff',
  },
};

// Hair shapes. Row 1-3 of the sprite, drawn above the face.
const hair = {
  // long, past the shoulders
  long: ['...hhhhhh...', '..hhhhhhhh..', '..hhhhhhhh..'],
  // two small buns / bunches
  bunches: ['..h.hhhh.h..', '.hhhhhhhhhh.', '..hhhhhhhh..'],
  // short, cropped
  short: ['...hhhhhh...', '..hhhhhhhh..', '..hhhhhhhh..'],
};

// The face and torso never change between frames -- only arms and legs do.
function face(style) {
  return [
    ...hair[style],
    '..hsssssssh.',
    '..hse.s.esh.',
    '..hsssssssh.',
    '...ssssss...',
    '....ssss....',
  ];
}

// Long hair falls down the sides of the torso; short hair does not.
function torso(style) {
  const side = style === 'short' ? 's' : 'h';
  return [
    `..bbbbbbbb..`,
    `.${side}bbbbbbbb${side}.`,
    `.sbbbbbbbbs.`,
    `..bbbbbbbb..`,
  ];
}

const legs = {
  stand: ['..pppppppp..', '..ppp..ppp..', '..kk....kk..'],
  walkA: ['..pppppppp..', '..pp....ppp.', '..kk.....kk.'],
  walkB: ['..pppppppp..', '.ppp....pp..', '.kk.....kk..'],
  jump: ['..pppppppp..', '.ppp....ppp.', '.kk.......k.'],
};

function build(style, legRows) {
  return [...face(style), ...torso(style), ...legRows];
}

function frames(style) {
  return {
    stand: build(style, legs.stand),
    walkA: build(style, legs.walkA),
    walkB: build(style, legs.walkB),
    jump: build(style, legs.jump),
  };
}

export const characters = {
  asha: { frames: frames('long'), palette: palettes.asha, scale: 1 },
  naomi: { frames: frames('bunches'), palette: palettes.naomi, scale: 0.8 },
  fabian: { frames: frames('short'), palette: palettes.fabian, scale: 1.05 },
};

export const SPRITE_W = 12;
export const SPRITE_H = 16;

// Draws a sprite with its feet at (x, y) and horizontally centred on x.
export function drawSprite(ctx, who, frameName, x, y, faceLeft) {
  const c = characters[who];
  const rows = c.frames[frameName] || c.frames.stand;
  const s = c.scale;
  const w = SPRITE_W * s;
  const h = SPRITE_H * s;

  ctx.save();
  ctx.translate(Math.round(x), Math.round(y - h));
  if (faceLeft) {
    ctx.translate(w / 2, 0);
    ctx.scale(-1, 1);
    ctx.translate(-w / 2, 0);
  }
  ctx.translate(-w / 2 + w / 2 - w / 2, 0); // centre on x

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (let col = 0; col < row.length; col++) {
      const ch = row[col];
      if (ch === '.') continue;
      const colour = c.palette[ch];
      if (!colour) continue;
      ctx.fillStyle = colour;
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
