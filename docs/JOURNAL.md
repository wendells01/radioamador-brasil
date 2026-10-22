# JOURNAL

Registro cronológico da execução do plano `radioamador-brasil`. Toda a execução
ocorreu em **2026-10-22 (UTC)** (local UTC-3: noite de 21/10 e madrugada de
22/10). Horários citados são UTC. Evidências em `.omo/evidence/`.
Legenda: **EV** = executado e verificado · **EN** = executado mas não verificado ·
**IN** = apenas investigado · **PL** = planejado · **PD** = pendente.

## 2026-10-22 — Tarefa 1: preparação do projeto (~01:55Z)

- Objetivo: criar estrutura `/home/ubuntu/radioamador-brasil` sem dependências.
- Executado: diretórios `site/`, `sources/`, `tests/`, `docs/`, `package.json`
  (`private`, `type: module`, sem dependencies), README inicial. **EV**
  (preflight confirmou destino vazio; `node -e` validou contrato do package.json).
- Evidência: `task-1-preflight.txt`, `task-1-setup.txt`.
- Decisão: nenhum git iniciado (sem autorização). Projetos de referência
  (`MeuOrcamento-Landing`, `lptecsite`) intocados.

## 2026-10-22 — Tarefa 2: preservação dos três simulados (~02:00Z)

- Objetivo: extrair do ZIP apenas os três HTMLs por allowlist, sem `extractall`.
- Executado: cópia do ZIP para `sources/simulados.zip`, extração literal para
  `site/simulados/classe-{c,b,a}.html`, `sources/manifest.json` com hashes. **EV**
  (`test_assets.py` 3/3 compara byte a byte; hashes conferem pós-QA).
- Evidência: `task-2-integrity.txt`, `task-2-rejection.txt` (validador rejeita
  membro ausente/hash errado sem sobrescrever).
- Problema/solução: sidecars `__MACOSX`/`._` ignorados por allowlist (não eram
  corrupção dos HTMLs).

## 2026-10-22 — Tarefa 3: identidade, estilos e navegação (~02:25Z)

- Objetivo: CSS global, paleta escura/amarela, menu mobile acessível, favicon.
- Executado: `site/assets/styles.css`, `app.js` (menu com Escape/aria-expanded),
  `favicon.svg`, `logo.webp` 720×717 via cwebp (original preservado). **EV**
  (Playwright 390×844 e 1440×1000 sem overflow; foco visível por Tab; sem
  recurso de terceiros na rede; no-JS e reduced-motion verificados).
- Evidência: `task-3-mobile.png`, `task-3-desktop.png`, `task-3-320.png`,
  `task-3-a11y.txt`, `task-3-nojs.txt`, `task-3-qa.json`.

## 2026-10-22 — Tarefa 4: home orientada a recursos (~03:00Z)

- Objetivo: hub com cartões C/B/A, ferramentas, CTA WhatsApp, comunidade.
- Executado: `site/index.html` completo com URLs literais do plano. **EV**
  (clique em cada cartão C/B/A e volta; CTA com href exato e nova aba;
  no-JS mantém links).
- Evidência: `task-4-navigation.txt`, `task-4-home.png`, `task-4-nojs.txt`.

## 2026-10-22 — Tarefa 5: referência rápida pesquisável (~03:15Z)

- Objetivo: alfabeto, 18 códigos Q, 15 termos, com fonte e data.
- Executado: `site/referencia.html` + `site/assets/js/referencia.js` +
  `docs/SOURCES.md`. **EV** (26 letras/18 Q/15 termos no teste; busca
  acento/case-insensível comprovada com `localizacao`; busca inexistente mostra
  mensagem e limpa).
- Evidência: `task-5-reference.txt`, `task-5-empty.txt`.

## 2026-10-22 — Tarefa 6: calculadora de antenas (~02:45Z)

- Objetivo: dipolo `143/f`, braço `71,5/f`, onda `299,792458/fMHz`, validação
  estrita de entrada.
- Executado: `site/ferramentas/antenas.html` + `site/assets/js/antenas.js`
  (funções puras separadas do DOM). **EV** (146 MHz → 2,053/0,979/0,490 m;
  14,2 ≡ 14.2; limites 0,1/100000; inválidos rejeitados sem resultado antigo;
  entradas hostis sem diálogo/injeção).
- Evidência: `task-6-valid.txt`, `task-6-valid.png`, `task-6-invalid.txt`.

## 2026-10-22 — Tarefa 7: treinador Morse (~03:35Z)

