import * as PIXI from 'pixi.js';
import { GAME_WIDTH, GAME_HEIGHT } from './utils/consts';

// Pólen com halo radial, leve animação de flutuação
export class Polen extends PIXI.Container {
  private core: PIXI.Graphics;
  private halo: PIXI.Sprite;
  private vx = 0;
  private vy = 0;
  private baseScale = 1 + Math.random() * 0.35;

  constructor() {
    super();
    this.core = new PIXI.Graphics();
    this.addChild(this.core);

    // cria halo com textura radial
    const haloTex = this.makeHaloTexture(48);
    this.halo = new PIXI.Sprite(haloTex);
    this.halo.anchor.set(0.5);
    this.halo.alpha = 0.55;
    this.halo.scale.set(0.6 + Math.random() * 0.6);
    this.addChildAt(this.halo, 0);

    this.drawCore();
    this.randomizePosition();
    this.vx = (Math.random() - 0.5) * 0.4;
    this.vy = -0.05 - Math.random() * 0.2;
  }

  private makeHaloTexture(size: number) {
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d')!;
    const cx = size/2, cy = size/2;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, size/2);
    grad.addColorStop(0, 'rgba(200,245,255,0.95)');
    grad.addColorStop(0.25, 'rgba(200,235,255,0.6)');
    grad.addColorStop(0.6, 'rgba(200,230,240,0.15)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,size,size);
    return PIXI.Texture.from(c);
  }

  private drawCore() {
    this.core.clear();
    // pequeno núcleo brilhante
    this.core.beginFill(0xBFF6FF);
    this.core.drawCircle(0, 0, 6 * this.baseScale);
    this.core.endFill();

    this.core.beginFill(0xE8FFFF, 0.9);
    this.core.drawCircle(0, 0, 3 * this.baseScale);
    this.core.endFill();
  }

  randomizePosition() {
    this.x = 30 + Math.random() * (GAME_WIDTH - 60);
    this.y = 30 + Math.random() * (GAME_HEIGHT - 60);
    this.halo.rotation = Math.random() * Math.PI * 2;
  }

  update(delta: number) {
    // leve flutuação e drift
    this.x += this.vx * delta;
    this.y += this.vy * delta;
    // small horizontal oscillation
    this.x += Math.sin((this.x + this.y) * 0.01) * 0.02 * delta;

    // wrap-around
    if (this.x < -20) this.x = GAME_WIDTH + 20;
    if (this.x > GAME_WIDTH + 20) this.x = -20;
    if (this.y < -20) this.y = GAME_HEIGHT + 20;
    if (this.y > GAME_HEIGHT + 20) this.y = -20;
  }
}