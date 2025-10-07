import * as PIXI from 'pixi.js';

// --- Classe da Flor-Farol ---
export class FlorFarol extends PIXI.Graphics {
    public isLit = false;

    constructor(x: number, y: number) {
        super();
        this.x = x;
        this.y = y;
        this.drawUnlit();
    }

    drawUnlit() {
        this.clear();
        this.beginFill(0x555555); // Cinza escuro para flor apagada
        this.drawCircle(0, 0, 15);
        this.endFill();
    }

    lightUp() {
        this.isLit = true;
        this.clear();
        this.beginFill(0xFFAC33); // Laranja vibrante para flor acesa
        this.drawCircle(0, 0, 15);
        this.endFill();
    }
}