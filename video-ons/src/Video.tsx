import React from 'react';
import {AbsoluteFill, Audio, Series, interpolate, staticFile, useVideoConfig} from 'remotion';
import {AUDIO, CENAS, CORES, DURACAO_TOTAL, quadros} from './config';
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

export const Video: React.FC<PropsVideo> = ({temLocucao, temTrilha, legendas}) => {
  const {fps} = useVideoConfig();
  const fim = DURACAO_TOTAL * fps;
  const ganhoTrilha = Math.pow(10, AUDIO.trilhaDb / 20);
  return (
    <AbsoluteFill style={{backgroundColor: CORES.marinho}}>
      <Series>
        {CENAS.map((c) => {
          const Comp = COMPONENTES[c.id];
          return (
            <Series.Sequence key={c.id} durationInFrames={quadros(c.duracao)} name={`${c.id} · ${c.titulo}`}>
              <Comp />
            </Series.Sequence>
          );
        })}
      </Series>
      {legendas && <Legendas />}
      {/* Pontos de entrada de áudio: assets/locucao.mp3 e assets/trilha.mp3 (opcionais) */}
      {temLocucao && <Audio src={staticFile(AUDIO.locucao)} />}
      {temTrilha && (
        <Audio
          src={staticFile(AUDIO.trilha)}
          volume={(f) =>
            interpolate(f, [0, AUDIO.fadeInTrilha * fps, fim - AUDIO.fadeOutTrilha * fps, fim], [0, 1, 1, 0], {
              extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
            }) * (temLocucao ? ganhoTrilha : 1)
          }
        />
      )}
    </AbsoluteFill>
  );
};
