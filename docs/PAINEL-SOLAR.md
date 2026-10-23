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

## Operação local e futura publicação

Prévia: `http://100.125.41.28:18789/`.

```bash
systemctl --user status radioamador-solar-update.timer
journalctl --user -u radioamador-solar-update.service -n 20
python3 scripts/update-solar-data.py
```

O timer temporário local foi criado com `systemd-run --user`, primeira execução
após um minuto, próximas a cada hora. O bloqueio do coletor impede uma nova
consulta se o XML inicial foi importado há menos de uma hora. Essa unidade não
sobrevive a reinício; nenhuma mudança de produção foi realizada.

Para produção, integrar a coleta horária à infraestrutura real de hospedagem:
job/build que atualize e publique o snapshot, ou coletor que sirva o arquivo no
mesmo domínio. Só publicar o JSON uma vez deixa os dados envelhecerem; o painel
indica isso explicitamente. Não foi introduzido servidor de aplicação no projeto.

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
