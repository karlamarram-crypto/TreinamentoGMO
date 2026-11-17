// =============================================================================
// Vídeo de abertura · Gestão da Mudança na Prática (ONS)
// Fonte da verdade de tempos, cores e fontes.
// Para ressincronizar com a locução, ajuste "duracao" de cada cena (em segundos).
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

// Áudio opcional (arquivos em assets/). O script de render detecta se existem.
export const AUDIO = {
  locucao: 'locucao.mp3',
  trilha: 'trilha.mp3',
  trilhaDb: -20, // volume da trilha sob a locução
  fadeInTrilha: 2,
  fadeOutTrilha: 3,
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
    duracao: 9,
    still: 5.2,
    loc: 'Todos os dias, a energia percorre milhares de quilômetros pelo Sistema Interligado Nacional.',
  },
  {
    id: 'Cena02',
    titulo: 'Só vira valor quando chega',
    duracao: 9,
    still: 8.2,
    loc: 'E ela só vira valor quando chega à carga. Na casa, na indústria, no hospital.',
  },
  {
    id: 'Cena03',
    titulo: 'Projeto entregue. Resultado?',
    duracao: 18,
    still: 17.2,
    loc: 'Com projetos acontece o mesmo. A solução fica pronta. O sistema entra no ar. O projeto é entregue. Mas, se as pessoas continuam trabalhando do jeito antigo, o resultado não chega.',
  },
  {
    id: 'Cena04',
    titulo: 'Tudo ao mesmo tempo',
    duracao: 14,
    still: 12.5,
    loc: 'E no ONS as mudanças não chegam uma de cada vez. Reorganizações, novas regras do setor, novos sistemas, novas formas de trabalhar. Tudo ao mesmo tempo.',
  },
  {
    id: 'Cena05',
    titulo: 'A virada: a transmissão',
    duracao: 16,
    still: 15.6,
    loc: 'Nenhum projeto termina no go-live. Ele termina no dia em que as pessoas deixam de trabalhar do jeito antigo. A gestão da mudança é a transmissão: o que leva a solução até as pessoas.',
  },
  {
    id: 'Cena06',
    titulo: 'Vocês são a rede',
    duracao: 17,
    still: 16.0,
    loc: 'E toda transmissão precisa de uma rede. Gestão de Pessoas. Inovação e Transformação. Comunicação Interna. Relacionamento com Agentes. Quatro frentes, uma mesma rede.',
  },
  {
    id: 'Cena07',
    titulo: 'A jornada',
    duracao: 17,
    still: 16.0,
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
  // com locução gravada: tempos reais de cada frase (src/locucao.ts)
  const real = LOCUCAO[c.id];
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
