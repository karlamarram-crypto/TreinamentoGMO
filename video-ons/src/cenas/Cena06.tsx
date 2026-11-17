import React from 'react';
import {CORES, FONTE, frasesCena, inicioCena, tempoNomesC6} from '../config';
import {participantes, areas} from '../data/participantes';
import {Fundo, Linha, Rotulo, Silhueta, Svg, Texto, diagonal, ease, lerp, prog, useT} from '../componentes/base';
import {Montagem} from '../componentes/imagens';
import {PESSOAS} from './Cena03';

// =============================================================================
// Cena 6 · Juntos na mesma sala (v3)
// Os nomes acendem agrupados por área, em 4 colunas. No fim, as colunas deslizam
// e se juntam num bloco único, contornado como uma sala. Sem nós, sem linhas de rede.
// O layout se adapta se a lista de participantes mudar (fonte e colunas).
// =============================================================================
const AREA = {x0: 96, x1: 1824, yRotulo: 236, yNomes: 318, yMax: 650};

let ctxMedida: CanvasRenderingContext2D | null = null;
const medir = (txt: string, px: number, espacamentoEm = 0) => {
  if (!ctxMedida) ctxMedida = document.createElement('canvas').getContext('2d');
  ctxMedida!.font = `${px}px ${FONTE}`;
  return ctxMedida!.measureText(txt).width + espacamentoEm * px * txt.length;
};

type Nome = {nome: string; grupo: number; linha: number; sub: number; ordem: number};
export type LayoutSala = {
  grupos: {nome: string; largura: number; xAberto: number; xJunto: number; cols: number; larNome: number}[];
  nomes: Nome[]; fonteNome: number; fonteRotulo: number; linhaH: number; linhas: number; blocoX: number; blocoL: number;
};

export const layoutSala = (): LayoutSala => {
  const as = areas();
  const membros = as.map((a) => participantes.filter((p) => p.area === a));
  for (const [fonteNome, linhaH, fonteRotulo] of [[24, 46, 16], [22, 42, 15], [20, 38, 13], [18, 34, 13]]) {
    const maxLinhas = Math.floor((AREA.yMax - AREA.yNomes) / linhaH) + 1;
    const g0 = as.map((a, g) => {
      const cols = Math.ceil(membros[g].length / maxLinhas);
      const larNome = Math.max(...membros[g].map((p) => medir(p.nome, fonteNome)));
      const larRotulo = medir(a.toUpperCase(), fonteRotulo, 0.25) + 54;
      return {nome: a, cols, larNome, largura: Math.max(larRotulo, cols * larNome + (cols - 1) * 28)};
    });
    const soma = g0.reduce((s, g) => s + g.largura, 0);
    const vao = as.length > 1 ? (AREA.x1 - AREA.x0 - soma) / (as.length - 1) : 0;
    if (vao < 28) continue;
    // aberto: colunas espalhadas pela tela; junto: colunas encostadas e centralizadas (a "sala")
    const vaoJunto = 26;
    const blocoL = soma + vaoJunto * (as.length - 1);
    const blocoX = (AREA.x0 + AREA.x1) / 2 - blocoL / 2;
    let xa = AREA.x0, xj = blocoX;
    const grupos = g0.map((g) => {
      const r = {...g, xAberto: xa, xJunto: xj};
      xa += g.largura + vao;
      xj += g.largura + vaoJunto;
      return r;
    });
    const nomes: Nome[] = [];
    let linhas = 0;
    membros.forEach((m, g) => {
      const porCol = Math.ceil(m.length / grupos[g].cols);
      m.forEach((p, k) => {
        nomes.push({nome: p.nome, grupo: g, linha: k % porCol, sub: Math.floor(k / porCol), ordem: nomes.length});
        linhas = Math.max(linhas, (k % porCol) + 1);
      });
    });
    return {grupos, nomes, fonteNome, fonteRotulo, linhaH, linhas, blocoX, blocoL};
  }
  throw new Error('Os nomes não cabem na tela: reduza a lista ou divida em mais telas.');
};

