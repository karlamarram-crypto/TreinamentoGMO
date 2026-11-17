import React from 'react';
import {BATIDA, CORES, FONTE, MUSICA, frasesCena, inicioCena, tempoNomesC6} from '../config';
import {Montagem} from '../componentes/imagens';
import {AbsoluteFill} from 'remotion';
import {participantes, frentes} from '../data/participantes';
import {Fundo, Linha, PulsoNaLinha, Rotulo, Silhueta, Svg, Texto, diagonal, lerp, pontoNaPolilinha, prog, useT} from '../componentes/base';
import {PESSOAS} from './Cena03';

// ---------- layout adaptável da rede (muda sozinho se a lista de participantes mudar) ----------
const AREA = {x0: 96, x1: 1824, yRotulo: 236, yNomes: 318, yMax: 650, yBarra: 728, yBarraSobe: 690};

let ctxMedida: CanvasRenderingContext2D | null = null;
const medir = (txt: string, px: number, espacamentoEm = 0) => {
  if (!ctxMedida) ctxMedida = document.createElement('canvas').getContext('2d');
  ctxMedida!.font = `${px}px ${FONTE}`;
  return ctxMedida!.measureText(txt).width + espacamentoEm * px * txt.length;
};

export type No = {x: number; y: number; nome: string; grupo: number; ordem: number};
export type LayoutRede = {grupos: {nome: string; x: number; largura: number; nos: No[]}[]; nos: No[]; fonteNome: number; fonteRotulo: number};

export const layoutRede = (): LayoutRede => {
  const fs = frentes();
  const membros = fs.map((f) => participantes.filter((p) => p.frente === f));
  for (const [fonteNome, linhaH, fonteRotulo] of [[22, 46, 16], [20, 40, 15], [20, 40, 13], [18, 34, 13]]) {
    const maxLinhas = Math.floor((AREA.yMax - AREA.yNomes) / linhaH) + 1;
    const larguras = fs.map((f, g) => {
      const cols = Math.ceil(membros[g].length / maxLinhas);
      const larNome = Math.max(...membros[g].map((p) => medir(p.nome, fonteNome)));
      const larRotulo = medir(f.toUpperCase(), fonteRotulo, 0.25) + 54;
      return {cols, larNome, largura: Math.max(larRotulo, cols * (28 + larNome) + (cols - 1) * 28)};
    });
    const soma = larguras.reduce((a, l) => a + l.largura, 0);
    const vao = fs.length > 1 ? (AREA.x1 - AREA.x0 - soma) / (fs.length - 1) : 0;
    if (vao < 28) continue;
    let x = AREA.x0;
    const nos: No[] = [];
    const grupos = fs.map((nome, g) => {
      const {cols, larNome, largura} = larguras[g];
      const porCol = Math.ceil(membros[g].length / cols);
      const nosG = membros[g].map((p, k) => {
        const c = Math.floor(k / porCol), r = k % porCol;
        const no = {x: x + 8 + c * (28 + larNome + 28), y: AREA.yNomes + r * linhaH, nome: p.nome, grupo: g, ordem: nos.length};
        nos.push(no);
        return no;
      });
      const grupo = {nome, x, largura, nos: nosG};
      x += largura + vao;
      return grupo;
    });
    return {grupos, nos, fonteNome, fonteRotulo};
  }
  throw new Error('Os nomes não cabem na tela: reduza a lista ou divida em mais telas.');
};

// tempos: rótulo de cada frente quando a locução a cita; nomes um a um, a cada 0,25 s
export const temposRede = (L: LayoutRede) => {
  const fr = frasesCena(5);
  const rot = L.grupos.map((_, g) => (fr[g + 1] ? fr[g + 1].ini : fr[0].fim + g * 1.2));
  const tn = tempoNomesC6().map((x) => x - inicioCena(5));
  const nome = L.nos.map((n) => tn[n.ordem]);
  return {fr, rot, nome, final: fr[fr.length - 1].ini};
};

// cada frente tem uma "espinha" vertical que desce até abaixo dos nomes;
// as frentes se ligam por diagonais nessa faixa de baixo, sem cruzar nenhum nome
const espinha = (g: LayoutRede['grupos'][number]) => g.nos[0].x;
const caminhoPulso = (L: LayoutRede): [number, number][] => {
  const pts: [number, number][] = [];
  L.grupos.forEach((g, i) => {
    const x = espinha(g);
    if (i > 0) pts.push([x, AREA.yBarraSobe]);
    pts.push([x, g.nos[0].y]);
    g.nos.filter((n) => n.x === x).forEach((n) => pts.push([n.x, n.y]));
    pts.push([x, AREA.yBarra]);
  });
  return pts;
};

