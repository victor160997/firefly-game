import * as PIXI from 'pixi.js';

export class FlorFarol extends PIXI.Container {
  public isLit = false;
  private petals: PIXI.Graphics;
  private center: PIXI.Graphics;
  private stem: PIXI.Graphics; 
  private glow: PIXI.Sprite;

  constructor(x: number, y: number) {
    super();
    this.x = x; this.y = y;

    this.stem = new PIXI.Graphics();
    this.addChild(this.stem); 

    this.petals = new PIXI.Graphics();
    this.center = new PIXI.Graphics();
    this.glow = new PIXI.Sprite(this.makeGlowTexture(140));
    this.glow.anchor.set(0.5);
    this.glow.alpha = 0;
    
    // Ordem de desenho: Brilho -> Pétalas -> Centro
    this.addChild(this.glow); 
    this.addChild(this.petals);
    this.addChild(this.center);

    this.drawUnlit();
  }

  private makeGlowTexture(size: number) {
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d')!;
    const cx = size/2, cy = size/2;
    // Brilho mais quente, alaranjado-amarelado
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, size/2);
    grad.addColorStop(0, 'rgba(255,230,150,0.95)'); 
    grad.addColorStop(0.25, 'rgba(255,200,120,0.65)');
    grad.addColorStop(0.55, 'rgba(255,180,90,0.25)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,size,size);
    return PIXI.Texture.from(c);
  }

  private drawStem(isLit: boolean) {
    this.stem.clear();
    const stemColor = isLit ? 0x6AA84F : 0x3D5B2F; 
    const leafColor = isLit ? 0x8FBC8F : 0x4F6B4F; 

    // Caule
    this.stem.beginFill(stemColor);
    this.stem.drawRect(-2, 0, 4, 30);
    this.stem.endFill();

    // Folha 1 (Esquerda)
    this.stem.beginFill(leafColor);
    this.stem.moveTo(-2, 10);
    this.stem.lineTo(-10, 20);
    this.stem.lineTo(-2, 30);
    this.stem.closePath();
    this.stem.endFill();
    
    // Folha 2 (Direita)
    this.stem.beginFill(leafColor);
    this.stem.moveTo(2, 15);
    this.stem.lineTo(10, 25);
    this.stem.lineTo(2, 35);
    this.stem.closePath();
    this.stem.endFill();
  }

  drawUnlit(canBeLit: boolean = false) {
    this.isLit = false;
    this.petals.clear();
    this.center.clear();
    this.drawStem(false); 

    // Pétalas com cor mais rica e formato aprimorado
    const petalColor = 0x5E3F6B; 
    const numPetals = 8; 
    const petalRadius = 15;
    const petalLength = 20;

    for (let i = 0; i < numPetals; i++) {
      const angle = (i / numPetals) * Math.PI * 2;
      const px = Math.cos(angle) * petalRadius;
      const py = Math.sin(angle) * petalRadius;
      
      this.petals.beginFill(petalColor, 1);
      this.petals.moveTo(0, 0);
      this.petals.lineTo(px, py);
      this.petals.arc(0, 0, petalLength, angle - 0.2, angle + 0.2, false);
      this.petals.lineTo(0, 0);
      this.petals.endFill();
    }
    this.petals.rotation = Math.PI / numPetals; 

    // centro escuro
    this.center.beginFill(0x2A1C30); 
    this.center.drawCircle(0, 0, 8);
    this.center.endFill();

    // se pode ser acesa, desenha anel
    if (canBeLit) {
      this.petals.lineStyle(2, 0xFFE0B2, 0.8);
      this.petals.drawCircle(0,0,10);
      this.petals.lineStyle(0);
    }

    this.glow.alpha = 0;
  }

  lightUp() {
    this.isLit = true;
    this.petals.clear();
    this.center.clear();
    this.drawStem(true); 

    // Pétalas com cor amarela/laranja vibrante
    const petalColor = 0xFFA500; 
    const secondaryColor = 0xFFD700; 
    const numPetals = 8;
    const petalRadius = 15;
    const petalLength = 20;

    // Pétalas iluminadas
    for (let i = 0; i < numPetals; i++) {
      const angle = (i / numPetals) * Math.PI * 2;
      const px = Math.cos(angle) * petalRadius;
      const py = Math.sin(angle) * petalRadius;
      
      this.petals.beginFill(petalColor, 1);
      this.petals.moveTo(0, 0);
      this.petals.lineTo(px, py);
      this.petals.arc(0, 0, petalLength, angle - 0.2, angle + 0.2, false);
      this.petals.lineTo(0, 0);
      this.petals.endFill();
    }
    this.petals.rotation = Math.PI / numPetals;

    // Centro iluminado
    this.center.beginFill(secondaryColor);
    this.center.drawCircle(0, 0, 8);
    this.center.endFill();

    // Anel interno para detalhe
    this.center.lineStyle(1.5, 0xFF6347, 0.8); 
    this.center.drawCircle(0, 0, 4);
    this.center.lineStyle(0);


    this.glow.alpha = 0.9; 
    this.glow.scale.set(1.0); 
  }
}