- Objetivo: conversão textual, áudio Web Audio cancelável e exercícios.
- Executado: `site/ferramentas/morse.html`, `morse.js`, `morse-audio.js`. **EV**
  (tabela 36 caracteres; SOS `... --- ...`; 20 WPM ponto 0,06 s; durações
  exatas; play duplo/stop/pagehide; Web Audio ausente mantém conversão).
- Evidência: `task-7-morse.txt`, `task-7-audio.json`, `task-7-failure.txt`.
- Limitação: áudio observado por agendamento/status, não ouvido por humano.

## 2026-10-22 — Tarefa 8: curadoria de links (~03:45Z)

- Objetivo: `site/links.html` com 12 links categorizados e observação HTTP real.
- Executado: cartões com título/tipo/domínio/data; mapa e monitor com
  limitações explícitas. **EV** (curl registou 200, 423, 429 e
  redirecionamentos para login como achados reais; hub segue funcional com
  destino indisponível simulado).
- Evidência: `task-8-links.json`, `task-8-links.png`, `task-8-external-down.txt`.

## 2026-10-22 — Tarefa 9: integração e robustez da raiz (~04:05Z)

- Objetivo: metadados, `robots.txt`, fronteira `site/` e crawler local.
- Executado: `lang=pt-BR`, viewport, favicon, OG local, `robots.txt` Disallow,
  `noindex,nofollow` nas páginas novas (simulados não tocados). **EV**
  (`test_site.py` 10/10: hrefs/anchors locais, hashes, rejeição de escape de
  raiz; 404 real para `/inexistente.html`; `/package.json`, `/docs/RUNBOOK.md`,
  `/sources/simulados.zip`, `/.env` fora da raiz servida).
- Evidência: `task-9-routes.txt`, `task-9-boundary.txt`.

## 2026-10-22 — Tarefa 10: prévia privada Tailscale (04:11Z)

- Objetivo: subir prévia bindada no IPv4 do tailnet sem tocar serviços alheios.
- Executado: porta 8787 (primeira livre), bind `100.125.41.28`, tmux
  `radioamador-brasil-preview`, PID 834022. **EV** (health 200 em todas as
  rotas; `ss -ltnp` mostra bind só no IPv4 Tailscale; `tailscale serve status`
  idêntico antes/depois — listener 5901 preexistente intocado; persistência
  comprovada após o shell retornar).
- Evidência: `task-10-preview.txt`, `task-10-boundary.txt`.
- Decisão: lista de pares do tailnet nunca salva; Self apenas projetado.
- Limitação: prévia testada via curl/browser do agente no próprio endereço;
  **não** se afirma teste no iPhone físico.

## 2026-10-22 — Tarefa 11: QA integrado (04:21–04:32Z)

- Objetivo: verificar site e simulados reais, limites e responsividade.
- Executado: todos os testes + jornadas de navegador na prévia real
  (Chromium 1248 headless, Playwright 1.61, `--no-sandbox`, 390×844/1440×1000/320px,
  reduced motion). **EV** (jornadas C/B/A com respostas, sair, desempenho,
  revisão de erros, treino, reload com persistência por chave; referência;
  antenas válidas/inválidas/hostis; Morse reproduzir/parar/exercício; teclado e
  menu; sem overflow horizontal; sem requisição externa ao carregar).
- Evidência: `task-11-journeys.json`, `task-11-negative.json`,
  `task-11-home-mobile.png`, `task-11-home-desktop.png`,
  `task-11-tools-mobile.png`.
- Problema preexistente registrado (não corrigido, bytes congelados): 404 de
  `/favicon.ico` no console das páginas de simulados; rótulo interno
  “Simulado oficial” no histórico do modo prova completa (mitigado pelo aviso
  do hub).

## 2026-10-22 — Tarefa 12: documentação para handoff (04:41Z)

- Objetivo: consolidar README, RUNBOOK, SOURCES, STATE e JOURNAL com valores
  reais.
- Executado: os cinco documentos; todos os comandos do RUNBOOK executados de
  verdade (health checks, `ss`, `tmux`, `ps`, `tailscale ip -4`, `npm test`
  40/40, `test_site.py` 10/10, `test_assets.py` 3/3); fontes RSGB, M.1677 e
  BIPM acessadas de novo com 200. **EV** (auditoria dos docs em
  `task-12-doc-audit.txt`).
- Evidência: `task-12-runbook.txt`, `task-12-doc-audit.txt`.
- Retificação (16:00Z, mesma data): as contagens desta entrada (40 node / 10
  site / 3 assets) eram as reais naquele momento. Depois do redesign elas
  passaram a **41 node / 17 unittest**; ver a entrada "Redesign de navegação e
  home" abaixo. O histórico acima foi preservado como estava.
