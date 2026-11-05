/* ==========================================================================
   CONECTADOS · CONFIGURAÇÃO DO VÍDEO
   --------------------------------------------------------------------------
   Este é o ÚNICO arquivo que você precisa editar para personalizar o vídeo.

   FOTOS
   - Participantes (cena C11): salve as fotos em  fotos/participantes/
     e informe o caminho em "foto". Ex.: foto: 'fotos/participantes/01.jpg'
     Formato: quadrada (1:1), mínimo 1080 x 1080 px, rosto centralizado.
   - Personagens (cenas C07, C08 e C14): salve em  fotos/personagens/
     A foto vira a "cabeça" do personagem animado (recorte circular).
   - Campo vazio ('') = o vídeo mostra o espaço reservado.

   Também dá para testar fotos sem editar este arquivo: no player, clique em
   "Personalizar" (atalho P). O que for carregado ali fica salvo só no
   navegador daquele computador.

   Antes de exibir: colete o consentimento de uso de imagem (LGPD).
   ========================================================================== */
window.CX = window.CX || {};

CX.config = {
  empresa: {
    nome: '[NOME DA EMPRESA]',
    logo: '' // ex.: 'logos/empresa.svg' (use apenas o logo oficial em vetor)
  },

  parceiro: {
    nome: '[LOGO A&M]',
    logo: '' // ex.: 'logos/am.svg' (logo oficial em vetor)
  },

  programa: {
    titulo: 'GESTÃO DA MUDANÇA NA PRÁTICA',
    subtitulo: 'Programa de Formação',
    datas: '23 a 25 de novembro de 2026',
    dias: ['23 NOV', '24 NOV', '25 NOV'],
    caso: 'PROGRAMA HORIZONTE'
  },

  // Mostra o selo "Rascunho para revisão" na tela inicial. Mude para false após a aprovação.
  rascunho: true,

  // Até 15 participantes, em 3 grupos de 5 (os três grupos do case).
  participantes: [
    { nome: '', foto: '', grupo: 1 },
    { nome: '', foto: '', grupo: 1 },
    { nome: '', foto: '', grupo: 1 },
    { nome: '', foto: '', grupo: 1 },
    { nome: '', foto: '', grupo: 1 },
    { nome: '', foto: '', grupo: 2 },
    { nome: '', foto: '', grupo: 2 },
    { nome: '', foto: '', grupo: 2 },
    { nome: '', foto: '', grupo: 2 },
    { nome: '', foto: '', grupo: 2 },
    { nome: '', foto: '', grupo: 3 },
    { nome: '', foto: '', grupo: 3 },
    { nome: '', foto: '', grupo: 3 },
    { nome: '', foto: '', grupo: 3 },
    { nome: '', foto: '', grupo: 3 }
  ],

  // Personagens-âncora: aparecem nos dois cenários (sem e com gestão da mudança).
  personagens: {
    colaboradora: { rotulo: 'Colaboradora', foto: '' }, // recebe o e-mail (C07) e aprende com a colega (C08)
    colega:       { rotulo: 'Colega',       foto: '' }, // cochicha no corredor (C07) e vira agente da mudança (C08)
    analista:     { rotulo: 'Analista',     foto: '' }, // volta à planilha (C07) e pratica no workshop (C08)
    gestor:       { rotulo: 'Gestor',       foto: '' }, // painel vermelho (C07) e painel verde (C08)
    lider:        { rotulo: 'Líder',        foto: '' }  // explica o porquê para a equipe (C08)
  }
};
