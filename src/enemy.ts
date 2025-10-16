import * as PIXI from 'pixi.js';
import { ENEMY_SPEED, GAME_HEIGHT, GAME_WIDTH } from './utils/consts';

// --- CLASSE DO INIMIGO (MONSTRO) ---
export class Inimigo extends PIXI.Container {
    private body: PIXI.Graphics;
    private eyeLeft: PIXI.Graphics;
    private eyeRight: PIXI.Graphics;
    private mouth: PIXI.Graphics;

    // movimento
    private baseSpeed = ENEMY_SPEED;
    private wanderTarget = { x: 0, y: 0 };
    private wanderTimer = 0;

    // comportamento de perseguição
    private detectingRadius = 220; // quando detecta o vagalume

    constructor(x: number, y: number) {
        super();
        this.x = x;
        this.y = y;

        // corpo arredondado (monstro)
        this.body = new PIXI.Graphics();
        this.addChild(this.body);

        // olhos e boca como filhos para animar
        this.eyeLeft = new PIXI.Graphics(); this.addChild(this.eyeLeft);
        this.eyeRight = new PIXI.Graphics(); this.addChild(this.eyeRight);
        this.mouth = new PIXI.Graphics(); this.addChild(this.mouth);

        this.drawAppearance();
        this.setRandomWander();
    }

    private drawAppearance() {
        this.body.clear();
        // corpo com "pele" levemente texturizada por sobreposições
        this.body.beginFill(0x8B1C1C);
        this.body.drawRoundedRect(-18, -14, 36, 28, 8);
        this.body.endFill();

        // sombras/realce
        this.body.beginFill(0x5E0F0F, 0.15);
        this.body.drawRoundedRect(-18, -14, 36, 28, 8);
        this.body.endFill();

        // olhos (branco)
        this.eyeLeft.clear();
        this.eyeLeft.beginFill(0xFFFFFF);
        this.eyeLeft.drawCircle(-7, -5, 4);
        this.eyeLeft.endFill();
        this.eyeLeft.beginFill(0x111111);
        this.eyeLeft.drawCircle(-7, -5, 1.6);
        this.eyeLeft.endFill();

        this.eyeRight.clear();
        this.eyeRight.beginFill(0xFFFFFF);
        this.eyeRight.drawCircle(6, -5, 4);
        this.eyeRight.endFill();
        this.eyeRight.beginFill(0x111111);
        this.eyeRight.drawCircle(6, -5, 1.6);
        this.eyeRight.endFill();

        // boca com dentes simples
        this.mouth.clear();
        this.mouth.beginFill(0x000000);
        this.mouth.drawRect(-8, 2, 16, 6);
        this.mouth.endFill();

        // dentes
        this.mouth.beginFill(0xFFFFFF);
        this.mouth.drawRect(-7, 2, 3, 3);
        this.mouth.drawRect(-1, 2, 3, 3);
        this.mouth.drawRect(5, 2, 3, 3);
        this.mouth.endFill();
    }

    private setRandomWander() {
        this.wanderTarget.x = Math.random() * GAME_WIDTH;
        this.wanderTarget.y = Math.random() * GAME_HEIGHT;
        this.wanderTimer = 120 + Math.random() * 180;
    }

    // delta em frames (PIXI ticker delta)
    update(delta: number, difficultyMultiplier: number = 1, playerX?: number, playerY?: number) {
        // reduzir timer
        this.wanderTimer -= delta;
        const speed = this.baseSpeed * difficultyMultiplier * delta;

        // Se o player existe e está dentro do raio de detecção -> perseguição
        if (typeof playerX === 'number' && typeof playerY === 'number') {
            const dx = playerX - this.x;
            const dy = playerY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.detectingRadius) {
                // mover na direção do player (seek)
                const nx = dx / (dist || 1);
                const ny = dy / (dist || 1);
                this.x += nx * speed * 1.35; // perseguir um pouco mais rápido
                this.y += ny * speed * 1.35;

                // olhar para o player (olhos levemente direcionados)
                this.eyeLeft.x = -7 + nx * 3;
                this.eyeLeft.y = -5 + ny * 2;
                this.eyeRight.x = 6 + nx * 3;
                this.eyeRight.y = -5 + ny * 2;

                // boca abre mais quando perto
                this.mouth.y = 2;
                this.mouth.scale.y = (dist < 60) ? 1.4 : 1;
                return;
            }
        }

        // comportamento de wander se não está perseguindo
        if (this.wanderTimer <= 0) {
            this.setRandomWander();
        } else {
            // mover em direção ao wanderTarget
            const dxw = this.wanderTarget.x - this.x;
            const dyw = this.wanderTarget.y - this.y;
            const distw = Math.sqrt(dxw * dxw + dyw * dyw);
            if (distw > 4) {
                this.x += (dxw / distw) * speed * (0.6 + Math.random() * 0.6);
                this.y += (dyw / distw) * speed * (0.6 + Math.random() * 0.6);
            } else {
                this.setRandomWander();
            }
        }
    }
}