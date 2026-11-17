import React from 'react';
import {CORES} from '../config';
import {Fundo, Linha, LogoAM, Plano, PulsoNaLinha, Rotulo, Svg, diagonal, prog, useT} from '../componentes/base';

// Cena 1 · A energia: três linhas diagonais (linhas de transmissão) e um pulso laranja.
export const LINHAS_C1 = [diagonal(1010), diagonal(1090), diagonal(1170)];

export const Cena01: React.FC = () => {
  const t = useT();
  const [l1, l2, l3] = LINHAS_C1;
  const pulso1 = prog(t, 3.0, 3.6);
  const pulso2 = prog(t, 6.6, 3.6);
  return (
    <Fundo>
      <Svg>
        <Plano x={-120} y={640} largura={760} altura={440} opacidade={0.22} p={prog(t, 0.2, 1.6)} />
        <Plano x={-260} y={820} largura={620} altura={260} cor={CORES.aco} opacidade={0.15} p={prog(t, 0.8, 1.6)} />
        <Linha {...l1} p={prog(t, 0.4, 2.0)} largura={2.5} />
        <Linha {...l2} p={prog(t, 1.3, 1.9)} largura={1.5} opacidade={0.85} />
        <Linha {...l3} p={prog(t, 1.9, 1.9)} largura={1} opacidade={0.7} />
        <PulsoNaLinha {...l1} k={pulso1} id="c1a" />
        <PulsoNaLinha {...l1} k={pulso2} id="c1b" />
      </Svg>
      <LogoAM p={prog(t, 0.6, 1.2)} />
      <Rotulo texto="Sistema Interligado Nacional" x={96} y={520} p={prog(t, 1.6, 1.2)} />
    </Fundo>
  );
};
