import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {AREA_SEGURA, CORES, FONTE, LARGURA, ALTURA} from '../config';

// Easing do briefing: ease-in-out cúbico. Nada de bounce, nada de giro.
export const ease = Easing.inOut(Easing.cubic);

export const useT = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return f / fps;
};

// progresso 0..1 entre a e a+d (segundos), com easing
export const prog = (t: number, a: number, d: number) =>
  interpolate(t, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});

export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

// Inclinação das diagonais A&M (~60°). dx por unidade de altura.
export const DIAG = 1 / Math.tan((60 * Math.PI) / 180);

// Entrada por deslizamento curto na direção da diagonal + fade (e saída no sentido oposto)
export const entrada = (p: number, dist = 28, sai = 0): React.CSSProperties => ({
  opacity: p * (1 - sai),
  transform: `translate(${(-(1 - p) + sai) * dist * 0.5}px, ${((1 - p) - sai) * dist * 0.866}px)`,
});

export const Fundo: React.FC<{children?: React.ReactNode}> = ({children}) => (
  <AbsoluteFill style={{backgroundColor: CORES.marinho, fontFamily: FONTE, color: CORES.branco}}>{children}</AbsoluteFill>
);

// Camada SVG de tela cheia
export const Svg: React.FC<{children?: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <svg width={LARGURA} height={ALTURA} viewBox={`0 0 ${LARGURA} ${ALTURA}`} style={{position: 'absolute', inset: 0, ...style}}>
    {children}
  </svg>
);

// Linha que "se desenha" (stroke-dashoffset)
export const Linha: React.FC<{
  x1: number; y1: number; x2: number; y2: number; p: number;
  cor?: string; largura?: number; opacidade?: number; tracejado?: string;
}> = ({x1, y1, x2, y2, p, cor = CORES.branco, largura = 2, opacidade = 1, tracejado}) => {
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (p <= 0) return null;
  return (
    <line
      x1={x1} y1={y1} x2={x2} y2={y2}
      stroke={cor} strokeWidth={largura} strokeOpacity={opacidade} strokeLinecap="round"
      strokeDasharray={tracejado ?? `${len} ${len}`}
      strokeDashoffset={tracejado ? 0 : len * (1 - p)}
    />
  );
};

// Linha diagonal a 60° que atravessa a tela, definida pelo x onde cruza a base
export const diagonal = (xBase: number, yBase = ALTURA + 30, yTopo = -30) => ({
  x1: xBase, y1: yBase, x2: xBase + (yBase - yTopo) * DIAG, y2: yTopo,
});

// Pulso de energia (o único uso forte do laranja)
export const Pulso: React.FC<{x: number; y: number; escala?: number; opacidade?: number; id?: string}> = ({
  x, y, escala = 1, opacidade = 1, id = 'p',
}) => {
  if (opacidade <= 0.01) return null;
  const gid = `brilho-${id}`;
  return (
    <g opacity={opacidade}>
      <defs>
        <radialGradient id={gid}>
          <stop offset="0" stopColor={CORES.laranjaBrilho} stopOpacity={0.75} />
          <stop offset="1" stopColor={CORES.laranjaBrilho} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={x} cy={y} r={26 * escala} fill={`url(#${gid})`} />
      <circle cx={x} cy={y} r={6.5 * escala} fill={CORES.laranja} />
    </g>
  );
};

// Pulso com rastro ao longo de um segmento (k = posição 0..1)
export const PulsoNaLinha: React.FC<{
  x1: number; y1: number; x2: number; y2: number; k: number; opacidade?: number; id?: string; rastro?: number;
}> = ({x1, y1, x2, y2, k, opacidade = 1, id = 'pl', rastro = 0.12}) => {
  if (k <= 0 || k >= 1 || opacidade <= 0.01) return null;
  const x = lerp(x1, x2, k), y = lerp(y1, y2, k);
  const k0 = Math.max(0, k - rastro);
  const xr = lerp(x1, x2, k0), yr = lerp(y1, y2, k0);
  const gid = `rastro-${id}`;
  return (
    <g>
      <defs>
        <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1={xr} y1={yr} x2={x} y2={y}>
          <stop offset="0" stopColor={CORES.laranja} stopOpacity={0} />
          <stop offset="1" stopColor={CORES.laranja} stopOpacity={0.9 * opacidade} />
        </linearGradient>
      </defs>
      <line x1={xr} y1={yr} x2={x} y2={y} stroke={`url(#${gid})`} strokeWidth={3} strokeLinecap="round" />
      <Pulso x={x} y={y} opacidade={opacidade} id={id} />
    </g>
  );
};

