# Revisão visual do site — 25/10/2026

Direção: aberturas com tipografia forte, ilustração técnica própria e ação principal clara; paleta e navegação existentes. Referência aprovada pelo usuário: abertura do guia Voyager descartado. Rodada inicialmente local, avaliada pelo usuário via iPhone/Tailscale; envio ao GitHub autorizado após a revisão.

Foram inspecionadas as 18 páginas em 390 e 1280 px. Nenhuma apresentou overflow horizontal. A análise considerou o assunto, a prioridade de uso e as ilustrações já existentes; o número de SVGs no HTML não representa todos os desenhos, pois vários são renderizados por JavaScript.

| Página | Oportunidade encontrada | Resultado desta rodada / próximo passo |
| --- | --- | --- |
| Início | Já tem abertura com identidade e ambientação de rádio. | Manter nesta rodada; depois aproximar a clareza da ilustração e reforçar a escolha entre estudar e usar ferramentas. |
| Ferramentas | Catálogo começa com título genérico e cartões de peso semelhante. | **Redesenhado:** abertura de bancada ilustrada, título mais direto, CTA ao catálogo e acabamento dos cartões. |
| Simulados — catálogo | Pode transmitir melhor a ideia de preparação e progressão. | **Redesenhado:** composição de estudo C/B/A, CTA para escolher a classe e cartões com mais identidade. Ilustração não substitui regras de promoção/habilitação. |
| Entenda seu HT | Melhor oportunidade para reaproveitar a linguagem visual elogiada no Voyager. | **Redesenhado:** abertura “Muito além do PTT”, HT desenhado e acesso aos controles; preservados diagramas e explicações existentes. |
| Referência rápida | Consulta depende de velocidade; existe espaço excessivo antes da busca. | Próxima rodada: compactar a abertura, elevar a busca e usar fonética/códigos como detalhe visual, sem hero alto. |
| Links úteis | Muito texto introdutório antes das categorias. | Próxima rodada: introdução menor, categorias mais visíveis e domínio/proveniência legíveis; ilustração discreta de conexões. |
| Dipolo | Já possui título mais autoral e desenho do resultado ligado à frequência. | Manter nesta rodada; pode receber aprimoramento da composição sem duplicar o diagrama existente. |
| Coaxiais | Formulário aparece antes de uma explicação visual do próprio cabo. | **Redesenhado:** corte esquemático em camadas, abertura focada no caminho até a antena e CTA para a calculadora. Preservados resultados, comparação e gráficos. |
| Flowerpot | Assunto construtivo com abertura genérica. | **Redesenhado:** ilustração do elemento superior, malha e choke; chamada ao dimensionamento. Sem modificar medidas ou hipóteses. |
| Chokes | Grande formulário ocupa a primeira tela sem introdução do objeto físico. | **Redesenhado:** bobina ilustrada, explicação de geometria e CTA ao projeto. Não se apresenta impedância inventada ou desempenho garantido. |
| Locator | Três tarefas aparecem em sequência sem uma imagem que unifique o tema. | **Redesenhado:** globo, ligação conceitual e bússola; CTA à conversão de coordenadas. Mantidas as três ferramentas e a geolocalização. |
| Faixas | Tabela e filtros dominam a percepção inicial. | **Redesenhado:** percurso conceitual solo/ionosfera, título de exploração e CTA aos filtros. Esquema não prevê propagação real. |
| Morse | Conversão/escuta já são a demonstração mais útil. | Próxima rodada: transformar o ritmo em protagonista da abertura mantendo reprodução e treino próximos. |
| Emergência e escuta | Consulta operacional exige hierarquia muito clara. | Próxima rodada: priorizar telefones e distinção entre socorro/escuta/referência; manter abertura curta. |
| Exposição RF | Escopo é parcial e distância normativa indisponível. | Próxima rodada: representar potência e grandezas com desenho explicativo, mantendo a limitação visível. Não sugerir raio de segurança calculado. |
| Simulado Classe C | Interface própria e fluxo de questões. | Próxima rodada separada: harmonizar cores, hierarquia e início do treino; preservar banco, sorteio e desempenho. |
| Simulado Classe B | Mesma oportunidade da Classe C. | Próxima rodada separada, compartilhando a solução entre classes. |
| Simulado Classe A | Mesma oportunidade da Classe C. | Próxima rodada separada, compartilhando a solução entre classes. |

## Implementação

Oito páginas compartilham `site/assets/editorial.css`, com SVGs estáticos específicos do tema. Sem nova dependência, novo script ou alteração nos cálculos. No celular, a arte das ferramentas é mais compacta que a dos guias/catálogos. As chamadas levam à ferramenta ou seção existente. As fontes e ressalvas técnicas continuam disponíveis.

Os arquivos dos três simulados internos e seus bancos não foram alterados. A mudança anterior em `site/assets/data/solar.json` foi preservada.

## Verificação

- Build local concluído; servido pelo processo de prévia existente na interface Tailscale, porta 18789.
- 96 testes Node aprovados.
- As oito novas aberturas verificadas em Chromium e WebKit a 320, 390 e 1280 px: carregamento, uma H1, âncoras existentes e ausência de overflow horizontal.
- Testes funcionais das seis páginas técnicas aprovados em Chromium a 320, 390, 768 e 1440 px.
- WebKit: detectada falha no teste automatizado ao desmarcar checkbox depois de preencher vários campos. A reprodução com o HTML original de `HEAD`, sem o CSS novo, também falha em 390 px. A rolagem podia posicionar o controle sob o cabeçalho em 320 px; margens de rolagem corrigiram essa reprodução focada. Isso não comprova a resolução da falha geral de automação, que também ocorre no código anterior. Não declarar a suíte WebKit completa como aprovada sem ressalva.
- Verificação funcional alternativa em WebKit aprovada a 320, 390, 768 e 1440 px: usa o label da opção após centralizá-lo, evitando a falha de rolagem/clique automático direto no checkbox. Demais verificações da suíte técnica mantidas.
- WebKit é verificação de motor em Linux; a avaliação visual do iPhone fica com o usuário.

Envio ao GitHub autorizado pelo usuário após avaliação da prévia e condicionado à verificação final.

## Verificação final antes do envio

- Build e 96 testes Node passaram no estado final.
- QA do menu: 19/19 verificações passaram.
- Suíte visual: 11 páginas em Chromium e WebKit, larguras de 320, 375, 390, 430, 768 e 1440 px, com diagramas, filtros e cálculos aprovados.
- Links internos, recursos publicados, âncoras e IDs estáticos sem erros.
- Novas aberturas conferidas novamente em Chromium/WebKit a 320, 390 e 1280 px.
- O seletor do teste visual de dipolo foi atualizado para clicar no botão `type=submit`, pois o formulário também contém botões de frequências de exemplo.
- O CTA principal da home abre o catálogo de ferramentas. Removidos o aviso superior de Referência rápida e os seis links “Voltar ao início”.
