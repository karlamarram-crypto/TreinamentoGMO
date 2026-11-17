import React from 'react';
import {AbsoluteFill, Audio, Sequence, Series, staticFile, useVideoConfig} from 'remotion';
import {AJUSTE_FALA, AUDIO, CENAS, CORES, SONS, falaAjustada, inicioCena, quadros} from './config';
import {LOCUCAO} from './locucao.ts';
import {Legendas} from './componentes/Legendas';
import {Cena01} from './cenas/Cena01';
import {Cena02} from './cenas/Cena02';
import {Cena03} from './cenas/Cena03';
import {Cena04} from './cenas/Cena04';
import {Cena05} from './cenas/Cena05';
import {Cena06} from './cenas/Cena06';
import {Cena07} from './cenas/Cena07';
import {Cena08} from './cenas/Cena08';

export const COMPONENTES: Record<string, React.FC> = {Cena01, Cena02, Cena03, Cena04, Cena05, Cena06, Cena07, Cena08};

export type PropsVideo = {temLocucao: boolean; temTrilha: boolean; legendas: boolean};

const db = (v: number) => Math.pow(10, v / 20);

// trechos com voz (tempo global), para o ducking da trilha
const trechosVoz = (): [number, number][] =>
  CENAS.flatMap((c, i) => (falaAjustada(c.id) ? falaAjustada(c.id)!.frases.map(([a, b]) => [inicioCena(i) + a, inicioCena(i) + b] as [number, number]) : []));

// Locução da cena; se houver AJUSTE_FALA, o arquivo é tocado em dois trechos
const Locucao: React.FC<{id: string}> = ({id}) => {
  const real = LOCUCAO[id];
  if (!real) return null;
  const aj = AJUSTE_FALA[id];
  const src = staticFile(real.arquivo);
  if (!aj || !real.frases[aj.frase]) {
    return (
      <Sequence from={quadros(real.inicio)} layout="none" name="locução">
        <Audio src={src} />
      </Sequence>
    );
  }
  const corte = real.frases[aj.frase][0] - real.inicio - 0.06; // segundo do arquivo onde começa a frase
  return (
    <>
      <Sequence from={quadros(real.inicio)} durationInFrames={quadros(corte)} layout="none" name="locução (parte 1)">
        <Audio src={src} />
      </Sequence>
      <Sequence from={quadros(aj.inicio - 0.06)} layout="none" name="locução (parte 2)">
        <Audio src={src} trimBefore={quadros(corte)} />
      </Sequence>
    </>
  );
};

export const Video: React.FC<PropsVideo> = ({temLocucao, temTrilha, legendas}) => {
  const {fps} = useVideoConfig();
  const voz = trechosVoz();
  const ducking = (t: number) => {
    // trilha cai ~10 dB sob a voz, com rampas curtas
    let g = 1;
    for (const [a, b] of voz) {
      const entra = Math.min(1, Math.max(0, (t - (a - 0.15)) / 0.15));
      const sai = Math.min(1, Math.max(0, ((b + 0.25) - t) / 0.25));
      g = Math.min(g, 1 - (1 - db(AUDIO.duckingDb)) * Math.min(entra, sai));
    }
    return g;
  };
  return (
    <AbsoluteFill style={{backgroundColor: CORES.marinho}}>
      <Series>
        {CENAS.map((c) => {
          const Comp = COMPONENTES[c.id];
          return (
            <Series.Sequence key={c.id} durationInFrames={quadros(c.duracao)} name={`${c.id} · ${c.titulo}`}>
              <Comp />
              <Locucao id={c.id} />
            </Series.Sequence>
          );
        })}
      </Series>
      {legendas && <Legendas />}
      {temTrilha && <Audio src={staticFile(AUDIO.trilha)} volume={(f) => ducking(f / fps)} name="trilha" />}
      {SONS().map((s, i) => (
        <Sequence key={i} from={Math.max(0, quadros(s.t))} durationInFrames={s.dur ? quadros(s.dur) : undefined} layout="none" name={s.arquivo}>
          <Audio src={staticFile(`sfx/${s.arquivo}`)} volume={(f) => db(s.db ?? AUDIO.sfxDb) * (s.dur ? Math.min(1, (quadros(s.dur) - f) / (s.dur > 2 ? quadros(s.dur) : 5)) : 1)} />
        </Sequence>
      ))}
      {temLocucao && <Audio src={staticFile(AUDIO.locucao)} />}
    </AbsoluteFill>
  );
};
