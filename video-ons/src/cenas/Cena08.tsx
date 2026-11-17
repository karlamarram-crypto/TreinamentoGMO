import React from 'react';
import {AbsoluteFill} from 'remotion';
import {CORES, frasesCena, inicioCena, naBatida} from '../config';
import {Fundo, Linha, LogoAM, LogoONS, Plano, PulsoNaLinha, Svg, Texto, diagonal, prog, useT} from '../componentes/base';
import {Imagem, WipeDiagonal} from '../componentes/imagens';

// Cena 8 · Fechamento (v2): a cidade acende inteira em "Agora é fazer chegar";
// depois, wipe diagonal para a cartela igual à capa do deck (sóbria, para emendar no slide 1).
const LARG_LOGO_AM = 40 * (2000 / 363);

export const Cena08: React.FC = () => {
  const t = useT();
  const base = inicioCena(7);
  const fr = frasesCena(7);
  const chegar = naBatida(base + fr[1].ini) - base;
  const wipe = fr[2].ini + 0.2;
  const sai = prog(t, wipe - 0.5, 0.4);
  // a cidade: apagada até "chegar", então acende inteira
  const acende = prog(t, chegar, 0.6);
  const flash = t >= chegar && t < chegar + 0.15 ? 0.25 : 0;
  return (
    <Fundo>
      <AbsoluteFill style={{filter: `brightness(${0.35 + 0.95 * acende}) saturate(${1 + 0.3 * acende})`}}>
        <Imagem nome="cidade_noite_aerea" k={Math.min(1, t / 6)} t={t} veu={0.42 - 0.22 * acende} inicio={2} tratamento={acende > 0 ? 'luz' : 'duotone'} />
      </AbsoluteFill>
      {acende > 0 && <AbsoluteFill style={{background: `radial-gradient(circle at 50% 60%, rgba(248,163,69,${0.22 * acende * Math.max(0, 1 - (t - chegar) / 2.5)}), rgba(0,42,70,0) 65%)`}} />}
      <Texto x={960} y={440} alinhar="centro" largura={1400} p={prog(t, fr[0].ini, 0.45)} sai={sai} estilo={{fontSize: 64, textShadow: '0 2px 18px rgba(0,42,70,0.8)'}}>
        A energia já está aqui.
      </Texto>
      <Texto x={960} y={530} alinhar="centro" largura={1400} p={prog(t, chegar - 0.05, 0.35)} sai={sai} estilo={{fontSize: 64, textShadow: '0 2px 18px rgba(0,42,70,0.8)'}}>
        Agora é fazer <span style={{color: CORES.aco}}>chegar</span>.
      </Texto>
      {flash > 0 && <AbsoluteFill style={{backgroundColor: CORES.branco, opacity: flash}} />}
      {/* cartela final, igual à capa do deck */}
      <WipeDiagonal k={prog(t, wipe, 0.5)}>
        <Cartela t={t - wipe} />
      </WipeDiagonal>
    </Fundo>
  );
};

const Cartela: React.FC<{t: number}> = ({t}) => {
  const linhas = [diagonal(1360), diagonal(1440), diagonal(1520)];
  return (
    <AbsoluteFill style={{backgroundColor: CORES.marinho}}>
      <Svg>
        <Plano x={1040} y={0} largura={1100} altura={1080} opacidade={0.22} p={prog(t, 0, 0.6)} />
        <Linha {...linhas[0]} p={prog(t, 0.1, 0.8)} largura={2} />
        <Linha {...linhas[1]} p={prog(t, 0.25, 0.8)} largura={1.5} opacidade={0.85} />
        <Linha {...linhas[2]} p={prog(t, 0.4, 0.8)} largura={1} opacidade={0.7} />
        <PulsoNaLinha {...linhas[0]} k={prog(t, 1.2, 2.0)} id="c8" />
      </Svg>
      <LogoAM p={prog(t, 0.3, 0.5)} />
      <div style={{position: 'absolute', left: 96 + LARG_LOGO_AM + 28, top: 72, width: 1, height: 40, background: CORES.cinzaAzulado, opacity: prog(t, 0.4, 0.5)}} />
      <LogoONS p={prog(t, 0.5, 0.5)} x={96 + LARG_LOGO_AM + 57} />
      <Texto x={96} y={410} p={prog(t, 0.3, 0.5)} estilo={{fontSize: 80}}>Gestão da Mudança na Prática</Texto>
      <Texto x={96} y={522} p={prog(t, 0.55, 0.5)} estilo={{fontSize: 40, color: CORES.aco}}>Programa de Formação</Texto>
      <Texto x={96} y={584} p={prog(t, 0.75, 0.5)} estilo={{fontSize: 30, color: CORES.cinzaAzulado}}>23 a 25 de novembro de 2026</Texto>
    </AbsoluteFill>
  );
};
