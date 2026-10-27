# Entrada sutil das páginas — 26/10/2026

As aberturas editoriais usam entrada de 250 ms, com deslocamento vertical de 6 px e opacidade inicial de 85%. O texto principal inicia imediatamente, a descrição tem 40 ms de atraso e a ilustração 90 ms. A home usa os mesmos tempo e deslocamento. Controles, cabeçalho e logo não entram nessa animação nem aguardam seu término para uso.

O estilo base mantém o conteúdo visível. A animação usa preenchimento somente anterior (`backwards`), sem manter transformações após terminar. A preferência `prefers-reduced-motion` desliga a entrada editorial e a da home; nenhuma biblioteca, observador de rolagem ou tela de carregamento foi adicionada.

`tests/presentation.browser.mjs` verifica Chromium/WebKit, movimento normal e reduzido, três rotas, seletor do cronômetro por teclado e quatro larguras.
