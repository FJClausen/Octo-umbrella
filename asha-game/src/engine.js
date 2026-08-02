// ---------------------------------------------------------------------------
// THE GAME ENGINE
//
// Deliberately forgiving:
//   * coyote time -- you can still jump for a moment after walking off an edge
//   * jump buffering -- pressing jump just before landing still jumps
//   * a narrow body but a wide landing check, so near-misses count as landings
//   * no enemies, no timers, unlimited retries
// ---------------------------------------------------------------------------

import { GROUND_Y, DEATH_Y, drawBackground, drawGround } from './levels.js';
import { drawSprite, drawShadow } from './sprites.js';

// The world window, in game pixels. Kept small on purpose: the smaller this
// is, the bigger Asha appears on a phone screen. 220 across still shows about
// one and a half jumps ahead of her, which is enough to read what is coming.
export const VW = 220;
export const VH = 150;

const GRAVITY = 900;
const RUN_SPEED = 118;
const JUMP_V = 335;
const COYOTE = 0.12;
const BUFFER = 0.16;
const BODY_W = 8;
const BODY_H = 16;

export class Game {
  constructor(level, hooks = {}) {
    this.level = level;
    this.hooks = hooks;
    this.t = 0;
    this.camX = 0;
    this.paused = false;
    this.respawn = { x: level.start.x, y: level.start.y };
    this.player = {
      x: level.start.x, y: level.start.y,
      vx: 0, vy: 0,
      onGround: true, faceLeft: false,
      coyote: 0, buffer: 0, animT: 0,
      dead: false, deadT: 0,
    };
    this.hearts = 0;
  }

  setRespawn(x, y) {
    this.respawn = { x, y };
  }

  kill() {
    if (this.player.dead) return;
    this.player.dead = true;
    this.player.deadT = 0;
    this.hooks.onDeath && this.hooks.onDeath();
  }

  // All solid surfaces for this frame, including moving platforms.
  surfaces() {
    return this.level.platforms.concat(this.level.movers);
  }

  update(dt, input) {
    this.t += dt;
    const p = this.player;

    // Moving platforms drift on a sine wave; remember how far they moved so a
    // rider can be carried along with them.
    for (const m of this.level.movers) {
      const prev = m.x;
      m.x = m.x0 + Math.sin(this.t * (m.speed / m.range) + m.phase) * m.range;
      m.dx = m.x - prev;
    }

    if (this.paused) return;

    if (p.dead) {
      p.deadT += dt;
      p.y += 60 * dt;
      if (p.deadT > 0.55) {
        p.x = this.respawn.x;
        p.y = this.respawn.y;
        p.vx = 0; p.vy = 0;
        p.dead = false;
        p.onGround = true;
      }
      return;
    }

    // --- horizontal ---
    let dir = 0;
    if (input.left) dir -= 1;
    if (input.right) dir += 1;
    p.vx = dir * RUN_SPEED;
    if (dir !== 0) p.faceLeft = dir < 0;

    p.x += p.vx * dt;
    p.x = Math.max(4, Math.min(this.level.length - 4, p.x));

    // Walls. Solid ground blocks stop her instead of letting her slide into
    // the face of a ledge -- but if her feet are near the top of that ledge
    // she gets pulled up onto it instead. That "almost made it" rescue is the
    // single kindest thing in the game.
    for (const s of this.level.platforms) {
      if (!s.solid) continue;
      const insideX = p.x + BODY_W / 2 > s.x && p.x - BODY_W / 2 < s.x + s.w;
      const insideY = p.y > s.y + 2 && p.y - BODY_H < s.y + s.h;
      if (!insideX || !insideY) continue;

      if (p.vy >= 0 && p.y - s.y < 14) {
        p.y = s.y;          // ledge rescue
        p.vy = 0;
        p.onGround = true;
      } else if (p.vx > 0) {
        p.x = s.x - BODY_W / 2;
      } else if (p.vx < 0) {
        p.x = s.x + s.w + BODY_W / 2;
      }
    }

    // --- jumping ---
    p.coyote = p.onGround ? COYOTE : Math.max(0, p.coyote - dt);
    p.buffer = input.jump ? BUFFER : Math.max(0, p.buffer - dt);

    if (p.buffer > 0 && p.coyote > 0) {
      p.vy = -JUMP_V;
      p.onGround = false;
      p.coyote = 0;
      p.buffer = 0;
      this.hooks.onJump && this.hooks.onJump();
    }

    // Releasing jump early gives a shorter hop, but never a useless one: even
    // the quickest tap still clears a standard gap (about 50px across).
    if (!input.jump && p.vy < -190) p.vy = -190;

    // --- vertical + landing ---
    p.vy += GRAVITY * dt;
    const prevBottom = p.y;
    p.y += p.vy * dt;

    p.onGround = false;
    if (p.vy >= 0) {
      for (const s of this.surfaces()) {
        const overlapX = p.x + BODY_W / 2 > s.x && p.x - BODY_W / 2 < s.x + s.w;
        const crossed = prevBottom <= s.y + 1 && p.y >= s.y;
        if (overlapX && crossed) {
          p.y = s.y;
          p.vy = 0;
          p.onGround = true;
          if (s.dx) p.x += s.dx; // ride the moving platform
          break;
        }
      }
    }

    if (p.y > DEATH_Y) this.kill();

    // --- collectibles ---
    for (const h of this.level.hearts) {
      if (h.taken) continue;
      if (Math.abs(h.x - p.x) < 12 && Math.abs(h.y - (p.y - 8)) < 14) {
        h.taken = true;
        this.hearts++;
        this.hooks.onHeart && this.hooks.onHeart(this.hearts);
      }
    }

    // --- checkpoints ---
    for (const c of this.level.checkpoints) {
      if (!c.reached && p.x >= c.x) {
        c.reached = true;
        this.setRespawn(c.x, c.y);
        this.paused = true;
        this.hooks.onCheckpoint && this.hooks.onCheckpoint(c);
        return;
      }
    }

    // --- goal ---
    if (this.level.goal && p.x >= this.level.goal.x && !this.goalHit) {
      this.goalHit = true;
      this.paused = true;
      this.hooks.onGoal && this.hooks.onGoal();
      return;
    }

    // --- animation + camera ---
    p.animT += Math.abs(p.vx) * dt;
    const view = this.viewW || VW;
    const target = Math.max(0, Math.min(this.level.length - view, p.x - view * 0.38));
    this.camX += (target - this.camX) * Math.min(1, dt * 6);
  }

