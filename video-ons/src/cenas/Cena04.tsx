import React from 'react';
import {AbsoluteFill} from 'remotion';
import {CORES, MUSICA, inicioCena, montagemC4, tempoCardsC4} from '../config';
import {Card, Fundo, Icone, Rotulo, prog, useT} from '../componentes/base';
import {Imagem, NomeImagem, WipeDiagonal} from '../componentes/imagens';

// Cena 4 · Tudo ao mesmo tempo (v2): clipes duotone cortados no beat atrás dos cards
export const MUDANCAS = [
  {icone: 'organograma', titulo: 'Reorganizações'},
  {icone: 'regras', titulo: 'Novas regras do setor'},
  {icone: 'sistemas', titulo: 'Novos sistemas'},
  {icone: 'trabalho', titulo: 'Novas formas de trabalhar'},
];

export const posCard = (i: number, junta: number) => ({
  x: 200 + i * 330 - junta * (i - 1.5) * 70,
  y: 640 - i * 150 + junta * (i - 1.5) * 52,
});

export const CardsMudanca: React.FC<{t: number; entradas: number[]; junta: number; sai?: number; dur?: number}> = ({t, entradas, junta, sai = 0, dur = 0.45}) => (
  <>
    {MUDANCAS.map((m, i) => {
      const {x, y} = posCard(i, junta);
      return (
        <Card key={m.titulo} x={x} y={y} largura={560} altura={170} p={prog(t, entradas[i], dur)} sai={sai} estilo={{display: 'flex', alignItems: 'center', gap: 26, boxShadow: '0 18px 40px rgba(0,20,35,0.45)'}}>
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
  const base = inicioCena(3);
  const T = base + t;
  const cards = tempoCardsC4().map((c) => c - base);
  const mont = montagemC4();
  const junta = prog(T, cards[3] + 0.6, MUSICA.corteRiser - cards[3] - base - 0.8);
  // imagem atual e a anterior (para o wipe diagonal)
  let atual = 0;
  mont.forEach((m, k) => { if (T >= m.t) atual = k; });
  const ant = Math.max(0, atual - 1);
  const kWipe = atual === 0 ? 1 : prog(T, mont[atual].t, 0.18);
  const fimDe = (k: number) => (mont[k + 1] ? mont[k + 1].t : MUSICA.corteRiser);
  const kb = (k: number) => Math.min(1, (T - mont[k].t) / Math.max(0.5, fimDe(k) - mont[k].t));
  return (
    <Fundo>
      <Imagem nome={mont[ant].nome as NomeImagem} k={kb(ant)} t={T} veu={0.45} />
      <WipeDiagonal k={kWipe}>
        <Imagem nome={mont[atual].nome as NomeImagem} k={kb(atual)} t={T} veu={0.45} />
      </WipeDiagonal>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,42,70,0.55) 0%, rgba(0,42,70,0) 30%)'}} />
      <Rotulo texto="O ONS hoje" x={96} y={120} p={prog(t, 0.2, 0.5)} cor={CORES.cinzaClaro} />
      <CardsMudanca t={t} entradas={cards} junta={junta} />
    </Fundo>
  );
};
