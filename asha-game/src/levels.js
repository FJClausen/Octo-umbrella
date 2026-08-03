// ---------------------------------------------------------------------------
// LEVELS
//
// A level is written as a list of ops read left to right:
//   ['g', w]            solid ground, w pixels wide
//   ['gap', w]          a hole -- falling in costs a life
//   ['p', w, dy]        a floating stepping stone, dy pixels above the ground
//   ['m', w, dy, r, sp] a moving platform: range r, speed sp (dy < 0 = higher)
//   ['over', w, dy]     an optional platform ABOVE the ground just laid --
//                       nothing to fall into, purely a bonus route
//   ['heart']           a collectible heart floating above the cursor
//
// THE SAFETY RULE, which every line below obeys:
//   A full jump carries her about 88px; the shortest possible tap carries her
//   about 50px. So every landing zone must catch anything in the 50-88 range.
//   In practice that means gaps stay at 46px or under, and any stepping stone
//   she MUST hit is at least 72px wide. Narrow stones are bonus routes only.
// ---------------------------------------------------------------------------

export const GROUND_Y = 200; // top surface of the ground
export const DEATH_Y = 300; // fall past this and you respawn

// The rhythm of each chapter's two parcours runs.
const runs = {
  dc: [
    [['g', 150], ['over', 70, -44], ['heart'], ['gap', 44], ['g', 150],
     ['gap', 40], ['p', 76, -24], ['gap', 40], ['g', 160],
     ['gap', 46], ['g', 140], ['over', 70, -46], ['heart'], ['gap', 42], ['g', 150]],
    [['g', 140], ['gap', 40], ['p', 80, -26], ['gap', 40], ['g', 150], ['heart'],
     ['gap', 44], ['g', 140], ['gap', 38], ['m', 76, -24, 30, 26], ['gap', 38], ['g', 170]],
  ],
  tulum: [
    [['g', 150], ['gap', 42], ['g', 140], ['over', 70, -44], ['heart'],
     ['gap', 40], ['p', 76, -22], ['gap', 40], ['g', 150], ['gap', 44], ['g', 160]],
    [['g', 140], ['gap', 38], ['m', 78, -22, 30, 24], ['gap', 38], ['g', 150], ['heart'],
     ['gap', 44], ['g', 140], ['gap', 40], ['p', 76, -28], ['gap', 40], ['g', 170]],
  ],
  house: [
    // up the stoop to the front door -- the steps sit over solid ground, so a
    // missed step just means landing on the pavement, never a fall
    [['g', 160], ['over', 72, -22], ['heart'], ['g', 130], ['over', 72, -40], ['heart'],
     ['gap', 44], ['g', 150], ['gap', 40], ['p', 78, -26], ['gap', 40], ['g', 160]],
    [['g', 140], ['gap', 44], ['g', 150], ['gap', 38], ['m', 78, -26, 30, 26], ['gap', 38],
     ['g', 140], ['heart'], ['gap', 42], ['g', 170]],
  ],
  naomi: [
    [['g', 150], ['gap', 40], ['p', 78, -24], ['gap', 40], ['g', 150], ['heart'],
     ['gap', 44], ['g', 140], ['over', 70, -46], ['heart'], ['gap', 42], ['g', 160]],
    [['g', 140], ['gap', 42], ['g', 140], ['gap', 40], ['p', 76, -30], ['gap', 40],
     ['g', 150], ['heart'], ['gap', 38], ['m', 78, -24, 28, 24], ['gap', 38], ['g', 170]],
  ],
  arboretum: [
    [['g', 160], ['over', 72, -44], ['heart'], ['gap', 44], ['g', 150],
     ['gap', 40], ['p', 78, -24], ['gap', 40], ['g', 150], ['gap', 42], ['g', 150]],
    [['g', 140], ['gap', 38], ['m', 76, -22, 30, 24], ['gap', 38], ['g', 150], ['heart'],
     ['gap', 44], ['g', 140], ['gap', 40], ['p', 76, -26], ['gap', 40], ['g', 170]],
  ],
  germany: [
    [['g', 150], ['gap', 42], ['g', 140], ['over', 70, -42], ['heart'],
     ['gap', 40], ['p', 76, -26], ['gap', 40], ['g', 150], ['gap', 44], ['g', 160]],
    [['g', 140], ['gap', 40], ['p', 80, -28], ['gap', 40], ['g', 150], ['heart'],
     ['gap', 38], ['m', 78, -24, 30, 26], ['gap', 38], ['g', 140], ['gap', 42], ['g', 170]],
  ],
  costarica: [
    [['g', 150], ['gap', 44], ['g', 140], ['gap', 40], ['p', 78, -26], ['gap', 40],
     ['g', 150], ['over', 70, -46], ['heart'], ['gap', 42], ['g', 160]],
    [['g', 140], ['gap', 38], ['m', 78, -26, 30, 26], ['gap', 38], ['g', 150], ['heart'],
     ['gap', 40], ['p', 76, -22], ['gap', 40], ['g', 150], ['gap', 44], ['g', 180]],
  ],
};

