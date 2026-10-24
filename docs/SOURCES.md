# Fontes e links

Datas são reais (data de acesso/conferência a partir deste host, não data de
atualização da origem). Observações HTTP são as registradas no momento da
conferência; 423/429/login são achados reais, não inventados. Um link não é
auditoria do conteúdo do destino.

## Fontes da referência rápida

As linhas de `site/referencia.html` citam a mesma data de revisão editorial (2026-10-22).

| Fonte | URL | O que apoia | Data de acesso/conferência |
| --- | --- | --- | --- |
| NATO Phonetic Alphabet (página institucional da OTAN) | https://www.nato.int/en/about-us/nato-history/history-by-theme/symbols-of-nato/nato-phonetic-alphabet | Tabela completa do alfabeto fonético A–Z, com as grafias “Alfa” e “Juliett” | 2026-10-22 |
| ITU Radio Regulations, Appendix 14 (referência) | — (documento da ITU; sem URL pública estável conferida nesta data) | Referência de que o alfabeto de soletração pertence à série ITU/OTAN; o alfabeto falado não deriva da recomendação de Morse | 2026-10-22 |
| ITU-R M.1172 (códigos Q, serviço marítimo) | https://www.itu.int/rec/R-REC-M.1172/en | Lista e sentido dos códigos Q apresentados. O documento trata do serviço marítimo; a tabela do site traz usos operacionais comuns no radioamadorismo, não regulamento amador brasileiro | 2026-10-22 |
| ITU-R M.1172 — PDF | https://www.itu.int/dms_pubrec/itu-r/rec/m/R-REC-M.1172-0-199510-I!!PDF-E.pdf | PDF vinculado à página acima, usado para conferir os resumos QRA–QTH | 2026-10-22 |
| Anatel — Radioamador e Radio Cidadão (portal) | https://www.gov.br/anatel/pt-br/regulado/outorga/radioamador-e-radio-cidadao | Contexto de operação e termos; confirma o radioamadorismo como serviço regulamentado pela Anatel | 2026-10-22 |
| Anatel — Habilitação do radioamador | https://www.gov.br/anatel/pt-br/regulado/outorga/radioamador-e-radio-cidadao/habilitacao-do-radioamador | Definição do COER (Certificado de Operador de Estação de Radioamador) e contexto do indicativo no Brasil | 2026-10-22 |

## Fontes das ferramentas

| Fonte | URL | O que apoia | Data de acesso | Observação HTTP |
| --- | --- | --- | --- | --- |
| RSGB — Your first antenna: the half-wave dipole | https://rsgb.org/main/get-started-in-amateur-radio/antennas/your-first-antenna-the-half-wave-dipole/ | Comprimento total prático do dipolo `143/f` (cada braço `71,5/f`) e a necessidade de ajuste físico; distingue da meia onda ideal | 2026-10-22 | 200 `text/html` |
| ITU-R M.1677 (código Morse) | https://www.itu.int/rec/R-REC-M.1677/en | Tabela Morse A–Z/0–9 e espaçamentos (ponto = 1,2/WPM s; traço 3 unidades; gaps 1/3/7) usados no treinador | 2026-10-22 | 200 `text/html` |
| BIPM — SI measurement units | https://www.bipm.org/en/measurement-units | Velocidade da luz no vácuo como valor exato do SI (299 792 458 m/s), base do cálculo `onda = 299,792458 / fMHz` | 2026-10-22 | 200 `text/html` |

## Links externos curados

Inventário real gravado em `.omo/evidence/task-8-links.json` (conferência em
2026-10-22, método `curl -sS -L -o /dev/null -m 25`). Os mesmos links aparecem em
`site/links.html` e na home.

| Título | URL | Tipo | Domínio | Observação HTTP (2026-10-22) |
| --- | --- | --- | --- | --- |
| Habilitação do radioamador | https://www.gov.br/anatel/pt-br/regulado/outorga/radioamador-e-radio-cidadao/habilitacao-do-radioamador | oficial | gov.br | 200 `text/html` |
| Portal Radioamador | https://www.gov.br/anatel/pt-br/regulado/outorga/radioamador-e-radio-cidadao | oficial | gov.br | 200 `text/html` |
| Outorga do radioamador | https://www.gov.br/anatel/pt-br/regulado/outorga/radioamador-e-radio-cidadao/outorga-do-radioamador | oficial | gov.br | 200 `text/html` |
| Cartilha do radioamador (PDF) | https://sistemas.anatel.gov.br/anexar-api/publico/anexos/download/e2bee3ec4783c5c41a8ce4affe7baef8 | oficial | sistemas.anatel.gov.br | 200 `application/pdf` |
| Manual do candidato (PDF) | https://sistemas.anatel.gov.br/anexar-api/publico/anexos/download/0a5f21136202dc8e4135caab170cfb45 | oficial | sistemas.anatel.gov.br | 200 `application/pdf` |
| SEC | https://sistemas.anatel.gov.br/sec | oficial | sistemas.anatel.gov.br | 200, mas redireciona para login (`LoginInternet.asp`) — requer conta gov.br |
| SEI externo | https://www.anatel.gov.br/seiusuarioexterno | oficial | anatel.gov.br / sei.anatel.gov.br | 200, mas redireciona para login (`controlador_externo.php`) |
| Mosaico | https://sistemas.anatel.gov.br/se | oficial | sistemas.anatel.gov.br | **423 Locked** no momento da conferência — indisponibilidade real registrada, não erro do hub |
| Mapa de repetidoras UHF/VHF | https://www.google.com/maps/d/viewer?mid=1yG31U_scDgCD5HWzOhGgtzaDRhfrkNc | comunidade | google.com | 200 `text/html` (My Maps; manutenção depende do responsável pelo mapa) |
| Grupo no WhatsApp | https://chat.whatsapp.com/GTLmm87XkKYLUeu5jCytSC | comunidade | chat.whatsapp.com | 200 `text/html` (só o href/abertura foi testado; nunca ingressamos no grupo) |
| Instagram @radioamadorbrasil | https://www.instagram.com/radioamadorbrasil/ | comunidade | instagram.com | **429** (rate limit) com redirecionamento para login — achado real; não validamos propriedade da conta |

