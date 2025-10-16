import * as PIXI from 'pixi.js';
import { Vagalume } from './vagalume';
import { FlorFarol } from './flor-farol';
import { Polen } from './polen';
import { ENEMY_COUNT, ENEMY_LIGHT_PENALTY, FLOWER_LIGHT_COST, GAME_HEIGHT, GAME_WIDTH, LIGHT_DECAY_RATE, PLAYER_SPEED, POLLEN_COUNT, POLLEN_LIGHT_VALUE } from './utils/consts';
import { Inimigo } from './enemy';

// CLASSE STARFIELD PARA O CÉU REALISTA E DINÂMICO (COM PARALAXE)
class Starfield extends PIXI.Container {
  private stars: PIXI.Graphics[] = [];
  private fieldWidth: number;
  private fieldHeight: number;
  private numStars: number;
  private scrollSpeed: number; // NOVO: Velocidade de rolagem para a camada

  constructor(width: number, height: number, numStars: number, scrollSpeed: number) {
    super();
    this.fieldWidth = width;
    this.fieldHeight = height;
    this.numStars = numStars;
    this.scrollSpeed = scrollSpeed;
    this.createStars();
  }

  private createStars() {
    for (let i = 0; i < this.numStars; i++) {
      const star = new PIXI.Graphics();
      // Tamanho e Alpha dependem da velocidade para simular profundidade
      const size = 0.5 + Math.random() * (1.5 * this.scrollSpeed);
      const alpha = 0.2 + Math.random() * (0.5 * this.scrollSpeed);
      const color = 0xFFFFFF;

      star.beginFill(color, alpha);
      star.drawCircle(0, 0, size / 2);
      star.endFill();

      star.x = Math.random() * this.fieldWidth;
      star.y = Math.random() * this.fieldHeight;
      // Armazenar o movimento horizontal leve para um efeito mais dinâmico
      (star as any).hSpeed = (Math.random() - 0.5) * 0.05 * this.scrollSpeed;

      this.addChild(star);
      this.stars.push(star);
    }
  }

  public update(delta: number) {
    const time = Date.now() * 0.001;
    this.stars.forEach(star => {
      // Pulsação de brilho
      star.alpha = (0.5 + Math.sin(time + star.x * 0.01) * 0.2);
      if (star.alpha > 0.9) star.alpha = 0.9;
      if (star.alpha < 0.2) star.alpha = 0.2;

      // Leve movimento vertical simulando profundidade (paralaxe)
      star.y += (this.scrollSpeed * 0.15) * delta;
      star.x += (star as any).hSpeed * delta;

      // Loop de volta ao topo quando sair da tela
      if (star.y > this.fieldHeight) {
        star.y = 0;
        star.x = Math.random() * this.fieldWidth;
      }
    });
  }
}


const keyboard: { [key: string]: boolean } = {};
window.addEventListener('keydown', (e) => { keyboard[e.code] = true; });
window.addEventListener('keyup', (e) => { keyboard[e.code] = false; });

// --- Classe Principal do Jogo ---
class Game {
  private app!: PIXI.Application;
  private player!: Vagalume;
  private pollens: Polen[] = [];
  private flores: FlorFarol[] = [];
  private enemies: Inimigo[] = [];
  private starfieldFar!: Starfield; // NOVO: Camada de estrelas longe
  private starfieldNear!: Starfield; // NOVO: Camada de estrelas perto

  private lightBar!: PIXI.Graphics;
  private lightBarBg!: PIXI.Graphics;
  private lightBarBorder!: PIXI.Graphics;
  private lightText!: PIXI.Text; // NOVO: Rótulo de texto para o HUD
  private gameState: 'playing' | 'gameOver' | 'win' = 'playing';

  constructor() { this.init(); }

