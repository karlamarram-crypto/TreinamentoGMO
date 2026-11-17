import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C6, CORES, FONTE, inicioCena, tempoNomesC6} from '../config';
import {participantes} from '../data/participantes';
import {Fundo, Texto, ease, lerp, prog, useT} from '../componentes/base';

// =============================================================================
// Cena 6 · Participantes (v4)
// 1. Os nomes surgem espalhados pela tela, em profundidades diferentes, flutuando.
// 2. Todos se movem juntos e formam um bloco 4 x 4 centralizado.
// 3. Uma luz quente acende atrás do bloco; os nomes ficam 100% brancos.
// Fundo marinho liso com vinheta. O layout se adapta se a lista mudar.
// =============================================================================
const AREA = {x0: 90, x1: 1830, y0: 100, y1: 860}; // fora da faixa da legenda (y > 900)
const BLOCO = {fonte: 34, cy: 430, vao: 80, linha: 64, opacidade: 0.7};
const TEXTO_Y = 600;

let ctxMedida: CanvasRenderingContext2D | null = null;
const medir = (txt: string, px: number) => {
  if (!ctxMedida) ctxMedida = document.createElement('canvas').getContext('2d');
  ctxMedida!.font = `${px}px ${FONTE}`;
  return ctxMedida!.measureText(txt).width;
};

// pseudo-aleatório com seed fixa (mesmo resultado em todo render)
const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

type Pos = {x: number; y: number}; // centro do nome
type Solto = Pos & {px: number; op: number; blur: number};
export type LayoutNomes = {espalhado: Solto[]; bloco: Pos[]; centro: Pos};

export const layoutNomes = (): LayoutNomes => {
  const n = participantes.length;

  // bloco: 4 colunas, na ordem da lista, cada coluna centralizada
  const nCol = n > 20 ? 5 : 4;
  const porCol = Math.ceil(n / nCol);
  const colunas = Array.from({length: nCol}, (_, c) => participantes.map((_, i) => i).slice(c * porCol, (c + 1) * porCol)).filter((c) => c.length);
  const largCol = colunas.map((c) => Math.max(...c.map((i) => medir(participantes[i].nome, BLOCO.fonte))));
  const largura = largCol.reduce((s, w) => s + w, 0) + BLOCO.vao * (colunas.length - 1);
  const y0 = BLOCO.cy - ((porCol - 1) * BLOCO.linha) / 2;
  const bloco: Pos[] = participantes.map(() => ({x: 0, y: 0}));
  let x = 960 - largura / 2;
  colunas.forEach((c, k) => {
    c.forEach((i, r) => { bloco[i] = {x: x + largCol[k] / 2, y: y0 + r * BLOCO.linha}; });
    x += largCol[k] + BLOCO.vao;
  });

  // espalhado: tamanho 28–44 px (profundidade), posição por "melhor candidato" sem sobreposição
  const espalhado: Solto[] = [];
  const caixas: {x0: number; x1: number; y0: number; y1: number}[] = [];
  participantes.forEach((p, i) => {
    const px = Math.round(28 + rnd(i * 7 + 1) * 16);
    const w = medir(p.nome, px), h = px * 1.2;
    let melhor: Pos | null = null, melhorD = -1;
    for (let c = 0; c < 120; c++) {
      const cand = {
        x: AREA.x0 + w / 2 + rnd(i * 977 + c * 13 + 5) * (AREA.x1 - AREA.x0 - w),
        y: AREA.y0 + h / 2 + rnd(i * 619 + c * 31 + 9) * (AREA.y1 - AREA.y0 - h),
      };
      const cx = {x0: cand.x - w / 2 - 28, x1: cand.x + w / 2 + 28, y0: cand.y - h / 2 - 20, y1: cand.y + h / 2 + 20};
      if (caixas.some((b) => cx.x0 < b.x1 && b.x0 < cx.x1 && cx.y0 < b.y1 && b.y0 < cx.y1)) continue;
      const d = Math.min(1e9, ...espalhado.map((q) => Math.hypot((q.x - cand.x) * 0.6, q.y - cand.y)));
      if (d > melhorD) { melhorD = d; melhor = cand; }
    }
    const pos = melhor ?? {x: AREA.x0 + w / 2, y: AREA.y0 + h / 2};
    caixas.push({x0: pos.x - w / 2, x1: pos.x + w / 2, y0: pos.y - h / 2, y1: pos.y + h / 2});
    const prof = (px - 28) / 16; // 0 = longe, 1 = perto
    espalhado.push({...pos, px, op: 0.35 + 0.35 * prof, blur: px < 34 ? ((34 - px) / 6) * 1.4 : 0});
  });
  return {espalhado, bloco, centro: {x: 960, y: BLOCO.cy}};
};

