#!/usr/bin/env node
// Lê assets/locucao/cenaXX.mp3, detecta as pausas (ffmpeg silencedetect) e grava src/locucao.ts
// com a duração de cada trecho e o início/fim de cada frase. config.ts usa isso para
// legendas e animações. Rode de novo depois de trocar qualquer arquivo de locução.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const {CENAS, frasesDe, AUDIO} = await import(path.join(RAIZ, 'src/config.ts'));
// segundos entre o início da cena e o início da fala (Cena 1 abre com 0,5 s de preto)
const OFFSETS = {Cena01: 0.9, Cena05: 0.3};
const OFFSET_PADRAO = 0.25;

const saida = {};
for (const [i, c] of CENAS.entries()) {
  const arq = `${AUDIO.locucaoDir}/cena${String(i + 1).padStart(2, '0')}.mp3`;
  const OFFSET = OFFSETS[c.id] ?? OFFSET_PADRAO;
  const f = path.join(RAIZ, 'assets', arq);
  if (!fs.existsSync(f)) continue;
  const dur = parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString());
  const log = execFileSync('sh', ['-c', `ffmpeg -hide_banner -i "${f}" -af silencedetect=noise=-36dB:d=0.08 -f null - 2>&1`]).toString();
  const pausas = [];
  let ini = null;
  for (const l of log.split('\n')) {
    const a = /silence_start: ([\d.]+)/.exec(l);
    const b = /silence_end: ([\d.]+)/.exec(l);
    if (a) ini = parseFloat(a[1]);
    if (b && ini !== null) { pausas.push([ini, parseFloat(b[1])]); ini = null; }
  }
  if (ini !== null) pausas.push([ini, dur]);
  const falaIni = pausas.find(([a]) => a <= 0.05)?.[1] ?? 0;
  const falaFim = pausas.find(([, b]) => b >= dur - 0.05)?.[0] ?? dur;
  const internas = pausas.filter(([a, b]) => a > 0.05 && b < dur - 0.05);
  const frases = frasesDe(c.loc);
  // para cada fronteira entre frases, a pausa mais próxima de onde ela deveria cair
  // (posição esperada pelo tamanho do texto), dando preferência às pausas mais longas
  const pesos = frases.map((fr) => fr.length + 14);
  const total = pesos.reduce((a, b) => a + b, 0);
  const cortes = [];
  let acc = 0, depoisDe = 0;
  for (let k = 0; k < frases.length - 1; k++) {
    acc += pesos[k];
    const esperado = falaIni + ((falaFim - falaIni) * acc) / total;
    const cands = internas.filter(([a]) => a > depoisDe);
    if (!cands.length) break;
    const melhor = cands.reduce((m, p) => {
      const custo = Math.abs((p[0] + p[1]) / 2 - esperado) - 3 * (p[1] - p[0]);
      return !m || custo < m.custo ? {p, custo} : m;
    }, null).p;
    cortes.push(melhor);
    depoisDe = melhor[1];
  }
  const tempos = frases.map((_, k) => [
    OFFSET + (k === 0 ? falaIni : cortes[k - 1]?.[1] ?? falaIni),
    OFFSET + (k === frases.length - 1 ? falaFim : cortes[k]?.[0] ?? falaFim),
  ]);
  saida[c.id] = {arquivo: arq, inicio: OFFSET, duracao: +dur.toFixed(3), frases: tempos.map(([a, b]) => [+a.toFixed(3), +b.toFixed(3)])};
  const aviso = OFFSET + dur > c.duracao - (c.fimLegenda ?? 0.3) ? '  ⚠ passa do tempo da cena' : '';
  const faltam = cortes.length < frases.length - 1 ? `  ⚠ achei ${cortes.length + 1} de ${frases.length} frases` : '';
  console.log(`${c.id}: ${dur.toFixed(2)}s de fala em ${c.duracao}s de cena · frases ${tempos.map(([a]) => a.toFixed(1)).join(', ')}${aviso}${faltam}`);
}
fs.writeFileSync(path.join(RAIZ, 'src/locucao.ts'),
  '// Gerado por scripts/sincronizar-locucao.mjs a partir de assets/locucao/*.mp3. Não edite à mão.\n' +
  'export type TrechoLocucao = {arquivo: string; inicio: number; duracao: number; frases: [number, number][]};\n' +
  'export const LOCUCAO: Record<string, TrechoLocucao> = ' + JSON.stringify(saida, null, 2) + ';\n');
console.log('→ src/locucao.ts');
