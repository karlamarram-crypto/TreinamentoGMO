/* ==========================================================================
   CONECTADOS · PLAYER
   Relógio, renderização, controles, legendas, interações e personalização.
   ========================================================================== */
(function () {
  'use strict';
  const CX = window.CX;
  const MG = CX.MG;
  const A = CX.audio;
  const R = CX.roteiro;
  const DUR = R.duracao;
  const $ = s => document.querySelector(s);

  CX.reduzido = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- Personalização (config.js + navegador) ---------------- */
  const CHAVE = 'conectados:personalizacao:v1';
  let pers = {};
  try { pers = JSON.parse(localStorage.getItem(CHAVE) || '{}') || {}; } catch (e) { pers = {}; }
  function salvarPers() {
    try { localStorage.setItem(CHAVE, JSON.stringify(pers)); return true; } catch (e) { return false; }
  }
  const cfg = CX.config;
  const vazio = s => !s || /^\s*\[.*\]\s*$/.test(s);

  CX.participantes = () => cfg.participantes.map((p, i) => {
    const l = (pers.participantes || [])[i] || {};
    return {
      nome: (l.nome !== undefined && l.nome !== '' ? l.nome : p.nome) || '',
      foto: l.foto || p.foto || '',
      grupo: +(l.grupo || p.grupo || Math.floor(i / 5) + 1)
    };
  });
  CX.empresaNome = () => (pers.empresa && pers.empresa.trim()) || cfg.empresa.nome || '[NOME DA EMPRESA]';

  function carregarImagem(chave, src) {
    if (!src) { delete CX.imagens[chave]; return; }
    const atual = CX.imagens[chave];
    if (atual && atual._src === src) return;
    const im = new Image();
    im._src = src;
    im.onload = () => { sujo = true; };
    im.onerror = () => { console.warn('Imagem não encontrada:', src); delete CX.imagens[chave]; };
    im.src = src;
    CX.imagens[chave] = im;
  }
  function carregarImagens() {
    CX.participantes().forEach((p, i) => carregarImagem('participante:' + i, p.foto));
    Object.keys(cfg.personagens).forEach(k => carregarImagem('personagem:' + k, (pers.personagens || {})[k] || cfg.personagens[k].foto));
    carregarImagem('logo:empresa', (pers.logos || {}).empresa || cfg.empresa.logo);
    carregarImagem('logo:parceiro', (pers.logos || {}).parceiro || cfg.parceiro.logo);
  }

  // A empresa digitada no painel também vale para o texto narrado opcional
  function aplicarEmpresa() {
    if (pers.empresa && pers.empresa.trim()) cfg.empresa.nome = pers.empresa.trim();
  }

  function prepararDados() {
    aplicarEmpresa();
    CX.voz.preparar();
    CX.cenas.preparar();
    A.construirCues();
  }

  /* ---------------- Estado ---------------- */
  const cena = { lista: [] };
  let T = 0;
  let tocando = false;
  let iniciado = false;
  let relogioPerf = null;
  let sujo = true;
  let legendasOn = true;
  let interativo = true;
  const env = { ponteiro: { x: 0, y: 0, ativo: false }, cliques: [], interativo: true };

  const tela = $('#tela');
  const ctx = tela.getContext('2d', { alpha: false });
  const palco = $('#palco');

  /* ---------------- Tamanho ---------------- */
  let escalaBacking = 1;
  function redimensionar() {
    const vw = window.innerWidth, vh = window.innerHeight;
    let w = vw, h = (vw * 9) / 16;
    if (h > vh) { h = vh; w = (vh * 16) / 9; }
    palco.style.width = w + 'px';
    palco.style.height = h + 'px';
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const max = /[?&]4k\b/.test(location.search) ? 3840 : 2560;
    const bw = Math.min(Math.round(w * dpr), max);
    tela.width = bw;
    tela.height = Math.round((bw * 9) / 16);
    escalaBacking = bw / MG.W;
    sujo = true;
  }
  window.addEventListener('resize', redimensionar);

  /* ---------------- Renderização ---------------- */
  function cenaEm(t) {
    const l = cena.lista;
    for (let i = l.length - 1; i >= 0; i--) if (t >= l[i].ini) return l[i];
    return l[0];
  }

  function render() {
    ctx.setTransform(escalaBacking, 0, 0, escalaBacking, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    const c = cenaEm(Math.min(T, DUR - 0.001));
    env.interativo = interativo;
    try {
      ctx.save();
      c.desenhar(ctx, T - c.ini, T, env);
      ctx.restore();
    } catch (e) {
      ctx.restore();
      console.error('Erro na cena', c.id, e);
    }
    // acabamento: grão de filme e vinheta leve (unificam o visual)
    if (!CX.reduzido) MG.grao(ctx, T, 0.05);
    MG.vinheta(ctx, 0.3);
    // legendas gravadas na imagem (exportação acessível)
    if (CX.player && CX.player.legendasNoQuadro) {
      const txt = CX.voz.legenda(T);
      if (txt) {
        MG.fonte(ctx, 40, 500, 'texto');
        const w = Math.min(1500, ctx.measureText(txt).width);
        ctx.fillStyle = 'rgba(1,3,10,0.72)';
        MG.retArred(ctx, 960 - w / 2 - 24, 958, w + 48, 66, 8);
        ctx.fill();
        MG.texto(ctx, txt, 960, 992, { tam: 40, peso: 500, cor: MG.cor.branco });
      }
    }
    // brilho do cursor nas cenas interativas
    if (interativo && env.ponteiro.ativo && iniciado && cenaInterativa(c, T)) {
      MG.aditivo(ctx, () => MG.halo(ctx, env.ponteiro.x, env.ponteiro.y, 90, MG.cor.ambar, 0.2));
    }
    // ondulações de toque genéricas (fora das cenas que já desenham as suas)
    env.cliques.forEach(k => {
      if (k.T > T || T - k.T > 0.9 || ['C08', 'C11', 'C14', 'C15'].includes(k.cena)) return;
      const p = (T - k.T) / 0.9;
      ctx.strokeStyle = MG.rgba(MG.cor.ciano, 0.7 * (1 - p));
      ctx.lineWidth = 2;
      MG.circulo(ctx, k.x, k.y, 10 + 90 * MG.E.outC(p));
      ctx.stroke();
    });
  }

  function cenaInterativa(c, t) {
    return ['C08', 'C11', 'C14', 'C15'].includes(c.id);
  }

  /* ---------------- Relógio ---------------- */
  function tempoAtual() {
    const ta = A.tempo();
    if (ta !== null && ta !== undefined) return Math.max(0, ta);
    if (relogioPerf) return Math.max(0, relogioPerf.T0 + (performance.now() - relogioPerf.p0) / 1000);
    return T;
  }

  async function tocar() {
    if (T >= DUR - 0.05) {
      T = 0;
      env.cliques = [];
    }
    await A.iniciar();
    tocando = true;
    relogioPerf = { T0: T, p0: performance.now() };
    A.tocar(T);
    $('#fim').hidden = true;
    atualizarBotaoPlay();
    pedirWakeLock();
    mostrarControles();
  }
  function pausar() {
    T = tempoAtual();
    tocando = false;
    relogioPerf = null;
    A.parar();
    atualizarBotaoPlay();
    mostrarControles(true);
    sujo = true;
  }
  function alternar() {
    if (!iniciado) return iniciar();
    tocando ? pausar() : tocar();
  }
  function buscar(t) {
    const estava = tocando;
    if (tocando) { tocando = false; A.parar(); }
    T = Math.max(0, Math.min(DUR - 0.01, t));
    env.cliques = env.cliques.filter(k => k.T <= T);
    sujo = true;
    if (estava) tocar();
    atualizarTempo(true);
    $('#fim').hidden = true;
  }

  function iniciar() {
    if (iniciado) return;
    iniciado = true;
    $('#capa').classList.add('saindo');
    setTimeout(() => { $('#capa').hidden = true; }, 700);
    palco.classList.add('ativo');
    T = 0;
    tocar();
  }

  /* ---------------- Loop ---------------- */
  let ultimoTexto = null;
  function quadro() {
    requestAnimationFrame(quadro);
    try {
      passo();
    } catch (e) {
      console.error(e);
    }
  }
  function passo() {
    if (tocando) {
      T = tempoAtual();
      A.agendar();
      if (T >= DUR) {
        T = DUR - 0.001;
        tocando = false;
        A.parar();
        atualizarBotaoPlay();
        $('#fim').hidden = false;
        mostrarControles(true);
      }
      sujo = true;
    }
    if (sujo) {
      render();
      sujo = false;
      atualizarTempo();
      atualizarLegenda();
      atualizarDica();
    }
  }

  /* ---------------- Legendas e dicas ---------------- */
  function atualizarLegenda() {
    const txt = legendasOn && iniciado ? CX.voz.legenda(T) : '';
    if (txt !== ultimoTexto) {
      const el = $('#legenda');
      el.textContent = txt;
      el.classList.toggle('visivel', !!txt);
      ultimoTexto = txt;
    }
  }
  let ultimaDica = null;
  function atualizarDica() {
    let txt = '';
    if (interativo && iniciado) {
      const c = cenaEm(T);
      if (c.dica) {
        const ini = typeof c.dica.ini === 'number' ? c.dica.ini : CX.T[c.dica.ini];
        if (ini !== undefined && T >= ini && T <= ini + c.dica.dur) txt = c.dica.txt;
      }
    }
    if (txt !== ultimaDica) {
      const el = $('#dica');
      if (txt) el.textContent = txt;
      el.classList.toggle('visivel', !!txt);
      ultimaDica = txt;
    }
  }

  /* ---------------- Controles ---------------- */
  const fmt = s => { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  let ultimoSeg = -1;
  function atualizarTempo(forcar) {
    const p = (T / DUR) * 100;
    $('#barra-progresso').style.width = p + '%';
    $('#barra-cabeca').style.left = p + '%';
    const s = Math.floor(T);
    if (s !== ultimoSeg || forcar) {
      ultimoSeg = s;
      $('#tempo').textContent = `${fmt(T)} / ${fmt(DUR)}`;
      const c = cenaEm(T);
      $('#cena-atual').textContent = `${c.id} · ${c.nome}`;
      $('#barra').setAttribute('aria-valuenow', s);
      $('#barra').setAttribute('aria-valuetext', `${fmt(T)}, ${c.id} ${c.nome}`);
    }
  }
  function atualizarBotaoPlay() {
    const b = $('#btn-play');
    b.classList.toggle('tocando', tocando);
    b.setAttribute('aria-label', tocando ? 'Pausar' : 'Reproduzir');
    b.title = tocando ? 'Pausar (espaço)' : 'Reproduzir (espaço)';
  }

  function montarBarra() {
    const barra = $('#barra');
    const partes = $('#barra-partes');
    R.partes.forEach(p => {
      const d = document.createElement('div');
      d.className = 'parte';
      d.style.left = (p.ini / DUR) * 100 + '%';
      d.style.width = ((p.fim - p.ini) / DUR) * 100 + '%';
      d.title = p.nome;
      partes.appendChild(d);
    });
    R.cenas.forEach(c => {
      if (!c.ini) return;
      const m = document.createElement('div');
      m.className = 'marca';
      m.style.left = (c.ini / DUR) * 100 + '%';
      partes.appendChild(m);
    });
    const posT = e => {
      const r = barra.getBoundingClientRect();
      return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * DUR;
    };
    let arrastando = false;
    barra.addEventListener('pointerdown', e => {
      arrastando = true;
      barra.setPointerCapture(e.pointerId);
      if (!iniciado) { iniciado = true; $('#capa').hidden = true; palco.classList.add('ativo'); }
      buscar(posT(e));
    });
    barra.addEventListener('pointermove', e => {
      const t = posT(e);
      const c = cenaEm(t);
      const tip = $('#barra-dica');
      tip.textContent = `${fmt(t)} · ${c.id} ${c.nome}`;
      tip.style.left = (t / DUR) * 100 + '%';
      tip.classList.add('visivel');
      if (arrastando) buscar(t);
    });
    barra.addEventListener('pointerleave', () => $('#barra-dica').classList.remove('visivel'));
    barra.addEventListener('pointerup', () => { arrastando = false; });
    barra.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') { buscar(T - 5); e.preventDefault(); }
      if (e.key === 'ArrowRight') { buscar(T + 5); e.preventDefault(); }
    });
  }

  let timerOcultar = null;
  function mostrarControles(fixo) {
    palco.classList.remove('oculto');
    clearTimeout(timerOcultar);
    if (!fixo && tocando) timerOcultar = setTimeout(() => { if (tocando && !$('#painel').classList.contains('aberto')) palco.classList.add('oculto'); }, 2600);
  }

  function cenaVizinha(dir) {
    const l = R.cenas;
    let i = l.findIndex(c => T >= c.ini && T < c.fim);
    if (dir < 0 && T - l[i].ini > 1.5) return buscar(l[i].ini);
    i = Math.max(0, Math.min(l.length - 1, i + dir));
    buscar(l[i].ini + 0.01);
  }

  function telaCheia() {
    const el = document.documentElement;
    try {
      if (!document.fullscreenElement) el.requestFullscreen && el.requestFullscreen().catch(() => {});
      else document.exitFullscreen && document.exitFullscreen().catch(() => {});
    } catch (e) { /* opcional */ }
  }

  let wakeLock = null;
  async function pedirWakeLock() {
    try { if (navigator.wakeLock && !wakeLock) wakeLock = await navigator.wakeLock.request('screen'); } catch (e) { wakeLock = null; }
  }

  function alternarBotao(id, on) {
    const b = $(id);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  }

  function ligarControles() {
    $('#btn-play').addEventListener('click', alternar);
    $('#btn-voltar').addEventListener('click', () => cenaVizinha(-1));
    $('#btn-avancar').addEventListener('click', () => cenaVizinha(1));
    $('#btn-legenda').addEventListener('click', () => { legendasOn = !legendasOn; alternarBotao('#btn-legenda', legendasOn); sujo = true; ultimoTexto = null; });
    $('#btn-som').addEventListener('click', () => { A.setMudo(!A.mudo); alternarBotao('#btn-som', !A.mudo); $('#btn-som').classList.toggle('mudo', A.mudo); });
    $('#btn-interativo').addEventListener('click', () => { interativo = !interativo; alternarBotao('#btn-interativo', interativo); sujo = true; });
    $('#btn-personalizar').addEventListener('click', abrirPainel);
    $('#btn-tela').addEventListener('click', telaCheia);
    $('#capa').addEventListener('click', e => { if (!e.target.closest('.capa-link')) iniciar(); });
    $('#capa-personalizar').addEventListener('click', e => { e.stopPropagation(); abrirPainel(); });
    $('#fim-repetir').addEventListener('click', () => { buscar(0); env.cliques = []; tocar(); });
    $('#fim-personalizar').addEventListener('click', abrirPainel);

    palco.addEventListener('pointermove', e => {
      mostrarControles();
      const r = tela.getBoundingClientRect();
      env.ponteiro.x = ((e.clientX - r.left) / r.width) * MG.W;
      env.ponteiro.y = ((e.clientY - r.top) / r.height) * MG.H;
      env.ponteiro.ativo = e.target === tela;
      if (!tocando) sujo = true;
    });
    palco.addEventListener('pointerleave', () => { env.ponteiro.ativo = false; sujo = true; });

    tela.addEventListener('click', e => {
      if (!iniciado) return iniciar();
      const r = tela.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * MG.W, y = ((e.clientY - r.top) / r.height) * MG.H;
      if (!interativo) return alternar();
      const c = cenaEm(T);
      env.cliques.push({ x, y, T, cena: c.id });
      if (env.cliques.length > 200) env.cliques.shift();
      // som imediato da luz acendendo
      const tom = 0.8 + (x / MG.W) * 0.6;
      if (c.id === 'C08' || c.id === 'C15') A.agora('luzLiga', { vol: 0.5, zumbido: 0.4, tom });
      else if (c.id === 'C14') A.agora('luzLiga', { vol: 0.6, zumbido: 0.5, tom });
      else if (c.id === 'C11') A.agora('ping', { nota: ['F5', 'A5', 'C6', 'D6', 'F6'][Math.floor((x / MG.W) * 5)], vol: 0.7 });
      else A.agora('ping', { nota: ['D5', 'F5', 'A5', 'C6'][Math.floor((y / MG.H) * 4)], vol: 0.35 });
      sujo = true;
    });

    document.addEventListener('keydown', e => {
      const alvo = e.target;
      if (alvo && alvo.closest && alvo.closest('input, select, textarea, button')) {
        if (e.key !== ' ' || !alvo.closest('button')) return;
      }
      const k = e.key.toLowerCase();
      if (k === ' ' || k === 'k') { e.preventDefault(); alternar(); }
      else if (k === 'arrowleft' && (!alvo || alvo.id !== 'barra')) { buscar(T - 5); }
      else if (k === 'arrowright' && (!alvo || alvo.id !== 'barra')) { buscar(T + 5); }
      else if (k === 'j') buscar(T - 10);
      else if (k === 'l') buscar(T + 10);
      else if (k === 'home') buscar(0);
      else if (k === '[') cenaVizinha(-1);
      else if (k === ']') cenaVizinha(1);
      else if (k === 'c') $('#btn-legenda').click();
      else if (k === 'm') $('#btn-som').click();
      else if (k === 'i') $('#btn-interativo').click();
      else if (k === 'f') telaCheia();
      else if (k === 'p') abrirPainel();
      else if (k === 'escape') fecharPainel();
      else return;
      mostrarControles();
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden) wakeLock = null; else if (tocando) pedirWakeLock(); });
  }

  /* ---------------- Painel de personalização ---------------- */
  function reduzirImagem(arquivo, max = 520) {
    return new Promise((ok, erro) => {
      const fr = new FileReader();
      fr.onerror = erro;
      fr.onload = () => {
        if (/svg/.test(arquivo.type)) return ok(fr.result);
        const im = new Image();
        im.onerror = erro;
        im.onload = () => {
          const s = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight));
          const c = document.createElement('canvas');
          c.width = Math.round(im.naturalWidth * s);
          c.height = Math.round(im.naturalHeight * s);
          const g = c.getContext('2d');
          g.drawImage(im, 0, 0, c.width, c.height);
          ok(/png/.test(arquivo.type) ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', 0.86));
        };
        im.src = fr.result;
      };
      fr.readAsDataURL(arquivo);
    });
  }

  function aviso(txt, erro) {
    const el = $('#painel-aviso');
    el.textContent = txt;
    el.classList.toggle('erro', !!erro);
  }

  function aplicar(msg) {
    const ok = salvarPers();
    carregarImagens();
    prepararDados();
    if (tocando) A.tocar(T);
    sujo = true;
    aviso(ok ? (msg || 'Salvo neste navegador.') : 'Não foi possível salvar neste navegador (armazenamento bloqueado). As mudanças valem até fechar a página.', !ok);
  }

  function linhaFoto(rotulo, sub, src, onFoto, onLimpar, extra) {
    const li = document.createElement('div');
    li.className = 'linha';
    const id = 'f' + Math.random().toString(36).slice(2, 8);
    li.innerHTML = `
      <label class="miniatura" for="${id}" title="Escolher foto">
        ${src ? `<img alt="" src="${src}">` : '<span aria-hidden="true">+</span>'}
      </label>
      <input type="file" id="${id}" accept="image/*" class="oculto-visual">
      <div class="linha-info"><strong>${rotulo}</strong>${sub ? `<span>${sub}</span>` : ''}</div>
      ${src ? '<button type="button" class="limpar" title="Remover foto" aria-label="Remover foto">×</button>' : ''}`;
    if (extra) li.querySelector('.linha-info').appendChild(extra);
    li.querySelector('input[type=file]').addEventListener('change', async e => {
      const f = e.target.files[0];
      if (!f) return;
      try { onFoto(await reduzirImagem(f)); } catch (err) { aviso('Não consegui ler essa imagem. Use JPG ou PNG.', true); }
    });
    const lb = li.querySelector('.limpar');
    if (lb) lb.addEventListener('click', onLimpar);
    return li;
  }

  function montarPainel() {
    const corpo = $('#painel-corpo');
    corpo.innerHTML = '';
    // empresa
    const sEmp = document.createElement('section');
    sEmp.innerHTML = `<h3>Empresa e logos</h3>
      <label class="campo" for="emp-nome">Nome da empresa (aparece em C11 e na cartela final)</label>
      <input id="emp-nome" type="text" autocomplete="organization" placeholder="${cfg.empresa.nome}" value="${(pers.empresa || '').replace(/"/g, '&quot;')}">`;
    corpo.appendChild(sEmp);
    sEmp.querySelector('#emp-nome').addEventListener('change', e => { pers.empresa = e.target.value; aplicar(); });
    pers.logos = pers.logos || {};
    [['empresa', 'Logo da empresa', 'C11 e cartela final'], ['parceiro', 'Logo A&M', 'Cartela final · use o arquivo oficial em vetor']].forEach(([k, r, s]) => {
      sEmp.appendChild(linhaFoto(r, s, pers.logos[k] || cfg[k === 'empresa' ? 'empresa' : 'parceiro'].logo, src => { pers.logos[k] = src; aplicar(); montarPainel(); }, () => { delete pers.logos[k]; aplicar(); montarPainel(); }));
    });
    // participantes
    const sPart = document.createElement('section');
    sPart.innerHTML = '<h3>Participantes (cena C11)</h3><p class="nota">Foto quadrada, rosto centralizado. Três grupos de cinco, como no case.</p>';
    corpo.appendChild(sPart);
    pers.participantes = pers.participantes || [];
    CX.participantes().forEach((p, i) => {
      const loc = pers.participantes[i] = pers.participantes[i] || {};
      const extra = document.createElement('div');
      extra.className = 'linha-campos';
      extra.innerHTML = `
        <label class="oculto-visual" for="part-nome-${i}">Nome do participante ${i + 1}</label>
        <input id="part-nome-${i}" type="text" placeholder="Nome e sobrenome" value="${(loc.nome || cfg.participantes[i].nome || '').replace(/"/g, '&quot;')}">
        <label class="oculto-visual" for="part-grupo-${i}">Grupo do participante ${i + 1}</label>
        <select id="part-grupo-${i}">${[1, 2, 3].map(g => `<option value="${g}" ${p.grupo === g ? 'selected' : ''}>Grupo ${g}</option>`).join('')}</select>`;
      extra.querySelector('input').addEventListener('change', e => { loc.nome = e.target.value; aplicar(); });
      extra.querySelector('select').addEventListener('change', e => { loc.grupo = +e.target.value; aplicar(); });
      sPart.appendChild(linhaFoto('Participante ' + String(i + 1).padStart(2, '0'), '', loc.foto || cfg.participantes[i].foto, src => { loc.foto = src; aplicar(); montarPainel(); }, () => { delete loc.foto; aplicar(); montarPainel(); }, extra));
    });
    // personagens
    const sPers = document.createElement('section');
    sPers.innerHTML = '<h3>Personagens (cenas C07, C08 e C14)</h3><p class="nota">A foto vira a cabeça do personagem animado, em recorte circular.</p>';
    corpo.appendChild(sPers);
    pers.personagens = pers.personagens || {};
    const desc = {
      colaboradora: 'Recebe o e-mail (C07) · aprende com a colega (C08)',
      colega: 'Cochicha no corredor (C07) · vira agente da mudança (C08)',
      analista: 'Volta à planilha (C07) · participa do workshop (C08, C14)',
      gestor: 'Painel vermelho (C07) · painel verde (C08)',
      lider: 'Explica o porquê para a equipe (C08)'
    };
    Object.keys(cfg.personagens).forEach(k => {
      sPers.appendChild(linhaFoto(cfg.personagens[k].rotulo, desc[k], pers.personagens[k] || cfg.personagens[k].foto, src => { pers.personagens[k] = src; aplicar(); montarPainel(); }, () => { delete pers.personagens[k]; aplicar(); montarPainel(); }));
    });
    // ir para a cena
    const sIr = document.createElement('section');
    sIr.innerHTML = '<h3>Conferir</h3><div class="botoes"><button type="button" data-ir="106">Ver participantes (C11)</button><button type="button" data-ir="51">Ver Cenário 1 (C07)</button><button type="button" data-ir="70">Ver Cenário 2 (C08)</button><button type="button" data-ir="168">Ver cartela final (C16)</button></div><button type="button" class="perigo" id="limpar-tudo">Limpar tudo deste navegador</button>';
    corpo.appendChild(sIr);
    sIr.querySelectorAll('[data-ir]').forEach(b => b.addEventListener('click', () => {
      if (!iniciado) { iniciado = true; $('#capa').hidden = true; palco.classList.add('ativo'); }
      buscar(+b.dataset.ir + 2.5);
    }));
    let confirmar = false;
    sIr.querySelector('#limpar-tudo').addEventListener('click', e => {
      if (!confirmar) { confirmar = true; e.target.textContent = 'Clique de novo para confirmar'; return; }
      pers = {};
      cfg.empresa.nome = '[NOME DA EMPRESA]';
      aplicar('Personalização apagada deste navegador.');
      montarPainel();
    });
  }

  function abrirPainel() {
    if (tocando) pausar();
    montarPainel();
    $('#painel').hidden = false;
    requestAnimationFrame(() => $('#painel').classList.add('aberto'));
    $('#painel-fechar').focus();
  }
  function fecharPainel() {
    const p = $('#painel');
    if (p.hidden) return;
    p.classList.remove('aberto');
    setTimeout(() => { p.hidden = true; }, 250);
  }

  /* ---------------- Inicialização ---------------- */
  async function boot() {
    redimensionar();
    try {
      await Promise.all([
        document.fonts.load('800 40px "Archivo Expanded"'),
        document.fonts.load('600 40px "Archivo"'),
        document.fonts.load('500 20px "IBM Plex Mono"')
      ]);
    } catch (e) { /* segue com fontes alternativas */ }
    cena.lista = CX.cenas.lista();
    carregarImagens();
    prepararDados();
    montarBarra();
    ligarControles();
    $('#painel-fechar').addEventListener('click', fecharPainel);
    if (!cfg.rascunho) $('#selo-rascunho').hidden = true;
    const comVoz = Object.values(CX.voz.clipes).some(c => c.temAudio);
    $('#status-voz').textContent = comVoz
      ? `Narração: ${(CX.narracaoDados && CX.narracaoDados.voz && CX.narracaoDados.voz.nome) || 'ElevenLabs'}`
      : 'Narração ainda não gerada · legendas ativas';
    atualizarBotaoPlay();
    alternarBotao('#btn-legenda', legendasOn);
    alternarBotao('#btn-som', true);
    alternarBotao('#btn-interativo', interativo);
    document.body.classList.add('pronto');
    requestAnimationFrame(quadro);
  }

  // API usada pela exportação para MP4
  CX.player = {
    irPara: t => { T = t; render(); },
    desenharEm: t => { T = t; render(); },
    duracao: DUR,
    preparar: prepararDados
  };

  boot();
})();
