/* ==========================================================================
   CONECTADOS · ROTEIRO (tempos, cenas, narração)
   Fonte: "Roteiro do vídeo de abertura · Gestão da Mudança na Prática".
   Os tempos de cada cena seguem a folha de produção (total 2min56s).
   ========================================================================== */
window.CX = window.CX || {};

CX.roteiro = {
  duracao: 176,

  partes: [
    { id: 'abertura', nome: 'Abertura',                              ini: 0,   fim: 7 },
    { id: 'p1',       nome: 'A transformação é inevitável',          ini: 7,   fim: 46 },
    { id: 'p2',       nome: 'O custo de não gerenciar mudanças',     ini: 46,  fim: 98 },
    { id: 'p3',       nome: 'Vocês são os protagonistas',            ini: 98,  fim: 134 },
    { id: 'p4',       nome: 'Convite para a imersão',                ini: 134, fim: 176 }
  ],

  cenas: [
    { id: 'C01', nome: 'A faísca',                           ini: 0,   fim: 7 },
    { id: 'C02', nome: 'Velocidade',                         ini: 7,   fim: 14 },
    { id: 'C03', nome: 'Evolução tecnológica',               ini: 14,  fim: 22 },
    { id: 'C04', nome: 'Novas formas de trabalho',           ini: 22,  fim: 32 },
    { id: 'C05', nome: 'A mensagem central',                 ini: 32,  fim: 46 },
    { id: 'C06', nome: 'Dois caminhos',                      ini: 46,  fim: 51 },
    { id: 'C07', nome: 'Cenário 1: sem gestão da mudança',   ini: 51,  fim: 70 },
    { id: 'C08', nome: 'Cenário 2: com gestão da mudança',   ini: 70,  fim: 88 },
    { id: 'C09', nome: 'Pessoas entregam resultados',        ini: 88,  fim: 98 },
    { id: 'C10', nome: 'Os pontos de luz são pessoas',       ini: 98,  fim: 106 },
    { id: 'C11', nome: 'Os participantes',                   ini: 106, fim: 126 },
    { id: 'C12', nome: 'A rede conectada',                   ini: 126, fim: 134 },
    { id: 'C13', nome: 'Bem-vindos à jornada',               ini: 134, fim: 146 },
    { id: 'C14', nome: 'O que esperamos de vocês',           ini: 146, fim: 158 },
    { id: 'C15', nome: 'A frase final',                      ini: 158, fim: 168 },
    { id: 'C16', nome: 'Cartela final',                      ini: 168, fim: 176 }
  ],

  /* Narração: cada clipe é gerado separadamente na ElevenLabs.
     "t" = instante (em segundos do vídeo) em que o clipe começa.
     "pausas" = silêncio depois de cada frase ([p] = 0,5s · [P] = 1 a 1,5s). */
  narracao: [
    { id: 'c01',  cena: 'C01', t: 1.6,   frases: ['Toda transformação começa com uma faísca.'], pausas: [] },
    { id: 'c02',  cena: 'C02', t: 7.6,   frases: ['O mundo nunca mudou tão rápido.'], pausas: [] },
    { id: 'c03',  cena: 'C03', t: 14.6,  frases: ['O que levava décadas, hoje leva meses.'], pausas: [] },
    { id: 'c04',  cena: 'C04', t: 22.4,  frases: ['Novas tecnologias.', 'Novas formas de trabalhar.', 'Novas expectativas.', 'Um setor inteiro se reinventando.'], pausas: [0.5, 0.5, 0.5] },
    { id: 'c05',  cena: 'C05', t: 32.6,  frases: ['E, nesse cenário, as organizações que prosperam não são necessariamente as que mudam primeiro.', 'São aquelas que conseguem levar suas pessoas junto na mudança.'], pausas: [1.0] },
    { id: 'c06',  cena: 'C06', t: 47.2,  frases: ['Imagine o mesmo projeto.', 'Dois caminhos.'], pausas: [0.6] },
    { id: 'c07',  cena: 'C07', t: 51.6,  frases: ['No primeiro, a solução chega pronta.', 'Ninguém explica o porquê.', 'A dúvida vira resistência.', 'As pessoas voltam ao jeito antigo.', 'E os benefícios ficam no papel.', 'O projeto foi entregue.', 'A transformação, não.'], pausas: [0.5, 0.5, 0.5, 0.5, 1.0, 0.5] },
    { id: 'c08',  cena: 'C08', t: 70.6,  frases: ['No segundo, a liderança aparece.', 'Explica.', 'Escuta.', 'Envolve.', 'As pessoas entendem o porquê, se preparam e assumem a mudança como sua.', 'E o resultado se sustenta.'], pausas: [0.4, 0.35, 0.35, 0.5, 0.5] },
    { id: 'c09',  cena: 'C09', t: 89.0,  frases: ['A diferença nunca esteve na tecnologia.', 'Projetos entregam soluções.', 'Pessoas entregam resultados.'], pausas: [1.0, 0.5] },
    { id: 'c10',  cena: 'C10', t: 98.6,  frases: ['Por trás de toda transformação que dá certo, existem pessoas que decidiram fazer diferente.'], pausas: [] },
    { id: 'c11a', cena: 'C11', t: 106.4, frases: ['Pessoas como vocês.'], pausas: [] },
    // c11b = nome da empresa, narrado só quando config.empresa.nome estiver preenchido (gere com ferramentas/gerar-narracao.mjs)
    { id: 'c11b', cena: 'C11', t: 116.9, frases: ['{EMPRESA}.'], pausas: [], opcional: true },
    { id: 'c11c', cena: 'C11', t: 118.8, frases: ['Nos próximos dias, vocês não serão espectadores da mudança.', 'Serão agentes de transformação.'], pausas: [0.5] },
    { id: 'c12',  cena: 'C12', t: 126.4, frases: ['Cada um de vocês é um ponto de conexão.', 'E quando a rede se conecta...', 'a energia flui.'], pausas: [0.5, 0.8] },
    { id: 'c13',  cena: 'C13', t: 134.8, frases: ['Bem-vindos à jornada.', 'Serão três dias de aprendizado, troca de experiências e construção conjunta.'], pausas: [1.0] },
    { id: 'c14',  cena: 'C14', t: 146.4, frases: ['Tragam energia.', 'Curiosidade.', 'Participação.', 'Colaboração.', 'Porque o sucesso da transformação depende de cada um de nós.'], pausas: [0.45, 0.45, 0.45, 0.6] },
    { id: 'c15',  cena: 'C15', t: 160.3, frases: ['A mudança é inevitável.', 'Liderá-la é uma escolha.', 'E essa escolha começa agora.'], pausas: [1.2, 1.2] }
  ]
};

