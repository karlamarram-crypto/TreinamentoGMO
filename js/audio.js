/* ==========================================================================
   CONECTADOS · ÁUDIO
   - Efeitos minimalistas sintetizados (luz acendendo/apagando, relógio, etc.)
   - Trilha procedural em 4 movimentos (Aceleração, Tensão/Virada, Emoção, Clímax)
   - Narração da ElevenLabs (quando disponível), com ducking da música
   Funciona em tempo real (AudioContext) e offline (OfflineAudioContext → WAV).
   ========================================================================== */
(function () {
  'use strict';
  const CX = window.CX;
  const A = CX.audio = {};
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------------- Notas ---------------- */
  const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function hz(n) {
    if (typeof n === 'number') return n;
    const m = /^([A-G])(#|b)?(-?\d)$/.exec(n);
    let s = SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    const midi = (parseInt(m[3], 10) + 1) * 12 + s;
    return 440 * Math.pow(2, (midi - 69) / 12);
  }
  A.hz = hz;

  /* ---------------- Grafo ---------------- */
  function ruidoBuffer(ac) {
    if (ac._ruido) return ac._ruido;
    const len = ac.sampleRate * 2;
    const b = ac.createBuffer(1, len, ac.sampleRate);
    const d = b.getChannelData(0);
    let s = 12345;
    for (let i = 0; i < len; i++) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      d[i] = (s / 0x7fffffff) * 2 - 1;
    }
    ac._ruido = b;
    return b;
  }

  function impulso(ac, seg = 3.2, decai = 3.2) {
    const len = Math.floor(ac.sampleRate * seg);
    const b = ac.createBuffer(2, len, ac.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c);
      let s = 999 + c * 77;
      let lp = 0;
      for (let i = 0; i < len; i++) {
        s = (s * 1103515245 + 12345) & 0x7fffffff;
        const n = (s / 0x7fffffff) * 2 - 1;
        lp = lp * 0.55 + n * 0.45; // um pouco mais escuro
        d[i] = lp * Math.pow(1 - i / len, decai);
      }
    }
    return b;
  }

  // Grafo global (por AudioContext): mestre, reverb, delay
  function grafoGlobal(ac) {
    const G = { ac };
    G.comp = ac.createDynamicsCompressor();
    G.comp.threshold.value = -16;
    G.comp.knee.value = 10;
    G.comp.ratio.value = 3;
    G.comp.attack.value = 0.006;
    G.comp.release.value = 0.25;
    G.mestre = ac.createGain();
    G.mestre.gain.value = 0.9;
    G.mestre.connect(G.comp);
    G.comp.connect(ac.destination);

    G.rev = ac.createConvolver();
    G.rev.buffer = impulso(ac);
    G.revSaida = ac.createGain();
    G.revSaida.gain.value = 0.5;
    G.rev.connect(G.revSaida);
    G.revSaida.connect(G.mestre);

    G.dly = ac.createDelay(2);
    G.dly.delayTime.value = 0.45;
    const fb = ac.createGain();
    fb.gain.value = 0.3;
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2200;
    G.dly.connect(lp);
    lp.connect(fb);
    fb.connect(G.dly);
    G.dlySaida = ac.createGain();
    G.dlySaida.gain.value = 0.35;
    lp.connect(G.dlySaida);
    G.dlySaida.connect(G.mestre);
    lp.connect(G.rev);
    return G;
  }

  // Grafo de uma "sessão" de reprodução (pausar = desligar a sessão inteira)
  function grafoSessao(G) {
    const ac = G.ac;
    const S = { ac, global: G };
    S.saida = ac.createGain();
    S.saida.connect(G.mestre);
    S.mus = ac.createGain();
    S.mus.gain.value = 0.42;
    S.duck = ac.createGain();
    S.mus.connect(S.duck);
    S.duck.connect(S.saida);
    S.sfx = ac.createGain();
    S.sfx.gain.value = 0.75;
    S.sfx.connect(S.saida);
    S.voz = ac.createGain();
    S.voz.gain.value = 1.0;
    S.voz.connect(S.saida);
    S.rev = ac.createGain();
    S.rev.connect(G.rev);
    S.dly = ac.createGain();
    S.dly.connect(G.dly);
    return S;
  }

  /* ---------------- Utilidades de síntese ---------------- */
  function osc(ac, tipo, f) {
    const o = ac.createOscillator();
    o.type = tipo;
    o.frequency.value = f;
    return o;
  }
  function ganho(ac, v = 0) {
    const g = ac.createGain();
    g.gain.value = v;
    return g;
  }
  function filtro(ac, tipo, f, q = 0.7) {
    const b = ac.createBiquadFilter();
    b.type = tipo;
    b.frequency.value = f;
    b.Q.value = q;
    return b;
  }
  function ruido(ac, w, dur) {
    const s = ac.createBufferSource();
    s.buffer = ruidoBuffer(ac);
    s.loop = true;
    s.start(w, Math.random() * 1.5);
    s.stop(w + dur + 0.05);
    return s;
  }
  // envelope AD exponencial
  function ad(g, w, pico, ataque, decai) {
    g.gain.setValueAtTime(0.0001, w);
    g.gain.linearRampToValueAtTime(pico, w + ataque);
    g.gain.exponentialRampToValueAtTime(0.0001, w + ataque + decai);
  }
  // envelope ASR com release
  function asr(g, w, pico, ataque, dur, release, desde = 0) {
    const t0 = w;
    if (desde > 0) {
      // entrando no meio da nota: começa suave
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(pico, t0 + 0.25);
    } else {
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(pico, t0 + ataque);
    }
    const fim = t0 + Math.max(0.05, dur - desde);
    g.gain.setValueAtTime(pico, Math.max(t0 + (desde > 0 ? 0.26 : ataque), fim));
    g.gain.exponentialRampToValueAtTime(0.0001, fim + release);
    return fim + release;
  }

  /* ======================= EFEITOS (minimalistas) ======================= */
  const SFX = A.SFX = {};

  // Clique seco de relé / interruptor
  function clique(S, w, vol = 0.5, cor = 2600) {
    const ac = S.ac;
    const n = ruido(ac, w, 0.05);
    const bp = filtro(ac, 'bandpass', cor, 1.2);
    const g = ganho(ac);
    ad(g, w, vol, 0.0008, 0.035);
    n.connect(bp);
    bp.connect(g);
    g.connect(S.sfx);
    // corpo grave
    const o = osc(ac, 'sine', 150);
    o.frequency.setValueAtTime(150, w);
    o.frequency.exponentialRampToValueAtTime(55, w + 0.05);
    const g2 = ganho(ac);
    ad(g2, w, vol * 0.55, 0.001, 0.07);
    o.connect(g2);
    g2.connect(S.sfx);
    o.start(w);
    o.stop(w + 0.12);
  }

  /* LUZ ACENDENDO: clique do relé + "tink" do filamento + zumbido que sobe e assenta.
     o.tom: afinação do filamento · o.zumbido: quantidade de hum · o.fluor: tremula antes */
  SFX.luzLiga = (S, w, o = {}) => {
    const ac = S.ac;
    const vol = o.vol === undefined ? 1 : o.vol;
    const tom = o.tom || 1;
    let t = w;
    if (o.fluor) {
      // lâmpada fluorescente: dois "tics" antes de firmar
      clique(S, t, 0.18 * vol, 3400);
      clique(S, t + 0.07, 0.12 * vol, 3000);
      t += 0.16;
    }
    clique(S, t, 0.42 * vol, 2600);
    // tink do filamento
    [[3150, 0.075, 0.16], [4720, 0.035, 0.1], [6300, 0.015, 0.06]].forEach(([f, a, d]) => {
      const p = osc(ac, 'sine', f * tom);
      const g = ganho(ac);
      ad(g, t + 0.004, a * vol, 0.002, d);
      p.connect(g);
      g.connect(S.sfx);
      g.connect(S.rev);
      p.start(t);
      p.stop(t + d + 0.05);
    });
    // zumbido elétrico (120 Hz + 60 Hz), sobe e assenta
    const z = o.zumbido === undefined ? 1 : o.zumbido;
    if (z > 0) {
      const dur = o.dur || 0.9;
      const s1 = osc(ac, 'sawtooth', 120);
      const s2 = osc(ac, 'sine', 60);
      const lp = filtro(ac, 'lowpass', 520, 0.8);
      const g = ganho(ac);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.05 * z * vol, t + 0.035);
      g.gain.setTargetAtTime(0.018 * z * vol, t + 0.06, 0.12);
      g.gain.setTargetAtTime(0.0001, t + dur * 0.55, dur * 0.18);
      s1.connect(lp);
      s2.connect(lp);
      lp.connect(g);
      g.connect(S.sfx);
      s1.start(t);
      s2.start(t);
      s1.stop(t + dur + 0.3);
      s2.stop(t + dur + 0.3);
    }
  };

  // LUZ APAGANDO: clique seco + zumbido que cai
  SFX.luzDesliga = (S, w, o = {}) => {
    const ac = S.ac;
    const vol = o.vol === undefined ? 1 : o.vol;
    clique(S, w, 0.38 * vol, 1900);
    const s1 = osc(ac, 'sawtooth', 120);
    s1.frequency.setValueAtTime(120, w);
    s1.frequency.exponentialRampToValueAtTime(48, w + 0.35);
    const lp = filtro(ac, 'lowpass', 420, 0.8);
    lp.frequency.setValueAtTime(420, w);
    lp.frequency.exponentialRampToValueAtTime(120, w + 0.35);
    const g = ganho(ac);
    ad(g, w, 0.04 * vol, 0.004, 0.38);
    s1.connect(lp);
    lp.connect(g);
    g.connect(S.sfx);
    s1.start(w);
    s1.stop(w + 0.45);
  };

  // Ping de um nó da rede acendendo (tick + nota curta afinada)
  SFX.ping = (S, w, o = {}) => {
    const ac = S.ac;
    const vol = o.vol === undefined ? 1 : o.vol;
    const f = hz(o.nota || 'A5');
    clique(S, w, 0.12 * vol, 4200);
    const p = osc(ac, 'sine', f);
    const p2 = osc(ac, 'sine', f * 2.01);
    const g = ganho(ac);
    ad(g, w, 0.07 * vol, 0.002, o.decai || 0.45);
    const g2 = ganho(ac);
    ad(g2, w, 0.02 * vol, 0.002, 0.18);
    p.connect(g);
    p2.connect(g2);
    g.connect(S.sfx);
    g2.connect(S.sfx);
    g.connect(S.rev);
    p.start(w);
    p2.start(w);
    p.stop(w + 0.8);
    p2.stop(w + 0.4);
  };

  // Relógio: tique-taque
  SFX.tique = (S, w, o = {}) => {
    const ac = S.ac;
    const vol = o.vol === undefined ? 1 : o.vol;
    const n = ruido(ac, w, 0.03);
    const bp = filtro(ac, 'bandpass', o.taque ? 1700 : 2300, 6);
    const g = ganho(ac);
    ad(g, w, 0.32 * vol, 0.0005, 0.02);
    n.connect(bp);
    bp.connect(g);
    g.connect(S.sfx);
    g.connect(S.rev);
  };

  // Batimento cardíaco grave (lub-dub)
  SFX.batimento = (S, w, o = {}) => {
    const ac = S.ac;
    const vol = o.vol === undefined ? 1 : o.vol;
    [[0, 1], [0.19, 0.7]].forEach(([dt, k]) => {
      const p = osc(ac, 'sine', 62);
      p.frequency.setValueAtTime(70, w + dt);
      p.frequency.exponentialRampToValueAtTime(42, w + dt + 0.12);
      const lp = filtro(ac, 'lowpass', 180);
      const g = ganho(ac);
      ad(g, w + dt, 0.42 * vol * k, 0.008, 0.16);
      p.connect(lp);
      lp.connect(g);
      g.connect(S.sfx);
      p.start(w + dt);
      p.stop(w + dt + 0.3);
    });
  };

  // Zumbido elétrico contínuo (60 Hz) com fade
  SFX.zumbido = (S, w, o = {}, desde = 0) => {
    const ac = S.ac;
    const dur = (o.dur || 4) - desde;
    if (dur <= 0.05) return;
    const vol = o.vol === undefined ? 1 : o.vol;
    const s1 = osc(ac, 'sawtooth', 60);
    const s2 = osc(ac, 'sine', 120);
    const lp = filtro(ac, 'lowpass', 300, 1.5);
    const lfo = osc(ac, 'sine', 0.35);
    const lfoG = ganho(ac, 40);
    lfo.connect(lfoG);
    lfoG.connect(lp.frequency);
    const g = ganho(ac);
    const ent = desde > 0 ? 0.3 : (o.entra || 0.8);
    g.gain.setValueAtTime(0.0001, w);
    g.gain.linearRampToValueAtTime(0.035 * vol, w + ent);
    g.gain.setValueAtTime(0.035 * vol, w + Math.max(ent, dur - (o.sai || 1)));
    g.gain.linearRampToValueAtTime(0.0001, w + dur);
    s1.connect(lp);
    s2.connect(lp);
    lp.connect(g);
    g.connect(S.sfx);
    [s1, s2, lfo].forEach(n => { n.start(w); n.stop(w + dur + 0.05); });
  };

  // Whoosh (rastro de luz, transições)
  SFX.whoosh = (S, w, o = {}) => {
    const ac = S.ac;
    const dur = o.dur || 0.7;
    const vol = o.vol === undefined ? 1 : o.vol;
    const n = ruido(ac, w, dur);
    const bp = filtro(ac, 'bandpass', 400, 1.4);
    const f0 = o.desce ? 3200 : 300, f1 = o.desce ? 300 : 3200;
    bp.frequency.setValueAtTime(f0, w);
    bp.frequency.exponentialRampToValueAtTime(f1, w + dur);
    const g = ganho(ac);
    g.gain.setValueAtTime(0.0001, w);
    g.gain.linearRampToValueAtTime(0.16 * vol, w + dur * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, w + dur);
    n.connect(bp);
    bp.connect(g);
    g.connect(S.sfx);
    g.connect(S.rev);
  };

  // Pop suave (post-its, ícones, cartões)
  SFX.pop = (S, w, o = {}) => {
    const ac = S.ac;
    const vol = o.vol === undefined ? 1 : o.vol;
    const f = hz(o.nota || 'E5');
    const p = osc(ac, 'sine', f * 0.6);
    p.frequency.setValueAtTime(f * 0.6, w);
    p.frequency.exponentialRampToValueAtTime(f, w + 0.03);
    const g = ganho(ac);
    ad(g, w, 0.09 * vol, 0.003, 0.09);
    p.connect(g);
    g.connect(S.sfx);
    p.start(w);
    p.stop(w + 0.15);
  };

  // Notificação discreta (e-mail chegando)
  SFX.notificacao = (S, w, o = {}) => {
    const vol = o.vol === undefined ? 1 : o.vol;
    SFX.pop(S, w, { nota: 'A5', vol: 0.8 * vol });
    SFX.pop(S, w + 0.11, { nota: 'E5', vol: 0.6 * vol });
  };

  // Brilho cintilante (nós revelando pessoas)
  SFX.brilho = (S, w, o = {}) => {
    const ac = S.ac;
    const vol = o.vol === undefined ? 1 : o.vol;
    const notas = o.notas || ['A6', 'E6', 'C#7'];
    notas.forEach((nn, i) => {
      const p = osc(ac, 'sine', hz(nn));
      const g = ganho(ac);
      ad(g, w + i * 0.05, 0.022 * vol, 0.005, 0.5);
      p.connect(g);
      g.connect(S.sfx);
      g.connect(S.rev);
      p.start(w + i * 0.05);
      p.stop(w + i * 0.05 + 0.6);
    });
  };

  // Impacto grave (sub-boom)
  SFX.subBoom = (S, w, o = {}) => {
    const ac = S.ac;
    const vol = o.vol === undefined ? 1 : o.vol;
    const p = osc(ac, 'sine', 58);
    p.frequency.setValueAtTime(64, w);
    p.frequency.exponentialRampToValueAtTime(30, w + 1.4);
    const g = ganho(ac);
    ad(g, w, 0.75 * vol, 0.01, 2.0);
    p.connect(g);
    g.connect(S.sfx);
    p.start(w);
    p.stop(w + 2.2);
    clique(S, w, 0.2 * vol, 900);
    const n = ruido(ac, w, 0.6);
    const lp = filtro(ac, 'lowpass', 500);
    const gn = ganho(ac);
    ad(gn, w, 0.12 * vol, 0.005, 0.5);
    n.connect(lp);
    lp.connect(gn);
    gn.connect(S.rev);
  };

  // Hit percussivo cinematográfico
  SFX.hit = (S, w, o = {}) => {
    const ac = S.ac;
    const vol = o.vol === undefined ? 1 : o.vol;
    const p = osc(ac, 'sine', 90);
    p.frequency.setValueAtTime(110, w);
    p.frequency.exponentialRampToValueAtTime(38, w + 0.35);
    const g = ganho(ac);
    ad(g, w, 0.6 * vol, 0.003, 0.5);
    p.connect(g);
    g.connect(S.sfx);
    p.start(w);
    p.stop(w + 0.6);
    const n = ruido(ac, w, 0.4);
    const bp = filtro(ac, 'bandpass', 1100, 0.9);
    const gn = ganho(ac);
    ad(gn, w, 0.16 * vol, 0.002, 0.25);
    n.connect(bp);
    bp.connect(gn);
    gn.connect(S.sfx);
    gn.connect(S.rev);
  };

  // Onda de choque de luz (C15)
  SFX.onda = (S, w, o = {}) => {
    const vol = o.vol === undefined ? 1 : o.vol;
    SFX.subBoom(S, w, { vol: 0.9 * vol });
    SFX.whoosh(S, w, { dur: 1.6, desce: true, vol: 0.9 * vol });
    SFX.luzLiga(S, w + 0.02, { vol: 0.8 * vol, zumbido: 1.4, dur: 1.4 });
    SFX.brilho(S, w + 0.25, { vol: 1.2 * vol, notas: ['D6', 'A6', 'E7', 'F#7'] });
  };

  // Flash branco (luma fade)
  SFX.flash = (S, w, o = {}) => {
    SFX.whoosh(S, w - 0.35, { dur: 0.5, vol: 0.6 });
    SFX.brilho(S, w, { vol: 0.8, notas: ['E7', 'B7'] });
  };

  // Toque em tela de vidro
  SFX.toque = (S, w, o = {}) => {
    const ac = S.ac;
    const p = osc(ac, 'sine', 1800);
    p.frequency.setValueAtTime(1800, w);
    p.frequency.exponentialRampToValueAtTime(900, w + 0.06);
    const g = ganho(ac);
    ad(g, w, 0.06, 0.001, 0.08);
    p.connect(g);
    g.connect(S.sfx);
    g.connect(S.rev);
    p.start(w);
    p.stop(w + 0.12);
  };

  // Linha de luz se desenhando (zíper)
  SFX.zip = (S, w, o = {}) => {
    const ac = S.ac;
    const dur = o.dur || 0.45;
    const n = ruido(ac, w, dur);
    const hp = filtro(ac, 'highpass', 3000, 0.7);
    hp.frequency.setValueAtTime(2500, w);
    hp.frequency.exponentialRampToValueAtTime(7000, w + dur);
    const g = ganho(ac);
    g.gain.setValueAtTime(0.0001, w);
    g.gain.linearRampToValueAtTime(0.06 * (o.vol || 1), w + dur * 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, w + dur);
    n.connect(hp);
    hp.connect(g);
    g.connect(S.sfx);
  };

  // Congelamento (split freeze): queda de filtro
  SFX.congela = (S, w) => {
    const ac = S.ac;
    const n = ruido(ac, w, 0.5);
    const lp = filtro(ac, 'lowpass', 4000, 2);
    lp.frequency.setValueAtTime(4000, w);
    lp.frequency.exponentialRampToValueAtTime(150, w + 0.45);
    const g = ganho(ac);
    ad(g, w, 0.1, 0.005, 0.45);
    n.connect(lp);
    lp.connect(g);
    g.connect(S.sfx);
  };

  // Portas se abrindo + luz invadindo
  SFX.portas = (S, w) => {
    SFX.whoosh(S, w, { dur: 1.2, vol: 0.55 });
    SFX.luzLiga(S, w + 0.35, { vol: 0.75, zumbido: 0.6, tom: 0.9, dur: 1.4 });
  };

  /* ======================= INSTRUMENTOS (trilha) ======================= */
  const INST = A.INST = {};

  INST.pluck = (S, w, a, desde) => {
    if (desde > 0.05) return;
    const ac = S.ac;
    const f = hz(a.n);
    const o1 = osc(ac, 'triangle', f);
    const o2 = osc(ac, 'sine', f * 2);
    const lp = filtro(ac, 'lowpass', a.corte || 2600, 0.9);
    const g = ganho(ac);
    ad(g, w, a.v, 0.004, a.decai || 0.5);
    const g2 = ganho(ac, 0.25);
    o1.connect(lp);
    o2.connect(g2);
    g2.connect(lp);
    lp.connect(g);
    g.connect(S.mus);
    g.connect(S.dly);
    [o1, o2].forEach(o => { o.start(w); o.stop(w + (a.decai || 0.5) + 0.1); });
  };

  INST.piano = (S, w, a, desde) => {
    if (desde > 0.05) return;
    const ac = S.ac;
    const f = hz(a.n);
    const desaf = a.desafinado ? 1.012 : 1.0015;
    const dec = (a.dur || 2.4) * Math.pow(Math.min(1, 330 / f), 0.25);
    const parciais = [[1, 1, dec], [2, 0.38, dec * 0.6], [3, 0.16, dec * 0.35], [4.02, 0.06, dec * 0.22]];
    const lp = filtro(ac, 'lowpass', a.corte || 3200, 0.5);
    const saida = ganho(ac, a.v);
    lp.connect(saida);
    saida.connect(S.mus);
    saida.connect(S.rev);
    parciais.forEach(([m, amp, d], i) => {
      [1, desaf].forEach((dt, j) => {
        const o = osc(ac, 'sine', f * m * dt);
        const g = ganho(ac);
        ad(g, w, amp * (j ? 0.5 : 0.7), 0.004, d);
        o.connect(g);
        g.connect(lp);
        o.start(w);
        o.stop(w + d + 0.1);
      });
    });
    // martelo
    const n = ruido(ac, w, 0.04);
    const bp = filtro(ac, 'bandpass', f * 4, 1);
    const gn = ganho(ac);
    ad(gn, w, 0.05, 0.001, 0.03);
    n.connect(bp);
    bp.connect(gn);
    gn.connect(saida);
  };

  // Pad (sintetizador) / cordas legato / coro
  function camada(S, w, a, desde, tipo) {
    const ac = S.ac;
    const notas = Array.isArray(a.n) ? a.n : [a.n];
    const dur = a.dur;
    const corte = a.corte || (tipo === 'cordas' ? 1500 : 900);
    const lp = filtro(ac, 'lowpass', corte, 0.6);
    const g = ganho(ac);
    const fim = asr(g, w, a.v, a.ataque || (tipo === 'coro' ? 2 : 1.2), dur, a.release || 1.8, desde);
    lp.connect(g);
    g.connect(S.mus);
    g.connect(S.rev);
    let alvo = lp;
    if (tipo === 'coro') {
      // formantes "ah"
      const f1 = filtro(ac, 'bandpass', 760, 3);
      const f2 = filtro(ac, 'bandpass', 1180, 4);
      const gf = ganho(ac, 2.2);
      f1.connect(gf);
      f2.connect(gf);
      gf.connect(lp);
      alvo = { conectar: n => { n.connect(f1); n.connect(f2); } };
    }
    const vib = osc(ac, 'sine', tipo === 'pad' ? 0.2 : 4.8);
    const vibG = ganho(ac, tipo === 'pad' ? 0.6 : 2.2);
    vib.connect(vibG);
    vib.start(w);
    vib.stop(fim + 0.05);
    notas.forEach(nn => {
      const f = hz(nn);
      [-1, 1].forEach(lado => {
        const o = osc(ac, 'sawtooth', f);
        o.detune.value = lado * (tipo === 'pad' ? 7 : 5);
        vibG.connect(o.detune);
        if (alvo.conectar) alvo.conectar(o);
        else o.connect(alvo);
        o.start(w);
        o.stop(fim + 0.05);
      });
    });
  }
  INST.pad = (S, w, a, desde) => camada(S, w, a, desde, 'pad');
  INST.cordas = (S, w, a, desde) => camada(S, w, a, desde, 'cordas');
  INST.coro = (S, w, a, desde) => camada(S, w, a, desde, 'coro');

  INST.stacc = (S, w, a, desde) => {
    if (desde > 0.05) return;
    const ac = S.ac;
    const o = osc(ac, 'sawtooth', hz(a.n));
    const lp = filtro(ac, 'lowpass', 1500, 1);
    const g = ganho(ac);
    ad(g, w, a.v, 0.006, 0.14);
    o.connect(lp);
    lp.connect(g);
    g.connect(S.mus);
    g.connect(S.rev);
    o.start(w);
    o.stop(w + 0.2);
  };

  INST.drone = (S, w, a, desde) => {
    const ac = S.ac;
    const lp = filtro(ac, 'lowpass', a.corte || 260, 1.2);
    const lfo = osc(ac, 'sine', 0.13);
    const lfoG = ganho(ac, 90);
    lfo.connect(lfoG);
    lfoG.connect(lp.frequency);
    const g = ganho(ac);
    const fim = asr(g, w, a.v, a.ataque || 2.5, a.dur, a.release || 1.5, desde);
    lp.connect(g);
    g.connect(S.mus);
    g.connect(S.rev);
    lfo.start(w);
    lfo.stop(fim);
    (Array.isArray(a.n) ? a.n : [a.n]).forEach((nn, i) => {
      const o = osc(ac, 'sawtooth', hz(nn));
      o.detune.value = i % 2 ? 9 : -6;
      o.connect(lp);
      o.start(w);
      o.stop(fim);
    });
  };

  INST.kick = (S, w, a, desde) => {
    if (desde > 0.05) return;
    const ac = S.ac;
    const o = osc(ac, 'sine', 120);
    o.frequency.setValueAtTime(130, w);
    o.frequency.exponentialRampToValueAtTime(44, w + 0.16);
    const g = ganho(ac);
    ad(g, w, a.v, 0.002, 0.32);
    o.connect(g);
    g.connect(S.mus);
    o.start(w);
    o.stop(w + 0.4);
  };

  INST.hat = (S, w, a, desde) => {
    if (desde > 0.05) return;
    const ac = S.ac;
    const n = ruido(ac, w, 0.08);
    const hp = filtro(ac, 'highpass', 7500, 0.8);
    const g = ganho(ac);
    ad(g, w, a.v, 0.001, a.decai || 0.045);
    n.connect(hp);
    hp.connect(g);
    g.connect(S.mus);
  };

  INST.hit = (S, w, a, desde) => {
    if (desde > 0.05) return;
    // reaproveita o hit dos efeitos, mas no barramento de música
    const fake = { ac: S.ac, sfx: S.mus, rev: S.rev };
    SFX.hit(fake, w, { vol: a.v });
  };

  /* ======================= PARTITURA ======================= */
  function partitura() {
    const T = CX.T || {};
    const N = [];
    const add = (t, inst, a) => N.push({ t, dur: a.dur || 0.6, tipo: 'mus', inst, a });

    const acordes = {
      Dm: { arp: ['D4', 'A4', 'F4', 'E5', 'A4', 'F4', 'D5', 'A4'], pad: ['D3', 'F3', 'A3', 'E4'], baixo: 'D2' },
      Bb: { arp: ['Bb3', 'F4', 'D4', 'A4', 'F4', 'D4', 'C5', 'F4'], pad: ['Bb2', 'D3', 'F3', 'A3'], baixo: 'Bb1' },
      F: { arp: ['F4', 'C5', 'A4', 'G5', 'C5', 'A4', 'F5', 'C5'], pad: ['F2', 'C3', 'A3', 'G4'], baixo: 'F1' },
      C: { arp: ['C4', 'G4', 'E4', 'D5', 'G4', 'E4', 'C5', 'G4'], pad: ['C3', 'G3', 'D4', 'E4'], baixo: 'C2' },
      Gm: { arp: ['G3', 'D4', 'Bb3', 'A4', 'D4', 'Bb3', 'G4', 'D4'], pad: ['G2', 'D3', 'Bb3', 'A4'], baixo: 'G1' },
      Am: { arp: ['A3', 'E4', 'C4', 'B4', 'E4', 'C4', 'A4', 'E4'], pad: ['A2', 'E3', 'C4', 'G4'], baixo: 'A1' }
    };

    /* --- Movimento 1 · Aceleração (0:07–0:46) · 100 BPM --- */
    const b1 = 0.6, bar1 = 2.4;
    const prog1 = ['Dm', 'Bb', 'F', 'C'];
    for (let k = 0; ; k++) {
      const t0 = 7.0 + k * bar1;
      if (t0 >= 31.9) break;
      const ac = acordes[prog1[k % 4]];
      for (let i = 0; i < 8; i++) {
        const t = t0 + i * (b1 / 2);
        if (t >= 31.9) break;
        const v = lerp(0.05, 0.085, Math.min(1, (t - 7) / 15));
        add(t, 'pluck', { n: ac.arp[i], v, decai: 0.42 });
      }
      if (t0 >= 14.0) {
        // cordas em staccato (ostinato)
        for (let i = 0; i < 8; i++) add(t0 + i * (b1 / 2), 'stacc', { n: i % 2 ? ac.pad[1] : ac.pad[0], v: 0.05 + (i % 4 === 0 ? 0.02 : 0) });
        // percussão eletrônica
        add(t0, 'kick', { v: 0.32 });
        add(t0 + b1 * 2, 'kick', { v: 0.28 });
        if (t0 >= 18.8) for (let i = 0; i < 4; i++) add(t0 + i * b1 + b1 / 2, 'hat', { v: 0.05 });
      }
      if (t0 >= 22.0) add(t0, 'cordas', { n: ac.pad, dur: bar1, v: 0.05, ataque: 0.9, release: 1.2 });
    }
    // C05 · meio-tempo: cordas + pad, sem arpejo; respira antes de "levar suas pessoas junto"
    const respiro = T.c05respiro || 40.4;
    [[32.0, 'Bb', 3.4], [35.4, 'F', 3.4], [38.8, 'Gm', respiro - 38.8 - 0.2], [respiro + 0.3, 'C', 45.95 - respiro - 0.3]].forEach(([t, c, d]) => {
      add(t, 'pad', { n: acordes[c].pad, dur: d, v: 0.07, ataque: 1.0, release: c === 'C' ? 0.04 : 1.2 });
      add(t, 'cordas', { n: acordes[c].pad.slice(1), dur: d, v: 0.045, ataque: 1.4, release: c === 'C' ? 0.04 : 1.4 });
    });
    // corte seco em 0:46 (silêncio de 1s é intencional)

    /* --- Movimento 2a · Tensão (0:51–1:10) --- */
    add(51.0, 'drone', { n: ['D2', 'Eb2', 'A1'], dur: 19.2, v: 0.075, ataque: 3, release: 1.2 });
    [[52.4, 'D4'], [55.0, 'Eb4'], [57.7, 'A3'], [60.3, 'Ab3'], [62.9, 'D4'], [65.4, 'C#4'], [67.8, 'Eb4']].forEach(([t, n]) => {
      add(t, 'piano', { n, v: 0.16, desafinado: true, dur: 3, corte: 2200 });
    });

    /* --- Movimento 2b · Virada (1:10–1:38) · piano caloroso --- */
    const bt = 0.79; // ~76 BPM
    const prog2 = [['F', ['A4', 'C5']], ['C', ['G4', 'E4']], ['Dm', ['F4', 'A4']], ['Bb', ['D5', 'C5']], ['F', ['A4', 'F4']], ['C', ['G4', 'E4']], ['Bb', ['F4', 'D4']], ['C', ['E4', 'G4']]];
    const ini2 = T.c08ini || 70.4;
    prog2.forEach(([c, mel], k) => {
      const t0 = ini2 + k * bt * 2;
      const ac = acordes[c];
      add(t0, 'piano', { n: ac.baixo.replace(/\d/, d => String(+d + 1)), v: 0.14, dur: 3 });
      add(t0, 'piano', { n: ac.pad[2], v: 0.08, dur: 2.5 });
      mel.forEach((n, i) => add(t0 + i * bt, 'piano', { n, v: 0.2 - i * 0.03, dur: 2.6 }));
      add(t0, 'cordas', { n: ac.pad, dur: bt * 2, v: lerp(0.02, 0.07, k / 7), ataque: 0.8, release: 1.0 });
    });
    // swell do mapa acendendo
    const swell = T.c08mapa || 83.2;
    add(swell - 0.6, 'cordas', { n: ['F3', 'A3', 'C4', 'F4'], dur: 88 - swell + 0.3, v: 0.1, ataque: 3.2, release: 1.2 });
    add(swell - 0.6, 'coro', { n: ['A4', 'C5', 'F5'], dur: 88 - swell + 0.3, v: 0.05, ataque: 3.2, release: 1.2 });

    /* --- C09 · acorde único sustentado --- */
    add(88.2, 'pad', { n: ['Bb2', 'F3', 'C4', 'D4'], dur: 9.2, v: 0.07, ataque: 1.5, release: 1.4 });
    add(88.2, 'cordas', { n: ['D4', 'F4'], dur: 9.2, v: 0.03, ataque: 2, release: 1.4 });

    /* --- Movimento 3 · Emoção (1:38–2:14) --- */
    const prog3 = ['Dm', 'Bb', 'F', 'C'];
    for (let k = 0; k < 4; k++) {
      const t0 = 98.2 + k * 2;
      const ac = acordes[prog3[k]];
      ac.pad.forEach((n, i) => add(t0 + i * 0.22, 'piano', { n: i === 0 ? n : n, v: 0.1, dur: 3 }));
    }
    add(99.0, 'coro', { n: ['D4', 'A4', 'E5'], dur: 7.2, v: 0.045, ataque: 2.5 });
    add(98.2, 'cordas', { n: ['D3', 'A3'], dur: 8, v: 0.04, ataque: 2 });
    // C11 · uma nota de piano por foto
    const fotos = T.fotos || [];
    const escala = ['F4', 'A4', 'C5', 'D5', 'C5', 'A4', 'C5', 'F5', 'E5', 'D5', 'C5', 'D5', 'F5', 'G5', 'A5'];
    fotos.forEach((t, i) => add(t, 'piano', { n: escala[i % escala.length], v: 0.17, dur: 2.4 }));
    const prog11 = ['F', 'Am', 'Bb', 'C'];
    for (let k = 0; k < 8; k++) {
      const t0 = 106.2 + k * 2.5;
      if (t0 > 125.5) break;
      const ac = acordes[prog11[k % 4]];
      add(t0, 'pad', { n: ac.pad, dur: 2.5, v: 0.055, ataque: 1.0, release: 1.2 });
      add(t0, 'coro', { n: ac.pad.slice(1), dur: 2.5, v: 0.03, ataque: 1.4, release: 1.2 });
    }
    // percussão suave quando os núcleos se conectam
    const conecta = T.conecta || 118.2;
    for (let t = conecta; t < 125.8; t += 0.625) add(t, 'kick', { v: 0.2 });
    for (let t = conecta + 0.3125; t < 125.8; t += 0.625) add(t, 'hat', { v: 0.03 });
    // C12 · construção, respiro e entrada da percussão em "flui"
    const flui = T.flui || 132.2;
    add(126.0, 'cordas', { n: ['D3', 'A3', 'F4'], dur: flui - 0.6 - 126.0, v: 0.07, ataque: 3, release: 0.08 });
    add(126.0, 'coro', { n: ['A4', 'D5'], dur: flui - 0.6 - 126.0, v: 0.04, ataque: 3, release: 0.08 });
    for (let t = 126.4; t < flui - 0.7; t += 0.625) add(t, 'kick', { v: lerp(0.18, 0.3, (t - 126) / 6) });
    add(flui, 'hit', { v: 0.8 });
    add(flui, 'pad', { n: ['F2', 'C3', 'A3', 'G4'], dur: 134 - flui, v: 0.09, ataque: 0.05, release: 0.6 });
    add(flui, 'cordas', { n: ['F3', 'C4', 'A4'], dur: 134 - flui, v: 0.07, ataque: 0.1, release: 0.6 });
    for (let t = flui; t < 134; t += 0.5455) add(t, 'kick', { v: 0.4 });

    /* --- Movimento 4 · Clímax (2:14–2:56) · 110 BPM --- */
    const b4 = 60 / 110, bar4 = b4 * 4;
    const prog4 = ['F', 'C', 'Dm', 'Bb'];
    const onda = T.onda || 159.2;
    for (let k = 0; ; k++) {
      const t0 = 134.0 + k * bar4;
      if (t0 >= onda - 0.05) break;
      const ac = acordes[prog4[k % 4]];
      const intens = Math.min(1, (t0 - 134) / 22);
      const d = Math.min(bar4, onda - t0);
      add(t0, 'pad', { n: ac.pad, dur: d, v: 0.06 + 0.02 * intens, ataque: 0.4, release: 0.5 });
      add(t0, 'cordas', { n: ac.pad.slice(1), dur: d, v: 0.04 + 0.03 * intens, ataque: 0.5, release: 0.5 });
      for (let i = 0; i < 8; i++) {
        const t = t0 + i * (b4 / 2);
        if (t >= onda - 0.05) break;
        add(t, 'pluck', { n: ac.arp[i], v: 0.06 + 0.02 * intens, decai: 0.36 });
        if (t0 >= 146) add(t, 'stacc', { n: i % 2 ? ac.pad[1] : ac.pad[0], v: 0.05 });
      }
      for (let i = 0; i < 4; i++) {
        const t = t0 + i * b4;
        if (t >= onda - 0.05) break;
        add(t, 'kick', { v: 0.32 + 0.12 * intens });
        add(t + b4 / 2, 'hat', { v: 0.045 });
      }
    }
    (T.hits || []).forEach(t => add(t, 'hit', { v: 0.55 }));
    // clímax na onda de luz, depois corte total para o silêncio
    add(onda, 'hit', { v: 1 });
    add(onda, 'pad', { n: ['D2', 'A2', 'F3', 'A3', 'E4'], dur: 0.9, v: 0.12, ataque: 0.02, release: 0.35 });
    add(onda, 'coro', { n: ['A4', 'D5', 'F5'], dur: 0.9, v: 0.07, ataque: 0.05, release: 0.35 });
    add(onda, 'cordas', { n: ['D4', 'A4', 'D5'], dur: 0.9, v: 0.08, ataque: 0.02, release: 0.35 });
    // nota final sustentada em "agora"
    const agora = T.agora || 166.4;
    add(agora, 'pad', { n: ['A3', 'D4', 'E4'], dur: 3.2, v: 0.06, ataque: 0.3, release: 2.2 });
    add(agora, 'coro', { n: ['A4', 'D5'], dur: 3.2, v: 0.035, ataque: 0.5, release: 2.2 });
    // C16 · acorde final em reverb longo
    add(168.4, 'piano', { n: 'D3', v: 0.16, dur: 5 });
    add(168.4, 'piano', { n: 'A3', v: 0.12, dur: 5 });
    add(168.45, 'piano', { n: 'F4', v: 0.12, dur: 5 });
    add(168.5, 'piano', { n: 'E5', v: 0.1, dur: 5 });
    add(168.4, 'pad', { n: ['D3', 'A3', 'F4', 'E5'], dur: 4.2, v: 0.05, ataque: 1.2, release: 3.2 });

    return N;
  }

  /* ======================= CUES ======================= */
  let cues = [];
  A.construirCues = () => {
    cues = [];
    // efeitos declarados pelas cenas
    (CX.sons || []).forEach(s => cues.push({ t: s.t, dur: s.dur || (s.o && s.o.dur) || 1, tipo: 'sfx', nome: s.nome, o: s.o || {} }));
    // trilha
    partitura().forEach(n => cues.push(n));
    // narração
    Object.values(CX.voz.clipes).forEach(c => {
      if (c.temAudio) cues.push({ t: c.t, dur: c.dur, tipo: 'voz', id: c.id });
    });
    cues.sort((a, b) => a.t - b.t);
    A.cues = cues;
  };

  function dispararCue(S, c, w, desde) {
    if (c.tipo === 'sfx') {
      const f = SFX[c.nome];
      if (!f) return;
      if (c.nome === 'zumbido') f(S, w, c.o, desde);
      else if (desde < 0.06) f(S, w, c.o);
    } else if (c.tipo === 'mus') {
      INST[c.inst](S, w, c.a, desde);
    } else if (c.tipo === 'voz') {
      const buf = S.buffers && S.buffers[c.id];
      if (!buf || desde >= buf.duration) return;
      const src = S.ac.createBufferSource();
      src.buffer = buf;
      src.connect(S.voz);
      src.start(w, Math.max(0, desde));
    }
  }

  function aplicarDucking(S, T0, quando) {
    const g = S.duck.gain;
    g.cancelScheduledValues(0);
    g.setValueAtTime(1, quando(Math.max(0, T0)));
    CX.voz.trechos().forEach(([a, b]) => {
      if (b < T0) return;
      const wa = quando(Math.max(T0, a - 0.2));
      const wb = quando(Math.max(T0, b + 0.15));
      g.setTargetAtTime(0.42, wa, 0.06);
      g.setTargetAtTime(1, wb, 0.25);
    });
  }

  /* ======================= REPRODUÇÃO EM TEMPO REAL ======================= */
  let ac = null, G = null, sessao = null, interacao = null;
  let relogio = { T0: 0, w0: 0 };
  let proximo = 0;
  const buffersBrutos = {};
  let buffersDecod = {};

  A.disponivel = () => !!(window.AudioContext || window.webkitAudioContext);

  A.iniciar = async () => {
    if (ac) {
      if (ac.state === 'suspended') await ac.resume();
      return;
    }
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return;
    ac = new Ctor({ latencyHint: 'playback' });
    G = grafoGlobal(ac);
    interacao = ganho(ac, 0.8);
    interacao.connect(G.mestre);
    A.mudo && (G.mestre.gain.value = 0);
    await decodificarNarracao(ac).then(b => { buffersDecod = b; });
  };

  function base64ParaBuffer(b64) {
    const bin = atob(b64.replace(/^data:[^,]+,/, ''));
    const u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return u.buffer;
  }

  async function decodificarNarracao(ctx) {
    const out = {};
    const fontes = CX.narracaoAudio || {};
    for (const id of Object.keys(fontes)) {
      try {
        if (!buffersBrutos[id]) buffersBrutos[id] = base64ParaBuffer(fontes[id]);
        out[id] = await ctx.decodeAudioData(buffersBrutos[id].slice(0));
      } catch (e) {
        console.warn('Narração', id, 'não pôde ser decodificada', e);
      }
    }
    return out;
  }

  // Usa o relógio do áudio só quando ele está de fato rodando (senão o player usa o relógio do sistema)
  A.tempo = () => (ac && sessao && ac.state === 'running' ? relogio.T0 + (ac.currentTime - relogio.w0) : null);

  A.tocar = T0 => {
    if (!ac) return;
    A.parar();
    sessao = grafoSessao(G);
    sessao.buffers = buffersDecod;
    relogio = { T0, w0: ac.currentTime + 0.06 };
    const quando = t => relogio.w0 + (t - relogio.T0);
    aplicarDucking(sessao, T0, quando);
    // cues em andamento (notas longas, narração, zumbido)
    proximo = 0;
    while (proximo < cues.length && cues[proximo].t < T0) {
      const c = cues[proximo];
      if (c.t + c.dur > T0) dispararCue(sessao, c, relogio.w0, T0 - c.t);
      proximo++;
    }
    A.agendar();
  };

  // Agenda os próximos 0,35s (chamado a cada quadro e por um timer)
  A.agendar = () => {
    if (!sessao) return;
    const agora = A.tempo();
    const limite = agora + 0.35;
    while (proximo < cues.length && cues[proximo].t < limite) {
      const c = cues[proximo];
      const w = relogio.w0 + (c.t - relogio.T0);
      if (w >= ac.currentTime - 0.02) dispararCue(sessao, c, Math.max(w, ac.currentTime), 0);
      proximo++;
    }
  };

  A.parar = () => {
    if (!sessao) return;
    const s = sessao;
    sessao = null;
    try {
      s.saida.gain.setTargetAtTime(0, ac.currentTime, 0.02);
      s.rev.gain.setTargetAtTime(0, ac.currentTime, 0.3);
      s.dly.gain.setTargetAtTime(0, ac.currentTime, 0.3);
      setTimeout(() => { try { s.saida.disconnect(); s.rev.disconnect(); s.dly.disconnect(); } catch (e) { /* ok */ } }, 1500);
    } catch (e) { /* ok */ }
  };

  A.setMudo = m => {
    A.mudo = m;
    if (G) G.mestre.gain.setTargetAtTime(m ? 0 : 0.9, ac.currentTime, 0.05);
  };

  // Efeito imediato (interações do público)
  A.agora = (nome, o = {}) => {
    if (!ac || A.mudo) return;
    const S = { ac, sfx: interacao, rev: G.rev, mus: interacao, dly: G.dly };
    SFX[nome] && SFX[nome](S, ac.currentTime + 0.01, o);
  };

  setInterval(() => { if (sessao) A.agendar(); }, 120);

  /* ======================= RENDERIZAÇÃO OFFLINE (para exportar MP4) ======================= */
  A.renderizarOffline = async (taxa = 48000, bruto = false) => {
    const dur = CX.roteiro.duracao + 1;
    const off = new OfflineAudioContext(2, Math.ceil(dur * taxa), taxa);
    const Gx = grafoGlobal(off);
    const Sx = grafoSessao(Gx);
    Sx.buffers = await decodificarNarracao(off);
    aplicarDucking(Sx, 0, t => t);
    cues.forEach(c => dispararCue(Sx, c, Math.max(0, c.t), 0));
    const buf = await off.startRendering();
    return bruto ? buf : wav(buf);
  };

  function wav(buf) {
    const nc = buf.numberOfChannels, len = buf.length, sr = buf.sampleRate;
    const out = new DataView(new ArrayBuffer(44 + len * nc * 2));
    const esc = (o, s) => { for (let i = 0; i < s.length; i++) out.setUint8(o + i, s.charCodeAt(i)); };
    esc(0, 'RIFF');
    out.setUint32(4, 36 + len * nc * 2, true);
    esc(8, 'WAVE');
    esc(12, 'fmt ');
    out.setUint32(16, 16, true);
    out.setUint16(20, 1, true);
    out.setUint16(22, nc, true);
    out.setUint32(24, sr, true);
    out.setUint32(28, sr * nc * 2, true);
    out.setUint16(32, nc * 2, true);
    out.setUint16(34, 16, true);
    esc(36, 'data');
    out.setUint32(40, len * nc * 2, true);
    const ch = [];
    for (let c = 0; c < nc; c++) ch.push(buf.getChannelData(c));
    let o = 44;
    for (let i = 0; i < len; i++) {
      for (let c = 0; c < nc; c++) {
        const v = Math.max(-1, Math.min(1, ch[c][i]));
        out.setInt16(o, v < 0 ? v * 0x8000 : v * 0x7fff, true);
        o += 2;
      }
    }
    return out.buffer;
  }
})();
