# Painel solar próprio em pt-BR

Substitui o banner remoto em inglês por uma tabela categórica de condições HF,
separando cenários de dia/noite, e cartões SFI, SN, A, K, vento solar e raios-X.
Fonte e autoria permanecem visíveis. Não se infere percentual de sucesso,
histórico temporal, condições brasileiras ou abertura no local do usuário.

## Fonte e coleta

- Feed: https://www.hamqsl.com/solarxml.php
- Política: https://www.hamqsl.com/solar.html, seção XML/RSS. O autor pede
  atualização no máximo uma vez por hora e aprecia crédito a HamQSL.
- Verificação em 23/10/2026: HTTP 200, XML válido, sem cabeçalho
  `Access-Control-Allow-Origin` para a origem de prévia. CORS impede o navegador
  de ler diretamente a resposta; não se usa proxy público nem `no-cors`.
- Apenas o coletor consulta a origem; visitantes leem `/assets/data/solar.json`.
- Python padrão: `python3 scripts/update-solar-data.py`. Agendar uma vez por hora.
  A primeira prévia foi inicializada com o XML real já baixado, sem segunda consulta.
- Lock de arquivo evita concorrência. Horário da última tentativa limita chamadas
  mesmo quando o upstream falha. JSON só é substituído após validar a resposta.
- `.solar-last-attempt` e `.solar-update.lock` são estado local ignorado pelo Git.
  `solar.json` é um snapshot público real, com data de origem e da coleta; não é
  uma configuração nem contém dados pessoais. O arquivo inicial fica versionável.
- Valores ausentes viram `null`/`unknown`, não zero ou condição favorável. Textos
  externos entram por `textContent`. Respostas HTML, XML inválido, DTD e condições
  ausentes são recusadas, preservando o último arquivo bom.

## Interface

`solar-data.js`: validação do snapshot, tradução, horário pt-BR/Brasília e
critério de envelhecimento (mais de seis horas desde fonte ou coleta).

`solar-panel.js`: carregamento do JSON local com timeout de dez segundos,
estados carregando/disponível/antigo/indisponível e nova tentativa manual.
Nenhum acesso direto à origem ou reprodução da imagem de terceiro.

Uma falha posterior de leitura mantém a última informação da sessão com aviso.
Sem JavaScript há explicação e link da fonte; não se mostra um painel fictício.
Cores acompanham os tokens existentes, com texto para não depender só da cor.

## Atualização em produção

`.github/workflows/update-solar.yml` roda em `main` por `schedule` no minuto 37
de cada hora UTC e por `workflow_dispatch`. Não há disparo por push: isso evita
recursão. O GitHub pode atrasar execuções; o limite de uma consulta por hora é
mantido pelo coletor mesmo quando jobs atrasados ou manuais se sobrepõem.

O job recupera a branch pública `solar-data` em um worktree separado. Ela contém:

- `solar.json`: último boletim válido, com os mesmos campos já consumidos no site.
- `.solar-last-attempt`: instante da última tentativa, incluindo as que falharam.
- `vercel.json`: desabilita deploys dessa branch de dados.

A janela de coleta sobrevive à troca de runner, sem depender do cache dos
Actions. Concorrência é serializada por `solar-data-publication`. Mesmo que a
origem falhe, o job registra a tentativa e mantém o JSON anterior; o resultado
do workflow sinaliza a falha. Só arquivos de dados entram nesse commit, nunca
os arquivos de `main`. Push normal, sem force, impede sobrescrever uma
publicação concorrente.

A automação usa `GITHUB_TOKEN` com `contents: write` e não requer segredos extras.
A branch é pública como o repositório; nela não há credenciais nem dados de
visitantes. Cada atualização é um commit pequeno de dados, sem deploy do site.

Em `main`, `vercel.json` configura um rewrite externo exato de
`/assets/data/solar.json` para
`https://raw.githubusercontent.com/wendells01/radioamador-brasil/solar-data/solar.json`.
O visitante continua lendo JSON pelo domínio do site e não consulta HamQSL ou
GitHub diretamente. O endpoint é revalidável e declara `application/json`.
O cache do provedor externo pode acrescentar alguns minutos à propagação.

O build remove **somente do artefato `dist/`** o antigo snapshot nesse caminho:
na Vercel, um arquivo estático teria precedência sobre o rewrite. O arquivo em
`site/` permanece intacto para prévia local. As demais rotas e as políticas de
cache dos CSS/JS continuam iguais. O teste de build verifica que a exceção de
rewrite é exclusivamente o JSON solar e não um fallback genérico de HTML.

Operação:

```bash
gh workflow run update-solar.yml --ref main
gh run list --workflow update-solar.yml --limit 5
```

Verificar a coleta e comparar origem/publicação:

```bash
curl -fsS https://www.radioamadorbrasil.site/assets/data/solar.json
curl -fsS https://raw.githubusercontent.com/wendells01/radioamador-brasil/solar-data/solar.json
```

Não fazer consultas extras ao XML para testar o painel. O workflow pode concluir
sem outra consulta se a última tentativa ocorreu há menos de uma hora.

Para pausar a coleta, desabilite o workflow; o último boletim continua disponível.
GitHub pode desabilitar agendamentos de repositórios públicos inativos por 60
dias; os commits de atualização mantêm atividade em condições normais.

Referências:
[agendamento GitHub Actions](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule),
[Git na Vercel](https://vercel.com/docs/project-configuration/git-configuration),
[rewrites e precedência de arquivos](https://vercel.com/docs/project-configuration/vercel-json#rewrites).

## Prévia local

A prévia pode continuar lendo `site/assets/data/solar.json`. O antigo timer
`radioamador-solar-update.timer` é temporário da máquina e não é necessário
para manter o site público atualizado. Ao ativar a coleta de produção, parar o
timer local evita consultas duplicadas ao HamQSL para o mesmo site.

```bash
systemctl --user status radioamador-solar-update.timer
journalctl --user -u radioamador-solar-update.service -n 20
```

## Validação

- Testes Python com XML real capturado e datas fixas: valores, parsing de UTC,
  ausentes, formatos recusados, limite horário inclusive em falhas e preservação.
- Testes Node com fixture fixa, independente do arquivo atualizado pelo timer:
  tradução, fuso de Brasília, envelhecimento e payloads inválidos.
- `tests/solar.browser.mjs`: Chromium e WebKit, 320/390/768/1440 px; primeira carga
  do snapshot real da prévia, nenhuma chamada externa, seis indicadores e quatro
  grupos, ausência de overflow. Depois respostas controladas de falha e boletim
  antigo, nova tentativa e preservação da última leitura.
- Screenshot WebKit 390 px inspecionado em `/tmp/radio-fontes/solar-ptbr-mobile.png`.

```bash
npm test
python3 -m unittest discover -s tests -p 'test_*.py'
BASE_URL=http://100.125.41.28:18789 CHROMIUM_EXECUTABLE=/caminho/do/chrome node tests/solar.browser.mjs
```

O teste antigo de assets externos foi fortalecido: agora nenhuma página própria
pode carregar recursos externos, em vez de permitir o banner remoto da home.