  private async init() {
    this.app = new PIXI.Application();
    await this.app.init({
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      backgroundColor: 0x070B1A
    });
    document.body.appendChild(this.app.view as HTMLCanvasElement);

    // NOVO: Criação de duas camadas de paralaxe
    this.starfieldFar = new Starfield(GAME_WIDTH, GAME_HEIGHT, 100, 0.4);
    this.starfieldNear = new Starfield(GAME_WIDTH, GAME_HEIGHT, 50, 1.0);
    this.app.stage.addChild(this.starfieldFar);
    this.app.stage.addChild(this.starfieldNear);

    // Cria Flores, Pólens e Jogador
    this.flores.push(new FlorFarol(100, 150)); this.flores.push(new FlorFarol(GAME_WIDTH - 100, 300)); this.flores.push(new FlorFarol(400, GAME_HEIGHT - 100));
    this.flores.forEach(flor => this.app.stage.addChild(flor));
    for (let i = 0; i < POLLEN_COUNT; i++) { const polen = new Polen(); this.pollens.push(polen); this.app.stage.addChild(polen); }

    for (let i = 0; i < ENEMY_COUNT; i++) {
      const enemy = new Inimigo(
        Math.random() * GAME_WIDTH,
        Math.random() * GAME_HEIGHT
      );
      this.enemies.push(enemy);
      this.app.stage.addChild(enemy);
    }

    this.player = new Vagalume();
    // Adicionar o jogador (e o Stage) ao initTrails para posicionar os rastros corretamente
    this.app.stage.addChild(this.player);
    this.player.initTrails(this.app.stage);

    this.createUI();
    this.app.ticker.add((ticker) => this.gameLoop(ticker.deltaTime));
  }

  private createUI() {
    const barWidth = 200, barHeight = 20, barPadding = 5;
    const barX = GAME_WIDTH / 2 - barWidth / 2;
    const barY = 20;

    // Fundo cinza escuro
    this.lightBarBg = new PIXI.Graphics();
    this.lightBarBg.beginFill(0x181818).drawRect(0, 0, barWidth, barHeight).endFill();
    this.lightBarBg.x = barX;
    this.lightBarBg.y = barY;

    // Barra de luz (conteúdo dinâmico)
    this.lightBar = new PIXI.Graphics();
    this.lightBar.x = barX;
    this.lightBar.y = barY;

    // Borda para dar profundidade
    this.lightBarBorder = new PIXI.Graphics();
    this.lightBarBorder.lineStyle(2, 0x444444);
    this.lightBarBorder.drawRect(barX, barY, barWidth, barHeight);

    // NOVO: Rótulo de Texto
    const textStyle = new PIXI.TextStyle({
      fontFamily: 'Inter, Arial',
      fontSize: 16,
      fill: '#E8FFFF',
      stroke: { color: '#000000', width: 2, join: 'round' }
    });
    this.lightText = new PIXI.Text({ text: 'Vida: 100', style: textStyle });
    this.lightText.x = GAME_WIDTH / 2;
    this.lightText.y = barY + barHeight + 8; // Abaixo da barra
    this.lightText.anchor.set(0.5, 0);

    this.app.stage.addChild(this.lightBarBg, this.lightBar, this.lightBarBorder, this.lightText);
  }

  private updateUI() {
    const lightNormalized = this.player.light / 100;
    this.lightBar.width = 200 * lightNormalized;

    // Gradiente de cor da barra de vida (verde para amarelo para vermelho)
    let barColor = 0xFFFF00;
    if (lightNormalized > 0.6) {
      barColor = 0x8FBC8F;
    } else if (lightNormalized < 0.3) {
      barColor = 0xFF4500;
    }

    this.lightBar.clear();
    this.lightBar.beginFill(barColor);
    this.lightBar.drawRect(0, 0, 200, 20);
    this.lightBar.endFill();

    this.lightText.text = `Vida: ${Math.round(this.player.light)}`;
  }

  private checkInteractions() {
    // Colisão com Pólens
    for (const polen of this.pollens) {
      const dx = this.player.x - polen.x; const dy = this.player.y - polen.y; const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < this.player.width / 2 + polen.width / 2) { this.player.gainLight(POLLEN_LIGHT_VALUE); polen.randomizePosition(); }
    }
    // Interação com Flores-Farol
    for (const flor of this.flores) {
      if (!flor.isLit) { const dx = this.player.x - flor.x; const dy = this.player.y - flor.y; const distance = Math.sqrt(dx * dx + dy * dy); if (distance < this.player.width / 2 + flor.width / 2 && this.player.light >= 90) { flor.lightUp(); this.player.loseLight(FLOWER_LIGHT_COST); } }
    }

