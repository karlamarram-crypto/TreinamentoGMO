/* ==========================================================================
   CONECTADOS · CENAS C01–C08 (Abertura, Parte 1 e Parte 2)
   ========================================================================== */
(function () {
  'use strict';
  const CX = window.CX;
  const MG = CX.MG;
  const E = MG.E;
  const C = MG.cor;
  const W = MG.W, H = MG.H;
  const { anim, prog, clamp, lerp } = MG;

  // Aparência padrão dos personagens-âncora (sem foto)
  const PERS = {
    colaboradora: { chave: 'colaboradora', pele: MG.PELES[2], cabelo: MG.CABELOS[0], estilo: 'longo', roupa: '#3E5C8A' },
    colega: { chave: 'colega', pele: MG.PELES[0], cabelo: MG.CABELOS[2], estilo: 'curto', roupa: '#2F6F6A' },
    analista: { chave: 'analista', pele: MG.PELES[3], cabelo: MG.CABELOS[0], estilo: 'cacheado', roupa: '#5A4C8C' },
    gestor: { chave: 'gestor', pele: MG.PELES[1], cabelo: MG.CABELOS[3], estilo: 'raspado', roupa: '#2B3F66' },
    lider: { chave: 'lider', pele: MG.PELES[4], cabelo: MG.CABELOS[0], estilo: 'coque', roupa: '#7A3E4E' }
  };
  const EXTRAS = [
    { pele: MG.PELES[1], cabelo: MG.CABELOS[1], estilo: 'curto', roupa: '#35507E' },
    { pele: MG.PELES[3], cabelo: MG.CABELOS[0], estilo: 'raspado', roupa: '#6B4E3A' },
    { pele: MG.PELES[0], cabelo: MG.CABELOS[2], estilo: 'longo', roupa: '#3F6E58' },
    { pele: MG.PELES[4], cabelo: MG.CABELOS[0], estilo: 'cacheado', roupa: '#47406E' },
    { pele: MG.PELES[2], cabelo: MG.CABELOS[3], estilo: 'curto', roupa: '#5C3F55' },
    { pele: MG.PELES[1], cabelo: MG.CABELOS[0], estilo: 'coque', roupa: '#2E5C7A' }
  ];
  CX.PERS = PERS;
  CX.EXTRAS = EXTRAS;
  const P = (nome, extra) => Object.assign({}, PERS[nome], extra);
  const X = (i, extra) => Object.assign({}, EXTRAS[i % EXTRAS.length], extra);

  /* ======================= C01 · A faísca ======================= */
  const BATIDAS = [0.25, 1.3, 2.35, 3.4, 4.45, 5.5];
  const IGN = 0.8;

  function filamento(ctx, x, y, br, t, esc = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(esc, esc);
    // bulbo de vidro (sutil)
    ctx.strokeStyle = MG.rgba(C.gelo, 0.05 + 0.05 * br);
    ctx.lineWidth = 1.5;
    MG.circulo(ctx, 0, -6, 118);
    ctx.stroke();
    // hastes
    ctx.strokeStyle = MG.rgba(C.gelo, 0.16 + 0.25 * br);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-34, 120);
    ctx.lineTo(-40, 4);
    ctx.moveTo(34, 120);
    ctx.lineTo(40, 4);
    ctx.stroke();
    // espiral
    const pts = [];
    for (let i = 0; i <= 90; i++) {
      const u = i / 90;
      pts.push([-40 + 80 * u, Math.sin(u * Math.PI * 14) * 7 * Math.sin(u * Math.PI) - 2]);
    }
    ctx.strokeStyle = MG.rgba(C.gelo, 0.22);
    ctx.lineWidth = 2;
    MG.caminho(ctx, pts, 0, 1);
    if (br > 0) {
      MG.aditivo(ctx, () => {
        ctx.strokeStyle = br < 0.5 ? MG.mistura(C.ambarQuente, C.dourado, br * 2) : MG.mistura(C.dourado, '#FFFFFF', (br - 0.5) * 1.6);
        ctx.lineWidth = 3;
        ctx.shadowColor = C.ambar;
        ctx.shadowBlur = 24 * br;
        MG.caminho(ctx, pts, 0, 1);
        ctx.shadowBlur = 0;
        MG.luz(ctx, 0, 0, 170 * br, C.ambar, 0.9 * br);
        MG.luz(ctx, 0, 0, 70 * br, C.dourado, br);
      });
    }
    ctx.restore();
  }
  CX.filamento = filamento;

  CX.cenas.definir('C01', {
    sons() {
      CX.som(0, 'zumbido', { dur: 7.3, vol: 0.9, entra: 0.6, sai: 0.8 }, 7.3);
      BATIDAS.forEach((t, i) => CX.som(t, 'batimento', { vol: 0.95 - i * 0.12 }));
      CX.som(IGN, 'luzLiga', { vol: 1, zumbido: 1.3, dur: 1.8 });
      CX.som(6.2, 'whoosh', { dur: 0.85, vol: 0.9 });
    },
    desenhar(ctx, lt, T, env) {
      ctx.fillStyle = '#01030A';
      ctx.fillRect(0, 0, W, H);
      const b = lt < IGN ? 0 : anim(lt, IGN, IGN + 1.5, E.outC);
      const flick = lt > IGN && lt < IGN + 0.55 ? 0.45 + 0.55 * MG.hash(Math.floor(lt * 32)) : 1;
      const br = b * flick * (1 + 0.04 * Math.sin(lt * 9));
      const st = anim(lt, 6.2, 7.0, E.inExpo);

      ctx.save();
      MG.camera(ctx, 1 + 0.5 * E.ioS(prog(lt, 0, 6.4)));
      MG.aditivo(ctx, () => {
        MG.halo(ctx, 960, 540, 1100 * br, C.azul, 0.2 * br);
        MG.halo(ctx, 960, 540, 480 * br, C.ambar, 0.22 * br);
      });
      // anéis no ritmo do coração
      BATIDAS.forEach(tb => {
        const k = prog(lt, tb, tb + 1.8);
        if (k <= 0 || k >= 1) return;
        ctx.strokeStyle = MG.rgba(lt < IGN ? C.gelo : C.ciano, (1 - k) * (lt < IGN ? 0.12 : 0.3));
        ctx.lineWidth = 1.5;
        MG.circulo(ctx, 960, 534, 130 + 420 * E.outC(k));
        ctx.stroke();
      });
      // marcas de mira (motion graphics)
      const km = anim(lt, 2.2, 3.6, E.ioExpo) * (1 - st);
      if (km > 0) {
        ctx.strokeStyle = MG.rgba(C.ciano, 0.35 * km);
        ctx.lineWidth = 1.5;
        [-1, 1].forEach(s => {
          ctx.beginPath();
          ctx.moveTo(960 + s * 170, 534);
          ctx.lineTo(960 + s * (170 + 260 * km), 534);
          ctx.stroke();
          for (let i = 1; i <= 4; i++) {
            const xx = 960 + s * (170 + 65 * i);
            if (Math.abs(xx - 960) > 170 + 260 * km) continue;
            ctx.beginPath();
            ctx.moveTo(xx, 528);
            ctx.lineTo(xx, 540);
            ctx.stroke();
          }
        });
      }
      filamento(ctx, 960 + st * 30, 540, br * (1 - st * 0.6), lt);
      // partículas em órbita
      if (br > 0) {
        const r = MG.rng(11);
        MG.aditivo(ctx, () => {
          for (let i = 0; i < 46; i++) {
            const a0 = r() * Math.PI * 2, r0 = 90 + r() * 260, v = (0.1 + r() * 0.25) * (r() > 0.5 ? 1 : -1), tam = 2 + r() * 4;
            const a = a0 + lt * v;
            const rr = r0 + (lt - IGN) * 14;
            MG.halo(ctx, 960 + Math.cos(a) * rr, 540 + Math.sin(a) * rr * 0.8, tam * 4, r() > 0.6 ? C.ambar : C.ciano, 0.55 * br * (0.5 + 0.5 * Math.sin(lt * 2 + i)));
          }
        });
      }
      ctx.restore();

      // rastro de luz (light streak wipe)
      if (st > 0) {
        const hx = 960 + st * 1500;
        MG.aditivo(ctx, () => {
          const g = ctx.createLinearGradient(960 - 200, 0, hx, 0);
          g.addColorStop(0, MG.rgba(C.azul, 0));
          g.addColorStop(0.7, MG.rgba(C.ciano, 0.6));
          g.addColorStop(1, MG.rgba('#FFFFFF', 1));
          ctx.fillStyle = g;
          ctx.fillRect(960 - 200, 540 - 3 - 6 * st, hx - 760, 6 + 12 * st);
          MG.luz(ctx, hx, 540, 160 + 200 * st, C.ciano, 1);
          MG.halo(ctx, hx, 540, 900 * st, C.azul, 0.35 * st);
        });
      }
    }
  });

  /* ======================= C02 · Velocidade ======================= */
  let predios = null, torres = null;
  CX.cenas.definir('C02', {
    preparar() {
      const r = MG.rng(21);
      predios = [];
      let x = -40;
      while (x < W + 40) {
        const w = 40 + r() * 90, h = 50 + Math.pow(r(), 1.8) * 260;
        predios.push({ x, w, h, sem: Math.floor(r() * 1000) });
        x += w + 4 + r() * 10;
      }
      torres = [1180, 1420, 1640, 1840].map((xx, i) => ({ x: xx, h: 150 - i * 18 }));
    },
    sons() {
      CX.som(7.15, 'whoosh', { dur: 0.6, vol: 0.45 });
      CX.som(8.4, 'whoosh', { dur: 0.5, vol: 0.3 });
      CX.som(9.5, 'whoosh', { dur: 0.5, vol: 0.3 });
      CX.som(10.55, 'zip', { dur: 0.4, vol: 1 });
    },
    desenhar(ctx, lt, T) {
      const corte = 3.6;
      if (lt < corte) fibra(ctx, lt);
      else cidade(ctx, lt - corte, T);
      // match cut de luz
      const f = MG.janela(lt, corte - 0.12, corte + 0.2, 0.1, 0.15);
      if (f > 0) {
        ctx.fillStyle = MG.rgba(C.gelo, 0.35 * f);
        ctx.fillRect(0, 0, W, H);
      }
    }
  });

  function fibra(ctx, lt) {
    MG.fundo(ctx, '#020615', '#071433');
    ctx.save();
    MG.camera(ctx, 1 + 0.06 * lt, 960, 540, 0, 0, -0.05 + 0.015 * lt);
    const VP = [1780, 500];
    // linhas de velocidade
    const r = MG.rng(5);
    for (let i = 0; i < 40; i++) {
      const y = r() * H, len = 80 + r() * 260, v = 900 + r() * 1400;
      const x = ((r() * W * 2 - lt * v) % (W + 600) + W + 600) % (W + 600) - 300;
      ctx.strokeStyle = MG.rgba(C.ciano, 0.05 + r() * 0.08);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + len, y);
      ctx.stroke();
    }
    // fibras convergindo para o ponto de fuga
    for (let i = 0; i < 9; i++) {
      const y0 = 540 + (i - 4) * 105;
      const pts = [[-120, y0], VP];
      ctx.strokeStyle = MG.rgba(C.azul, 0.22);
      ctx.lineWidth = 3 - Math.abs(i - 4) * 0.3;
      MG.caminho(ctx, pts, 0, 1);
      // pulsos
      for (let k = 0; k < 2; k++) {
        const p = ((lt * 0.85 + i * 0.137 + k * 0.5) % 1);
        const pp = E.inQ(p);
        const cab = MG.pontoEm(pts, pp);
        const cauda = MG.pontoEm(pts, Math.max(0, pp - 0.18));
        MG.aditivo(ctx, () => {
          const g = ctx.createLinearGradient(cauda[0], cauda[1], cab[0], cab[1]);
          g.addColorStop(0, MG.rgba(C.azul, 0));
          g.addColorStop(1, MG.rgba(C.ciano, 0.9));
          ctx.strokeStyle = g;
          ctx.lineWidth = 5 * (1 - pp * 0.7);
          ctx.beginPath();
          ctx.moveTo(cauda[0], cauda[1]);
          ctx.lineTo(cab[0], cab[1]);
          ctx.stroke();
          MG.luz(ctx, cab[0], cab[1], 50 * (1 - pp * 0.6), C.ciano, 0.9);
        });
      }
    }
    MG.aditivo(ctx, () => MG.halo(ctx, VP[0], VP[1], 300, C.azul, 0.5));
    ctx.restore();
    // continuidade do rastro da faísca
    const k = anim(lt, 0, 0.5, E.outC);
    if (k < 1) {
      MG.aditivo(ctx, () => {
        const x = lerp(-200, 2100, k);
        ctx.fillStyle = MG.rgba(C.ciano, 0.7 * (1 - k));
        ctx.fillRect(x - 900, 534, 900, 12);
        MG.luz(ctx, x, 540, 220, C.ciano, 1 - k);
      });
    }
  }

  function cidade(ctx, t, T) {
    const HZ = 430;
    // céu
    const g = ctx.createLinearGradient(0, 0, 0, HZ);
    g.addColorStop(0, '#020615');
    g.addColorStop(1, '#0C2251');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, HZ);
    ctx.save();
    MG.camera(ctx, 1.05 + 0.04 * t, 960, 540, 0, 0, 0.012 * Math.sin(t));
    // horizonte brilhando
    MG.aditivo(ctx, () => {
      const gh = ctx.createLinearGradient(0, HZ - 120, 0, HZ + 20);
      gh.addColorStop(0, MG.rgba(C.azul, 0));
      gh.addColorStop(1, MG.rgba(C.azul, 0.35));
      ctx.fillStyle = gh;
      ctx.fillRect(-100, HZ - 120, W + 200, 140);
    });
    // prédios
    predios.forEach(p => {
      ctx.fillStyle = '#050B1D';
      ctx.fillRect(p.x, HZ - p.h, p.w, p.h);
      const passo = Math.floor(T * 6);
      ctx.fillStyle = MG.rgba(C.gelo, 0.55);
      for (let yy = HZ - p.h + 10; yy < HZ - 8; yy += 14) {
        for (let xx = p.x + 6; xx < p.x + p.w - 6; xx += 12) {
          const h = MG.hash(p.sem * 7919 + Math.floor(xx) * 31 + Math.floor(yy) + Math.floor(passo / 5) * 3);
          if (h > 0.82) ctx.fillRect(xx, yy, 5, 6);
        }
      }
    });
    // torres de transmissão + cabos
    torres.forEach((tr, i) => {
      ctx.strokeStyle = '#0A1430';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(tr.x - 22, HZ);
      ctx.lineTo(tr.x, HZ - tr.h);
      ctx.lineTo(tr.x + 22, HZ);
      ctx.moveTo(tr.x - 30, HZ - tr.h * 0.78);
      ctx.lineTo(tr.x + 30, HZ - tr.h * 0.78);
      ctx.stroke();
      if (i < torres.length - 1) {
        const nx = torres[i + 1];
        const pts = MG.curva(tr.x + 30, HZ - tr.h * 0.78, nx.x - 30, HZ - nx.h * 0.78, -0.08, 20);
        MG.aditivo(ctx, () => {
          ctx.strokeStyle = MG.rgba(C.ciano, 0.45);
          ctx.lineWidth = 1.5;
          MG.caminho(ctx, pts, 0, 1);
          const pp = (t * 0.9 + i * 0.3) % 1;
          const pt = MG.pontoEm(pts, pp);
          MG.luz(ctx, pt[0], pt[1], 26, C.ciano, 0.9);
        });
      }
    });
    // chão: avenidas em perspectiva (hyperlapse)
    ctx.fillStyle = '#030814';
    ctx.fillRect(-100, HZ, W + 200, H - HZ + 100);
    const VP = [960, HZ];
    const avenidas = [-1.6, -1.05, -0.62, -0.3, -0.1, 0.1, 0.3, 0.62, 1.05, 1.6];
    avenidas.forEach((a, i) => {
      const xb = 960 + a * 1500;
      ctx.strokeStyle = MG.rgba(C.azul, 0.25);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(VP[0], VP[1]);
      ctx.lineTo(xb, H + 60);
      ctx.stroke();
      // fluxos de luz (faróis)
      MG.aditivo(ctx, () => {
        for (let k = 0; k < 7; k++) {
          const s = ((MG.hash(i * 31 + k) + t * (0.55 + MG.hash(i + k * 7) * 0.4)) % 1);
          const ss = s * s;
          const x = lerp(VP[0], xb, ss), y = lerp(VP[1], H + 60, ss);
          const s0 = Math.max(0, s - 0.06), ss0 = s0 * s0;
          const x0 = lerp(VP[0], xb, ss0), y0 = lerp(VP[1], H + 60, ss0);
          ctx.strokeStyle = MG.rgba(k % 3 === 0 ? C.gelo : C.ciano, 0.8);
          ctx.lineWidth = 1 + ss * 4;
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x, y);
          ctx.stroke();
          MG.halo(ctx, x, y, 8 + ss * 30, C.ciano, 0.6);
        }
      });
    });
    // ruas transversais vindo em direção à câmera
    for (let k = 0; k < 14; k++) {
      const z = ((k - t * 2.2) % 14 + 14) % 14 + 0.6;
      const y = HZ + 520 / z;
      if (y > H + 10) continue;
      ctx.strokeStyle = MG.rgba(C.azul, 0.12 + 0.18 / z);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-100, y);
      ctx.lineTo(W + 100, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* ======================= C03 · Evolução tecnológica ======================= */
  const PT = [1040, 560];
  const C03 = { A: 0, B: 2.4, C: 4.8 };
  let esfera = null;

  function mao(ctx, x, y, cor, rim, ang = -0.5) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    const formas = () => {
      ctx.beginPath();
      MG.retArred(ctx, -15, -2, 30, 150, 15);
      MG.retArred(ctx, -26, 118, 112, 132, 38);
      MG.retArred(ctx, 16, 104, 26, 62, 13);
      MG.retArred(ctx, 40, 110, 26, 58, 13);
      MG.retArred(ctx, 63, 120, 24, 52, 12);
      MG.retArred(ctx, -32, 236, 126, 520, 20);
    };
    ctx.fillStyle = cor;
    formas();
    ctx.fill();
    ctx.save();
    ctx.translate(-20, 196);
    ctx.rotate(-0.75);
    MG.retArred(ctx, -15, -78, 30, 92, 15);
    ctx.fill();
    ctx.restore();
    // punho da camisa
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(-32, 236, 126, 18);
    // luz de contorno
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = MG.rgba(rim, 0.5);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-15, 140);
    ctx.lineTo(-15, 14);
    ctx.arc(0, 13, 15, Math.PI, Math.PI * 1.9);
    ctx.stroke();
    ctx.restore();
  }
  CX.mao = mao;

  CX.cenas.definir('C03', {
    preparar() {
      esfera = [];
      const n = 220;
      for (let i = 0; i < n; i++) {
        const y = 1 - (i / (n - 1)) * 2;
        const r = Math.sqrt(1 - y * y);
        const th = i * 2.399963;
        esfera.push([Math.cos(th) * r, y, Math.sin(th) * r]);
      }
    },
    sons() {
      CX.som(14.95, 'luzLiga', { vol: 0.5, zumbido: 0.4, tom: 0.8 });
      CX.som(16.4, 'whoosh', { dur: 0.35, vol: 0.25 });
      CX.som(17.0, 'toque', {});
      CX.som(18.8, 'whoosh', { dur: 0.35, vol: 0.25 });
      CX.som(19.3, 'brilho', { vol: 0.9 });
    },
    desenhar(ctx, lt, T) {
      let take = lt < C03.B ? 'A' : lt < C03.C ? 'B' : 'C';
      const tl = lt - C03[take];
      if (take === 'A') analogico(ctx, tl);
      else if (take === 'B') touch(ctx, tl);
      else holo(ctx, tl, lt);
      // mão (match cut: mesma posição nos três takes)
      const ap = take === 'A' ? 1 - anim(tl, 0, 0.7, E.outC) : 0;
      const ges = take === 'C' ? Math.sin(tl * 2.2) * 40 * anim(tl, 0.4, 1.2) : 0;
      const tap = take === 'B' ? -Math.max(0, Math.sin(clamp((tl - 0.45) / 0.3) * Math.PI)) * 10 : take === 'A' ? 0 : 0;
      const corMao = take === 'A' ? '#14110D' : take === 'B' ? '#081226' : '#060C1C';
      const rim = take === 'A' ? '#E3B985' : take === 'B' ? C.ciano : C.ciano;
      mao(ctx, PT[0] + ap * 160 + ges, PT[1] + ap * 220 + tap, corMao, rim, take === 'A' ? -0.5 + 0.12 * anim(tl, 0.75, 1.0) : -0.5);
      // rótulo de época (rolagem tipo slot)
      const rot = ['ANOS 80', 'ANOS 2000', 'HOJE'];
      const idx = take === 'A' ? 0 : take === 'B' ? 1 : 2;
      const k = anim(tl, 0, 0.45, E.outExpo);
      ctx.save();
      ctx.beginPath();
      ctx.rect(120, 90, 700, 100);
      ctx.clip();
      MG.texto(ctx, rot[idx], 140, 140 + (1 - k) * 90, { tam: 64, peso: 800, fam: 'display', alinh: 'left', esp: 4, cor: C.branco });
      if (idx > 0) MG.texto(ctx, rot[idx - 1], 140, 140 - k * 90, { tam: 64, peso: 800, fam: 'display', alinh: 'left', esp: 4, cor: C.branco });
      ctx.restore();
      ctx.fillStyle = MG.rgba(take === 'A' ? '#E3B985' : C.ciano, 0.9);
      ctx.fillRect(142, 186, 60 * k, 3);
      // flash curto em cada corte
      const fl = Math.max(MG.janela(lt, C03.B - 0.05, C03.B + 0.12, 0.04, 0.1), MG.janela(lt, C03.C - 0.05, C03.C + 0.12, 0.04, 0.1));
      if (fl > 0) {
        ctx.fillStyle = MG.rgba('#FFFFFF', 0.25 * fl);
        ctx.fillRect(0, 0, W, H);
      }
    }
  });

  function analogico(ctx, t) {
    const tung = '#E3B985';
    MG.fundo(ctx, '#0B0907', '#1C1813');
    ctx.save();
    MG.camera(ctx, 1.04 - 0.02 * t);
    // painel metálico
    const g = ctx.createLinearGradient(0, 160, 0, 940);
    g.addColorStop(0, '#2B2620');
    g.addColorStop(1, '#16130F');
    ctx.fillStyle = g;
    MG.retArred(ctx, 230, 170, 1460, 760, 18);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,230,190,0.08)';
    ctx.lineWidth = 2;
    ctx.stroke();
    [[260, 200], [1660, 200], [260, 900], [1660, 900]].forEach(([x, y]) => {
      ctx.fillStyle = '#3A342B';
      MG.circulo(ctx, x, y, 8);
      ctx.fill();
    });
    // mostradores analógicos
    [[440, 390, 0], [690, 390, 1], [940, 390, 2]].forEach(([x, y, i]) => {
      ctx.fillStyle = '#E9DFC8';
      MG.circulo(ctx, x, y, 95);
      ctx.fill();
      ctx.strokeStyle = '#3A342B';
      ctx.lineWidth = 8;
      ctx.stroke();
      ctx.strokeStyle = '#4A4033';
      ctx.lineWidth = 2;
      for (let k = 0; k <= 10; k++) {
        const a = Math.PI * (0.75 + k * 0.15);
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(a) * 70, y + Math.sin(a) * 70);
        ctx.lineTo(x + Math.cos(a) * 84, y + Math.sin(a) * 84);
        ctx.stroke();
      }
      const ag = Math.PI * (1.2 + 0.5 * (0.5 + 0.5 * Math.sin(t * (1.3 + i * 0.4) + i))) + MG.wiggle(t, 6, 0.04, i);
      ctx.strokeStyle = '#B23A2E';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(ag) * 72, y + Math.sin(ag) * 72);
      ctx.stroke();
      ctx.fillStyle = '#2A241C';
      MG.circulo(ctx, x, y, 8);
      ctx.fill();
    });
    // chaves de alavanca
    for (let i = 0; i < 6; i++) {
      const x = 380 + i * 105, y = 690;
      ctx.fillStyle = '#0F0D0A';
      MG.retArred(ctx, x - 22, y - 34, 44, 68, 8);
      ctx.fill();
      const up = (i + Math.floor(t * 1.5)) % 3 === 0;
      ctx.strokeStyle = '#B9AE98';
      ctx.lineWidth = 9;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + (up ? -30 : 30));
      ctx.stroke();
    }
    // chave rotativa (no ponto do toque)
    const gira = anim(t, 0.75, 0.95, E.outBack);
    ctx.fillStyle = '#0E0C09';
    MG.circulo(ctx, PT[0], PT[1], 96);
    ctx.fill();
    ctx.fillStyle = '#3B342A';
    MG.circulo(ctx, PT[0], PT[1], 70);
    ctx.fill();
    const a = -Math.PI / 2 - 0.9 + gira * 1.5;
    ctx.strokeStyle = tung;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(PT[0], PT[1]);
    ctx.lineTo(PT[0] + Math.cos(a) * 60, PT[1] + Math.sin(a) * 60);
    ctx.stroke();
    MG.texto(ctx, 'DESL', PT[0] - 120, PT[1] - 96, { tam: 18, fam: 'mono', cor: MG.rgba('#E9DFC8', 0.6) });
    MG.texto(ctx, 'LIG', PT[0] + 110, PT[1] - 96, { tam: 18, fam: 'mono', cor: MG.rgba('#E9DFC8', 0.6) });
    // lâmpada sinalizadora (acende com o giro)
    const lamp = anim(t, 0.95, 1.1);
    ctx.fillStyle = lamp > 0 ? '#3DDC97' : '#123322';
    MG.circulo(ctx, 1310, 420, 26);
    ctx.fill();
    if (lamp > 0) MG.aditivo(ctx, () => MG.luz(ctx, 1310, 420, 120 * lamp, '#3DDC97', 0.8 * lamp));
    MG.texto(ctx, 'SE-07 · COMANDO LOCAL', 1310, 500, { tam: 18, fam: 'mono', cor: MG.rgba('#E9DFC8', 0.5), esp: 1 });
    // luz de tungstênio
    MG.aditivo(ctx, () => MG.halo(ctx, 1200, 260, 900, '#C98A4B', 0.18));
    ctx.restore();
  }

  function touch(ctx, t) {
    MG.fundo(ctx, '#030913', '#0A1A36');
    ctx.save();
    MG.camera(ctx, 1.02 + 0.02 * t);
    // painel de vidro
    const g = ctx.createLinearGradient(260, 170, 1660, 930);
    g.addColorStop(0, 'rgba(60,110,200,0.22)');
    g.addColorStop(1, 'rgba(20,40,90,0.12)');
    ctx.fillStyle = g;
    MG.retArred(ctx, 250, 170, 1420, 760, 28);
    ctx.fill();
    ctx.strokeStyle = MG.rgba(C.ciano, 0.35);
    ctx.lineWidth = 2;
    ctx.stroke();
    // barra superior
    ctx.fillStyle = MG.rgba(C.ciano, 0.12);
    MG.retArred(ctx, 290, 205, 1340, 56, 14);
    ctx.fill();
    MG.texto(ctx, 'CENTRO DE OPERAÇÃO · VISÃO GERAL', 320, 234, { tam: 20, fam: 'mono', alinh: 'left', cor: MG.rgba(C.gelo, 0.75), esp: 1.5 });
    // blocos
    const tap = 0.6;
    for (let i = 0; i < 6; i++) {
      const cx = i % 3, cy = Math.floor(i / 3);
      const x = 300 + cx * 450, y = 300 + cy * 300, w = 420, h = 270;
      const ativo = x < PT[0] && PT[0] < x + w && y < PT[1] && PT[1] < y + h;
      const kpop = anim(t, 0.05 + i * 0.05, 0.4 + i * 0.05, E.outBack);
      const sel = ativo ? MG.mola(t - tap, 2.2, 7) : 0;
      ctx.save();
      ctx.translate(x + w / 2, y + h / 2);
      ctx.scale(kpop * (1 + 0.04 * sel), kpop * (1 + 0.04 * sel));
      ctx.fillStyle = ativo && t > tap ? MG.rgba(C.azul, 0.32) : MG.rgba('#0E1E40', 0.85);
      MG.retArred(ctx, -w / 2, -h / 2, w, h, 18);
      ctx.fill();
      ctx.strokeStyle = MG.rgba(C.ciano, ativo && t > tap ? 0.9 : 0.25);
      ctx.lineWidth = 2;
      ctx.stroke();
      // mini gráfico
      ctx.strokeStyle = MG.rgba(C.ciano, 0.85);
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let k = 0; k <= 24; k++) {
        const xx = -w / 2 + 30 + k * ((w - 60) / 24);
        const yy = 40 + Math.sin(k * 0.6 + i + t * 2) * 26 + MG.ruido(k * 0.5, i) * 18;
        k ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy);
      }
      ctx.stroke();
      ctx.fillStyle = MG.rgba(C.gelo, 0.5);
      ctx.fillRect(-w / 2 + 30, -h / 2 + 32, 120, 10);
      ctx.fillStyle = MG.rgba(C.gelo, 0.25);
      ctx.fillRect(-w / 2 + 30, -h / 2 + 54, 80, 8);
      ctx.restore();
    }
    // ondas do toque
    for (let k = 0; k < 3; k++) {
      const p = prog(t, tap + k * 0.12, tap + 0.9 + k * 0.12);
      if (p <= 0 || p >= 1) continue;
      ctx.strokeStyle = MG.rgba(C.ciano, (1 - p) * 0.8);
      ctx.lineWidth = 2;
      MG.circulo(ctx, PT[0], PT[1], 10 + 120 * E.outC(p));
      ctx.stroke();
    }
    ctx.restore();
  }

  function holo(ctx, t, lt) {
    MG.fundo(ctx, '#02040C', '#071433');
    const cx = 790, cy = 500, R = 270;
    const giro = t * 0.45 + Math.max(0, t - 0.6) * 0.5;
    ctx.save();
    MG.camera(ctx, 1 + 0.03 * t);
    MG.aditivo(ctx, () => MG.halo(ctx, cx, cy, 700, C.azul, 0.35));
    // anéis holográficos
    for (let k = 0; k < 3; k++) {
      ctx.strokeStyle = MG.rgba(C.ciano, 0.25);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(cx, cy, R + 50 + k * 40, (R + 50 + k * 40) * 0.24, Math.sin(t * 0.3 + k) * 0.2 + k * 0.4, 0, Math.PI * 2);
      ctx.stroke();
    }
    // pontos da esfera
    const proj = esfera.map(([x, y, z]) => {
      const ca = Math.cos(giro), sa = Math.sin(giro);
      const xr = x * ca + z * sa, zr = -x * sa + z * ca;
      const tilt = 0.35;
      const yr = y * Math.cos(tilt) - zr * Math.sin(tilt);
      const zz = y * Math.sin(tilt) + zr * Math.cos(tilt);
      const s = 1 / (1.8 - zz * 0.5);
      return [cx + xr * R * s * 1.4, cy + yr * R * s * 1.4, zz];
    });
    const surgir = anim(t, 0, 0.6, E.outC);
    MG.aditivo(ctx, () => {
      ctx.lineWidth = 1;
      for (let i = 0; i < proj.length; i++) {
        const a = proj[i];
        const j = (i * 7 + 13) % proj.length;
        const b = proj[j];
        const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        if (d < 120 && a[2] > -0.2) {
          ctx.strokeStyle = MG.rgba(C.azul, 0.35 * surgir);
          ctx.beginPath();
          ctx.moveTo(a[0], a[1]);
          ctx.lineTo(b[0], b[1]);
          ctx.stroke();
        }
      }
      proj.forEach(([x, y, z], i) => {
        const a = (0.25 + 0.75 * (z + 1) / 2) * surgir;
        MG.halo(ctx, x, y, 7 + z * 3, i % 17 === 0 ? C.gelo : C.ciano, a);
      });
    });
    // linhas de varredura
    ctx.fillStyle = MG.rgba(C.ciano, 0.04);
    for (let y = 0; y < H; y += 6) ctx.fillRect(0, y + ((lt * 40) % 6), W, 1);
    ctx.restore();
  }

  /* ======================= C04 · Novas formas de trabalho ======================= */
  let c04 = null;
  CX.cenas.definir('C04', {
    preparar() {
      const v = [22.0];
      [1, 2, 3].forEach(k => v.push(CX.voz.frase('c04', k, 22 + k * 2.4) - 0.2));
      for (let i = 1; i < 4; i++) v[i] = clamp(v[i], v[i - 1] + 1.6, 30.2);
      c04 = { v, solar: v[3] + (32 - v[3]) * 0.52 };
      CX.topoLegenda(22.0, 31.4);
    },
    sons() {
      const v = c04.v;
      for (let i = 0; i < 6; i++) CX.som(v[0] + 0.15 + i * 0.09, 'pop', { nota: ['C5', 'E5', 'G5', 'A5', 'C6', 'E6'][i], vol: 0.45 });
      CX.som(v[1], 'whoosh', { dur: 0.35, vol: 0.3 });
      [0.5, 1.0, 1.5].forEach((d, i) => CX.som(v[1] + d, 'pop', { nota: ['E5', 'G5', 'B5'][i], vol: 0.6 }));
      CX.som(v[2], 'whoosh', { dur: 0.35, vol: 0.3 });
      CX.som(v[2] + 0.4, 'notificacao', { vol: 0.7 });
      CX.som(v[2] + 1.15, 'pop', { nota: 'A5', vol: 0.5 });
      CX.som(v[3], 'whoosh', { dur: 0.35, vol: 0.3 });
      CX.som(31.35, 'brilho', { vol: 0.9, notas: ['E6', 'B6', 'F#7'] });
    },
    desenhar(ctx, lt, T) {
      const v = c04.v;
      const titulos = ['NOVAS TECNOLOGIAS', 'NOVAS FORMAS DE TRABALHAR', 'NOVAS EXPECTATIVAS', 'UM SETOR INTEIRO SE REINVENTANDO'];
      let i = T < v[1] ? 0 : T < v[2] ? 1 : T < v[3] ? 2 : 3;
      const tl = T - v[i];
      if (i === 0) reuniao(ctx, tl, T);
      else if (i === 1) kanban(ctx, tl, T);
      else if (i === 2) celular(ctx, tl, T);
      else if (T < c04.solar) eolica(ctx, tl, T);
      else solar(ctx, T - c04.solar, T);
      // tipografia cinética
      const tituloT = CX.voz.frase('c04', i, v[i] + 0.3);
      const sai = i < 3 ? v[i + 1] - 0.3 : 31.3;
      ctx.save();
      ctx.fillStyle = 'rgba(2,6,18,0.55)';
      const kb = anim(T, v[i], v[i] + 0.3);
      ctx.globalAlpha = kb;
      const gb = ctx.createLinearGradient(0, 820, 0, H);
      gb.addColorStop(0, 'rgba(2,6,18,0)');
      gb.addColorStop(1, 'rgba(2,6,18,0.85)');
      ctx.fillStyle = gb;
      ctx.fillRect(0, 780, W, 300);
      ctx.restore();
      MG.titulo(ctx, titulos[i], 140, 935, T, Math.max(v[i] + 0.05, tituloT - 0.15), { tam: i === 3 ? 50 : 58, sai, alinh: 'left', corLinha: C.ciano });
      MG.texto(ctx, `0${i + 1} / 04`, 144, 860, { tam: 18, fam: 'mono', alinh: 'left', cor: MG.rgba(C.gelo, 0.6 * anim(T, v[i], v[i] + 0.4)), esp: 2 });
      // flare final
      const fl = MG.janela(T, 31.2, 32.05, 0.45, 0.35);
      if (fl > 0) {
        MG.aditivo(ctx, () => {
          MG.halo(ctx, 1240, 520, 1400 * fl, C.dourado, 0.7 * fl);
          ctx.fillStyle = MG.rgba(C.ciano, 0.5 * fl);
          ctx.fillRect(0, 517, W, 6);
          ctx.fillStyle = MG.rgba('#FFFFFF', 0.35 * fl);
          ctx.fillRect(0, 0, W, H);
        });
      }
    }
  });

  function reuniao(ctx, t, T) {
    MG.fundo(ctx, '#040A1A', '#0D1E44');
    ctx.save();
    MG.camera(ctx, 1 + 0.035 * t, 960, 480);
    // parede de vídeo
    ctx.fillStyle = '#060E22';
    MG.retArred(ctx, 330, 130, 1260, 660, 22);
    ctx.fill();
    ctx.strokeStyle = MG.rgba(C.ciano, 0.25);
    ctx.lineWidth = 2;
    ctx.stroke();
    for (let i = 0; i < 6; i++) {
      const col = i % 3, lin = Math.floor(i / 3);
      const x = 360 + col * 405, y = 160 + lin * 315, w = 390, h = 300;
      const k = anim(t, 0.12 + i * 0.09, 0.62 + i * 0.09, E.outBack);
      if (k <= 0) continue;
      ctx.save();
      ctx.translate(x + w / 2, y + h / 2);
      ctx.scale(k, k);
      ctx.fillStyle = i === 4 ? '#14284F' : '#0D1C3C';
      MG.retArred(ctx, -w / 2, -h / 2, w, h, 16);
      ctx.fill();
      ctx.save();
      MG.retArred(ctx, -w / 2, -h / 2, w, h, 16);
      ctx.clip();
      MG.personagem(ctx, 0, 70, 0.9, X(i, { t: T, fase: i, acenar: i === 1 || i === 3, pose: i === 4 ? 'gesto' : 'neutra' }));
      ctx.restore();
      const fala = i === 4;
      ctx.strokeStyle = fala ? MG.rgba(C.ambar, 0.6 + 0.4 * Math.sin(T * 8)) : MG.rgba(C.ciano, 0.3);
      ctx.lineWidth = fala ? 4 : 1.5;
      MG.retArred(ctx, -w / 2, -h / 2, w, h, 16);
      ctx.stroke();
      // ícone de microfone
      ctx.fillStyle = MG.rgba(C.gelo, 0.7);
      MG.retArred(ctx, -w / 2 + 16, h / 2 - 34, 12, 18, 6);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    // cabeças em primeiro plano (presencial)
    [[1380, 1040, 1.6, 2], [1660, 1080, 1.8, 4]].forEach(([x, y, s, i]) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(s, s);
      ctx.fillStyle = '#02050E';
      MG.circulo(ctx, 0, -110, 42);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, 0, 90, 70, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function kanban(ctx, t, T) {
    MG.fundo(ctx, '#050C1E', '#10234A');
    ctx.save();
    MG.camera(ctx, 1.02 + 0.03 * t, 960, 460, -20 * t, 0);
    ctx.fillStyle = 'rgba(160,200,255,0.06)';
    MG.retArred(ctx, 300, 140, 1320, 640, 20);
    ctx.fill();
    ctx.strokeStyle = MG.rgba(C.gelo, 0.18);
    ctx.lineWidth = 2;
    ctx.stroke();
    const cols = ['A FAZER', 'FAZENDO', 'FEITO'];
    cols.forEach((c, i) => {
      MG.texto(ctx, c, 520 + i * 440, 190, { tam: 22, fam: 'mono', cor: MG.rgba(C.gelo, 0.75), esp: 3 });
      if (i) {
        ctx.strokeStyle = MG.rgba(C.gelo, 0.12);
        ctx.beginPath();
        ctx.moveTo(300 + i * 440, 160);
        ctx.lineTo(300 + i * 440, 760);
        ctx.stroke();
      }
    });
    const cores = ['#7FD1C7', '#8FB3FF', '#F6E7A8', '#F2B8C6', '#B9A5F0'];
    const notas = [];
    for (let i = 0; i < 10; i++) notas.push({ col: i % 3, lin: Math.floor(i / 3), cor: cores[i % 5], i });
    const movem = [[1, 0.35, 1], [4, 0.85, 2], [6, 1.35, 1], [0, 1.85, 2]];
    notas.forEach(n => {
      let col = n.col, x0 = 0, y0 = 0;
      let x = 360 + n.col * 440 + (n.lin % 2) * 120, y = 250 + n.lin * 130;
      const mv = movem.find(m => m[0] === n.i);
      if (mv) {
        const k = MG.mola(t - mv[1], 1.6, 7);
        const destX = 360 + mv[2] * 440 + 160, destY = 250 + n.lin * 130 + 40;
        x0 = x;
        y0 = y;
        x = lerp(x0, destX, clamp(k, 0, 1.2));
        y = lerp(y0, destY, clamp(k, 0, 1.2)) - Math.sin(clamp(k) * Math.PI) * 90;
      }
      const kin = anim(t, n.i * 0.04, 0.3 + n.i * 0.04, E.outBack);
      const rot = MG.wiggle(T, 0.4, 0.04, n.i) + (n.i % 2 ? 0.03 : -0.03);
      ctx.save();
      ctx.translate(x + 85, y + 50);
      ctx.rotate(rot);
      ctx.scale(kin, kin);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      MG.retArred(ctx, -82, -44, 170, 104, 6);
      ctx.fill();
      ctx.fillStyle = n.cor;
      MG.retArred(ctx, -85, -50, 170, 100, 6);
      ctx.fill();
      ctx.fillStyle = 'rgba(20,30,50,0.35)';
      ctx.fillRect(-66, -26, 110, 8);
      ctx.fillRect(-66, -8, 130, 8);
      ctx.fillRect(-66, 10, 70, 8);
      ctx.restore();
    });
    ctx.restore();
  }

  function celular(ctx, t, T) {
    MG.fundo(ctx, '#040A1A', '#0E2049');
    ctx.save();
    MG.camera(ctx, 1 + 0.04 * t, 1100, 480);
    // cliente
    MG.personagem(ctx, 640, 760, 1.7, X(2, { t: T, pose: 'gesto', fase: 1 }));
    // celular
    const k = anim(t, 0, 0.5, E.outBack);
    ctx.save();
    ctx.translate(1180, 470 + (1 - k) * 200);
    ctx.rotate(-0.08 + MG.wiggle(T, 0.5, 0.02, 3));
    ctx.fillStyle = '#0A0F1C';
    MG.retArred(ctx, -180, -340, 360, 680, 48);
    ctx.fill();
    ctx.strokeStyle = MG.rgba(C.gelo, 0.3);
    ctx.lineWidth = 3;
    ctx.stroke();
    const tela = ctx.createLinearGradient(0, -320, 0, 320);
    tela.addColorStop(0, '#0F2550');
    tela.addColorStop(1, '#08142E');
    ctx.fillStyle = tela;
    MG.retArred(ctx, -164, -322, 328, 644, 36);
    ctx.fill();
    MG.texto(ctx, 'Minha Energia', -130, -270, { tam: 26, peso: 700, alinh: 'left', cor: C.branco });
    MG.texto(ctx, 'CONSUMO DA SEMANA', -130, -230, { tam: 14, fam: 'mono', alinh: 'left', cor: MG.rgba(C.gelo, 0.6), esp: 1.5 });
    for (let i = 0; i < 7; i++) {
      const h = (60 + MG.hash(i + 3) * 110) * anim(t, 0.15 + i * 0.05, 0.6 + i * 0.05, E.outBack);
      ctx.fillStyle = i === 6 ? C.ciano : MG.rgba(C.azul, 0.8);
      MG.retArred(ctx, -130 + i * 38, -40 - h, 24, h, 6);
      ctx.fill();
    }
    ctx.restore();
    // cartões flutuantes (notificações)
    const cards = [
      { txt: 'Sua fatura chegou', sub: 'Pague pelo app em 1 toque', y: 250, t0: 0.4 },
      { txt: 'Como foi o atendimento?', sub: '', y: 420, t0: 1.1, estrelas: true },
      { txt: 'Religação solicitada', sub: 'Acompanhe em tempo real', y: 590, t0: 1.6 }
    ];
    cards.forEach((c, i) => {
      const kk = anim(t, c.t0, c.t0 + 0.5, E.outBack);
      if (kk <= 0) return;
      ctx.save();
      ctx.translate(1520 + (1 - kk) * 120, c.y + MG.wiggle(T, 0.6, 6, i));
      ctx.globalAlpha = Math.min(1, kk);
      ctx.fillStyle = 'rgba(14,30,66,0.92)';
      MG.retArred(ctx, -190, -56, 380, 112, 20);
      ctx.fill();
      ctx.strokeStyle = MG.rgba(C.ciano, 0.4);
      ctx.lineWidth = 1.5;
      ctx.stroke();
      MG.texto(ctx, c.txt, -160, c.sub || c.estrelas ? -16 : 0, { tam: 22, peso: 700, alinh: 'left' });
      if (c.sub) MG.texto(ctx, c.sub, -160, 18, { tam: 17, peso: 500, alinh: 'left', cor: MG.rgba(C.gelo, 0.7) });
      if (c.estrelas) {
        for (let s = 0; s < 5; s++) {
          const ks = anim(t, c.t0 + 0.3 + s * 0.08, c.t0 + 0.5 + s * 0.08, E.outBack);
          estrela(ctx, -146 + s * 34, 22, 12 * (0.6 + 0.4 * ks), ks > 0.5 ? C.ciano : MG.rgba(C.gelo, 0.3));
        }
      }
      ctx.restore();
    });
    ctx.restore();
  }

  function estrela(ctx, x, y, r, cor) {
    ctx.fillStyle = cor;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 ? r * 0.45 : r;
      ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill();
  }

  function eolica(ctx, t, T) {
    const HZ = 700;
    const g = ctx.createLinearGradient(0, 0, 0, HZ);
    g.addColorStop(0, '#061433');
    g.addColorStop(0.6, '#1D3E78');
    g.addColorStop(1, '#C99A5B');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    MG.camera(ctx, 1.02 + 0.03 * t, 960, 600, -30 * t, 0);
    MG.aditivo(ctx, () => {
      MG.halo(ctx, 1240, HZ, 700, C.dourado, 0.55);
      MG.luz(ctx, 1240, HZ - 10, 120, C.dourado, 0.8);
    });
    // colinas
    [['#0B1A36', 0, 1], ['#071226', 160, 0.7]].forEach(([cor, dy, f]) => {
      ctx.fillStyle = cor;
      ctx.beginPath();
      ctx.moveTo(-100, H + 100);
      for (let x = -100; x <= W + 200; x += 40) ctx.lineTo(x, HZ + dy - 40 * f * Math.sin(x * 0.004 + dy) - 30 * Math.sin(x * 0.011));
      ctx.lineTo(W + 200, H + 100);
      ctx.closePath();
      ctx.fill();
    });
    // turbinas
    const turb = [[360, 0.75], [620, 1.05], [940, 0.6], [1180, 1.25], [1500, 0.85], [1760, 0.65]];
    turb.forEach(([x, s], i) => {
      const base = HZ + 40 - 40 * Math.sin(x * 0.004) + 40;
      const top = base - 420 * s;
      ctx.strokeStyle = '#0E1C38';
      ctx.lineWidth = 9 * s;
      ctx.beginPath();
      ctx.moveTo(x, base);
      ctx.lineTo(x, top);
      ctx.stroke();
      ctx.fillStyle = '#0E1C38';
      MG.retArred(ctx, x - 14 * s, top - 10 * s, 34 * s, 20 * s, 8 * s);
      ctx.fill();
      const ang = T * (1.4 + i * 0.15) + i;
      for (let b = 0; b < 3; b++) {
        const a = ang + (b * Math.PI * 2) / 3;
        ctx.save();
        ctx.translate(x, top);
        ctx.rotate(a);
        ctx.beginPath();
        ctx.moveTo(0, -6 * s);
        ctx.quadraticCurveTo(110 * s, -10 * s, 200 * s, 0);
        ctx.quadraticCurveTo(110 * s, 6 * s, 0, 6 * s);
        ctx.fill();
        ctx.restore();
      }
      // luz de balizamento
      if (Math.sin(T * 3 + i) > 0.6) MG.aditivo(ctx, () => MG.luz(ctx, x + 4 * s, top - 14 * s, 18, C.vermelho, 0.8));
    });
    ctx.restore();
  }

  function solar(ctx, t, T) {
    ctx.fillStyle = '#060C18';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    MG.camera(ctx, 1.2 - 0.08 * t, 960, 540, 0, 0, -0.35 + t * 0.08);
    const sweep = (t * 0.9) % 1.6 - 0.3;
    for (let r = -9; r <= 9; r++) {
      for (let c = -12; c <= 12; c++) {
        const x = 960 + c * 118 + (r % 2) * 0, y = 540 + r * 92;
        const g = ctx.createLinearGradient(x - 52, y - 36, x + 52, y + 36);
        g.addColorStop(0, '#1E4A9A');
        g.addColorStop(1, '#0B1F4A');
        ctx.fillStyle = g;
        ctx.fillRect(x - 54, y - 38, 108, 76);
        ctx.strokeStyle = 'rgba(160,200,255,0.18)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let k = 1; k < 4; k++) {
          ctx.moveTo(x - 54 + k * 27, y - 38);
          ctx.lineTo(x - 54 + k * 27, y + 38);
        }
        ctx.moveTo(x - 54, y);
        ctx.lineTo(x + 54, y);
        ctx.stroke();
        const d = (c + r * 0.6) / 24 + 0.5 - sweep;
        if (Math.abs(d) < 0.12) {
          ctx.fillStyle = MG.rgba(C.gelo, 0.35 * (1 - Math.abs(d) / 0.12));
          ctx.fillRect(x - 54, y - 38, 108, 76);
        }
      }
    }
    ctx.restore();
  }

  /* ======================= C05 · A mensagem central ======================= */
  let c05 = null;
  CX.cenas.definir('C05', {
    preparar() {
      const rede = MG.gerarRede(51, 70, 330, 150, 1590, 600, 3, 70);
      const l1 = ['As', 'organizações', 'que', 'prosperam', 'não', 'são', 'as', 'que', 'mudam', 'primeiro.'];
      const l2 = ['São', 'as', 'que', 'levam', 'suas', 'pessoas', 'junto.'];
      const t1 = CX.sincronizar('c05', ['E', 'nesse', 'cenario', ...l1.slice(0, 6), 'necessariamente', ...l1.slice(6)], 33.2);
      const tl1 = [...t1.slice(3, 9), ...t1.slice(10)];
      const ini2 = CX.voz.frase('c05', 1, 40.4);
      const tl2 = CX.sincronizar('c05', ['Sao', 'aquelas', 'que', 'conseguem', 'levar', 'suas', 'pessoas', 'junto'], ini2, 0.28, ini2);
      const t2 = [tl2[0], tl2[1], tl2[2], tl2[4], tl2[5], tl2[6], tl2[7]];
      c05 = { rede, l1, l2, tl1, t2, ini2 };
      CX.T.c05respiro = ini2 - 0.6;
    },
    sons() {
      CX.som(c05.tl1[0] - 0.05, 'luzLiga', { vol: 0.35, zumbido: 0.3, tom: 1.1 });
      CX.som(c05.t2[0] - 0.05, 'luzLiga', { vol: 0.45, zumbido: 0.4, tom: 1.2 });
      CX.som(45.25, 'congela', {});
      CX.som(45.35, 'zip', { dur: 0.35, vol: 1 });
    },
    desenhar(ctx, lt, T, env) {
      const congela = Math.min(T, 45.25);
      if (T < 45.65) {
        corpoC05(ctx, congela - 32, congela);
      } else {
        // split: metades se afastam
        const d = anim(T, 45.65, 46.0, E.inC) * 1100;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, W, H);
        [[-1, 0, 960], [1, 960, 960]].forEach(([s, x, w]) => {
          ctx.save();
          ctx.translate(s * d, 0);
          ctx.beginPath();
          ctx.rect(x, 0, w, H);
          ctx.clip();
          corpoC05(ctx, 45.25 - 32, 45.25);
          ctx.globalCompositeOperation = 'saturation';
          ctx.fillStyle = 'rgb(128,128,128)';
          ctx.fillRect(0, 0, W, H);
          ctx.globalCompositeOperation = 'source-over';
          ctx.restore();
        });
      }
      // dessaturação do congelamento
      const ds = anim(T, 45.25, 45.5);
      if (ds > 0 && T < 45.65) {
        ctx.save();
        ctx.globalAlpha = ds;
        ctx.globalCompositeOperation = 'saturation';
        ctx.fillStyle = 'rgb(128,128,128)';
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }
      // linha de luz que divide
      const kl = anim(T, 45.35, 45.65, E.ioExpo);
      if (kl > 0) {
        MG.aditivo(ctx, () => {
          ctx.fillStyle = MG.rgba(C.gelo, 0.95);
          ctx.fillRect(958, 0, 4, H * kl);
          MG.luz(ctx, 960, H * kl, 90, C.ciano, 1);
          MG.halo(ctx, 960, 540, 500, C.ciano, 0.15 * kl);
        });
      }
    }
  });

  function corpoC05(ctx, lt, T) {
    MG.fundo(ctx, '#02050F', '#081430');
    const esc = lerp(1.32, 1.0, E.ioS(prog(lt, 0, 9.5)));
    ctx.save();
    MG.camera(ctx, esc, 960, 430);
    // parede de vídeo
    ctx.fillStyle = '#040A1C';
    MG.retArred(ctx, 280, 110, 1360, 540, 14);
    ctx.fill();
    // telas (moldura em grade 4x2)
    ctx.strokeStyle = '#0B1736';
    ctx.lineWidth = 6;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(280 + i * 340, 110);
      ctx.lineTo(280 + i * 340, 650);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(280, 380);
    ctx.lineTo(1640, 380);
    ctx.stroke();
    // rede no mapa
    const { nos, arestas } = c05.rede;
    const texto = anim(T, c05.tl1[0] - 0.4, c05.tl1[0] + 0.4);
    const dim = 1 - 0.55 * texto;
    MG.aditivo(ctx, () => {
      arestas.forEach(([i, j], k) => {
        const a = nos[i], b = nos[j];
        ctx.strokeStyle = MG.rgba(C.azul, 0.4 * dim);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        if (k % 4 === 0) {
          const p = (T * 0.35 + a.sorte) % 1;
          MG.halo(ctx, lerp(a.x, b.x, p), lerp(a.y, b.y, p), 14, C.ciano, 0.8 * dim);
        }
      });
      nos.forEach((n, i) => {
        const pisca = 0.6 + 0.4 * Math.sin(T * 2 + n.fase);
        MG.luz(ctx, n.x, n.y, 16 * n.tam, C.ciano, pisca * dim);
      });
    });
    // leituras do centro de operação
    [['CARGA 87%', 310, 140], ['FREQ 60,00 Hz', 1610, 140], ['SE-03 · 138 kV', 310, 625], ['STATUS · NORMAL', 1610, 625]].forEach(([txt, x, y], i) => {
      MG.texto(ctx, txt, x, y, { tam: 16, fam: 'mono', alinh: i % 2 ? 'right' : 'left', cor: MG.rgba(C.ciano, 0.55 * dim), esp: 1.5 });
    });
    // chão refletindo a parede de vídeo
    const gc = ctx.createLinearGradient(0, 650, 0, 1100);
    gc.addColorStop(0, '#0B1A3C');
    gc.addColorStop(0.35, '#061029');
    gc.addColorStop(1, '#01030A');
    ctx.fillStyle = gc;
    ctx.fillRect(0, 650, W, 500);
    MG.aditivo(ctx, () => MG.halo(ctx, 960, 700, 1000, C.azul, 0.3 * dim));
    // equipe em conversa (silhuetas recortadas contra a luz, com contorno âmbar)
    [[590, 1.04, 0, 1045], [770, 0.96, 1, 1030], [965, 1.08, 2, 1060], [1150, 0.95, 3, 1035], [1330, 1.02, 4, 1050]].forEach(([x, s, i, y]) => {
      MG.silhueta(ctx, x, y, 350 * s, { cor: '#02040B', luz: C.ambar, luzA: 0.7, t: T, fase: i });
    });
    ctx.restore();
    // texto (palavra a palavra, sincronizado)
    if (texto > 0) {
      const g = ctx.createLinearGradient(0, 230, 0, 520);
      g.addColorStop(0, 'rgba(2,5,15,0)');
      g.addColorStop(0.5, `rgba(2,5,15,${0.6 * texto})`);
      g.addColorStop(1, 'rgba(2,5,15,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 230, W, 290);
      const p1 = c05.l1.map((w, i) => ({ txt: w, t: c05.tl1[i] }));
      MG.linhaPalavras(ctx, p1, 960, 370, T, { tam: 50, peso: 500 });
      const p2 = c05.l2.map((w, i) => ({ txt: w, t: c05.t2[i], cor: i >= 5 ? C.ambar : C.branco, brilho: i >= 5 }));
      MG.linhaPalavras(ctx, p2, 960, 455, T, { tam: 56, peso: 800 });
    }
  }

  /* ======================= C06 · Dois caminhos ======================= */
  CX.cenas.definir('C06', {
    sons() {
      [47.0, 48.0, 49.0, 50.0].forEach((t, i) => CX.som(t, 'tique', { taque: i % 2 === 1, vol: 0.9 }));
      CX.som(46.85, 'pop', { nota: 'A4', vol: 0.8 });
      CX.som(47.85, 'whoosh', { dur: 0.45, vol: 0.4 });
      CX.som(48.35, 'ping', { nota: 'E5', vol: 0.5 });
      CX.som(48.7, 'ping', { nota: 'A5', vol: 0.5 });
      CX.som(50.3, 'zip', { dur: 0.6, vol: 0.9 });
    },
    desenhar(ctx, lt, T, env) {
      ctx.fillStyle = '#01030A';
      ctx.fillRect(0, 0, W, H);
      const lx = lerp(960, W + 40, anim(T, 50.3, 51.0, E.inOutExpo || E.ioExpo));
      // revela o Cenário 1 à esquerda da linha
      if (T > 50.3) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, lx, H);
        ctx.clip();
        CX.cenas.desenhar('C07', ctx, 0, env);
        ctx.restore();
      }
      // linha de luz
      const pulso = 0.85 + 0.15 * Math.sin(T * 6);
      MG.aditivo(ctx, () => {
        ctx.fillStyle = MG.rgba(C.gelo, 0.9);
        ctx.fillRect(lx - 1.5, 0, 3, H);
        MG.halo(ctx, lx, 540, 380, C.ciano, 0.18 * pulso);
      });
      if (T > 50.3) return;
      // projeto: um ícone que se divide em dois
      const kin = anim(T, 46.8, 47.2, E.outBack);
      const sep = MG.mola(T - 47.8, 1.4, 6);
      const icones = sep > 0 ? [[-1, sep], [1, sep]] : [[0, 0]];
      icones.forEach(([s, k]) => {
        const x = 960 + s * 400 * k;
        ctx.save();
        ctx.translate(x, 470);
        ctx.scale(kin, kin);
        ctx.fillStyle = '#0D1A38';
        MG.retArred(ctx, -64, -80, 128, 160, 14);
        ctx.fill();
        ctx.strokeStyle = MG.rgba(s < 0 ? C.aco : C.gelo, 0.8);
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = MG.rgba(s < 0 ? C.aco : C.gelo, 0.6);
        for (let i = 0; i < 4; i++) ctx.fillRect(-40, -46 + i * 26, i === 3 ? 44 : 80, 8);
        ctx.restore();
      });
      MG.textoFilamento(ctx, 'CAMINHO 1', 560, 640, prog(T, 48.3, 48.9), { tam: 46, cor: C.aco });
      MG.textoFilamento(ctx, 'CAMINHO 2', 1360, 640, prog(T, 48.65, 49.25), { tam: 46, cor: C.gelo });
      const tf = CX.voz.frase('c06', 0, 47.3);
      const kf = anim(T, tf, tf + 0.6, E.outExpo);
      MG.texto(ctx, 'O mesmo projeto.', 960, 860 + (1 - kf) * 20, { tam: 40, peso: 500, alpha: kf, cor: C.branco });
    }
  });

  /* ======================= C07 · Cenário 1: sem gestão da mudança ======================= */
  let c07 = null;
  const REDE_MAPA = { seed: 77 };
  CX.cenas.definir('C07', {
    preparar() {
      const v1 = 51.0;
      const v2 = clamp(CX.voz.frase('c07', 1, 54.6) - 0.35, 53.8, 56);
      const v3 = clamp(CX.voz.frase('c07', 3, 58.4) - 0.35, v2 + 3, 61);
      const v4 = clamp(CX.voz.frase('c07', 4, 61.3) - 0.35, v3 + 2.4, 64);
      const v5 = clamp(CX.voz.fimFrase('c07', 5, 65.6) + 0.15, v4 + 2.8, 66.6);
      const rede = MG.gerarRede(REDE_MAPA.seed, 46, 300, 150, 1620, 640, 3, 120);
      REDE_MAPA.rede = rede;
      // nó central (sobrevive e vira o âmbar)
      let ultimo = 0, best = 1e9;
      rede.nos.forEach((n, i) => { const d = Math.hypot(n.x - 960, n.y - 400); if (d < best) { best = d; ultimo = i; } });
      REDE_MAPA.ultimo = ultimo;
      const r = MG.rng(5);
      const ordem = rede.nos.map((n, i) => i).filter(i => i !== ultimo).sort(() => r() - 0.5);
      const desliga = {};
      const nApaga = Math.floor(ordem.length * 0.86);
      ordem.forEach((i, k) => { desliga[i] = k < nApaga ? v5 + 0.35 + (k / nApaga) * 3.0 : 999; });
      c07 = { v: [v1, v2, v3, v4, v5], desliga, ordem, nApaga, entregue: CX.voz.frase('c07', 5, 64.5) };
      CX.T.c07ultimo = ultimo;
      CX.topoLegenda(v5, 69.6);
    },
    sons() {
      const v = c07.v;
      CX.som(51.02, 'luzLiga', { fluor: true, vol: 0.35, zumbido: 0.8, dur: 1.2 });
      CX.som(51.45, 'notificacao', { vol: 0.8 });
      CX.som(v[0] + 2.0, 'pop', { nota: 'D4', vol: 0.5 });
      for (let t = 51.5; t < v[4]; t += 1.0) CX.som(t, 'tique', { taque: Math.round(t) % 2 === 0, vol: 0.35 });
      CX.som(v[1] + 0.5, 'pop', { nota: 'F4', vol: 0.4 });
      CX.som(v[1] + 1.7, 'whoosh', { dur: 0.5, vol: 0.25 });
      CX.som(v[1] + 2.2, 'luzLiga', { fluor: true, vol: 0.3, zumbido: 0.7 });
      CX.som(c07.entregue + 0.05, 'pop', { nota: 'G4', vol: 0.7 });
      // luzes se apagando (cliques secos)
      let n = 0;
      c07.ordem.forEach(i => {
        const t = c07.desliga[i];
        if (t < 900 && n++ % 2 === 0) CX.som(t, 'luzDesliga', { vol: 0.75 - Math.min(0.45, n * 0.02) });
      });
      CX.som(69.3, 'ping', { nota: 'A4', vol: 0.6, decai: 0.8 });
      CX.som(69.6, 'luzLiga', { vol: 0.8, zumbido: 1, tom: 0.9, dur: 1.4 });
    },
    desenhar(ctx, lt, T, env) {
      const v = c07.v;
      // ambiente frio, câmera na mão
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#1A222E');
      g.addColorStop(1, '#0B1018');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.save();
      MG.camera(ctx, 1.03, 960, 540, MG.wiggle(T, 0.9, 7, 1), MG.wiggle(T, 0.8, 5, 2), MG.wiggle(T, 0.6, 0.006, 3));
      const i = T < v[1] ? 0 : T < v[2] ? 1 : T < v[3] ? 2 : T < v[4] ? 3 : 4;
      const tl = T - v[i];
      if (i === 0) c07email(ctx, tl, T);
      else if (i === 1) c07corredor(ctx, tl, T);
      else if (i === 2) c07analista(ctx, tl, T);
      else if (i === 3) c07gestor(ctx, tl, T);
      else c07mapa(ctx, tl, T);
      ctx.restore();
      // lâmpada fluorescente no teto (tremula)
      if (i < 4) {
        const fl = MG.hash(Math.floor(T * 20)) > 0.93 ? 0.4 : 1;
        ctx.fillStyle = MG.rgba('#DDE6F0', 0.85 * fl);
        MG.retArred(ctx, 760, 18, 400, 10, 5);
        ctx.fill();
        MG.aditivo(ctx, () => MG.halo(ctx, 960, 20, 600, '#B9C7D8', 0.18 * fl));
      }
      MG.vinheta(ctx, 0.6);
      // light bloom âmbar (transição para o Cenário 2)
      const bl = anim(T, 69.55, 70.0, E.inQ);
      if (bl > 0) {
        const n = REDE_MAPA.rede.nos[REDE_MAPA.ultimo];
        MG.aditivo(ctx, () => {
          MG.halo(ctx, n.x, n.y, 300 + 2600 * bl, C.ambar, 0.9 * bl);
          MG.luz(ctx, n.x, n.y, 200 + 600 * bl, C.dourado, bl);
        });
      }
    }
  });

  function frioP(nome, extra) {
    return P(nome, Object.assign({ frio: 0.7, aro: C.aco }, extra));
  }

  function c07email(ctx, t, T) {
    // mesa
    ctx.fillStyle = '#121822';
    ctx.fillRect(-100, 860, W + 200, 300);
    // pessoa atrás do notebook
    const cruza = anim(t, 1.5, 2.0, E.ioC);
    MG.personagem(ctx, 760, 760, 1.65, frioP('colaboradora', { t: T, pose: cruza > 0.5 ? 'cruzados' : 'neutra', cabeca: -0.08 * cruza, inclina: -0.03 * cruza }));
    // notebook (de costas)
    ctx.fillStyle = '#2A323E';
    MG.retArred(ctx, 560, 700, 400, 220, 14);
    ctx.fill();
    ctx.fillStyle = '#39424F';
    ctx.fillRect(520, 912, 480, 18);
    MG.aditivo(ctx, () => MG.halo(ctx, 760, 640, 300, '#9FB4CC', 0.25));
    // e-mail flutuante
    const k = anim(t, 0.35, 0.85, E.outBack);
    if (k > 0) {
      ctx.save();
      ctx.translate(1340, 430);
      ctx.scale(k, k);
      ctx.rotate(0.02);
      ctx.fillStyle = '#E6EBF1';
      MG.retArred(ctx, -330, -170, 660, 340, 18);
      ctx.fill();
      ctx.fillStyle = '#B9C3CF';
      ctx.fillRect(-330, -110, 660, 2);
      MG.texto(ctx, 'COMUNICADO · TI CORPORATIVO', -296, -138, { tam: 17, fam: 'mono', alinh: 'left', cor: '#5B6878', esp: 1.5 });
      ctx.fillStyle = '#C8484A';
      MG.retArred(ctx, 136, -156, 166, 36, 18);
      ctx.fill();
      MG.texto(ctx, 'OBRIGATÓRIO', 219, -137, { tam: 15, fam: 'mono', cor: '#FFFFFF', esp: 1.5 });
      MG.texto(ctx, 'Novo sistema obrigatório', -296, -50, { tam: 38, peso: 800, alinh: 'left', cor: '#1C2430' });
      MG.texto(ctx, 'a partir de segunda-feira.', -296, 0, { tam: 38, peso: 800, alinh: 'left', cor: '#1C2430' });
      ctx.fillStyle = '#C4CDD8';
      ctx.fillRect(-296, 60, 420, 10);
      ctx.fillRect(-296, 84, 520, 10);
      ctx.fillRect(-296, 108, 300, 10);
      ctx.restore();
    }
    // "?" de dúvida
    const kq = anim(t, 2.0, 2.4, E.outBack);
    if (kq > 0) {
      MG.texto(ctx, '?', 900, 520 + MG.wiggle(T, 2, 6, 4), { tam: 96 * kq, peso: 800, cor: C.aco });
      ctx.strokeStyle = MG.rgba(C.aco, 0.8 * kq);
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        const a = -0.9 + i * 0.35;
        ctx.beginPath();
        ctx.moveTo(620 + Math.cos(a) * 110, 600 + Math.sin(a) * 110);
        ctx.lineTo(620 + Math.cos(a) * (135 + 10 * Math.sin(T * 9 + i)), 600 + Math.sin(a) * (135 + 10 * Math.sin(T * 9 + i)));
        ctx.stroke();
      }
    }
  }

  function c07corredor(ctx, t, T) {
    const pan = anim(t, 1.7, 2.3, E.ioC);
    ctx.save();
    ctx.translate(-pan * W, 0);
    // corredor em perspectiva
    ctx.strokeStyle = 'rgba(160,180,200,0.12)';
    ctx.lineWidth = 2;
    [[0, 900, 760, 600], [W, 900, 1160, 600], [0, 120, 760, 380], [W, 120, 1160, 380]].forEach(([a, b, c, d]) => {
      ctx.beginPath();
      ctx.moveTo(a, b);
      ctx.lineTo(c, d);
      ctx.stroke();
    });
    ctx.fillStyle = '#1F2836';
    ctx.fillRect(760, 380, 400, 220);
    [[120, 300], [1600, 300]].forEach(([x, y]) => {
      ctx.fillStyle = '#232D3B';
      ctx.fillRect(x, y, 200, 520);
    });
    // cochicho
    MG.personagem(ctx, 820, 800, 1.5, frioP('colega', { t: T, cabeca: 0.2, inclina: 0.06 }));
    MG.personagem(ctx, 1120, 810, 1.5, frioP('analista', { t: T, cabeca: -0.18, inclina: -0.05, pose: 'cruzados' }));
    const kb = anim(t, 0.4, 0.75, E.outBack);
    if (kb > 0) {
      ctx.save();
      ctx.translate(970, 470);
      ctx.scale(kb, kb);
      ctx.fillStyle = 'rgba(200,210,225,0.9)';
      MG.retArred(ctx, -70, -40, 140, 80, 40);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-10, 38);
      ctx.lineTo(0, 62);
      ctx.lineTo(14, 36);
      ctx.fill();
      for (let i = 0; i < 3; i++) {
        const b = Math.max(0, Math.sin(T * 6 - i * 0.7));
        ctx.fillStyle = '#4A5666';
        MG.circulo(ctx, -30 + i * 30, -b * 6, 8);
        ctx.fill();
      }
      ctx.restore();
    }
    // sala de treinamento vazia
    ctx.translate(W, 0);
    ctx.fillStyle = '#1C2531';
    MG.retArred(ctx, 560, 120, 800, 300, 10);
    ctx.fill();
    MG.texto(ctx, 'TREINAMENTO · NOVO SISTEMA', 960, 230, { tam: 30, fam: 'display', peso: 700, cor: '#9AA8B8', esp: 2 });
    MG.etiqueta(ctx, '3 DE 30 INSCRITOS', 960, 320, anim(t, 2.5, 3.0), '#D6A1A1', { fundo: '#2A1E24' });
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 7; c++) {
        const s = 0.8 + r * 0.18;
        const x = 960 + (c - 3) * 190 * s, y = 560 + r * 150;
        cadeira(ctx, x, y, s, 'rgba(130,145,165,0.55)');
      }
    }
    ctx.restore();
  }

  function cadeira(ctx, x, y, s, cor, cheia, pessoaCor) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.strokeStyle = cor;
    ctx.lineWidth = 4;
    ctx.setLineDash(cheia ? [] : [8, 6]);
    MG.retArred(ctx, -40, -60, 80, 60, 10);
    ctx.stroke();
    MG.retArred(ctx, -46, 4, 92, 22, 8);
    ctx.stroke();
    ctx.setLineDash([]);
    if (cheia) MG.iconePessoa(ctx, 0, -40, 70 * cheia, pessoaCor || C.ambar, 1);
    ctx.restore();
  }
  CX.cadeira = cadeira;

  function c07analista(ctx, t, T) {
    // monitores
    const mon = (x, titulo, ativo) => {
      ctx.fillStyle = '#0E131B';
      MG.retArred(ctx, x - 330, 220, 660, 420, 14);
      ctx.fill();
      ctx.fillStyle = ativo ? '#D9DEE5' : '#2A3340';
      MG.retArred(ctx, x - 310, 240, 620, 380, 8);
      ctx.fill();
      ctx.fillStyle = '#0E131B';
      ctx.fillRect(x - 30, 640, 60, 80);
      ctx.fillRect(x - 120, 715, 240, 14);
      MG.texto(ctx, titulo, x - 290, 268, { tam: 16, fam: 'mono', alinh: 'left', cor: ativo ? '#3F4B5B' : '#7F8EA1', esp: 1 });
    };
    mon(560, 'NOVO SISTEMA', false);
    // UI do sistema novo, ignorada
    ctx.fillStyle = 'rgba(127,142,161,0.25)';
    for (let i = 0; i < 4; i++) MG.retArred(ctx, 280 + (i % 2) * 290, 300 + Math.floor(i / 2) * 150, 270, 130, 10), ctx.fill();
    MG.etiqueta(ctx, '0 ACESSOS HOJE', 560, 580, anim(t, 0.8, 1.2), '#9AA8B8', { fundo: '#1A222E' });
    mon(1360, 'controle_v7_FINAL.xlsx', true);
    // planilha sendo preenchida
    const cel = Math.floor(t * 9);
    for (let r = 0; r < 12; r++) {
      for (let c = 0; c < 6; c++) {
        const x = 1060 + c * 100, y = 290 + r * 26;
        ctx.strokeStyle = '#B5BFCC';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, 100, 26);
        if (r * 6 + c < cel + 20) {
          ctx.fillStyle = r * 6 + c === cel + 19 ? '#4D6A8C' : '#7D8A99';
          ctx.fillRect(x + 10, y + 9, 40 + MG.hash(r * 9 + c) * 40, 8);
        }
      }
    }
    // seta "volta ao jeito antigo"
    const ks = anim(t, 1.0, 1.8, E.ioC);
    if (ks > 0) {
      const pts = MG.curva(760, 200, 1160, 200, 0.18, 30);
      ctx.strokeStyle = MG.rgba('#C9D2DC', 0.8);
      ctx.lineWidth = 4;
      ctx.setLineDash([12, 10]);
      MG.caminho(ctx, pts, 0, ks);
      ctx.setLineDash([]);
      if (ks > 0.95) {
        const [px, py] = pts[pts.length - 1];
        ctx.fillStyle = '#C9D2DC';
        ctx.beginPath();
        ctx.moveTo(px + 6, py + 2);
        ctx.lineTo(px - 18, py - 14);
        ctx.lineTo(px - 14, py + 16);
        ctx.fill();
      }
    }
    // analista (de frente, olhando para a planilha)
    MG.personagem(ctx, 960, 905, 1.9, frioP('analista', { t: T, pose: 'digitando', cabeca: 0.14 }));
    ctx.fillStyle = '#151B25';
    ctx.fillRect(-100, 1010, W + 200, 200);
  }

  function c07gestor(ctx, t, T) {
    const x0 = 1140, y0 = 420;
    ctx.fillStyle = '#0F151E';
    MG.retArred(ctx, x0 - 470, y0 - 290, 940, 580, 18);
    ctx.fill();
    ctx.strokeStyle = 'rgba(160,180,200,0.15)';
    ctx.lineWidth = 2;
    ctx.stroke();
    MG.texto(ctx, 'PAINEL DO PROJETO', x0 - 430, y0 - 248, { tam: 18, fam: 'mono', alinh: 'left', cor: '#8796A8', esp: 2 });
    const kpis = ['ADOÇÃO', 'USO DO SISTEMA', 'BENEFÍCIOS'];
    kpis.forEach((nome, i) => {
      const x = x0 - 430 + i * 290, y = y0 - 200;
      const k = anim(t, 0.2 + i * 0.25, 0.8 + i * 0.25, E.outC);
      ctx.fillStyle = '#18202B';
      MG.retArred(ctx, x, y, 270, 150, 12);
      ctx.fill();
      MG.texto(ctx, nome, x + 20, y + 30, { tam: 16, fam: 'mono', alinh: 'left', cor: '#9AA8B8', esp: 1 });
      ctx.fillStyle = MG.mistura('#7F8EA1', C.vermelho, k);
      const bw = lerp(200, 50 + i * 20, k);
      MG.retArred(ctx, x + 20, y + 70, bw, 18, 9);
      ctx.fill();
      // seta para baixo
      ctx.fillStyle = MG.mistura('#7F8EA1', C.vermelho, k);
      ctx.beginPath();
      ctx.moveTo(x + 230, y + 112);
      ctx.lineTo(x + 214, y + 92);
      ctx.lineTo(x + 246, y + 92);
      ctx.fill();
    });
    // gráfico caindo
    const kg = anim(t, 0.3, 1.8, E.ioC);
    ctx.strokeStyle = C.vermelho;
    ctx.lineWidth = 4;
    const pts = [];
    for (let i = 0; i <= 20; i++) pts.push([x0 - 420 + i * 42, y0 + 60 + Math.pow(i / 20, 1.6) * 170 + MG.ruido(i * 0.8, 3) * 16]);
    MG.caminho(ctx, pts, 0, kg);
    // carimbo irônico: "projeto entregue"
    const ke = anim(T, c07.entregue, c07.entregue + 0.35, E.outBack);
    if (ke > 0) {
      ctx.save();
      ctx.translate(x0 + 250, y0 + 110);
      ctx.rotate(-0.12);
      ctx.scale(1.6 - 0.6 * ke, 1.6 - 0.6 * ke);
      ctx.globalAlpha = Math.min(1, ke * 1.5);
      ctx.strokeStyle = C.verde;
      ctx.lineWidth = 5;
      MG.retArred(ctx, -170, -40, 340, 80, 10);
      ctx.stroke();
      MG.texto(ctx, 'PROJETO ENTREGUE ✓', 0, 2, { tam: 26, fam: 'display', peso: 800, cor: C.verde, esp: 1 });
      ctx.restore();
    }
    // gestor sozinho, mão na testa
    MG.personagem(ctx, 470, 820, 1.6, frioP('gestor', { t: T, pose: 'testa', aceno: anim(t, 0.6, 1.2, E.ioC), cabeca: -0.12 * anim(t, 0.6, 1.2) }));
    ctx.fillStyle = '#151B25';
    ctx.fillRect(-100, 960, W + 200, 200);
  }

  // desenha o mapa da rede (usado em C07, C08 e C09)
  function mapaRede(ctx, T, estado, o = {}) {
    const { nos, arestas } = REDE_MAPA.rede;
    MG.aditivo(ctx, () => {
      arestas.forEach(([i, j]) => {
        const a = nos[i], b = nos[j];
        const ea = estado(i), eb = estado(j);
        const on = Math.min(ea.on, eb.on);
        ctx.strokeStyle = on > 0 ? MG.mistura(o.corLinhaOff || '#3A4656', o.corLinha || C.azul, on, 0.25 + 0.4 * on) : MG.rgba(o.corLinhaOff || '#3A4656', 0.25);
        ctx.lineWidth = 1.5 + on;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        if (on > 0.9 && (i + j) % 3 === 0) {
          const p = (T * 0.4 + a.sorte) % 1;
          MG.halo(ctx, lerp(a.x, b.x, p), lerp(a.y, b.y, p), 14, ea.cor || C.ciano, 0.8);
        }
      });
      nos.forEach((n, i) => {
        const e = estado(i);
        if (e.on > 0) {
          const pisca = 0.75 + 0.25 * Math.sin(T * 2.4 + n.fase);
          MG.luz(ctx, n.x, n.y, (18 + 30 * (e.flash || 0)) * n.tam * (1 + 0.3 * e.on), e.cor || C.ciano, e.on * pisca);
        }
      });
    });
    nos.forEach((n, i) => {
      const e = estado(i);
      if (e.on < 1) {
        ctx.fillStyle = MG.rgba(o.corOff || '#4A5666', 0.7 * (1 - e.on));
        MG.circulo(ctx, n.x, n.y, 5 * n.tam);
        ctx.fill();
      }
    });
  }
  CX.mapaRede = mapaRede;
  CX.REDE_MAPA = REDE_MAPA;

  function c07mapa(ctx, t, T) {
    ctx.fillStyle = '#0C1119';
    MG.retArred(ctx, 220, 90, 1480, 640, 18);
    ctx.fill();
    ctx.strokeStyle = 'rgba(160,180,200,0.12)';
    ctx.lineWidth = 2;
    ctx.stroke();
    const ult = REDE_MAPA.ultimo;
    mapaRede(ctx, T, i => {
      if (i === ult) {
        const amb = anim(T, 69.2, 69.5);
        return { on: 1, cor: amb > 0 ? C.ambar : '#AFC3DA', flash: amb * (0.6 + 0.4 * Math.sin(T * 12)) };
      }
      const td = c07.desliga[i];
      const on = T < td ? 1 : 1 - anim(T, td, td + 0.12);
      return { on: on * 0.85, cor: '#AFC3DA' };
    }, { corLinha: '#7F96B3' });
    // infográfico: 3 em cada 10
    const tf = CX.voz.frase('c07', 6, 66.1);
    const ki = anim(T, tf - 0.3, tf + 0.3);
    for (let i = 0; i < 10; i++) {
      const x = 760 + i * 44, y = 820;
      const apaga = i >= 3 ? anim(T, tf + 0.25 + (i - 3) * 0.22, tf + 0.4 + (i - 3) * 0.22) : 0;
      MG.iconePessoa(ctx, x, y, 38, MG.mistura('#DCE6F2', '#3A4656', apaga), ki);
    }
    MG.cartelaDado(ctx, [
      { txt: 'Apenas 3 em cada 10 transformações', tam: 40, peso: 700 },
      { txt: 'atingem e sustentam seus resultados.', tam: 40, peso: 500 }
    ], 'FONTE: MCKINSEY & COMPANY; KOTTER, HBR', 960, 905, anim(T, tf + 0.1, tf + 0.7), { entre: 50 });
  }

  /* ======================= C08 · Cenário 2: com gestão da mudança ======================= */
  let c08 = null;
  CX.cenas.definir('C08', {
    dica: { txt: 'Toque nos pontos para acender a rede', ini: 'c08mapa', dur: 4.5 },
    preparar() {
      const w1 = 70.0;
      const w2 = clamp(CX.voz.fimFrase('c08', 3, 75.2) + 0.15, 74.2, 77);
      const w3 = clamp(CX.voz.palavra('c08', 'preparam', 78.4) - 0.25, w2 + 2.2, 80);
      const w4 = clamp(CX.voz.frase('c08', 5, 80.9) - 0.3, w3 + 2.0, 82);
      const w5 = clamp(CX.voz.fimFrase('c08', 5, 82.8) + 0.25, w4 + 1.8, 84);
      // ordem de acendimento (busca em largura a partir do nó âmbar)
      const { nos, arestas } = REDE_MAPA.rede;
      const viz = nos.map(() => []);
      arestas.forEach(([i, j]) => { viz[i].push(j); viz[j].push(i); });
      const prof = nos.map(() => -1);
      const fila = [REDE_MAPA.ultimo];
      prof[REDE_MAPA.ultimo] = 0;
      while (fila.length) {
        const a = fila.shift();
        viz[a].forEach(b => { if (prof[b] < 0) { prof[b] = prof[a] + 1; fila.push(b); } });
      }
      const maxP = Math.max(...prof);
      const liga = prof.map((p, i) => w5 + 0.25 + (p / Math.max(1, maxP)) * 2.6 + MG.hash(i + 5) * 0.25);
      c08 = { v: [w1, w2, w3, w4, w5], liga, palavras: ['explica', 'escuta', 'envolve'].map((p, i) => CX.voz.palavra('c08', p, 72.6 + i * 0.9)) };
      CX.T.c08ini = w1 + 0.4;
      CX.T.c08mapa = w5;
      CX.topoLegenda(w5 + 0.6, 88);
    },
    sons() {
      const v = c08.v;
      c08.palavras.forEach((t, i) => CX.som(t, 'pop', { nota: ['C5', 'E5', 'G5'][i], vol: 0.7 }));
      for (let i = 0; i < 4; i++) CX.som(v[0] + 0.8 + i * 0.35, 'ping', { nota: ['F5', 'A5', 'C6', 'F6'][i], vol: 0.25 });
      for (let i = 0; i < 6; i++) CX.som(v[1] + 0.1 + i * 0.16, 'pop', { nota: ['C5', 'D5', 'F5', 'G5', 'A5', 'C6'][i], vol: 0.45 });
      CX.som(v[1] + 1.4, 'brilho', { vol: 0.6 });
      CX.som(v[2] + 0.5, 'pop', { nota: 'A5', vol: 0.7 });
      [0.9, 1.25, 1.6].forEach((d, i) => CX.som(v[2] + d, 'ping', { nota: ['C6', 'E6', 'G6'][i], vol: 0.35 }));
      [0.3, 0.6, 0.9].forEach((d, i) => CX.som(v[3] + d, 'ping', { nota: ['F5', 'A5', 'C6'][i], vol: 0.45 }));
      // rede acendendo, ponto a ponto (alguns nós audíveis, em escala ascendente)
      const notas = ['F5', 'G5', 'A5', 'C6', 'D6', 'F6', 'G6', 'A6', 'C7'];
      const ord = c08.liga.map((t, i) => [t, i]).sort((a, b) => a[0] - b[0]);
      ord.forEach(([t], k) => { if (k % 3 === 0) CX.som(t, 'luzLiga', { vol: 0.35, zumbido: 0.25, tom: 0.9 + (k / ord.length) * 0.6 }); });
      ord.forEach(([t], k) => { if (k % 5 === 2) CX.som(t, 'ping', { nota: notas[Math.min(notas.length - 1, Math.floor((k / ord.length) * notas.length))], vol: 0.3 }); });
      // contador 1x → 7x
      for (let i = 1; i <= 6; i++) CX.som(v[4] + 1.0 + i * 0.13, 'tique', { vol: 0.5 });
    },
    desenhar(ctx, lt, T, env) {
      const v = c08.v;
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#0A1430');
      g.addColorStop(1, '#1A1420');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      MG.lightLeak(ctx, T, C.ambar, 0.22, 3);
      ctx.save();
      MG.camera(ctx, 1.0 + 0.012 * Math.sin(T * 0.4), 960, 540, Math.sin(T * 0.3) * 6, 0);
      const i = T < v[1] ? 0 : T < v[2] ? 1 : T < v[3] ? 2 : T < v[4] ? 3 : 4;
      const tl = T - v[i];
      if (i === 0) c08lider(ctx, tl, T);
      else if (i === 1) c08workshop(ctx, tl, T);
      else if (i === 2) c08colega(ctx, tl, T);
      else if (i === 3) c08gestor(ctx, tl, T);
      else c08mapa(ctx, tl, T, env);
      ctx.restore();
      MG.vinheta(ctx, 0.45);
      // bloom vindo do Cenário 1
      const bl = 1 - anim(T, 70.0, 70.6, E.outC);
      if (bl > 0) {
        MG.aditivo(ctx, () => MG.halo(ctx, 960, 540, 2600, C.ambar, 0.9 * bl));
      }
    }
  });

  function quente(nome, extra) {
    return P(nome, Object.assign({ luzContorno: C.ambar }, extra));
  }

  function linhaAmbar(ctx, a, b, k, T, curv = 0.15) {
    if (k <= 0) return;
    const pts = MG.curva(a[0], a[1], b[0], b[1], curv, 24);
    MG.aditivo(ctx, () => {
      ctx.strokeStyle = MG.rgba(C.ambar, 0.7);
      ctx.lineWidth = 3;
      ctx.shadowColor = C.ambar;
      ctx.shadowBlur = 10;
      MG.caminho(ctx, pts, 0, k);
      ctx.shadowBlur = 0;
      if (k >= 1) {
        const p = MG.pontoEm(pts, (T * 0.7) % 1);
        MG.luz(ctx, p[0], p[1], 22, C.dourado, 0.9);
      }
    });
  }

  function c08lider(ctx, t, T) {
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(-100, 940, W + 200, 200);
    const equipe = [[1080, 830, 1.05, 0], [1270, 800, 1.0, 2], [1460, 830, 1.05, 3], [1650, 860, 1.12, 5]];
    const lider = [620, 790];
    equipe.forEach(([x, y, s, i], k) => linhaAmbar(ctx, [lider[0], lider[1] - 120], [x, y - 80 * s], anim(t, 0.8 + k * 0.35, 1.5 + k * 0.35, E.ioC), T, -0.12));
    equipe.forEach(([x, y, s, i], k) => MG.personagem(ctx, x, y, s * 1.25, X(i, { t: T, acenar: true, fase: k, luzContorno: C.ambar })));
    MG.personagem(ctx, lider[0], lider[1], 1.75, quente('lider', { t: T, pose: 'gesto' }));
    // EXPLICA · ESCUTA · ENVOLVE
    ['EXPLICA', 'ESCUTA', 'ENVOLVE'].forEach((p, k) => {
      const t0 = c08.palavras[k];
      const kk = anim(T, t0 - 0.05, t0 + 0.35, E.outBack);
      if (kk <= 0) return;
      ctx.save();
      ctx.translate(1080 + k * 290, 250);
      ctx.scale(kk, kk);
      MG.texto(ctx, p, 0, 0, { tam: 50, peso: 800, fam: 'display', cor: C.branco, esp: 2 });
      ctx.fillStyle = C.ambar;
      ctx.fillRect(-40, 40, 80, 5);
      ctx.restore();
    });
  }

  function c08workshop(ctx, t, T) {
    // parede de post-its
    ctx.fillStyle = 'rgba(255,220,170,0.06)';
    MG.retArred(ctx, 140, 130, 860, 520, 18);
    ctx.fill();
    const cores = ['#F6E7A8', '#7FD1C7', '#8FB3FF', '#F2B8C6', '#FFD38A'];
    for (let i = 0; i < 12; i++) {
      const k = MG.mola(t - 0.05 - i * 0.12, 2.4, 7);
      if (k <= 0) continue;
      const x = 220 + (i % 4) * 200 + MG.hash(i) * 30, y = 200 + Math.floor(i / 4) * 150 + MG.hash(i + 9) * 20;
      ctx.save();
      ctx.translate(x + 70, y + 50);
      ctx.rotate((MG.hash(i + 3) - 0.5) * 0.12);
      ctx.scale(k, k);
      ctx.fillStyle = cores[i % 5];
      MG.retArred(ctx, -70, -50, 140, 100, 6);
      ctx.fill();
      ctx.fillStyle = 'rgba(30,30,40,0.35)';
      ctx.fillRect(-50, -24, 90, 7);
      ctx.fillRect(-50, -6, 70, 7);
      ctx.restore();
    }
    // pessoas participando
    MG.personagem(ctx, 330, 900, 1.35, quente('analista', { t: T, pose: 'levantado', aceno: anim(t, 0.4, 0.8, E.outBack) }));
    MG.personagem(ctx, 620, 920, 1.3, X(1, { t: T, luzContorno: C.ambar, inclina: Math.sin(T * 7) * 0.03 * anim(t, 0.6, 1), cabeca: 0.1 }));
    MG.personagem(ctx, 890, 910, 1.3, X(4, { t: T, luzContorno: C.ambar, acenar: true, cabeca: -0.1 }));
    // sala de treinamento cheia (picture-in-picture)
    const kp = anim(t, 0.7, 1.2, E.outBack);
    if (kp > 0) {
      ctx.save();
      ctx.translate(1440, 470);
      ctx.scale(kp, kp);
      ctx.fillStyle = 'rgba(14,22,44,0.92)';
      MG.retArred(ctx, -360, -270, 720, 540, 24);
      ctx.fill();
      ctx.strokeStyle = MG.rgba(C.ambar, 0.5);
      ctx.lineWidth = 2;
      ctx.stroke();
      MG.texto(ctx, 'TREINAMENTO · NOVO SISTEMA', 0, -220, { tam: 22, fam: 'display', peso: 700, cor: C.branco, esp: 1.5 });
      let n = 0;
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 6; c++) {
          const kc = anim(t, 1.0 + n * 0.04, 1.25 + n * 0.04, E.outBack);
          cadeira(ctx, (c - 2.5) * 105, -90 + r * 120, 0.8, MG.rgba(C.gelo, 0.5), kc, n % 4 === 0 ? C.dourado : C.ambar);
          n++;
        }
      }
      MG.etiqueta(ctx, '30 DE 30 INSCRITOS ✓', 0, 225, anim(t, 1.6, 2.0), C.verde, { fundo: '#0F2A22' });
      ctx.restore();
    }
  }

  function c08colega(ctx, t, T) {
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(-100, 950, W + 200, 200);
    // tela compartilhada
    ctx.fillStyle = '#0F1A33';
    MG.retArred(ctx, 760, 300, 420, 290, 16);
    ctx.fill();
    ctx.strokeStyle = MG.rgba(C.ciano, 0.5);
    ctx.lineWidth = 2;
    ctx.stroke();
    MG.texto(ctx, 'NOVO SISTEMA', 790, 330, { tam: 16, fam: 'mono', alinh: 'left', cor: MG.rgba(C.gelo, 0.7), esp: 1.5 });
    for (let i = 0; i < 3; i++) {
      const y = 380 + i * 62;
      ctx.fillStyle = 'rgba(108,196,255,0.18)';
      MG.retArred(ctx, 790, y, 360, 48, 10);
      ctx.fill();
      const kc = anim(t, 0.9 + i * 0.35, 1.15 + i * 0.35, E.outBack);
      if (kc > 0) {
        ctx.strokeStyle = C.verde;
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(1110 - 10 * kc, y + 24);
        ctx.lineTo(1118, y + 32);
        ctx.lineTo(1118 + 16 * kc, y + 14);
        ctx.stroke();
      }
      ctx.fillStyle = MG.rgba(C.gelo, 0.5);
      ctx.fillRect(810, y + 20, 160, 8);
    }
    ctx.fillStyle = '#0F1A33';
    ctx.fillRect(950, 590, 40, 70);
    linhaAmbar(ctx, [560, 560], [1380, 560], anim(t, 0.3, 0.9, E.ioC), T, -0.18);
    MG.personagem(ctx, 520, 820, 1.75, quente('colega', { t: T, pose: 'apontar', aceno: anim(t, 0.2, 0.7, E.outC), inclina: 0.06, cabeca: 0.1 }));
    MG.personagem(ctx, 1420, 830, 1.7, quente('colaboradora', { t: T, acenar: true, cabeca: -0.08 }));
    // selo de agente da mudança
    const kb = anim(t, 0.5, 0.9, E.outBack);
    if (kb > 0) {
      ctx.save();
      ctx.translate(520, 990);
      ctx.scale(kb, kb);
      ctx.fillStyle = C.ambar;
      MG.retArred(ctx, -150, -24, 300, 48, 24);
      ctx.fill();
      MG.texto(ctx, 'AGENTE DA MUDANÇA', 0, 1, { tam: 18, fam: 'mono', peso: 500, cor: '#2A1A06', esp: 1.5 });
      ctx.restore();
    }
  }

  function c08gestor(ctx, t, T) {
    const x0 = 1140, y0 = 420;
    ctx.fillStyle = '#121A2C';
    MG.retArred(ctx, x0 - 470, y0 - 290, 940, 580, 18);
    ctx.fill();
    ctx.strokeStyle = MG.rgba(C.ambar, 0.2);
    ctx.lineWidth = 2;
    ctx.stroke();
    MG.texto(ctx, 'PAINEL DO PROJETO', x0 - 430, y0 - 248, { tam: 18, fam: 'mono', alinh: 'left', cor: MG.rgba(C.gelo, 0.7), esp: 2 });
    ['ADOÇÃO', 'USO DO SISTEMA', 'BENEFÍCIOS'].forEach((nome, i) => {
      const x = x0 - 430 + i * 290, y = y0 - 200;
      const k = anim(t, 0.1 + i * 0.2, 0.6 + i * 0.2, E.outC);
      ctx.fillStyle = '#1A2440';
      MG.retArred(ctx, x, y, 270, 150, 12);
      ctx.fill();
      MG.texto(ctx, nome, x + 20, y + 30, { tam: 16, fam: 'mono', alinh: 'left', cor: MG.rgba(C.gelo, 0.7), esp: 1 });
      const cor = MG.mistura(C.vermelho, C.verde, k);
      ctx.fillStyle = cor;
      MG.retArred(ctx, x + 20, y + 70, lerp(60, 210, k), 18, 9);
      ctx.fill();
      ctx.beginPath();
      const up = k > 0.5;
      ctx.moveTo(x + 230, up ? y + 92 : y + 112);
      ctx.lineTo(x + 214, up ? y + 112 : y + 92);
      ctx.lineTo(x + 246, up ? y + 112 : y + 92);
      ctx.fill();
    });
    const kg = anim(t, 0.2, 1.4, E.ioC);
    ctx.strokeStyle = C.verde;
    ctx.lineWidth = 4;
    const pts = [];
    for (let i = 0; i <= 20; i++) pts.push([x0 - 420 + i * 42, y0 + 230 - Math.pow(i / 20, 1.4) * 170 + MG.ruido(i * 0.8, 3) * 14]);
    MG.caminho(ctx, pts, 0, kg);
    MG.personagem(ctx, 470, 820, 1.6, quente('gestor', { t: T, pose: 'apontar', aceno: anim(t, 0.5, 1.0, E.outBack), cabeca: 0.1 }));
    const ke = anim(t, 0.8, 1.2, E.outBack);
    if (ke > 0) {
      MG.personagem(ctx, 1500, 1010 + (1 - ke) * 200, 1.2, X(0, { t: T, acenar: true, luzContorno: C.ambar }));
      MG.personagem(ctx, 1720, 1030 + (1 - ke) * 200, 1.25, X(3, { t: T, acenar: true, fase: 2, luzContorno: C.ambar }));
    }
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(-100, 990, W + 200, 200);
  }

  function c08mapa(ctx, t, T, env) {
    ctx.fillStyle = 'rgba(8,14,32,0.85)';
    MG.retArred(ctx, 220, 90, 1480, 640, 18);
    ctx.fill();
    ctx.strokeStyle = MG.rgba(C.ambar, 0.2);
    ctx.lineWidth = 2;
    ctx.stroke();
    const nos = REDE_MAPA.rede.nos;
    // cliques do público acendem nós próximos
    const cliques = (env && env.cliques || []).filter(c => c.cena === 'C08' && c.T <= T);
    mapaRede(ctx, T, i => {
      let t0 = c08.liga[i];
      cliques.forEach(c => {
        if (Math.hypot(nos[i].x - c.x, nos[i].y - c.y) < 170) t0 = Math.min(t0, c.T + Math.hypot(nos[i].x - c.x, nos[i].y - c.y) / 900);
      });
      const on = anim(T, t0, t0 + 0.25, E.outC);
      const flash = MG.janela(T, t0, t0 + 0.6, 0.05, 0.5);
      return { on, cor: i === REDE_MAPA.ultimo ? C.ambar : i % 3 === 0 ? C.ciano : C.ambar, flash };
    }, { corLinha: C.ambar, corLinhaOff: '#2B3550' });
    // brilho do ponteiro (lanterna)
    if (env && env.ponteiro && env.ponteiro.ativo && env.interativo) {
      MG.aditivo(ctx, () => MG.halo(ctx, env.ponteiro.x, env.ponteiro.y, 160, C.ambar, 0.25));
    }
    // 7x mais chance
    const k = anim(t, 0.8, 1.3);
    if (k > 0) {
      const n = Math.min(7, 1 + Math.floor(prog(t, 1.0, 1.85) * 6.999));
      ctx.save();
      ctx.globalAlpha = k;
      MG.texto(ctx, n + 'x', 600, 880, { tam: 150, peso: 800, fam: 'display', cor: C.ambar, brilho: C.ambar, brilhoR: 30 });
      MG.texto(ctx, 'Com gestão da mudança excelente, projetos têm', 760, 850, { tam: 36, peso: 500, alinh: 'left' });
      MG.texto(ctx, '7x mais chance de atingir seus objetivos.', 760, 900, { tam: 36, peso: 800, alinh: 'left' });
      MG.texto(ctx, 'FONTE: PROSCI, BEST PRACTICES IN CHANGE MANAGEMENT', 760, 950, { tam: 17, fam: 'mono', alinh: 'left', cor: MG.rgba(C.gelo, 0.55), esp: 1 });
      ctx.restore();
    }
  }
})();
