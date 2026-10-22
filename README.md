# Radioamador Brasil

Hub estático de estudos e ferramentas para radioamadorismo no Brasil: simulados por
classe (C, B, A), calculadora de antenas, treinador de código Morse, referência
fonética e links úteis. Sem etapa de build e sem dependências de aplicação — só
HTML, CSS e JavaScript puro. Prévia privada no Tailscale: ver `docs/RUNBOOK.md`.

## Estrutura

```
radioamador-brasil/
├── site/                      # raiz servida (conteúdo público)
│   ├── index.html             # home: hero, propagação solar, comunidade
│   ├── simulados.html         # catálogo das três classes
│   ├── ferramentas.html       # catálogo de ferramentas
│   ├── referencia.html        # alfabeto fonético, códigos Q, termos
│   ├── links.html             # recursos externos curados
│   ├── robots.txt
│   ├── ferramentas/
│   │   ├── antenas.html       # calculadora de dipolo
│   │   └── morse.html         # conversor, áudio e exercícios
│   ├── simulados/
│   │   ├── classe-c.html      # originais, bytes preservados
│   │   ├── classe-b.html
│   │   └── classe-a.html
│   └── assets/
│       ├── styles.css
│       ├── app.js
│       ├── favicon.svg
│       ├── logo-original.jpeg # fonte 1206×1200, intocada
│       ├── logo.webp           # 720×717
│       └── js/
│           ├── antenas.js
│           ├── hero-waves.js   # ondas do hero (canvas, opcional)
│           ├── morse.js
│           ├── morse-audio.js
│           ├── referencia.js
│           └── solar-panel.js  # painel HAMQSL: load/erro/timeout
├── sources/                   # simulados.zip + manifest.json (fora da raiz servida)
├── tests/                     # *.test.mjs (node --test) + test_assets.py + test_site.py
├── docs/                      # RUNBOOK, SOURCES, STATE, JOURNAL
├── README.md
└── package.json               # private, sem dependencies
```

## Rotas

Sete páginas próprias, mais os três simulados originais:

- `/` → home. Só três seções: hero, propagação solar e comunidade. **Não** há
  catálogo de simulados, catálogo de ferramentas nem logo solta na home — os
  catálogos vivem em páginas próprias e são alcançados pelo menu e pelos CTAs.
- `/simulados.html` → catálogo das classes C, B e A
- `/ferramentas.html` → catálogo de ferramentas
- `/referencia.html`, `/links.html`
- `/ferramentas/antenas.html`, `/ferramentas/morse.html`
- `/simulados/classe-c.html`, `/simulados/classe-b.html`, `/simulados/classe-a.html`
- `/robots.txt`, `/assets/*` (CSS, JS, logo, favicon)

Navegação: um único `<dialog>` agrupado (Início, Simulados, Ferramentas,
Consulta, Comunidade) aberto pelo hamburger em qualquer largura — o mesmo
componente em desktop e mobile. Sem JavaScript, um `<nav>` de fallback em
`<noscript>` mantém todos os links.

O hero tem três ações, nesta ordem: **Acessar Ferramentas** (botão, abre o
mesmo menu do hamburger), **Entrar no Grupo** (WhatsApp) e **Acessar
Instagram**. O primeiro é `[data-menu-open]`, como o hamburger; qualquer
acionador devolve o foco para quem abriu.

## Dependência externa aprovada

A home carrega **uma** imagem de terceiro: o painel de propagação do HAMQSL
(`https://www.hamqsl.com/solarn0nbh.php`), com créditos e link para a fonte.
É o endpoint que o próprio HAMQSL publica no bloco "HTML CODE" de
`solar.html`. Não use o `solarn0nbh.gif`: é o arquivo estático do autor, parado
em **maio de 2022**, e ainda responde 403 quando a requisição chega sem
`Referer`.
É conteúdo de previsão, não garantia de condições locais. Como o painel é
publicado em inglês, logo abaixo dele existe uma legenda em português
(`<details>`, fechada por padrão) que traduz cada rótulo e já mostra no resumo a
tradução mais consultada: *Poor = ruim · Fair = média · Good = boa*. Se o serviço falhar,
não responder em 20 s ou devolver algo que não seja imagem, a página mostra um
aviso com o link da fonte e um botão "Tentar de novo" — nunca números
inventados. Nenhuma outra página faz requisição externa até o visitante clicar
em um link. Ver `docs/SOURCES.md`.

## Movimento

O hero desenha anéis de rádio em `<canvas>`, sem controle de pausa na tela:
quem precisa de menos movimento é atendido por `prefers-reduced-motion: reduce`,
que faz a página desenhar um único quadro estático. A animação também para
quando a aba fica oculta e quando o hero sai da viewport.

## Ícones

Ícones são SVG inline em `data:` URI aplicados por máscara com `currentColor`:
WhatsApp, Instagram, seta de link externo e fechar. Sem emoji, sem fonte de
ícone, sem requisição extra.

## Comandos

Testes (todos passam em 2026-10-22):

```bash
npm test                                                   # 41 testes node --test
python3 -m unittest discover -s tests -p 'test_*.py'       # 17 testes (site + assets)
node tests/redesign.browser.mjs                            # 19 navegação
node tests/redesign.browser.mjs --negative                 #  6 estados negativos do menu
node tests/redesign.browser.mjs --motion                   #  8 ondas/pausa/reduced-motion
node tests/redesign.browser.mjs --solar                    #  7 painel solar
node tests/redesign.browser.mjs --journeys                 #  6 jornadas reais
node tests/redesign.browser.mjs --failures                 #  7 falhas e fronteiras
```

As contagens acima são as medidas em 2026-10-22; `npm test` e os `unittest`
imprimem o número real a cada execução. Os modos do `redesign.browser.mjs`
precisam da prévia ativa (`PREVIEW_URL`, padrão `http://100.125.41.28:8787`).

Servidor de QA (apenas local, bind em loopback; se 18787 estiver ocupada, use 18788 e depois 18789):

```bash
python3 -m http.server 18787 --bind 127.0.0.1 --directory site
```

A prévia privada do Tailscale é outro processo, com comando e operação próprios:
ver `docs/RUNBOOK.md`.

## Notas

- Não há build step: os arquivos de `site/` são servidos como estão.
- Não há dependências de aplicação (`package.json` é `private` e sem `dependencies`).
- `sources/`, `docs/`, `tests/` e `package.json` ficam fora da raiz servida
  (retornam 404 pela prévia).
- Simulados são arquivos originais preservados byte a byte; hashes em
  `sources/manifest.json` e em `docs/STATE.md`.
