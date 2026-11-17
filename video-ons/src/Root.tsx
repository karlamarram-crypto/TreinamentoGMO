import React from 'react';
import {Composition} from 'remotion';
import {ALTURA, CENAS, DURACAO_TOTAL, FPS, LARGURA, quadros} from './config';
import {COMPONENTES, Video, PropsVideo} from './Video';

const padrao: PropsVideo = {temLocucao: false, temTrilha: false, legendas: true};

export const Root: React.FC = () => (
  <>
    <Composition id="Video" component={Video} durationInFrames={quadros(DURACAO_TOTAL)} fps={FPS} width={LARGURA} height={ALTURA} defaultProps={padrao} />
    {CENAS.map((c) => (
      <Composition key={c.id} id={c.id} component={COMPONENTES[c.id]} durationInFrames={quadros(c.duracao)} fps={FPS} width={LARGURA} height={ALTURA} />
    ))}
  </>
);