## Política editorial

- Os resumos são auxílios operacionais para estudo, não transcrições normativas de nenhum regulamento. Nenhuma linha da referência afirma limites de potência, condições legais ou obrigações que não estejam na fonte.
- Se uma fonte contradisser um resumo publicado aqui, registra-se a correção fundamentada nesta página (com data e URL) em vez de adotar um “sentido popular” inventado.
- Códigos Q: a forma interrogativa e a resposta mudam conforme o contexto; a tabela apresenta o uso operacional resumido comum no radioamadorismo.
- CTCSS/DCS são apresentados sempre como tom/código de acesso, nunca como privacidade ou criptografia.
- Destinos externos dependem de terceiros: disponibilidade registrada aqui vale só para a data da conferência.

## Dependência embutida: painel solar do HAMQSL

A home incorpora o painel publicado em `https://www.hamqsl.com/solar.html`
(âncora `#addwebsite`). O próprio site oferece 23 blocos "HTML CODE"; o
primeiro deles, que é o que usamos, é este:

```html
<center>
<a href="https://www.hamqsl.com/solar.html" title="Click to add Solar-Terrestrial Data to your website!">
  <img src="https://www.hamqsl.com/solarn0nbh.php">
</a>
</center>
```

| Item | Valor |
| --- | --- |
| Autor creditado no painel | Paul L. Herrman — N0NBH (rodapé da imagem: "Copyright Paul L. Herrman 2023") |
| Endpoint usado | `https://www.hamqsl.com/solarn0nbh.php` |
| Endpoint **não** usado | `https://www.hamqsl.com/solarn0nbh.gif` |
| Crédito na página | "Dados e painel: Paul Herrman — N0NBH / HAMQSL", com link para a fonte |
| Requisições | uma única, no carregamento da home; sem proxy, sem XML, sem refresh automático, sem polling |
| Observação em 2026-10-22 | **200 `image/gif`**, 14.809 bytes, 155×530 px, carimbo interno **22 Oct 2026 1510 GMT** |
| Natureza do dado | previsão geral de propagação; não é medição da estação do visitante |

### Por que `.php` e não `.gif`

Duas diferenças medidas, ambas decisivas:

1. **Conteúdo.** O `.gif` é um arquivo estático do autor: carimbo interno
   `15 May 2022 1552 GMT`, `Last-Modified: Mon, 18 Jul 2022`. O `.php` é gerado
   a cada requisição e traz a data do dia.
2. **Bloqueio.** O `.gif` está atrás do controle de hotlink do Sucuri:

   | Requisição ao `.gif` | Resultado |
   | --- | --- |
   | sem cabeçalho `Referer` | **403** `text/html` (10.342 bytes) |
   | `Referer: https://www.hamqsl.com/solar.html` | **200** `image/gif` (30.140 bytes) |
   | `Referer: http://100.125.41.28:8787/` | **200** `image/gif`, mesmos bytes |

   O `.php` responde **200 com ou sem `Referer`** (14.809 bytes nos dois casos).
   Isso importa porque navegadores variam no envio do Referer: uma política
   `no-referrer` derrubava o painel no `.gif` e não derruba no `.php`.

O `<img>` mantém `referrerpolicy="origin"` (não envia caminho, só a origem) —
inofensivo no `.php` e correto se algum dia voltarmos a um recurso protegido.

Timeout do aviso: 20 s. Medido em Chromium com rede emulada "Slow 3G", a
resposta chegou em ~5,0 s e o `load` em ~8,2 s, com a imagem de 30 KB do `.gif`;
o `.php` é menor (14,8 KB). O teto cobre aparelho e rede piores que o medido.

Histórico honesto (corrigido): numa primeira conferência o painel aparecia como
indisponível no iPhone do proprietário. A causa era o `.gif` + `no-referrer`
(403); a troca para `origin` não bastou para o `.gif` em todos os caminhos, e a
solução definitiva foi adotar o endpoint que o próprio HAMQSL recomenda.

## Referências visuais (inspiração de mecânica, não cópia de marca)

Projetos locais lidos para extrair mecânica de profundidade e movimento. Nenhum
arquivo deles foi modificado, e nenhum asset, cor de marca ou texto foi copiado.

| Projeto | Caminho local | O que foi lido | O que o hub adotou |
| --- | --- | --- | --- |
| MeuOrcamento Landing | `/home/ubuntu/MeuOrcamento-Landing` | `src/App.tsx:22-32` (grid mascarado + glows), `src/components/sections/Hero.tsx:20-100` (camadas, ritmo, realce de superfície) | grade mascarada e brilhos radiais em `body::before`; realce de 1px no topo dos cartões |
| LPTEC site | `/home/ubuntu/lptecsite` | `src/index.css:140-175` (véu/grade), `420-470` (painel, grão, transições), `src/components/HeroBackground.tsx` (geometria de anéis, DPR, pausa) | grão em data URI; geometria dos anéis concêntricos; ciclo de vida do canvas (um rAF, pausa, movimento reduzido) |

O mapa completo efeito → arquivo:linha → implementação está em
`.omo/evidence/redesign/04-reference-map.md`.
