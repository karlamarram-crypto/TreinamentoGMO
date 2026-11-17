import React from 'react';
import {CORES, frasesCena} from '../config';
import {Fundo, Icone, Linha, PulsoNaLinha, Rotulo, Svg, Texto, diagonal, prog, useT} from '../componentes/base';

// Cena 2 · Só vira valor quando chega: geração à esquerda, carga à direita.
const CARGAS = [
  {nome: 'casa', rotulo: 'Casa'},
  {nome: 'industria', rotulo: 'Indústria'},
  {nome: 'hospital', rotulo: 'Hospital'},
];
const Y_LINHA = 640;

export const Cena02: React.FC = () => {
  const t = useT();
  const fr = frasesCena(1);
  const chegada = fr[1].ini + 0.1; // "Na casa, na indústria, no hospital."
  const pulso = prog(t, chegada - 2.6, 2.6);
  const fundo = diagonal(1500);
  return (
    <Fundo>
      <Svg>
        <Linha {...fundo} p={1} largura={1} opacidade={0.25} />
        <Linha {...diagonal(1580)} p={1} largura={1} opacidade={0.18} />
        {/* geração: bloco geométrico simples */}
        <g opacity={prog(t, 0.3, 1.0)}>
          <polygon points="150,760 430,760 430,560 330,560 330,500 250,500 250,560 150,600" fill="none" stroke={CORES.branco} strokeWidth={2} />
          {[0, 1, 2, 3, 4].map((i) => (
            <line key={i} x1={170 + i * 50} y1={760} x2={170 + i * 50 + 90 * 0.577} y2={670} stroke={CORES.cinzaAzulado} strokeWidth={1} opacity={0.6} />
          ))}
        </g>
        {/* linha de transmissão */}
        <Linha x1={430} y1={Y_LINHA} x2={1230} y2={Y_LINHA} p={prog(t, 0.9, 1.6)} largura={2} />
        <PulsoNaLinha x1={430} y1={Y_LINHA} x2={1230} y2={Y_LINHA} k={pulso} id="c2" />
        {/* carga: casa, indústria, hospital */}
        {CARGAS.map((c, i) => {
          const x = 1260 + i * 190;
          const aceso = prog(t, chegada + i * 0.55, 0.5);
          return (
            <g key={c.nome} opacity={prog(t, 0.5 + i * 0.15, 1.0)}>
              {i > 0 && <line x1={x - 50} y1={Y_LINHA} x2={x} y2={Y_LINHA} stroke={CORES.branco} strokeWidth={1.5} opacity={0.6} />}
              <rect x={x} y={Y_LINHA - 70} width={140} height={140} fill={CORES.cinzaClaro} fillOpacity={aceso} stroke={aceso > 0.5 ? CORES.aco : CORES.cinzaAzulado} strokeWidth={1.5} />
              <Icone nome={c.nome} x={x + 30} y={Y_LINHA - 40} tamanho={80} cor={aceso > 0.5 ? CORES.marinho : CORES.cinzaAzulado} />
            </g>
          );
        })}
      </Svg>
      <Rotulo texto="Geração" x={150} y={800} p={prog(t, 0.6, 1)} />
      {CARGAS.map((c, i) => (
        <Rotulo key={c.nome} texto={c.rotulo} x={1260 + i * 190} y={740} p={prog(t, chegada + i * 0.55, 0.6)} tamanho={13} />
      ))}
      <Texto x={96} y={190} p={prog(t, 0.4, 1.2)} estilo={{fontSize: 64}}>
        Energia só vira valor <span style={{color: CORES.aco}}>quando chega</span>.
      </Texto>
    </Fundo>
  );
};
