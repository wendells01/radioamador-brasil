# Radioamador Brasil

Hub estático de estudos e ferramentas para radioamadorismo no Brasil: simulados por
classe (C, B, A), calculadora de antenas, treinador de código Morse, referência
fonética e links úteis. Sem dependências de aplicação — só HTML, CSS e JavaScript
puro. A edição e a prévia usam `site/` diretamente; a publicação gera `dist/` com
recursos versionados. Prévia privada no Tailscale: ver `docs/RUNBOOK.md`.

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
│           └── solar-panel.js  # painel HamQSL próprio, em pt-BR
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
Aprendizado, Comunidade) aberto pelo hamburger em qualquer largura — o mesmo
componente em desktop e mobile. Sem JavaScript, um `<nav>` de fallback em
`<noscript>` mantém todos os links.

O hero tem três ações, nesta ordem: **Acessar Ferramentas** (botão, abre o
mesmo menu do hamburger), **Entrar no Grupo** (WhatsApp) e **Acessar
Instagram**. O primeiro é `[data-menu-open]`, como o hamburger; qualquer
acionador devolve o foco para quem abriu.

## Propagação em português

A home apresenta o feed XML público do [HamQSL](https://www.hamqsl.com/solar.html)
num painel próprio: condições HF por dia/noite e índices solares, com créditos,
data de origem em horário de Brasília e aviso de boletim antigo.

O navegador lê somente `/assets/data/solar.json`. A origem não enviou CORS na
consulta de 23/10/2026, portanto a coleta é feita fora do navegador:

```bash
python3 scripts/update-solar-data.py
```

Agende esse comando uma vez por hora na máquina de coleta/build. O script
impede consultas à origem em intervalos menores, inclusive após falhas,
valida o XML e substitui o JSON atomicamente. Não precisa de backend HTTP nem
dependências Python extras. Se uma coleta falhar, o snapshot anterior permanece;
com mais de seis horas, o painel sinaliza sua idade. As classificações não são
probabilidades nem uma previsão específica para o Brasil.

Na prévia Tailscale, `radioamador-solar-update.timer` agenda a coleta local.
É uma unidade temporária da sessão, assim como o servidor de prévia; não configura
produção nem sobrevive ao reinício da máquina. Ao publicar futuramente, será
necessário agendar a coleta e disponibilizar o JSON no mesmo domínio do site
(ou incluí-lo no build com publicação horária). O snapshot versionado não se
atualiza sozinho em uma hospedagem puramente estática.

Ver [docs/PAINEL-SOLAR.md](docs/PAINEL-SOLAR.md) para operação e testes.

## Publicação e cache

```bash
npm run build  # gera dist/; não faz push nem deploy
```

O build nativo em Node, sem pacotes novos, gera URLs de CSS/JavaScript com hash
SHA-256 do conjunto de recursos. Imports relativos, inclusive os dinâmicos,
permanecem na mesma versão. HTML, dados solares e URLs antigas são revalidados;
recursos em `/assets/releases/<hash>/` são imutáveis e têm cache de um ano.
Versões antigas são reconstruídas do histórico Git para preservar abas abertas,
sem depender do cache de build da hospedagem. Checkouts rasos recuperam o
histórico automaticamente com um fetch somente de leitura.

`vercel.json` configura build e diretório publicado a partir da **raiz do
repositório**. Não publique `site/` diretamente em produção após adotar essa
configuração. Nenhum deploy é executado pelo comando de build.

Investigação do carregamento sem CSS, limites da reprodução e testes:
[docs/CACHE-E-PUBLICACAO.md](docs/CACHE-E-PUBLICACAO.md).

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

- A prévia continua servindo `site/` diretamente. Para publicar, execute `npm run build`
  e sirva `dist/`, usando as regras de cache de `vercel.json`.
- Não há dependências de aplicação (`package.json` é `private` e sem `dependencies`).
- `sources/`, `docs/`, `tests/` e `package.json` ficam fora da raiz servida
  (retornam 404 pela prévia).
- Simulados são arquivos originais preservados byte a byte; hashes em
  `sources/manifest.json` e em `docs/STATE.md`.

## Ferramentas técnicas

Calculadora/comparador/guia de coaxiais, guias de faixas e emergências, Flowerpot e
geometria de chokes estão no catálogo de ferramentas. O módulo de exposição RF é
parcial: converte ERP/EIRP, mas não calcula distâncias enquanto as expressões
oficiais não forem verificadas. Fontes, métodos, domínios, limitações e comandos
de validação estão em [docs/FERRAMENTAS-TECNICAS.md](docs/FERRAMENTAS-TECNICAS.md).
