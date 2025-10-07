import * as PIXI from 'pixi.js';
import { ENEMY_SPEED, GAME_HEIGHT, GAME_WIDTH } from './utils/consts';

// --- CLASSE DO INIMIGO (NOVA) ---
export class Inimigo extends PIXI.Graphics {
    private speed = ENEMY_SPEED;

    // Novas propriedades para a IA de estados
    private state: 'idle' | 'moving' = 'idle';
    private stateTimer = 0; // Temporizador para mudar de estado
    private targetX = 0;
    private targetY = 0;

    constructor(x: number, y: number) {
        super();
        this.x = x;
        this.y = y;

        this.beginFill(0xFF0000);
        this.drawRect(-10, -10, 20, 20);
        this.endFill();

        // Inicia o primeiro estado
        this.chooseNewState();
    }

    // Função que decide o próximo estado do inimigo
    private chooseNewState() {
        if (this.state === 'idle') {
            // Se estava parado, agora vai se mover
            this.state = 'moving';
            // Define um novo alvo aleatório na tela
            this.targetX = Math.random() * GAME_WIDTH;
            this.targetY = Math.random() * GAME_HEIGHT;
            // Define por quanto tempo ele vai se mover (entre 2 e 4 segundos)
            this.stateTimer = 120 + Math.random() * 120; // 120 frames = 2s a 60fps
        } else {
            // Se estava se movendo, agora vai parar
            this.state = 'idle';
            // Define por quanto tempo ele vai ficar parado (entre 1 e 3 segundos)
            this.stateTimer = 60 + Math.random() * 120;
        }
    }

    update(delta: number) {
        // Diminui o temporizador a cada frame
        this.stateTimer -= delta;

        // Se o tempo acabou, escolhe um novo estado
        if (this.stateTimer <= 0) {
            this.chooseNewState();
        }

        // Se o estado atual é 'movendo', executa a lógica de movimento
        if (this.state === 'moving') {
            // Calcula o vetor (direção) para o alvo
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Se ainda não chegou perto do alvo, continue se movendo
            if (distance > 1) {
                const vx = (dx / distance) * this.speed * delta;
                const vy = (dy / distance) * this.speed * delta;
                this.x += vx;
                this.y += vy;
            } else {
                // Se chegou ao alvo, mude para o estado 'idle' imediatamente
                this.stateTimer = 0;
            }
        }
    }
}