// Pulso ao longo de uma polilinha
export const pontoNaPolilinha = (pts: [number, number][], k: number): [number, number] => {
  const seg: number[] = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    seg.push(d);
    total += d;
  }
  let alvo = Math.max(0, Math.min(1, k)) * total;
  for (let i = 1; i < pts.length; i++) {
    if (alvo <= seg[i - 1]) {
      const r = seg[i - 1] ? alvo / seg[i - 1] : 0;
      return [lerp(pts[i - 1][0], pts[i][0], r), lerp(pts[i - 1][1], pts[i][1], r)];
    }
    alvo -= seg[i - 1];
  }
  return pts[pts.length - 1];
};

// Plano translúcido recortado em diagonal (trapézio). Lados inclinados a 60°.
export const Plano: React.FC<{x: number; y: number; largura: number; altura: number; cor?: string; opacidade?: number; p?: number}> = ({
  x, y, largura, altura, cor = CORES.marinho2, opacidade = 0.3, p = 1,
}) => {
  const d = altura * DIAG;
  const dx = (1 - p) * -40, dy = (1 - p) * 70;
  const pts = [
    [x + d, y], [x + d + largura, y], [x + largura, y + altura], [x, y + altura],
  ].map(([a, b]) => `${a + dx},${b + dy}`).join(' ');
  return <polygon points={pts} fill={cor} fillOpacity={opacidade * p} />;
};

// Rótulo pequeno: linha horizontal desenhada (~40 px) + caixa alta espaçada em azul aço
export const Rotulo: React.FC<{
  texto: string; x: number; y: number; p: number; alinhar?: 'esquerda' | 'direita'; tamanho?: number; cor?: string; sai?: number;
}> = ({texto, x, y, p, alinhar = 'esquerda', tamanho = 18, cor = CORES.aco, sai = 0}) => {
  if (p <= 0) return null;
  const linha = <div style={{width: 40 * Math.min(1, p * 1.6), height: 2, background: cor, flex: 'none'}} />;
  return (
    <div
      style={{
        position: 'absolute', top: y, ...(alinhar === 'esquerda' ? {left: x} : {right: LARGURA - x}),
        display: 'flex', alignItems: 'center', gap: 14, flexDirection: alinhar === 'esquerda' ? 'row' : 'row-reverse',
        ...entrada(p, 20, sai),
      }}
    >
      {linha}
      <span style={{fontSize: tamanho, letterSpacing: '0.25em', textTransform: 'uppercase', color: cor, whiteSpace: 'nowrap'}}>
        {texto}
      </span>
    </div>
  );
};

// Texto posicionado com entrada diagonal
export const Texto: React.FC<{
  x: number; y: number; p: number; sai?: number; alinhar?: 'esquerda' | 'direita' | 'centro'; largura?: number;
  estilo?: React.CSSProperties; children: React.ReactNode;
}> = ({x, y, p, sai = 0, alinhar = 'esquerda', largura, estilo, children}) => {
  if (p <= 0 || sai >= 1) return null;
  const pos: React.CSSProperties =
    alinhar === 'esquerda' ? {left: x} : alinhar === 'direita' ? {right: LARGURA - x} : {left: x - (largura ?? 1200) / 2};
  return (
    <div
      style={{
        position: 'absolute', top: y, width: largura, textAlign: alinhar === 'esquerda' ? 'left' : alinhar === 'direita' ? 'right' : 'center',
        fontWeight: 400, lineHeight: 1.18, ...pos, ...entrada(p, 26, sai), ...estilo,
      }}
    >
      {children}
    </div>
  );
};

