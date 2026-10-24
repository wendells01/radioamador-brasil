# Visuais e diagramas

A prévia usa SVG próprio, HTML e CSS existentes, sem biblioteca de gráficos,
fontes de ícones, mapas externos ou dependências de produção adicionais.

## Organização

- `site/assets/js/visuals.js`: funções puras para ícones, ilustrações e gráficos.
  Valores vêm dos motores atuais; texto interpolado é escapado.
- `visuals-ui.js`: ilustrações dos destaques, ícones do catálogo e grupos do menu,
  e montagem dos desenhos estáticos marcados com `data-drawing`.
- Estilos compartilhados no fim de `styles.css`, usando os tokens existentes.
- As UIs das calculadoras incluem os desenhos nos resultados validados. Erros
  substituem o resultado inteiro, incluindo gráficos, sem manter valores antigos.

## Cobertura

- Inicial: três ilustrações diferentes, para HT, localização e faixas.
- Menu e catálogo: ícones por categoria e ferramenta, sempre com texto visível.
- HT: controles genéricos, simplex e caminho por repetidora.
- Antenas: dipolo e dimensões dos dois braços e do conjunto.
- Locator: célula e limites; posição A/B e arco de grande círculo numa grade
  equiretangular, com divisão na linha do antimeridiano. Sem mapa-base externo.
  Antípodas e pontos coincidentes não recebem um arco arbitrário.
- Coaxiais: construção em corte e potência entregue versus comprimento, com
  ponto do comprimento escolhido e valores textuais acessíveis. Usa `coaxLoss`
  em 33 amostras, mantendo frequência, potência, produto e perdas adicionais.
  O domínio é de zero ao dobro do comprimento (mínimo 10 m, máximo 100.000 m).
- Faixas: visão esquemática das sete regiões, ligada ao filtro existente.
  Contagens derivadas dos mesmos 34 registros, respeitando busca e classe.
  Blocos não representam largura de banda nem escala linear/logarítmica.
- Chokes: desenhos de bobina e ferrites, com as dimensões calculadas. Número de
  espiras/núcleos desenhados é ilustrativo e explicitamente identificado.
- Flowerpot: cotas e etapas do desenho, usando as medidas do cálculo existente.
- Morse: duração de pontos, traços e pausas; realce usa `AudioContext.currentTime`
  pelo método `position()` do player, não um segundo relógio de áudio.
  Parar/editar/mudar velocidade encerra o realce. O exercício auditivo não mostra
  a resposta no desenho. Nenhum som começa sem um gesto do usuário.
- Referência: comparação visual de frequência e amplitude.
- Solar: ícones dos indicadores e de dia/noite, além da idade do boletim.
  Dados, intervalos de coleta e estado de envelhecimento continuam os mesmos.
  Não foi criado histórico artificial de observações.

## Acessibilidade e limites

Ícones decorativos têm `aria-hidden`; SVGs informativos têm nome acessível e
legenda em HTML. Medidas permanecem também nos resultados textuais. Botões do
espectro expõem `aria-pressed`, preservam foco após atualizar e usam Enter/Espaço
nativos. Figuras esquemáticas indicam ausência de escala. Os HTMLs originais dos
simulados e os dados normativos não foram editados.

Sem JavaScript, as explicações, tabelas estáticas e navegação alternativa
continuam disponíveis; as ilustrações complementares e cálculos exigem JS.

## Validação

```bash
npm test
python3 -m unittest discover -s tests -p 'test_*.py'
npm run build
BASE_URL=http://100.125.41.28:18789 CHROMIUM_EXECUTABLE=/caminho/chrome node tests/visuals.browser.mjs
BASE_URL=http://100.125.41.28:18789 CHROMIUM_EXECUTABLE=/caminho/chrome node tests/morse.browser.mjs
BASE_URL=http://100.125.41.28:18789 CHROMIUM_EXECUTABLE=/caminho/chrome node tests/solar.browser.mjs
```

O teste visual cobre 11 páginas em seis larguras, Chromium e WebKit. WebKit no
Linux não substitui um teste em Safari num iPhone físico. A prévia HTTP do
Tailscale não permite geolocalização do celular; a entrada manual permanece.

## Hero: rede de rádio

`hero-waves.js` desenha uma antena fixa, três frentes de onda e estações que
respondem quando o sinal chega. A composição fica à direita no desktop e tem
menor intensidade nas bordas do celular; uma máscara preserva a leitura.
Mantém um único RAF, teto de 30 fps e DPR máximo de 1,5. A renderização pausa
fora da tela ou com a aba oculta; redução de movimento mantém um quadro
estático. Os anéis CSS existentes são o fallback sem canvas. Não usa mouse,
serviços externos, armazenamento ou novas dependências.

`tests/hero-radio.browser.mjs` verifica movimento, pausa/retomada, redução de
movimento, DPR, menu e fallback em Chromium e WebKit, nas seis larguras.
