import React from 'react';
import {CORES, frasesCena} from '../config';
import {Fundo, Linha, Plano, PulsoNaLinha, Rotulo, Silhueta, Svg, Texto, diagonal, lerp, prog, useT} from '../componentes/base';
import {CardsMudanca} from './Cena04';
import {FALHA, LinhaInterrompida, PESSOAS, TRANSMISSAO} from './Cena03';

// Cena 5 · A virada: composição do slide-âncora (planos à esquerda, texto à direita)
export const Cena05: React.FC = () => {
  const t = useT();
  const fr = frasesCena(4);
  const reconecta = prog(t, fr[2].ini + 1.6, 0.8);
  const iniPulso = fr[2].ini + 2.3;
  const kPulso = prog(t, iniPulso, 2.0);
  const chega = iniPulso + 2.0;
  return (
    <Fundo>
      <Svg>
        <Plano x={-420} y={120} largura={720} altura={900} opacidade={0.32} p={prog(t, 0.6, 1.6)} />
        <Plano x={-160} y={300} largura={520} altura={720} cor={CORES.aco} opacidade={0.18} p={prog(t, 0.9, 1.6)} />
        <Linha {...diagonal(420)} p={prog(t, 0.8, 1.8)} largura={1.5} opacidade={0.6} />
        <Linha {...diagonal(500)} p={prog(t, 1.1, 1.8)} largura={1} opacidade={0.4} />
        <g opacity={prog(t, fr[2].ini - 0.4, 1.0)}>
          <LinhaInterrompida p={1} reconecta={reconecta} />
          {PESSOAS.map((s, i) => {
            const k = prog(t, chega + i * 0.14, 0.4);
            return <Silhueta key={i} x={s.x} y={s.y} cor={k > 0 ? mistura(CORES.cinzaAzulado, CORES.branco, k) : CORES.cinzaAzulado} />;
          })}
        </g>
        <PulsoNaLinha {...TRANSMISSAO} k={kPulso} id="c5" />
        {kPulso >= 1 && <PulsoPessoas t={t} chega={chega} />}
      </Svg>
      <CardsMudanca t={t} entradas={[-9, -9, -9, -9]} junta={1} sai={prog(t, 0, 0.9)} />
      <Texto x={1824} y={200} alinhar="direita" p={prog(t, fr[0].ini, 1.0)} estilo={{fontSize: 68, color: CORES.aco}}>
        Nenhum projeto termina no go-live.
      </Texto>
      <Texto x={1824} y={300} alinhar="direita" largura={960} p={prog(t, fr[1].ini, 1.0)} estilo={{fontSize: 38, lineHeight: 1.3}}>
        Ele termina no dia em que as pessoas deixam de trabalhar do jeito antigo.
      </Texto>
      <Rotulo texto="A gestão da mudança é a transmissão" x={1824} y={470} alinhar="direita" p={prog(t, fr[2].ini, 1.0)} />
    </Fundo>
  );
};

// o pulso segue pela base da fileira de pessoas, acendendo cada uma
const PulsoPessoas: React.FC<{t: number; chega: number}> = ({t, chega}) => {
  const n = PESSOAS.length;
  const y = PESSOAS[0].y + 12;
  const k = prog(t, chega, 0.14 * n);
  return (
    <>
      <Linha x1={TRANSMISSAO.x2} y1={TRANSMISSAO.y2} x2={PESSOAS[n - 1].x + 30} y2={y} p={prog(t, chega - 0.2, 0.6)} largura={1} opacidade={0.4} />
      <PulsoNaLinha x1={PESSOAS[0].x - 30} y1={y} x2={PESSOAS[n - 1].x + 30} y2={y} k={k} id="c5b" />
    </>
  );
};

export const mistura = (a: string, b: string, k: number) => {
  const h = (s: string) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  const A = h(a), B = h(b);
  return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], k))).join(',')})`;
};
export {FALHA};
