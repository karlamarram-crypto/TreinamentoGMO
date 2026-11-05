/* ==========================================================================
   CONECTADOS · KIT DE MOTION GRAPHICS
   Easing, molas, trim paths, texto-filamento, brilhos, personagens.
   Tudo é função do tempo: o mesmo instante sempre gera o mesmo quadro.
   ========================================================================== */
(function () {
  'use strict';
  const CX = window.CX = window.CX || {};
  const MG = CX.MG = {};
  const W = MG.W = 1920;
  const H = MG.H = 1080;

  /* ---------------- Paleta ----------------
     Regra cromática do roteiro: o âmbar só aparece quando há pessoas engajadas. */
  const C = MG.cor = {
    fundo: '#040A18',
    fundo2: '#0A1633',
    linha: '#18294F',
    azul: '#2E7BFF',
    ciano: '#6CC4FF',
    gelo: '#D4E8FF',
    ambar: '#FFB23F',
    ambarQuente: '#FF8A1F',
    dourado: '#FFD993',
    branco: '#EEF3FA',
    cinza: '#8A98AC',
    aco: '#7F8EA1',
    acoEscuro: '#232C38',
    vermelho: '#F0524F',
    verde: '#3DDC97'
  };

  MG.fontes = {
    display: '"Archivo Expanded", "Archivo", Arial, sans-serif',
    texto: '"Archivo", Arial, sans-serif',
    estreita: '"Archivo Narrow", "Archivo", Arial, sans-serif',
    mono: '"IBM Plex Mono", "Courier New", monospace'
  };

  /* ---------------- Matemática ---------------- */
  const clamp = MG.clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
  const lerp = MG.lerp = (a, b, t) => a + (b - a) * t;
  MG.prog = (t, a, b) => clamp((t - a) / (b - a));

  const E = MG.E = {
    lin: t => t,
    inQ: t => t * t,
    outQ: t => 1 - (1 - t) * (1 - t),
    ioQ: t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
    inC: t => t * t * t,
    outC: t => 1 - Math.pow(1 - t, 3),
    ioC: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    outQuint: t => 1 - Math.pow(1 - t, 5),
    inExpo: t => (t === 0 ? 0 : Math.pow(2, 10 * t - 10)),
    outExpo: t => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    ioExpo: t => (t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2),
    ioS: t => -(Math.cos(Math.PI * t) - 1) / 2,
    outBack: t => { const s = 1.70158, c3 = s + 1; return 1 + c3 * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2); },
    outBackSuave: t => { const s = 0.9, c3 = s + 1; return 1 + c3 * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2); },
    outElastic: t => (t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1)
  };

  // Progresso com easing entre os instantes a e b
  MG.anim = (t, a, b, ease) => (ease || E.outC)(clamp((t - a) / (b - a)));
  // Entra e sai: 0 → 1 → 0
  MG.janela = (t, a, b, entra = 0.4, sai = 0.4, ease) => {
    const e = ease || E.ioC;
    if (t < a || t > b) return 0;
    return Math.min(e(clamp((t - a) / entra)), e(clamp((b - t) / sai)));
  };
  // Mola amortecida (t em segundos desde o disparo): overshoot elegante
  MG.mola = (t, freq = 2.0, amort = 6) => (t <= 0 ? 0 : 1 - Math.exp(-amort * t) * Math.cos(2 * Math.PI * freq * t));

  // Hash e ruído determinísticos
  function hash(i) {
    let h = Math.imul((i | 0) ^ 0x9e3779b9, 0x85ebca6b);
    h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967295;
  }
  MG.hash = hash;
  MG.ruido = (x, seed = 0) => {
    const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
    return lerp(hash(i + seed * 7919), hash(i + 1 + seed * 7919), u) * 2 - 1;
  };
  MG.wiggle = (t, freq, amp, seed = 0) => MG.ruido(t * freq, seed) * amp;
  MG.rng = seed => {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  /* ---------------- Cores ---------------- */
  const cacheRgb = {};
  function rgb(hex) {
    if (cacheRgb[hex]) return cacheRgb[hex];
    const h = hex.replace('#', '');
    const v = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    cacheRgb[hex] = v;
    return v;
  }
  MG.rgb = rgb;
  MG.rgba = (hex, a) => { const [r, g, b] = rgb(hex); return `rgba(${r},${g},${b},${a})`; };
  MG.mistura = (h1, h2, t, a = 1) => {
    const p = rgb(h1), q = rgb(h2);
    return `rgba(${Math.round(lerp(p[0], q[0], t))},${Math.round(lerp(p[1], q[1], t))},${Math.round(lerp(p[2], q[2], t))},${a})`;
  };
  // Dessatura (para o Cenário 1: aço frio)
  MG.frio = (hex, k = 0.75) => {
    const [r, g, b] = rgb(hex);
    const l = 0.3 * r + 0.59 * g + 0.11 * b;
    const rr = lerp(r, l * 0.92, k), gg = lerp(g, l * 0.98, k), bb = lerp(b, l * 1.12 + 8, k);
    return `rgb(${Math.round(rr)},${Math.round(gg)},${Math.round(Math.min(255, bb))})`;
  };

  /* ---------------- Sprites de brilho (rápidos, aditivos) ---------------- */
  const sprites = {};
  function sprite(cor, nucleo) {
    const k = cor + (nucleo ? '*' : '');
    if (sprites[k]) return sprites[k];
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    if (nucleo) {
      gr.addColorStop(0, 'rgba(255,255,255,1)');
      gr.addColorStop(0.1, MG.rgba(cor, 1));
      gr.addColorStop(0.3, MG.rgba(cor, 0.4));
      gr.addColorStop(0.6, MG.rgba(cor, 0.1));
    } else {
      gr.addColorStop(0, MG.rgba(cor, 0.9));
      gr.addColorStop(0.35, MG.rgba(cor, 0.35));
      gr.addColorStop(0.7, MG.rgba(cor, 0.08));
    }
    gr.addColorStop(1, MG.rgba(cor, 0));
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
    sprites[k] = c;
    return c;
  }
  // Ponto de luz com núcleo branco
  MG.luz = (ctx, x, y, r, cor, a = 1) => {
    if (a <= 0.003 || r <= 0) return;
    ctx.globalAlpha = Math.min(1, a);
    ctx.drawImage(sprite(cor, true), x - r, y - r, r * 2, r * 2);
    ctx.globalAlpha = 1;
  };
  // Halo suave sem núcleo
  MG.halo = (ctx, x, y, r, cor, a = 1) => {
    if (a <= 0.003 || r <= 0) return;
    ctx.globalAlpha = Math.min(1, a);
    ctx.drawImage(sprite(cor, false), x - r, y - r, r * 2, r * 2);
    ctx.globalAlpha = 1;
  };
  MG.aditivo = (ctx, fn) => {
    const op = ctx.globalCompositeOperation;
    ctx.globalCompositeOperation = 'lighter';
    fn();
    ctx.globalCompositeOperation = op;
  };

  /* ---------------- Fundo, grão, vinheta, light leaks ---------------- */
  MG.fundo = (ctx, c1 = C.fundo, c2 = C.fundo2) => {
    const g = ctx.createRadialGradient(W / 2, H * 0.55, 80, W / 2, H * 0.55, W * 0.75);
    g.addColorStop(0, c2);
    g.addColorStop(1, c1);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  };

  let graos = null;
  function prepararGrao() {
    graos = [];
    for (let n = 0; n < 4; n++) {
      const c = document.createElement('canvas');
      c.width = c.height = 256;
      const g = c.getContext('2d');
      const img = g.createImageData(256, 256);
      const r = MG.rng(1234 + n);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.floor(r() * 255);
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = 255;
      }
      g.putImageData(img, 0, 0);
      graos.push(c);
    }
  }
  MG.grao = (ctx, T, a = 0.045) => {
    if (!graos) prepararGrao();
    const f = Math.max(0, Math.floor(T * 24));
    const c = graos[f % 4];
    const ox = Math.floor(hash(f) * 256), oy = Math.floor(hash(f + 99) * 256);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.globalCompositeOperation = 'overlay';
    const pat = ctx.createPattern(c, 'repeat');
    ctx.translate(-ox, -oy);
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, W + 256, H + 256);
    ctx.restore();
  };

  MG.vinheta = (ctx, forca = 0.55) => {
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.72);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(0,0,0,${forca})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  };

  // Light leak âmbar que flutua (cenas humanas)
  MG.lightLeak = (ctx, T, cor = C.ambar, forca = 0.35, seed = 1) => {
    MG.aditivo(ctx, () => {
      for (let i = 0; i < 2; i++) {
        const x = W * (0.15 + 0.7 * (0.5 + 0.5 * MG.ruido(T * 0.12 + i * 10, seed + i)));
        const y = H * (0.2 + 0.6 * (0.5 + 0.5 * MG.ruido(T * 0.09 + i * 20, seed + i + 5)));
        MG.halo(ctx, x, y, 700 + 200 * i, cor, forca * (0.6 + 0.4 * MG.ruido(T * 0.5, seed + i + 9)));
      }
    });
  };

  // Partículas de poeira iluminada
  MG.poeira = (ctx, T, n = 60, cor = C.ciano, a = 0.5, seed = 7) => {
    const r = MG.rng(seed);
    MG.aditivo(ctx, () => {
      for (let i = 0; i < n; i++) {
        const bx = r() * W, by = r() * H, vel = 6 + r() * 18, tam = 2 + r() * 5, fase = r() * 10;
        const x = (bx + MG.wiggle(T, 0.15, 40, i) + T * vel * 0.4) % W;
        const y = (by - T * vel + H * 10) % H;
        const brilho = 0.5 + 0.5 * Math.sin(T * 1.3 + fase);
        MG.halo(ctx, x, y, tam * 3, cor, a * brilho);
      }
    });
  };

  /* ---------------- Formas ---------------- */
  MG.retArred = (ctx, x, y, w, h, r) => {
    r = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };
  MG.circulo = (ctx, x, y, r) => {
    ctx.beginPath();
    ctx.arc(x, y, Math.max(0, r), 0, Math.PI * 2);
  };

  // Trim path: desenha só o trecho [p0, p1] (0..1) de uma polilinha
  MG.caminho = (ctx, pts, p0, p1) => {
    if (p1 <= p0 || pts.length < 2) return;
    let total = 0;
    const seg = [];
    for (let i = 1; i < pts.length; i++) {
      const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      seg.push(d);
      total += d;
    }
    const a = p0 * total, b = p1 * total;
    let acc = 0, comecou = false;
    ctx.beginPath();
    for (let i = 1; i < pts.length; i++) {
      const d = seg[i - 1];
      const s0 = acc, s1 = acc + d;
      if (s1 >= a && s0 <= b) {
        const ta = clamp((a - s0) / d), tb = clamp((b - s0) / d);
        const xa = lerp(pts[i - 1][0], pts[i][0], ta), ya = lerp(pts[i - 1][1], pts[i][1], ta);
        const xb = lerp(pts[i - 1][0], pts[i][0], tb), yb = lerp(pts[i - 1][1], pts[i][1], tb);
        if (!comecou) { ctx.moveTo(xa, ya); comecou = true; }
        ctx.lineTo(xb, yb);
      }
      acc = s1;
    }
    ctx.stroke();
  };
  // Ponto ao longo de uma polilinha (0..1)
  MG.pontoEm = (pts, p) => {
    let total = 0;
    const seg = [];
    for (let i = 1; i < pts.length; i++) {
      const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      seg.push(d);
      total += d;
    }
    let alvo = clamp(p) * total;
    for (let i = 1; i < pts.length; i++) {
      if (alvo <= seg[i - 1]) {
        const t = seg[i - 1] ? alvo / seg[i - 1] : 0;
        return [lerp(pts[i - 1][0], pts[i][0], t), lerp(pts[i - 1][1], pts[i][1], t)];
      }
      alvo -= seg[i - 1];
    }
    return pts[pts.length - 1].slice();
  };

  // Curva quadrática amostrada como polilinha
  MG.curva = (x0, y0, x1, y1, curv = 0.2, n = 24) => {
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    const dx = x1 - x0, dy = y1 - y0;
    const cx = mx - dy * curv, cy = my + dx * curv;
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, u = 1 - t;
      pts.push([u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1]);
    }
    return pts;
  };

  /* ---------------- Texto ---------------- */
  MG.fonte = (ctx, tam, peso = 600, fam = 'texto') => {
    ctx.font = `${peso} ${tam}px ${MG.fontes[fam] || fam}`;
  };

  function larguras(ctx, str, esp) {
    const ws = [];
    let total = 0;
    for (const ch of str) {
      const w = ctx.measureText(ch).width;
      ws.push(w);
      total += w + esp;
    }
    return { ws, total: total - (ws.length ? esp : 0) };
  }
  MG.medir = (ctx, str, esp = 0) => (esp ? larguras(ctx, str, esp).total : ctx.measureText(str).width);

  // Texto simples (com espaçamento entre letras e brilho opcionais)
  MG.texto = (ctx, str, x, y, o = {}) => {
    const tam = o.tam || 40;
    MG.fonte(ctx, tam, o.peso || 600, o.fam || 'texto');
    ctx.textBaseline = o.base || 'middle';
    const esp = o.esp || 0;
    const alinh = o.alinh || 'center';
    ctx.save();
    ctx.globalAlpha *= o.alpha === undefined ? 1 : o.alpha;
    ctx.fillStyle = o.cor || C.branco;
    if (o.brilho) {
      ctx.shadowColor = o.brilho;
      ctx.shadowBlur = o.brilhoR || tam * 0.5;
    }
    if (!esp) {
      ctx.textAlign = alinh;
      ctx.fillText(str, x, y);
    } else {
      const { ws, total } = larguras(ctx, str, esp);
      let cx = alinh === 'center' ? x - total / 2 : alinh === 'right' ? x - total : x;
      ctx.textAlign = 'left';
      let i = 0;
      for (const ch of str) {
        ctx.fillText(ch, cx, y);
        cx += ws[i++] + esp;
      }
    }
    ctx.restore();
  };

  /* Texto que "acende" letra a letra, como um filamento.
     p = progresso 0..1. Letras apagadas ficam como vidro escuro. */
  MG.textoFilamento = (ctx, str, x, y, p, o = {}) => {
    const tam = o.tam || 64;
    MG.fonte(ctx, tam, o.peso || 700, o.fam || 'display');
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    const esp = o.esp === undefined ? tam * 0.06 : o.esp;
    const cor = o.cor || C.branco;
    const { ws, total } = larguras(ctx, str, esp);
    const alinh = o.alinh || 'center';
    let cx = alinh === 'center' ? x - total / 2 : alinh === 'right' ? x - total : x;
    const n = [...str].length;
    const janela = o.janela || 0.35;
    const cores = o.cores || null;
    ctx.save();
    const alphaBase = o.alpha === undefined ? 1 : o.alpha;
    let i = 0;
    for (const ch of str) {
      const ini = (n > 1 ? i / (n - 1) : 0) * (1 - janela);
      const l = clamp((p - ini) / janela);
      const corCh = cores ? (cores[i] || cor) : cor;
      // vidro apagado
      if (o.apagadas !== false && l < 1) {
        ctx.globalAlpha = alphaBase * 0.13 * (1 - l);
        ctx.fillStyle = MG.rgba(C.gelo, 1);
        ctx.fillText(ch, cx, y);
      }
      if (l > 0) {
        // tremulação no acendimento
        const flick = l < 1 ? 0.55 + 0.45 * hash(i * 31 + Math.floor(p * 60)) : 1;
        const pico = l < 1 ? Math.sin(l * Math.PI) : 0;
        ctx.globalAlpha = alphaBase * Math.min(1, l * 1.6) * flick;
        ctx.shadowColor = MG.rgba(corCh, 0.9);
        ctx.shadowBlur = tam * (0.25 + 0.6 * pico) * (o.glow === undefined ? 1 : o.glow);
        ctx.fillStyle = pico > 0.2 ? MG.mistura(corCh, '#FFFFFF', pico * 0.7) : corCh;
        ctx.fillText(ch, cx, y);
        ctx.shadowBlur = 0;
      }
      cx += ws[i] + esp;
      i++;
    }
    ctx.restore();
    return total;
  };

  /* Palavras que sobem por trás de uma máscara (reveal clássico de AE).
     palavras: [{txt, t, cor?, peso?}] · T = tempo atual. */
  MG.linhaPalavras = (ctx, palavras, x, y, T, o = {}) => {
    const tam = o.tam || 52;
    const peso = o.peso || 600;
    const fam = o.fam || 'texto';
    MG.fonte(ctx, tam, peso, fam);
    const espaco = ctx.measureText(' ').width;
    const medidas = palavras.map(w => {
      MG.fonte(ctx, tam, w.peso || peso, fam);
      return ctx.measureText(w.txt).width;
    });
    const total = medidas.reduce((a, b) => a + b, 0) + espaco * (palavras.length - 1);
    let cx = (o.alinh || 'center') === 'center' ? x - total / 2 : x;
    const dur = o.dur || 0.45;
    ctx.save();
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    palavras.forEach((w, i) => {
      const k = MG.anim(T, w.t, w.t + dur, E.outExpo);
      if (k > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(cx - 10, y - tam * 1.05, medidas[i] + 24, tam * 1.4);
        ctx.clip();
        MG.fonte(ctx, tam, w.peso || peso, fam);
        ctx.globalAlpha = (o.alpha === undefined ? 1 : o.alpha) * Math.min(1, k * 1.5);
        const cor = w.cor || o.cor || C.branco;
        if (w.brilho || o.brilho) {
          ctx.shadowColor = MG.rgba(cor, 0.85);
          ctx.shadowBlur = tam * 0.45 * (1 + 1.5 * (1 - MG.anim(T, w.t, w.t + 1.2)));
        }
        ctx.fillStyle = cor;
        ctx.fillText(w.txt, cx, y + (1 - k) * tam * 1.1);
        ctx.restore();
      }
      cx += medidas[i] + espaco;
    });
    ctx.restore();
    return total;
  };

  /* ---------------- Imagens (fotos de participantes, personagens, logos) ---------------- */
  CX.imagens = CX.imagens || {};
  MG.img = chave => {
    const im = CX.imagens[chave];
    return im && im.complete && im.naturalWidth ? im : null;
  };

  // Foto em recorte circular, com aro de luz. Sem foto: espaço reservado elegante.
  MG.fotoCirculo = (ctx, img, x, y, r, o = {}) => {
    const aro = o.aro || C.ambar;
    ctx.save();
    if (img) {
      ctx.save();
      MG.circulo(ctx, x, y, r);
      ctx.clip();
      const s = Math.max((r * 2) / img.naturalWidth, (r * 2) / img.naturalHeight);
      const w = img.naturalWidth * s, h = img.naturalHeight * s;
      ctx.drawImage(img, x - w / 2, y - h / 2, w, h);
      if (o.tinta) {
        ctx.fillStyle = o.tinta;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }
      ctx.restore();
    } else {
      // placeholder: fundo azul profundo + silhueta + tracejado
      const g = ctx.createLinearGradient(x, y - r, x, y + r);
      g.addColorStop(0, MG.rgba(C.fundo2, 1));
      g.addColorStop(1, MG.rgba('#132449', 1));
      ctx.fillStyle = g;
      MG.circulo(ctx, x, y, r);
      ctx.fill();
      ctx.save();
      MG.circulo(ctx, x, y, r);
      ctx.clip();
      ctx.fillStyle = MG.rgba(o.corSilhueta || C.ciano, 0.22);
      MG.circulo(ctx, x, y - r * 0.18, r * 0.34);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x, y + r * 0.72, r * 0.62, r * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      if (o.rotulo) {
        MG.texto(ctx, o.rotulo, x, y + r * 0.58, { tam: Math.max(10, r * 0.2), peso: 500, fam: 'mono', cor: MG.rgba(C.gelo, 0.55) });
      }
      ctx.setLineDash([r * 0.12, r * 0.1]);
      ctx.strokeStyle = MG.rgba(aro, 0.55);
      ctx.lineWidth = Math.max(1.5, r * 0.035);
      MG.circulo(ctx, x, y, r * 0.93);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    // aro de luz
    ctx.lineWidth = Math.max(2, r * 0.06);
    ctx.strokeStyle = aro;
    ctx.shadowColor = aro;
    ctx.shadowBlur = r * 0.35 * (o.brilho === undefined ? 1 : o.brilho);
    MG.circulo(ctx, x, y, r);
    ctx.stroke();
    ctx.restore();
  };

  /* ---------------- Personagens (flat, sem rosto, com espaço para foto) ----------------
     o = {
       chave: 'gestor' (busca a foto em CX.imagens['personagem:gestor']),
       pele, cabelo, estilo ('curto'|'coque'|'longo'|'cacheado'|'careca'|'raspado'), roupa,
       pose: 'neutra'|'cruzados'|'levantado'|'testa'|'gesto'|'apontar'|'aceno'|'digitando',
       t (tempo local p/ animar), inclina (rad), cabeca (rad), aceno (0..1),
       frio (0..1: dessatura para o Cenário 1), aro (cor do aro quando há foto), luzContorno
     } */
  const PELES = ['#F2CBA8', '#D9A47C', '#B97E57', '#8E5B3C', '#5F3D29'];
  const CABELOS = ['#1B1410', '#3A2618', '#6B4426', '#9C9A98', '#2A1B12'];
  MG.PELES = PELES;
  MG.CABELOS = CABELOS;

  MG.personagem = (ctx, x, y, s, o = {}) => {
    const frio = o.frio || 0;
    const cf = c => (frio > 0 ? MG.frio(c, frio) : c);
    const pele = cf(o.pele || PELES[1]);
    const cabelo = cf(o.cabelo || CABELOS[0]);
    const roupa = cf(o.roupa || '#2B4C8C');
    const t = o.t || 0;
    const foto = o.chave ? MG.img('personagem:' + o.chave) : null;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.rotate(o.inclina || 0);

    // respiração sutil (nunca estático)
    const resp = Math.sin(t * 2.1 + (o.fase || 0)) * 1.2;

    // ---- braço de trás (atrás do tronco)
    const pose = o.pose || 'neutra';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // ---- tronco
    ctx.fillStyle = roupa;
    ctx.beginPath();
    ctx.moveTo(-62, 120);
    ctx.bezierCurveTo(-64, 40, -52, 8 + resp, -20, 0 + resp);
    ctx.lineTo(20, 0 + resp);
    ctx.bezierCurveTo(52, 8 + resp, 64, 40, 62, 120);
    ctx.closePath();
    ctx.fill();
    // gola
    ctx.fillStyle = cf('#E9EEF6');
    ctx.beginPath();
    ctx.moveTo(-13, 0 + resp);
    ctx.lineTo(0, 16 + resp);
    ctx.lineTo(13, 0 + resp);
    ctx.closePath();
    ctx.globalAlpha = 0.85;
    ctx.fill();
    ctx.globalAlpha = 1;
    // pescoço
    ctx.fillStyle = pele;
    ctx.fillRect(-8, -14 + resp, 16, 16);

    // ---- braços
    const braco = (pts, cor) => {
      ctx.strokeStyle = cor;
      ctx.lineWidth = 20;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.stroke();
      const m = pts[pts.length - 1];
      ctx.fillStyle = pele;
      MG.circulo(ctx, m[0], m[1], 10);
      ctx.fill();
    };
    const ombroE = [-46, 22 + resp], ombroD = [46, 22 + resp];
    const k = o.aceno === undefined ? 1 : o.aceno;
    if (pose === 'cruzados') {
      braco([ombroE, [-40, 70], [24, 66]], roupa);
      braco([ombroD, [40, 62], [-22, 74]], cf(sombra(o.roupa || '#2B4C8C')));
    } else if (pose === 'levantado') {
      const sobe = k;
      braco([ombroD, [lerp(58, 66, sobe), lerp(70, -30, sobe)], [lerp(52, 70, sobe), lerp(110, -110 + Math.sin(t * 6) * 4, sobe)]], roupa);
    } else if (pose === 'testa') {
      braco([ombroD, [lerp(58, 44, k), lerp(80, 30, k)], [lerp(50, 14, k), lerp(115, -66, k)]], roupa);
    } else if (pose === 'gesto') {
      const g = Math.sin(t * 3.2 + (o.fase || 0));
      braco([ombroD, [74, 60], [lerp(100, 120, 0.5 + 0.5 * g), 30 + g * 14]], roupa);
    } else if (pose === 'apontar') {
      braco([ombroD, [86, 30], [126 * k + 40 * (1 - k), lerp(100, 6, k)]], roupa);
    } else if (pose === 'digitando') {
      const g = Math.sin(t * 14) * 3;
      braco([ombroE, [-50, 80], [-20, 104 + g]], roupa);
      braco([ombroD, [50, 80], [22, 104 - g]], roupa);
    }

    // ---- cabeça (inclinação + aceno)
    ctx.save();
    const acenoY = (o.acenar ? Math.max(0, Math.sin(t * 4.2 + (o.fase || 0))) * 6 : 0);
    ctx.translate(0, -48 + resp + acenoY);
    ctx.rotate(o.cabeca || 0);
    if (foto) {
      MG.fotoCirculo(ctx, foto, 0, 0, 46, { aro: o.aro || C.ambar, brilho: 0.6, tinta: frio > 0 ? `rgba(40,55,75,${0.35 * frio})` : null });
    } else {
      cabeloAtras(ctx, o.estilo, cabelo);
      ctx.fillStyle = pele;
      ctx.beginPath();
      ctx.ellipse(0, 0, 34, 39, 0, 0, Math.PI * 2);
      ctx.fill();
      // orelhas
      MG.circulo(ctx, -33, 4, 7);
      ctx.fill();
      MG.circulo(ctx, 33, 4, 7);
      ctx.fill();
      cabeloFrente(ctx, o.estilo, cabelo);
      // sombra lateral (volume)
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(0, 0, 34, 39, 0, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = 'rgba(0,0,0,0.13)';
      ctx.beginPath();
      ctx.ellipse(22, 6, 22, 44, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    // luz de contorno (rim light)
    if (o.luzContorno) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = MG.rgba(o.luzContorno, 0.55);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-62, 120);
      ctx.bezierCurveTo(-64, 40, -52, 8 + resp, -20, 0 + resp);
      ctx.stroke();
      if (!foto) {
        ctx.beginPath();
        ctx.ellipse(0, -48 + resp + acenoY, 36, 41, 0, Math.PI * 0.75, Math.PI * 1.35);
        ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
  };

  function sombra(hex) {
    const [r, g, b] = rgb(hex);
    return '#' + [r, g, b].map(v => Math.max(0, Math.round(v * 0.78)).toString(16).padStart(2, '0')).join('');
  }

  function cabeloAtras(ctx, estilo, cor) {
    ctx.fillStyle = cor;
    if (estilo === 'longo') {
      ctx.beginPath();
      ctx.moveTo(-40, -6);
      ctx.bezierCurveTo(-48, 30, -44, 62, -30, 74);
      ctx.lineTo(30, 74);
      ctx.bezierCurveTo(44, 62, 48, 30, 40, -6);
      ctx.closePath();
      ctx.fill();
    } else if (estilo === 'cacheado') {
      for (let i = 0; i < 9; i++) {
        const a = Math.PI + (i / 8) * Math.PI;
        MG.circulo(ctx, Math.cos(a) * 36, Math.sin(a) * 36 + 2, 17);
        ctx.fill();
      }
      MG.circulo(ctx, -38, 12, 14);
      ctx.fill();
      MG.circulo(ctx, 38, 12, 14);
      ctx.fill();
    } else if (estilo === 'coque') {
      MG.circulo(ctx, 0, -46, 17);
      ctx.fill();
    }
  }
  function cabeloFrente(ctx, estilo, cor) {
    ctx.fillStyle = cor;
    if (estilo === 'careca') return;
    if (estilo === 'raspado') {
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.ellipse(0, -12, 34, 28, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      return;
    }
    ctx.beginPath();
    if (estilo === 'longo' || estilo === 'coque') {
      ctx.moveTo(-36, 4);
      ctx.bezierCurveTo(-38, -40, 30, -52, 37, -2);
      ctx.bezierCurveTo(22, -26, -8, -24, -36, 4);
    } else if (estilo === 'cacheado') {
      ctx.moveTo(-34, -4);
      ctx.bezierCurveTo(-30, -44, 30, -44, 34, -4);
      ctx.bezierCurveTo(14, -20, -14, -20, -34, -4);
    } else {
      // curto
      ctx.moveTo(-35, 2);
      ctx.bezierCurveTo(-40, -42, 34, -52, 36, -4);
      ctx.bezierCurveTo(30, -20, 6, -28, -16, -22);
      ctx.bezierCurveTo(-26, -18, -32, -8, -35, 2);
    }
    ctx.fill();
  }

  // Silhueta de corpo inteiro (para cenas amplas), recortada contra a luz
  MG.silhueta = (ctx, x, y, alt, o = {}) => {
    const s = alt / 300;
    const cor = o.cor || '#0B1428';
    const t = o.t || 0;
    const sway = Math.sin(t * 1.6 + (o.fase || 0)) * 2;
    const corpo = () => {
      ctx.beginPath();
      // pernas
      ctx.moveTo(-20, 0);
      ctx.lineTo(-17, -118);
      ctx.lineTo(17, -118);
      ctx.lineTo(20, 0);
      ctx.lineTo(4, 0);
      ctx.lineTo(0, -92);
      ctx.lineTo(-4, 0);
      ctx.closePath();
      // tronco com ombros
      ctx.moveTo(-30 + sway * 0.2, -112);
      ctx.bezierCurveTo(-34, -170, -48, -222, -40 + sway * 0.3, -238);
      ctx.quadraticCurveTo(-30 + sway * 0.4, -250, -10 + sway * 0.5, -252);
      ctx.lineTo(10 + sway * 0.5, -252);
      ctx.quadraticCurveTo(30 + sway * 0.4, -250, 40 + sway * 0.3, -238);
      ctx.bezierCurveTo(48, -222, 34, -170, 30 + sway * 0.2, -112);
      ctx.closePath();
      // pescoço e cabeça
      ctx.rect(-7 + sway * 0.55, -262, 14, 14);
      ctx.moveTo(sway * 0.6 + 21, -280);
      ctx.ellipse(sway * 0.6, -280, 21, 25, 0, 0, Math.PI * 2);
    };
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = cor;
    corpo();
    ctx.fill();
    if (o.luz) {
      // luz de contorno (rim light) só de um lado: traço deslocado e recortado pela silhueta
      ctx.save();
      corpo();
      ctx.clip();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = MG.rgba(o.luz, o.luzA === undefined ? 0.6 : o.luzA);
      ctx.lineWidth = 4;
      ctx.translate(-6, 3);
      corpo();
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  };

  // Ícone de pessoa (para infográficos: "3 em cada 10")
  MG.iconePessoa = (ctx, x, y, s, cor, a = 1) => {
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.fillStyle = cor;
    MG.circulo(ctx, x, y - s * 0.62, s * 0.24);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - s * 0.38, y + s * 0.5);
    ctx.bezierCurveTo(x - s * 0.4, y - s * 0.1, x - s * 0.28, y - s * 0.3, x, y - s * 0.3);
    ctx.bezierCurveTo(x + s * 0.28, y - s * 0.3, x + s * 0.4, y - s * 0.1, x + s * 0.38, y + s * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  /* ---------------- Redes de luz ---------------- */
  // Gera nós espalhados (com distância mínima) e arestas para os k vizinhos mais próximos.
  MG.gerarRede = (seed, n, x0, y0, x1, y1, k = 3, dmin = 40) => {
    const r = MG.rng(seed);
    const nos = [];
    let tent = 0;
    while (nos.length < n && tent < n * 60) {
      tent++;
      const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0);
      if (nos.some(p => Math.hypot(p.x - x, p.y - y) < dmin)) continue;
      nos.push({ x, y, fase: r() * Math.PI * 2, tam: 0.6 + r() * 0.8, sorte: r() });
    }
    const arestas = [];
    const vistos = new Set();
    nos.forEach((p, i) => {
      const viz = nos.map((q, j) => [j, Math.hypot(p.x - q.x, p.y - q.y)]).filter(v => v[0] !== i).sort((a, b) => a[1] - b[1]).slice(0, k);
      viz.forEach(([j, d]) => {
        const key = i < j ? i + '-' + j : j + '-' + i;
        if (!vistos.has(key)) {
          vistos.add(key);
          arestas.push([i, j, d]);
        }
      });
    });
    return { nos, arestas };
  };

  /* ---------------- Mapa do Brasil ---------------- */
  MG.projBrasil = (cx, cy, escala) => (lon, lat) => [cx + (lon + 52.5) * escala * 0.97, cy - (lat + 14.5) * escala];

  MG.dentroPoligono = (x, y, pts) => {
    let dentro = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) dentro = !dentro;
    }
    return dentro;
  };

  MG.cidadesBrasil = [
    ['São Paulo', -46.63, -23.55, 1], ['Rio de Janeiro', -43.2, -22.9, 1], ['Belo Horizonte', -43.94, -19.92, 0.9],
    ['Brasília', -47.88, -15.79, 0.9], ['Salvador', -38.5, -12.97, 0.85], ['Recife', -34.88, -8.05, 0.85],
    ['Fortaleza', -38.54, -3.72, 0.85], ['Manaus', -60.02, -3.12, 0.8], ['Belém', -48.5, -1.46, 0.8],
    ['Porto Alegre', -51.23, -30.03, 0.85], ['Curitiba', -49.27, -25.43, 0.85], ['Goiânia', -49.25, -16.68, 0.7],
    ['Florianópolis', -48.55, -27.6, 0.6], ['Campo Grande', -54.62, -20.47, 0.6], ['Cuiabá', -56.1, -15.6, 0.6],
    ['Natal', -35.2, -5.79, 0.6], ['João Pessoa', -34.86, -7.12, 0.55], ['Maceió', -35.73, -9.67, 0.55],
    ['Aracaju', -37.07, -10.91, 0.5], ['Teresina', -42.8, -5.09, 0.55], ['São Luís', -44.3, -2.53, 0.6],
    ['Palmas', -48.33, -10.18, 0.45], ['Porto Velho', -63.9, -8.76, 0.5], ['Rio Branco', -67.81, -9.97, 0.45],
    ['Boa Vista', -60.67, 2.82, 0.4], ['Macapá', -51.07, 0.03, 0.4], ['Vitória', -40.3, -20.32, 0.6],
    ['Altamira', -52.2, -3.2, 0.35], ['Foz do Iguaçu', -54.59, -25.43, 0.45], ['Tucuruí', -49.67, -3.77, 0.35],
    ['Paulo Afonso', -38.21, -9.4, 0.35], ['Imperatriz', -47.49, -5.52, 0.4], ['Uberlândia', -48.28, -18.92, 0.5],
    ['Ribeirão Preto', -47.81, -21.18, 0.5], ['Londrina', -51.16, -23.31, 0.5], ['Montes Claros', -43.86, -16.73, 0.4],
    ['Barreiras', -45.0, -12.15, 0.35], ['Santarém', -54.7, -2.44, 0.35], ['Juazeiro', -40.5, -9.4, 0.35],
    ['Campina Grande', -35.88, -7.23, 0.4], ['Feira de Santana', -38.97, -12.27, 0.45], ['Sinop', -55.5, -11.86, 0.35],
    ['Marabá', -49.1, -5.37, 0.35], ['Vilhena', -60.13, -12.74, 0.3], ['Chapecó', -52.6, -27.1, 0.4],
    ['Pelotas', -52.34, -31.77, 0.4], ['Corumbá', -57.65, -19.0, 0.3]
  ];
})();
