import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {CORES, PRETO_C1, pulsosC1, quadros} from '../config';
import {Fundo, Linha, LogoAM, PulsoNaLinha, Rotulo, Svg, diagonal, prog, useT} from '../componentes/base';
import {Montagem} from '../componentes/imagens';

// Cena 1 · A energia (v2): 0,5 s de preto com zumbido; corte seco para torres ao entardecer;
// as diagonais A&M se desenham por cima, como cabos, e o pulso laranja corre pela linha.
export const LINHAS_C1 = [diagonal(1010), diagonal(1090), diagonal(1170)];

export const Cena01: React.FC = () => {
  const t = useT();
  const [l1, l2, l3] = LINHAS_C1;
  const P = PRETO_C1;
  const [pa, pb] = pulsosC1();
  return (
    <Fundo>
      <Sequence from={quadros(P)} layout="none" name="torres">
        <Montagem
          planos={[
            {t: 0, nome: 'torres_entardecer', inicio: 5, corte: true},
            {t: 3.5, nome: 'torres_silhueta', inicio: 9},
          ]}
          fim={7 - P}
          veu={0.38}
        />
      </Sequence>
      <Svg>
        <Linha {...l1} p={prog(t, P + 0.1, 0.9)} largura={2.5} />
        <Linha {...l2} p={prog(t, P + 0.35, 0.9)} largura={1.5} opacidade={0.85} />
        <Linha {...l3} p={prog(t, P + 0.6, 0.9)} largura={1} opacidade={0.7} />
        <PulsoNaLinha {...l1} k={prog(t, pa, 1.9)} id="c1a" />
        <PulsoNaLinha {...l1} k={prog(t, pb, 1.9)} id="c1b" />
      </Svg>
      <LogoAM p={prog(t, P + 0.2, 0.5)} />
      <Rotulo texto="Sistema Interligado Nacional" x={96} y={520} p={prog(t, P + 0.6, 0.5)} cor={CORES.cinzaClaro} />
      {t < P && <AbsoluteFill style={{backgroundColor: '#000'}} />}
    </Fundo>
  );
};
