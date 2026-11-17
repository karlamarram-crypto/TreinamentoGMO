import React from 'react';
import {AbsoluteFill} from 'remotion';
import {CORES, FIM_LAMPADAS_C5, MUSICA, frasesCena, inicioCena, lampadasC5, tempoSilhuetasC5} from '../config';
import {Fundo, Linha, PulsoNaLinha, Rotulo, Silhueta, Svg, Texto, diagonal, lerp, prog, useT} from '../componentes/base';
import {LinhaInterrompida, PESSOAS, TRANSMISSAO} from './Cena03';
import {Imagem, Montagem} from '../componentes/imagens';
import {Sequence} from 'remotion';

// Cena 5 · A virada (v2): frase no silêncio, fundo quase vazio; reconexão no drop da trilha
export const Cena05: React.FC = () => {
  const t = useT();
  const base = inicioCena(4);
  const fr = frasesCena(4);
  const drop = MUSICA.drop - base;
  const acende = tempoSilhuetasC5().map((x) => x - base);
  const reconecta = prog(t, drop - 0.25, 0.25);
  const kPulso = prog(t, drop, 0.45);
  const yRow = PESSOAS[0].y + 12;
  const kFila = prog(t, drop + 0.4, acende[acende.length - 1] - drop - 0.2);
  const flash = t >= drop && t < drop + 2 / 30 ? 0.3 : 0;
  const lamp = lampadasC5().map((l) => ({...l, t: l.t - base, tratamento: 'luz' as const, corte: true, veu: 0.12}));
  const fimLamp = FIM_LAMPADAS_C5 - base;
  const emLampadas = t >= lamp[0].t && t < fimLamp;
  return (
    <Fundo>
      {/* depois das lâmpadas: cidade iluminada ao fundo, bem sutil */}
      <Sequence from={Math.round(fimLamp * 30)} layout="none" name="cidade ao fundo">
        <AbsoluteFill style={{opacity: 0.32}}>
          <Imagem nome="cidade_noite_panorama" k={prog(t, fimLamp, 14 - fimLamp)} t={t} veu={0.35} inicio={2} />
        </AbsoluteFill>
      </Sequence>
      <Svg>
        <Linha {...diagonal(420)} p={prog(t, 0.4, 0.6)} largura={1} opacidade={0.35} />
        <g opacity={prog(t, fr[1].ini + 1.2, 0.5)}>
          <LinhaInterrompida p={1} reconecta={reconecta} />
          {PESSOAS.map((s, i) => {
            const k = prog(t, acende[i], 0.25);
            const cor = k > 0 ? mistura(CORES.cinzaAzulado, CORES.branco, k) : CORES.cinzaAzulado;
            return <Silhueta key={i} x={s.x} y={s.y} cor={cor} />;
          })}
        </g>
        {t >= drop && (
          <>
            <PulsoNaLinha {...TRANSMISSAO} k={kPulso} id="c5" rastro={0.25} />
            <Linha x1={TRANSMISSAO.x2} y1={TRANSMISSAO.y2} x2={PESSOAS[PESSOAS.length - 1].x + 30} y2={yRow} p={prog(t, drop + 0.3, 0.4)} largura={1} opacidade={0.45} />
            <PulsoNaLinha x1={PESSOAS[0].x - 30} y1={yRow} x2={PESSOAS[PESSOAS.length - 1].x + 30} y2={yRow} k={kFila} id="c5b" />
            <Particulas t={t} acende={acende} />
          </>
        )}
      </Svg>
      <Texto x={1824} y={200} alinhar="direita" p={prog(t, fr[0].ini - 0.05, 0.45)} estilo={{fontSize: 68, color: CORES.aco}}>
        Nenhum projeto termina no go-live.
      </Texto>
      <Texto x={1824} y={300} alinhar="direita" largura={960} p={prog(t, fr[1].ini - 0.05, 0.45)} estilo={{fontSize: 38, lineHeight: 1.3}}>
        Ele termina no dia em que as pessoas deixam de trabalhar do jeito antigo.
      </Texto>
      <Rotulo texto="A gestão da mudança é a transmissão" x={1824} y={470} alinhar="direita" p={prog(t, fr[2].ini - 0.05, 0.45)} />
      {/* power-up lúdico: lâmpadas acendendo em sequência, cortes secos no ritmo */}
      {t < fimLamp + 0.05 && <Montagem planos={lamp} fim={fimLamp} />}
      {emLampadas && <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 50%, rgba(248,163,69,0.18), rgba(0,42,70,0) 60%)'}} />}
      {flash > 0 && <AbsoluteFill style={{backgroundColor: CORES.branco, opacity: flash}} />}
    </Fundo>
  );
};

// partículas de luz laranja, sutis, subindo das silhuetas acesas
const Particulas: React.FC<{t: number; acende: number[]}> = ({t, acende}) => (
  <g>
    {PESSOAS.flatMap((s, i) =>
      [0, 1, 2].map((j) => {
        const nasc = acende[i] + j * 0.6;
        const vida = (t - nasc) % 1.8;
        if (t < nasc || vida < 0) return null;
        const k = vida / 1.8;
        const dx = Math.sin((i * 3 + j) * 1.7) * 18;
        return <circle key={`${i}-${j}`} cx={s.x + dx} cy={s.y - 80 - k * 120} r={2.4 - k * 1.4} fill={CORES.laranjaBrilho} opacity={0.55 * (1 - k)} />;
      }),
    )}
  </g>
);

export const mistura = (a: string, b: string, k: number) => {
  const h = (s: string) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  const A = h(a), B = h(b);
  return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], k))).join(',')})`;
};
