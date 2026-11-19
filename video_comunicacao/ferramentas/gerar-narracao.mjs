#!/usr/bin/env node
// Gera audio/cenaN.mp3 + audio/cenaN.alinhamento.json via ElevenLabs (with-timestamps).
// Uso: ELEVENLABS_API_KEY=... node ferramentas/gerar-narracao.mjs [cena1 cena2 ...]
// A chave é lida da variável de ambiente e nunca é impressa nem gravada.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const roteiro = JSON.parse(fs.readFileSync(path.join(RAIZ, 'roteiro.json'), 'utf8'));
const CHAVE = process.env.ELEVENLABS_API_KEY;
if (!CHAVE) {
  console.error('ELEVENLABS_API_KEY não definida. Coloque cena1.mp3 a cena7.mp3 em audio/ manualmente.');
  process.exit(2);
}
const pedidas = process.argv.slice(2);
const cenas = roteiro.cenas;

for (let i = 0; i < cenas.length; i++) {
  const c = cenas[i];
  if (pedidas.length && !pedidas.includes(c.id)) continue;
  const corpo = {
    text: c.texto,
    model_id: roteiro.modelo,
    language_code: 'pt',
    voice_settings: roteiro.voice_settings,
  };
  if (i > 0) corpo.previous_text = cenas.slice(0, i).map(x => x.texto).join(' ');
  if (i < cenas.length - 1) corpo.next_text = cenas[i + 1].texto;
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${roteiro.voz_id}/with-timestamps?output_format=mp3_44100_192`;
  let r = await fetch(url, { method: 'POST', headers: { 'xi-api-key': CHAVE, 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) });
  let txt = await r.text();
  if (!r.ok && r.status === 400 && /language_code|unsupported/i.test(txt)) {
    // multilingual_v2 pode recusar language_code; tenta sem ele
    delete corpo.language_code;
    r = await fetch(url, { method: 'POST', headers: { 'xi-api-key': CHAVE, 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) });
    txt = await r.text();
  }
  if (!r.ok) {
    if (/voice_not_found|not found/i.test(txt)) console.error(`VOZ NÃO ENCONTRADA (${roteiro.voz_id}). Adicione a voz em "My Voices" na ElevenLabs.`);
    console.error(`${c.id}: HTTP ${r.status}: ${txt.slice(0, 500)}`);
    process.exit(1);
  }
  const j = JSON.parse(txt);
  fs.writeFileSync(path.join(RAIZ, 'audio', `${c.id}.mp3`), Buffer.from(j.audio_base64, 'base64'));
  fs.writeFileSync(path.join(RAIZ, 'audio', `${c.id}.alinhamento.json`), JSON.stringify(j.alignment));
  console.log(`${c.id}: ok`);
}
