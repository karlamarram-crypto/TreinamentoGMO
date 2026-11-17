import React from 'react';
import {CORES, FONTE, inicioCena, juntaC6, tempoNomesC6} from '../config';
import {participantes} from '../data/participantes';
import {Fundo, Linha, Silhueta, Svg, Texto, diagonal, ease, lerp, prog, useT} from '../componentes/base';
import {Montagem} from '../componentes/imagens';
import {PESSOAS} from './Cena03';

// =============================================================================
// Cena 6 · Participantes (v3)
// Os nomes acendem um por vez, ESPALHADOS pela tela. Depois voam e se organizam
// dentro de uma caixa, em grade. Sem nós, sem linhas de rede, sem nomes de área.
// O layout se adapta se a lista de participantes mudar.
// =============================================================================
const AREA = {x0: 120, x1: 1800, y0: 130, y1: 740};

let ctxMedida: CanvasRenderingContext2D | null = null;
const medir = (txt: string, px: number) => {
  if (!ctxMedida) ctxMedida = document.createElement('canvas').getContext('2d');
  ctxMedida!.font = `${px}px ${FONTE}`;
  return ctxMedida!.measureText(txt).width;
};

// pseudo-aleatório determinístico (mesmo resultado em todo render)
const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

type Pos = {x: number; y: number};
export type LayoutNomes = {fonte: number; linhaH: number; espalhado: Pos[]; organizado: Pos[]; larguras: number[]; caixa: {x: number; y: number; w: number; h: number}};

export const layoutNomes = (): LayoutNomes => {
  const n = participantes.length;
  const fonte = n > 20 ? 24 : 28;
  const linhaH = Math.round(fonte * 1.75);
  const larguras = participantes.map((p) => medir(p.nome, fonte));
  const alt = fonte * 1.2;

  // organizado: grade equilibrada (4 colunas), centralizada numa caixa
  const nCol = n > 20 ? 5 : 4;
  const porCol = Math.ceil(n / nCol);
  const colunas = Array.from({length: nCol}, (_, c) => participantes.map((_, i) => i).slice(c * porCol, (c + 1) * porCol)).filter((c) => c.length);
  const largCol = colunas.map((c) => Math.max(...c.map((i) => larguras[i])));
  const vao = 64;
  const larguraBloco = largCol.reduce((s, w) => s + w, 0) + vao * (colunas.length - 1);
  const alturaBloco = (porCol - 1) * linhaH + alt;
  const x0 = 960 - larguraBloco / 2;
  const y0 = 420 - alturaBloco / 2;
  const organizado: Pos[] = participantes.map(() => ({x: 0, y: 0}));
  let x = x0;
  colunas.forEach((c, k) => {
    c.forEach((i, r) => { organizado[i] = {x, y: y0 + r * linhaH}; });
    x += largCol[k] + vao;
  });
  const pad = 52;
  const caixa = {x: x0 - pad, y: y0 - pad, w: larguraBloco + pad * 2, h: alturaBloco + pad * 2};

  // espalhado: uma célula por nome (ordem embaralhada) com deslocamento aleatório → tela toda, sem sobreposição
  const gc = Math.ceil(Math.sqrt(n * 1.6)), gl = Math.ceil(n / gc);
  const cw = (AREA.x1 - AREA.x0) / gc, ch = (AREA.y1 - AREA.y0) / gl;
  const celulas = Array.from({length: gc * gl}, (_, k) => k).sort((p, q) => rnd(p + 101) - rnd(q + 101)).slice(0, n);
  const espalhado: Pos[] = participantes.map((_, i) => {
    const c = celulas[i] % gc, l = Math.floor(celulas[i] / gc);
    const folgaX = Math.max(0, cw - larguras[i] - 24), folgaY = Math.max(0, ch - alt - 16);
    return {x: AREA.x0 + c * cw + rnd(i * 13 + 7) * folgaX, y: AREA.y0 + l * ch + rnd(i * 29 + 5) * folgaY};
  });
  return {fonte, linhaH, espalhado, organizado, larguras, caixa};
};

