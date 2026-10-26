# Logo do cabeçalho — 26/10/2026

Relato: logo aparece quebrada no primeiro acesso em Safari/Chrome no iPhone, voltando após recarregar.

## Evidência e limites

Os arquivos WebP e JPEG responderam HTTP 200 nas origens com e sem `www`, com tipos corretos e bytes idênticos aos arquivos locais. Não se reproduziu a falha exata do perfil do visitante. Não há evidência suficiente para atribuir a origem a hardware, ao decodificador do iOS ou a uma camada específica de cache/rede.

O cabeçalho anterior dependia de uma requisição WebP e de fallback por JavaScript para outra requisição JPEG. O fallback existente funciona nos testes quando só o WebP falha. Uma falha simulada das duas requisições deixa a imagem quebrada, confirmando a dependência externa sem provar que foi exatamente o incidente observado no telefone.

## Correção

O build incorpora os 9.413 bytes do JPEG reduzido (126×125) diretamente no `img` do cabeçalho como data URI, retirando o `source` WebP nessa marcação publicada. A logo chega com o HTML e não depende de outra requisição, de cache de imagem ou de JavaScript para aparecer. A alteração se restringe à imagem do cabeçalho; não modifica outros arquivos de imagem ou o banco dos simulados. A fonte em `site/` continua utilizável pelo fluxo anterior.

Custo: aproximadamente 12,6 KB adicionais de texto por HTML antes da compressão HTTP. O desenho e o tamanho visual de 42 px permanecem iguais.

## Verificação

- Teste de build compara os bytes da imagem incorporada com o JPEG original em home, catálogo, consulta e simulado.
- `tests/header-logo.browser.mjs`: Chromium e WebKit, três rotas, primeiro acesso e dois reloads, recursos externos da logo bloqueados, com/sem JavaScript. Logo carregada sem nenhum pedido de imagem do cabeçalho, tamanho visual preservado e sem overflow.
- WebKit no Linux não substitui uma reprodução no Safari de um iPhone físico. A correção elimina a dependência implicada no carregamento, sem alegar diagnóstico conclusivo da sessão original.
