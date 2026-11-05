/* ==========================================================================
   CONECTADOS · CENAS C09–C16 (fim da Parte 2, Parte 3 e Parte 4)
   ========================================================================== */
(function () {
  'use strict';
  const CX = window.CX;
  const MG = CX.MG;
  const E = MG.E;
  const C = MG.cor;
  const W = MG.W, H = MG.H;
  const { anim, prog, clamp, lerp } = MG;
  const X = (i, extra) => Object.assign({}, CX.EXTRAS[i % CX.EXTRAS.length], extra);

  /* ======================= C09 · Pessoas entregam resultados ======================= */
  let c09 = null;
  CX.cenas.definir('C09', {
    preparar() {
      const corte = clamp(CX.voz.fimFrase('c09', 0, 91.0) + 0.3, 90.8, 92.6);
      const f1 = CX.voz.frase('c09', 1, 92.4);
      const f2 = CX.voz.frase('c09', 2, 94.3);
      const boom = CX.voz.palavra('c09', 'resultados', 95.4);
      const dissolve = clamp(boom + 1.1, 96.2, 97.0);
      // partículas a partir da palavra "Pessoas"
      const off = document.createElement('canvas');
      off.width = W;
      off.height = H;
      const g = off.getContext('2d');
      g.fillStyle = '#fff';
      linha2(g, 1, true);
      const img = g.getImageData(0, 0, W, H).data;
      const pts = [];
      const r = MG.rng(9);
      for (let y = 0; y < H; y += 5) {
        for (let x = 0; x < W; x += 5) {
          if (img[(y * W + x) * 4 + 3] > 140) pts.push({ x, y, vx: (r() - 0.5) * 2, vy: (r() - 0.6) * 2, s: r() });
        }
      }
      c09 = { corte, f1, f2, boom, dissolve, pts };
      CX.T.c09boom = boom;
    },
    sons() {
      CX.som(c09.corte, 'whoosh', { dur: 0.3, vol: 0.25 });
      CX.som(c09.f1 - 0.05, 'luzLiga', { vol: 0.4, zumbido: 0.3, tom: 1.1 });
      CX.som(c09.f2 - 0.05, 'luzLiga', { vol: 0.55, zumbido: 0.5, tom: 0.85 });
      CX.som(c09.boom, 'subBoom', { vol: 1 });
      CX.som(c09.dissolve, 'brilho', { vol: 0.8, notas: ['A6', 'E7', 'B6', 'F#7'] });
    },
    desenhar(ctx, lt, T, env) {
      if (T < c09.corte) {
        splitScreen(ctx, T);
        return;
      }
      MG.fundo(ctx, '#030918', '#0A1838');
      MG.poeira(ctx, T, 40, C.ciano, 0.3, 4);
      const sai = anim(T, c09.dissolve - 0.4, c09.dissolve, E.inC);
      // linha 1
      ctx.save();
      ctx.globalAlpha = 1 - sai;
      MG.textoFilamento(ctx, 'Projetos entregam soluções.', 960, 470, prog(T, c09.f1 - 0.1, c09.f1 + 0.9), { tam: 64, peso: 600, cor: C.branco });
      ctx.restore();
      // linha 2
      if (T < c09.dissolve) {
        linha2(ctx, prog(T, c09.f2 - 0.1, c09.f2 + 0.9), false, (1 - sai) * anim(T, c09.f2 - 0.6, c09.f2 - 0.1));
      }
      // impacto em "resultados"
      const fl = MG.janela(T, c09.boom - 0.02, c09.boom + 0.8, 0.02, 0.75);
      if (fl > 0) MG.aditivo(ctx, () => MG.halo(ctx, 960, 580, 1300, C.ambar, 0.35 * fl));
      // "Pessoas" se desfaz em partículas de luz
      if (T >= c09.dissolve) {
        const k = prog(T, c09.dissolve, 98.0);
        MG.aditivo(ctx, () => {
          c09.pts.forEach((p, i) => {
            if (i % 2) return;
            const ang = MG.ruido(p.x * 0.01 + k * 2, 3) * Math.PI;
            const d = E.inC(k) * (300 + p.s * 900);
            const x = p.x + (p.vx * 0.6 + Math.cos(ang)) * d;
            const y = p.y + (p.vy * 0.6 + Math.sin(ang)) * d * 0.7;
            MG.halo(ctx, x, y, 6 + p.s * 10 + k * 8, p.s > 0.7 ? C.dourado : C.ambar, (1 - k * 0.7) * 0.9);
          });
        });
      }
    }
  });

  function linha2(ctx, p, mascara, alpha = 1) {
    const txt = 'Pessoas entregam resultados.';
    const cores = [...txt].map((ch, i) => (i < 7 ? C.ambar : C.branco));
    if (mascara) {
      MG.fonte(ctx, 72, 800, 'display');
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      const esp = 72 * 0.06;
      const total = MG.medir(ctx, txt, esp);
      let x = 960 - total / 2;
      let i = 0;
      for (const ch of txt) {
        if (i < 7) ctx.fillText(ch, x, 580);
        x += ctx.measureText(ch).width + esp;
        i++;
      }
      return;
    }
    MG.textoFilamento(ctx, txt, 960, 580, p, { tam: 72, peso: 800, cores, alpha });
  }

  function splitScreen(ctx, T) {
    ctx.fillStyle = '#05080F';
    ctx.fillRect(0, 0, W, H);
    const k = anim(T, 88.0, 88.5, E.outExpo);
    const R = CX.REDE_MAPA;
    [[0, false], [1, true]].forEach(([lado, aceso]) => {
      ctx.save();
      ctx.beginPath();
      ctx.rect(lado * 960, 0, 960, H);
      ctx.clip();
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, aceso ? '#0A1430' : '#161C26');
      g.addColorStop(1, aceso ? '#1A1420' : '#0B1018');
      ctx.fillStyle = g;
      ctx.fillRect(lado * 960, 0, 960, H);
      ctx.translate(480 + lado * 960 + (1 - k) * (lado ? 200 : -200), 500);
      ctx.scale(0.6, 0.6);
      ctx.translate(-960, -395);
      CX.mapaRede(ctx, T, i => (aceso ? { on: 1, cor: i % 3 === 0 ? C.ciano : C.ambar } : { on: i === R.ultimo ? 0 : (MG.hash(i) > 0.86 ? 0.5 : 0), cor: '#AFC3DA' }), aceso ? { corLinha: C.ambar } : { corLinha: '#7F96B3' });
      ctx.restore();
      if (!aceso) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, 960, H);
        ctx.clip();
        ctx.globalCompositeOperation = 'saturation';
        ctx.fillStyle = 'rgb(128,128,128)';
        ctx.globalAlpha = 0.8;
        ctx.fillRect(0, 0, 960, H);
        ctx.restore();
      }
    });
    MG.aditivo(ctx, () => {
      ctx.fillStyle = MG.rgba(C.gelo, 0.9);
      ctx.fillRect(958.5, 0, 3, H);
    });
    MG.texto(ctx, 'SEM GESTÃO DA MUDANÇA', 480, 860, { tam: 26, fam: 'display', peso: 700, cor: C.aco, esp: 2, alpha: k });
    MG.texto(ctx, 'COM GESTÃO DA MUDANÇA', 1440, 860, { tam: 26, fam: 'display', peso: 700, cor: C.branco, esp: 2, alpha: k });
    MG.etiqueta(ctx, 'MESMA TECNOLOGIA', 960, 120, anim(T, 88.6, 89.2), C.gelo, { fundo: '#0A1226' });
  }

  /* ======================= C10 · Os pontos de luz são pessoas ======================= */
  let c10 = null;
  CX.cenas.definir('C10', {
    preparar() {
      const r = MG.rng(101);
      const nos = [];
      for (let i = 0; i < 170; i++) nos.push({ x: (r() - 0.5) * 3400, y: (r() - 0.5) * 1900, z: r() * 4800, pessoa: r() < 0.55, f: r() });
      const arestas = [];
      nos.forEach((a, i) => {
        const viz = nos.map((b, j) => [j, Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)]).filter(v => v[0] !== i).sort((p, q) => p[1] - q[1]).slice(0, 2);
        viz.forEach(([j]) => { if (i < j) arestas.push([i, j]); });
      });
      c10 = { nos, arestas };
    },
    sons() {
      [99.6, 100.9, 102.1, 103.4, 104.5].forEach((t, i) => CX.som(t, 'brilho', { vol: 0.45, notas: [['A6', 'E7'], ['F6', 'C7'], ['D6', 'A6'], ['C6', 'G6'], ['A5', 'E6']][i] }));
      CX.som(105.1, 'whoosh', { dur: 0.9, vol: 0.7 });
    },
    desenhar(ctx, lt, T) {
      MG.fundo(ctx, '#01040D', '#061230');
      const zc = lt * 640 + E.inQ(prog(lt, 7.0, 8.0)) * 900;
      const f = 760;
      const proj = c10.nos.map(n => {
        const d = (((n.z - zc) % 4800) + 4800) % 4800 + 140;
        return { x: 960 + (n.x * f) / d, y: 540 + (n.y * f) / d, d, s: f / d, n };
      });
      const surge = anim(lt, 0, 0.8);
      MG.aditivo(ctx, () => {
        ctx.lineWidth = 1.2;
        c10.arestas.forEach(([i, j]) => {
          const a = proj[i], b = proj[j];
          if (Math.abs(a.d - b.d) > 1600) return;
          const al = Math.min(1, 900 / Math.max(a.d, b.d)) * 0.5 * surge;
          ctx.strokeStyle = MG.rgba(C.azul, al);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        });
        proj.forEach(p => {
          const al = Math.min(1, 1400 / p.d) * surge;
          const rev = p.n.pessoa ? prog(1500 - p.d, 0, 700) : 0;
          MG.luz(ctx, p.x, p.y, (8 + 30 * p.s) * (1 + rev), rev > 0 ? C.ambar : C.ciano, al * (1 - 0.6 * rev));
          if (rev > 0) {
            MG.halo(ctx, p.x, p.y, 120 * p.s * 2, C.ambar, 0.5 * rev);
          }
        });
      });
      // silhuetas de pessoas feitas de luz âmbar
      proj.forEach(p => {
        const rev = p.n.pessoa ? prog(1500 - p.d, 0, 700) : 0;
        const perto = prog(p.d, 380, 760);
        if (rev <= 0 || perto <= 0) return;
        const tam = 100 * p.s;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.shadowColor = C.ambar;
        ctx.shadowBlur = 24 * p.s;
        MG.iconePessoa(ctx, p.x, p.y - tam * 0.1, tam, MG.rgba(C.ambar, 0.32), rev * perto);
        ctx.shadowBlur = 0;
        ctx.strokeStyle = MG.rgba(C.dourado, 0.6 * rev * perto);
        ctx.lineWidth = Math.max(1, 1.6 * p.s);
        ctx.beginPath();
        ctx.arc(p.x, p.y - tam * 0.72, tam * 0.24, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      });
      // zoom-through num nó âmbar
      const zt = anim(lt, 7.1, 8.0, E.inExpo);
      if (zt > 0) {
        MG.aditivo(ctx, () => {
          MG.luz(ctx, 960, 540, 60 + 1600 * zt, C.ambar, 0.4 + 0.6 * zt);
        });
        ctx.strokeStyle = MG.rgba(C.dourado, zt);
        ctx.lineWidth = 6 + 20 * zt;
        MG.circulo(ctx, 960, 540, 40 + 1300 * zt);
        ctx.stroke();
      }
    }
  });

  /* ======================= C11 · Os participantes ======================= */
  let c11 = null;
  const NUCLEOS = [[520, 345], [1400, 345], [960, 770]];
  const HUB = [960, 470];
  CX.cenas.definir('C11', {
    dica: { txt: 'Passe o cursor pelos participantes', ini: 'fotos0', dur: 9 },
    preparar() {
      const parts = (CX.participantes() || []).slice(0, 15);
      const porGrupo = [[], [], []];
      parts.forEach((p, i) => porGrupo[clamp((p.grupo || 1) - 1, 0, 2)].push(i));
      const pos = [];
      porGrupo.forEach((lista, g) => {
        lista.forEach((idx, k) => {
          const a = -Math.PI / 2 + (k / Math.max(1, lista.length)) * Math.PI * 2 + (g === 2 ? Math.PI / 5 : 0);
          const rr = lista.length > 1 ? 140 : 0;
          pos[idx] = { x: NUCLEOS[g][0] + Math.cos(a) * rr, y: NUCLEOS[g][1] + Math.sin(a) * rr * 0.92, g, k };
        });
      });
      // ordem: alterna os núcleos para crescerem juntos
      const ordem = parts.map((p, i) => i).sort((a, b) => (pos[a].k - pos[b].k) || (pos[a].g - pos[b].g));
      const ini = Math.max(106.9, CX.voz.fim('c11a', 107.6) - 0.3);
      const passo = parts.length > 1 ? Math.min(0.68, Math.max(0.5, 9.2 / parts.length)) : 0.6;
      const tFoto = [];
      ordem.forEach((i, k) => { tFoto[i] = ini + k * passo; });
      const ultima = ini + (parts.length - 1) * passo;
      const conecta = ultima + 0.55;
      const empresaT = CX.voz.clipes.c11b ? CX.voz.inicio('c11b', conecta + 0.4) : conecta + 0.45;
      const recua = CX.voz.frase('c11c', 0, 118.8) - 0.4;
      c11 = { parts, pos, tFoto, ordem, conecta, empresaT, recua, porGrupo };
      CX.T.fotos = ordem.map(i => tFoto[i]);
      CX.T.fotos0 = ini;
      CX.T.conecta = conecta;
      CX.T.c11cam = { recua };
    },
    sons() {
      c11.ordem.forEach((i, k) => CX.som(c11.tFoto[i], 'luzLiga', { vol: 0.3, zumbido: 0.15, tom: 1 + (k % 5) * 0.06 }));
      CX.som(c11.conecta, 'zip', { dur: 0.6, vol: 0.8 });
      CX.som(c11.conecta + 0.3, 'brilho', { vol: 0.7, notas: ['F6', 'A6', 'C7'] });
      CX.som(c11.empresaT, 'luzLiga', { vol: 0.6, zumbido: 0.7, tom: 0.85, dur: 1.2 });
    },
    desenhar(ctx, lt, T, env) {
      MG.fundo(ctx, '#020613', '#0A1638');
      ambiente(ctx, T, 0.5);
      const { s, ty } = camC11(T);
      ctx.save();
      ctx.translate(960, 470 + ty);
      ctx.scale(s, s);
      ctx.translate(-960, -470);
      redeParticipantes(ctx, T, env, s, ty);
      ctx.restore();
      // anel vindo do zoom-through
      const ka = 1 - anim(lt, 0, 0.7, E.outExpo);
      if (ka > 0.01 && c11.ordem.length) {
        const p = c11.pos[c11.ordem[0]];
        const x = lerp(960, 960 + (p.x - 960) * s, 1 - ka), y = lerp(540, 470 + ty + (p.y - 470) * s, 1 - ka);
        ctx.strokeStyle = MG.rgba(C.dourado, ka);
        ctx.lineWidth = 6 + 14 * ka;
        MG.circulo(ctx, x, y, 50 + 1300 * ka);
        ctx.stroke();
        MG.aditivo(ctx, () => MG.halo(ctx, 960, 540, 1800 * ka, C.ambar, 0.6 * ka));
      }
      // texto final da cena
      const f0 = CX.voz.frase('c11c', 0, 118.8), f1 = CX.voz.frase('c11c', 1, 122.6);
      const saiTexto = anim(T, 125.1, 125.6);
      ctx.save();
      ctx.globalAlpha = 1 - saiTexto;
      const l1 = ['Vocês', 'não', 'serão', 'espectadores', 'da', 'mudança.'];
      const t1 = CX.sincronizar('c11c', ['Nos', 'proximos', 'dias', 'voces', 'nao', 'serao', 'espectadores', 'da', 'mudanca'], f0).slice(3);
      MG.linhaPalavras(ctx, l1.map((w, i) => ({ txt: w, t: t1[i] })), 960, 935, T, { tam: 44, peso: 500 });
      const l2 = ['Serão', 'agentes', 'de', 'transformação.'];
      const t2 = CX.sincronizar('c11c', ['Serao', 'agentes', 'de', 'transformacao'], f1, 0.28, f1);
      MG.linhaPalavras(ctx, l2.map((w, i) => ({ txt: w, t: t2[i], cor: i ? C.ambar : C.branco, brilho: i > 0 })), 960, 1005, T, { tam: 50, peso: 800 });
      ctx.restore();
    }
  });

  function camC11(T) {
    const k = anim(T, c11.recua, c11.recua + 1.2, E.ioC);
    const z = anim(T, 125.0, 126.0, E.inC);
    return { s: lerp(1, 0.8, k) * (1 - 0.8 * z), ty: -75 * k * (1 - z) };
  }

  function ambiente(ctx, T, a) {
    if (!c11.amb) c11.amb = MG.gerarRede(111, 90, -100, -60, 2020, 1140, 2, 90);
    const { nos, arestas } = c11.amb;
    const dx = Math.sin(T * 0.1) * 30, dy = Math.cos(T * 0.08) * 20;
    MG.aditivo(ctx, () => {
      ctx.lineWidth = 1;
      arestas.forEach(([i, j]) => {
        ctx.strokeStyle = MG.rgba(C.azul, 0.12 * a);
        ctx.beginPath();
        ctx.moveTo(nos[i].x + dx, nos[i].y + dy);
        ctx.lineTo(nos[j].x + dx, nos[j].y + dy);
        ctx.stroke();
      });
      nos.forEach(n => MG.halo(ctx, n.x + dx, n.y + dy, 10, C.ciano, 0.35 * a * (0.5 + 0.5 * Math.sin(T + n.fase))));
    });
  }

  function redeParticipantes(ctx, T, env, s, ty) {
    const { parts, pos, tFoto, conecta, empresaT, porGrupo } = c11;
    // ponteiro no espaço da rede
    let px = -1e4, py = -1e4;
    if (env && env.ponteiro && env.ponteiro.ativo) {
      px = (env.ponteiro.x - 960) / s + 960;
      py = (env.ponteiro.y - 470 - ty) / s + 470;
    }
    // núcleos: halo âmbar
    NUCLEOS.forEach((n, g) => {
      const vis = porGrupo[g].filter(i => T >= tFoto[i]).length / Math.max(1, porGrupo[g].length);
      MG.aditivo(ctx, () => MG.halo(ctx, n[0], n[1], 330, C.ambar, 0.18 * vis));
    });
    // ligações entre núcleos e o centro
    const kc = anim(T, conecta, conecta + 1.0, E.ioC);
    if (kc > 0) {
      NUCLEOS.forEach((n, g) => {
        const pts = MG.curva(n[0], n[1], HUB[0], HUB[1], 0.12 * (g === 1 ? -1 : 1), 24);
        MG.aditivo(ctx, () => {
          ctx.strokeStyle = MG.rgba(C.azul, 0.8);
          ctx.lineWidth = 2.5;
          MG.caminho(ctx, pts, 0, kc);
          if (kc >= 1) {
            const p = MG.pontoEm(pts, (T * 0.6 + g * 0.33) % 1);
            MG.luz(ctx, p[0], p[1], 24, C.ciano, 0.9);
          }
        });
        const m = NUCLEOS[(g + 1) % 3];
        const arc = MG.curva(n[0], n[1], m[0], m[1], 0.22, 30);
        ctx.strokeStyle = MG.rgba(C.azul, 0.35);
        ctx.lineWidth = 1.5;
        MG.caminho(ctx, arc, 0, anim(T, conecta + 0.3, conecta + 1.3, E.ioC));
      });
    }
    // ligações dentro de cada núcleo
    porGrupo.forEach(lista => {
      lista.forEach((i, k) => {
        const j = lista[(k + 1) % lista.length];
        if (lista.length < 2) return;
        const t0 = Math.max(tFoto[i], tFoto[j]);
        const kl = anim(T, t0, t0 + 0.4, E.ioC);
        if (kl <= 0) return;
        MG.aditivo(ctx, () => {
          ctx.strokeStyle = MG.rgba(C.ambar, 0.55);
          ctx.lineWidth = 2;
          MG.caminho(ctx, [[pos[i].x, pos[i].y], [pos[j].x, pos[j].y]], 0, kl);
        });
      });
    });
    // fotos
    parts.forEach((p, i) => {
      const t0 = tFoto[i];
      const kk = MG.mola(T - t0, 1.8, 6);
      if (kk <= 0) return;
      const { x, y } = pos[i];
      const hover = Math.hypot(px - x, py - y) < 60;
      const cliques = (env && env.cliques || []).filter(c => c.cena === 'C11' && c.T <= T && T - c.T < 1.2 && Math.hypot((c.x - 960) / s + 960 - x, (c.y - 470 - ty) / s + 470 - y) < 60);
      const pulso = cliques.length ? MG.janela(T, cliques[cliques.length - 1].T, cliques[cliques.length - 1].T + 1.0, 0.05, 0.9) : 0;
      const r = 50 * kk * (hover ? 1.14 : 1) * (1 + 0.12 * pulso);
      MG.aditivo(ctx, () => MG.halo(ctx, x, y, r * 3.2, C.ambar, 0.4 + 0.3 * (hover ? 1 : 0) + 0.4 * pulso));
      const img = MG.img('participante:' + i);
      MG.fotoCirculo(ctx, img, x, y, r, { rotulo: 'FOTO ' + String(i + 1).padStart(2, '0'), brilho: 0.8 + (hover ? 0.6 : 0) });
      const kn = anim(T, t0 + 0.15, t0 + 0.55, E.outExpo);
      const nome = (p.nome || '').trim() || 'Participante ' + String(i + 1).padStart(2, '0');
      MG.texto(ctx, nome, x, y + 50 + 24 + (1 - kn) * 10, { tam: 19, peso: 600, alpha: kn, cor: p.nome ? C.branco : MG.rgba(C.gelo, 0.55) });
    });
    // nome (ou logo) da empresa no centro da rede
    const ke = prog(T, empresaT, empresaT + 0.9);
    if (ke > 0) {
      const logo = MG.img('logo:empresa');
      MG.aditivo(ctx, () => MG.halo(ctx, HUB[0], HUB[1], 320, C.azul, 0.35 * Math.min(1, ke * 2)));
      if (logo) {
        const sc = Math.min(300 / logo.naturalWidth, 120 / logo.naturalHeight);
        ctx.save();
        ctx.globalAlpha = Math.min(1, ke * 1.5);
        ctx.drawImage(logo, HUB[0] - (logo.naturalWidth * sc) / 2, HUB[1] - (logo.naturalHeight * sc) / 2, logo.naturalWidth * sc, logo.naturalHeight * sc);
        ctx.restore();
      } else {
        MG.textoFilamento(ctx, CX.empresaNome(), HUB[0], HUB[1], ke, { tam: 32, peso: 800, cor: C.branco });
      }
    }
  }

  /* ======================= C12 · A rede conectada ======================= */
  let c12 = null;
  CX.cenas.definir('C12', {
    preparar() {
      const proj = MG.projBrasil(960, 560, 24);
      const contorno = CX.brasilContorno.map(([lo, la]) => proj(lo, la));
      const cidades = MG.cidadesBrasil.map(([nome, lo, la, w]) => { const [x, y] = proj(lo, la); return { nome, x, y, w }; });
      // árvore geradora mínima + atalhos
      const n = cidades.length;
      const dist = (a, b) => Math.hypot(cidades[a].x - cidades[b].x, cidades[a].y - cidades[b].y);
      const dentro = new Set([0]);
      const arestas = [];
      while (dentro.size < n) {
        let best = null;
        dentro.forEach(a => {
          for (let b = 0; b < n; b++) {
            if (dentro.has(b)) continue;
            const d = dist(a, b);
            if (!best || d < best[2]) best = [a, b, d];
          }
        });
        arestas.push(best);
        dentro.add(best[1]);
      }
      const chave = new Set(arestas.map(([a, b]) => Math.min(a, b) + '-' + Math.max(a, b)));
      for (let a = 0; a < n; a++) {
        const viz = [...Array(n).keys()].filter(b => b !== a).sort((p, q) => dist(a, p) - dist(a, q)).slice(0, 2);
        viz.forEach(b => {
          const k = Math.min(a, b) + '-' + Math.max(a, b);
          if (!chave.has(k) && dist(a, b) < 160) { chave.add(k); arestas.push([a, b, dist(a, b)]); }
        });
      }
      // profundidade a partir de São Paulo
      const viz = cidades.map(() => []);
      arestas.forEach(([a, b]) => { viz[a].push(b); viz[b].push(a); });
      const prof = cidades.map(() => -1);
      prof[0] = 0;
      const fila = [0];
      while (fila.length) { const a = fila.shift(); viz[a].forEach(b => { if (prof[b] < 0) { prof[b] = prof[a] + 1; fila.push(b); } }); }
      const flui = CX.voz.palavra('c12', 'flui', 132.3);
      const iniLinhas = 127.6;
      const maxP = Math.max(...prof);
      const passo = Math.min(0.5, (flui - 0.4 - iniLinhas) / Math.max(1, maxP));
      // luzes das cidades (pontilhado noturno)
      const r = MG.rng(12);
      const xs = contorno.map(p => p[0]), ys = contorno.map(p => p[1]);
      const bb = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
      const luzes = [];
      let tent = 0;
      while (luzes.length < 950 && tent < 40000) {
        tent++;
        const x = bb[0] + r() * (bb[1] - bb[0]), y = bb[2] + r() * (bb[3] - bb[2]);
        if (!MG.dentroPoligono(x, y, contorno)) continue;
        let p = 0.025;
        cidades.forEach(c => { p = Math.max(p, c.w * Math.exp(-Math.hypot(c.x - x, c.y - y) / 38)); });
        if (r() < p) luzes.push({ x, y, b: r(), q: r() });
      }
      c12 = { contorno, cidades, arestas, prof, flui, iniLinhas, passo, luzes };
      CX.T.flui = flui;
    },
    sons() {
      CX.som(126.05, 'whoosh', { dur: 1.4, vol: 0.5, desce: true });
      const ord = c12.cidades.map((c, i) => [c12.iniLinhas + c12.prof[i] * c12.passo + 0.4, i]).sort((a, b) => a[0] - b[0]);
      ord.forEach(([t, i], k) => { if (k % 4 === 1 && t < c12.flui - 0.6) CX.som(t, 'ping', { nota: ['D6', 'F6', 'A6', 'C7', 'D7'][k % 5], vol: 0.25 }); });
      CX.som(c12.flui, 'luzLiga', { vol: 0.9, zumbido: 1.2, tom: 0.75, dur: 1.6 });
      CX.som(133.75, 'flash', {});
    },
    desenhar(ctx, lt, T) {
      ctx.fillStyle = '#01040C';
      ctx.fillRect(0, 0, W, H);
      const k = anim(T, 126.0, 129.2, E.ioC);
      const S = lerp(9, 1, Math.pow(k, 0.6));
      const sp = c12.cidades[0];
      const fx = lerp(sp.x, 960, k), fy = lerp(sp.y, 560, k);
      const surge = anim(T, 126.3, 127.6);
      const fl = anim(T, c12.flui, c12.flui + 0.25) * (1 - 0.6 * anim(T, c12.flui + 0.4, c12.flui + 2.0));
      // atmosfera (vista do espaço)
      MG.aditivo(ctx, () => {
        ctx.strokeStyle = MG.rgba(C.azul, 0.16 * surge);
        ctx.lineWidth = 24;
        ctx.shadowColor = C.azul;
        ctx.shadowBlur = 60;
        MG.circulo(ctx, 960, 3100, 2990);
        ctx.stroke();
        ctx.shadowBlur = 0;
      });
      ctx.save();
      ctx.translate(960, 540);
      ctx.scale(S, S);
      ctx.translate(-fx, -fy);
      // continente
      ctx.globalAlpha = surge;
      ctx.fillStyle = '#06102A';
      ctx.beginPath();
      c12.contorno.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = MG.rgba(C.ciano, 0.45);
      ctx.lineWidth = 1.6 / S;
      ctx.stroke();
      ctx.globalAlpha = 1;
      // luzes noturnas
      MG.aditivo(ctx, () => {
        c12.luzes.forEach((l, i) => {
          const pis = 0.6 + 0.4 * Math.sin(T * 2 + l.b * 10);
          MG.halo(ctx, l.x, l.y, (2.2 + l.b * 2.5) * (1 + fl * 0.6), l.q > 0.75 ? C.dourado : C.gelo, 0.5 * surge * pis);
        });
      });
      // linhas de transmissão (veias de luz)
      MG.aditivo(ctx, () => {
        c12.arestas.forEach(([a, b], idx) => {
          const pa = c12.prof[a], pb = c12.prof[b];
          const [o, d] = pa <= pb ? [a, b] : [b, a];
          const t0 = c12.iniLinhas + Math.min(pa, pb) * c12.passo;
          const kl = anim(T, t0, t0 + c12.passo * 1.6, E.ioC);
          if (kl <= 0) return;
          const A = c12.cidades[o], B = c12.cidades[d];
          const pts = MG.curva(A.x, A.y, B.x, B.y, 0.08 * (idx % 2 ? 1 : -1), 16);
          const cor = idx % 3 === 0 ? C.ciano : C.ambar;
          ctx.strokeStyle = MG.rgba(cor, 0.55 + 0.45 * fl);
          ctx.lineWidth = (1.6 + 2 * fl) / Math.sqrt(S);
          MG.caminho(ctx, pts, 0, kl);
          if (kl >= 1) {
            const v = T > c12.flui ? 1.4 : 0.5;
            const p = MG.pontoEm(pts, (T * v + idx * 0.17) % 1);
            MG.halo(ctx, p[0], p[1], 10 + 6 * fl, C.dourado, 0.9);
          }
        });
        c12.cidades.forEach((c, i) => {
          const t0 = c12.iniLinhas + c12.prof[i] * c12.passo + 0.3;
          const kc = anim(T, t0, t0 + 0.3);
          MG.luz(ctx, c.x, c.y, (10 + 16 * c.w) * (1 + fl), i === 0 ? C.ambar : C.dourado, kc * (0.7 + 0.3 * Math.sin(T * 3 + i)));
        });
      });
      // a rede dos participantes vira um ponto do mapa
      const kp = 1 - anim(T, 126.0, 127.4);
      MG.aditivo(ctx, () => {
        for (let g = 0; g < 3; g++) {
          for (let m = 0; m < 5; m++) {
            const a = (m / 5) * Math.PI * 2 + g;
            const cx = sp.x + Math.cos(g * 2.1) * 22, cy = sp.y + Math.sin(g * 2.1) * 18;
            MG.halo(ctx, cx + Math.cos(a) * 7, cy + Math.sin(a) * 7, 4, C.ambar, 0.9 * kp + 0.3);
          }
        }
        MG.luz(ctx, sp.x, sp.y, 30 / Math.sqrt(S) + 20, C.ambar, 0.6 + 0.4 * (1 - kp));
      });
      ctx.restore();
      // rótulo "VOCÊS"
      const kv = MG.janela(T, 127.0, 130.0, 0.4, 0.5);
      if (kv > 0) {
        const sx = 960 + (sp.x - fx) * S, sy = 540 + (sp.y - fy) * S;
        ctx.strokeStyle = MG.rgba(C.ambar, 0.8 * kv);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx + 14, sy - 10);
        ctx.lineTo(sx + 90 * kv, sy - 80 * kv);
        ctx.lineTo(sx + 90 * kv + 80 * kv, sy - 80 * kv);
        ctx.stroke();
        MG.texto(ctx, 'VOCÊS', sx + 180 * kv, sy - 80 * kv, { tam: 22, fam: 'mono', peso: 500, alinh: 'left', cor: C.ambar, alpha: kv, esp: 3 });
      }
      // flash branco (luma fade)
      const fw = anim(T, 133.5, 134.0, E.inQ);
      if (fw > 0) {
        ctx.fillStyle = MG.rgba('#FFF8EC', fw);
        ctx.fillRect(0, 0, W, H);
      }
    }
  });

  /* ======================= C13 · Bem-vindos à jornada ======================= */
  let c13 = null;
  CX.cenas.definir('C13', {
    preparar() {
      const palavras = ['aprendizado', 'troca', 'construcao'];
      const hits = [];
      palavras.forEach((p, k) => {
        let t = CX.voz.palavra('c13', p, 138.8 + k * 1.2);
        t = Math.max(t, k ? hits[k - 1] + 1.05 : 138.9);
        hits.push(Math.min(t, 143.6 + k * 0.3));
      });
      c13 = { hits, sala: 136.9, ceu: 138.3 };
      CX.T.hits = (CX.T.hits || []).concat(hits);
    },
    sons() {
      CX.som(134.55, 'portas', {});
      CX.som(136.75, 'whoosh', { dur: 0.5, vol: 0.4 });
      CX.som(c13.ceu, 'whoosh', { dur: 0.5, vol: 0.3 });
      c13.hits.forEach(t => CX.som(t, 'luzLiga', { vol: 0.45, zumbido: 0.3, tom: 1.05 }));
    },
    desenhar(ctx, lt, T) {
      if (T < c13.sala) portas(ctx, T);
      else if (T < c13.ceu) sala(ctx, T - c13.sala, T);
      else amanheceres(ctx, T - c13.ceu, T);
      const fw = 1 - anim(T, 134.0, 134.45, E.outQ);
      if (fw > 0) {
        ctx.fillStyle = MG.rgba('#FFF8EC', fw);
        ctx.fillRect(0, 0, W, H);
      }
      const ws = MG.janela(T, c13.sala - 0.35, c13.sala + 0.3, 0.3, 0.3);
      if (ws > 0) {
        ctx.fillStyle = MG.rgba('#FFE7BF', ws);
        ctx.fillRect(0, 0, W, H);
      }
    }
  });

  function portas(ctx, T) {
    const k = anim(T, 134.6, 135.7, E.ioC);
    const zoom = anim(T, 135.6, c13.sala, E.inQ);
    ctx.fillStyle = '#060A14';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    MG.camera(ctx, 1 + 3.5 * zoom, 960, 580);
    // parede e piso
    ctx.fillStyle = '#0B1222';
    ctx.fillRect(0, 0, W, 860);
    ctx.fillStyle = '#070B15';
    ctx.fillRect(0, 860, W, 300);
    // luz atrás das portas
    const ab = 760, fb = 1160, topo = 300, base = 860;
    const g = ctx.createRadialGradient(960, 560, 20, 960, 560, 420);
    g.addColorStop(0, '#FFF8EA');
    g.addColorStop(0.45, '#FFE0A6');
    g.addColorStop(1, '#E99A3C');
    ctx.fillStyle = g;
    ctx.fillRect(ab, topo, fb - ab, base - topo);
    // feixes de luz no piso e no ar
    MG.aditivo(ctx, () => {
      ctx.fillStyle = MG.rgba(C.dourado, 0.35 * k);
      ctx.beginPath();
      ctx.moveTo(ab, base);
      ctx.lineTo(fb, base);
      ctx.lineTo(fb + 700 * k, H + 60);
      ctx.lineTo(ab - 700 * k, H + 60);
      ctx.closePath();
      ctx.fill();
      for (let i = 0; i < 5; i++) {
        const a = MG.wiggle(T, 0.5, 0.1, i);
        ctx.fillStyle = MG.rgba(C.dourado, 0.06 * k);
        ctx.beginPath();
        ctx.moveTo(960 + (i - 2) * 60, topo + 40);
        ctx.lineTo(960 + (i - 2) * 420 + a * 400 - 200, H + 100);
        ctx.lineTo(960 + (i - 2) * 420 + a * 400 + 200, H + 100);
        ctx.closePath();
        ctx.fill();
      }
      MG.halo(ctx, 960, 580, 900 * k, C.ambar, 0.4 * k);
    });
    MG.poeira(ctx, T, 40, C.dourado, 0.5 * k, 31);
    // folhas da porta (giram nas dobradiças)
    const ang = k * 1.35;
    const larg = (fb - ab) / 2;
    [[ab, 1], [fb, -1]].forEach(([hx, s]) => {
      const w = larg * Math.cos(ang);
      const skew = 40 * Math.sin(ang);
      ctx.fillStyle = '#121A2E';
      ctx.beginPath();
      ctx.moveTo(hx, topo);
      ctx.lineTo(hx + s * w, topo - skew);
      ctx.lineTo(hx + s * w, base + skew);
      ctx.lineTo(hx, base);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = MG.rgba(C.ambar, 0.5);
      ctx.lineWidth = 2;
      ctx.stroke();
      // maçaneta
      ctx.fillStyle = MG.rgba(C.dourado, 0.8);
      MG.circulo(ctx, hx + s * w * 0.85, 590, 6 * Math.max(0.3, Math.cos(ang)));
      ctx.fill();
    });
    // batente
    ctx.strokeStyle = '#1C2640';
    ctx.lineWidth = 14;
    ctx.strokeRect(ab - 7, topo - 7, fb - ab + 14, base - topo + 7);
    ctx.restore();
  }

  function sala(ctx, t, T) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#2A1E14');
    g.addColorStop(1, '#0E0B10');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    MG.camera(ctx, 1.1 + 0.08 * t, 960, 620);
    MG.aditivo(ctx, () => MG.halo(ctx, 960, 200, 1200, C.ambar, 0.35));
    // mesas colaborativas em perspectiva
    const mesas = [[520, 520, 0.7], [1400, 520, 0.7], [960, 760, 1.0]];
    mesas.forEach(([x, y, s], i) => {
      ctx.fillStyle = '#3A2A1C';
      ctx.beginPath();
      ctx.ellipse(x, y, 330 * s, 110 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = MG.rgba(C.dourado, 0.3);
      ctx.lineWidth = 2;
      ctx.stroke();
      for (let c = 0; c < 6; c++) {
        const a = (c / 6) * Math.PI * 2;
        const cx = x + Math.cos(a) * 390 * s, cy = y + Math.sin(a) * 150 * s;
        ctx.fillStyle = '#1D1612';
        MG.retArred(ctx, cx - 30 * s, cy - 40 * s, 60 * s, 70 * s, 12 * s);
        ctx.fill();
      }
      // cadernos
      for (let c = 0; c < 3; c++) {
        ctx.fillStyle = MG.rgba('#F3E6CF', 0.85);
        ctx.save();
        ctx.translate(x - 160 * s + c * 150 * s, y - 20 * s);
        ctx.rotate(-0.15 + c * 0.12);
        ctx.fillRect(-36 * s, -22 * s, 72 * s, 48 * s);
        ctx.restore();
      }
    });
    // dossiê do case
    const k = anim(t, 0.2, 0.7, E.outBack);
    ctx.save();
    ctx.translate(960, 760);
    ctx.rotate(-0.05);
    ctx.scale(k, k);
    ctx.fillStyle = '#C8902F';
    MG.retArred(ctx, -230, -70, 460, 140, 10);
    ctx.fill();
    ctx.fillStyle = '#E2AE4C';
    MG.retArred(ctx, -230, -70, 460, 120, 10);
    ctx.fill();
    MG.texto(ctx, 'CASE', -200, -36, { tam: 18, fam: 'mono', alinh: 'left', cor: '#4A3210', esp: 3 });
    MG.texto(ctx, CX.config.programa.caso || 'PROGRAMA HORIZONTE', -200, 6, { tam: 26, fam: 'display', peso: 800, alinh: 'left', cor: '#2A1A06', esp: 1 });
    ctx.restore();
    ctx.restore();
    MG.lightLeak(ctx, T, C.ambar, 0.25, 8);
  }

  function amanheceres(ctx, t, T) {
    const hits = c13.hits;
    // altura do sol: sobe a cada "dia"
    let sol = -0.4, dia = -1;
    hits.forEach((h, k) => {
      if (T >= h - 0.75) {
        dia = k;
        const prox = hits[k + 1];
        const sobe = anim(T, h - 0.75, h + 0.25, E.outC);
        const desce = prox ? anim(T, prox - 1.05, prox - 0.75, E.inC) : 0;
        sol = -0.4 + 1.3 * sobe - 1.3 * desce;
      }
    });
    if (dia < 0) sol = -0.4 + 0.2 * anim(t, 0, 0.6);
    const luz = clamp((sol + 0.3) / 1.0);
    const HZ = 760;
    const g = ctx.createLinearGradient(0, 0, 0, HZ);
    g.addColorStop(0, MG.mistura('#030816', '#16346E', luz));
    g.addColorStop(0.7, MG.mistura('#0A1530', '#3E6FB0', luz));
    g.addColorStop(1, MG.mistura('#1A1A2A', '#F2B566', luz));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // sol
    const sx = 1180, sy = HZ - sol * 420;
    MG.aditivo(ctx, () => {
      MG.halo(ctx, sx, sy, 900, C.dourado, 0.5 * luz);
      MG.luz(ctx, sx, sy, 160, C.dourado, Math.min(1, luz * 1.4));
    });
    // nuvens rápidas (time-lapse)
    for (let i = 0; i < 7; i++) {
      const x = ((MG.hash(i) * 2600 + T * (260 + i * 40)) % 2800) - 400;
      const y = 140 + MG.hash(i + 7) * 300;
      ctx.fillStyle = MG.mistura('#0B1530', '#F3DDBB', luz * 0.8, 0.25);
      ctx.beginPath();
      ctx.ellipse(x, y, 260, 34, 0, 0, Math.PI * 2);
      ctx.ellipse(x + 120, y - 20, 160, 30, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // horizonte urbano
    const r = MG.rng(13);
    let x = -20;
    while (x < W + 20) {
      const w = 50 + r() * 110, h = 80 + Math.pow(r(), 1.5) * 300;
      ctx.fillStyle = MG.mistura('#050913', '#1C2236', luz * 0.4);
      ctx.fillRect(x, HZ - h, w, h + 400);
      ctx.fillStyle = MG.rgba(C.dourado, 0.6 * (1 - luz));
      for (let yy = HZ - h + 12; yy < HZ; yy += 18) {
        for (let xx = x + 8; xx < x + w - 8; xx += 14) if (MG.hash(Math.floor(xx * 3 + yy)) > 0.8) ctx.fillRect(xx, yy, 6, 8);
      }
      x += w + 6;
    }
    ctx.fillStyle = '#04070F';
    ctx.fillRect(0, HZ, W, H - HZ);
    // DIA 1 · DIA 2 · DIA 3
    const dias = CX.config.programa.dias || [];
    const temas = ['Aprendizado', 'Troca', 'Construção conjunta'];
    ctx.save();
    const fundoTxt = anim(T, hits[0] - 0.4, hits[0]);
    const gb = ctx.createLinearGradient(0, 120, 0, 420);
    gb.addColorStop(0, `rgba(2,6,18,${0.55 * fundoTxt})`);
    gb.addColorStop(1, 'rgba(2,6,18,0)');
    ctx.fillStyle = gb;
    ctx.fillRect(0, 100, W, 330);
    ctx.restore();
    hits.forEach((h, k) => {
      const xx = 560 + k * 400;
      const p = prog(T, h - 0.05, h + 0.5);
      const pop = MG.mola(T - h, 2, 7);
      ctx.save();
      ctx.translate(xx, 205);
      ctx.scale(0.8 + 0.2 * clamp(pop, 0, 1.2), 0.8 + 0.2 * clamp(pop, 0, 1.2));
      MG.textoFilamento(ctx, 'DIA ' + (k + 1), 0, 0, p, { tam: 62, peso: 800, cor: C.branco });
      ctx.restore();
      const kt = anim(T, h + 0.15, h + 0.6, E.outExpo);
      MG.texto(ctx, temas[k], xx, 278 + (1 - kt) * 12, { tam: 30, peso: 600, cor: C.dourado, alpha: kt });
      MG.texto(ctx, dias[k] || '', xx, 322, { tam: 18, fam: 'mono', cor: MG.rgba(C.gelo, 0.7), alpha: kt, esp: 2 });
      if (k) MG.texto(ctx, '·', xx - 200, 205, { tam: 50, peso: 700, cor: MG.rgba(C.gelo, 0.5), alpha: kt });
    });
  }

  /* ======================= C14 · O que esperamos de vocês ======================= */
  let c14 = null;
  const PALAVRAS = ['ENERGIA', 'CURIOSIDADE', 'PARTICIPAÇÃO', 'COLABORAÇÃO'];
  CX.cenas.definir('C14', {
    dica: { txt: 'Toque nas palavras para acendê-las', ini: 'c14linha', dur: 3.6 },
    preparar() {
      const tp = ['energia', 'curiosidade', 'participacao', 'colaboracao'].map((p, k) => CX.voz.palavra('c14', p, 147.0 + k * 1.3));
      for (let k = 1; k < 4; k++) tp[k] = Math.max(tp[k], tp[k - 1] + 0.9);
      const linha = clamp(CX.voz.frase('c14', 4, 153.4) - 0.25, tp[3] + 0.9, 155);
      const frase = ['Porque', 'o', 'sucesso', 'da', 'transformação', 'depende', 'de', 'cada', 'um', 'de', 'nós.'];
      const tf = CX.sincronizar('c14', ['Porque', 'o', 'sucesso', 'da', 'transformacao', 'depende', 'de', 'cada', 'um', 'de', 'nos'], linha + 0.2, 0.28, linha);
      c14 = { tp, linha, frase, tf, converge: 157.15 };
      CX.T.hits = (CX.T.hits || []).concat(tp);
      CX.T.c14linha = linha;
    },
    sons() {
      c14.tp.forEach((t, k) => CX.som(t - 0.02, 'luzLiga', { vol: 0.65, zumbido: 0.6, tom: [0.9, 1.0, 1.1, 1.2][k], dur: 1.0 }));
      CX.som(c14.linha, 'whoosh', { dur: 0.5, vol: 0.35 });
      CX.som(c14.converge, 'whoosh', { dur: 0.8, vol: 0.6, desce: true });
      CX.som(157.9, 'ping', { nota: 'A5', vol: 0.6 });
    },
    desenhar(ctx, lt, T, env) {
      const { tp, linha } = c14;
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#08122C');
      g.addColorStop(1, '#170F18');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      MG.lightLeak(ctx, T, C.ambar, 0.25, 14);
      if (T < linha) {
        let i = 0;
        for (let k = 0; k < 4; k++) if (T >= tp[k] - 0.15) i = k;
        const tl = T - (tp[i] - 0.15);
        ctx.save();
        MG.camera(ctx, 1 + 0.03 * tl, 960, 620);
        if (T < tp[0] - 0.15) energia(ctx, 0, T, 0.3);
        else if (i === 0) energia(ctx, tl, T, 1);
        else if (i === 1) curiosidade(ctx, tl, T);
        else if (i === 2) participacao(ctx, tl, T);
        else colaboracao(ctx, tl, T);
        ctx.restore();
        const ii = T < tp[0] - 0.15 ? -1 : i;
        if (ii >= 0) {
          const gb = ctx.createLinearGradient(0, 80, 0, 360);
          gb.addColorStop(0, 'rgba(2,6,18,0.6)');
          gb.addColorStop(1, 'rgba(2,6,18,0)');
          ctx.fillStyle = gb;
          ctx.fillRect(0, 60, W, 320);
          MG.textoFilamento(ctx, PALAVRAS[ii], 960, 200, prog(T, tp[ii] - 0.05, tp[ii] + 0.55), { tam: 104, peso: 800, cor: C.branco, glow: 1.3 });
          MG.texto(ctx, `${ii + 1} / 4`, 960, 300, { tam: 18, fam: 'mono', cor: MG.rgba(C.gelo, 0.55), esp: 3 });
        }
        // cliques: explosões de luz
        rippleCliques(ctx, T, env, 'C14');
      } else {
        linhaFinal(ctx, T, env);
      }
    }
  });

  function rippleCliques(ctx, T, env, cena) {
    (env && env.cliques || []).forEach(c => {
      if (c.cena !== cena || c.T > T || T - c.T > 1.2) return;
      const k = prog(T, c.T, c.T + 1.2);
      MG.aditivo(ctx, () => {
        MG.halo(ctx, c.x, c.y, 80 + 300 * E.outC(k), C.ambar, 0.6 * (1 - k));
        ctx.strokeStyle = MG.rgba(C.dourado, 0.8 * (1 - k));
        ctx.lineWidth = 3;
        MG.circulo(ctx, c.x, c.y, 20 + 260 * E.outC(k));
        ctx.stroke();
      });
    });
  }

  function energia(ctx, t, T, a) {
    ctx.globalAlpha = a;
    [[560, 0], [820, 2], [1100, 3], [1360, 5]].forEach(([x, i], k) => {
      const pulo = Math.abs(Math.sin(T * 5 + k * 0.9)) * 22 * anim(t, 0.1, 0.4);
      MG.personagem(ctx, x, 900 - pulo, 1.45, X(i, { t: T, luzContorno: C.ambar, inclina: Math.sin(T * 4 + k) * 0.05, cabeca: Math.sin(T * 5 + k) * 0.08 }));
      // arcos de riso (linhas de energia)
      const ka = 0.5 + 0.5 * Math.sin(T * 8 + k);
      ctx.strokeStyle = MG.rgba(C.ambar, 0.7 * ka * a);
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      for (let j = -1; j <= 1; j++) {
        const ang = -Math.PI / 2 + j * 0.5;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(ang) * 120, 760 - pulo + Math.sin(ang) * 120);
        ctx.lineTo(x + Math.cos(ang) * (140 + 14 * ka), 760 - pulo + Math.sin(ang) * (140 + 14 * ka));
        ctx.stroke();
      }
    });
    ctx.globalAlpha = 1;
  }

  function curiosidade(ctx, t, T) {
    MG.aditivo(ctx, () => MG.halo(ctx, 960, 640, 520, C.ambar, 0.35));
    for (let k = 0; k < 4; k++) {
      const p = ((T * 0.6 + k / 4) % 1);
      ctx.strokeStyle = MG.rgba(C.ambar, 0.5 * p);
      ctx.lineWidth = 2;
      MG.circulo(ctx, 960, 640, 420 - 300 * p);
      ctx.stroke();
    }
    MG.personagem(ctx, 960, 980, 2.7, X(1, { chave: 'analista', pele: CX.PERS.analista.pele, cabelo: CX.PERS.analista.cabelo, estilo: CX.PERS.analista.estilo, roupa: CX.PERS.analista.roupa, t: T, inclina: 0.04 + 0.03 * anim(t, 0, 0.8), cabeca: 0.1, luzContorno: C.ambar }));
  }

  function participacao(ctx, t, T) {
    MG.personagem(ctx, 600, 930, 1.5, X(0, { t: T, cabeca: 0.2 * anim(t, 0.3, 0.7), luzContorno: C.ambar }));
    MG.personagem(ctx, 1320, 930, 1.5, X(4, { t: T, cabeca: -0.2 * anim(t, 0.35, 0.75), luzContorno: C.ambar }));
    MG.personagem(ctx, 960, 900, 1.85, Object.assign({}, CX.PERS.colaboradora, { t: T, pose: 'levantado', aceno: anim(t, 0, 0.45, E.outBack), luzContorno: C.ambar }));
  }

  function colaboracao(ctx, t, T) {
    ctx.fillStyle = '#20160F';
    ctx.beginPath();
    ctx.ellipse(960, 640, 620, 360, 0, 0, Math.PI * 2);
    ctx.fill();
    const cores = ['#F6E7A8', '#7FD1C7', '#8FB3FF', '#F2B8C6'];
    for (let i = 0; i < 9; i++) {
      ctx.save();
      ctx.translate(960 + Math.cos(i * 2.3) * 380, 640 + Math.sin(i * 2.3) * 200);
      ctx.rotate(i * 0.6);
      ctx.fillStyle = cores[i % 4];
      ctx.globalAlpha = 0.85;
      ctx.fillRect(-45, -32, 90, 64);
      ctx.restore();
    }
    const k = anim(t, 0.05, 0.75, E.outC);
    const peles = MG.PELES;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.3;
      const ox = 960 + Math.cos(a) * 1100, oy = 640 + Math.sin(a) * 700;
      const hx = 960 + Math.cos(a) * lerp(1000, 70, k), hy = 640 + Math.sin(a) * lerp(640, 46, k);
      ctx.strokeStyle = ['#2B4C8C', '#5A4C8C', '#2F6F6A', '#7A3E4E', '#35507E', '#6B4E3A'][i];
      ctx.lineWidth = 64;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(hx, hy);
      ctx.stroke();
      ctx.fillStyle = peles[i % 5];
      MG.circulo(ctx, hx, hy, 40);
      ctx.fill();
    }
    const kb = MG.janela(t, 0.7, 1.6, 0.1, 0.8);
    if (kb > 0) MG.aditivo(ctx, () => { MG.luz(ctx, 960, 640, 400 * kb, C.ambar, kb); MG.halo(ctx, 960, 640, 900 * kb, C.dourado, 0.4 * kb); });
  }

  function linhaFinal(ctx, T, env) {
    const { linha, frase, tf, converge } = c14;
    MG.poeira(ctx, T, 40, C.dourado, 0.35, 41);
    const conv = anim(T, converge, 158.0, E.inExpo);
    // ajusta o tamanho para caber na largura da tela
    let tam = 46;
    const sep = '  ·  ';
    MG.fonte(ctx, tam, 800, 'display');
    let total0 = PALAVRAS.reduce((a, p) => a + MG.medir(ctx, p, 3), 0) + MG.medir(ctx, sep, 0) * 3;
    tam = Math.min(46, Math.floor((46 * 1640) / total0));
    const esp = tam * 0.06;
    MG.fonte(ctx, tam, 800, 'display');
    const larg = PALAVRAS.map(p => MG.medir(ctx, p, esp));
    const lsep = MG.medir(ctx, sep, 0);
    const total = larg.reduce((a, b) => a + b, 0) + lsep * 3;
    let x = 960 - total / 2;
    const cliques = (env && env.cliques || []).filter(c => c.cena === 'C14' && c.T <= T);
    PALAVRAS.forEach((p, k) => {
      const cx = x + larg[k] / 2;
      const ki = anim(T, linha + k * 0.08, linha + 0.4 + k * 0.08, E.outExpo);
      const clic = cliques.filter(c => Math.abs(c.x - cx) < larg[k] / 2 + 10 && Math.abs(c.y - 430) < 50).pop();
      const flash = clic ? MG.janela(T, clic.T, clic.T + 0.9, 0.04, 0.8) : 0;
      const px = lerp(cx, 960, conv), py = lerp(430, 540, conv);
      ctx.save();
      ctx.translate(px, py + (1 - ki) * 30);
      ctx.scale(1 - conv * 0.95 + flash * 0.08, 1 - conv * 0.95 + flash * 0.08);
      MG.texto(ctx, p, 0, 0, { tam, peso: 800, fam: 'display', esp, cor: flash > 0 ? MG.mistura(C.branco, C.dourado, flash) : C.branco, alpha: ki * (1 - conv * 0.5), brilho: C.ambar, brilhoR: 16 + 40 * flash });
      ctx.restore();
      x += larg[k];
      if (k < 3) {
        MG.texto(ctx, '·', lerp(x + lsep / 2, 960, conv), lerp(430, 540, conv), { tam, peso: 800, cor: C.ambar, alpha: ki * (1 - conv) });
        x += lsep;
      }
    });
    // frase sincronizada
    ctx.save();
    ctx.globalAlpha = 1 - anim(T, converge - 0.4, converge);
    MG.linhaPalavras(ctx, frase.map((w, i) => ({ txt: w, t: tf[i], cor: i >= 7 ? C.ambar : C.branco, brilho: i >= 7 })), 960, 590, T, { tam: 50, peso: 500 });
    ctx.restore();
    // ponto de luz central (a faísca volta)
    if (conv > 0) MG.aditivo(ctx, () => MG.luz(ctx, 960, 540, 40 + 120 * conv, C.ambar, conv));
  }

  /* ======================= C15 · A frase final ======================= */
  let c15 = null;
  CX.cenas.definir('C15', {
    dica: { txt: 'Toque para espalhar a luz', ini: 'onda', dur: 5 },
    preparar() {
      const onda = 159.2;
      const rede = MG.gerarRede(151, 230, -80, -60, 2000, 1140, 3, 68);
      rede.nos.forEach(n => {
        const d = Math.hypot(n.x - 960, n.y - 540);
        const y = clamp(d / 1900);
        n.tLiga = onda + 1.5 * (1 - Math.cbrt(1 - y));
      });
      const f = [0, 1, 2].map(k => CX.voz.frase('c15', k, [160.4, 163.0, 165.6][k]));
      const agora = CX.voz.palavra('c15', 'agora', f[2] + 1.6);
      c15 = { onda, rede, f, agora };
      CX.T.onda = onda;
      CX.T.agora = agora;
    },
    sons() {
      CX.som(158.05, 'luzLiga', { vol: 0.6, zumbido: 0.6, dur: 1.0 });
      CX.som(158.62, 'ping', { nota: 'D5', vol: 0.6, decai: 0.9 });
      CX.som(c15.onda, 'onda', {});
      CX.som(160.0, 'zumbido', { dur: 8.4, vol: 0.85, entra: 1.0, sai: 1.2 }, 8.4);
      c15.f.forEach((t, k) => CX.som(t - 0.05, 'luzLiga', { vol: 0.35, zumbido: 0.2, tom: [1, 1.1, 0.9][k] }));
    },
    desenhar(ctx, lt, T, env) {
      ctx.fillStyle = '#01030B';
      ctx.fillRect(0, 0, W, H);
      const { onda, rede, f, agora } = c15;
      const kO = prog(T, onda, onda + 1.5);
      const R = 1900 * E.outC(kO);
      const dim = 1 - 0.6 * anim(T, onda + 1.6, onda + 3.2);
      const cliques = (env && env.cliques || []).filter(c => c.cena === 'C15' && c.T <= T && T - c.T < 2.5);
      // rede imensa
      const brilhoNo = n => {
        let on = T >= n.tLiga ? 1 : 0;
        let flash = MG.janela(T, n.tLiga, n.tLiga + 0.7, 0.03, 0.6);
        cliques.forEach(c => {
          const d = Math.hypot(n.x - c.x, n.y - c.y);
          const tc = c.T + d / 1100;
          flash = Math.max(flash, MG.janela(T, tc, tc + 0.6, 0.03, 0.5) * clamp(1 - d / 700));
        });
        return { on, flash };
      };
      const estados = rede.nos.map(brilhoNo);
      MG.aditivo(ctx, () => {
        ctx.lineWidth = 1.3;
        rede.arestas.forEach(([i, j], k) => {
          const a = rede.nos[i], b = rede.nos[j];
          const ea = estados[i], eb = estados[j];
          const on = Math.min(ea.on, eb.on);
          if (!on) return;
          const fl = Math.max(ea.flash, eb.flash);
          ctx.strokeStyle = MG.rgba(k % 3 === 0 ? C.ambar : C.azul, (0.35 + 0.5 * fl) * dim);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        });
        rede.nos.forEach((n, i) => {
          const e = estados[i];
          if (!e.on && !e.flash) return;
          MG.luz(ctx, n.x, n.y, (14 + 40 * e.flash) * n.tam, i % 3 === 0 ? C.ambar : C.ciano, (0.7 * dim + 0.6 * e.flash) * (0.8 + 0.2 * Math.sin(T * 2 + n.fase)));
        });
        // frente da onda
        if (kO > 0 && kO < 1) {
          ctx.strokeStyle = MG.rgba(C.dourado, 0.8 * (1 - kO));
          ctx.lineWidth = 6 + 30 * (1 - kO);
          ctx.shadowColor = C.ambar;
          ctx.shadowBlur = 40;
          MG.circulo(ctx, 960, 540, R);
          ctx.stroke();
          ctx.shadowBlur = 0;
          MG.halo(ctx, 960, 540, 1400 * (1 - kO), C.ambar, 0.6 * (1 - kO));
        }
      });
      // faísca central
      const pulso = MG.janela(T, 158.55, 159.0, 0.12, 0.33);
      const sp = T < onda ? 1 : 1 - anim(T, onda, onda + 0.6);
      if (sp > 0) {
        CX.filamento(ctx, 960, 540, (0.6 + 0.4 * anim(T, 158.0, 158.4)) * sp + pulso * 0.5, T, 0.8 + 0.3 * pulso);
      }
      rippleCliques(ctx, T, env, 'C15');
      // frases (no máximo duas linhas na tela)
      const linhas = [
        { txt: 'A mudança é inevitável.', t: f[0] },
        { txt: 'Liderá-la é uma escolha.', t: f[1] },
        { txt: 'E essa escolha começa agora.', t: f[2], forte: true }
      ];
      const sobe = anim(T, f[2] - 0.35, f[2] + 0.25, E.ioC);
      if (T > f[0] - 0.4) {
        const fundo = anim(T, f[0] - 0.4, f[0]);
        const gb = ctx.createRadialGradient(960, 540, 50, 960, 540, 900);
        gb.addColorStop(0, `rgba(1,3,11,${0.75 * fundo})`);
        gb.addColorStop(1, 'rgba(1,3,11,0)');
        ctx.fillStyle = gb;
        ctx.fillRect(0, 0, W, H);
      }
      linhas.forEach((l, k) => {
        if (T < l.t - 0.1) return;
        let y = k === 0 ? 490 - 90 * sobe : k === 1 ? 590 - 100 * sobe : 590;
        let a = k === 0 ? 1 - sobe : 1;
        const cores = l.forte ? [...l.txt].map((ch, i) => (i >= l.txt.length - 6 ? C.ambar : C.branco)) : null;
        const pulsoAgora = l.forte ? MG.janela(T, agora - 0.05, agora + 1.6, 0.1, 1.2) : 0;
        ctx.save();
        if (l.forte) {
          ctx.translate(960, y);
          ctx.scale(1 + 0.03 * pulsoAgora, 1 + 0.03 * pulsoAgora);
          ctx.translate(-960, -y);
        }
        MG.textoFilamento(ctx, l.txt, 960, y, prog(T, l.t - 0.1, l.t + 0.8), { tam: l.forte ? 70 : 62, peso: l.forte ? 800 : 600, cor: C.branco, cores, alpha: a, glow: 1 + pulsoAgora });
        ctx.restore();
      });
      // fade lento para azul-marinho
      const fn = anim(T, 166.9, 168.0, E.ioS);
      if (fn > 0) {
        ctx.fillStyle = MG.rgba('#040A18', fn);
        ctx.fillRect(0, 0, W, H);
      }
    }
  });

  /* ======================= C16 · Cartela final ======================= */
  CX.cenas.definir('C16', {
    sons() {
      CX.som(168.6, 'luzLiga', { vol: 0.45, zumbido: 0.4, tom: 0.9, dur: 1.4 });
      CX.som(169.9, 'zip', { dur: 0.7, vol: 0.5 });
      CX.som(168.0, 'zumbido', { dur: 6.5, vol: 0.5, entra: 0.3, sai: 3 }, 6.5);
    },
    desenhar(ctx, lt, T) {
      ctx.fillStyle = '#040A18';
      ctx.fillRect(0, 0, W, H);
      const Tm = Math.min(T, 175.0); // último segundo: tela parada
      const fundo = anim(Tm, 168.0, 169.5);
      ctx.save();
      ctx.globalAlpha = fundo;
      ambiente(ctx, Tm, 0.55);
      ctx.restore();
      MG.aditivo(ctx, () => MG.halo(ctx, 960, 480, 900, C.azul, 0.18 * fundo));
      const P = CX.config.programa;
      MG.textoFilamento(ctx, P.titulo, 960, 410, prog(Tm, 168.6, 170.2), { tam: 70, peso: 800, cor: C.branco });
      const kl = anim(Tm, 169.9, 170.7, E.ioExpo);
      ctx.fillStyle = C.ambar;
      ctx.shadowColor = C.ambar;
      ctx.shadowBlur = 12;
      ctx.fillRect(960 - 220 * kl, 478, 440 * kl, 4);
      ctx.shadowBlur = 0;
      const k2 = anim(Tm, 170.3, 170.9, E.outExpo);
      MG.texto(ctx, `${P.subtitulo} · ${CX.empresaNome()}`, 960, 545 + (1 - k2) * 14, { tam: 34, peso: 500, cor: C.branco, alpha: k2 });
      const k3 = anim(Tm, 170.7, 171.3, E.outExpo);
      MG.texto(ctx, P.datas, 960, 605 + (1 - k3) * 14, { tam: 26, fam: 'mono', cor: MG.rgba(C.gelo, 0.8), alpha: k3, esp: 2 });
      // logos
      const k4 = anim(Tm, 171.3, 171.9, E.outBack);
      [['logo:empresa', '[LOGO DA EMPRESA]', 760], ['logo:parceiro', CX.config.parceiro.nome || '[LOGO A&M]', 1160]].forEach(([chave, rot, x]) => {
        const img = MG.img(chave);
        ctx.save();
        ctx.translate(x, 790);
        ctx.scale(k4, k4);
        if (img) {
          const sc = Math.min(300 / img.naturalWidth, 110 / img.naturalHeight);
          ctx.drawImage(img, (-img.naturalWidth * sc) / 2, (-img.naturalHeight * sc) / 2, img.naturalWidth * sc, img.naturalHeight * sc);
        } else {
          ctx.strokeStyle = MG.rgba(C.gelo, 0.35);
          ctx.setLineDash([10, 8]);
          ctx.lineWidth = 2;
          MG.retArred(ctx, -150, -55, 300, 110, 12);
          ctx.stroke();
          ctx.setLineDash([]);
          MG.texto(ctx, rot, 0, 0, { tam: 18, fam: 'mono', cor: MG.rgba(C.gelo, 0.6), esp: 1.5 });
        }
        ctx.restore();
      });
      MG.texto(ctx, '·', 960, 790, { tam: 40, cor: MG.rgba(C.gelo, 0.5), alpha: k4 });
    }
  });
})();
