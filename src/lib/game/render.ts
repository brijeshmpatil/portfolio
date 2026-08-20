import { BALL, PADDLE, WORLD, type GameState } from "./types";

/**
 * Draws a frame. Reads state, never writes it.
 *
 * Colours are hardcoded hex rather than read from CSS custom properties: this
 * runs every frame, and `getComputedStyle` forces a style recalculation. They
 * are the same values as the design tokens in globals.css.
 */

const INK = "#edede9";
const FAINT = "#767f88";
const LINE = "#2c333a";
const SIGNAL = "#ffae35";
const BASE = "#0d0f11";

export function render(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  width: number,
  height: number,
  dpr: number,
): void {
  const scale = Math.min(width / WORLD.w, height / WORLD.h);
  const offsetX = (width - WORLD.w * scale) / 2;
  const offsetY = (height - WORLD.h * scale) / 2;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  // Screen shake, applied as a whole-scene offset so nothing has to know about it.
  const shakeX = state.shake > 0 ? (Math.random() - 0.5) * state.shake : 0;
  const shakeY = state.shake > 0 ? (Math.random() - 0.5) * state.shake : 0;

  ctx.translate(offsetX + shakeX, offsetY + shakeY);
  ctx.scale(scale, scale);

  // Court
  ctx.fillStyle = BASE;
  ctx.fillRect(0, 0, WORLD.w, WORLD.h);
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, WORLD.w - 2, WORLD.h - 2);

  // Bricks
  ctx.font = "600 15px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (const brick of state.bricks) {
    const tough = brick.maxHp > 1 && brick.hp > 1;
    ctx.fillStyle = tough ? "#3a2f1c" : "#1d2227";
    ctx.fillRect(brick.x, brick.y, brick.w, brick.h);

    ctx.strokeStyle = tough ? SIGNAL : LINE;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(brick.x + 0.75, brick.y + 0.75, brick.w - 1.5, brick.h - 1.5);

    ctx.fillStyle = tough ? SIGNAL : FAINT;
    ctx.fillText(brick.label, brick.x + brick.w / 2, brick.y + brick.h / 2 + 1);
  }

  // Bursts, drawn additively so overlapping particles build up like the hero
  ctx.globalCompositeOperation = "lighter";
  for (const burst of state.bursts) {
    ctx.globalAlpha = Math.max(0, burst.life) * 0.7;
    ctx.fillStyle = SIGNAL;
    ctx.beginPath();
    ctx.arc(burst.x, burst.y, burst.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";

  // Paddle
  const half = PADDLE.w / 2;
  ctx.fillStyle = INK;
  ctx.fillRect(state.paddleX - half, PADDLE.y, PADDLE.w, PADDLE.h);
  ctx.fillStyle = SIGNAL;
  ctx.fillRect(state.paddleX - 14, PADDLE.y, 28, PADDLE.h);

  // Ball, with a soft halo
  ctx.beginPath();
  ctx.arc(state.ballX, state.ballY, BALL.r * 2.6, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 174, 53, 0.13)";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(state.ballX, state.ballY, BALL.r, 0, Math.PI * 2);
  ctx.fillStyle = SIGNAL;
  ctx.fill();

  // Aim guide before launch, so the first shot is not blind
  if (state.status === "ready") {
    ctx.strokeStyle = "rgba(255, 174, 53, 0.3)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.moveTo(state.ballX, state.ballY);
    ctx.lineTo(state.ballX, state.ballY - 90);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Combo readout, floating near the ball while a run is building
  if (state.combo > 1 && state.status === "playing") {
    ctx.font = "700 26px ui-monospace, monospace";
    ctx.fillStyle = SIGNAL;
    ctx.fillText(`×${state.combo}`, state.ballX, state.ballY - 34);
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
