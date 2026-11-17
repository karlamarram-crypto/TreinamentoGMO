// =============================================================================
// Vídeo de abertura · Gestão da Mudança na Prática (ONS)
// Fonte da verdade de tempos, cores e fontes.
// Para ressincronizar com a locução, ajuste "duracao" de cada cena (em segundos).
// v2: ~20% mais rápido (1:38), locução 1,2x, trilha 120 BPM com drop na reconexão (0:45).
// =============================================================================
import {LOCUCAO} from './locucao.ts';

export const FPS = 30;
export const LARGURA = 1920;
export const ALTURA = 1080;

export const CORES = {
  marinho: '#002A46',
  marinho2: '#33546D',
  aco: '#5E8AB3',
  cinzaAzulado: '#99AAB6',
  cinzaClaro: '#CCD4DA',
  branco: '#FFFFFF',
  laranja: '#F78B15',
  laranjaBrilho: '#F8A345',
};

export const FONTE = 'Arial, Helvetica, "Liberation Sans", sans-serif';

export const AREA_SEGURA = {x: 96, y: 72};

export const LEGENDA = {
  tamanho: 30,
  distanciaBase: 64,
  fundo: 'rgba(0, 42, 70, 0.7)',
  larguraMax: 1320,
};

// Áudio (arquivos em assets/)
export const AUDIO = {
  locucao: 'locucao.mp3', // locução num arquivo único (opcional; a v2 usa um arquivo por cena)
  locucaoDir: 'locucao/rapida', // um MP3 por cena, acelerado 1,2x (ffmpeg atempo)
  trilha: 'trilha.wav',
  duckingDb: -10, // trilha cai ~10 dB sob a voz
  sfxDb: -6, // efeitos abaixo da voz
};

// Grade musical: 120 BPM, compassos começam em 1,0 s. O drop cai na reconexão da Cena 5.
export const MUSICA = {bpm: 120, origem: 1.0, drop: 45.0, corteRiser: 38.0, silencio: 0.3};
export const BATIDA = 60 / MUSICA.bpm;
// Marcos locais usados pela trilha e pelas cenas
export const MARCAS = {falhaC3: 8.2, resultadoC3: 11.4};

// ---------- tempos da v2 compartilhados entre cenas e efeitos sonoros (globais, em s) ----------
// Cena 4: cada card entra no beat, durante a frase da lista
export const tempoCardsC4 = (): number[] => {
  const i = 3, base = inicioCena(i), fr = frasesCena(i)[1];
  return [0, 1, 2, 3].map((k) => naBatida(base + fr.ini + ((fr.fim - fr.ini) * k) / 4, 2));
};
// Cena 4: troca de imagem (clipes de 0,5 a 2 s, acelerando com o riser até o corte)
export const montagemC4 = (): {t: number; nome: string}[] => {
  const base = inicioCena(3), c = tempoCardsC4();
  const nomes = ['reuniao', 'normas', 'sistema', 'sala_controle'];
  return [
    {t: base, nome: 'sala_controle'}, {t: base + 1.5, nome: 'sistema'},
    ...c.map((t, k) => ({t, nome: nomes[k]})),
    {t: MUSICA.corteRiser - 1.5, nome: 'reuniao'}, {t: MUSICA.corteRiser - 1.0, nome: 'normas'},
    {t: MUSICA.corteRiser - 0.5, nome: 'sistema'}, {t: MUSICA.corteRiser - 0.25, nome: 'sala_controle'},
  ];
};
// Cena 5: silhuetas acendem uma a uma, em colcheias, logo depois do drop
export const N_SILHUETAS = 9;
export const tempoSilhuetasC5 = (): number[] => Array.from({length: N_SILHUETAS}, (_, k) => MUSICA.drop + 0.5 + k * 0.25);

// ---------- efeitos sonoros (assets/sfx/*.wav), em tempo global ----------
export type Som = {t: number; arquivo: string; db?: number};
export const SONS = (): Som[] => [
  // Cena 4: whoosh curto em cada card; riser até o corte seco
  ...tempoCardsC4().map((t) => ({t: t - 0.05, arquivo: 'whoosh_curto.wav', db: -8})),
  {t: MUSICA.corteRiser - 9.6, arquivo: 'riser.wav', db: -6},
  // Cena 5: na reconexão, estalo forte + power-up; um clique por silhueta que acende
  {t: MUSICA.drop - 0.04, arquivo: 'estalo_powerup.wav', db: -3},
  ...tempoSilhuetasC5().map((t) => ({t, arquivo: 'clique_luz.wav', db: -9})),
];
// arredonda um instante (global) para a batida (ou subdivisão) mais próxima
export const naBatida = (t: number, sub = 1) => {
  const p = BATIDA / sub;
  return MUSICA.origem + Math.round((t - MUSICA.origem) / p) * p;
};

export type Cena = {
  id: string;
  titulo: string;
  duracao: number; // segundos
  loc: string; // locução = legenda
  still: number; // segundo (local) usado no still de revisão
  fimLegenda?: number; // segundos livres no fim da cena sem legenda
};

