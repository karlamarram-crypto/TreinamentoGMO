/* ==========================================================================
   CONECTADOS · BASE DAS CENAS
   Registro das 16 cenas, marcos de tempo (CX.T) e efeitos sonoros (CX.sons).
   ========================================================================== */
(function () {
  'use strict';
  const CX = window.CX;
  const MG = CX.MG;

  CX.cenas = {
    porId: {},
    definir(id, def) {
      const meta = CX.roteiro.cenas.find(c => c.id === id);
      this.porId[id] = Object.assign({}, meta, def);
    },
    lista() {
      return CX.roteiro.cenas.map(c => this.porId[c.id]).filter(Boolean);
    },
    // Desenha outra cena (usado em transições do tipo wipe)
    desenhar(id, ctx, lt, env) {
      const c = this.porId[id];
      if (c) c.desenhar(ctx, lt, c.ini + lt, env);
    },
    preparar() {
      CX.T = {};
      CX.sons = [];
      this.lista().forEach(c => c.preparar && c.preparar());
      this.lista().forEach(c => c.sons && c.sons());
      CX.sons.sort((a, b) => a.t - b.t);
    }
  };

  // Registra um efeito sonoro no instante t (segundos do vídeo)
  CX.som = (t, nome, o = {}, dur) => CX.sons.push({ t, nome, o, dur });

  /* Sincroniza palavras da tela com as palavras narradas.
     Palavras sem correspondência são interpoladas entre as vizinhas. */
  CX.sincronizar = (clipId, palavrasTela, iniReserva, passo = 0.28, aPartirDe = -1) => {
    const c = CX.voz.clipes[clipId];
    const res = palavrasTela.map(() => null);
    if (c) {
      let j = 0;
      // começa a procurar a partir de um instante (ex.: início da 2ª frase)
      while (aPartirDe > 0 && j < c.palavras.length && c.t + c.palavras[j].i < aPartirDe - 0.08) j++;
      palavrasTela.forEach((w, i) => {
        const alvo = CX.normalizar(w);
        if (!alvo) return;
        for (let k = j; k < c.palavras.length; k++) {
          const p = CX.normalizar(c.palavras[k].p);
          const pref = Math.min(4, alvo.length, p.length);
          if (p === alvo || (alvo.length > 3 && p.slice(0, pref) === alvo.slice(0, pref))) {
            res[i] = c.t + c.palavras[k].i;
            j = k + 1;
            break;
          }
        }
      });
    }
    // interpola faltantes
    for (let i = 0; i < res.length; i++) {
      if (res[i] !== null) continue;
      let a = i - 1;
      while (a >= 0 && res[a] === null) a--;
      let b = i + 1;
      while (b < res.length && res[b] === null) b++;
      if (a >= 0 && b < res.length) res[i] = res[a] + ((res[b] - res[a]) * (i - a)) / (b - a);
      else if (a >= 0) res[i] = res[a] + passo * (i - a);
      else if (b < res.length) res[i] = res[b] - passo * (b - i);
      else res[i] = iniReserva + passo * i;
    }
    return res;
  };

  // Helpers de câmera
  MG.camera = (ctx, escala = 1, cx = MG.W / 2, cy = MG.H / 2, dx = 0, dy = 0, rot = 0) => {
    ctx.translate(cx + dx, cy + dy);
    ctx.rotate(rot);
    ctx.scale(escala, escala);
    ctx.translate(-cx, -cy);
  };

  // Rótulo de dado + fonte (cartela de estatística)
  MG.cartelaDado = (ctx, linhas, fonte, x, y, k, o = {}) => {
    if (k <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.min(1, k * 1.4);
    const dy = (1 - MG.E.outExpo(k)) * 30;
    linhas.forEach((l, i) => {
      MG.texto(ctx, l.txt, x, y + i * (o.entre || 58) + dy, {
        tam: l.tam || 44, peso: l.peso || 500, cor: l.cor || MG.cor.branco, alinh: o.alinh || 'center', fam: l.fam || 'texto', brilho: l.brilho
      });
    });
    if (fonte) {
      MG.texto(ctx, fonte, x, y + linhas.length * (o.entre || 58) + 6 + dy, {
        tam: 18, peso: 400, fam: 'mono', cor: MG.rgba(MG.cor.gelo, 0.55), alinh: o.alinh || 'center', esp: 1
      });
    }
    ctx.restore();
  };

  // Etiqueta pequena em caixa alta (estilo "lower third")
  MG.etiqueta = (ctx, txt, x, y, k, cor = MG.cor.gelo, o = {}) => {
    if (k <= 0) return;
    ctx.save();
    MG.fonte(ctx, o.tam || 18, 500, 'mono');
    const esp = 2.5;
    const w = MG.medir(ctx, txt, esp) + 28;
    const h = (o.tam || 18) + 16;
    const kk = MG.E.outExpo(Math.min(1, k));
    const xx = o.alinh === 'left' ? x : x - w / 2;
    ctx.globalAlpha = Math.min(1, k * 2);
    ctx.save();
    ctx.beginPath();
    ctx.rect(xx - 2, y - h / 2 - 2, (w + 4) * kk, h + 4);
    ctx.clip();
    ctx.fillStyle = MG.rgba(o.fundo || '#0B1633', o.fundoA === undefined ? 0.75 : o.fundoA);
    MG.retArred(ctx, xx, y - h / 2, w, h, h / 2);
    ctx.fill();
    ctx.strokeStyle = MG.rgba(cor, 0.6);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    MG.texto(ctx, txt, xx + 14, y + 1, { tam: o.tam || 18, peso: 500, fam: 'mono', cor, alinh: 'left', esp });
    ctx.restore();
    ctx.restore();
  };

  // Palavra-chave grande em caixa alta, com máscara deslizante e sublinhado (kinetic type)
  MG.titulo = (ctx, txt, x, y, t, t0, o = {}) => {
    const k = MG.anim(t, t0, t0 + 0.55, MG.E.outExpo);
    if (k <= 0) return;
    const sai = o.sai ? MG.anim(t, o.sai, o.sai + 0.35, MG.E.inC) : 0;
    const tam = o.tam || 64;
    ctx.save();
    MG.fonte(ctx, tam, o.peso || 800, 'display');
    const esp = o.esp === undefined ? 3 : o.esp;
    const w = MG.medir(ctx, txt, esp);
    const xx = o.alinh === 'left' ? x : x - w / 2;
    ctx.beginPath();
    ctx.rect(xx - 20, y - tam, w + 40, tam * 1.6);
    ctx.clip();
    const dy = (1 - k) * tam * 1.2 - sai * tam * 1.3;
    MG.texto(ctx, txt, xx, y + dy, { tam, peso: o.peso || 800, fam: 'display', cor: o.cor || MG.cor.branco, alinh: 'left', esp, brilho: o.brilho, brilhoR: tam * 0.4 });
    ctx.restore();
    // sublinhado (trim path)
    if (o.linha !== false) {
      const kl = MG.anim(t, t0 + 0.15, t0 + 0.75, MG.E.ioExpo) * (1 - sai);
      ctx.save();
      ctx.strokeStyle = o.corLinha || MG.cor.azul;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.shadowColor = o.corLinha || MG.cor.azul;
      ctx.shadowBlur = 12;
      const ly = y + tam * 0.62;
      ctx.beginPath();
      ctx.moveTo(xx, ly);
      ctx.lineTo(xx + Math.min(w, 140) * kl, ly);
      ctx.stroke();
      ctx.restore();
    }
  };
})();
