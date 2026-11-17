// Lista de participantes. Os nomes na tela vêm só daqui (sem e-mails).
// O layout da Cena 6 se adapta ao número de nomes e de áreas.
export type Participante = {nome: string; area: string};

export const participantes: Participante[] = [
  {nome: 'Flavia Babo', area: 'Gestão de Pessoas'},
  {nome: 'Luna Almeida', area: 'Gestão de Pessoas'},
  {nome: 'Marcelo Ferreira', area: 'Gestão de Pessoas'},
  {nome: 'Ana Costa', area: 'Gestão de Pessoas'},
  {nome: 'Ana Zuzarte', area: 'Gestão de Pessoas'},
  {nome: 'Danielli Iglesias', area: 'Gestão de Pessoas'},
  {nome: 'Isabella Reis', area: 'Gestão de Pessoas'},
  {nome: 'Ludimila Dantas', area: 'Inovação e Transformação'},
  {nome: 'Pamella Medea', area: 'Inovação e Transformação'},
  {nome: 'Alex do Amaral', area: 'Comunicação Interna'},
  {nome: 'Ana Patricia Paiva', area: 'Comunicação Interna'},
  {nome: 'Taianne Rosaly', area: 'Relacionamento com Agentes'},
  {nome: 'Gabriel Lobo', area: 'Relacionamento com Agentes'},
  {nome: 'Fatima Giseli', area: 'Relacionamento com Agentes'},
  {nome: 'Elisabete Gomes', area: 'Relacionamento com Agentes'},
  {nome: 'Marcella Lanzetti', area: 'Relacionamento com Agentes'},
];

// Áreas na ordem em que aparecem na lista
export const areas = (): string[] => [...new Set(participantes.map((p) => p.area))];
