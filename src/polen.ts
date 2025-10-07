import * as PIXI from 'pixi.js';
import { GAME_HEIGHT, GAME_WIDTH } from './utils/consts';

// --- Classe do Pólen ---
export class Polen extends PIXI.Graphics {
    constructor() {
        super();
        this.beginFill(0x87CEEB); // Cor azul celeste (SkyBlue)
        this.drawCircle(0, 0, 5); // Pólen é menor que o jogador
        this.endFill();
        this.randomizePosition();
    }

    randomizePosition() {
        this.x = Math.random() * GAME_WIDTH;
        this.y = Math.random() * GAME_HEIGHT;
    }
}