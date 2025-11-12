# Integrantes do Grupo

- Victor Mendonça Rodrigues
- Augusto Sergio dos Santos Costa
- Carlos Eduardo Dias da Silva

---

# Noctilume — Documentação Detalhada (ODC)

Versão: 1.0

> Substitua os nomes e RAs dos integrantes acima antes da entrega final.

Este README contém a documentação técnica e de design do jogo Noctilume: ideia, mecânicas, arquitetura, como executar localmente, requisitos, convenções de assets e dicas de desenvolvimento.

## Sumário

- Ideia e mecânicas
- Controles
- Arquitetura e principais componentes
- Estrutura de arquivos
- Requisitos
- Como rodar (desenvolvimento / build / preview)
- Convenções de assets
- Testes e verificação manual
- Notas de desenvolvimento e balanceamento
- Próximos passos / sugestões
- Créditos

---

## Ideia do jogo (visão)

Noctilume é um jogo 2D de ação/aventura com tema noturno. O jogador controla um vagalume que deve
coletar pólen para manter sua luz acesa e usar essa energia para acender flores especiais espalhadas
pela fase. Ao acender todas as flores, o jogador avança para a próxima fase. Fases posteriores introduzem
inimigos, obstáculos (pedras/projéteis) e mecânicas novas, culminando em um chefe.

Objetivos de design:

- Criar uma sensação de urgência ao gerenciar a energia-luz do vagalume;
- Equilibrar risco-recompensa entre explorar (coletar pólen) e completar objetivos (acender flores);
- Usar áudio e iluminação (glow) para reforçar feedback sensorial.

### Mecânicas principais

- Movimentação do vagalume (2D, top-down);
- Coleta de pólen que recupera energia-luz;
- Consumo de energia para acender flores (algumas flores exigem múltiplas interações);
- Inimigos que perseguem ou patrulham e reduzem energia ao colidir;
- Rochas/projéteis que causam dano/knockback;
- Progressão por fases com aumento de dificuldade.

### Controles (padrão)

- Movimento: WASD ou setas;
- Pausar: tecla Esc;
- (Opcional) Ação/Interagir: E ou Barra de espaço — caso necessário para interações específicas.

---

## Arquitetura e principais componentes (resumo técnico)

- `src/main.ts` — ponto de entrada, cria o app (Pixi), gerencia o loop, spawns, níveis e UI. Contém a
  classe `Game` e a definição de `LEVELS`.
- `src/vagalume.ts` — classe `Vagalume`: estado do jogador, movimento, trail, glow, colisões e lógica de luz.
- `src/flor-farol.ts` — classe `FlorFarol`: estado (apagada/atingida/acendida), animação de preenchimento e condição de vitória por fase.
- `src/polen.ts` — coleção de objetos `Polen`: comportamentos de drift, animação de halo e valor de luz ao coletar.
- `src/enemy.ts` — classe `Inimigo`: comportamento wander, perseguição, colisões e dano.
- `src/rock.ts` — classe `Rock`: projéteis/obstáculos com fallback visual até textura carregar.
- `src/utils/consts.ts` — constantes de configuração de jogo (tamanhos, velocidades, valores de light, decay rate, etc.).

Observação: consulte os comentários em cada arquivo para detalhes de implementação e pontos de ajuste.

---

## Estrutura de arquivos

```
noctilume/
├── index.html
├── package.json
├── tsconfig.json
├── public/                # assets públicos (imagens, sprites, áudio)
├── src/
│   ├── main.ts
│   ├── vagalume.ts
│   ├── flor-farol.ts
│   ├── polen.ts
│   ├── enemy.ts
│   ├── rock.ts
│   ├── style.css
│   └── utils/
│       └── consts.ts
└── README.md
```

---

## Requisitos

- Node.js versão 16+ (recomendado 18+) — para rodar scripts e Vite;
- npm (ou yarn/pnpm) — gerenciador de pacotes;
- Navegador moderno com suporte a WebGL (Chrome, Firefox, Edge).

Dependências principais (ver `package.json`):

- `pixi.js` — renderização 2D / WebGL;
- (dev) `typescript`, `vite` — build e servidor de desenvolvimento.

---

## Como rodar (passo a passo)

As instruções abaixo assumem que você tem Node.js e npm instalados.

1) Instalar dependências

```bash
npm install
```

2) Rodar em modo desenvolvimento (servidor com hot-reload)

```bash
npm run dev
```

Após rodar, o Vite exibirá um endereço local (ex.: http://localhost:5173). Abra-o no navegador.

3) Build para produção

```bash
npm run build
```

Gera os arquivos otimizados (normalmente em `dist/`).

4) Pré-visualizar o build gerado

```bash
npm run preview
```

Observações:

- Caso seu `package.json` use scripts diferentes, verifique-os antes de executar.
- Se estiver usando `pnpm` ou `yarn`, substitua `npm` pelos comandos equivalentes.

---

## Convenções de assets (pasta `public/`)

- Coloque imagens e áudio em `public/` para serem servidos na raiz da aplicação.
- Nomes recomendados (utilizados no código):
  - `/pega-polen.mp3`
  - `/ilumina-flor-farol.mp3`
  - `/game-over.mp3`
  - `/vitoria.mp3`
  - `/rock.webp` (ou `.png`)
  - `/fundo.png` ou `/fundo.svg`

Formato e fallback:

- Prefira WebP ou PNG para sprites; forneça SVG/PNG como fallback quando possível.
- Verifique paths no código (`/rock.webp` etc.) e atualize caso renomeie arquivos.

---

## Testes e verificação manual

Testes manuais recomendados (checklist):

- [ ] Iniciar o jogo e verificar movimentação com WASD / setas;
- [ ] Coletar pólen e checar se o valor de luz é incrementado (observe UI);
- [ ] Tocar em inimigo para confirmar dano e knockback;
- [ ] Acender uma flor e verificar animação/efeito sonoro;
- [ ] Testar spawn de pedras a partir da fase 2;
- [ ] Testar build (`npm run build`) e `npm run preview` para versão de produção;
- [ ] Testar em mais de um navegador (Chrome/Firefox) e em modo incógnito para isolar caching.

Registro de issues/bugs: usar o GitHub Issues e referenciar o arquivo/linha quando pertinente.

---

## Notas de desenvolvimento e dicas (balanceamento)

- Valores principais estão em `src/utils/consts.ts`. Ajuste `PLAYER_SPEED`, `LIGHT_DECAY_RATE`, `POLLEN_LIGHT_VALUE`, `ENEMY_SPEED` e contadores de spawn para balancear dificuldade.
- Para performance: reuse objetos Pixi (Sprites/Graphics) em pools ao invés de criar/destroçar por frame.
- Para debugging: habilite logs de spawn e transição de fase em `Game` (em `src/main.ts`).

---

## Possíveis melhorias / próximos passos

- Implementar tela de opções (volume, controles remapeáveis);
- Sistema de saves simples (localStorage) para fases/score;
- Adicionar níveis adicionais com variações de iluminação e obstáculos dinâmicos;
- Polir SFX e trilha sonora, adicionar transições entre fases.

---

## Créditos

- Motor de renderização: Pixi.js
- Trabalho desenvolvido para a disciplina de Jogos Digitais
- Imagens/sounds: (colocar créditos reais aqui se forem de terceiros)

---
