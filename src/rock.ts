import * as PIXI from 'pixi.js';

export class Rock {
  // display pode ser um Sprite (quando textura carregada) ou Graphics (fallback)
  public display: any;
  public vx: number;
  public vy: number;
  public damage: number;
  private size: number;

  // textura cacheada e instâncias registradas para substituir fallback quando carregar
  private static texture: PIXI.Texture | null = null;
  private static loading = false;
  private static instances: Rock[] = [];

  // size é o raio desejado em px
  constructor(x: number, y: number, vx: number, vy: number, damage: number, size = 8) {
    // tentar usar a imagem pública /rock.webp (pode não existir em tempo de execução)
    this.size = size;
    Rock.instances.push(this);
    const tex = Rock.texture;
    let sprite: PIXI.Sprite | null = null;
    if (tex) {
      sprite = new PIXI.Sprite(tex);
      sprite.anchor.set(0.5);
      sprite.x = x; sprite.y = y;
    }
    this.vx = vx; this.vy = vy; this.damage = damage;

    // dimensionar para que o raio visual fique próximo de `size`
    const desiredDiameter = size * 2;
    if (sprite && Rock.texture && Rock.texture.width && Rock.texture.width > 0) {
      const scale = desiredDiameter / Rock.texture.width;
      sprite.scale.set(scale);
      this.display = sprite;
    } else {
      // textura pode não estar imediatamente carregada: usar fallback gráfico até carregar
      const g = new PIXI.Graphics();
      g.beginFill(0x999999);
      g.drawCircle(0, 0, size);
      g.endFill();
      g.x = x; g.y = y;
      this.display = g;
      // iniciar carregamento da textura apenas uma vez
      if (!Rock.loading) {
        Rock.loading = true;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = '/rock.webp';
        img.onload = () => {
          try {
            Rock.texture = PIXI.Texture.from(img);
          } catch (e) {
            Rock.texture = null;
          }
          // substituir fallbacks existentes
          if (Rock.texture && Rock.texture.width && Rock.texture.width > 0) {
            for (const inst of Rock.instances) {
              // se a instância ainda usa fallback gráfico, troque pelo sprite
              if (inst.display && (inst.display as any).texture === undefined) {
                const px = (inst.display as any).x || 0;
                const py = (inst.display as any).y || 0;
                const spr = new PIXI.Sprite(Rock.texture);
                spr.anchor.set(0.5);
                spr.x = px; spr.y = py;
                const scale = (inst.size * 2) / Rock.texture.width;
                spr.scale.set(scale);
                const parent = (inst.display as any).parent;
                if (parent) parent.addChild(spr);
                try { parent?.removeChild(inst.display); } catch (e) { /* ignore */ }
                inst.display = spr;
              }
            }
          }
        };
        img.onerror = () => { Rock.texture = null; };
      }
    }
  }

  update(delta: number) {
  if ((this.display as any).x !== undefined) (this.display as any).x += this.vx * delta;
  if ((this.display as any).y !== undefined) (this.display as any).y += this.vy * delta;
  }

  collidesWith(px: number, py: number, radius = 16) {
  const dx = px - ((this.display as any).x || 0); const dy = py - ((this.display as any).y || 0);
  return Math.hypot(dx, dy) < radius;
  }

  isOffscreen(width: number, height: number) {
  const xPos = (this.display as any).x || 0; const yPos = (this.display as any).y || 0;
  return (yPos > height + 40 || xPos < -80 || xPos > width + 80 || yPos < -80);
  }

  destroy() {
    // remove do container e libera recursos de sprite (não remove texture global)
    try {
      if ((this.display as any).parent) (this.display as any).parent.removeChild(this.display);
    } catch (e) { /* ignore */ }
    try {
      if ((this.display as any).destroy) (this.display as any).destroy({ children: false, texture: false });
    } catch (e) { /* ignore */ }
  }
}
