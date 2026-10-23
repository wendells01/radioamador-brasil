# Ferramentas técnicas

Implementação estática em HTML/CSS e ES Modules, sem dependências de produção novas. As imagens de referência não estavam disponíveis; os requisitos textuais orientaram as interfaces. Não foi realizado push ou deploy.

## Entradas e arquivos

- `/ferramentas/coaxiais.html`: módulos 1–3, calculadora, comparação dinâmica e guia físico/educativo.
- `/ferramentas/faixas.html`: módulo 4, consulta de segmentos, classes e comprimentos de onda, com explicações de propagação.
- `/ferramentas/emergencias.html`: módulo 5, consulta por serviço, classificação, frequência e finalidade.
- `/ferramentas/flowerpot.html`: módulo 6, dimensões iniciais da meia onda e protótipo dual-band.
- `/ferramentas/chokes.html`: módulo 7, geometria de enrolamento e encaixe de ferrites.
- `/ferramentas/exposicao-rf.html`: módulo 8 **parcial**, somente conversões de potência. Distâncias não disponíveis.

Os motores e dados ficam em `site/assets/js/tecnica/`; arquivos `*-ui.js` fazem o binding. `ui.js` reúne formatação pt-BR, escape HTML, tabelas e apresentação de resultados/erros. `site/assets/tecnica.css` complementa os tokens e controles existentes. Catálogo, menus e referência rápida conectam as novas rotas. Simulados importados preservados.

## Coaxiais: procedência e método

Verificação: 23/10/2026. Cada produto tem URL, domínio, condições e método em `coaxiais.js`, disponíveis também na interface. Dados não se aplicam automaticamente a outro fabricante, versão UltraFlex ou cabo sem identificação.

| Produto Belden | Família de catálogo | Revisão do PDF consultado | Fonte |
| --- | --- | --- | --- |
| 8259 | RG-58 | 0.533, 20/02/2026 | https://catalog.belden.com/techdata/EN/8259_techdata.pdf |
| 9201 | RG-58/U | 0.623, 02/04/2026 | https://catalog.belden.com/techdata/EN/9201_techdata.pdf |
| 9258 | RG-8X | 0.514, 20/02/2026 | https://catalog.belden.com/techdata/EN/9258_techdata.pdf |
| 8267 | RG-213/U | 0.599, 20/02/2026 | https://catalog.belden.com/techdata/EN/8267_techdata.pdf |
| 8237 | RG-8/U | 0.534, 20/02/2026 | https://catalog.belden.com/techdata/EN/8237_techdata.pdf |

Os cabeçalhos atuais dos PDFs usam designações RG abreviadas; o número de produto é a identidade efetiva. O texto descritivo do PDF 9201 contém inconsistência editorial RG-8, enquanto o campo RG Type informa 58. Usa-se a identidade 9201 e sua especificação elétrica de 52 Ω, não a aproximação genérica de 50 Ω.

