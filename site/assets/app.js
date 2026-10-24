import './js/visuals-ui.js';
/* Radioamador Brasil — menu de navegação agrupado.
   Módulo ES nativo, sem dependências.

   Contrato:
   - o menu é um <dialog> nativo, id site-menu, aberto com showModal();
   - qualquer elemento com [data-menu-open] abre o menu (o .nav-toggle do
     header e o botão "Acessar Ferramentas" do hero); todos expõem
     aria-expanded e aria-controls="site-menu";
   - showModal() fornece o top layer e o backdrop, e um wrap de Tab nas bordas
     impede o foco de cair no body; Escape dispara `cancel`, que é interceptado
     para manter aria-expanded e aria-label em sincronia;
   - fechar pode vir do Escape, do botão .site-menu__close, de um clique no
     backdrop (alvo = o próprio dialog) ou de um link — só os três primeiros
     devolvem o foco ao botão; navegar por um link não rouba o foco;
   - abrir salva e bloqueia o overflow de <html> e <body>, fechar restaura os
     dois valores originais exatamente como estavam;
   - não há matchMedia, listener de scroll, animação em loop nem timer: a
     entrada do painel é só CSS e o fechamento é imediato. */

const root = document.documentElement;
root.classList.add("js");

const toggle = document.querySelector(".nav-toggle");
const triggers = [...document.querySelectorAll("[data-menu-open]")];
const dialog = document.getElementById("site-menu");
const closeBtn = document.querySelector(".site-menu__close");

if (toggle && triggers.length > 0 && dialog && closeBtn) {
  let lastFocused = null;
  let savedHtmlOverflow = "";
  let savedBodyOverflow = "";

  const setExpanded = (open) => {
    triggers.forEach((trigger) => {
      trigger.setAttribute("aria-expanded", String(open));
    });
    // O rótulo só muda no hamburger: o botão do hero tem texto próprio que
    // descreve a ação dele, não o estado do menu.
    toggle.setAttribute(
      "aria-label",
      open ? "Fechar menu de navegação" : "Abrir menu de navegação"
    );
  };

  const lockScroll = () => {
    savedHtmlOverflow = root.style.overflow;
    savedBodyOverflow = document.body.style.overflow;
    root.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
  };

  const unlockScroll = () => {
    root.style.overflow = savedHtmlOverflow;
    document.body.style.overflow = savedBodyOverflow;
  };

  const open = (opener) => {
    if (dialog.open) return;
    lastFocused = opener || document.activeElement;
    lockScroll();
    setExpanded(true);
    dialog.showModal();
    closeBtn.focus();
  };

  const close = ({ restoreFocus = true } = {}) => {
    const wasOpen = dialog.open;
    if (wasOpen) {
      dialog.close();
    }
    setExpanded(false);
    if (wasOpen) {
      unlockScroll();
    }
    if (wasOpen && restoreFocus) {
      const target =
        lastFocused &&
        lastFocused !== document.body &&
        lastFocused !== document.documentElement
          ? lastFocused
          : toggle;
      target.focus();
    }
    lastFocused = null;
  };

  // Cada acionador alterna o menu. O hamburger do header e o botão do hero
  // fazem exatamente a mesma coisa; o foco volta para quem abriu.
  triggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      if (dialog.open) {
        close({ restoreFocus: true });
      } else {
        open(trigger);
      }
    });
  });

  closeBtn.addEventListener("click", () => {
    close({ restoreFocus: true });
  });

  // Escape: o <dialog> só dispara `cancel`; o default é prevenido para que o
  // fechamento passe pelo mesmo caminho que sincroniza ARIA e scroll.
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    close({ restoreFocus: true });
  });

  // Backdrop: o clique no top layer chega com target = o próprio dialog.
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      close({ restoreFocus: true });
    }
  });

  // Link do menu: fecha sem devolver o foco, para não competir com a navegação.
  dialog.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      close({ restoreFocus: false });
    }
  });

  // Qualquer fechamento nativo inesperado ainda deixa ARIA e scroll corretos.
  // O evento `close` é assíncrono: se o menu já reabriu, não mexer no estado.
  dialog.addEventListener("close", () => {
    if (!dialog.open) {
      setExpanded(false);
      unlockScroll();
    }
  });

  // O top layer já torna o resto inerte, mas o Chromium pode deixar o foco
  // cair no <body> ao passar do último elemento; fecha o ciclo explicitamente.
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Tab" || !dialog.open) return;
    const focusables = [
      ...dialog.querySelectorAll("a[href], button:not([disabled])"),
    ].filter((el) => el.getClientRects().length > 0);
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    if (!dialog.contains(active)) {
      event.preventDefault();
      first.focus();
    } else if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  });
}

// A failed WebP request does not automatically select <picture>'s JPEG.
// Retry once using the independent JPEG URL, including failures before this module ran.
const brandLogo = document.querySelector('.brand__image .brand__logo');
if (brandLogo) {
  const useJpeg = () => {
    const source = brandLogo.parentElement.querySelector('source');
    if (source) source.remove();
  };
  brandLogo.addEventListener('error', useJpeg, {once: true});
  if (brandLogo.complete && brandLogo.naturalWidth === 0) useJpeg();
}
