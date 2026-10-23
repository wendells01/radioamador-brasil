# Implementação técnica — estado de entrega

Sem push/deploy. Árvore inicial limpa; alterações preexistentes não encontradas. Nenhum AGENTS.md local encontrado. Imagens do prompt indisponíveis, usados requisitos textuais.

- Módulos 1–3: calculadora, comparador e guia coaxial integrados, nove produtos identificados, dados/motor únicos, gráficos proporcionais, perdas do cabo e extras separadas, tabela física, fontes e limites de interpolação/extrapolação.
- Módulo 4: índice de faixas LF–EHF por classe e filtros, λ e propagação. Lei/plano/convenção separados. Pendente auditoria integral das notas PDFF/segmentação. 789/2026 identificada como referência atual; não tratar 772/2025 como vigente.
- Módulo 5: consulta de emergência por serviço/classificação/busca, fontes por entrada, telefones acionáveis. SRC canal 9 histórico sem confirmação da regra vigente. Nenhuma referência radioamadora declarada canal nacional oficial de socorro.
- Módulo 6: Flowerpot meia onda com escala inicial restrita, dual-band nas dimensões documentadas, SVG próprio, referências de choke e ajuste experimental. Sem extrapolar a manga dual-band.
- Módulo 7: geometria de hélice, validação do raio mínimo pelo cabo, dimensões/encaixe de ferrite Fair-Rite 31, tabela experimental de autorressonância. Sem impedância estimada para configuração arbitrária ou tabelas conflitantes.
- Módulo 8 PARCIAL: conversões conduzida/ERP/EIRP e dBi/dBd implementadas e testadas. Distância normativa indisponível: manutenção no portal oficial e impossibilidade de conferir expressões gráficas da Tabela D.I. Não há fórmula genérica substituta, resultados fictícios ou declaração de conformidade.

Arquivos: seis páginas em site/ferramentas/, módulos em site/assets/js/tecnica/, tecnica.css, catálogo/menus/referência, testes técnicos e docs/FERRAMENTAS-TECNICAS.md (fontes/métodos/limites).

Validação executada:
- npm test: 57/57 aprovados (inclui 16 testes técnicos novos).
- Python unittest: 19/19 aprovados (17 existentes + 2 novos).
- Playwright Chromium e WebKit: seis páginas × quatro larguras (320/390/768/1440), 48 combinações aprovadas. Cálculos, filtros, erros, labels, IDs, ocultação, ausência de overflow da página e falhas locais de carga. WebKit Linux não é iPhone físico.
- Captura mobile do coaxial inspecionada em /tmp/radio-fontes/coax-mobile.png; tabela rola internamente sem aumentar a página.
- Revisão final: testes focados 7/7, integração Python 19/19 e git diff --check aprovados após ajustes de filtros, seleção duplicada e metadados.

Ambiente: Playwright já disponível externamente ao projeto; instalado motor WebKit e bibliotecas do SO para exercitá-lo. Não adicionada dependência no package.json. CLI Playwright tinha versão de navegador divergente: teste usa pacote disponível e caminho explícito de Chromium instalado. Servidor temporário do teste fecha ao término.

## Correção de áudio Morse

- Relato: sem som ao tocar Reproduzir no iPhone. Navegadores locais inicialmente mostravam contexto running, sem erros; não foi possível reproduzir fisicamente o modo Silencioso do iPhone.
- Falha reproduzida com contexto interrupted: retornava sucesso sem chamar resume. Testes de regressão falharam antes da correção.
- Correção: solicitar AudioSession playback no clique, quando suportado; retomar suspended/interrupted; recriar contexto closed; não informar sucesso sem estado running; impedir status atrasado após Parar durante resume.
- Arquivos: morse-audio.js, morse.js, morse.html; seis testes de áudio novos e tests/morse.browser.mjs.
- Verificação: 30/30 testes de Morse e 19/19 Python; navegador Chromium/WebKit pelo endereço Tailscale com medição do sinal real (pico 0,120), Reproduzir/Ouvir/Parar, retomada e fim. git diff --check aprovado. Validação no alto-falante do iPhone permanece dependente do teste do usuário.
- Referências primárias: https://bugs.webkit.org/show_bug.cgi?id=252746 e https://www.w3.org/TR/audio-session/ .

## Painel HamQSL próprio em pt-BR

- Feed XML real consultado em 23/10/2026; HTTP 200 sem CORS. Coletor Python padrão com limite horário, lock, validação, gravação atômica e preservação em falhas; snapshot JSON local evita backend HTTP.
- Home substitui banner em inglês por tabela dia/noite e seis indicadores, autoria/fonte, data Brasília, ajuda contextual e aviso de dados antigos. Campos ausentes não viram zero; não se promete previsão brasileira nem percentual de sucesso.
- Coleta horária temporária ativada SOMENTE na máquina de prévia: radioamador-solar-update.timer. Atualização em produção exige agendamento/publicação do JSON no hosting real; nenhum deploy feito.
- Fontes/operação/testes em docs/PAINEL-SOLAR.md. Testes focados: Python 4/4 novos, Node 3/3 novos; navegador Chromium/WebKit em quatro larguras, oito combinações aprovadas. Screenshot mobile WebKit inspecionado.
