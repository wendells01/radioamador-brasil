# Estação base, ROE e atlas de antenas

Revisão documental: 25/10/2026. Primeira entrega avaliada em prévia local/Tailscale; envio ao GitHub autorizado pelo usuário.

## Escopo

- `aprendizado/estacao-base.html`: oito componentes clicáveis, explicações de função/conexão/conferência, caminhos de DC/RF/áudio e checklist inicial. Desenho conceitual; não é projeto de segurança elétrica, aterramento, instalação de mastro ou SPDA.
- `aprendizado/roe.html`: ROE, ondas direta/refletida, plano de medição, acoplador e limitações. Simulação matemática com controles de ROE e potência direta; não prevê eficiência, alcance nem limite seguro de qualquer modelo.
- `aprendizado/antenas.html`: 20 famílias e variantes relevantes, com SVGs próprios, busca, filtro por aplicação/família e explicações. A taxonomia é prática e não mutuamente exclusiva. Não há promessa de catalogar literalmente todos os tipos de antena.

Sem dependências de produção adicionais. HTML estático com módulos ES nativos, CSS e SVG. Conteúdo disponível sem JavaScript; os filtros e a simulação dependem dele. Novos acessos no menu compartilhado, home e catálogo. Arquivos dos simulados e alteração prévia dos dados solares preservados.

## Fontes e decisões técnicas

### Bancada

- Icom, IC-7300 Basic Manual, instalação/conexões: https://icomuk.co.uk/files/icom/PDF/productManual/IC-7300_ENG_BM_10.pdf
- ARRL, linhas e perdas: https://www.arrl.org/feed-lines
- ARRL, grounding: https://www.arrl.org/grounding
- Anatel: https://www.gov.br/anatel/pt-br/regulado/outorga/radioamador-e-radio-cidadao/radio-do-cidadao e https://www.gov.br/anatel/pt-br/regulado/outorga/radioamador-e-radio-cidadao/radioamador

O manual Icom sustenta os conceitos de polaridade, corrente em TX, fusíveis e ventilação; os valores desse modelo não são apresentados como regra universal. A etapa de proteção é representada apenas conceitualmente e remete à avaliação da instalação brasileira. Base é modo de instalação, não sinônimo de serviço nem autorização de faixa.

### ROE

- Keysight, Reflection Measurements: https://helpfiles.keysight.com/csg/pxivna/Tutorials/Reflection_Measurements.htm
- Keysight, relações de reflexão/ROE: https://www.keysight.com/hk/en/assets/9018-40038/installation-guides/9018-40038.pdf
- ARRL, acoplador: https://www.arrl.org/more-about-antenna-tuners

Modelo: `rho = (S - 1)/(S + 1)`, `Pref/Pdir = rho²`, `Pnet = Pdir - Pref`, `RL = -20 log10(rho)`. Mesmo plano e impedância de referência. A envoltória é `sqrt(1 + rho² + 2 rho cos(2kx))`, normalizada numa linha ideal sem perdas. O desenho mostra três períodos espaciais da envoltória e não escala física de comprimento. Não usar potência líquida no medidor como sinônimo de potência irradiada. O instrumento ilustrado não possui limiares verde/vermelho de segurança.

A distinção entre casamento, ressonância e eficiência é explícita. Uma carga artificial pode casar sem funcionar como antena eficiente. A ação de um acoplador na bancada não elimina o descasamento no trecho posterior por definição.

### Antenas

As fontes específicas ficam nos detalhes de cada cartão. Referências principais:

- RSGB: dipolo, V invertido e fios alimentados pela ponta.
- ARRL: `verticals`, `hf-beams`, `hf-loop-antennas`.
- M0UKD: https://m0ukd.com/calculators/slim-jim-and-j-pole-calculator/
- VK2ZOI: https://vk2zoi.com/articles/half-wave-flower-pot/
- Sirio Gain-Master: https://www.sirioantenne.it/it/prodotti/hf/gain-master — exemplo de arquitetura ⅝, sem generalizar o circuito para toda vertical com esse comprimento.
- Diamond: catálogo técnico e https://www.diamondantenna.net/static/pdfdocs/D130J.pdf — cobertura RX distinta de bandas TX.
- Palomar Engineers: https://palomar-engineers.com/wp-content/uploads/End-Fed-Antenna-Secrets-SCARA-02162022.pdf
- Moxon Antenna Project: https://moxonantennaproject.net/backround.htm
- Cubex: https://www.cubexquads.com/2-meter/
- NTIA: https://www.ntia.gov/sites/default/files/publications/antenna_models_report_tm-13-489_0.pdf
- Antenna-Theory: explicações autorais de LPDA, refletor parabólico e patch, com URLs em cada cartão.
- Digi, dBi/dBd: https://www.digi.com/support/knowledge-base/antenna-gain-dbi-vs-dbd-decibel-detail

Não fixar polarização só pelo nome da família. Omnidirecional é aproximadamente em um plano, não uma esfera uniforme. Loop grande e loop pequena são conceitos diferentes; EFHW e random wire não são sinônimos; a hélice axial não é a mesma arquitetura da antena curta de um HT. Aplicações dos filtros são exemplos de projetos possíveis, não a cobertura de qualquer exemplar. Diagramas não são receitas com medidas nem padrões polares medidos.

## Verificação

- `npm test`: 100 testes passaram, incluindo quatro provas matemáticas novas para ROE e envoltória.
- Build concluído e recursos locais/âncoras/IDs conferidos.
- Teste browser específico: Chromium e WebKit em 320, 390, 768 e 1440 px; bancada, teclado, simulação, entrada inválida, filtros combinados, reset, detalhes e fallback sem JavaScript.
- Na verificação de resposta HTTP, 304 é aceito junto com 200: a prévia usa revalidação e o WebKit pode expor o status da resposta condicional.
- Revisão visual no motor WebKit em Linux não substitui a avaliação do iPhone do usuário.

Após avaliação no iPhone: controles numerados reposicionados fora dos equipamentos, com linhas-guia; setas de ROE em SVG. Regressão de sobreposição e ícones verificada em Chromium/WebKit a 320, 390, 768 e 1440 px.
