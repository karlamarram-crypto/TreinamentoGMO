#!/usr/bin/env node
// Render do vídeo de abertura (Remotion).
//   node scripts/render.mjs --stills   → saida/stills/CenaXX.png (um still por cena, para aprovação)
//   node scripts/render.mjs            → saida/video_abertura_GMO_ONS.mp4 + saida/legendas.srt + saida/poster.png
//   node scripts/render.mjs --sem-legendas   (MP4 sem legendas queimadas)
//   node scripts/render.mjs --preview 28 52  → saida/preview_28-52.mp4 (trecho, com trilha e efeitos)
// O áudio final é masterizado em -14 LUFS, pico máximo -1 dBTP (ffmpeg loudnorm, duas passadas).
// Variável opcional: REMOTION_CHROME=/caminho/do/chrome-headless-shell
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {bundle} from '@remotion/bundler';
import {renderMedia, renderStill, selectComposition} from '@remotion/renderer';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SAIDA = path.join(RAIZ, 'saida');
const args = process.argv.slice(2);
const STILLS = args.includes('--stills');
const LEGENDAS = !args.includes('--sem-legendas');
const iPrev = args.indexOf('--preview');
const PREVIEW = iPrev >= 0 ? [parseFloat(args[iPrev + 1]), parseFloat(args[iPrev + 2])] : null;

const chromeLocal = ['/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell'];
const browserExecutable = process.env.REMOTION_CHROME || chromeLocal.find((c) => fs.existsSync(c)) || null;

const existe = (f) => fs.existsSync(path.join(RAIZ, 'assets', f));
const inputProps = {temLocucao: existe('locucao.mp3'), temTrilha: existe('trilha.wav'), legendas: LEGENDAS};

const srtTempo = (s) => {
  const ms = Math.round(s * 1000);
  const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), se = Math.floor((ms % 60000) / 1000), mi = ms % 1000;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(se).padStart(2, '0')},${String(mi).padStart(3, '0')}`;
};

async function main() {
  fs.mkdirSync(SAIDA, {recursive: true});
  console.log('Empacotando o projeto…');
  const serveUrl = await bundle({entryPoint: path.join(RAIZ, 'src/index.ts'), publicDir: path.join(RAIZ, 'assets')});
  const comum = {serveUrl, browserExecutable, chromiumOptions: {gl: 'swangle'}};
  const video = await selectComposition({...comum, id: 'Video', inputProps});

  // dados de tempo vindos do config.ts (avaliados no navegador)
  const {legendas, cenas} = await extrairDados();

  if (STILLS) {
    fs.mkdirSync(path.join(SAIDA, 'stills'), {recursive: true});
    let ini = 0;
    for (const c of cenas) {
      const frame = Math.min(video.durationInFrames - 1, Math.round((ini + c.still) * video.fps));
      const out = path.join(SAIDA, 'stills', `${c.id}.png`);
      await renderStill({...comum, composition: video, frame, output: out, inputProps});
      console.log(`  ${c.id} (${c.titulo}) · quadro ${frame} → ${path.relative(RAIZ, out)}`);
      ini += c.duracao;
    }
    return;
  }

  const mp4 = path.join(SAIDA, PREVIEW ? `preview_${PREVIEW[0]}-${PREVIEW[1]}.mp4` : 'video_abertura_GMO_ONS.mp4');
  const bruto = mp4.replace(/\.mp4$/, '.bruto.mp4');
  const frameRange = PREVIEW ? [Math.round(PREVIEW[0] * video.fps), Math.round(PREVIEW[1] * video.fps) - 1] : null;
  console.log(`Renderizando ${frameRange ? frameRange[1] - frameRange[0] + 1 : video.durationInFrames} quadros…`);
  let ultimo = -1;
  await renderMedia({
    ...comum, composition: video, codec: 'h264', audioCodec: 'aac', audioBitrate: '320k', enforceAudioTrack: true, crf: 18,
    outputLocation: bruto, inputProps, frameRange,
    onProgress: ({progress}) => {
      const p = Math.floor(progress * 100);
      if (p !== ultimo && p % 5 === 0) { process.stdout.write(`\r  ${p}%   `); ultimo = p; }
    },
  });
  masterizar(bruto, mp4);
  fs.unlinkSync(bruto);
  console.log(`\n  → ${path.relative(RAIZ, mp4)}`);
  if (PREVIEW) return;

  fs.writeFileSync(path.join(SAIDA, 'legendas.srt'),
    legendas.map((l, i) => `${i + 1}\n${srtTempo(l.ini)} --> ${srtTempo(l.fim)}\n${l.texto}\n`).join('\n'));
  console.log('  → saida/legendas.srt');

  await renderStill({...comum, composition: video, frame: video.durationInFrames - 1, output: path.join(SAIDA, 'poster.png'), inputProps});
  console.log('  → saida/poster.png');
}

// Master: -14 LUFS integrados, pico máximo -1 dBTP (loudnorm em duas passadas); vídeo copiado
function masterizar(entrada, saida) {
  const medir = execFileSync('sh', ['-c', `ffmpeg -hide_banner -i "${entrada}" -af loudnorm=I=-14:TP=-1:LRA=11:print_format=json -f null - 2>&1`]).toString();
  const m = JSON.parse(medir.slice(medir.lastIndexOf('{'), medir.lastIndexOf('}') + 1));
  const filtro = `loudnorm=I=-14:TP=-1:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', entrada, '-c:v', 'copy', '-af', filtro, '-ar', '48000', '-c:a', 'aac', '-b:a', '320k', '-movflags', '+faststart', saida]);
  console.log(`\n  master: ${m.input_i} LUFS → -14 LUFS`);
}

// Lê tempos e legendas direto do config.ts (Node 22+ entende TypeScript simples)
async function extrairDados() {
  const c = await import(path.join(RAIZ, 'src/config.ts'));
  return {legendas: c.legendas(), cenas: c.CENAS};
}

main().catch((e) => { console.error(e); process.exit(1); });
