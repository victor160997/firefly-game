import * as PIXI from 'pixi.js';
import { Vagalume } from './vagalume';
import { FlorFarol } from './flor-farol';
import { Polen } from './polen';
import { ENEMY_LIGHT_PENALTY, FLOWER_LIGHT_COST, GAME_HEIGHT, GAME_WIDTH, LIGHT_DECAY_RATE, PLAYER_SPEED, POLLEN_COUNT as DEFAULT_POLLEN_COUNT, POLLEN_LIGHT_VALUE } from './utils/consts';
import { Inimigo } from './enemy';

// CLASSE STARFIELD PARA O CÉU REALISTA E DINÂMICO (COM PARALAXE)
class Starfield extends PIXI.Container {
  private stars: PIXI.Graphics[] = [];
  private fieldWidth: number;
  private fieldHeight: number;
  private numStars: number;
  private scrollSpeed: number;

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
      const size = 0.5 + Math.random() * (1.5 * this.scrollSpeed);
      const alpha = 0.2 + Math.random() * (0.5 * this.scrollSpeed);
      const color = 0xFFFFFF;

      star.beginFill(color, alpha);
      star.drawCircle(0, 0, size / 2);
      star.endFill();

      star.x = Math.random() * this.fieldWidth;
      star.y = Math.random() * this.fieldHeight;
      (star as any).hSpeed = (Math.random() - 0.5) * 0.05 * this.scrollSpeed;

      this.addChild(star);
      this.stars.push(star);
    }
  }

  public update(delta: number) {
    const time = Date.now() * 0.001;
    this.stars.forEach(star => {
      star.alpha = (0.5 + Math.sin(time + star.x * 0.01) * 0.2);
      if (star.alpha > 0.9) star.alpha = 0.9;
      if (star.alpha < 0.2) star.alpha = 0.2;

      star.y += (this.scrollSpeed * 0.15) * delta;
      star.x += (star as any).hSpeed * delta;

      if (star.y > this.fieldHeight) {
        star.y = 0;
        star.x = Math.random() * this.fieldWidth;
      }
    });
  }
}


// teclas
const keyboard: { [key: string]: boolean } = {};
window.addEventListener('keydown', (e) => { keyboard[e.code] = true; });
window.addEventListener('keyup', (e) => { keyboard[e.code] = false; });

type LevelSettings = {
  name: string;
  flowerCount: number;
  enemyCount: number;
  pollenCount: number;
};

const LEVELS: LevelSettings[] = [
  { name: 'Fácil', flowerCount: 4, enemyCount: 3, pollenCount: DEFAULT_POLLEN_COUNT },
  { name: 'Médio', flowerCount: 6, enemyCount: 7, pollenCount: DEFAULT_POLLEN_COUNT },
  { name: 'Difícil', flowerCount: 8, enemyCount: 11, pollenCount: DEFAULT_POLLEN_COUNT },
];

// Botão simples
function createButton(text: string, width = 220, height = 48) {
  const c = new PIXI.Container();
  const g = new PIXI.Graphics();
  g.beginFill(0x202020).drawRoundedRect(-width/2, -height/2, width, height, 8).endFill();
  g.lineStyle(2, 0x444444).drawRoundedRect(-width/2, -height/2, width, height, 8);
  const t = new PIXI.Text(text, { fontFamily: 'Inter, Arial', fontSize: 18, fill: '#E8FFFF' });
  t.anchor.set(0.5);
  c.addChild(g, t);
  c.interactive = true;
  (c as any).buttonMode = true;
  return c;
}


// Game gerenciado (cria conteúdo dentro do app passado)
class Game {
  private app: PIXI.Application;
  private player!: Vagalume;
  private pollens: Polen[] = [];
  private flores: FlorFarol[] = [];
  private enemies: Inimigo[] = [];
  private starfieldFar!: Starfield;
  private starfieldNear!: Starfield;

  // áudio de coleta de pólen
  private pollenAudio!: HTMLAudioElement;
  private flowerAudio!: HTMLAudioElement;
  private gameOverAudio!: HTMLAudioElement;
  private victoryAudio!: HTMLAudioElement;
  private failureAudio!: HTMLAudioElement;

  private lightBar!: PIXI.Graphics;
  private lightBarBg!: PIXI.Graphics;
  private lightBarBorder!: PIXI.Graphics;
  private lightText!: PIXI.Text;
  private gameState: 'playing' | 'gameOver' | 'win' = 'playing';

  private settings: LevelSettings;
  private rootContainer = new PIXI.Container();

  constructor(app: PIXI.Application, settings: LevelSettings) {
    this.app = app;
    this.settings = settings;
    this.init();
  }

