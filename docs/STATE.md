# STATE — estado atual (2026-10-22)

Estado real, confirmado nesta data. Evidências em `.omo/evidence/`.

## Prévia

| Item | Valor |
| --- | --- |
| URL local | `http://100.125.41.28:8787/` |
| Bind | `100.125.41.28` (IPv4 Tailscale somente) |
| Porta | `8787` |
| tmux session | `radioamador-brasil-preview` (PID do servidor: 834022) |
| Processo | `python3 -m http.server 8787 --bind 100.125.41.28 --directory /home/ubuntu/radioamador-brasil/site` |

Listener TCP preexistente do Tailscale Serve na porta 5901: não é deste projeto,
não foi modificado. Operação completa em `docs/RUNBOOK.md`.

## Completo e verificado

- Testes (medidos após o redesign de navegação, 2026-10-22):
  `npm test` → **41 pass / 0 fail / 0 skipped**;
  `python3 -m unittest discover -s tests -p 'test_*.py'` → **17/17**
  (10 de `test_site.py` + 3 de `test_assets.py` + 4 novos);
  `node tests/redesign.browser.mjs` → **19/19**, `--negative` **6/6**,
  `--motion` **8/8**, `--solar` **7/7**, `--journeys` **6/6**,
  `--failures` **7/7**.
- Simulados byte-idênticos aos originais do ZIP (sha256 verificado após o QA):
  - classe-c `98956cbb067464778ab8facb7ec5c94c31094a8eafb4bd7e7482ba7b4b1c436b`
  - classe-b `358b05a666de3a2b02d6a5c553265d98f78aac642ee2bc682cfcf241dfd09b59`
  - classe-a `f2b480c4ab7bdafdda625ef0bb6d068d036ce4a61c07f3cd4d638e69cbea5a06`
- Jornadas de navegador executadas na prévia real (task-11-journeys.json):
  navegação por todas as páginas, simulados C/B/A respondidos/avançados,
  persistência de localStorage após reload confirmada por classe, busca da
  referência, cálculos de antena (146 e 14,2 MHz), Morse reproduzido/parado,
  exercício conferido, teclado e menu, sem overflow horizontal em 390/1440/320px.
- Logo: original 1206×1200 preservado em `site/assets/logo-original.jpeg`
  (sha256 `164f10fa00e4af8b5a83266b20d6590aa6477d93b1f9682743c1387beb2584c8`);
  exibida em `site/assets/logo.webp` (720×717).

## Redesign de navegação e home (2026-10-22)

- Sete páginas próprias: `/`, `/simulados.html`, `/ferramentas.html`,
  `/referencia.html`, `/links.html`, `/ferramentas/antenas.html`,
  `/ferramentas/morse.html`. As duas páginas de catálogo são novas e receberam
  o conteúdo que antes estava empilhado na home.
- A home tem exatamente três seções de conteúdo: hero, propagação solar e
  comunidade. Sem catálogo, sem faixa duplicada, sem `hero__logo`.
- Menu: um `<dialog>` agrupado em cinco grupos, aberto pelo hamburger em
  qualquer largura; `showModal()` dá top layer e inércia; Escape, botão fechar
  e clique no backdrop fecham; o foco não escapa; sem JS existe fallback
  `<noscript>` com os 10 links.
- Sem link "Ver simulados" / "Ver ferramentas" no menu (redundantes com os
  itens logo abaixo). Os dois catálogos continuam alcançáveis pelo próprio
  título do grupo, que é um link com `aria-current` na página correspondente.
- Sem botão de pausa no hero. Ícones são SVG por máscara (WhatsApp, Instagram,
  seta externa, fechar); nenhum emoji ou glifo tipográfico sobrou nas 7 páginas.
- Profundidade visual: grade mascarada + dois brilhos radiais + grão em data
  URI (fixos, `pointer-events: none`), anéis concêntricos em CSS e um canvas
  de ondas com um único `requestAnimationFrame`, teto de 30 fps e DPR ≤ 1,5.
- Painel solar HAMQSL: carrega de `solarn0nbh.php` (não do `.gif`). Observado
  em 2026-10-22 devolvendo **155×530 px** com o carimbo **22 Oct 2026 1525 GMT**
  dentro da imagem — dado vivo, não o arquivo de 2022. O `.gif` homônimo é
  estático (carimbo de 15/05/2022, `Last-Modified` de julho de 2022) e responde
  403 sem `Referer`; foi aposentado. Aviso, timeout de 20 s, recuperação por
  carga tardia e "Tentar de novo" cobertos por `--solar`.
- Legenda em português sob o painel: `<details>` com 15 termos, fechada por
  padrão (82 px em 390, 56 px em 1440), abre por clique ou Enter, sem
  requisição nova. Cobre índices do Sol, atividade geomagnética e condições por
  banda.
- Hero com três ações: Acessar Ferramentas (abre o menu), Entrar no Grupo,
  Acessar Instagram. Os três simulados originais seguem **byte a byte
  intocados** por decisão do proprietário.

## Navegador realmente usado no QA

Headless **Chromium build 1248** via **Playwright 1.61**, com `--no-sandbox` e
`executablePath` explícito (o headless_shell embutido é build 1228). Viewports
emulados: 390×844, 1440×1000 e 320px; `prefers-reduced-motion` ativado.

**Isto não é um iPhone físico.** Emulação de viewport não prova Safari/iOS.
Áudio não foi ouvido por humano: apenas agendamento e execução do Web Audio
foram observados (transições de status e ausência de rejeição).

## Limitações conhecidas

- Destinos externos dependem de terceiros. Observados na conferência de
  2026-10-22: Mosaico HTTP **423**; Instagram **429** com redirecionamento para
  login; SEC e SEI redirecionam para login. PDFs da Anatel retornaram
  `application/pdf`.
- Simulados mantêm o rótulo interno “Simulado oficial” no histórico do modo
  prova completa. São originais byte-idênticos; a mitigação é o destaque
  não-oficial no hub. Nada do banco de questões foi certificado.
- Simulados não têm link de favicon: o console pede `/favicon.ico` e recebe 404
  nessas páginas. Preexistente; não corrigido porque os bytes estão congelados.
- `robots.txt` (Disallow `/`) e `noindex,nofollow` são defesa em profundidade;
  **não substituem** as ACLs do tailnet. A prévia é privada pelo Tailscale, não
  por esses cabeçalhos.
- Ferramentas funcionam sem rede **depois de carregadas**; navegação offline não
  é alegada.

## Pendências / próximos passos

- Nenhuma decisão de domínio tomada; nenhuma produção pública.
- Nenhum repositório git existe; nenhum commit/push autorizado.
- Avaliação pelo proprietário no iPhone (Safari + Tailscale) ainda não realizada
  — depende de ação humana; o QA do agente não a substitui.

## Notas

- Arquivos em `/tmp` **não** são necessários para o site funcionar; tudo que a
  prévia serve vive sob `site/` (ZIP original preservado em `sources/`).
- Versões: Node v24.16.0, Python 3.14.6, tmux 3.4, tailscale 1.102.2.
