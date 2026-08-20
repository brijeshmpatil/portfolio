import {
  BALL,
  PADDLE,
  ROUND_SECONDS,
  STARTING_LIVES,
  WORLD,
  type Brick,
  type GameState,
} from "./types";

/**
 * Game logic, with no reference to the DOM, canvas or React.
 *
 * Keeping it pure means the loop can be stepped deterministically — the same
 * inputs always produce the same frame — which is the only practical way to
 * debug a physics bug. The renderer is a separate concern that only reads state.
 */

/** Brick labels: the production applications, shortened to fit. */
const LABELS = [
  "Synchro",
  "AdaptHealth",
  "StorkPump",
  "10X Health",
  "Stickers",
  "Glovida",
  "Chamelo",
  "Heal + Co.",
  "SNS",
  "Jatai",
  "Chill",
] as const;

const COLUMNS = 6;
const BRICK_H = 38;
const GAP = 10;
const TOP = 90;

function buildBricks(): Brick[] {
  const usable = WORLD.w - 40 * 2;
  const brickW = (usable - GAP * (COLUMNS - 1)) / COLUMNS;

  return LABELS.map((label, i) => {
    const row = Math.floor(i / COLUMNS);
    const col = i % COLUMNS;
    const inRow = Math.min(COLUMNS, LABELS.length - row * COLUMNS);
    // Centre a short final row rather than leaving it hanging left.
    const rowWidth = inRow * brickW + (inRow - 1) * GAP;
    const originX = (WORLD.w - rowWidth) / 2;

    return {
      x: originX + col * (brickW + GAP),
      y: TOP + row * (BRICK_H + GAP),
      w: brickW,
      h: BRICK_H,
      label,
      // Back row takes two hits, so clearing is not uniform.
      hp: row === 0 ? 2 : 1,
      maxHp: row === 0 ? 2 : 1,
    };
  });
}

export function createState(): GameState {
  return {
    status: "ready",
    paddleX: WORLD.w / 2,
    ballX: WORLD.w / 2,
    ballY: PADDLE.y - BALL.r - 2,
    ballVx: 0,
    ballVy: 0,
    bricks: buildBricks(),
    bursts: [],
    score: 0,
    combo: 0,
    bestCombo: 0,
    lives: STARTING_LIVES,
    timeLeft: ROUND_SECONDS,
    shake: 0,
  };
}

/** Sends the ball off the paddle at a slight angle so play is never symmetric. */
export function launch(state: GameState): void {
  if (state.status !== "ready") return;
  const drift = (Math.random() - 0.5) * 0.5;
  const angle = -Math.PI / 2 + drift;
  state.ballVx = Math.cos(angle) * BALL.speed;
  state.ballVy = Math.sin(angle) * BALL.speed;
  state.status = "playing";
}

/** A restart is a clean slate; nothing carries over except the stored best score. */
export function restart(): GameState {
  return createState();
}

function spawnBurst(state: GameState, x: number, y: number, count: number): void {
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 60 + Math.random() * 260;
    state.bursts.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      size: 1.5 + Math.random() * 3,
    });
  }

  // Hard cap: a long combo can otherwise accumulate thousands of particles and
  // the frame time climbs where the player least wants it to.
  if (state.bursts.length > 900) state.bursts.splice(0, state.bursts.length - 900);
}

function resetBall(state: GameState): void {
  state.ballX = state.paddleX;
  state.ballY = PADDLE.y - BALL.r - 2;
  state.ballVx = 0;
  state.ballVy = 0;
  state.combo = 0;
  state.status = "ready";
}

/** Circle-vs-AABB overlap resolved on the shallower axis. */
function hitBrick(state: GameState, brick: Brick): boolean {
  const nearestX = Math.max(brick.x, Math.min(state.ballX, brick.x + brick.w));
  const nearestY = Math.max(brick.y, Math.min(state.ballY, brick.y + brick.h));
  const dx = state.ballX - nearestX;
  const dy = state.ballY - nearestY;

  if (dx * dx + dy * dy > BALL.r * BALL.r) return false;

  // Reflect on whichever axis the ball penetrated least — reflecting on both, or
  // on the wrong one, is what makes a ball appear to pass through a brick.
  const overlapX = BALL.r - Math.abs(dx);
  const overlapY = BALL.r - Math.abs(dy);

  if (overlapX < overlapY) {
    state.ballVx = -state.ballVx;
    state.ballX += dx >= 0 ? overlapX : -overlapX;
  } else {
    state.ballVy = -state.ballVy;
    state.ballY += dy >= 0 ? overlapY : -overlapY;
  }

  return true;
}

