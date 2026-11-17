// Lista de participantes. Os nomes na tela vêm só daqui (sem e-mails).
// O layout da Cena 6 se adapta ao número de nomes e de frentes.
export type Participante = {nome: string; frente: string};

export const participantes: Participante[] = [
  {nome: 'Flavia Babo', frente: 'Gestão de Pessoas'},
  {nome: 'Luna Almeida', frente: 'Gestão de Pessoas'},
  {nome: 'Marcelo Ferreira', frente: 'Gestão de Pessoas'},
  {nome: 'Ana Costa', frente: 'Gestão de Pessoas'},
  {nome: 'Ana Zuzarte', frente: 'Gestão de Pessoas'},
  {nome: 'Danielli Iglesias', frente: 'Gestão de Pessoas'},
  {nome: 'Isabella Reis', frente: 'Gestão de Pessoas'},
  {nome: 'Ludimila Dantas', frente: 'Inovação e Transformação'},
  {nome: 'Pamella Medea', frente: 'Inovação e Transformação'},
  {nome: 'Alex do Amaral', frente: 'Comunicação Interna'},
  {nome: 'Ana Patricia Paiva', frente: 'Comunicação Interna'},
  {nome: 'Taianne Rosaly', frente: 'Relacionamento com Agentes'},
  {nome: 'Gabriel Lobo', frente: 'Relacionamento com Agentes'},
  {nome: 'Fatima Giseli', frente: 'Relacionamento com Agentes'},
  {nome: 'Elisabete Gomes', frente: 'Relacionamento com Agentes'},
  {nome: 'Marcella Lanzetti', frente: 'Relacionamento com Agentes'},
];

// Frentes na ordem em que aparecem na lista
export const frentes = (): string[] => [...new Set(participantes.map((p) => p.frente))];
