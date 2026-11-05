#!/usr/bin/env node
/* ==========================================================================
   CONECTADOS · Exportar MP4 (versão linear, sem interação)
   --------------------------------------------------------------------------
   Renderiza o vídeo quadro a quadro no Chromium (Playwright) e a trilha
   completa (narração + música + efeitos) offline, e junta tudo com o ffmpeg.
   Também gera o arquivo de legendas .srt.

   Uso:
     node ferramentas/exportar-mp4.mjs                    → saida/conectados-1080p.mp4
     node ferramentas/exportar-mp4.mjs --4k               → 3840 x 2160
     node ferramentas/exportar-mp4.mjs --legendas         → legendas gravadas na imagem
     node ferramentas/exportar-mp4.mjs --sem-c11          → sem a cena dos participantes (reuso em outras turmas)
     node ferramentas/exportar-mp4.mjs --inicio 50 --fim 90   (trecho, para revisão rápida)

   Requisitos: Node 18+, Playwright com Chromium, ffmpeg no PATH.
   ========================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const tem = n => args.includes(n);
const val = (n, p) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : p; };
const K4 = tem('--4k');
const LEG = tem('--legendas');
const SEM_C11 = tem('--sem-c11');
const FPS = 24;
const DUR = 176;
const INI = parseFloat(val('--inicio', '0'));
const FIM = parseFloat(val('--fim', String(DUR)));
const PASTA = path.join(RAIZ, 'saida');
const nomeBase = 'conectados-' + (K4 ? '4k' : '1080p') + (LEG ? '-legendado' : '') + (SEM_C11 ? '-sem-c11' : '') + (INI > 0 || FIM < DUR ? `-${INI}-${FIM}` : '');

const require = createRequire(import.meta.url);
let playwright;
try { playwright = require('playwright'); } catch (e) {
  try { playwright = require(path.join(process.env.NODE_PATH || '', 'playwright')); } catch (e2) {
    console.error('Playwright não encontrado. Instale com: npm i -D playwright && npx playwright install chromium');
    process.exit(1);
  }
}

// Trechos do vídeo a renderizar (a versão sem C11 pula de 1:46 para 2:06)
const trechos = SEM_C11 ? [[INI, Math.min(FIM, 106)], [Math.max(INI, 126), FIM]].filter(([a, b]) => b > a) : [[INI, FIM]];

const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.webp': 'image/webp' };
function servidor() {
  return new Promise(ok => {
    const s = http.createServer((req, res) => {
      const f = path.join(RAIZ, decodeURIComponent(req.url.split('?')[0]));
      if (!f.startsWith(RAIZ) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(res);
    });
    s.listen(0, '127.0.0.1', () => ok(s));
  });
}

function srt(legs) {
  const t = s => {
    const ms = Math.round(s * 1000);
    const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), se = Math.floor((ms % 60000) / 1000), mi = ms % 1000;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(se).padStart(2, '0')},${String(mi).padStart(3, '0')}`;
  };
  return legs.map((l, i) => `${i + 1}\n${t(l.ini)} --> ${t(l.fim)}\n${l.txt}\n`).join('\n');
}

async function main() {
  fs.mkdirSync(PASTA, { recursive: true });
  const srv = await servidor();
  const url = `http://127.0.0.1:${srv.address().port}/index.html${K4 ? '?4k' : ''}`;
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: K4 ? 2 : 1 });
  page.on('pageerror', e => console.error('Erro na página:', e.message));
  await page.goto(url);
  await page.waitForFunction(() => document.body.classList.contains('pronto'), null, { timeout: 30000 });
  await page.addStyleTag({ content: '.capa,.controles,.legenda,.dica,.fim{display:none!important}' });
  await page.evaluate(leg => { CX.player.legendasNoQuadro = leg; }, LEG);

  // ---------- legendas (.srt) ----------
  const legs = await page.evaluate(() => {
    const out = [];
    Object.values(CX.voz.clipes).sort((a, b) => a.t - b.t).forEach(c => {
      c.frases.forEach((f, k) => {
        const ws = c.palavras.filter(w => w.frase === k);
        if (ws.length) out.push({ ini: c.t + ws[0].i, fim: c.t + ws[ws.length - 1].f + 0.5, txt: f });
      });
    });
    return out;
  });
  const deslocar = t => { let acc = 0; for (const [a, b] of trechos) { if (t >= a && t <= b) return acc + (t - a); acc += b - a; } return null; };
  const legsSaida = legs.map(l => ({ ini: deslocar(l.ini), fim: deslocar(Math.min(l.fim, l.ini + 8)), txt: l.txt })).filter(l => l.ini !== null && l.fim !== null);
  fs.writeFileSync(path.join(PASTA, nomeBase + '.srt'), srt(legsSaida));

  // ---------- áudio offline ----------
  console.log('Renderizando a trilha (narração + música + efeitos)…');
  const tamanho = await page.evaluate(async () => {
    window.__wav = new Uint8Array(await CX.audio.renderizarOffline(48000));
    return window.__wav.length;
  });
  const wavPath = path.join(PASTA, nomeBase + '.wav');
  const fd = fs.openSync(wavPath, 'w');
  const PEDACO = 4 * 1024 * 1024;
  for (let o = 0; o < tamanho; o += PEDACO) {
    const b64 = await page.evaluate(([o, n]) => {
      const s = window.__wav.subarray(o, o + n);
      let bin = '';
      for (let i = 0; i < s.length; i += 0x8000) bin += String.fromCharCode.apply(null, s.subarray(i, i + 0x8000));
      return btoa(bin);
    }, [o, PEDACO]);
    fs.writeSync(fd, Buffer.from(b64, 'base64'));
  }
  fs.closeSync(fd);
  await page.evaluate(() => { delete window.__wav; });

  // ---------- quadros → ffmpeg ----------
  const saida = path.join(PASTA, nomeBase + '.mp4');
  const filtroAudio = trechos.length > 1
    ? `[1:a]atrim=${trechos[0][0]}:${trechos[0][1]},asetpts=PTS-STARTPTS[a0];[1:a]atrim=${trechos[1][0]}:${trechos[1][1] + 0.6},asetpts=PTS-STARTPTS[a1];[a0][a1]acrossfade=d=0.5[a]`
    : `[1:a]atrim=${trechos[0][0]}:${trechos[0][1]},asetpts=PTS-STARTPTS[a]`;
  const ff = spawn('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-i', wavPath,
    '-filter_complex', filtroAudio, '-map', '0:v', '-map', '[a]',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', K4 ? '20' : '18', '-pix_fmt', 'yuv420p', '-r', String(FPS),
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', '-shortest',
    saida
  ], { stdio: ['pipe', 'inherit', 'inherit'] });
  const total = trechos.reduce((a, [x, y]) => a + Math.round((y - x) * FPS), 0);
  let n = 0;
  const t0 = Date.now();
  for (const [a, b] of trechos) {
    const qs = Math.round((b - a) * FPS);
    for (let i = 0; i < qs; i++) {
      const t = a + i / FPS;
      const b64 = await page.evaluate(t => {
        CX.player.desenharEm(t);
        return document.getElementById('tela').toDataURL('image/jpeg', 0.93).split(',')[1];
      }, t);
      const ok = ff.stdin.write(Buffer.from(b64, 'base64'));
      if (!ok) await new Promise(r => ff.stdin.once('drain', r));
      n++;
      if (n % 48 === 0) {
        const el = (Date.now() - t0) / 1000;
        process.stdout.write(`\rQuadros: ${n}/${total} (${Math.round((n / total) * 100)}%) · restam ~${Math.round((el / n) * (total - n))}s   `);
      }
    }
  }
  ff.stdin.end();
  await new Promise((ok, erro) => ff.on('close', c => (c === 0 ? ok() : erro(new Error('ffmpeg terminou com código ' + c)))));
  await browser.close();
  srv.close();
  fs.unlinkSync(wavPath);
  console.log(`\nPronto: ${path.relative(RAIZ, saida)} e ${path.relative(RAIZ, path.join(PASTA, nomeBase + '.srt'))}`);
}

main().catch(e => { console.error(e); process.exit(1); });