export type StepInput = {
  /** -1, 0 or 1 from the keyboard. */
  readonly keyDir: number;
  /** Target paddle centre in world units, or null when the pointer is unused. */
  readonly pointerX: number | null;
};

/**
 * Advances one fixed timestep. Mutates `state` deliberately: this runs up to 120
 * times a second and allocating a new state object each time would create
 * garbage-collection pauses in the middle of play.
 */
export function step(state: GameState, input: StepInput, dt: number): void {
  // Bursts keep animating on the end screens; nothing else does.
  for (let i = state.bursts.length - 1; i >= 0; i -= 1) {
    const burst = state.bursts[i];
    burst.x += burst.vx * dt;
    burst.y += burst.vy * dt;
    burst.vy += 420 * dt; // gravity
    burst.vx *= 0.985;
    burst.life -= dt * 1.5;
    if (burst.life <= 0) state.bursts.splice(i, 1);
  }

  state.shake = Math.max(0, state.shake - dt * 40);

  if (state.status === "won" || state.status === "lost") return;

  // Paddle: pointer wins when present, keyboard otherwise.
  if (input.pointerX !== null) {
    state.paddleX = input.pointerX;
  } else if (input.keyDir !== 0) {
    state.paddleX += input.keyDir * PADDLE.speed * dt;
  }
  const half = PADDLE.w / 2;
  state.paddleX = Math.max(half, Math.min(WORLD.w - half, state.paddleX));

  if (state.status === "ready") {
    // Ball rides the paddle until launch.
    state.ballX = state.paddleX;
    return;
  }

  state.timeLeft -= dt;
  if (state.timeLeft <= 0) {
    state.timeLeft = 0;
    state.status = "lost";
    return;
  }

  state.ballX += state.ballVx * dt;
  state.ballY += state.ballVy * dt;

  // Walls
  if (state.ballX < BALL.r) {
    state.ballX = BALL.r;
    state.ballVx = Math.abs(state.ballVx);
  } else if (state.ballX > WORLD.w - BALL.r) {
    state.ballX = WORLD.w - BALL.r;
    state.ballVx = -Math.abs(state.ballVx);
  }

  if (state.ballY < BALL.r) {
    state.ballY = BALL.r;
    state.ballVy = Math.abs(state.ballVy);
  }

  // Paddle: contact angle depends on where it lands, so the player steers.
  const paddleTop = PADDLE.y;
  if (
    state.ballVy > 0 &&
    state.ballY + BALL.r >= paddleTop &&
    state.ballY - BALL.r <= paddleTop + PADDLE.h &&
    state.ballX >= state.paddleX - half - BALL.r &&
    state.ballX <= state.paddleX + half + BALL.r
  ) {
    const offset = (state.ballX - state.paddleX) / half; // -1 … 1
    const angle = -Math.PI / 2 + offset * 1.05;
    const speed = Math.min(
      BALL.maxSpeed,
      Math.hypot(state.ballVx, state.ballVy) * 1.015,
    );
    state.ballVx = Math.cos(angle) * speed;
    state.ballVy = Math.sin(angle) * speed;
    state.ballY = paddleTop - BALL.r - 0.5;
    // Combo counts brick hits between paddle touches, so it rewards keeping the
    // ball up top rather than just hitting a lot of bricks.
    state.combo = 0;
  }

  // Bricks
  for (let i = state.bricks.length - 1; i >= 0; i -= 1) {
    const brick = state.bricks[i];
    if (!hitBrick(state, brick)) continue;

    brick.hp -= 1;
    state.combo += 1;
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    state.shake = Math.min(14, state.shake + 5);

    if (brick.hp <= 0) {
      state.score += 100 * Math.max(1, state.combo);
      spawnBurst(state, brick.x + brick.w / 2, brick.y + brick.h / 2, 26);
      state.bricks.splice(i, 1);
    } else {
      state.score += 25;
      spawnBurst(state, state.ballX, state.ballY, 8);
    }

    // One brick per step: resolving several at once produces nonsense reflections.
    break;
  }

  if (state.bricks.length === 0) {
    // Time bonus, so clearing fast is worth more than clearing safely.
    state.score += Math.round(state.timeLeft) * 50;
    state.status = "won";
    return;
  }

  // Lost ball
  if (state.ballY - BALL.r > WORLD.h) {
    state.lives -= 1;
    if (state.lives <= 0) {
      state.status = "lost";
    } else {
      resetBall(state);
    }
  }
}
