# Desafio do dia, conteúdos e localização

## Escopo

- Inicial: desafio diário e três cartões de conteúdo em destaque.
- `/aprendizado/ht.html`: guia de HT, com VFO/memória, volume/squelch,
  PTT/potência, passo/largura de canal, offset, CTCSS/DCS e diagnóstico básico.
- `/ferramentas/locator.html`: coordenadas ↔ Maidenhead e trajeto entre estações.
- Novos links em Ferramentas, Aprendizado, catálogo e navegação sem JavaScript.

Os simulados originais, a coleta solar, os cálculos de coaxiais e as faixas
regulamentares não foram alterados. Sem dependências de aplicação novas.

## Desafio

`daily-challenge.js` combina os dados de `referencia.js` com um banco derivado
dos simulados originais. A seleção atual tem **281 perguntas em 8 temas**:

- Alfabeto fonético: 26; código Q: 18.
- Antenas e cabos: 43; eletricidade: 48; eletrônica: 48.
- Frequência e ondas: 48; HT e operação: 35; propagação: 15.

`scripts/generate-daily-bank.mjs` lê os arrays JSON embutidos nos três HTMLs,
sem executar scripts nem alterar seus bytes. A curadoria automática elimina
espelhos com a mesma explicação e enunciados duplicados, evita repetir os itens
já cobertos pela referência, e limita cada tema técnico a 48 perguntas para
não deixar as variações de contas dominarem o desafio. O recorte técnico não
inclui as questões de legislação, que dependem de revisão normativa específica.

O arquivo `daily-challenge-bank.js` é gerado e versionado, não editado à mão.
Guarda gabarito, explicação, classe e ID de origem. Antes de publicar, o build
verifica se ele corresponde à extração atual; assim os recursos imutáveis
continuam reproduzíveis pelo histórico Git. Se os simulados forem atualizados,
regenerar com:

```bash
node scripts/generate-daily-bank.mjs
node scripts/generate-daily-bank.mjs --check
```

O navegador carrega só a seleção compacta (aproximadamente 16 KB com gzip), não
os três simulados completos. As perguntas derivadas mantêm o formato certo ou
errado e as explicações originais; as perguntas de referência têm quatro
alternativas. O feedback oferece link ao simulado ou referência correspondente.

A data em `America/Sao_Paulo` define a pergunta de forma determinística, igual
para todos. Os assuntos são espaçados ao longo de todo o ciclo, em vez de
esgotar blocos de um mesmo tema. Cada pergunta aparece uma vez por ciclo de 281
dias. A contagem e o ciclo mudam se o banco for revisado; não há pontuação,
conta ou histórico individual que precise ser armazenado no navegador.

`daily-challenge-ui.js` monta um formulário sem chamadas externas. O resultado
explica a resposta e recebe foco para leitura assistiva. Ao recarregar, o desafio
continua sendo o do mesmo dia. Sem JS, há acesso à referência rápida.

## Locator e trajetos

`locator.js` é puro e não depende do DOM. São aceitos locators de 4 ou 6
caracteres, sem distinção de caixa, e coordenadas em graus decimais com ponto ou
vírgula. Latitude e longitude são validadas separadamente. Pares para trajetos
usam ponto e vírgula: `-23,5505; -46,6333`.

- 4 caracteres: célula de 2° de longitude por 1° de latitude.
- 6 caracteres: subdivisão em 24 partes por eixo.
- Conversão inversa e trajetos por locator usam o centro da célula.
- Longitude +180° é normalizada para −180°; latitude +90° usa a última célula.
- Distância: menor arco de grande círculo em esfera de raio 6.371,0088 km.
- Azimutes: iniciais, em graus a partir do norte verdadeiro, no sentido horário.
  Rumo de volta calculado separadamente; não se pressupõe simples soma de 180°.
- Rumo indefinido para pontos coincidentes/antípodas e a partir de um polo.

A interface declara a aproximação e não prevê cobertura de rádio, obstruções ou
declinação magnética. As coordenadas podem ser inseridas manualmente ou obtidas pelo botão “Usar minha
localização”. A API Geolocation é chamada uma única vez por clique, somente em
contexto seguro (HTTPS ou localhost), com permissão do navegador, timeout de 15 s
e sem posição em cache. A interface informa a precisão retornada, trata recusa,
indisponibilidade e timeout e preserva edições manuais durante a busca. Não há
rastreamento contínuo, armazenamento ou envio das coordenadas pelo site.
A prévia HTTP pelo IP do Tailscale mantém a entrada manual e explica a necessidade
de HTTPS. O site publicado oferece a conexão segura.

Fontes públicas presentes nas páginas:
[ARRL — grid squares](https://www.arrl.org/grid-squares),
[ARRL — localização e grande círculo](https://www.arrl.org/where-am-i),
[Kenwood — TH-K20A](https://www.kenwood.com/usa/Support/pdf/TH-K20A_Manual.pdf),
[Icom — IC-V86](https://www.icomjapan.com/lineup/products/IC-V86/).
Os conceitos do guia são gerais; teclas, nomes e recursos dependem do modelo.

## Validação

```bash
npm test
python3 -m unittest discover -s tests -p 'test_*.py'
npm run build
BASE_URL=http://127.0.0.1:18790 CHROMIUM_EXECUTABLE=/caminho/do/chrome node tests/learning.browser.mjs
```

Testes puros cobrem datas em Brasília, distratores/resposta, ciclo completo sem repetição, proveniência dos gabaritos,
extração reproduzível e hashes dos originais; referências de
locator, volta ao mesmo código a partir do centro em uma grade global,
antimeridiano, equador, polos, antípodas, distância recíproca e entradas inválidas.
Navegadores cobrem os três destinos (inicial, HT e locator), resposta e feedback,
formulários, navegação por teclado, fallback sem JS e overflow entre 320 e 1440 px.
`tests/geolocation.browser.mjs` verifica a localização simulada por teclado,
precisão, ausência de solicitação ao carregar, erros de permissão/sinal/timeout,
preservação de edições e alternativas para HTTP ou navegador sem suporte.
WebKit no Linux não substitui teste em um iPhone físico.
