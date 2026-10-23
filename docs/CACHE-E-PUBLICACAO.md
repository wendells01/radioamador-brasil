# Carregamento sem CSS: investigação e atualização de recursos

Investigação em 23/10/2026. Nenhum push, deploy ou ajuste remoto de CDN foi feito.
A alteração local do header e o snapshot solar já existentes foram preservados.

## Evidências e limites

O domínio encontrado nas referências do projeto foi `radioamadorbrasil.site`;
a resposta HTTP redireciona com 308 para `https://www.radioamadorbrasil.site/`.
Aguardamos confirmação de que é o mesmo endereço da sessão afetada. A pesquisa
usou a skill `investigate-first`: evidências antes da implementação.

| Verificação na produção atual | Resultado observado |
| --- | --- |
| `/`, `/ferramentas/faixas.html` | 200, `text/html; charset=utf-8` |
| `/assets/styles.css`, `/assets/tecnica.css` | 200, `text/css; charset=utf-8`, conteúdo CSS |
| `/assets/app.js`, `/assets/js/tecnica/faixas-ui.js` | 200, `application/javascript; charset=utf-8`, conteúdo JS |
| `/assets/missing-investigation.css` | 404, `text/plain`; não devolve HTML de uma SPA |
| `/sw.js`, `/service-worker.js` | 404 |
| Service Worker no código e no histórico Git | Nenhum registro ou implementação encontrado |
| URLs no HTML e imports | Mesma origem, caminhos absolutos `/assets/...` no HTML e imports relativos nos módulos |
| CSS/JS/HTML, `Cache-Control` | `public, max-age=0, must-revalidate` |
| Validadores HTTP | `ETag` e `Last-Modified` presentes; ambos retornaram 304 nos pedidos condicionais corretos |
| CDN | `Server: Vercel`, `X-Vercel-Cache: HIT` e `MISS` conforme o recurso |
| User-Agent de Safari no iPhone | HTML, CSS e JS retornaram 200 com MIME correto; pedidos condicionais retornaram 304 |

Os corpos e os cabeçalhos selecionados estão em `.omo/evidence/cache/`, fora do
Git. Não se observaram 404 de recursos reais, MIME incorreto ou fallback para
HTML nesta amostragem. `Last-Modified` e `Age` diferentes por recurso não provam
uma mistura de deploys. O cache observado na Vercel já exigia revalidação; não
foi identificado um TTL excessivo em produção.

**Não foi reproduzido o defeito no Safari do iPhone do visitante.** WebKit no
Linux está disponível, mas não substitui Safari/iOS nem permite inspecionar o
perfil afetado, seus bloqueadores ou seu armazenamento anterior.

Hipóteses, por evidência disponível:

1. Falha de carregamento/reuso de CSS específica de uma sessão é compatível com
   o relato. A causa exata (cache local, resposta transitória, bloqueio) segue
   não confirmada, sem captura de rede da sessão afetada.
2. As URLs estáveis, sem identificação de conteúdo, são uma fragilidade
   comprovada: HTML, CSS e módulos de versões diferentes podem usar a mesma URL.
   Isso não prova que CSS antigo sozinho produza o fundo branco.
3. Extensões ou bloqueadores podem diferir entre perfis e navegação privada;
   não há evidência de que sejam a causa neste caso. O código não depende de
   CSS de terceiros nem usa carregamento tardio do stylesheet principal.
4. Não há evidência de Service Worker deste projeto causando o problema.
   Um registro de outro código antigo no dispositivo não é inspecionável daqui;
   não se remove indiscriminadamente Service Workers ou dados da origem.

O sintoma de logo enorme e links sem estilo indica que o stylesheet global não
foi aplicado. CSS antigo válido ainda contém o tema escuro; portanto não se deve
confundir ausência de CSS com uma prova de incompatibilidade entre versões.