- Decisão: IP do tailnet mantido só em docs locais do projeto; nenhuma
  credencial nem lista de pares do tailnet gravada.

## 2026-10-22 — Redesign de navegação e home (12:25Z–)

- Objetivo: transformar a home em porta de entrada da comunidade (hero,
  propagação solar, comunidade), mover os catálogos para páginas próprias e
  substituir a navegação por um menu agrupado, com profundidade visual real.
- Executado e verificado:
  - `site/simulados.html` e `site/ferramentas.html` criados a partir do
    conteúdo que estava na home; `site/index.html` reduzido a três seções.
  - Menu `<dialog>` agrupado nas sete páginas, com fallback `<noscript>`;
    `matchMedia` de auto-fechamento removido.
  - `site/assets/js/hero-waves.js`: um único rAF, 30 fps, DPR ≤ 1,5, pausa,
    movimento reduzido, parada por visibilidade e por interseção.
  - `site/assets/js/solar-panel.js` + imagem HAMQSL com créditos e aviso de
    indisponibilidade.
  - `tests/test_site.py` ganhou 4 testes (âncora legada, fragmento entre
    páginas, `.html` do catálogo, recurso externo único) — provados falhando
    numa cópia scratch com os defeitos injetados.
  - `tests/redesign.browser.mjs` ganhou os modos `--motion`, `--solar`,
    `--journeys` e `--failures`.
- Resultados reais: `npm test` 41/41; `unittest test_*.py` 17/17; modos do
  navegador 19/6/8/7/6/7, zero falhas; 16 hashes protegidos OK.
- Defeitos encontrados na inspeção visual e corrigidos uma vez: botão de pausa
  visível com `[hidden]`; `antenas`/`morse` sem respiro sob o header; catálogo
  em 3+1; CTAs desalinhados em cartões de altura igual.
- Decisão: a home não carrega catálogo nem logo solta; a logo aparece só no
  header. O efeito do hero é progressivo — a arte estática continua legível com
  canvas indisponível, JS desligado ou movimento reduzido.
- Evidência: `.omo/evidence/redesign/` (01 a 08) e `visual/`.

## 2026-10-22 (tarde) — Correções pedidas pelo proprietário: pausa, menu e emoji

- Pedido: remover o botão "Pausar animação"; remover "Ver simulados"/"Ver
  ferramentas" do menu; trocar emoji e a setinha por ícones de verdade.
- Executado e verificado:
  - Botão de pausa removido de `index.html`, `hero-waves.js` e `styles.css`.
    `prefers-reduced-motion` continua desenhando um quadro estático.
    `--motion` virou 7/7 com um caso novo: "não existe controle de pausa e o
    canvas continua animando".
  - As duas linhas "Ver …" saíram do `<dialog>` e do `<noscript>` nas 7 páginas.
    Para os catálogos não ficarem órfãos, o título do grupo passou a ser link
    (`/simulados.html`, `/ferramentas.html`) com `aria-current` na própria
    página. `NAV_HREFS` foi ajustado e o teste do título compara só o rótulo
    visível, ignorando o sufixo `.visually-hidden`.
  - Ícones: `--icon-whatsapp/-instagram/-external/-close` como SVG em `data:`
    URI, aplicados por máscara com `currentColor`. Nenhum emoji nem `↗`/`×`
    tipográfico sobrou nas 7 páginas (0 nós de texto com esses caracteres em
    21 carregamentos).
- Defeito encontrado na inspeção e corrigido: os glifos preenchidos estavam com
  `background-image` + `background-color`, o que pintava as áreas transparentes
  e transformava WhatsApp/Instagram em quadrado sólido. Passaram a usar
  `mask-image`.
- **Causa real do painel solar indisponível no iPhone do proprietário:** o
  `<img>` tinha `referrerpolicy="no-referrer"`. Medido com `curl`: sem Referer
  o HAMQSL/Sucuri devolve **403**; com o nosso origin, **200**. Trocado para
  `referrerpolicy="origin"`. Timeout subiu de 12 s para 20 s (Slow 3G mediu
  8,2 s até `load`) e o aviso ganhou "Tentar de novo" (uma requisição por
  clique, sem polling).
- Resultados: `npm test` 41/41; `unittest` 17/17; `happy` 19/19; `--negative`
  6/6; `--motion` 7/7; `--solar` 7/7; `--journeys` 6/6; `--failures` 7/7.
