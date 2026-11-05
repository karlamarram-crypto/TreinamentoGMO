#!/usr/bin/env node
/* ==========================================================================
   CONECTADOS · Gerador da narração (ElevenLabs)
   --------------------------------------------------------------------------
   Gera um MP3 por trecho do roteiro (js/roteiro.js), com o alinhamento palavra
   a palavra que sincroniza legendas e animações, e embute o áudio em
   audio/narracao/audio.js (assim o vídeo funciona até sem servidor).

   Uso:
     ELEVENLABS_API_KEY=sk_... node ferramentas/gerar-narracao.mjs
     node ferramentas/gerar-narracao.mjs --voz "Dani Carioca"     (padrão)
     node ferramentas/gerar-narracao.mjs --voz-id <id>            (voz específica)
     node ferramentas/gerar-narracao.mjs --somente c11b           (só um trecho; ex.: nome da empresa)
     node ferramentas/gerar-narracao.mjs --listar-vozes "Dani"    (procura vozes)

   Requer Node 18+. Nada é instalado.
   ========================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SAIDA = path.join(RAIZ, 'audio', 'narracao');
const API = 'https://api.elevenlabs.io';

const args = process.argv.slice(2);
const arg = (nome, padrao) => {
  const i = args.indexOf(nome);
  return i >= 0 ? args[i + 1] : padrao;
};
const VOZ_NOME = arg('--voz', 'Dani Carioca');
const VOZ_ID = arg('--voz-id', '');
const MODELO = arg('--modelo', 'eleven_multilingual_v2');
const SOMENTE = arg('--somente', '');
const LISTAR = arg('--listar-vozes', '');
const VELOCIDADE = parseFloat(arg('--velocidade', '0.96'));

// Sem chave na variável, a requisição sai sem cabeçalho (útil quando um proxy injeta a credencial).
const CHAVE = process.env.ELEVENLABS_API_KEY || '';
const cabecalhos = extra => Object.assign(CHAVE ? { 'xi-api-key': CHAVE } : {}, extra || {});

async function api(metodo, rota, corpo) {
  const r = await fetch(API + rota, {
    method: metodo,
    headers: cabecalhos(corpo ? { 'Content-Type': 'application/json' } : {}),
    body: corpo ? JSON.stringify(corpo) : undefined
  });
  const txt = await r.text();
  if (!r.ok) throw new Error(`${metodo} ${rota} → HTTP ${r.status}: ${txt.slice(0, 400)}`);
  return txt ? JSON.parse(txt) : {};
}

// Carrega config.js e roteiro.js (scripts de navegador) num contexto isolado
function carregarRoteiro() {
  const ctx = { window: {}, console };
  ctx.window.CX = {};
  ctx.CX = ctx.window.CX;
  vm.createContext(ctx);
  for (const f of ['js/config.js', 'js/roteiro.js']) {
    vm.runInContext(fs.readFileSync(path.join(RAIZ, f), 'utf8').replace(/window\.CX = window\.CX \|\| \{\};/, ''), ctx, { filename: f });
  }
  return ctx.CX;
}

const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

async function encontrarVoz() {
  if (VOZ_ID) return { id: VOZ_ID, nome: VOZ_NOME };
  // 1) vozes já na conta
  try {
    const minhas = await api('GET', `/v2/voices?search=${encodeURIComponent(VOZ_NOME)}&page_size=50`);
    const v = (minhas.voices || []).find(x => norm(x.name).includes(norm(VOZ_NOME))) || (minhas.voices || [])[0];
    if (v) return { id: v.voice_id, nome: v.name, origem: 'conta' };
  } catch (e) {
    console.warn('Aviso ao buscar vozes da conta:', e.message);
  }
  // 2) biblioteca compartilhada → adiciona à conta
  const lib = await api('GET', `/v1/shared-voices?search=${encodeURIComponent(VOZ_NOME)}&page_size=50`);
  const cand = (lib.voices || []);
  const v = cand.find(x => norm(x.name).includes(norm(VOZ_NOME))) || cand.find(x => (x.language || '').startsWith('pt')) || cand[0];
  if (!v) throw new Error(`Nenhuma voz encontrada para "${VOZ_NOME}". Use --listar-vozes para procurar.`);
  console.log(`Voz encontrada na biblioteca: ${v.name} (${v.accent || ''} ${v.gender || ''} ${v.age || ''}) · adicionando à conta…`);
  const add = await api('POST', `/v1/voices/add/${v.public_owner_id}/${v.voice_id}`, { new_name: v.name });
  return { id: add.voice_id || v.voice_id, nome: v.name, origem: 'biblioteca' };
}

// Converte o alinhamento por caractere em palavras (ignora marcações <break …/>)
function palavras(al) {
  const ch = al.characters, ini = al.character_start_times_seconds, fim = al.character_end_times_seconds;
  const out = [];
  let dentroTag = false, atual = null;
  for (let i = 0; i < ch.length; i++) {
    const c = ch[i];
    if (c === '<') { dentroTag = true; }
    if (dentroTag) {
      if (c === '>') dentroTag = false;
      if (atual) { out.push(atual); atual = null; }
      continue;
    }
    if (/\s/.test(c)) {
      if (atual) { out.push(atual); atual = null; }
      continue;
    }
    if (!atual) atual = { p: '', i: ini[i], f: fim[i] };
    atual.p += c;
    atual.f = fim[i];
  }
  if (atual) out.push(atual);
  return out.map(w => ({ p: w.p, i: +w.i.toFixed(3), f: +w.f.toFixed(3) }));
}

async function main() {
  if (LISTAR) {
    const lib = await api('GET', `/v1/shared-voices?search=${encodeURIComponent(LISTAR)}&page_size=30`);
    (lib.voices || []).forEach(v => console.log(`${v.voice_id}  ${v.name}  · ${v.language || ''} ${v.accent || ''} ${v.gender || ''} ${v.age || ''} · ${v.use_case || ''}`));
    return;
  }
  const CX = carregarRoteiro();
  const voz = await encontrarVoz();
  console.log(`Usando a voz: ${voz.nome} (${voz.id})`);
  fs.mkdirSync(SAIDA, { recursive: true });

  // dados anteriores (para gerar só um trecho sem perder os outros)
  let anteriores = { clipes: {} }, audioAnt = {};
  try {
    const c = { window: { CX: {} } };
    c.CX = c.window.CX;
    vm.createContext(c);
    vm.runInContext(fs.readFileSync(path.join(SAIDA, 'dados.js'), 'utf8').replace(/window\.CX = window\.CX \|\| \{\};/, ''), c);
    if (c.CX.narracaoDados) anteriores = c.CX.narracaoDados;
  } catch (e) { /* primeira geração */ }
  for (const id of Object.keys(anteriores.clipes || {})) {
    const f = path.join(SAIDA, id + '.mp3');
    if (fs.existsSync(f)) audioAnt[id] = fs.readFileSync(f).toString('base64');
  }

  const empresa = (CX.config.empresa.nome || '').trim();
  const empresaDefinida = empresa && !/^\[.*\]$/.test(empresa);
  const clipes = CX.roteiro.narracao.filter(c => (!SOMENTE || SOMENTE.split(',').includes(c.id)) && (!c.opcional || empresaDefinida));
  const dados = Object.assign({ clipes: {} }, anteriores, { voz: { id: voz.id, nome: voz.nome }, modelo: MODELO, gerado: new Date().toISOString() });

  const todos = CX.roteiro.narracao;
  for (const clip of clipes) {
    const texto = CX.textoTTS(clip);
    const k = todos.indexOf(clip);
    const ant = k > 0 ? todos[k - 1].frases.join(' ').replace('{EMPRESA}', empresa) : undefined;
    const prox = k < todos.length - 1 ? todos[k + 1].frases.join(' ').replace('{EMPRESA}', empresa) : undefined;
    process.stdout.write(`${clip.id}: "${texto.slice(0, 70)}${texto.length > 70 ? '…' : ''}" … `);
    const r = await api('POST', `/v1/text-to-speech/${voz.id}/with-timestamps?output_format=mp3_44100_128`, {
      text: texto,
      model_id: MODELO,
      previous_text: ant,
      next_text: prox,
      voice_settings: { stability: 0.5, similarity_boost: 0.8, style: 0.12, use_speaker_boost: true, speed: VELOCIDADE }
    });
    const buf = Buffer.from(r.audio_base64, 'base64');
    fs.writeFileSync(path.join(SAIDA, clip.id + '.mp3'), buf);
    const ws = palavras(r.alignment || r.normalized_alignment);
    const dur = ws.length ? ws[ws.length - 1].f + 0.12 : 0;
    dados.clipes[clip.id] = { dur: +dur.toFixed(3), palavras: ws };
    audioAnt[clip.id] = r.audio_base64;
    console.log(`${dur.toFixed(2)}s, ${ws.length} palavras`);
  }

  // checagem de encaixe no roteiro
  console.log('\nEncaixe no roteiro:');
  const ord = todos.filter(c => dados.clipes[c.id]);
  ord.forEach((c, i) => {
    const d = dados.clipes[c.id];
    const t = d.t !== undefined ? d.t : c.t;
    const cena = CX.roteiro.cenas.find(s => s.id === c.cena);
    const prox = ord[i + 1];
    const tp = prox ? (dados.clipes[prox.id].t !== undefined ? dados.clipes[prox.id].t : prox.t) : Infinity;
    const fim = t + d.dur;
    const ok = fim <= Math.min(tp - 0.15, cena.fim + 0.6);
    console.log(`  ${c.id.padEnd(5)} ${t.toFixed(1).padStart(6)}s → ${fim.toFixed(1).padStart(6)}s   cena ${c.cena} termina em ${cena.fim}s   ${ok ? 'ok' : '⚠ passa do limite'}`);
  });

  fs.writeFileSync(path.join(SAIDA, 'dados.js'),
    '/* Gerado por ferramentas/gerar-narracao.mjs (ElevenLabs). Não edite à mão. */\n' +
    'window.CX = window.CX || {};\nCX.narracaoDados = ' + JSON.stringify(dados) + ';\n');
  fs.writeFileSync(path.join(SAIDA, 'audio.js'),
    '/* Gerado por ferramentas/gerar-narracao.mjs: narração embutida (base64). Não edite à mão. */\n' +
    'window.CX = window.CX || {};\nCX.narracaoAudio = {\n' +
    Object.keys(audioAnt).sort().map(id => `  ${JSON.stringify(id)}: "data:audio/mpeg;base64,${audioAnt[id]}"`).join(',\n') + '\n};\n');
  console.log('\nPronto: audio/narracao/*.mp3, dados.js e audio.js atualizados.');
}

main().catch(e => {
  console.error('\nErro:', e.message);
  if (/401|403/.test(e.message)) console.error('Confira a chave da ElevenLabs (variável ELEVENLABS_API_KEY, enviada no cabeçalho xi-api-key).');
  process.exit(1);
});
