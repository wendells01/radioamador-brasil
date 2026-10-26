# Primeiro COER — guia Classe C

Página: `/aprendizado/primeiro-coer.html`. Revisão documental: 26/10/2026.

Objetivo: orientar o primeiro certificado, com roteiro, preparação, treino e encaminhamento para eventual estação própria. Prévia local revisada e publicação autorizada pelo usuário em 26/10/2026.

Fontes primárias consultadas:

- Habilitação: https://www.gov.br/anatel/pt-br/regulado/outorga/radioamador-e-radio-cidadao/habilitacao-do-radioamador
- Manual do Candidato 2026-04.1: https://sistemas.anatel.gov.br/anexar-api/publico/anexos/download/0a5f21136202dc8e4135caab170cfb45
- Cartilha 2026-06: https://sistemas.anatel.gov.br/anexar-api/publico/anexos/download/e2bee3ec4783c5c41a8ce4affe7baef8
- Ato nº 3448/2026: https://informacoes.anatel.gov.br/legislacao/atos-de-requisitos-operacionais-de-outorga-e-licenciamento/2148-ato-3448-26
- Outorga: https://www.gov.br/anatel/pt-br/regulado/outorga/radioamador-e-radio-cidadao/outorga-do-radioamador
- Licenciamento: https://www.gov.br/anatel/pt-br/regulado/outorga/radioamador-e-radio-cidadao/licenciamento-de-estacoes-do-radioamador

Decisões editoriais:

- Classe C: três matérias, 15 questões cada, mínimo 8 acertos e 20 minutos por matéria. Dados conferidos no item 11.3 do Ato (resultado indexado oficial) e na cartilha, página 24. O portal de legislação redirecionou a uma página de manutenção nesta consulta; isso não foi tratado como acesso direto bem-sucedido ao texto integral.
- A página de habilitação mistura os caminhos “Inscrição → Incluir” e “Prova → Incluir”. O guia prioriza o caminho do Manual do Candidato e explicita a diferença; não inventa telas autenticadas.
- Computador, Teams, documento, conduta e pós-prova seguem o manual atual, com links para leitura integral. Não há afirmação de prova pelo celular.
- A cartilha informa idade mínima de 10 anos (página 45). Menores seguem processo pelo responsável; não são encaminhados à inscrição direta pelo SEC.
- COER, outorga e licença são distinguidos; nenhuma compra de rádio ou estação própria é apresentada como pré-requisito do certificado. Sem valores de taxas ou datas de vagas fixos.
- Roteiro de estudo é sugestão editorial. O banco da comunidade não é apresentado como prova da Anatel nem garantia de aprovação.

Marcações pessoais: seis checkboxes, armazenamento local `primeiro-coer-roteiro-v1`, sem dados de identificação. Não há integração com gov.br, SEC ou SEI; não registra inscrição nem certificação oficial. Fallback utilizável sem JavaScript ou armazenamento.

Verificação: `npm test`, `node tests/coer.browser.mjs`, `node tests/redesign.browser.mjs`; Chromium/WebKit em 320, 390, 768 e 1440 px, persistência/reload/reset, armazenamento bloqueado, conteúdo sem JavaScript, links/âncoras locais, acesso pelo menu e captura visual. Não testa inscrição em conta real da Anatel.