- **Não resolvido (precisa de autorização):** os três simulados congelados têm
  17 emoji cada (📻 🎯 ⚖️ 📡 ⚡ 🧠 🔁 📊 ✅ ❌ ✓ ✕) e **nenhum link** — entrar
  neles pelo menu deixa o visitante sem menu e sem volta, só com o botão do
  navegador. Mexer nisso quebra o congelamento por hash, então está parado.

## 2026-10-22 (noite) — Hero com três ações e painel solar vivo

- Pedido: manter simulados intocados; trocar o CTA do hero por "Acessar
  Ferramentas" (mesmo efeito do hamburger); adicionar "Acessar Instagram";
  fazer o painel de propagação exibir.
- Painel: o `.gif` era o arquivo **estático de 2022** (carimbo 15/05/2022,
  `Last-Modified` julho/2022) e ainda responde 403 sem `Referer`. O HAMQSL
  publica 23 blocos "HTML CODE" em `solar.html`; o primeiro aponta para
  `solarn0nbh.php`. Trocado para esse endpoint: 200 com ou sem `Referer`,
  155×530, carimbo interno **22 Oct 2026 1510 GMT**. Confirmado visualmente.
- Hero: "Acessar Ferramentas" é um `<button data-menu-open>` que abre o mesmo
  `<dialog>` do hamburger; `app.js` passou a aceitar N acionadores e a devolver
  o foco a quem abriu. Ordem final: Acessar Ferramentas, Entrar no Grupo,
  Acessar Instagram (ícone de câmera por máscara).
- Defeito evitado na revisão: `triggers.length > 0` como condição do bloco
  quebraria o menu nas 6 páginas sem o botão do hero. O guarda ficou em
  `toggle && triggers.length > 0`, com `data-menu-open` em todos os hamburgers.
- Testes ajustados: `SOLAR_ENDPOINT` → `.php`; allowlist de recurso externo em
  `test_site.py`; o caso do CTA do hero deixou de esperar navegação e passou a
  exigir abertura do menu com `aria-expanded="true"`.
- Resultados: `npm test` 41/41; `unittest` 17/17; `happy` 19/19; `--negative`
  6/6; `--motion` 7/7; `--solar` 7/7; `--journeys` 6/6; `--failures` 7/7.
  Três botões medidos em 320/390/1440 sem overflow, 44 px de altura cada.
- Simulados: seguem **intocados** (16 hashes OK), por decisão do proprietário.

## 2026-10-22 (noite) — Legenda em português do painel solar

- Pesquisa prévia (somente leitura): **não existe painel de propagação
  embutível em português**. HAMQSL ignora `?lang` (resposta byte a byte
  idêntica); arado.pt responde `X-Frame-Options: DENY` e `frame-ancestors
  'none'`; id.qsl.br, ct2hmr.com, radioamador.info e ondascurtas.com não
  publicam código de incorporação. A NOAA serve os mesmos dados com CORS
  aberto, mas montar painel próprio seria outro projeto.
- Escolha do proprietário: legenda em português. Implementada como
  `<details class="solar__legend">` com 15 termos em três blocos (índices do
  Sol, atividade geomagnética, condições por banda), resumo fechado mostrando
  "Poor = ruim · Fair = média · Good = boa".
- Erro de teste corrigido no caminho: o guarda "não inventar índices" casava a
  simples menção a `SFI` na legenda e depois casava a prosa "de 0 a 9". Passou a
  exigir rótulo maiúsculo seguido de dígito, com `K` exigindo separador.
- Ajuste visual: `white-space: nowrap` no link da fonte, que deixava a seta
  sozinha na segunda linha.
- Resultados: `npm test` 41/41; `unittest` 17/17; `happy` 19/19; `--negative`
  6/6; `--motion` 7/7; `--solar` **8/8** (caso novo da legenda); `--journeys`
  6/6; `--failures` 7/7. Legenda aberta não estoura em 320/390/1440.

## Pendências gerais (PD)

- Avaliação humana pelo proprietário no iPhone (Safari + Tailscale). **PD** —
  pendente de nova conferência depois do ajuste de `referrerpolicy`;
  o QA atual é Chromium emulado; safe-area e barra dinâmica do Safari não foram
  observadas em hardware.
- Decisão de domínio, produção pública, repositório git e commits: nenhuma
  autorizada. **PL**
- Verificação final F1–F4 do plano: executada pelo orquestrador nesta
  sessão, com os relatórios em `.omo/evidence/redesign/F*.md`. **EV**
