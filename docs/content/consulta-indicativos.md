# Consulta de indicativos e atualização diária

Página: `/ferramentas/indicativos.html`. Fonte primária: Anatel, `Estacoes_Radioamador.csv` do arquivo https://www.anatel.gov.br/dadosabertos/paineis_de_dados/outorga_e_licenciamento/estacoes_licenciadas.zip . Painel de referência: https://informacoes.anatel.gov.br/paineis/outorga-e-licenciamento/estacoes-radioamador . O MGSCODE foi consultado como referência de funcionalidade; a implementação e o desenho são próprios, sem depender do seu servidor.

## Dados e consulta

Importação local em 26/10/2026: CSV SHA-256 `284b7ae0b9ae860ed70235b6b4cce0eaab4a0eb353c47163e8b60ae6225d8ffb`; 71.319 registros consultáveis e 46.667 indicativos. Nove registros `N/I` sem indicativo são excluídos. Letras são normalizadas para maiúsculas, preservando grafias e hífens legados do arquivo, sem transformar grafias não usuais em outro indicativo.

O coletor contempla as 18 colunas do arquivo: o indicativo identifica o grupo de resultados; os outros 17 campos incluem titular, tipo de identificação, CPF mascarado/CNPJ, Fistel, serviço, COER, nome/número/tipo da estação, frequências, UF do titular, município/UF da estação, datas e status. O CPF permanece exatamente no formato público `***12345**` (exemplo fictício); um CPF sem essa máscara interrompe a importação, preservando a base anterior. Números de documento, Fistel e estação são strings, preservando zeros iniciais. Campos não previstos no arquivo atual não são publicados automaticamente. Valores `N/I` e `N/A` são representados como ausentes; nunca se conclui que uma licença está ativa só porque sua data está no futuro. Município/UF da entidade não são usados para preencher indevidamente a localização de uma estação móvel.

Busca exata por indicativo, com um arquivo por prefixo. A consulta revalida o manifest e busca uma revisão específica; diferentes revisões não se misturam. O status “não encontrado” não equivale a disponibilidade para atribuição. Falha de rede/dados gera mensagem própria, sem falso negativo. A busca é apenas por indicativo, sem busca por CPF, geolocalização residencial ou histórico de buscas.

## Publicação automática

- Workflow separado: `.github/workflows/update-indicativos.yml`, diário às **12:17 UTC / 09:17 de Brasília**, com execução manual e execução após alteração do coletor/workflow em `main`.
- Branch `indicativos-data`, criada na primeira execução. Publicação em `manifest.json` e `versions/<revisão-do-CSV-e-projeção>/<prefixo>.json`.
- A Vercel reescreve `/assets/data/indicativos/:path*` para essa branch; sua atualização não causa deploy. A branch solar e seu fluxo horário permanecem independentes.
- HEAD com ETag compara a fonte antes de baixar o ZIP (224.892.736 bytes na revisão inicial). Se nada mudou na fonte nem na projeção dos campos, registra somente a nova conferência; não altera a data da coleta. Uma mudança de projeção força a reimportação mesmo com ETag igual, e gera outra revisão para não misturar arquivos em cache.
- Colunas, máscara de CPF, classes, status, datas, volume mínimo e queda superior a 20% são validados. Falha impede o commit: última base válida preservada, workflow sinaliza erro. Mantém a revisão anterior para consultas em andamento.
- Datas de coleta e conferência aparecem no produto; após mais de três dias sem conferência, aparece aviso de base antiga. A cópia não é vendida como consulta em tempo real. Agendamentos GitHub Actions podem atrasar e dependem da disponibilidade da fonte.

A pasta local gerada `site/assets/data/indicativos/` é ignorada pelo Git e removida do `dist` no build, para não sombrear o rewrite em produção. A prévia serve essa pasta local por mapeamento em `scripts/preview-site.py`.

Atualização local:

```sh
python3 scripts/update-indicativos-data.py --output site/assets/data/indicativos
npm run build
```

Para importar um ZIP oficial já baixado, adicionar `--zip /caminho/estacoes_licenciadas.zip`. O ZIP bruto fica fora da raiz servida e não é versionado.

## Verificação

`tests/indicativos.test.mjs`, `tests/test_indicativos_import.py` e `tests/indicativos.browser.mjs` cobrem seleção de prefixo, normalização, múltiplas estações, troca de revisão, ausência vs. indisponibilidade, projeção dos campos publicados, preservação após falha, ETag, base real em Chromium/WebKit e quatro larguras. Não se exige autenticação no gov.br nem se automatiza fluxo autenticado da Anatel.

## Ampliação dos campos

Projeção 2: mantém `schema: 1` para compatibilidade com a interface anterior, mas usa revisão diferente da projeção inicial. A nova interface continua aceitando registros antigos com os campos adicionais ausentes enquanto a publicação automática termina. Resultados são organizados em três grupos: titular/identificação, estação/operação e licenciamento. Município da estação e UF do titular permanecem separados; frequências são exibidas literalmente, sem interpretação de unidades nem preenchimento por faixa presumida.

Testes adicionais cobrem todos os campos, preservação da máscara e strings, bloqueio de CPF sem máscara, reimportação por mudança de projeção, retenção da revisão anterior e compatibilidade da interface com a base anterior.
