# CONECTADOS · vídeo de abertura interativo

Vídeo de abertura do programa **Gestão da Mudança na Prática** (2min56s, 16:9), construído a partir do roteiro "CONECTADOS" como uma peça de **motion graphics interativa**, que roda no navegador.

> ⚠ Rascunho para revisão. Requer revisão e aprovação de um profissional qualificado da Alvarez & Marsal antes do uso.

## Como assistir

Abra o `index.html` no Chrome ou no Edge (funciona com clique duplo, sem servidor) e clique em **Toque para acender**.

| Tecla | Ação |
|---|---|
| Espaço / K | Reproduzir / pausar |
| ← → | Voltar / avançar 5 s |
| [ ] | Cena anterior / próxima |
| C | Legendas |
| M | Som |
| I | Modo interativo (liga/desliga) |
| P | Personalizar fotos e nomes |
| F | Tela cheia |

Para a projeção na sala: tela cheia (F), som ligado e, se quiser o vídeo sem as dicas de interação, desligue o modo interativo (I).

### O que é interativo

O vídeo segue o roteiro no tempo exato, e as interações nunca o interrompem: só antecipam ou reforçam o que já vai acontecer.

- **C08 · Cenário 2**: toque nos pontos para acender a rede elétrica antes da hora.
- **C11 · Participantes**: passe o cursor sobre as fotos; elas reagem com luz.
- **C14 · As quatro palavras**: toque nas palavras para acendê-las.
- **C15 · A frase final**: cada toque espalha uma onda de luz pela rede.
- Em qualquer cena, o toque gera um pequeno sinal de luz.

## Personalizar (fotos dos personagens e participantes)

O vídeo já está pronto com espaços reservados. Há dois jeitos de incluir as fotos depois:

1. **Rápido, pelo player**: clique em **Personalizar** (ou tecla P). Dá para carregar as fotos dos 15 participantes, os nomes, o grupo de cada um, as fotos dos 5 personagens, o nome da empresa e os logos. Fica salvo **só naquele navegador**, o que é ideal para preparar o computador da apresentação.
2. **Definitivo, no projeto**: coloque os arquivos em `fotos/participantes/`, `fotos/personagens/` e `logos/` e preencha os caminhos em [`js/config.js`](js/config.js). É o único arquivo que precisa ser editado.

Personagens com espaço para foto (a foto vira a cabeça do personagem animado):

| Chave | Aparece em |
|---|---|
| `colaboradora` | C07 (recebe o e-mail) · C08 (aprende com a colega) · C14 |
| `colega` | C07 (cochicha no corredor) · C08 (agente da mudança) |
| `analista` | C07 (volta à planilha) · C08 (workshop) · C14 |
| `gestor` | C07 (painel vermelho) · C08 (painel verde) |
| `lider` | C08 (explica o porquê para a equipe) |

Lembre do consentimento de uso de imagem (LGPD) antes da exibição.

## Narração (ElevenLabs · voz Dani Carioca)

A narração é gerada por trecho, com alinhamento palavra a palavra. Esse alinhamento sincroniza as legendas, o texto que acende na tela e os impactos sonoros (por exemplo, o sub-boom em "resultados").

```bash
ELEVENLABS_API_KEY=sk_sua_chave node ferramentas/gerar-narracao.mjs
```

- Procura a voz **Dani Carioca** na sua conta e, se não achar, na biblioteca da ElevenLabs (e a adiciona à conta).
- Grava `audio/narracao/*.mp3`, `dados.js` (tempos de cada palavra) e `audio.js` (áudio embutido, para funcionar sem servidor).
- Mostra se cada trecho cabe na sua cena.
- O nome da empresa ("[NOME DA EMPRESA]." em C11) só é narrado depois que `empresa.nome` estiver preenchido em `js/config.js`. Para gerar só esse trecho: `node ferramentas/gerar-narracao.mjs --somente c11b`.
- Outras opções: `--voz-id <id>`, `--velocidade 0.95`, `--listar-vozes "Dani"`.
- Em ambiente com proxy (como o Claude Code na nuvem), rode com `NODE_USE_ENV_PROXY=1`.

Enquanto a narração não existir, o vídeo usa tempos estimados e mostra as legendas.

## Som

Tudo é sintetizado em tempo real (Web Audio), sem arquivos de música:

- **Efeitos minimalistas**: quando uma luz acende, ouve-se o clique do relé, o "tink" do filamento e o zumbido elétrico subindo; quando apaga, um clique seco e o zumbido caindo. Há também relógio, batimento, sub-boom e onda de choque.
- **Trilha em quatro movimentos**, como no roteiro: Aceleração (100 BPM, arpejo + cordas em staccato), Tensão (drone dissonante e piano desafinado), Virada (piano caloroso), Emoção (piano, cordas e coro) e Clímax (110 BPM, até o silêncio final).
- A música abaixa automaticamente durante a narração (ducking). Os silêncios de C06 e C15 são intencionais.

## Exportar MP4 (versão linear)

Para importar no After Effects, no Premiere ou no DaVinci Resolve, ou para projetar sem navegador:

```bash
node ferramentas/exportar-mp4.mjs              # saida/conectados-1080p.mp4 + .srt
node ferramentas/exportar-mp4.mjs --4k         # 3840 x 2160
node ferramentas/exportar-mp4.mjs --legendas   # legendas gravadas na imagem
node ferramentas/exportar-mp4.mjs --sem-c11    # sem a cena dos participantes, para outras turmas
```

Requer Node 18+, Playwright com Chromium e ffmpeg.

## Estrutura

```
index.html                 player
css/player.css             controles, legendas, painel
js/config.js               ← personalização (empresa, participantes, personagens, logos)
js/roteiro.js              tempos das 16 cenas e textos da narração
js/mg.js                   kit de motion graphics (easing, trim paths, texto-filamento, personagens)
js/cenas-1.js, cenas-2.js  as 16 cenas (C01–C16)
js/audio.js                efeitos, trilha procedural e narração
js/player.js               relógio, controles, interação, painel
audio/narracao/            narração gerada (ElevenLabs)
ferramentas/               gerar-narracao.mjs, exportar-mp4.mjs
fontes/                    Archivo e IBM Plex Mono (licença OFL)
```

## Checklist antes da exibição (do roteiro)

1. Conferir as fontes e a redação dos dois dados exibidos (C07: McKinsey/Kotter · C08: Prosci), alinhadas ao material do Módulo 1.
2. Confirmar o consentimento de uso de imagem de todos os participantes em C11.
3. Validar a grafia completa dos nomes com a organização do programa.
4. Usar apenas logos oficiais em vetor.
5. Confirmar a licença comercial da voz gerada.
6. Testar no projetor e no som da sala no dia anterior, incluindo os silêncios intencionais.
7. Revisar se nenhuma imagem sugere pessoas, locais ou sistemas reais da empresa de forma inadequada.