// Nomes: espalhados (junta = 0) → organizados na caixa (junta = 1)
export const Nomes: React.FC<{t: number; L: LayoutNomes; tNomes: number[]; tJunta: number; estatico?: boolean}> = ({t, L, tNomes, tJunta, estatico = false}) => {
  const mold = estatico ? 1 : prog(t, tJunta + 1.1, 0.7);
  const {x: mx, y: my, w: mw, h: mh} = L.caixa;
  return (
    <>
      {mold > 0 && (
        <Svg>
          <rect x={mx} y={my} width={mw} height={mh} rx={6} fill={CORES.marinho2} fillOpacity={0.3 * mold} />
          <rect x={mx} y={my} width={mw} height={mh} rx={6} fill="none" stroke={CORES.aco} strokeWidth={1.5}
            strokeDasharray={`${2 * (mw + mh)}`} strokeDashoffset={2 * (mw + mh) * (1 - mold)} />
        </Svg>
      )}
      {participantes.map((p, i) => {
        const t0 = tNomes[i];
        const vis = estatico ? 1 : prog(t, t0, 0.3);
        if (vis <= 0) return null;
        // cada nome sai em sequência rápida rumo à caixa
        const k = estatico ? 1 : ease(Math.min(1, Math.max(0, (t - tJunta - i * 0.04) / 0.9)));
        const e = L.espalhado[i], o = L.organizado[i];
        const flutua = (1 - k) * 6;
        const x = lerp(e.x, o.x, k) + Math.sin(t * 0.9 + i) * flutua;
        const y = lerp(e.y, o.y, k) + Math.cos(t * 0.8 + i * 1.7) * flutua;
        const quente = estatico ? 0 : Math.max(0, 1 - (t - t0) / 0.8);
        return (
          <div
            key={p.nome}
            style={{
              position: 'absolute', left: x, top: y, fontSize: L.fonte, whiteSpace: 'nowrap', opacity: vis,
              transform: `scale(${0.85 + 0.15 * vis})`, transformOrigin: 'left center',
              color: quente > 0.05 ? `rgb(255,${Math.round(255 - 92 * quente)},${Math.round(255 - 186 * quente)})` : CORES.branco,
              textShadow: quente > 0.05 ? `0 0 ${14 * quente}px rgba(248,163,69,${0.9 * quente})` : 'none',
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
  return {L: layoutNomes(), tNomes: tempoNomesC6().map((x) => x - base), tJunta: juntaC6()};
};

export const Cena06: React.FC = () => {
  const t = useT();
  const {L, tNomes, tJunta} = temposNomes();
  return (
    <Fundo>
      {/* linhas de transmissão ao fundo, bem discretas */}
      <Montagem planos={[{t: 0, nome: 'linhas_transmissao_noite', inicio: 0, corte: true}, {t: 8, nome: 'torres_silhueta', inicio: 2}]} fim={16} veu={0.8} />
      <Svg>
        <Linha {...diagonal(-80)} p={prog(t, 0.2, 0.8)} largura={1} opacidade={0.18} />
        <Linha {...diagonal(1560)} p={prog(t, 0.3, 0.8)} largura={1} opacidade={0.18} />
        {PESSOAS.map((s, i) => (
          <g key={i} opacity={1 - prog(t, 0, 0.5)}>
            <Silhueta x={s.x} y={s.y} cor={CORES.branco} />
          </g>
        ))}
      </Svg>
      <Nomes t={t} L={L} tNomes={tNomes} tJunta={tJunta} />
      <Texto x={960} y={790} alinhar="centro" largura={1600} p={prog(t, tJunta + 1.6, 0.5)} estilo={{fontSize: 50}}>
        {participantes.length} participantes. <span style={{color: CORES.aco}}>Três dias juntos.</span>
      </Texto>
    </Fundo>
  );
};
