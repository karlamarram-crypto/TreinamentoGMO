import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {CORES, FONTE, LEGENDA, legendas} from '../config';

// Legendas queimadas: Arial 30 px, branco, a 64 px da base, faixa marinho 70%, até 2 linhas.
export const Legendas: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = f / fps;
  const atual = legendas().find((l) => t >= l.ini && t < l.fim);
  if (!atual) return null;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, bottom: LEGENDA.distanciaBase, display: 'flex', justifyContent: 'center'}}>
      <div
        style={{
          maxWidth: LEGENDA.larguraMax, padding: '8px 22px', borderRadius: 6, background: LEGENDA.fundo,
          color: CORES.branco, fontFamily: FONTE, fontSize: LEGENDA.tamanho, lineHeight: 1.32, textAlign: 'center',
          textWrap: 'balance' as React.CSSProperties['textWrap'],
        }}
      >
        {atual.texto}
      </div>
    </div>
  );
};
