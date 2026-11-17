import React from 'react';
import {CORES, MARCAS, checksC3, inicioCena} from '../config';
import {Montagem} from '../componentes/imagens';
import {Card, Fundo, Linha, PulsoNaLinha, Rotulo, Silhueta, Svg, Texto, diagonal, lerp, prog, useT} from '../componentes/base';

// Geometria compartilhada com a Cena 5 (a linha interrompida que depois se reconecta)
export const PESSOAS = Array.from({length: 9}, (_, i) => ({x: 1200 + i * 75, y: 790}));
export const TRANSMISSAO = {x1: 650, y1: 480, x2: 1150, y2: 760};
export const FALHA = [0.6, 0.74]; // trecho interrompido (fração da linha)

export const LinhaInterrompida: React.FC<{p: number; reconecta?: number}> = ({p, reconecta = 0}) => {
  const {x1, y1, x2, y2} = TRANSMISSAO;
  const a = FALHA[0], b = FALHA[1];
  const pt = (k: number) => ({x: lerp(x1, x2, k), y: lerp(y1, y2, k)});
  const A = pt(a), B = pt(b);
  return (
    <>
      <Linha x1={x1} y1={y1} x2={A.x} y2={A.y} p={Math.min(1, p / a)} largura={2} />
      <Linha x1={B.x} y1={B.y} x2={x2} y2={y2} p={Math.max(0, (p - b) / (1 - b))} largura={2} />
      {reconecta > 0 && <Linha x1={A.x} y1={A.y} x2={B.x} y2={B.y} p={reconecta} largura={2} />}
    </>
  );
};

const ETAPAS = ['Solução pronta', 'Sistema no ar', 'Projeto entregue'];

export const Cena03: React.FC = () => {
  const t = useT();
  const base = inicioCena(2);
  const marca = checksC3().map((x) => x - base);
  const falha = MARCAS.falhaC3;
  const iniPulso = falha - 1.3;
  const kPulso = lerp(0, FALHA[0] + 0.02, prog(t, iniPulso, 1.4));
  const forca = 1 - prog(t, falha - 0.3, 0.5); // perde força antes de chegar
  const final = MARCAS.resultadoC3;
  // a falha acontece nas pessoas: a luz pisca nas silhuetas e se apaga (nunca na cidade)
  const pisca = t >= falha && t < falha + 0.9 ? [1, 0, 0.8, 0, 0.6, 0, 0.3, 0, 0][Math.floor((t - falha) / 0.1)] ?? 0 : 0;
  return (
    <Fundo>
      <Montagem planos={[{t: 0, nome: 'datacenter_cabos', inicio: 2, corte: true}]} fim={14} veu={0.62} />
      <Svg>
        <Linha {...diagonal(1650)} p={1} largura={1} opacidade={0.18} />
        <LinhaInterrompida p={prog(t, iniPulso - 0.8, 0.7)} />
        {forca > 0 && kPulso < FALHA[0] + 0.02 && (
          <PulsoNaLinha {...TRANSMISSAO} k={kPulso} opacidade={forca} id="c3" />
        )}
        {PESSOAS.map((s, i) => (
          <g key={i} opacity={prog(t, iniPulso - 0.9 + i * 0.04, 0.4)}>
            <Silhueta x={s.x} y={s.y} cor={CORES.cinzaAzulado} />
            {pisca > 0 && <Silhueta x={s.x} y={s.y} cor={CORES.branco} opacidade={pisca} />}
          </g>
        ))}
      </Svg>
      <Card x={96} y={230} largura={520} altura={292} p={prog(t, 0.15, 0.5)}>
        <div style={{fontSize: 18, letterSpacing: '0.25em', color: CORES.aco, textTransform: 'uppercase', marginBottom: 30}}>Projeto</div>
        {ETAPAS.map((e, i) => {
          const k = prog(t, marca[i], 0.3);
          return (
            <div key={e} style={{display: 'flex', alignItems: 'center', gap: 18, marginBottom: 24, fontSize: 32}}>
              <svg width={32} height={32} viewBox="0 0 32 32" style={{flex: 'none'}}>
                <rect x={1} y={1} width={30} height={30} fill={k > 0.2 ? CORES.aco : 'none'} fillOpacity={k} stroke={CORES.aco} strokeWidth={2} />
                {k > 0 && <path d="M8 16 L14 22 L24 10" fill="none" stroke={CORES.branco} strokeWidth={3} strokeDasharray="30" strokeDashoffset={30 * (1 - k)} />}
              </svg>
              <span style={{opacity: 0.55 + 0.45 * k}}>{e}</span>
            </div>
          );
        })}
      </Card>
      <Rotulo texto="Jeito antigo" x={PESSOAS[0].x - 28} y={640} p={prog(t, falha + 0.9, 0.5)} cor={CORES.cinzaClaro} />
      <Texto x={1180} y={250} p={prog(t, final, 0.5)} estilo={{fontSize: 44}}>Projeto entregue.</Texto>
      <Texto x={1180} y={318} p={prog(t, final + 0.6, 0.6)} estilo={{fontSize: 108, color: CORES.aco}}>Resultado?</Texto>
    </Fundo>
  );
};
export const CENA03_FINAL = 13.4;