export const Rede: React.FC<{t: number; L: LayoutRede; tempos: ReturnType<typeof temposRede>; chegada?: number; base?: number}> = ({t, L, tempos, chegada = 1, base = 0}) => {
  const {rot, nome, final} = tempos;
  const kPulso = prog(t, final, 2.4);
  const pts = caminhoPulso(L);
  // no fim, a rede inteira pulsa junto com a batida
  const tg = base + t;
  const desdeBatida = (((tg - MUSICA.origem) % BATIDA) + BATIDA) % BATIDA;
  const batida = t > final + 0.4 ? Math.exp(-desdeBatida * 9) : 0;
  return (
    <>
      <Svg>
        {/* ligações entre frentes: diagonais finas abaixo dos nomes */}
        {L.grupos.map((g, i) => {
          const x = espinha(g);
          const ult = g.nos.filter((n) => n.x === x).pop()!;
          const p = prog(t, rot[i] + 0.4, 1.0);
          const prox = L.grupos[i + 1];
          return (
            <g key={g.nome}>
              <Linha x1={x} y1={ult.y} x2={x} y2={AREA.yBarra} p={p} largura={1.5} opacidade={0.45} />
              {i > 0 && <Linha x1={x} y1={AREA.yBarraSobe} x2={x} y2={AREA.yBarra} p={p} largura={1.5} opacidade={0.45} />}
              {prox && (
                <Linha x1={x} y1={AREA.yBarra} x2={espinha(prox)} y2={AREA.yBarraSobe} p={prog(t, rot[i + 1] + 0.2, 1.2)} largura={1.5} opacidade={0.55} />
              )}
            </g>
          );
        })}
        {/* ligação vertical dentro de cada frente */}
        {L.grupos.map((g, gi) =>
          g.nos.slice(1).map((n, k) => (
            <Linha key={n.nome} x1={g.nos[k].x} y1={g.nos[k].x === n.x ? g.nos[k].y : AREA.yNomes} x2={n.x} y2={n.y} p={prog(t, nome[n.ordem] - 0.1, 0.3)} largura={1.5} opacidade={0.5} />
          ))
        )}
        {/* nós: vêm das silhuetas da cena anterior */}
        {L.nos.map((n, i) => {
          const s = PESSOAS[i % PESSOAS.length];
          const k = chegada;
          const x = lerp(s.x, n.x, k), y = lerp(s.y - 62, n.y, k);
          const aceso = t > nome[n.ordem] ? 1 : 0.55;
          const brilho = Math.max(0, 1 - (t - nome[n.ordem]) / 0.6) * (t >= nome[n.ordem] ? 1 : 0);
          return (
            <g key={n.nome}>
              {brilho > 0 && <circle cx={x} cy={y} r={7 + 16 * brilho} fill={CORES.laranjaBrilho} opacity={0.5 * brilho} />}
              <circle cx={x} cy={y} r={7 * (1 + 0.45 * batida)} fill={brilho > 0.3 ? CORES.laranjaBrilho : CORES.branco} fillOpacity={aceso} stroke={CORES.aco} strokeWidth={1.5} />
            </g>
          );
        })}
        {kPulso > 0 && kPulso < 1 && (() => {
          const [x, y] = pontoNaPolilinha(pts, kPulso);
          const [xr, yr] = pontoNaPolilinha(pts, Math.max(0, kPulso - 0.04));
          return <PulsoNaLinha x1={xr} y1={yr} x2={x} y2={y} k={0.999} rastro={1} id="c6" />;
        })()}
      </Svg>
      {L.grupos.map((g, gi) => (
        <Rotulo key={g.nome} texto={g.nome} x={g.x} y={AREA.yRotulo} p={prog(t, rot[gi], 0.45)} tamanho={L.fonteRotulo} cor={CORES.cinzaClaro} />
      ))}
      {L.nos.map((n) => {
        const p = prog(t, nome[n.ordem], 0.25);
        if (p <= 0) return null;
        const quente = Math.max(0, 1 - (t - nome[n.ordem]) / 0.8);
        return (
          <div key={n.nome} style={{position: 'absolute', left: n.x + 20, top: n.y - L.fonteNome * 0.62, fontSize: L.fonteNome, whiteSpace: 'nowrap', opacity: p, transform: `translateX(${(1 - p) * -10}px)`,
            color: quente > 0.05 ? `rgb(255,${Math.round(255 - 92 * quente)},${Math.round(255 - 186 * quente)})` : CORES.branco, textShadow: quente > 0.05 ? `0 0 ${14 * quente}px rgba(248,163,69,${0.9 * quente})` : 'none'}}>
            {n.nome}
          </div>
        );
      })}
    </>
  );
};

export const Cena06: React.FC = () => {
  const t = useT();
  const L = layoutRede();
  const tempos = temposRede(L);
  const chegada = prog(t, 0.1, 0.8);
  const nFrentes = L.grupos.length;
  return (
    <Fundo>
      <AbsoluteFill style={{opacity: 0.22}}>
        <Montagem planos={[{t: 0, nome: 'linhas_transmissao_noite', inicio: 0, corte: true}, {t: 8, nome: 'torres_silhueta', inicio: 2}]} fim={16} veu={0.2} />
      </AbsoluteFill>
      <Svg>
        <Linha {...diagonal(-80)} p={prog(t, 0.4, 2)} largura={1} opacidade={0.18} />
        <Linha {...diagonal(1560)} p={prog(t, 0.6, 2)} largura={1} opacidade={0.18} />
        {PESSOAS.map((s, i) => (
          <g key={i} opacity={1 - prog(t, 0, 0.7)}>
            <Silhueta x={s.x} y={s.y} cor={CORES.branco} />
          </g>
        ))}
      </Svg>
      <Rede t={t} L={L} tempos={tempos} chegada={chegada} base={inicioCena(5)} />
      <Texto x={96} y={790} p={prog(t, tempos.final + 0.1, 0.5)} estilo={{fontSize: 50}}>
        {participantes.length} pessoas. {nFrentes} frentes. <span style={{color: CORES.aco}}>Uma mesma rede.</span>
      </Texto>
    </Fundo>
  );
};
