import React from 'react';
import {AbsoluteFill, OffthreadVideo, Img, Sequence, staticFile, getStaticFiles, useVideoConfig} from 'remotion';
import {ALTURA, CORES, LARGURA} from '../config';
import {DIAG, lerp, prog, useT} from './base';

// =============================================================================
// Imagens com tratamento duotone A&M
// - Se existir assets/clips/<nome>.mp4 (ou assets/fotos/<nome>.jpg), usa o arquivo
//   real com filtro duotone (P&B, sombras em #002A46, luzes em #5E8AB3/branco).
// - Se não existir, desenha um equivalente procedural na mesma paleta.
// Sempre com Ken Burns (zoom 1.0 a 1.08), grão e véu marinho para o texto ler bem.
// =============================================================================

const existe = (caminho: string) => {
  try {
    return getStaticFiles().some((f) => f.name === caminho);
  } catch {
    return false;
  }
};

// Filtros SVG: luminância → rampa de cores da marca
// duotone-am: marinho → azul aço → branco (pessoas, cidade, escritório)
// luz-am: marinho → azul aço → laranja → branco (só lâmpadas e energia: o laranja entra como luz)
export const FiltroDuotone: React.FC = () => (
  <svg width={0} height={0} style={{position: 'absolute'}}>
    <filter id="duotone-am" colorInterpolationFilters="sRGB">
      <feColorMatrix type="matrix" values="0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0 0 0 1 0" />
      <feComponentTransfer>
        <feFuncR type="table" tableValues="0 0.2 0.369 1" />
        <feFuncG type="table" tableValues="0.165 0.329 0.541 1" />
        <feFuncB type="table" tableValues="0.275 0.427 0.702 1" />
      </feComponentTransfer>
    </filter>
    <filter id="luz-am" colorInterpolationFilters="sRGB">
      <feColorMatrix type="matrix" values="0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0 0 0 1 0" />
      <feComponentTransfer>
        <feFuncR type="table" tableValues="0 0.2 0.369 0.969 1" />
        <feFuncG type="table" tableValues="0.165 0.329 0.541 0.545 1" />
        <feFuncB type="table" tableValues="0.275 0.427 0.702 0.082 0.9" />
      </feComponentTransfer>
    </filter>
  </svg>
);

export const Grao: React.FC<{seed: number; opacidade?: number}> = ({seed, opacidade = 0.12}) => (
  <svg width={LARGURA} height={ALTURA} style={{position: 'absolute', inset: 0, opacity: opacidade, mixBlendMode: 'overlay'}}>
    <filter id={`grao-${seed}`}>
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={seed} />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width="100%" height="100%" filter={`url(#grao-${seed})`} />
  </svg>
);

export type NomeImagem = string;

// Clipe/foto com Ken Burns. k = progresso 0..1 dentro do tempo do clipe.
// inicio = segundo do clipe onde começar; tratamento = 'duotone' (padrão) ou 'luz'.
export const Imagem: React.FC<{
  nome: NomeImagem; k: number; veu?: number; t: number; origem?: string; inicio?: number; tratamento?: 'duotone' | 'luz'; velocidade?: number;
}> = ({nome, k, veu = 0.4, t, origem = '50% 50%', inicio = 0, tratamento = 'duotone', velocidade = 1}) => {
  const {fps} = useVideoConfig();
  const zoom = lerp(1.0, 1.08, k);
  const clip = `clips/${nome}.mp4`;
  const foto = `fotos/${nome}.jpg`;
  const filtro = `url(#${tratamento === 'luz' ? 'luz-am' : 'duotone-am'}) contrast(1.12)`;
  let conteudo: React.ReactNode;
  if (existe(clip)) conteudo = <OffthreadVideo src={staticFile(clip)} muted trimBefore={Math.round(inicio * fps)} playbackRate={velocidade} style={{width: '100%', height: '100%', objectFit: 'cover', filter: filtro}} />;
  else if (existe(foto)) conteudo = <Img src={staticFile(foto)} style={{width: '100%', height: '100%', objectFit: 'cover', filter: filtro}} />;
  else conteudo = <Procedural nome={nome} t={t} />;
  return (
    <AbsoluteFill style={{overflow: 'hidden', backgroundColor: CORES.marinho}}>
      <FiltroDuotone />
      <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: origem}}>{conteudo}</AbsoluteFill>
      <Grao seed={nome.length} />
      <AbsoluteFill style={{backgroundColor: CORES.marinho, opacity: veu}} />
    </AbsoluteFill>
  );
};