  private init() {
    // limpar stage
    this.app.stage.removeChildren();
    this.app.stage.addChild(this.rootContainer);

    // inicializa áudio de coleta (arquivo em /public -> servir na raiz: /pega-polen.mp3)
    try {
      this.pollenAudio = new Audio('/pega-polen.mp3');
      this.pollenAudio.preload = 'auto';
      this.pollenAudio.volume = 0.9;
      this.flowerAudio = new Audio('/ilumina-flor-farol.mp3');
      this.flowerAudio.preload = 'auto';
      this.flowerAudio.volume = 0.95;
      this.gameOverAudio = new Audio('/game-over.mp3');
      this.gameOverAudio.preload = 'auto';
      this.gameOverAudio.volume = 1.0;
      this.victoryAudio = new Audio('/vitoria.mp3');
      this.victoryAudio.preload = 'auto';
      this.victoryAudio.volume = 1.0;
      this.failureAudio = new Audio('/failure.mp3');
      this.failureAudio.preload = 'auto';
      this.failureAudio.volume = 0.95;
    } catch (e) {
      // ambiente sem DOM/audio ou falha ao criar, silenciosamente ignora
      // (ex.: testes de servidor)
    }

    // estrelas
    this.starfieldFar = new Starfield(GAME_WIDTH, GAME_HEIGHT, 100, 0.4);
    this.starfieldNear = new Starfield(GAME_WIDTH, GAME_HEIGHT, 50, 1.0);
    this.rootContainer.addChild(this.starfieldFar);
    this.rootContainer.addChild(this.starfieldNear);

    // flores (distribuição simples)
    const spacingX = GAME_WIDTH / (this.settings.flowerCount + 1);
    for (let i = 0; i < this.settings.flowerCount; i++) {
      const f = new FlorFarol((i + 1) * spacingX, 120 + Math.random() * (GAME_HEIGHT - 240));
      this.flores.push(f);
      this.rootContainer.addChild(f);
    }

    // pólens
    for (let i = 0; i < this.settings.pollenCount; i++) {
      const p = new Polen(); this.pollens.push(p); this.rootContainer.addChild(p);
    }

    // inimigos
    for (let i = 0; i < this.settings.enemyCount; i++) {
      const e = new Inimigo(Math.random() * GAME_WIDTH, Math.random() * GAME_HEIGHT);
      this.enemies.push(e);
      this.rootContainer.addChild(e);
    }

    // player
    this.player = new Vagalume();
    this.rootContainer.addChild(this.player);
    this.player.initTrails(this.rootContainer);

    this.createUI();
    this.app.ticker.add((ticker) => this.gameLoop(ticker.deltaTime));
  }

  private createUI() {
    const barWidth = 200, barHeight = 20;
    const barX = GAME_WIDTH / 2 - barWidth / 2;
    const barY = 20;

    this.lightBarBg = new PIXI.Graphics();
    this.lightBarBg.beginFill(0x181818).drawRect(0, 0, barWidth, barHeight).endFill();
    this.lightBarBg.x = barX; this.lightBarBg.y = barY;

    this.lightBar = new PIXI.Graphics();
    this.lightBar.x = barX; this.lightBar.y = barY;

    this.lightBarBorder = new PIXI.Graphics();
    this.lightBarBorder.lineStyle(2, 0x444444);
    this.lightBarBorder.drawRect(barX, barY, barWidth, barHeight);

    const textStyle = new PIXI.TextStyle({
      fontFamily: 'Inter, Arial',
      fontSize: 16,
      fill: '#E8FFFF',
      stroke: '#000000',
      strokeThickness: 2
    } as any);
    this.lightText = new PIXI.Text(`Vida: ${Math.round(this.player.light)}`, textStyle);
    this.lightText.x = GAME_WIDTH / 2;
    this.lightText.y = barY + barHeight + 8;
    this.lightText.anchor.set(0.5, 0);

    this.rootContainer.addChild(this.lightBarBg, this.lightBar, this.lightBarBorder, this.lightText);
  }

  private updateUI() {
    const lightNormalized = this.player.light / 100;
    const fullWidth = 200;
    this.lightBar.clear();

    let barColor = 0xFFFF00;
    if (lightNormalized > 0.6) barColor = 0x8FBC8F;
    else if (lightNormalized < 0.3) barColor = 0xFF4500;

    this.lightBar.beginFill(barColor);
    this.lightBar.drawRect(0, 0, fullWidth * lightNormalized, 20);
    this.lightBar.endFill();

    this.lightText.text = `Vida: ${Math.round(this.player.light)}`;
  }