// ease-in-out cúbico
const cubico = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

// intensidade da luz atrás do bloco: flicker de 3 quadros, depois acende rápido
const intensidadeLuz = (t: number, luz: number) => {
  if (t < luz) return 0;
  const q = Math.floor((t - luz) * 30);
  if (q < 3) return [0.55, 0.12, 0.75][q];
  return lerp(0.75, 1, ease(Math.min(1, (t - luz - 0.1) / 0.3)));
};

export const Nomes: React.FC<{t: number; L: LayoutNomes; tNomes: number[]; estatico?: boolean}> = ({t, L, tNomes, estatico = false}) => {
  const luz = estatico ? 1 : intensidadeLuz(t, C6.luz);
  const raio = estatico ? 1 : Math.min(1, Math.max(0, (t - C6.luz) / 0.4)); // a luz se abre do centro
  return (
    <>
      {luz > 0 && (
        <div
          style={{
            position: 'absolute', left: L.centro.x - 820, top: L.centro.y - 430, width: 1640, height: 860,
            opacity: 0.4 * luz, transform: `scale(${0.35 + 0.65 * ease(raio)})`,
            background: `radial-gradient(ellipse at center, ${CORES.laranjaBrilho} 0%, ${CORES.laranja}99 32%, rgba(247,139,21,0.18) 55%, rgba(0,42,70,0) 72%)`,
          }}
        />
      )}
      {participantes.map((p, i) => {
        const e = L.espalhado[i], b = L.bloco[i];
        const vis = estatico ? 1 : prog(t, tNomes[i], 0.35);
        if (vis <= 0) return null;
        const k = estatico ? 1 : cubico(Math.min(1, Math.max(0, (t - C6.junta - i * C6.stagger) / C6.viagem)));
        const deriva = 1 - k;
        const x = lerp(e.x, b.x, k) + Math.sin(t * 0.45 + i * 1.3) * 7 * deriva;
        const y = lerp(e.y, b.y, k) + Math.cos(t * 0.38 + i * 2.1) * 5 * deriva;
        // a luz chega no nome conforme a distância do centro
        const dist = Math.hypot(b.x - L.centro.x, b.y - L.centro.y);
        const aceso = estatico ? 1 : prog(t, C6.luz + 0.05 + dist / 1600, 0.25);
        const op = lerp(lerp(e.op, BLOCO.opacidade, k), 1, aceso);
        return (
          <div
            key={p.nome}
            style={{
              position: 'absolute', left: x, top: y, whiteSpace: 'nowrap', color: CORES.branco,
              fontSize: lerp(e.px, BLOCO.fonte, k), lineHeight: 1,
              opacity: op * vis, filter: e.blur * deriva > 0.05 ? `blur(${e.blur * deriva}px)` : undefined,
              transform: `translate(-50%, -50%) scale(${0.9 + 0.1 * vis})`,
            }}
          >
            {p.nome}
          </div>
        );
      })}
    </>
  );
};

export const temposNomes = () => {
  const base = inicioCena(5);
  return {L: layoutNomes(), tNomes: tempoNomesC6().map((x) => x - base)};
};

export const Cena06: React.FC = () => {
  const t = useT();
  const {L, tNomes} = temposNomes();
  return (
    <Fundo>
      {/* vinheta suave sobre o marinho liso */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,42,70,0) 45%, rgba(0,16,30,0.55) 100%)'}} />
      <Nomes t={t} L={L} tNomes={tNomes} />
      <Texto x={960} y={TEXTO_Y} alinhar="centro" largura={1600} p={prog(t, C6.texto, 0.5)} estilo={{fontSize: 50}}>
        {participantes.length} pessoas do ONS. <span style={{color: CORES.aco}}>Uma turma.</span>
      </Texto>
    </Fundo>
  );
};
