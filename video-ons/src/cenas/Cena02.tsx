import React from 'react';
import {AbsoluteFill} from 'remotion';
import {CORES, cargasC2, inicioCena} from '../config';
import {Fundo, Icone, Linha, PulsoNaLinha, Rotulo, Svg, Texto, prog, useT} from '../componentes/base';
import {Montagem} from '../componentes/imagens';

// Cena 2 · Só vira valor quando chega (v2): cidade e lugares acendendo; cada carga acende com um clique
const CARGAS = [
  {nome: 'casa', rotulo: 'Casa', clipe: 'janela_casa_acendendo', luz: true},
  {nome: 'industria', rotulo: 'Indústria', clipe: 'industria_noite', luz: false},
  {nome: 'hospital', rotulo: 'Hospital', clipe: 'cidade_noite_panorama', luz: false},
];
const Y = 640;

export const Cena02: React.FC = () => {
  const t = useT();
  const base = inicioCena(1);
  const acende = cargasC2().map((x) => x - base);
  const pulso = prog(t, acende[0] - 1.4, 1.4);
  const planos = [
    {t: 0, nome: 'cidade_noite_acendendo', inicio: 1, corte: true},
    ...CARGAS.map((c, i) => ({t: acende[i], nome: c.clipe, inicio: 2, tratamento: (c.luz ? 'luz' : 'duotone') as 'luz' | 'duotone'})),
    {t: acende[2] + 0.9, nome: 'postes_rua_noite', inicio: 3, tratamento: 'luz' as const},
  ];
  return (
    <Fundo>
      <Montagem planos={planos} fim={7} veu={0.5} />
      <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(0,42,70,0.75) 0%, rgba(0,42,70,0.2) 55%, rgba(0,42,70,0.6) 100%)'}} />
      <Svg>
        <g opacity={prog(t, 0.1, 0.4)}>
          <polygon points="150,760 430,760 430,560 330,560 330,500 250,500 250,560 150,600" fill="none" stroke={CORES.branco} strokeWidth={2} />
        </g>
        <Linha x1={430} y1={Y} x2={1230} y2={Y} p={prog(t, 0.3, 0.6)} largura={2} />
        <PulsoNaLinha x1={430} y1={Y} x2={1230} y2={Y} k={pulso} id="c2" />
        {CARGAS.map((c, i) => {
          const x = 1260 + i * 190;
          const aceso = prog(t, acende[i], 0.2);
          return (
            <g key={c.nome} opacity={prog(t, 0.2 + i * 0.08, 0.4)}>
              {i > 0 && <line x1={x - 50} y1={Y} x2={x} y2={Y} stroke={CORES.branco} strokeWidth={1.5} opacity={0.6} />}
              {aceso > 0 && <circle cx={x + 70} cy={Y} r={90} fill={CORES.laranjaBrilho} opacity={0.22 * aceso * Math.max(0, 1 - (t - acende[i]) / 1.2)} />}
              <rect x={x} y={Y - 70} width={140} height={140} fill={CORES.cinzaClaro} fillOpacity={aceso} stroke={aceso > 0.5 ? CORES.aco : CORES.cinzaAzulado} strokeWidth={1.5} />
              <Icone nome={c.nome} x={x + 30} y={Y - 40} tamanho={80} cor={aceso > 0.5 ? CORES.marinho : CORES.cinzaClaro} />
            </g>
          );
        })}
      </Svg>
      <Rotulo texto="Geração" x={150} y={800} p={prog(t, 0.2, 0.4)} cor={CORES.cinzaClaro} />
      {CARGAS.map((c, i) => (
        <Rotulo key={c.nome} texto={c.rotulo} x={1260 + i * 190} y={740} p={prog(t, acende[i], 0.4)} tamanho={13} cor={CORES.cinzaClaro} />
      ))}
      <Texto x={96} y={190} p={prog(t, 0.15, 0.5)} estilo={{fontSize: 64}}>
        Energia só vira valor <span style={{color: CORES.aco}}>quando chega</span>.
      </Texto>
    </Fundo>
  );
};