  // Reproduz o som de coleta de pólen (seguro contra ambientes sem áudio)
  private playPollenSound() {
    try {
      if (!this.pollenAudio) return;
      // reinicia se já estiver tocando
      try { this.pollenAudio.currentTime = 0; } catch (e) { /* ignore */ }
      const p = this.pollenAudio.play();
      if (p && typeof (p as any).catch === 'function') (p as any).catch(() => { /* ignora rejeições (ex: play bloqueado) */ });
    } catch (e) {
      // ambiente sem suporte a áudio — ignora
    }
  }

  // Reproduz o som quando uma flor é iluminada
  private playFlowerSound() {
    try {
      if (!this.flowerAudio) return;
      try { this.flowerAudio.currentTime = 0; } catch (e) { /* ignore */ }
      const p = this.flowerAudio.play();
      if (p && typeof (p as any).catch === 'function') (p as any).catch(() => { /* ignora rejeições */ });
    } catch (e) {
      // ignora ambientes sem áudio
    }
  }

  // Reproduz o som de game over
  private playGameOverSound() {
    try {
      if (!this.gameOverAudio) return;
      try { this.gameOverAudio.currentTime = 0; } catch (e) { /* ignore */ }
      const p = this.gameOverAudio.play();
      if (p && typeof (p as any).catch === 'function') (p as any).catch(() => { /* ignora rejeições */ });
    } catch (e) {
      // ignora ambientes sem áudio
    }
  }

  // Reproduz o som quando o jogador é atingido por um inimigo
  private playFailureSound() {
    try {
      if (!this.failureAudio) return;
      try { this.failureAudio.currentTime = 0; } catch (e) { /* ignore */ }
      const p = this.failureAudio.play();
      if (p && typeof (p as any).catch === 'function') (p as any).catch(() => { /* ignora rejeições */ });
    } catch (e) {
      // ignora ambientes sem áudio
    }
  }

  // Reproduz o som de vitória
  private playVictorySound() {
    try {
      if (!this.victoryAudio) return;
      try { this.victoryAudio.currentTime = 0; } catch (e) { /* ignore */ }
      const p = this.victoryAudio.play();
      if (p && typeof (p as any).catch === 'function') (p as any).catch(() => { /* ignora rejeições */ });
    } catch (e) {
      // ignora ambientes sem áudio
    }
  }

  private checkInteractions() {
    for (const polen of this.pollens) {
      const dx = this.player.x - polen.x; const dy = this.player.y - polen.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < 20) {
        this.player.gainLight(POLLEN_LIGHT_VALUE);
        polen.randomizePosition();
        this.playPollenSound();
      }
    }

    for (const flor of this.flores) {
      if (!flor.isLit) {
        const dx = this.player.x - flor.x; const dy = this.player.y - flor.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
         if (distance < 20 && this.player.light >= 90) { 
           flor.lightUp(); 
           this.player.loseLight(FLOWER_LIGHT_COST); 
           this.playFlowerSound(); 
         }
      }
    }

