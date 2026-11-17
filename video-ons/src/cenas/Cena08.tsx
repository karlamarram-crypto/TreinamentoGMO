import React from 'react';
import {CORES, CENAS, frasesCena} from '../config';
import {Fundo, Linha, LogoAM, LogoONS, Plano, PulsoNaLinha, Svg, Texto, diagonal, prog, useT} from '../componentes/base';

// Cena 8 · Fechamento: dissolve para a composição da capa do deck
const LARG_LOGO_AM = 40 * (2000 / 363);
export const Cena08: React.FC = () => {
  const t = useT();
  const fr = frasesCena(7);
  const d = CENAS[7].duracao;
  const sai = prog(t, fr[2].ini - 0.4, 0.9);
  const card = fr[2].ini + 0.3;
  const linhas = [diagonal(1360), diagonal(1440), diagonal(1520)];
  const kPulso = prog(t, card + 0.4, Math.min(2.6, d - 2.2 - card - 0.4));
  return (
    <Fundo>
      <Svg>
        <Plano x={1040} y={0} largura={1100} altura={1080} opacidade={0.22} p={prog(t, 0.2, 1.4)} />
        <Linha {...linhas[0]} p={prog(t, 0.3, 1.8)} largura={2} />
        <Linha {...linhas[1]} p={prog(t, 0.6, 1.8)} largura={1.5} opacidade={0.85} />
        <Linha {...linhas[2]} p={prog(t, 0.9, 1.8)} largura={1} opacidade={0.7} />
        <PulsoNaLinha {...linhas[0]} k={kPulso} id="c8" />
      </Svg>
      <LogoAM p={prog(t, 0.4, 1.0)} />
      <div style={{position: 'absolute', left: 96 + LARG_LOGO_AM + 28, top: 72, width: 1, height: 40, background: CORES.cinzaAzulado, opacity: prog(t, 0.6, 1.0)}} />
      <LogoONS p={prog(t, 0.7, 1.0)} x={96 + LARG_LOGO_AM + 57} />
      <Texto x={960} y={440} alinhar="centro" largura={1400} p={prog(t, fr[0].ini, 1.0)} sai={sai} estilo={{fontSize: 60}}>
        A energia já está aqui.
      </Texto>
      <Texto x={960} y={530} alinhar="centro" largura={1400} p={prog(t, fr[1].ini, 1.0)} sai={sai} estilo={{fontSize: 60}}>
        Agora é fazer <span style={{color: CORES.aco}}>chegar</span>.
      </Texto>
      <Texto x={96} y={410} p={prog(t, card, 1.0)} estilo={{fontSize: 80}}>Gestão da Mudança na Prática</Texto>
      <Texto x={96} y={522} p={prog(t, card + 0.4, 1.0)} estilo={{fontSize: 40, color: CORES.aco}}>Programa de Formação</Texto>
      <Texto x={96} y={584} p={prog(t, card + 0.7, 1.0)} estilo={{fontSize: 30, color: CORES.cinzaAzulado}}>23 a 25 de novembro de 2026</Texto>
    </Fundo>
  );
};
