/** Shared types for the /playground arcade game. */

export type Brick = {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Client/product name shown on the brick. */
  label: string;
  /** Hits remaining. Bricks worth more take two. */
  hp: number;
  maxHp: number;
};

export type Burst = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Remaining life, 1 → 0. */
  life: number;
  size: number;
};

export type Status = "ready" | "playing" | "won" | "lost";

export type GameState = {
  status: Status;
  paddleX: number;
  ballX: number;
  ballY: number;
  ballVx: number;
  ballVy: number;
  bricks: Brick[];
  bursts: Burst[];
  score: number;
  combo: number;
  bestCombo: number;
  lives: number;
  timeLeft: number;
  /** Decaying screen-shake magnitude, in world units. */
  shake: number;
};

/**
 * Fixed logical play area. All physics runs in these units and the renderer
 * scales to whatever the canvas actually is, so behaviour is identical on a
 * 1440px monitor and a 390px phone. Resolution-dependent physics is how you end
 * up with a game that is unplayably fast on one machine.
 */
export const WORLD = { w: 1000, h: 620 } as const;

export const PADDLE = { w: 150, h: 14, y: 580, speed: 900 } as const;
export const BALL = { r: 9, speed: 560, maxSpeed: 900 } as const;

/** Seconds per physics step. Small enough that the ball cannot tunnel a brick. */
export const STEP = 1 / 120;

export const ROUND_SECONDS = 60;
export const STARTING_LIVES = 3;