// Montagem: lista de planos (tempo local de entrada); cada um entra com wipe diagonal
// sobre o anterior e tem seu próprio Ken Burns. O vídeo de cada plano começa do seu "inicio".
export type Plano = {t: number; nome: string; inicio?: number; tratamento?: 'duotone' | 'luz'; veu?: number; corte?: boolean};
export const Montagem: React.FC<{planos: Plano[]; fim: number; veu?: number}> = ({planos, fim, veu = 0.45}) => {
  const {fps} = useVideoConfig();
  return (
    <>
      {planos.map((p, i) => {
        const ate = (planos[i + 1] ? planos[i + 1].t + 0.25 : fim);
        const dur = Math.max(1, Math.round((ate - p.t) * fps));
        return (
          <Sequence key={i} from={Math.round(p.t * fps)} durationInFrames={dur} layout="none" name={`plano ${p.nome}`}>
            <PlanoMontagem p={p} dur={(planos[i + 1] ? planos[i + 1].t : fim) - p.t} primeiro={i === 0} veu={p.veu ?? veu} />
          </Sequence>
        );
      })}
    </>
  );
};
const PlanoMontagem: React.FC<{p: Plano; dur: number; primeiro: boolean; veu: number}> = ({p, dur, primeiro, veu}) => {
  const t = useT();
  const img = <Imagem nome={p.nome} k={Math.min(1, t / Math.max(0.5, dur))} t={t} veu={veu} inicio={p.inicio} tratamento={p.tratamento} />;
  if (primeiro || p.corte) return <AbsoluteFill>{img}</AbsoluteFill>;
  return <WipeDiagonal k={prog(t, 0, 0.18)}>{img}</WipeDiagonal>;
};