/* ---------------- Tempos da narração (reais ou estimados) ----------------
   Quando a narração da ElevenLabs existe (audio/narracao/dados.js), usamos o
   alinhamento palavra a palavra. Sem ela, estimamos pelo número de letras,
   para que legendas e animações continuem sincronizadas. */
(function () {
  const R = CX.roteiro;
  const SEG_POR_LETRA = 0.066;

  function textoFrase(f) {
    return f.replace('{EMPRESA}', (CX.config && CX.config.empresa && CX.config.empresa.nome) || '');
  }

  function palavrasDe(frase) {
    return frase.split(/\s+/).filter(Boolean);
  }

  function estimar(clip) {
    const palavras = [];
    const frasesIni = [];
    let t = 0;
    clip.frases.forEach((f, k) => {
      frasesIni.push(palavras.length);
      palavrasDe(textoFrase(f)).forEach(p => {
        const d = Math.max(0.18, p.length * SEG_POR_LETRA + 0.05);
        palavras.push({ p, i: t, f: t + d * 0.92, frase: k });
        t += d;
      });
      t += (clip.pausas[k] || 0) + 0.12;
    });
    return { dur: t, palavras, frasesIni, estimado: true };
  }

  // Monta a tabela de tempos usando dados reais quando existirem.
  CX.voz = {
    clipes: {},
    preparar() {
      const dados = (CX.narracaoDados && CX.narracaoDados.clipes) || {};
      const empresaDefinida = CX.config && CX.config.empresa && CX.config.empresa.nome && !/^\[.*\]$/.test(CX.config.empresa.nome.trim());
      R.narracao.forEach(c => {
        if (c.opcional && !(dados[c.id] || empresaDefinida)) return;
        const real = dados[c.id];
        let info;
        if (real && real.palavras && real.palavras.length) {
          // associa cada palavra real à sua frase
          const frasesIni = [];
          let idx = 0;
          c.frases.forEach(f => {
            frasesIni.push(idx);
            idx += palavrasDe(textoFrase(f)).length;
          });
          const palavras = real.palavras.map((w, n) => {
            let frase = 0;
            for (let k = 0; k < frasesIni.length; k++) if (n >= frasesIni[k]) frase = k;
            return { p: w.p, i: w.i, f: w.f, frase };
          });
          info = { dur: real.dur, palavras, frasesIni, estimado: false };
        } else {
          info = estimar(c);
        }
        info.id = c.id;
        info.t = (real && typeof real.t === 'number') ? real.t : c.t;
        info.frases = c.frases.map(textoFrase);
        info.temAudio = !!(CX.narracaoAudio && CX.narracaoAudio[c.id]);
        this.clipes[c.id] = info;
      });
    },
    // instante global (s) em que começa a frase k do clipe
    frase(id, k, reserva) {
      const c = this.clipes[id];
      if (!c) return reserva;
      const w = c.palavras[c.frasesIni[k]];
      return w ? c.t + w.i : reserva;
    },
    // instante global em que termina a frase k
    fimFrase(id, k, reserva) {
      const c = this.clipes[id];
      if (!c) return reserva;
      const ult = c.palavras.filter(w => w.frase === k).pop();
      return ult ? c.t + ult.f : reserva;
    },
    // instante global da n-ésima palavra que contém "trecho" (sem acento/caixa)
    palavra(id, trecho, reserva, ocorrencia = 0) {
      const c = this.clipes[id];
      if (!c) return reserva;
      const alvo = normalizar(trecho);
      let n = 0;
      for (const w of c.palavras) {
        if (normalizar(w.p).includes(alvo)) {
          if (n === ocorrencia) return c.t + w.i;
          n++;
        }
      }
      return reserva;
    },
    inicio(id, reserva) {
      const c = this.clipes[id];
      return c ? c.t : reserva;
    },
    fim(id, reserva) {
      const c = this.clipes[id];
      return c ? c.t + c.dur : reserva;
    },
    // trechos de fala (para abaixar a música durante a narração)
    trechos() {
      return Object.values(this.clipes).map(c => [c.t, c.t + c.dur]);
    },
    // legenda ativa no instante T
    legenda(T) {
      for (const c of Object.values(this.clipes)) {
        if (T < c.t - 0.05 || T > c.t + c.dur + 0.6) continue;
        const lt = T - c.t;
        let atual = -1;
        for (let k = 0; k < c.frases.length; k++) {
          const ini = c.palavras[c.frasesIni[k]];
          const ult = c.palavras.filter(w => w.frase === k).pop();
          if (!ini || !ult) continue;
          if (lt >= ini.i - 0.1 && lt <= ult.f + 0.7) atual = k;
        }
        if (atual >= 0) return c.frases[atual];
      }
      return '';
    }
  };

  function normalizar(s) {
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }
  CX.normalizar = normalizar;

  // Texto pronto para a ElevenLabs (com marcações de pausa)
  CX.textoTTS = function (clip) {
    return clip.frases.map((f, k) => {
      const p = clip.pausas[k];
      return textoFrase(f) + (p ? ` <break time="${p.toFixed(1)}s" />` : '');
    }).join(' ');
  };
})();