function compile(ops, cursor, out) {
  for (const op of ops) {
    const [kind, w, dy, range, speed] = op;
    if (kind === 'g') {
      out.platforms.push({ x: cursor, y: GROUND_Y, w, h: 260, solid: true });
      cursor += w;
    } else if (kind === 'gap') {
      cursor += w;
    } else if (kind === 'p') {
      out.platforms.push({ x: cursor, y: GROUND_Y + dy, w, h: 8 });
      cursor += w;
    } else if (kind === 'm') {
      out.movers.push({
        x: cursor, y: GROUND_Y + dy, w, h: 8,
        x0: cursor, range, speed, phase: Math.random() * Math.PI * 2,
      });
      cursor += w;
    } else if (kind === 'over') {
      // Bonus platform floating above the ground we just laid -- the cursor
      // does not advance, so this never creates something to fall into.
      out.platforms.push({ x: cursor - w, y: GROUND_Y + dy, w, h: 8 });
      out.hearts.push({ x: cursor - w / 2, y: GROUND_Y + dy - 18, taken: false });
    } else if (kind === 'heart') {
      out.hearts.push({ x: cursor - 20, y: GROUND_Y - 40, taken: false });
    }
  }
  return cursor;
}

// Builds the playable level for one chapter: checkpoint, run, checkpoint, run, goal.
export function buildLevel(chapter) {
  const out = { platforms: [], movers: [], hearts: [], checkpoints: [], theme: chapter.theme };
  let cursor = 0;

  // A short flat porch to start on, with the first checkpoint standing on it.
  out.platforms.push({ x: cursor, y: GROUND_Y, w: 120, h: 260, solid: true });
  out.checkpoints.push({ x: cursor + 70, y: GROUND_Y, index: 0, reached: false, answered: false });
  cursor += 120;

  const pattern = runs[chapter.theme] || runs.dc;
  cursor = compile(pattern[0], cursor, out);

  // Landing pad halfway. It only carries a checkpoint if the chapter actually
  // has a second question -- a chapter with one question just runs straight
  // through here, and the parcours is unchanged either way.
  out.platforms.push({ x: cursor, y: GROUND_Y, w: 120, h: 260, solid: true });
  if (chapter.checkpoints.length > 1) {
    out.checkpoints.push({ x: cursor + 60, y: GROUND_Y, index: 1, reached: false, answered: false });
  }
  cursor += 120;

  cursor = compile(pattern[1], cursor, out);

  // The goal sits on a final pad.
  out.platforms.push({ x: cursor, y: GROUND_Y, w: 140, h: 260, solid: true });
  out.goal = { x: cursor + 70, y: GROUND_Y };
  cursor += 140;

  out.length = cursor;
  out.start = { x: 30, y: GROUND_Y };
  return out;
}

// The last scene: a short, safe walk with no gaps at all.
export function buildFinaleLevel() {
  const out = { platforms: [], movers: [], hearts: [], checkpoints: [], theme: 'finale' };
  out.platforms.push({ x: 0, y: GROUND_Y, w: 620, h: 260, solid: true });
  out.goal = { x: 540, y: GROUND_Y };
  out.length = 620;
  out.start = { x: 30, y: GROUND_Y };
  out.family = { x: 560, y: GROUND_Y };
  return out;
}

// ---------------------------------------------------------------------------
// BACKGROUNDS -- one painted scene per era, drawn with plain rectangles so it
// stays in the pixel style and needs no image files.
// ---------------------------------------------------------------------------

const skies = {
  dc: ['#8fc7e8', '#dff0f7'],
  tulum: ['#38bdd8', '#ffe9b8'],
  house: ['#f6a96b', '#ffe2c0'],
  naomi: ['#141a3a', '#3b3070'],
  arboretum: ['#a8d8f0', '#e8f6df'],
  germany: ['#9fb8d8', '#e6eef7'],
  costarica: ['#4fb98a', '#d9f2c9'],
  finale: ['#ffb3d0', '#ffe9b8'],
};

const grounds = {
  dc: ['#6b8f4e', '#4e6b39'],
  tulum: ['#f2e0b0', '#d9c48c'],
  house: ['#7a6a5a', '#5c4f42'],
  naomi: ['#3a3466', '#282350'],
  arboretum: ['#7bab55', '#5b8440'],
  germany: ['#7f9a5e', '#5f7746'],
  costarica: ['#5f9f4a', '#457436'],
  finale: ['#8fbf68', '#6d9a4d'],
};