  frameName() {
    const p = this.player;
    if (!p.onGround) return 'jump';
    if (Math.abs(p.vx) < 1) return 'stand';
    return Math.floor(p.animT / 14) % 2 ? 'walkA' : 'walkB';
  }

  draw(ctx) {
    // The canvas grows to fill whatever phone it lands on, so the view size is
    // read fresh each frame. The ground is parked at 74% down the screen,
    // which leaves room for scenery above and reads well in portrait.
    const viewW = ctx.canvas.width;
    const viewH = ctx.canvas.height;
    const camY = GROUND_Y - Math.round(viewH * 0.74);
    const cam = Math.round(this.camX);

    // Scenery is drawn smaller than world scale, which pushes it into the
    // distance and stops the monuments and palm trees from swallowing the
    // screen now that the camera sits close to Asha.
    const BG = 0.6;
    ctx.save();
    ctx.translate(0, -camY + GROUND_Y);
    ctx.scale(BG, BG);
    // +26 lines the scenery's feet up with the ground line: the painters draw
    // their horizon at y=174, and shrinking them would otherwise leave them
    // hovering above the grass.
    ctx.translate(0, -GROUND_Y + 26);
    drawBackground(ctx, this.level.theme, cam, this.t, viewW / BG, viewH / BG);
    ctx.restore();

    ctx.save();
    ctx.translate(-cam, -camY);

    const { top, body } = drawGround(ctx, this.level.theme);

    // platforms
    for (const s of this.level.platforms) {
      ctx.fillStyle = body;
      ctx.fillRect(Math.round(s.x), Math.round(s.y), s.w, s.h);
      ctx.fillStyle = top;
      ctx.fillRect(Math.round(s.x), Math.round(s.y), s.w, 4);
    }
    for (const m of this.level.movers) {
      ctx.fillStyle = '#6b5a48';
      ctx.fillRect(Math.round(m.x), Math.round(m.y), m.w, m.h);
      ctx.fillStyle = '#a0846a';
      ctx.fillRect(Math.round(m.x), Math.round(m.y), m.w, 3);
    }

    // hearts
    for (const h of this.level.hearts) {
      if (h.taken) continue;
      const bob = Math.sin(this.t * 3 + h.x) * 3;
      drawHeart(ctx, h.x, h.y + bob);
    }

    // checkpoints -- a little flag, gold once its question is answered
    for (const c of this.level.checkpoints) {
      const lit = c.answered;
      ctx.fillStyle = '#5b4a3a';
      ctx.fillRect(Math.round(c.x), c.y - 34, 3, 34);
      ctx.fillStyle = lit ? '#ffd94a' : '#c9c9c9';
      ctx.beginPath();
      ctx.moveTo(c.x + 3, c.y - 34);
      ctx.lineTo(c.x + 22, c.y - 28);
      ctx.lineTo(c.x + 3, c.y - 22);
      ctx.fill();
    }

    // goal -- a glowing doorway
    if (this.level.goal) {
      const gx = this.level.goal.x;
      const gy = this.level.goal.y;
      const pulse = 0.6 + 0.4 * Math.sin(this.t * 3);
      ctx.globalAlpha = pulse;
      ctx.fillStyle = '#fff3b0';
      ctx.fillRect(gx - 14, gy - 44, 28, 44);
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#ffd94a';
      ctx.fillRect(gx - 14, gy - 44, 28, 3);
      ctx.fillRect(gx - 14, gy - 44, 3, 44);
      ctx.fillRect(gx + 11, gy - 44, 3, 44);
    }

    // the family, waiting at the end of the last level
    if (this.level.family) {
      const f = this.level.family;
      drawShadow(ctx, f.x - 16, f.y);
      drawShadow(ctx, f.x + 10, f.y);
      const bobA = Math.sin(this.t * 4) * 1.5;
      const bobB = Math.sin(this.t * 4 + 1) * 1.5;
      drawSprite(ctx, 'fabian', 'stand', f.x + 14, f.y + bobA, true);
      drawSprite(ctx, 'naomi', 'stand', f.x - 12, f.y + bobB, true);
    }

    // the player
    const p = this.player;
    if (!p.dead) {
      if (p.onGround) drawShadow(ctx, p.x, p.y);
      drawSprite(ctx, 'asha', this.frameName(), p.x, p.y, p.faceLeft);
    } else {
      ctx.globalAlpha = 0.5;
      drawSprite(ctx, 'asha', 'jump', p.x, p.y, p.faceLeft);
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }
}

function drawHeart(ctx, x, y) {
  ctx.fillStyle = '#ff6b95';
  const px = (a, b) => ctx.fillRect(Math.round(x + a), Math.round(y + b), 2, 2);
  px(-4, -4); px(-2, -6); px(0, -4); px(2, -6); px(4, -4);
  px(-4, -2); px(-2, -2); px(0, -2); px(2, -2); px(4, -2);
  px(-2, 0); px(0, 0); px(2, 0);
  px(0, 2);
}
