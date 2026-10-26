# Revisão dos simulados — 26/10/2026

## Diagnóstico reproduzido

Cada arquivo original contém 1.000 registros. Agrupando por matéria e enunciado normalizado, sem os prefixos “Situação de prova —” e “Questão aplicada —”:

| Classe | Legislação | Técnica e Ética | Eletrônica | Total distinto |
| --- | ---: | ---: | ---: | ---: |
| C | 146 | 234 | 379 | 759 |
| B | 198 | 100 | 356 | 654 |
| A | 197 | 100 | 361 | 658 |

Na Classe C, alguns enunciados de legislação aparecem 16 vezes com IDs e tópicos diferentes. Na B e na A, cópias recebem prefixos e IDs de tópico distintos. O sorteio anterior agrupava por tópico/ID e não mantinha cobertura entre sessões. O modo personalizado da Classe C nem sequer aplicava a diversidade por tópico.

O resultado anterior ignorava matérias sem respostas. O cronômetro pulava o bloco, mas o cálculo de aprovação verificava só as matérias com respostas registradas e usava o total respondido como denominador. Contagem por intervalos também dependia do comportamento do navegador em segundo plano.

## Correção

- Bancos originais preservados integralmente no `const BANK` de cada página, incluindo IDs, gabaritos e explicações. ZIP e manifest originais continuam intactos. `sources/quiz-banks.json` registra o hash do JSON de cada banco; testes também comparam com o ZIP.
- `core.js` agrupa cópias pelo enunciado e matéria, rejeita gabaritos conflitantes e mantém aliases dos IDs antigos. Nenhuma questão nova foi inventada para completar 1.000.
- Sorteio prioriza enunciados menos vistos e alterna famílias de explicação, normalizando números para reduzir sequências de exercícios parametrizados. Questões distintas do mesmo conceito continuam possíveis, especialmente após esgotar inéditas.
- Apenas questões efetivamente apresentadas aumentam a contagem de vistas. Revisão de erros é intencionalmente repetitiva e usa aliases para não duplicar a mesma questão.
- Resultados completos usam a quantidade de questões de todas as matérias, inclusive as não respondidas. Requisitos C 8/15, B 11/20 e A 16/30, respectivamente 20/30/40 minutos por matéria, conferidos na cartilha oficial da Anatel 2026-06, página 24: https://sistemas.anatel.gov.br/anexar-api/publico/anexos/download/e2bee3ec4783c5c41a8ce4affe7baef8#page=24
- Prazo absoluto de cronômetro; sessão salva com respostas e prazo da matéria. Sair ou bloquear a tela não pausa o tempo da matéria. A próxima matéria recebe seu prazo ao começar.
- Gabarito só no resultado do completo; feedback imediato nos treinos. Revisão final por questão, contagem real no catálogo e identidade visual compartilhada com o site.

## Compatibilidade e limites

Chaves antigas de erros e histórico preservadas: C `radioBrasilC2026Errors/History`, B `monstroB_errors_v3/monstroB_history_v3`, A `radioBrasilA_errors_v1/radioBrasilA_history_v1`. Registros antigos são identificados no histórico sem reinterpretar seus resultados. Novas chaves por classe guardam cobertura e sessão; não há sincronização entre aparelhos. Storage bloqueado/corrompido não impede treino nesta visita.

A revisão trata repetição, seleção, interface e funcionamento. Não equivale a uma auditoria normativa integral dos 3.000 registros originais. Textos e respostas do banco não foram alterados; o desafio diário continua reproduzível com os mesmos dados.

## Verificação

- `node --test tests/simulados.test.mjs`: consumo de todas as inéditas antes de repetição, diversidade de conceitos, aliases, conflitos, denominadores, aprovação em todas as matérias, relógio e storage.
- `node tests/simulados.browser.mjs`: Chromium/WebKit, três classes, quatro larguras; duas rodadas sem repetição; histórico/erros legados; retomada; avaliação completa nos limiares; timeout com zero respostas; armazenamento bloqueado.
- Testes de proveniência verificam os bancos contra o ZIP original em vez de exigir a interface antiga idêntica byte a byte.
