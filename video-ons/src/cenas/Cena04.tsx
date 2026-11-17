import React from 'react';
import {CORES, frasesCena} from '../config';
import {Card, Fundo, Icone, Linha, Plano, Rotulo, Svg, diagonal, prog, useT} from '../componentes/base';

// Cena 4 · Tudo ao mesmo tempo: quatro cards em cascata diagonal.
export const MUDANCAS = [
  {icone: 'organograma', titulo: 'Reorganizações'},
  {icone: 'regras', titulo: 'Novas regras do setor'},
  {icone: 'sistemas', titulo: 'Novos sistemas'},
  {icone: 'trabalho', titulo: 'Novas formas de trabalhar'},
];

// Posição de cada card; "junta" (0..1) aproxima os cards no fim (carga simultânea)
export const posCard = (i: number, junta: number) => ({
  x: 200 + i * 330 - junta * (i - 1.5) * 70,
  y: 640 - i * 150 + junta * (i - 1.5) * 52,
});

export const CardsMudanca: React.FC<{t: number; entradas: number[]; junta: number; sai?: number}> = ({t, entradas, junta, sai = 0}) => (
  <>
    {MUDANCAS.map((m, i) => {
      const {x, y} = posCard(i, junta);
      return (
        <Card key={m.titulo} x={x} y={y} largura={560} altura={170} p={prog(t, entradas[i], 0.9)} sai={sai} estilo={{display: 'flex', alignItems: 'center', gap: 26}}>
          <svg width={72} height={72} style={{flex: 'none'}}>
            <Icone nome={m.icone} x={4} y={4} tamanho={64} cor={CORES.marinho} />
          </svg>
          <div>
            <div style={{fontSize: 16, letterSpacing: '0.25em', color: CORES.aco, marginBottom: 8}}>{String(i + 1).padStart(2, '0')}</div>
            <div style={{fontSize: 34, lineHeight: 1.15}}>{m.titulo}</div>
          </div>
        </Card>
      );
    })}
  </>
);

export const Cena04: React.FC = () => {
  const t = useT();
  const fr = frasesCena(3);
  const lista = fr[1];
  const entradas = MUDANCAS.map((_, i) => lista.ini + ((lista.fim - lista.ini) * i) / 4 - 0.2);
  const junta = prog(t, fr[2].ini - 0.2, 1.6);
  return (
    <Fundo>
      <Svg>
        <Plano x={300} y={300} largura={900} altura={700} opacidade={0.18} p={prog(t, 0.2, 1.4)} />
        <Plano x={900} y={120} largura={700} altura={520} cor={CORES.aco} opacidade={0.12} p={prog(t, 0.6, 1.4)} />
        <Linha {...diagonal(1480)} p={prog(t, 0.2, 1.5)} largura={1} opacidade={0.35} />
        <Linha {...diagonal(1560)} p={prog(t, 0.5, 1.5)} largura={1} opacidade={0.25} />
      </Svg>
      <Rotulo texto="O ONS hoje" x={96} y={120} p={prog(t, 0.4, 1.0)} />
      <CardsMudanca t={t} entradas={entradas} junta={junta} />
    </Fundo>
  );
};