Referências primárias:
[cache e versionamento HTTP (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching),
[MIME de stylesheets (MDN)](https://developer.mozilla.org/en-US/docs/Web/Security/Practical_implementation_guides/MIME_types),
[perfis e extensões no Safari (WebKit)](https://webkit.org/blog/14445/webkit-features-in-safari-17-0/),
[configuração estática da Vercel](https://vercel.com/docs/project-configuration/vercel-json),
[clone raso da Vercel](https://vercel.com/docs/builds/configure-a-build).

## Correção implementada

`npm run build` executa `scripts/build-site.mjs`, sem dependências externas de
aplicação. Os fontes permanecem em `site/`; o resultado fica em `dist/`, ignorado
pelo Git. Não há JavaScript extra de recuperação, recarregamento em loop, remoção
de armazenamento, cache-buster por relógio ou Service Worker novo.

- Um SHA-256 calculado sobre os nomes e bytes de todos os CSS/JS identifica a
  release. Ex.: `/assets/releases/<24 caracteres hex>/styles.css`.
- Qualquer mudança de CSS/JS gera outra URL automaticamente. Sem mudança, o
  build é determinístico. Não há versão manual nem query fixa.
- O HTML passa a referenciar essa release. Todos os módulos são copiados para
  a mesma árvore, preservando imports relativos estáticos, dinâmicos e ciclos.
  Assim o Morse não mistura seu módulo principal e seu áudio entre versões.
- O build valida imports e referências de CSS/JS no HTML antes de substituir o
  artefato anterior. Recursos ausentes fazem o build falhar.
- As releases das revisões anteriores são reconstruídas do histórico Git,
  deduplicadas pelo hash. Abas antigas mantêm seus recursos, mesmo num build
  limpo da Vercel. O histórico inclui somente CSS/JS públicos, sem dados ou
  credenciais. Alterações só no JSON solar não geram outra release.
- O build verifica checkout raso e usa `git fetch --unshallow origin` quando
  esse remoto existe. Em checkouts gerenciados sem `origin`, usa diretamente a
  URL pública declarada em `package.json#repository.url`. Se a obtenção do histórico falhar, não publica um resultado que
  abandonaria recursos antigos. Em um checkout completo não há pedido de rede.
- URLs antigas de CSS/JS permanecem disponíveis e revalidáveis para documentos
  anteriores à adoção do versionamento. Não é possível alterar um HTML que já
  está no cache de um visitante antes da publicação da correção.
- `vercel.json` define `public, no-cache` para HTML, JSON solar e caminhos
  estáveis: permite armazenamento e respostas 304, exigindo revalidação.
- Somente `/assets/releases/<hash>/...` recebe
  `public, max-age=31536000, immutable`. Não se desliga todo o cache.
- `X-Content-Type-Options: nosniff` impede tratar respostas incorretas como CSS
  ou JS. As extensões `.css` e `.js` permanecem e mantêm os MIME nativos do host.
- Não há rewrite de arquivo inexistente para `index.html`. O servidor deve
  continuar respondendo 404 a CSS/JS ausentes.

Os simulados originais são preservados byte a byte, inclusive scripts inline,
chaves de localStorage e conteúdo normativo. Não foram alterados filtros,
cálculos, navegação ou a coleta solar.

## Validação executável

```bash
npm run build
npm test
python3 -m unittest discover -s tests -p 'test_*.py'
CHROMIUM_EXECUTABLE=/caminho/do/chrome node tests/cache-update.browser.mjs
```

O teste de navegador cria um servidor HTTP temporário local e aplica as políticas
declaradas no `vercel.json`. Não executa Vercel nem atesta a configuração de um
deploy remoto que ainda não foi autorizado.

Cobertura:

- Build determinístico, alteração de URL por conteúdo e dependências transitivas.
- Importação dinâmica e ciclo do Morse preservados na mesma release.
- Atualização A → B com build limpo, preservando recursos A pelo Git.
- Clone raso com recuperação automática do histórico.
- Falha de import detectada sem substituir artefato anterior.
- CSS/JS com bytes esperados, MIME correto, cache imutável e ETag/304.
- CSS inexistente respondendo 404, não uma página HTML.
- Carregamento inicial, reload, menu, filtros e ausência de overflow em 390 px.
- Perfis persistentes e contextos efêmeros separados em Chromium e WebKit.
- Uma simulação controlada de cache danificado: stylesheet vazio mantém o ETag
  do arquivo correto e é reaproveitado após 304. A sessão persistente continua
  sem CSS enquanto uma sessão nova funciona. Publicar localmente a versão com
  hash restaura o tema sem limpar o perfil. **Essa injeção não foi observada na
  produção nem comprova a causa do iPhone.**

## Publicação posterior e rollback

Nenhuma publicação foi realizada. Após autorização, o projeto Vercel deve usar
Root Directory na raiz do repositório para ler `vercel.json`, executar
`npm run build` e servir `dist/`. Se o painel estiver configurado para usar
`site/` como Root Directory, será necessário alinhar essa configuração; somente
criar este arquivo não altera o painel remotamente.

O build não envia nada ao GitHub nem à Vercel. A prévia de desenvolvimento pode
continuar usando `site/` como antes. Um `python -m http.server --directory dist`
permite conferir o layout, mas não aplica os headers da Vercel.

Na publicação autorizada, verificar por GET (não apenas HEAD):

1. HTML novo referencia `/assets/releases/<hash>/...`, com revalidação HTTP.
2. CSS responde 200 `text/css`, JS responde 200 JavaScript, ambos com o cache
   imutável previsto, e os corpos correspondem ao manifesto.
3. Uma release anterior continua acessível e CSS inexistente responde 404.
4. Origem canônica e redirecionamento continuam funcionando.
5. No iPhone afetado, conferir primeira abertura, reload e retorno a uma aba
   antiga sem limpar os dados; registrar status, MIME e erro de carregamento
   caso persista. Extensões/bloqueadores podem ser comparados para diagnóstico,
   sem tratá-los como causa presumida nem como requisito de uso do site.

Rollback: restaurar a publicação anterior na Vercel. Os fontes em `site/` e as
URLs originais continuam existindo. Se houver uma release já usada em produção,
não remova seus recursos imutáveis durante a janela de uso; o build mantém o
histórico por padrão justamente para preservar esse contrato.

## Resultado desta execução

- `npm run build`: passou; artefato gerado localmente em `dist/`.
- `npm test`: 77 testes passaram, incluindo sete do build/publicação.
- `unittest`: 23 testes passaram.
- Cache/update: Chromium e WebKit passaram nos cenários descritos acima.
- Header sobre o artefato versionado: Chromium e WebKit passaram em 320, 375,
  390, 430, 768 e 1440 px, incluindo menu, teclado, texto ampliado e fallback
  sem JavaScript.
- Seis páginas técnicas sobre o artefato versionado: Chromium e WebKit passaram
  em 320, 390, 768 e 1440 px, incluindo cálculos, filtros e erros de entrada.
- O teste do build também verifica que arquivo ausente ou vazio no cache local
  de artefatos é reconstruído a partir dos fontes, sem reutilizar bytes inválidos.
- Validação remota de um deploy com as novas regras e teste no iPhone físico
  permanecem dependentes de publicação autorizada e acesso ao dispositivo.


## Correção do checkout da Vercel sem origin

O log do deploy de `939de94` confirmou um checkout raso em `/vercel/path0` sem
remoto `origin`. A tentativa de `git fetch --unshallow origin` interrompia o
build antes de gerar o artefato. O novo teste reproduziu a mesma falha antes da
correção, removendo `origin` de um clone raso real.

Agora o build usa `origin` quando disponível e, na ausência dele, busca o
histórico pela URL pública do repositório declarada em `package.json`.
A recuperação continua obrigatória: não se ignora o erro nem se abandona a
preservação de CSS/JS antigos. O teste verifica a geração de `dist/index.html`,
a recuperação do histórico e os bytes de uma release anterior.