    // Colisão com Inimigos
    if (this.player.canBeHit) {
      for (const enemy of this.enemies) {
        const dx = this.player.x - enemy.x;
        const dy = this.player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.player.width / 2 + enemy.width / 2) {
          this.player.loseLight(ENEMY_LIGHT_PENALTY);
          this.player.canBeHit = false;

          // NOVO: Calcular a direção de afastamento e aplicar Knockback
          const nx = dx / (distance || 1);
          const ny = dy / (distance || 1);
          this.player.applyKnockback(nx, ny, 8); // Força 8 de knockback

          // NOVO: Flash de Tela Vermelha Rápido
          const flash = new PIXI.Graphics();
          flash.beginFill(0xFF0000, 0.5).drawRect(0, 0, GAME_WIDTH, GAME_HEIGHT).endFill();
          this.app.stage.addChild(flash);

          const flashTicker = (delta: number) => {
            flash.alpha -= 0.08 * delta;
            if (flash.alpha <= 0) {
              flash.parent.removeChild(flash);
              this.app.ticker.remove(flashTicker);
            }
          };
          this.app.ticker.add(flashTicker);

          // Efeito de piscar (invulnerabilidade temporária)
          let blinkCount = 0;
          const blinkInterval = setInterval(() => {
            this.player.visible = !this.player.visible;
            blinkCount++;
            if (blinkCount >= 6) {
              clearInterval(blinkInterval);
              this.player.visible = true;
              this.player.canBeHit = true;
            }
          }, 150);
          break;
        }
      }
    }
  }

  private endGame(isWin: boolean) {
    this.gameState = isWin ? 'win' : 'gameOver';

    // Adiciona um overlay escuro semi-transparente
    const overlay = new PIXI.Graphics();
    overlay.beginFill(0x000000, 0.75);
    overlay.drawRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    overlay.endFill();
    this.app.stage.addChild(overlay);

    const style = new PIXI.TextStyle({
      fontFamily: 'Inter, Arial',
      fontSize: 72,
      fill: isWin ? '#98FB98' : '#FF6347',
      stroke: { color: '#000000', width: 6, join: 'round' },
      align: 'center',
      fontWeight: 'bold'
    });
    const messageText = isWin ? 'Você Venceu!' : 'Game Over';
    const message = new PIXI.Text({ text: messageText, style });
    message.x = GAME_WIDTH / 2;
    message.y = GAME_HEIGHT / 2;
    message.anchor.set(0.5);
    this.app.stage.addChild(message);
  }

  private gameLoop(delta: number) {
    if (this.gameState === 'playing') {
      // Lógica de Input
      this.player.vx = 0; this.player.vy = 0; if (keyboard['ArrowUp'] || keyboard['KeyW']) { this.player.vy = -1; } if (keyboard['ArrowDown'] || keyboard['KeyS']) { this.player.vy = 1; } if (keyboard['ArrowLeft'] || keyboard['KeyA']) { this.player.vx = -1; } if (keyboard['ArrowRight'] || keyboard['KeyD']) { this.player.vx = 1; } const len = Math.sqrt(this.player.vx * this.player.vx + this.player.vy * this.player.vy); if (len > 0) { this.player.vx /= len; this.player.vy /= len; } this.player.vx *= PLAYER_SPEED * delta; this.player.vy *= PLAYER_SPEED * delta;

      // --- Lógica do Jogo ---
      this.player.loseLight(LIGHT_DECAY_RATE * delta);
      this.checkInteractions();

      // --- Atualizações ---
      this.player.update(delta); // O update do Vagalume agora recebe delta para o knockback
      this.player.step(delta);
      this.enemies.forEach(enemy => enemy.update(delta, 1, this.player.x, this.player.y)); // Passa a posição do jogador para o inimigo

      // NOVO: Atualiza as duas camadas de paralaxe
      this.starfieldFar.update(delta);
      this.starfieldNear.update(delta);

      // Checagem de Vitória/Derrota
      if (this.player.light <= 0) { this.endGame(false); } else if (this.flores.every(flor => flor.isLit)) { this.endGame(true); }
    }
    this.updateUI();
  }
}


// Inicia o jogo
new Game();