# Vídeo de abertura · Gestão da Mudança na Prática (ONS)

Remotion (React + TypeScript), 1920x1080, 30 fps, 2:00.

```bash
npm install
npm run estudio     # pré-visualização no navegador (Remotion Studio)
npm run stills      # saida/stills/Cena01..08.png (um still por cena)
npm run render      # saida/video_abertura_GMO_ONS.mp4 + saida/legendas.srt + saida/poster.png
```

- `src/config.ts`: duração de cada cena (ajuste aqui para ressincronizar com a locução), cores, fontes, legendas.
- `src/data/participantes.ts`: nomes da Cena 6. O layout se adapta se a lista mudar.
- `src/cenas/Cena01.tsx` … `Cena08.tsx`: uma composição por cena; `src/Video.tsx` encadeia todas.
- `assets/`: logos; `locucao.mp3` e `trilha.mp3` entram automaticamente se existirem (trilha a -20 dB sob a locução, fade-in 2 s, fade-out 3 s).
- Sem locução, as falas são distribuídas no tempo de cada cena pelo tamanho do texto; legendas e animações seguem esses tempos.

Licença: o Remotion é gratuito para pessoas físicas e empresas com até 3 funcionários; uso por empresa maior exige licença da Remotion (remotion.pro).