export const CENAS: Cena[] = [
  {
    id: 'Cena01',
    titulo: 'A energia',
    duracao: 7,
    still: 4.0,
    loc: 'Todos os dias, a energia percorre milhares de quilômetros pelo Sistema Interligado Nacional.',
  },
  {
    id: 'Cena02',
    titulo: 'Só vira valor quando chega',
    duracao: 7,
    still: 6.5,
    loc: 'E ela só vira valor quando chega à carga. Na casa, na indústria, no hospital.',
  },
  {
    id: 'Cena03',
    titulo: 'Projeto entregue. Resultado?',
    duracao: 14,
    still: 13.4,
    loc: 'Com projetos acontece o mesmo. A solução fica pronta. O sistema entra no ar. O projeto é entregue. Mas, se as pessoas continuam trabalhando do jeito antigo, o resultado não chega.',
  },
  {
    id: 'Cena04',
    titulo: 'Tudo ao mesmo tempo',
    duracao: 10,
    still: 9.6,
    loc: 'E no ONS as mudanças não chegam uma de cada vez. Reorganizações, novas regras do setor, novos sistemas, novas formas de trabalhar. Tudo ao mesmo tempo.',
  },
  {
    id: 'Cena05',
    titulo: 'A virada: a transmissão',
    duracao: 14,
    still: 13.0,
    loc: 'Nenhum projeto termina no go-live. Ele termina no dia em que as pessoas deixam de trabalhar do jeito antigo. A gestão da mudança é a transmissão: o que leva a solução até as pessoas.',
  },
  {
    id: 'Cena06',
    titulo: 'Vocês são a rede',
    duracao: 16,
    still: 15.4,
    loc: 'E toda transmissão precisa de uma rede. Gestão de Pessoas. Inovação e Transformação. Comunicação Interna. Relacionamento com Agentes. Quatro frentes, uma mesma rede.',
  },
  {
    id: 'Cena07',
    titulo: 'A jornada',
    duracao: 16,
    still: 15.4,
    loc: 'Nos próximos três dias, vocês saem do lugar de quem vive a mudança para o lugar de quem conduz. Entender. Conduzir. Construir. E, depois, multiplicar.',
  },
  {
    id: 'Cena08',
    titulo: 'Fechamento',
    duracao: 14,
    still: 13.9,
    fimLegenda: 2.4, // os 2 últimos segundos são o frame parado (poster), sem legenda
    loc: 'A energia já está aqui. Agora é fazer chegar. Bem-vindos à Gestão da Mudança na Prática.',
  },
];

// Deslocamentos de fala: a partir da frase "frase", a locução da cena começa em "inicio" (local, s).
// Cena 5: a 3ª frase entra depois do drop, para a reconexão (0:45) acontecer sem voz por cima.
export const AJUSTE_FALA: Record<string, {frase: number; inicio: number}> = {Cena05: {frase: 2, inicio: 8.0}};

export const falaAjustada = (id: string) => {
  const real = LOCUCAO[id];
  const aj = AJUSTE_FALA[id];
  if (!real || !aj || !real.frases[aj.frase]) return real;
  const delta = aj.inicio - real.frases[aj.frase][0];
  return {...real, frases: real.frases.map(([a, b], k) => (k >= aj.frase ? [a + delta, b + delta] : [a, b]) as [number, number])};
};

// ---------- tempos derivados ----------
export const quadros = (s: number) => Math.round(s * FPS);
export const inicioCena = (i: number) => CENAS.slice(0, i).reduce((a, c) => a + c.duracao, 0);
export const DURACAO_TOTAL = CENAS.reduce((a, c) => a + c.duracao, 0);

// Frases da locução de uma cena, com início/fim locais (s), distribuídas pelo tamanho do texto.
// Com locução (assets/locucao/cenaXX.mp3 + scripts/sincronizar-locucao.mjs), usa os tempos reais.
export type Frase = {texto: string; ini: number; fim: number};
export const frasesDe = (texto: string) => texto.split(/(?<=[.?!])\s+/).filter(Boolean);

export const frasesCena = (i: number): Frase[] => {
  const c = CENAS[i];
  const fr = frasesDe(c.loc);
  // com locução gravada: tempos reais de cada frase (src/locucao.ts), com os deslocamentos de AJUSTE_FALA
  const real = falaAjustada(c.id);
  if (real && real.frases.length === fr.length) {
    return fr.map((texto, k) => {
      const prox = real.frases[k + 1];
      const fim = Math.min(prox ? prox[0] : c.duracao - (c.fimLegenda ?? 0.3), real.frases[k][1] + 0.6);
      return {texto, ini: real.frases[k][0], fim};
    });
  }
  const ini = 0.35;
  const fim = c.duracao - (c.fimLegenda ?? 0.4);
  const pesos = fr.map((f) => f.length + 10);
  const total = pesos.reduce((a, b) => a + b, 0);
  let t = ini;
  return fr.map((texto, k) => {
    const d = ((fim - ini) * pesos[k]) / total;
    const r = {texto, ini: t, fim: t + d};
    t += d;
    return r;
  });
};

// Legendas (tempo global). Frases muito curtas em sequência viram uma legenda só.
export const legendas = (): Frase[] => {
  const out: Frase[] = [];
  CENAS.forEach((_, i) => {
    const base = inicioCena(i);
    let atual: (Frase & {primeira: number}) | null = null;
    for (const f of frasesCena(i)) {
      if (atual && f.texto.length <= 30 && atual.primeira <= 30 && atual.texto.length + f.texto.length < 58) {
        atual.texto += ' ' + f.texto;
        atual.fim = base + f.fim;
      } else {
        if (atual) out.push({texto: atual.texto, ini: atual.ini, fim: atual.fim});
        atual = {texto: f.texto, ini: base + f.ini, fim: base + f.fim, primeira: f.texto.length};
      }
    }
    if (atual) out.push({texto: atual.texto, ini: atual.ini, fim: atual.fim});
  });
  return out;
};