// ---------------- equivalentes procedurais (paleta A&M) ----------------
const ruido = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const Procedural: React.FC<{nome: NomeImagem; t: number}> = ({nome, t}) => {
  const C = CORES;
  const fundo = (
    <defs>
      <linearGradient id={`ceu-${nome}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#0B3A5C" />
        <stop offset="1" stopColor={C.marinho} />
      </linearGradient>
      <radialGradient id={`luz-${nome}`} cx="0.5" cy="0.35" r="0.7">
        <stop offset="0" stopColor={C.aco} stopOpacity={0.55} />
        <stop offset="1" stopColor={C.marinho} stopOpacity={0} />
      </radialGradient>
    </defs>
  );
  let corpo: React.ReactNode = null;

  if (nome === 'sala_controle') {
    // parede de telas em perspectiva + operadores de costas
    const telas = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 7; c++) {
        const x = 120 + c * 245, y = 120 + r * 150;
        const brilho = 0.45 + 0.4 * ruido(r * 7 + c + Math.floor(t * 3));
        telas.push(
          <g key={`${r}-${c}`}>
            <rect x={x} y={y} width={230} height={138} fill={C.marinho2} stroke={C.marinho} strokeWidth={4} />
            <polyline fill="none" stroke={C.cinzaClaro} strokeOpacity={brilho} strokeWidth={2.5}
              points={Array.from({length: 10}, (_, i) => `${x + 12 + i * 23},${y + 90 - 50 * ruido(r * 31 + c * 7 + i + Math.floor(t * 2))}`).join(' ')} />
            <rect x={x + 12} y={y + 12} width={70} height={8} fill={C.aco} opacity={0.8} />
          </g>,
        );
      }
    }
    corpo = (
      <>
        <rect width="100%" height="100%" fill={C.marinho} />
        <rect width="100%" height="100%" fill={`url(#luz-${nome})`} />
        {telas}
        <rect x={0} y={600} width={1920} height={480} fill="#001B30" />
        {[300, 620, 960, 1300, 1620].map((x, i) => (
          <g key={x} fill="#00121F">
            <ellipse cx={x} cy={830} rx={110} ry={70} />
            <circle cx={x} cy={735} r={48} />
            <rect x={x - 230} y={880} width={460} height={40} fill={C.marinho2} />
            <rect x={x - 90} y={790} width={180} height={90} fill={C.aco} opacity={0.35 + 0.2 * ruido(i + Math.floor(t * 4))} />
          </g>
        ))}
      </>
    );
  } else if (nome === 'reuniao') {
    // vista de cima: mesa de reunião, pessoas, papéis e organograma no vidro
    const pessoas = Array.from({length: 10}, (_, i) => {
      const a = (i / 10) * Math.PI * 2;
      return {x: 960 + Math.cos(a) * 560, y: 560 + Math.sin(a) * 300};
    });
    corpo = (
      <>
        <rect width="100%" height="100%" fill="#0A3352" />
        <ellipse cx={960} cy={560} rx={470} ry={220} fill={C.marinho2} stroke={C.aco} strokeWidth={3} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect key={i} x={640 + i * 110} y={480 + (i % 2) * 90} width={80} height={104} fill={C.cinzaClaro} opacity={0.85} transform={`rotate(${(i - 2.5) * 6} ${680 + i * 110} ${530 + (i % 2) * 90})`} />
        ))}
        {pessoas.map((p, i) => (
          <g key={i}>
            <ellipse cx={p.x} cy={p.y} rx={70} ry={52} fill={C.marinho} />
            <circle cx={p.x} cy={p.y} r={30} fill="#08243B" stroke={C.aco} strokeWidth={2} />
          </g>
        ))}
        <g stroke={C.cinzaClaro} strokeWidth={3} fill="none" opacity={0.55}>
          <rect x={860} y={60} width={200} height={60} />
          <path d="M960 120 V160 M640 160 H1280 M640 160 V200 M960 160 V200 M1280 160 V200" />
          <rect x={560} y={200} width={160} height={50} />
          <rect x={880} y={200} width={160} height={50} />
          <rect x={1200} y={200} width={160} height={50} />
        </g>
      </>
    );
  } else if (nome === 'normas') {
    // documentos/normas em close, linhas de texto, marca-texto de luz
    corpo = (
      <>
        <rect width="100%" height="100%" fill="#08304E" />
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`rotate(${-8 + i * 7} 960 540) translate(${-260 + i * 260} ${30 - i * 20})`}>
            <rect x={620} y={140} width={680} height={880} fill={i === 2 ? C.cinzaClaro : C.cinzaAzulado} />
            {Array.from({length: 20}, (_, l) => (
              <rect key={l} x={680} y={220 + l * 38} width={l % 6 === 5 ? 300 : 560 - 40 * ruido(l + i * 20)} height={10} fill={C.marinho} opacity={0.55} />
            ))}
            {i === 2 && <rect x={672} y={406} width={420 * Math.min(1, t * 1.2)} height={24} fill={C.aco} opacity={0.6} />}
          </g>
        ))}
      </>
    );
  } else if (nome === 'sistema') {
    // tela de sistema: painéis, barras, gráfico, cursor
    corpo = (
      <>
        <rect width="100%" height="100%" fill="#082E4B" />
        <rect x={160} y={110} width={1600} height={860} fill={C.marinho} stroke={C.aco} strokeWidth={3} />
        <rect x={160} y={110} width={1600} height={70} fill={C.marinho2} />
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <rect x={200 + i * 390} y={220} width={360} height={170} fill={C.marinho2} />
            <rect x={230 + i * 390} y={250} width={140} height={14} fill={C.cinzaClaro} opacity={0.8} />
            <rect x={230 + i * 390} y={300} width={300 * (0.3 + 0.7 * ruido(i + 4))} height={36} fill={C.aco} />
          </g>
        ))}
        <rect x={200} y={430} width={1100} height={500} fill={C.marinho2} />
        <polyline fill="none" stroke={C.cinzaClaro} strokeWidth={4}
          points={Array.from({length: 24}, (_, i) => `${240 + i * 45},${860 - 340 * (0.2 + 0.8 * (i / 23) * (0.6 + 0.4 * ruido(i)))}`).join(' ')} />
        {Array.from({length: 9}, (_, i) => (
          <rect key={i} x={1340} y={440 + i * 54} width={380} height={40} fill={i === 3 ? C.aco : C.marinho2} />
        ))}
        <path d={`M${1100 + 80 * Math.sin(t * 2)} ${560 + 40 * Math.cos(t * 2)} l0 44 l12 -12 l14 26 l8 -4 l-14 -24 l18 0 z`} fill={C.branco} />
      </>
    );
  } else {
    corpo = <rect width="100%" height="100%" fill={`url(#ceu-${nome})`} />;
  }
  return (
    <svg width={LARGURA} height={ALTURA} viewBox={`0 0 ${LARGURA} ${ALTURA}`}>
      {fundo}
      {corpo}
    </svg>
  );
};

// Wipe diagonal A&M: uma linha branca a 60° atravessa a tela; atrás dela entra a imagem nova
export const WipeDiagonal: React.FC<{k: number; children: React.ReactNode}> = ({k, children}) => {
  if (k <= 0) return null;
  const larg = LARGURA + ALTURA * DIAG + 80;
  const x = -ALTURA * DIAG - 40 + larg * k;
  const poly = `0,0 ${x + ALTURA * DIAG},0 ${x},${ALTURA} 0,${ALTURA}`;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{clipPath: k >= 1 ? undefined : `polygon(${poly.split(' ').map((p) => p.split(',').map((v, i) => `${v}px`).join(' ')).join(',')})`}}>{children}</AbsoluteFill>
      {k < 1 && (
        <svg width={LARGURA} height={ALTURA} style={{position: 'absolute', inset: 0}}>
          <line x1={x} y1={ALTURA} x2={x + ALTURA * DIAG} y2={0} stroke={CORES.branco} strokeWidth={3} />
        </svg>
      )}
    </AbsoluteFill>
  );
};
