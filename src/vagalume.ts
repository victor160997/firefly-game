import * as PIXI from 'pixi.js';
import { GAME_HEIGHT, GAME_WIDTH, TRAIL_LENGTH, TRAIL_SPACING } from './utils/consts';

export class Vagalume extends PIXI.Container {
    public vx: number = 0;
    public vy: number = 0;
    public light: number = 100;
    public canBeHit = true;

    private body: PIXI.Graphics;
    private leftWing: PIXI.Graphics;
    private rightWing: PIXI.Graphics;
    private wingAngle = 0;
    private wingSpeed = 0.55;
    private static glowTexture: PIXI.Texture;
    private glowSprite: PIXI.Sprite;

    // Trailing
    private trailSprites: PIXI.Sprite[] = [];
    private trailTimer = 0;

    // knockback
    private knockbackVx = 0;
    private knockbackVy = 0;
    private knockbackFriction = 0.88; // Ligeiramente maior atrito para desacelerar o knockback

    constructor() {
        super();
        this.x = GAME_WIDTH / 2;
        this.y = GAME_HEIGHT / 2;

        if (!Vagalume.glowTexture) {
            Vagalume.glowTexture = this.makeGlowTexture(120);
        }

        // Glow central (maior)
        this.glowSprite = new PIXI.Sprite(Vagalume.glowTexture);
        this.glowSprite.anchor.set(0.5);
        this.glowSprite.alpha = 0.85;
        this.glowSprite.scale.set(0.45);
        this.addChild(this.glowSprite);

        // corpo e asas
        this.leftWing = new PIXI.Graphics();
        this.rightWing = new PIXI.Graphics();
        this.addChild(this.leftWing);
        this.addChild(this.rightWing);
        this.body = new PIXI.Graphics();
        this.addChild(this.body);

        // gerar sprites de trail (reutilizáveis)
        for (let i = 0; i < TRAIL_LENGTH; i++) {
            const s = new PIXI.Sprite(Vagalume.glowTexture);
            s.anchor.set(0.5);
            s.alpha = 0;
            s.scale.set(0.3);
            this.trailSprites.push(s);
        }

        this.drawBody();
    }

    // se parent ainda não existia no construtor, inicializa trails depois
    public initTrails(stage: PIXI.Container) {
        // coloca trails no stage atrás do vagalume
        for (const s of this.trailSprites) {
            if (!s.parent) stage.addChildAt(s, 0);
        }
    }

    private makeGlowTexture(size: number): PIXI.Texture {
        const c = document.createElement('canvas');
        c.width = size; c.height = size;
        const ctx = c.getContext('2d')!;
        const cx = size / 2, cy = size / 2;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, size / 2);
        grad.addColorStop(0, 'rgba(255, 255, 160, 1)');
        grad.addColorStop(0.25, 'rgba(255, 230, 110, 0.7)');
        grad.addColorStop(0.6, 'rgba(255, 200, 80, 0.2)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);
        return PIXI.Texture.from(c);
    }

    private drawBody() {
        this.body.clear();
        // abdômen brilhante
        this.body.beginFill(0xFFF7A0);
        this.body.drawEllipse(0, 2, 6, 8);
        this.body.endFill();

        // cabeça
        this.body.beginFill(0x222222);
        this.body.drawCircle(0, -8, 3.5);
        this.body.endFill();
    }

    private updateGlow() {
        const scalePulse = 0.95 + Math.sin(Date.now() * 0.006) * 0.08;
        const lightNormalized = this.light / 100;
        this.glowSprite.alpha = 0.6 + lightNormalized * 0.6;
        this.glowSprite.scale.set((0.4 + lightNormalized * 0.6) * scalePulse);
    }

    private updateWings(delta: number) {
    // incrementa o ângulo continuamente (sin() já gera a oscilação)
    this.wingAngle += delta * this.wingSpeed;
        const wingFlap = Math.sin(this.wingAngle) * 5;
        const wingAlpha = 0.25 + (this.light / 100) * 0.45;

        this.leftWing.clear();
        this.leftWing.beginFill(0xFFFFFF, wingAlpha);
        this.leftWing.moveTo(0, -6);
        this.leftWing.quadraticCurveTo(-15, -25 + wingFlap, -2, -18);
        this.leftWing.quadraticCurveTo(5, -15 + wingFlap, 0, -6);
        this.leftWing.endFill();

        this.rightWing.clear();
        this.rightWing.beginFill(0xFFFFFF, wingAlpha);
        this.rightWing.moveTo(0, -6);
        this.rightWing.quadraticCurveTo(15, -25 + wingFlap, 2, -18);
        this.rightWing.quadraticCurveTo(-5, -15 + wingFlap, 0, -6);
        this.rightWing.endFill();

        this.leftWing.y = this.rightWing.y = wingFlap / 2;
        this.rotation = Math.sin(this.wingAngle * 2) * 0.04;
    }

    // aplica knockback instantâneo (multiplicador de força)
    public applyKnockback(nx: number, ny: number, strength = 6) {
        this.knockbackVx += nx * strength;
        this.knockbackVy += ny * strength;
    }

    public loseLight(amount: number) {
        this.light -= amount;
        if (this.light < 0) this.light = 0;
        this.updateGlow();
    }

    public gainLight(amount: number) {
        this.light += amount;
        if (this.light > 100) this.light = 100;
        this.updateGlow();
    }

    public update(_delta: number) {
        // Aceleração baseada no knockback
        this.vx += this.knockbackVx;
        this.vy += this.knockbackVy;

        // aplica movimento
        this.x += this.vx;
        this.y += this.vy;

        // decaimento do knockback
        this.knockbackVx *= this.knockbackFriction;
        this.knockbackVy *= this.knockbackFriction;

        // manter dentro da tela
        const halfW = 18;
        if (this.x < halfW) this.x = halfW;
        if (this.x > GAME_WIDTH - halfW) this.x = GAME_WIDTH - halfW;
        if (this.y < halfW) this.y = halfW;
        if (this.y > GAME_HEIGHT - halfW) this.y = GAME_HEIGHT - halfW;

        this.updateGlow();
    }

    // anima wings dependentes de deltaframes
    public step(delta: number) {
        this.updateWings(delta);

        // trail update: registrar posição periodicamente e move os sprites
        this.trailTimer++;
        if (this.trailTimer % TRAIL_SPACING === 0) {
            // shift positions
            for (let i = this.trailSprites.length - 1; i > 0; i--) {
                const src = this.trailSprites[i - 1];
                const dst = this.trailSprites[i];
                dst.x = src.x; dst.y = src.y;
                dst.rotation = src.rotation;
                dst.alpha = src.alpha * 0.90; // Decaimento mais suave (0.85 -> 0.90)
                dst.scale.set(src.scale.x * 0.96);
            }
            // primeira recebe posição atual
            const first = this.trailSprites[0];
            first.x = this.x; first.y = this.y;
            first.rotation = this.rotation;
            first.alpha = 0.55 * (this.light / 100);
            // scale proporcional à energia
            const s = 0.35 + (this.light / 100) * 0.6;
            first.scale.set(s);
        } else {
            // suaviza alpha e scale do trail para efeito de fade contínuo
            for (const t of this.trailSprites) {
                t.alpha *= 0.99; // Suavização mais longa (0.98 -> 0.99)
                t.scale.set(t.scale.x * 0.995);
            }
        }
    }
}