// junta: 0 = colunas espalhadas, 1 = bloco único
export const Sala: React.FC<{t: number; L: LayoutSala; tNomes: number[]; tRotulos: number[]; junta: number; tMoldura?: number}> = ({
  t, L, tNomes, tRotulos, junta, tMoldura = 1e9,
}) => {
  const xG = (g: number) => lerp(L.grupos[g].xAberto, L.grupos[g].xJunto, junta);
  const yFim = AREA.yNomes + (L.linhas - 1) * L.linhaH;
  const mold = prog(t, tMoldura, 0.8);
  const pad = 40;
  const mx = L.blocoX - pad, my = AREA.yRotulo - 44, mw = L.blocoL + pad * 2, mh = yFim - my + 52;
  // ao se juntar, o bloco também se fecha no centro (escala), para o movimento ficar claro
  const escala = lerp(1, 0.84, junta); // nomes nunca abaixo de 20 px
  const cy = (my + my + mh) / 2;
  return (
    <div style={{position: 'absolute', inset: 0, transform: `scale(${escala})`, transformOrigin: `960px ${cy}px`}}>
      {mold > 0 && (
        <Svg>
          <rect x={mx} y={my} width={mw} height={mh} rx={6} fill={CORES.marinho2} fillOpacity={0.28 * mold} />
          <rect x={mx} y={my} width={mw} height={mh} rx={6} fill="none" stroke={CORES.aco} strokeWidth={1.5}
            strokeDasharray={`${2 * (mw + mh)}`} strokeDashoffset={2 * (mw + mh) * (1 - mold)} />
        </Svg>
      )}
      {L.grupos.map((g, gi) => (
        <div key={g.nome} style={{position: 'absolute', left: 0, top: 0, transform: `translateX(${xG(gi) - g.xAberto}px)`}}>
          <Rotulo texto={g.nome} x={g.xAberto} y={AREA.yRotulo} p={prog(t, tRotulos[gi], 0.45)} tamanho={L.fonteRotulo} cor={CORES.cinzaClaro} />
        </div>
      ))}
      {L.nomes.map((n) => {
        const t0 = tNomes[n.ordem];
        const p = prog(t, t0, 0.25);
        if (p <= 0) return null;
        const g = L.grupos[n.grupo];
        const quente = Math.max(0, 1 - (t - t0) / 0.8);
        return (
          <div
            key={n.nome}
            style={{
              position: 'absolute', left: xG(n.grupo) + n.sub * (g.larNome + 28), top: AREA.yNomes + n.linha * L.linhaH - L.fonteNome * 0.62,
              fontSize: L.fonteNome, whiteSpace: 'nowrap', opacity: p, transform: `translateX(${(1 - p) * -10}px)`,
              color: quente > 0.05 ? `rgb(255,${Math.round(255 - 92 * quente)},${Math.round(255 - 186 * quente)})` : CORES.branco,
              textShadow: quente > 0.05 ? `0 0 ${14 * quente}px rgba(248,163,69,${0.9 * quente})` : 'none',
            }}
          >
            {n.nome}
          </div>
        );
      })}
    </div>
  );
};

export const temposSala = () => {
  const base = inicioCena(5);
  const fr = frasesCena(5);
  const L = layoutSala();
  const tNomes = tempoNomesC6().map((x) => x - base);
  const tRotulos = L.grupos.map((_, g) => (fr[g + 1] ? fr[g + 1].ini : fr[0].fim + g));
  const tJunta = fr[fr.length - 1].ini; // "Olhares diferentes, na mesma sala."
  return {L, tNomes, tRotulos, tJunta};
};

export const Cena06: React.FC = () => {
  const t = useT();
  const {L, tNomes, tRotulos, tJunta} = temposSala();
  const junta = ease(Math.min(1, Math.max(0, (t - tJunta) / 0.9)));
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
      <Sala t={t} L={L} tNomes={tNomes} tRotulos={tRotulos} junta={junta} tMoldura={tJunta + 0.7} />
      <Texto x={960} y={790} alinhar="centro" largura={1600} p={prog(t, tJunta + 0.9, 0.5)} estilo={{fontSize: 50}}>
        {participantes.length} participantes. {L.grupos.length} áreas. <span style={{color: CORES.aco}}>Três dias juntos.</span>
      </Texto>
    </Fundo>
  );
};