function rect(ctx, x, y, w, h, c) {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

// Repeats a drawing function across the visible camera range.
function tile(ctx, camX, spacing, parallax, draw) {
  const off = camX * parallax;
  const first = Math.floor(off / spacing) - 1;
  for (let i = first; i < first + 8; i++) {
    draw(i * spacing - off, i);
  }
}

// Drawn inside a vertically-translated context, so all the scenery below is
// positioned in world coordinates against GROUND_Y. Only the sky needs to
// stretch to cover whatever slice of the world the screen happens to show.
export function drawBackground(ctx, theme, camX, t, W, H) {
  const [top, bottom] = skies[theme] || skies.dc;
  const g = ctx.createLinearGradient(0, GROUND_Y - H, 0, GROUND_Y);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, GROUND_Y - H - 400, W, H + 800);

  if (theme === 'naomi') {
    // stars
    for (let i = 0; i < 40; i++) {
      const sx = (i * 137.5 - camX * 0.05) % (W + 20);
      const sy = (i * 61) % 130;
      const tw = 0.6 + 0.4 * Math.sin(t * 2 + i);
      ctx.globalAlpha = tw;
      rect(ctx, sx < 0 ? sx + W + 20 : sx, sy, 2, 2, '#ffffff');
    }
    ctx.globalAlpha = 1;
    rect(ctx, W - 90 - camX * 0.02, 30, 26, 26, '#fdf6d0');
  } else {
    // sun + clouds
    rect(ctx, W - 80 - camX * 0.02, 28, 26, 26, theme === 'tulum' ? '#fff3b0' : '#fff8dc');
    tile(ctx, camX, 200, 0.1, (x) => {
      rect(ctx, x, 34, 40, 8, '#ffffff');
      rect(ctx, x + 10, 26, 24, 8, '#ffffff');
    });
  }

  switch (theme) {
    case 'dc':
      // Washington Monument + Capitol dome
      tile(ctx, camX, 340, 0.25, (x) => {
        rect(ctx, x + 40, 60, 14, 110, '#e6e2d6');
        rect(ctx, x + 42, 52, 10, 10, '#e6e2d6');
        rect(ctx, x + 160, 118, 90, 52, '#eeeae0');
        rect(ctx, x + 190, 92, 30, 28, '#f4f0e6');
        rect(ctx, x + 200, 82, 10, 12, '#f4f0e6');
      });
      // cherry blossom trees
      tile(ctx, camX, 120, 0.55, (x) => {
        rect(ctx, x + 30, 150, 5, 24, '#5a4230');
        rect(ctx, x + 18, 132, 30, 20, '#f7c2d8');
        rect(ctx, x + 24, 124, 18, 10, '#ffd9e8');
      });
      break;

    case 'tulum':
      rect(ctx, 0, 140, W, 34, '#2fa8c8'); // sea
      tile(ctx, camX, 90, 0.2, (x) => rect(ctx, x, 146 + Math.sin(t + x) * 1.5, 26, 3, '#8fe3f0'));
      tile(ctx, camX, 150, 0.55, (x) => {
        rect(ctx, x + 40, 128, 5, 46, '#8a6a3a'); // palm trunk
        rect(ctx, x + 22, 120, 42, 6, '#3f9f5a');
        rect(ctx, x + 28, 114, 30, 6, '#4fb96a');
      });
      break;

    case 'house':
      // a row of DC townhouses
      tile(ctx, camX, 74, 0.4, (x, i) => {
        const colours = ['#b4574b', '#c68a4a', '#8d6f9c', '#5c7fa8'];
        const c = colours[((i % colours.length) + colours.length) % colours.length];
        rect(ctx, x, 96, 66, 78, c);
        rect(ctx, x, 90, 66, 8, '#3b3b3b');
        rect(ctx, x + 10, 112, 14, 16, '#ffe9a8');
        rect(ctx, x + 40, 112, 14, 16, '#ffe9a8');
        rect(ctx, x + 26, 146, 16, 28, '#5a3a2a');
      });
      break;

    case 'naomi':
      // sleeping city skyline
      tile(ctx, camX, 60, 0.3, (x, i) => {
        const h = 40 + ((i * 37) % 60);
        rect(ctx, x, 174 - h, 44, h, '#1e2148');
        for (let wy = 0; wy < h - 12; wy += 12) {
          if ((i + wy) % 3 === 0) rect(ctx, x + 8, 174 - h + 8 + wy, 6, 6, '#ffe9a8');
          if ((i + wy) % 4 === 0) rect(ctx, x + 26, 174 - h + 8 + wy, 6, 6, '#ffd98a');
        }
      });
      break;

    case 'arboretum':
      // the Capitol Columns standing in the meadow
      tile(ctx, camX, 260, 0.3, (x) => {
        rect(ctx, x + 20, 76, 150, 6, '#e8e0cc');
        for (let i = 0; i < 6; i++) {
          rect(ctx, x + 30 + i * 24, 82, 10, 90, '#efe8d6');
          rect(ctx, x + 28 + i * 24, 82, 14, 5, '#e0d8c0');
        }
      });
      tile(ctx, camX, 110, 0.6, (x) => {
        rect(ctx, x + 30, 148, 6, 26, '#5a4230');
        rect(ctx, x + 16, 126, 34, 24, '#4f9a4a');
        rect(ctx, x + 24, 118, 20, 10, '#63b55a');
      });
      break;

    case 'germany':
      // The Wuppertal Schwebebahn: a steel track on A-frames with the carriage
      // hanging underneath it, running above the river.
      // Kept high above the rooflines, so the carriage clears the
      // half-timbered houses that are drawn in front of it.
      tile(ctx, camX, 240, 0.18, (x) => {
        for (const bx of [x + 16, x + 150]) {          // supporting A-frames
          ctx.strokeStyle = '#4f6f5a';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(bx, 168); ctx.lineTo(bx + 20, 48);
          ctx.moveTo(bx + 40, 168); ctx.lineTo(bx + 20, 48);
          ctx.stroke();
        }
        rect(ctx, x, 44, 200, 7, '#4f6f5a');            // the track beam
        rect(ctx, x, 42, 200, 2, '#6d8f78');

        // the carriage, hanging underneath
        const cx = x + 62;
        rect(ctx, cx + 28, 51, 4, 8, '#3f5a48');        // the arm it hangs from
        rect(ctx, cx, 59, 64, 22, '#eef2f5');
        rect(ctx, cx, 59, 64, 5, '#2f6fa8');
        rect(ctx, cx, 76, 64, 5, '#2f6fa8');
        for (let w = 0; w < 5; w++) rect(ctx, cx + 6 + w * 12, 65, 8, 8, '#9fc4dd');
        rect(ctx, cx - 2, 61, 2, 18, '#c8d2d8');
        rect(ctx, cx + 64, 61, 2, 18, '#c8d2d8');
      });
      tile(ctx, camX, 130, 0.5, (x) => {
        rect(ctx, x + 20, 116, 62, 58, '#f2ece0');
        ctx.fillStyle = '#6b4a34';
        ctx.beginPath();
        ctx.moveTo(x + 14, 118); ctx.lineTo(x + 51, 90); ctx.lineTo(x + 88, 118); ctx.fill();
        rect(ctx, x + 20, 134, 62, 4, '#6b4a34');
        rect(ctx, x + 48, 116, 4, 58, '#6b4a34');
        rect(ctx, x + 28, 120, 12, 12, '#ffe9a8');
      });
      break;

    case 'costarica':
      // volcano + jungle canopy
      tile(ctx, camX, 380, 0.2, (x) => {
        ctx.fillStyle = '#6a7d5c';
        ctx.beginPath();
        ctx.moveTo(x, 174); ctx.lineTo(x + 80, 62); ctx.lineTo(x + 160, 174); ctx.fill();
        rect(ctx, x + 66, 62, 28, 6, '#3f4a38');
      });
      tile(ctx, camX, 70, 0.6, (x, i) => {
        rect(ctx, x + 20, 120, 6, 54, '#4a6b3a');
        rect(ctx, x + 4, 100, 40, 22, i % 2 ? '#3f8f4a' : '#4fa055');
        rect(ctx, x + 12, 92, 24, 10, '#5cb55f');
      });
      // hanging vines
      tile(ctx, camX, 46, 0.75, (x, i) => {
        rect(ctx, x, 0, 3, 30 + ((i * 17) % 40), '#3f8f4a');
      });
      break;

    case 'finale':
      // bunting across the sky
      tile(ctx, camX, 40, 0.5, (x, i) => {
        const colours = ['#ff7ba8', '#ffd94a', '#7ad4ff', '#9ce87a'];
        const c = colours[((i % colours.length) + colours.length) % colours.length];
        rect(ctx, x, 30 + (i % 2) * 4, 3, 30, '#ffffff');
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.moveTo(x - 8, 60 + (i % 2) * 4);
        ctx.lineTo(x + 11, 60 + (i % 2) * 4);
        ctx.lineTo(x + 1.5, 78 + (i % 2) * 4);
        ctx.fill();
      });
      break;
  }
}

export function drawGround(ctx, theme, camX, W, H) {
  const [top, body] = grounds[theme] || grounds.dc;
  return { top, body };
}
