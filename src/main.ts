import * as PIXI from 'pixi.js';
import { Vagalume } from './vagalume';
import { FlorFarol } from './flor-farol';
import { Polen } from './polen';
import { ENEMY_COUNT, ENEMY_LIGHT_PENALTY, FLOWER_LIGHT_COST, GAME_HEIGHT, GAME_WIDTH, LIGHT_DECAY_RATE, PLAYER_SPEED, POLLEN_COUNT, POLLEN_LIGHT_VALUE } from './utils/consts';
import { Inimigo } from './enemy';

const keyboard: { [key: string]: boolean } = {};
window.addEventListener('keydown', (e) => { keyboard[e.code] = true; });
window.addEventListener('keyup', (e) => { keyboard[e.code] = false; });

// --- Classe Principal do Jogo - ATUALIZADA ---
class Game {
  private app!: PIXI.Application;
  private player!: Vagalume;
  private pollens: Polen[] = [];
  private flores: FlorFarol[] = [];
  private enemies: Inimigo[] = []; // NOVO: Array para inimigos

  private lightBar!: PIXI.Graphics; private lightBarBg!: PIXI.Graphics;
  private gameState: 'playing' | 'gameOver' | 'win' = 'playing';

  constructor() { this.init(); }

  private async init() {
    this.app = new PIXI.Application();
    await this.app.init({ width: GAME_WIDTH, height: GAME_HEIGHT, backgroundColor: 0x050A18 });
    document.body.appendChild(this.app.view as HTMLCanvasElement);

    // Cria Flores, Pólens e Jogador
    this.flores.push(new FlorFarol(100, 150)); this.flores.push(new FlorFarol(GAME_WIDTH - 100, 300)); this.flores.push(new FlorFarol(400, GAME_HEIGHT - 100));
    this.flores.forEach(flor => this.app.stage.addChild(flor));
    for (let i = 0; i < POLLEN_COUNT; i++) { const polen = new Polen(); this.pollens.push(polen); this.app.stage.addChild(polen); }

    for (let i = 0; i < ENEMY_COUNT; i++) {
      // Cria um inimigo em uma posição aleatória
      const enemy = new Inimigo(
        Math.random() * GAME_WIDTH,
        Math.random() * GAME_HEIGHT
      );
      this.enemies.push(enemy);
      this.app.stage.addChild(enemy);
    }

    this.player = new Vagalume(); this.app.stage.addChild(this.player);
    this.createUI();
    this.app.ticker.add((ticker) => this.gameLoop(ticker.deltaTime));
  }

  private createUI() { /* ...código da UI permanece o mesmo... */
    const barWidth = 200, barHeight = 20; this.lightBarBg = new PIXI.Graphics(); this.lightBarBg.beginFill(0x333333).drawRect(0, 0, barWidth, barHeight).endFill(); this.lightBarBg.x = GAME_WIDTH / 2 - barWidth / 2; this.lightBarBg.y = 20; this.lightBar = new PIXI.Graphics(); this.lightBar.beginFill(0xFFFF00).drawRect(0, 0, barWidth, barHeight).endFill(); this.lightBar.x = GAME_WIDTH / 2 - barWidth / 2; this.lightBar.y = 20; this.app.stage.addChild(this.lightBarBg, this.lightBar);
  }
  private updateUI() { this.lightBar.width = 200 * (this.player.light / 100); }

  private checkInteractions() {
    // Colisão com Pólens
    for (const polen of this.pollens) { /* ...código sem alterações... */
      const dx = this.player.x - polen.x; const dy = this.player.y - polen.y; const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < this.player.width / 2 + polen.width / 2) { this.player.gainLight(POLLEN_LIGHT_VALUE); polen.randomizePosition(); }
    }
    // Interação com Flores-Farol
    for (const flor of this.flores) { /* ...código sem alterações... */
      if (!flor.isLit) { const dx = this.player.x - flor.x; const dy = this.player.y - flor.y; const distance = Math.sqrt(dx * dx + dy * dy); if (distance < this.player.width / 2 + flor.width / 2 && this.player.light >= 90) { flor.lightUp(); this.player.loseLight(FLOWER_LIGHT_COST); } }
    }

    // NOVO: Colisão com Inimigos
    if (this.player.canBeHit) {
      for (const enemy of this.enemies) {
        const dx = this.player.x - enemy.x;
        const dy = this.player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.player.width / 2 + enemy.width / 2) {
          this.player.loseLight(ENEMY_LIGHT_PENALTY);
          this.player.canBeHit = false; // Desativa a possibilidade de ser atingido

          // Efeito visual simples: piscar
          let blinkCount = 0;
          const blinkInterval = setInterval(() => {
            this.player.visible = !this.player.visible;
            blinkCount++;
            if (blinkCount >= 6) { // Pisca 3 vezes (liga/desliga 6 vezes)
              clearInterval(blinkInterval);
              this.player.visible = true;
              this.player.canBeHit = true; // Reativa a possibilidade de ser atingido
            }
          }, 150); // Pisca a cada 150ms
          break; // Sai do loop para não levar dano de vários inimigos no mesmo frame
        }
      }
    }
  }

  private endGame(isWin: boolean) { /* ...código sem alterações... */
    this.gameState = isWin ? 'win' : 'gameOver';
    const style = new PIXI.TextStyle({ fontFamily: 'Arial', fontSize: 64, fill: '#ffffff', stroke: { color: '#000000', width: 5, join: 'round' }, align: 'center' });
    const messageText = isWin ? 'Você Venceu!' : 'Game Over';
    const message = new PIXI.Text({ text: messageText, style });
    message.x = GAME_WIDTH / 2; message.y = GAME_HEIGHT / 2; message.anchor.set(0.5);
    this.app.stage.addChild(message);
  }

  private gameLoop(delta: number) {
    if (this.gameState === 'playing') {
      // Lógica de Input (sem alterações)
      this.player.vx = 0; this.player.vy = 0; if (keyboard['ArrowUp'] || keyboard['KeyW']) { this.player.vy = -1; } if (keyboard['ArrowDown'] || keyboard['KeyS']) { this.player.vy = 1; } if (keyboard['ArrowLeft'] || keyboard['KeyA']) { this.player.vx = -1; } if (keyboard['ArrowRight'] || keyboard['KeyD']) { this.player.vx = 1; } const len = Math.sqrt(this.player.vx * this.player.vx + this.player.vy * this.player.vy); if (len > 0) { this.player.vx /= len; this.player.vy /= len; } this.player.vx *= PLAYER_SPEED * delta; this.player.vy *= PLAYER_SPEED * delta;

      // --- Lógica do Jogo ---
      this.player.loseLight(LIGHT_DECAY_RATE * delta);
      this.checkInteractions();

      // --- Atualizações ---
      this.player.update();
      this.enemies.forEach(enemy => enemy.update(delta)); // NOVO: Atualiza cada inimigo

      // Checagem de Vitória/Derrota (sem alterações)
      if (this.player.light <= 0) { this.endGame(false); } else if (this.flores.every(flor => flor.isLit)) { this.endGame(true); }
    }
    this.updateUI();
  }
}


// Inicia o jogo
new Game();