- Belden: pontos de atenuação nominal em MHz e dB/100 ft; conversão exata por divisão por 0,3048. Interpolação log-log (lei de potência por intervalo), adequada a dados positivos e monotônicos, sem extrapolar. Não equivale a curva medida intermediária nem incorpora tolerâncias.
- Times Microwave: expressão do fabricante `a√f + bf` em dB/100 ft, f em MHz, convertida para dB/100 m. Domínio conservador de 30 a 8.000 MHz, correspondente à tabela. Linha adaptada a 25 °C.
- [LMR-195](https://timesmicrowave.com/wp-content/uploads/2022/06/lmr-195-datasheet.pdf), [LMR-240](https://timesmicrowave.com/wp-content/uploads/2022/06/lmr-240-datasheet.pdf), [LMR-400](https://timesmicrowave.com/wp-content/uploads/2022/06/lmr-400-datasheet.pdf), [LMR-600](https://timesmicrowave.com/wp-content/uploads/2022/03/lmr-600-coax-cables-datasheet.pdf).
- A separação de watts dissipados pressupõe as perdas adicionais agrupadas na saída do cabo. A soma total em dB independe dessa ordem para uma linha linear adaptada; as parcelas de calor não.
- Potência de entrada é um parâmetro de cálculo de perdas, não aprovação térmica do cabo/conector. Não se interpola potência máxima sem confirmar condições térmicas, altitude, ROE e ambiente do fabricante.
- Não se computam reflexão, perdas adicionais por ROE, correntes externas, envelhecimento ou falhas.

## Fontes regulatórias e educativas

Consulta em 23/10/2026. O portal `informacoes.anatel.gov.br` retornou manutenção em acessos diretos repetidos. Trechos do texto oficial foram recuperados pela busca indexada; essa distinção é indicada nas páginas quando impede a confirmação necessária.

- [Ato 926/2024](https://informacoes.anatel.gov.br/legislacao/atos-de-requisitos-tecnicos-de-gestao-do-espectro/2024/1919-ato-926): Tabela I, limites e classes. Os segmentos com classes diferentes ficam separados. LF/MF incluídas, assim como HF até EHF. A tabela é índice, sem autorizar todos os modos em toda a faixa. Notas integrais do PDFF e todos os subsegmentos de emissão **não foram auditados integralmente**.
- [Ato 3448/2026, PDF oficial](https://www.gov.br/anatel/pt-br/assuntos/noticias/anatel-simplifica-regras-e-fortalece-o-radioamadorismo-no-brasil/ato-3448-2026.pdf): requisitos operacionais e COER. Não deve ser confundido com o plano de atribuição. Consulta Pública 39/2026 localizada é proposta, não foi tratada como alteração já vigente.
- [PDFF, Resolução 789/2026](https://informacoes.anatel.gov.br/legislacao/resolucoes-internas/2157-x): referência oficial indexada de 2026; revoga a 772/2025. O portal institucional de radioamador ainda menciona a 772; não se adotou essa menção como prova de vigência.
- [IARU Região 2](https://www.iaru-r2.org/en/reference/band-plans/): recomendações subordinadas à legislação nacional.
- [IARU, centros de atividade de emergência](https://www.iaru-r1.org/about-us/committees-and-working-groups/emcomm/emergency-communications-frequencies/): referências regionais/globais, não canais oficiais nacionais.
- [ARRL, propagação](https://www.arrl.org/propagation-of-rf-signals): referências educativas; descrições típicas não são previsões de alcance.
- [Ato 883/2024](https://informacoes.anatel.gov.br/legislacao/atos-de-requisitos-tecnicos-de-gestao-do-espectro/2024/1918-ato-883): serviço marítimo, canais 16, 70 e operação coordenada no 6.
- [DECEA, AIP GEN 3.6, edição de 01/10/2026](https://aisweb.decea.mil.br/eaip/20-2026_2026_10_01/eAIP/GEN%203.6-pt-BR.html): socorro aeronáutico e 121,5 MHz.
- [FAB/BRMCC, codificação](https://www2.fab.mil.br/brmcc/index.php/codificacao): balizas de 406 MHz; não são canal de voz.
- [LABRE, APRS](https://www.labre.org.br/labre-ce-inaugura-digipeater-aprs-em-fortaleza/): uso brasileiro de 145,570 MHz. Cobertura e escuta não garantidas.
- [Ministério das Comunicações, telefones, setembro/2026](https://www.gov.br/mcom/pt-br/noticias/noticias_alt/2026/setembro/emergencia-voce-sabe-para-quem-ligar-quando-precisa-de-ajuda).
- SRC: a canalização histórica foi encontrada em [texto oficial](https://informacoes.anatel.gov.br/legislacao/index.php/component/content/article?id=325), mas a vigência da regra de emergência do canal 9 não foi confirmada. Registro explicitamente histórico, sem autorização de uso inferida. Redes policiais não foram catalogadas; há indicação dos telefones públicos.

## Flowerpot e chokes

- [VK2ZOI meia onda](https://vk2zoi.com/articles/half-wave-flower-pot/) e [dual-band](https://vk2zoi.com/articles/dual-band-half-wave-flower-pot/), consultados em 23/10/2026. Diagramas externos inspecionados, não incorporados ao site. O SVG local é original e declaradamente sem escala.
- Meia onda: escala geométrica inicial dos elementos do protótipo de 2 m em torno de 146 MHz, restrita na ferramenta a 50–150 MHz. Não é uma substituição por fórmula de dipolo. Choke selecionado entre geometrias experimentais publicadas, sem previsão de impedância; no protótipo preserva-se a configuração original.
- Dual-band: dimensões da manga do protótipo, somente referência 146 MHz. Não se extrapola a manga para outros pares de bandas nem se promete ganho/ROE. Terceira harmônica não implica autorização para transmitir em 438 ou 450 MHz sem verificar a ocupação inteira da emissão e regras locais.
- A tabela de chokes RG58 não identifica fabricante e usa curvas mais apertadas que alguns datasheets: incompatibilidade explicitada. Não é aplicada automaticamente ao catálogo Belden/LMR.
- Enrolamento arbitrário: geometria helicoidal de uma camada, diâmetro de suporte externo, diâmetro de cabo cadastrado, passo = diâmetro + vão livre. Não calcula indutância/impedância universal; rejeita raio inferior ao mínimo do cabo.
- [Fair-Rite 0431177081](https://fair-rite.com/product/round-cable-snap-its-431177081/): abertura mínima e dimensões do núcleo, material 31. A página atual apresenta duas tabelas divergentes de impedância; o motor não escolhe uma série arbitrariamente. Suporte é mecânico e educativo, uma passagem por núcleo; não há modelo de temperatura, saturação ou impedância por múltiplas espiras.

## Exposição RF: impedimento real e trabalho restante

- [Resolução 700/2018](https://informacoes.anatel.gov.br/legislacao/resolucoes/2018/1161-resolucao-700), [Ato 17865/2023](https://informacoes.anatel.gov.br/legislacao/atos-de-requisitos-tecnicos-de-gestao-do-espectro/2023/1914-ato-17865) e [notícia oficial de publicação](https://www.gov.br/anatel/pt-br/assuntos/noticias/anatel-atualiza-os-requisitos-tecnicos-para-a-exposicao-humana-a-campos-eletromagneticos).
- Vigência inicial de 01/03/2024 e finalidade do Subanexo IV identificadas. As expressões gráficas da Tabela D.I não puderam ser lidas na fonte oficial em manutenção. Fontes secundárias não foram usadas para preencher coeficientes normativos.
- Disponível: conversão de potência conduzida/ERP/EIRP, perdas em dB e ganho dBi/dBd. Conversão convencional de 2,15 dB entre ganho isotrópico e relativo ao dipolo de meia onda. ERP/EIRP informadas diretamente não recebem novamente perdas ou ganho.
- **Pendente:** confirmar expressões de cada intervalo, fronteiras, grandeza de potência e alterações posteriores; só então implementar e testar distâncias/critério de isenção. A função `referenceDistance` falha explicitamente e a interface não exibe distância simulada.
- A página não é laudo, certificado, avaliação completa de exposição nem parecer de isenção. Fora de 1 MHz a 300 GHz, o domínio do Subanexo IV não é inferido.

## Verificação

- `npm test`: testes matemáticos e regressão, usando o runner nativo do Node.
- `python3 -m unittest discover -s tests -p 'test_*.py'`: integridade de assets/rotas e integração HTML.
- `node tests/tecnica.browser.mjs`: opcional, exige Playwright disponível no ambiente. Sobe servidor Python local temporário (porta 18788), fecha-o ao terminar; `BASE_URL` usa servidor externo já disponível. `CHROMIUM_EXECUTABLE` permite navegador instalado fora do caminho padrão, `BROWSER=webkit` limita ao WebKit.
- O teste de navegador exercita seis páginas a 320, 390, 768 e 1440 px, inputs com vírgula, filtros, erros, estados ocultos, labels, IDs, overflow e falhas de carregamento. WebKit em Linux é aproximação de compatibilidade Safari; não substitui iPhone físico ou leitor de tela real.
