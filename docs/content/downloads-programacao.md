# Downloads e programação

Revisão documental: 25/10/2026. Página: `/downloads.html`.

Os CSVs são referências próprias para recepção, com `Duplex=off`, modo NFM e sem filtro de tom. Não são imagens de fábrica. Frequências armazenadas em Hz inteiros em `site/assets/js/programacao.js`; testes comparam os arquivos publicados com esses dados.

- Motorola: manual MN006555A01-AD, T21X/T27X, tabela 6 (Brasil, 26 canais) e tabela 4 (EUA/Canadá/México/Panamá, 22 canais). Link completo na página e no módulo. Não extrapolar a todos os Talkabout.
- O manual Motorola antigo XL-PT não foi usado no CSV: apresenta divergência na frequência do canal 14 em relação ao manual mais novo.
- BF-777S: frequências reportadas pelo UV Rápido, não garantia de programação de toda unidade. Códigos DCS divergentes entre a tabela e o CSV original não foram reproduzidos.
- Suporte BF-777S pelo perfil BF-888: lista oficial do CHIRP. CSVs Talkabout destinam-se a receptores suportados; não implicam programação direta desses Motorola.
- Instaladores e drivers são links para os projetos/fabricantes. Acervo do UV Rápido é creditado e acessível na origem.

Validação: testes de dados/arquivos, Chromium e WebKit em 320/390/768/1440 px, busca com vírgula decimal, troca de perfil, estado vazio e tabelas sem JavaScript. Não houve validação em hardware; a importação depende do driver e das capacidades do rádio.
