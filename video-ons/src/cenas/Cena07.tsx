import React from 'react';
import {CORES, inicioCena, marcosC7} from '../config';
import {Montagem} from '../componentes/imagens';
import {Card, Fundo, Linha, PulsoNaLinha, Rotulo, Svg, diagonal, lerp, prog, useT} from '../componentes/base';
import {Nomes, temposNomes} from './Cena06';

// Cena 7 · A jornada: linha do tempo diagonal com quatro marcos
export const MARCOS = [
  {rotulo: 'DIA 1 | 23 NOV', titulo: 'Entender', texto: 'Por que gerir a mudança, ADKAR® e as personas do Spalla'},
  {rotulo: 'DIA 2 | 24 NOV', titulo: 'Conduzir', texto: 'Papéis, método e os pilares na prática'},
  {rotulo: 'DIA 3 | 25 NOV', titulo: 'Construir', texto: 'O plano de GMO do Spalla e o esboço da área de GMO do ONS'},
  {rotulo: 'FASE 2 | 25 NOV', titulo: 'Multiplicar', texto: 'Formação de multiplicadores'},
];
const pos = (i: number) => ({x: 96 + i * 430, y: 590 - i * 125});
const marco = (i: number) => ({x: pos(i).x + 30, y: pos(i).y + 252});

export const Cena07: React.FC = () => {
  const t = useT();
  const destaques = marcosC7().map((x) => x - inicioCena(6));
  const entra = (i: number) => 0.5 + i * 0.6;
  const nomes = temposNomes();
  const recua = prog(t, 0, 0.6);
  const ini = marco(0), fim = marco(3);
  return (
    <Fundo>
      {/* atrás da linha do tempo: imagens de energia (sem pessoas), trocando a cada marco */}
      <Montagem
        planos={[
          {t: 0, nome: 'torres_campo', inicio: 2, corte: true},
          ...['eolicas_aereo', 'solar_aereo', 'hidreletrica_aerea', 'cidade_drone_luzes'].map((nome, i) => ({t: destaques[i], nome, inicio: 2})),
        ]}
        fim={16}
        veu={0.58}
      />
      {/* a rede recua */}
      {recua < 1 && (
        <div style={{position: 'absolute', inset: 0, opacity: 1 - recua, transform: `scale(${1 - 0.35 * recua})`, transformOrigin: '960px 470px'}}>
          <Nomes t={99} L={nomes.L} tNomes={nomes.tNomes} tJunta={0} estatico />
        </div>
      )}
      <Svg>
        <Linha {...diagonal(1640)} p={prog(t, 0.6, 2)} largura={1} opacidade={0.2} />
        <Linha x1={ini.x - 60} y1={ini.y + 17} x2={fim.x + 120} y2={fim.y - 35} p={prog(t, 0.3, 0.9)} largura={2} opacidade={0.9} />
        {MARCOS.map((_, i) => {
          const m = marco(i);
          const k = prog(t, destaques[i] - 0.2, 0.4);
          return <circle key={i} cx={m.x} cy={m.y} r={9} fill={k > 0.5 ? CORES.branco : CORES.marinho} stroke={CORES.branco} strokeWidth={2} opacity={prog(t, entra(i), 0.4)} />;
        })}
        {MARCOS.slice(1).map((_, i) => {
          const a = marco(i), b = marco(i + 1);
          const k = prog(t, destaques[i + 1] - 0.5, 0.5);
          return k > 0 && k < 1 ? <PulsoNaLinha key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} k={k} id={`c7-${i}`} /> : null;
        })}
      </Svg>
      <Rotulo texto="Três dias de formação" x={96} y={120} p={prog(t, 0.3, 0.5)} cor={CORES.cinzaClaro} />
      {MARCOS.map((m, i) => {
        const {x, y} = pos(i);
        const dest = prog(t, destaques[i] - 0.05, 0.3);
        return (
          <Card key={m.titulo} x={x} y={y} largura={400} altura={222} p={prog(t, entra(i), 0.45)} destaque={dest}>
            <div style={{fontSize: 15, letterSpacing: '0.25em', color: CORES.aco, marginBottom: 10}}>{m.rotulo}</div>
            <div style={{fontSize: 38, marginBottom: 8}}>{m.titulo}</div>
            <div style={{fontSize: 19, lineHeight: 1.35}}>{m.texto}</div>
          </Card>
        );
      })}
    </Fundo>
  );
};
export {lerp};