// Card cinza claro com borda azul aço
export const Card: React.FC<{
  x: number; y: number; largura: number; altura: number; p?: number; sai?: number; destaque?: number; children: React.ReactNode;
  estilo?: React.CSSProperties;
}> = ({x, y, largura, altura, p = 1, sai = 0, destaque = 0, children, estilo}) => {
  if (p <= 0 || sai >= 1) return null;
  return (
    <div
      style={{
        position: 'absolute', left: x, top: y, width: largura, height: altura, boxSizing: 'border-box',
        background: CORES.cinzaClaro, border: `${1.5 + destaque * 1.5}px solid ${CORES.aco}`,
        color: CORES.marinho, padding: '22px 26px', ...entrada(p, 34, sai), ...estilo,
      }}
    >
      {children}
    </div>
  );
};

// Silhueta mínima (cabeça + ombros), na paleta
export const Silhueta: React.FC<{x: number; y: number; cor: string; escala?: number; opacidade?: number}> = ({
  x, y, cor, escala = 1, opacidade = 1,
}) => (
  <g transform={`translate(${x} ${y}) scale(${escala})`} opacity={opacidade}>
    <circle cx={0} cy={-62} r={15} fill={cor} />
    <path d="M -28 0 L -28 -24 Q -28 -42 -12 -42 L 12 -42 Q 28 -42 28 -24 L 28 0 Z" fill={cor} />
  </g>
);

// Logos (assets/)
export const LogoAM: React.FC<{p: number; x?: number; y?: number; altura?: number}> = ({p, x = AREA_SEGURA.x, y = AREA_SEGURA.y, altura = 40}) => (
  <Img src={staticFile('logo_AM_Performance_branco.png')} style={{position: 'absolute', left: x, top: y, height: altura, opacity: p}} />
);
export const LogoONS: React.FC<{p: number; x: number; y?: number; altura?: number}> = ({p, x, y = AREA_SEGURA.y, altura = 40}) => (
  <Img src={staticFile('logo_ONS_cinza.png')} style={{position: 'absolute', left: x, top: y, height: altura, opacity: p}} />
);

// Ícones lineares mínimos (viewBox 0 0 64 64)
export const Icone: React.FC<{nome: string; x: number; y: number; tamanho?: number; cor?: string; largura?: number}> = ({
  nome, x, y, tamanho = 64, cor = CORES.marinho, largura = 2.5,
}) => {
  const s = tamanho / 64;
  const p = {fill: 'none', stroke: cor, strokeWidth: largura / s, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const};
  const formas: Record<string, React.ReactNode> = {
    casa: (<><path d="M8 30 L32 10 L56 30" {...p} /><path d="M14 26 V54 H50 V26" {...p} /><path d="M27 54 V40 H37 V54" {...p} /></>),
    industria: (<><path d="M6 54 V30 L20 38 V30 L34 38 V30 L48 38 V12 H56 V54 Z" {...p} /><path d="M14 46 H20 M28 46 H34 M42 46 H48" {...p} /></>),
    hospital: (<><rect x="10" y="12" width="44" height="42" {...p} /><path d="M32 22 V44 M21 33 H43" {...p} /></>),
    organograma: (<><rect x="24" y="8" width="16" height="12" {...p} /><rect x="6" y="44" width="16" height="12" {...p} /><rect x="42" y="44" width="16" height="12" {...p} /><path d="M32 20 V32 M14 44 V32 H50 V44" {...p} /></>),
    regras: (<><path d="M14 6 H40 L50 16 V58 H14 Z" {...p} /><path d="M40 6 V16 H50" {...p} /><path d="M22 28 H42 M22 36 H42 M22 44 H34" {...p} /></>),
    sistemas: (<><rect x="6" y="10" width="52" height="34" {...p} /><path d="M24 54 H40 M32 44 V54" {...p} /><path d="M14 34 L24 24 L32 30 L46 18" {...p} /></>),
    trabalho: (<><circle cx="20" cy="20" r="7" {...p} /><circle cx="44" cy="20" r="7" {...p} /><path d="M8 50 Q8 34 20 34 Q32 34 32 50 M32 50 Q32 34 44 34 Q56 34 56 50" {...p} /></>),
  };
  return <g transform={`translate(${x} ${y}) scale(${s})`}>{formas[nome]}</g>;
};
