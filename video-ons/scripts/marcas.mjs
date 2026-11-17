// Imprime em JSON os instantes que a trilha precisa (vindos do config.ts e da locução)
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const c = await import(path.join(RAIZ, 'src/config.ts'));
const ini = c.CENAS.map((_, i) => c.inicioCena(i));
const f3 = c.frasesCena(2), f8 = c.frasesCena(7);
console.log(JSON.stringify({
  cenas: ini, fim: c.DURACAO_TOTAL, ...c.MUSICA,
  falha: ini[2] + c.MARCAS.falhaC3, resultado: ini[2] + c.MARCAS.resultadoC3,
  chegar: c.naBatida(ini[7] + f8[1].ini), fala: c.legendas().map((l) => [l.ini, l.fim]),
}));
