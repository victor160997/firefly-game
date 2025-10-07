import * as PIXI from 'pixi.js';
import { GAME_HEIGHT, GAME_WIDTH } from './utils/consts';
// --- Classe do Jogador (Vagalume) ---
export class Vagalume extends PIXI.Graphics {
    public vx: number = 0; public vy: number = 0; public light: number = 100;

    // NOVO: Controle de invencibilidade
    public canBeHit = true;

    constructor() { /* ...código sem alterações... */
        super(); this.beginFill(0xFFFF00); this.drawCircle(0, 0, 10).endFill();
        this.x = GAME_WIDTH / 2; this.y = GAME_HEIGHT / 2;
    }
    update() { /* ...código sem alterações... */
        this.x += this.vx; this.y += this.vy;
        if (this.x < this.width / 2) this.x = this.width / 2;
        if (this.x > GAME_WIDTH - this.width / 2) this.x = GAME_WIDTH - this.width / 2;
        if (this.y < this.height / 2) this.y = this.height / 2;
        if (this.y > GAME_HEIGHT - this.height / 2) this.y = GAME_HEIGHT - this.height / 2;
    }
    loseLight(amount: number) { this.light -= amount; if (this.light < 0) this.light = 0; }
    gainLight(amount: number) { this.light += amount; if (this.light > 100) this.light = 100; }
}