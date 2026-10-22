/* Radioamador Brasil — painel solar do HAMQSL.
   Módulo ES nativo, sem dependências, carregado somente na home.

   Contrato:
   - a imagem é a original de https://www.hamqsl.com/solarn0nbh.gif, carregada
     pelo próprio navegador: sem proxy, sem XML, sem refresh automático,
     sem polling e sem segunda fonte de dados;
   - enquanto não há resposta, o estado é "loading";
   - `load` com largura natural > 0 => "loaded": mostra a imagem e esconde o
     aviso de indisponibilidade;
   - `error`, resposta que não é imagem, ou 20 s sem evento => "unavailable":
     esconde a moldura da imagem (sem ícone de imagem quebrada) e mostra um
     aviso com o link da fonte e um botão "Tentar de novo";
   - um `load` tardio depois do aviso volta para "loaded" e retira o aviso,
     mantendo créditos e link sempre visíveis;
   - o único caminho de nova tentativa é o clique do visitante: uma requisição
     por clique, sem repetição automática;
   - o timer é sempre limpo.

   Por que 20 s: medido em Chromium com rede emulada "Slow 3G", a imagem levou
   ~8,2 s do início da navegação até `load`. Um teto de 12 s deixava pouco
   espaço para aparelhos e redes piores que isso.
   Por que referrerpolicy="origin" no <img>: o HAMQSL/Curity devolve 403 quando
   a requisição chega sem Referer, e 200 quando chega com o nosso origin. */

const frame = document.querySelector("[data-solar-frame]");
const media = document.querySelector("[data-solar-media]");
const image = document.querySelector("[data-solar-image]");
const fallback = document.querySelector("[data-solar-fallback]");
const retry = document.querySelector("[data-solar-retry]");

if (frame && media && image && fallback) {
  const TIMEOUT_MS = 20000;
  const SOURCE = image.getAttribute("data-src") || image.src;
  let timer = 0;
  let attempt = 0;

  const setState = (state) => {
    frame.setAttribute("data-solar-state", state);
  };

  const clearTimer = () => {
    if (timer) {
      window.clearTimeout(timer);
      timer = 0;
    }
  };

  const showLoaded = () => {
    clearTimer();
    media.hidden = false;
    fallback.hidden = true;
    setState("loaded");
  };

  const showUnavailable = () => {
    clearTimer();
    media.hidden = true;
    fallback.hidden = false;
    setState("unavailable");
  };

  const watch = () => {
    clearTimer();
    setState("loading");
    timer = window.setTimeout(showUnavailable, TIMEOUT_MS);
  };

  image.addEventListener("load", () => {
    if (image.naturalWidth > 0) {
      showLoaded();
    } else {
      showUnavailable();
    }
  });

  image.addEventListener("error", showUnavailable);

  image.setAttribute("data-src", SOURCE);
  watch();

  // A imagem pode já estar em cache e ter terminado antes dos listeners.
  if (image.complete) {
    if (image.naturalWidth > 0) {
      showLoaded();
    } else if (image.currentSrc) {
      showUnavailable();
    }
  }

  if (retry) {
    retry.addEventListener("click", () => {
      attempt += 1;
      media.hidden = false;
      fallback.hidden = true;
      watch();
      // Query só para furar cache de erro do navegador; a origem continua a mesma.
      image.src = SOURCE + (SOURCE.indexOf("?") === -1 ? "?" : "&") + "retry=" + attempt;
    });
  }
}
