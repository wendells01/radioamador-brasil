# Estatísticas de acesso

Integração básica com Vercel Web Analytics: visualizações e visitantes,
país, páginas, dispositivos e origem disponível. O painel fica na Vercel;
nenhum contador ou painel administrativo é exposto no site.

## Ativação e publicação

1. No projeto da Vercel, abrir **Analytics** e selecionar **Enable**.
2. Publicar a alteração pelo fluxo normal do GitHub/Vercel.
3. Visitar o domínio público e conferir os primeiros dados no painel.

A ativação deve acontecer antes do deploy: a Vercel disponibiliza as rotas de
coleta na publicação seguinte. Ativar no painel sem publicar o código não
conclui a instalação. A integração utiliza a rota documentada
`/_vercel/insights/script.js`, mantida pela Vercel junto das rotas novas.

## Arquitetura e privacidade

- O CLI de build inclui o carregador somente quando `VERCEL_ENV=production`.
  Builds locais, Tailscale e deployments de preview não carregam o coletor.
- `analytics.js` restringe a execução aos dois hostnames públicos e a HTTPS.
  Também respeita Do Not Track e Global Privacy Control.
- Contabiliza apenas os pageviews padrão. Não envia cliques personalizados,
  indicativos, resultados de simulados, valores dos formulários ou coordenadas
  obtidas pela ferramenta de localização.
- O hook `beforeSend` remove query string e fragmentos da URL e do referrer
  quando presentes no evento. Mantém caminhos para identificar as páginas.
- O script é carregado de forma não bloqueante; sua indisponibilidade ou um
  bloqueador de conteúdo não impede o uso das ferramentas.
- A Vercel usa identificação estatística sem cookies, com hash reiniciado
  diariamente. A contagem é aproximada e pode ser reduzida por bloqueadores e
  preferências de privacidade. Não recupera o histórico anterior à ativação.

As 18 páginas publicadas recebem o carregador, incluindo os três simulados.
Os HTMLs originais dos simulados em `site/` permanecem byte a byte intactos.
Em produção, a única adição nesses documentos é a tag do carregador externo;
os scripts, as questões e as chaves de armazenamento permanecem os originais.

No plano Hobby, a documentação consultada informa 50 mil eventos por mês,
compartilhados pela equipe, e janela de relatório de um mês. Confirmar o plano
e os limites atuais no painel; não foi habilitado nenhum recurso pago.

## Validação

Os testes de build verificam a inclusão única em produção e a ausência local,
além da preservação dos scripts dos simulados. O teste de navegador simula o
endpoint de coleta para validar carregamento, limpeza de URLs e respeito às
preferências de privacidade, sem registrar visitas de teste no serviço real.

Fontes:
- https://vercel.com/docs/analytics/quickstart
- https://vercel.com/docs/analytics/package#beforesend
- https://vercel.com/docs/analytics
- https://vercel.com/docs/analytics/limits-and-pricing