    if (this.player.canBeHit) {
      for (const enemy of this.enemies) {
        const dx = this.player.x - enemy.x; const dy = this.player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 20) {
          this.player.loseLight(ENEMY_LIGHT_PENALTY);
          this.player.canBeHit = false;
          this.playFailureSound();

          const nx = dx / (distance || 1);
          const ny = dy / (distance || 1);
          this.player.applyKnockback(nx, ny, 8);

          const flash = new PIXI.Graphics();
          flash.beginFill(0xFF0000, 0.5).drawRect(0, 0, GAME_WIDTH, GAME_HEIGHT).endFill();
          this.rootContainer.addChild(flash);
          const flashTicker: PIXI.TickerCallback<PIXI.Ticker> = (ticker: PIXI.Ticker) => {
            const delta = (ticker as any).deltaTime ?? 1;
            flash.alpha -= 0.08 * delta;
            if (flash.alpha <= 0) { flash.parent?.removeChild(flash); this.app.ticker.remove(flashTicker); }
          };
          this.app.ticker.add(flashTicker);

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
  if (!isWin) this.playGameOverSound();
  else this.playVictorySound();
    const overlay = new PIXI.Graphics();
    overlay.beginFill(0x000000, 0.75).drawRect(0, 0, GAME_WIDTH, GAME_HEIGHT).endFill();
    this.rootContainer.addChild(overlay);

    const style = new PIXI.TextStyle({
      fontFamily: 'Inter, Arial',
      fontSize: 56,
      fill: isWin ? '#98FB98' : '#FF6347',
      stroke: '#000000',
      strokeThickness: 6,
      fontWeight: 'bold'
    } as any);
    const message = new PIXI.Text(isWin ? 'Você Venceu!' : 'Game Over', style);
    message.anchor.set(0.5); message.x = GAME_WIDTH / 2; message.y = GAME_HEIGHT / 2 - 40;
    this.rootContainer.addChild(message);

    // Botões
    const btnRestart = createButton('Reiniciar');
    btnRestart.x = GAME_WIDTH / 2;
    btnRestart.y = GAME_HEIGHT / 2 + 30;
    btnRestart.on('pointerdown', () => this.restart());
    const btnMenu = createButton('Voltar ao Menu');
    btnMenu.x = GAME_WIDTH / 2;
    btnMenu.y = GAME_HEIGHT / 2 + 100;
    btnMenu.on('pointerdown', () => this.destroyAndBackToMenu());
    this.rootContainer.addChild(btnRestart, btnMenu);
  }

  private restart() {
    // remove ticker callback by resetting stage and re-init
    // this.app.ticker.removeAllListeners();
    this.pollens = []; this.flores = []; this.enemies = [];
    this.rootContainer.removeChildren();
    this.gameState = 'playing';
    this.init();
  }

  private destroyAndBackToMenu() {
    // this.app.ticker.removeAllListeners();
    this.app.stage.removeChildren();
    // sinaliza ao código externo que deve mostrar menu novamente
    showMenu(this.app);
  }

  private gameLoop(delta: number) {
    if (this.gameState === 'playing') {
      this.player.vx = 0; this.player.vy = 0;
      if (keyboard['ArrowUp'] || keyboard['KeyW']) this.player.vy = -1;
      if (keyboard['ArrowDown'] || keyboard['KeyS']) this.player.vy = 1;
      if (keyboard['ArrowLeft'] || keyboard['KeyA']) this.player.vx = -1;
      if (keyboard['ArrowRight'] || keyboard['KeyD']) this.player.vx = 1;
      const len = Math.hypot(this.player.vx, this.player.vy);
      if (len > 0) { this.player.vx /= len; this.player.vy /= len; }
      this.player.vx *= PLAYER_SPEED * delta; this.player.vy *= PLAYER_SPEED * delta;

      this.player.loseLight(LIGHT_DECAY_RATE * delta);
      this.checkInteractions();

      this.player.update(delta);
      this.player.step(delta);
      this.enemies.forEach(enemy => enemy.update(delta, 1, this.player.x, this.player.y));

      this.starfieldFar.update(delta);
      this.starfieldNear.update(delta);

      if (this.player.light <= 0) { this.endGame(false); }
      else if (this.flores.every(f => f.isLit)) { this.endGame(true); }
    }
    this.updateUI();
  }
}


// MENU
function showMenu(app: PIXI.Application) {
  app.stage.removeChildren();
  const menu = new PIXI.Container();
  const bg = new PIXI.Graphics();
  bg.beginFill(0x000000, 0.6).drawRect(0, 0, GAME_WIDTH, GAME_HEIGHT).endFill();
  menu.addChild(bg);

  const title = new PIXI.Text('Noctilume', { fontFamily: 'Inter, Arial', fontSize: 48, fill: '#E8FFFF' });
  title.anchor.set(0.5); title.x = GAME_WIDTH / 2; title.y = 80;
  menu.addChild(title);

  // lista de níveis com descrição
  for (let i = 0; i < LEVELS.length; i++) {
    const lvl = LEVELS[i];
    const btn = createButton(`${lvl.name} — Flores: ${lvl.flowerCount}  Inimigos: ${lvl.enemyCount}`, 420, 56);
    btn.x = GAME_WIDTH / 2;
    btn.y = 180 + i * 90;
    btn.on('pointerdown', () => {
      // inicia jogo com o nível selecionado
      new Game(app, lvl);
    });
    menu.addChild(btn);
  }

  // instruções rápidas
  const info = new PIXI.Text('Use WASD / setas para mover. Recolha pólen e acenda flores.', { fontSize: 14, fill: '#CFEFF6' });
  info.anchor.set(0.5); info.x = GAME_WIDTH / 2; info.y = GAME_HEIGHT - 50;
  menu.addChild(info);

  app.stage.addChild(menu);
}


// inicialização do aplicativo PIXI e abrir menu
(async () => {
  const app = new PIXI.Application();
  await app.init?.({
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: 0x070B1A
  }).catch(() => undefined);

  // fallback se app.init não existir em algumas versões
  if (!app.view) {
    app.renderer.resize(GAME_WIDTH, GAME_HEIGHT);
  }
  document.body.appendChild(app.view as HTMLCanvasElement);
  showMenu(app);
})();