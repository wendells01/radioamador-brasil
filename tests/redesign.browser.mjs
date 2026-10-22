// QA de navegação (task 3): menu <dialog> agrupado, foco, backdrop, scroll.
// Uso: node tests/redesign.browser.mjs [--negative|--motion|--solar|--journeys|--failures]
// Requer o preview servindo site/ (PREVIEW_URL, padrão http://100.125.41.28:8787).

import { chromium } from "/home/ubuntu/node_modules/playwright/index.mjs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.PREVIEW_URL || "http://100.125.41.28:8787";
const EXECUTABLE =
  "/home/ubuntu/.cache/ms-playwright/chromium-1248/chrome-linux-arm64/chrome";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EVIDENCE = path.join(ROOT, ".omo/evidence/redesign");
const NEGATIVE = process.argv.includes("--negative");

const ROUTES = [
  "/",
  "/simulados.html",
  "/ferramentas.html",
  "/referencia.html",
  "/links.html",
  "/ferramentas/antenas.html",
  "/ferramentas/morse.html",
];

const CURRENT = {
  "/": "/",
  "/simulados.html": "/simulados.html",
  "/ferramentas.html": "/ferramentas.html",
  "/referencia.html": "/referencia.html",
  "/links.html": "/links.html",
  "/ferramentas/antenas.html": "/ferramentas/antenas.html",
  "/ferramentas/morse.html": "/ferramentas/morse.html",
};

const GROUPS = ["Início", "Simulados", "Ferramentas", "Consulta", "Comunidade"];

const NAV_HREFS = [
  "/",
  "/simulados/classe-c.html",
  "/simulados/classe-b.html",
  "/simulados/classe-a.html",
  "/ferramentas/antenas.html",
  "/ferramentas/morse.html",
  "/referencia.html",
  "/links.html",
];

// Os dois catálogos não têm mais um link "Ver …" redundante no menu: quem leva
// até eles é o próprio título do grupo, que por isso também conta como link.
const NAV_GROUP_LINKS = ["/simulados.html", "/ferramentas.html"];

const results = [];
let failed = 0;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(
      `${message} (esperado ${JSON.stringify(expected)}, recebido ${JSON.stringify(actual)})`
    );
  }
}

async function check(name, fn) {
  try {
    const evidence = await fn();
    results.push({ name, status: "pass", evidence: evidence ?? null });
    console.log(`PASS  ${name}`);
  } catch (error) {
    failed += 1;
    results.push({
      name,
      status: "fail",
      error: String(error && error.message ? error.message : error),
    });
    console.log(`FAIL  ${name} — ${error && error.message ? error.message : error}`);
  }
}

async function openPage(browser, route, options = {}) {
  const context = await browser.newContext({
    viewport: options.viewport || { width: 1440, height: 1000 },
    javaScriptEnabled: options.javaScriptEnabled !== false,
    reducedMotion: options.reducedMotion || "no-preference",
  });
  const page = await context.newPage();
  await page.goto(BASE + route, { waitUntil: "load" });
  if (options.javaScriptEnabled !== false) {
    await page.waitForFunction(() =>
      document.documentElement.classList.contains("js")
    );
  }
  return { context, page };
}

async function openMenu(page) {
  await page.click(".nav-toggle");
  await page.waitForFunction(() => document.getElementById("site-menu").open);
}

async function clickToggle(page) {
  // Coordenada de viewport: clicar sem rolar a página (o header é sticky, mas
  // scrollIntoViewIfNeeded do Playwright mexe no scroll de um header fixo).
  const box = await page.locator(".nav-toggle").boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForFunction(() => document.getElementById("site-menu").open);
}

async function menuState(page) {
  return page.evaluate(() => {
    const dialog = document.getElementById("site-menu");
    const toggle = document.querySelector(".nav-toggle");
    return {
      open: dialog.open,
      expanded: toggle.getAttribute("aria-expanded"),
      label: toggle.getAttribute("aria-label"),
      htmlOverflow: document.documentElement.style.overflow,
      bodyOverflow: document.body.style.overflow,
      htmlComputed: getComputedStyle(document.documentElement).overflow,
      activeClass: document.activeElement ? document.activeElement.className : null,
      activeTag: document.activeElement ? document.activeElement.tagName : null,
    };
  });
}

async function runHappy(browser) {
  // 1. Fechado no load, e nenhum link do menu recebe foco enquanto fechado.
  for (const route of ROUTES) {
    await check(`menu fechado no load e inerte: ${route}`, async () => {
      const { context, page } = await openPage(browser, route);
      try {
        const evidence = await page.evaluate(() => {
          const dialog = document.getElementById("site-menu");
          const toggle = document.querySelector(".nav-toggle");
          const link = document.querySelector(".site-menu__link");
          link.focus();
          return {
            open: dialog.open,
            expanded: toggle.getAttribute("aria-expanded"),
            linkFocused: document.activeElement === link,
            activeTag: document.activeElement ? document.activeElement.tagName : null,
          };
        });
        assertEqual(evidence.open, false, `${route}: dialog aberto no load`);
        assertEqual(evidence.expanded, "false", `${route}: aria-expanded inicial`);
        assert(
          evidence.linkFocused === false,
          `${route}: link do menu recebeu foco com o menu fechado`
        );
        return evidence;
      } finally {
        await context.close();
      }
    });
  }

  // 2. Hamburger visível em 320, 390 e 1440.
  await check("hamburger visível em 320/390/1440", async () => {
    const seen = {};
    for (const width of [320, 390, 1440]) {
      const { context, page } = await openPage(browser, "/", {
        viewport: { width, height: 844 },
      });
      try {
        const info = await page.evaluate(() => {
          const button = document.querySelector(".nav-toggle");
          const style = getComputedStyle(button);
          return {
            offsetParent: button.offsetParent !== null,
            display: style.display,
            visibility: style.visibility,
            width: button.getBoundingClientRect().width,
            height: button.getBoundingClientRect().height,
          };
        });
        assert(info.offsetParent, `${width}px: botão sem offsetParent`);
        assert(info.display !== "none", `${width}px: display ${info.display}`);
        assert(info.visibility !== "hidden", `${width}px: visibility hidden`);
        assert(info.width >= 44 && info.height >= 44, `${width}px: alvo menor que 44px`);
        seen[width] = info;
      } finally {
        await context.close();
      }
    }
    return seen;
  });

  // 3/4. Abrir pelo botão mantém ARIA e foca o botão de fechar.
  await check("abrir: dialog.open + aria-expanded + foco no fechar", async () => {
    const { context, page } = await openPage(browser, "/");
    try {
      await page.click(".nav-toggle");
      await page.waitForFunction(() => document.getElementById("site-menu").open);
      const state = await menuState(page);
      assertEqual(state.open, true, "dialog não abriu");
      assertEqual(state.expanded, "true", "aria-expanded após abrir");
      assertEqual(state.label, "Fechar menu de navegação", "aria-label após abrir");
      const focused = await page.evaluate(() => {
        const close = document.querySelector(".site-menu__close");
        return { isClose: document.activeElement === close, tag: document.activeElement.tagName, cls: document.activeElement.className };
      });
      assert(focused.isClose, `foco inicial não é o botão fechar: ${focused.tag}.${focused.cls}`);
      return { state, focused };
    } finally {
      await context.close();
    }
  });

  // 5. Tab / Shift+Tab presos dentro do dialog.
  await check("Tab 25x e Shift+Tab 5x não escapam do dialog", async () => {
    const { context, page } = await openPage(browser, "/");
    try {
      await openMenu(page);
      const focusedElements = [];
      const escapes = [];

      const inspect = async () => {
        const result = await page.evaluate(() => {
          const active = document.activeElement;
          const label =
            active &&
            (active.getAttribute("aria-label") ||
              (active.textContent || "").trim().slice(0, 24));
          return {
            inside: Boolean(active && active.closest("#site-menu")),
            desc: active
              ? `${active.tagName.toLowerCase()}[${label || ""}].${active.className || ""}`
              : null,
          };
        });
        focusedElements.push(result.desc);
        if (!result.inside) escapes.push(result.desc);
      };

      for (let i = 0; i < 25; i += 1) {
        await page.keyboard.press("Tab");
        await inspect();
      }
      for (let i = 0; i < 5; i += 1) {
        await page.keyboard.press("Shift+Tab");
        await inspect();
      }

      assert(escapes.length === 0, `foco escapou do dialog: ${escapes.join(", ")}`);
      const distinct = [...new Set(focusedElements)];
      assert(distinct.length >= 5, `poucos elementos focados (${distinct.length})`);
      return { presses: 30, distinctCount: distinct.length, distinct };
    } finally {
      await context.close();
    }
  });

  // 6. Escape fecha e devolve o foco ao toggle.
  await check("Escape fecha e devolve foco ao hamburger", async () => {
    const { context, page } = await openPage(browser, "/");
    try {
      await openMenu(page);
      await page.keyboard.press("Escape");
      await page.waitForFunction(() => !document.getElementById("site-menu").open);
      const state = await menuState(page);
      assertEqual(state.open, false, "dialog continua aberto após Escape");
      assertEqual(state.expanded, "false", "aria-expanded após Escape");
      assertEqual(state.label, "Abrir menu de navegação", "aria-label após Escape");
      const focused = await page.evaluate(
        () => document.activeElement === document.querySelector(".nav-toggle")
      );
      assert(focused, "foco não voltou ao .nav-toggle");
      return state;
    } finally {
      await context.close();
    }
  });

  // 7. Botão fechar: mesmo contrato do Escape.
  await check("botão fechar fecha e devolve foco ao hamburger", async () => {
    const { context, page } = await openPage(browser, "/");
    try {
      await openMenu(page);
      await page.click(".site-menu__close");
      await page.waitForFunction(() => !document.getElementById("site-menu").open);
      const state = await menuState(page);
      assertEqual(state.open, false, "dialog continua aberto");
      assertEqual(state.expanded, "false", "aria-expanded após fechar");
      const focused = await page.evaluate(
        () => document.activeElement === document.querySelector(".nav-toggle")
      );
      assert(focused, "foco não voltou ao .nav-toggle");
      return state;
    } finally {
      await context.close();
    }
  });

  // 8. Backdrop fecha; clique dentro do painel não fecha.
  await check("backdrop fecha, clique no painel não fecha", async () => {
    const { context, page } = await openPage(browser, "/");
    try {
      await openMenu(page);
      await page.mouse.click(40, 400);
      await page.waitForFunction(() => !document.getElementById("site-menu").open);
      const afterBackdrop = await page.evaluate(
        () => document.getElementById("site-menu").open
      );
      assertEqual(afterBackdrop, false, "backdrop não fechou o menu");

      await openMenu(page);
      await page.click(".site-menu__title");
      const afterPanel = await page.evaluate(() => {
        const dialog = document.getElementById("site-menu");
        const toggle = document.querySelector(".nav-toggle");
        return {
          open: dialog.open,
          expanded: toggle.getAttribute("aria-expanded"),
          activeClass: document.activeElement.className,
        };
      });
      assertEqual(afterPanel.open, true, "clique no painel fechou o menu");
      assertEqual(afterPanel.expanded, "true", "aria-expanded após clique no painel");
      return { afterBackdrop, afterPanel };
    } finally {
      await context.close();
    }
  });

  // 9. aria-current exatamente uma vez, apontando para a rota da página.
  await check("aria-current único e correto nas 7 rotas", async () => {
    const seen = {};
    for (const route of ROUTES) {
      const { context, page } = await openPage(browser, route);
      try {
        const info = await page.evaluate(() => {
          const marked = [...document.querySelectorAll("[aria-current]")];
          return {
            count: marked.length,
            values: marked.map((el) => el.getAttribute("aria-current")),
            hrefs: marked.map((el) => el.getAttribute("href")),
          };
        });
        assertEqual(info.count, 1, `${route}: quantidade de aria-current`);
        assertEqual(info.values[0], "page", `${route}: valor de aria-current`);
        assertEqual(info.hrefs[0], CURRENT[route], `${route}: href do aria-current`);
        seen[route] = info;
      } finally {
        await context.close();
      }
    }
    return seen;
  });

  // 10. Bloqueio e restauração do scroll.
  await check("scroll bloqueado ao abrir e restaurado ao fechar", async () => {
    const { context, page } = await openPage(browser, "/");
    try {
      const before = await page.evaluate(() => ({
        html: document.documentElement.style.overflow,
        body: document.body.style.overflow,
      }));
      await openMenu(page);
      const opened = await page.evaluate(() => ({
        html: getComputedStyle(document.documentElement).overflow,
        body: getComputedStyle(document.body).overflow,
      }));
      assertEqual(opened.html, "hidden", "html.overflow ao abrir");
      assertEqual(opened.body, "hidden", "body.overflow ao abrir");

      await page.keyboard.press("Escape");
      await page.waitForFunction(() => !document.getElementById("site-menu").open);
      const after = await page.evaluate(() => ({
        html: document.documentElement.style.overflow,
        body: document.body.style.overflow,
      }));
      assertEqual(after.html, before.html, "html.overflow não restaurado");
      assertEqual(after.body, before.body, "body.overflow não restaurado");
      return { before, opened, after };
    } finally {
      await context.close();
    }
  });

  // 11. Títulos de grupo exatos.
  await check("títulos dos grupos exatos", async () => {
    const { context, page } = await openPage(browser, "/");
    try {
      await openMenu(page);
      // O título de Simulados/Ferramentas é um link e carrega um sufixo
      // .visually-hidden para leitores de tela; o rótulo visível é o que
      // precisa bater com o contrato.
      const titles = await page.evaluate(() =>
        [...document.querySelectorAll(".site-menu__group-title")].map((el) => {
          const clone = el.cloneNode(true);
          clone
            .querySelectorAll(".visually-hidden")
            .forEach((hidden) => hidden.remove());
          return clone.textContent.trim();
        })
      );
      assertEqual(JSON.stringify(titles), JSON.stringify(GROUPS), "grupos do menu");
      return { titles };
    } finally {
      await context.close();
    }
  });

  // 12. Todas as rotas presentes como link direto no menu.
  await check("menu contém links diretos para as rotas", async () => {
    const { context, page } = await openPage(browser, "/");
    try {
      await openMenu(page);
      const hrefs = await page.evaluate(() =>
        [
          ...document.querySelectorAll(
            ".site-menu__link, .site-menu__group-title--link"
          ),
        ].map((a) => a.getAttribute("href"))
      );
      for (const href of [...NAV_HREFS, ...NAV_GROUP_LINKS]) {
        assert(hrefs.includes(href), `link ausente no menu: ${href}`);
      }
      return { hrefs };
    } finally {
      await context.close();
    }
  });

  // 13. Navegar por um link do menu fecha o dialog no novo documento.
  await check("link do menu navega e fecha o dialog", async () => {
    const { context, page } = await openPage(browser, "/");
    try {
      await openMenu(page);
      await Promise.all([
        page.waitForURL("**/ferramentas/antenas.html"),
        page.click('.site-menu__link[href="/ferramentas/antenas.html"]'),
      ]);
      await page.waitForLoadState("load");
      const state = await page.evaluate(() => {
        const dialog = document.getElementById("site-menu");
        return {
          path: location.pathname,
          open: dialog ? dialog.open : null,
          htmlOverflow: document.documentElement.style.overflow,
        };
      });
      assertEqual(state.path, "/ferramentas/antenas.html", "URL após clicar no link");
      assertEqual(state.open, false, "dialog aberto no novo documento");
      assertEqual(state.htmlOverflow, "", "overflow preso após navegação");
      return state;
    } finally {
      await context.close();
    }
  });

  // Screenshots de evidência, com o menu aberto.
  await mkdir(EVIDENCE, { recursive: true });
  await check("screenshots do menu aberto (390 e 1440)", async () => {
    const shots = [];
    for (const shot of [
      { file: "03-menu-mobile.png", width: 390, height: 844 },
      { file: "03-menu-desktop.png", width: 1440, height: 1000 },
    ]) {
      const { context, page } = await openPage(browser, "/", {
        viewport: { width: shot.width, height: shot.height },
      });
      try {
        await openMenu(page);
        await page.evaluate(() =>
          Promise.all(
            document.getElementById("site-menu").getAnimations().map((a) => a.finished)
          )
        );
        await page.screenshot({ path: path.join(EVIDENCE, shot.file) });
        shots.push(shot.file);
      } finally {
        await context.close();
      }
    }
    return { shots };
  });
}

async function runNegative(browser) {
  // 1. Abrir/fechar rápido 10x sem estado preso.
  await check("abrir/fechar 10x: estado final fechado e sem overflow preso", async () => {
    const { context, page } = await openPage(browser, "/");
    try {
      for (let i = 0; i < 10; i += 1) {
        await page.evaluate(() => document.querySelector(".nav-toggle").click());
        await page.waitForFunction(() => document.getElementById("site-menu").open);
        await page.keyboard.press("Escape");
        await page.waitForFunction(() => !document.getElementById("site-menu").open);
      }
      const state = await menuState(page);
      assertEqual(state.open, false, "dialog aberto ao fim do ciclo");
      assertEqual(state.expanded, "false", "aria-expanded ao fim do ciclo");
      assertEqual(state.htmlOverflow, "", "html overflow preso");
      assertEqual(state.bodyOverflow, "", "body overflow preso");
      assert(state.htmlComputed !== "hidden", "html ainda com overflow hidden");
      return state;
    } finally {
      await context.close();
    }
  });

  // 2. Abrir em 390 e redimensionar para 1440 com o menu aberto.
  await check("resize 390→1440 com menu aberto mantém painel no viewport", async () => {
    const { context, page } = await openPage(browser, "/", {
      viewport: { width: 390, height: 844 },
    });
    try {
      await openMenu(page);
      await page.setViewportSize({ width: 1440, height: 1000 });
      // Espera a animação de entrada assentar antes de medir: medir no meio do
      // translate de 12px produz um falso positivo de 1-2px de transbordo.
      await page.evaluate(async () => {
        const dialog = document.getElementById("site-menu");
        await Promise.all(
          dialog.getAnimations().map((animation) => animation.finished.catch(() => {}))
        );
      });
      await page.waitForTimeout(50);
      const info = await page.evaluate(() => {
        const dialog = document.getElementById("site-menu");
        const rect = dialog.getBoundingClientRect();
        return {
          open: dialog.open,
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight,
        };
      });
      assertEqual(info.open, true, "dialog fechou ao redimensionar");
      assert(
        info.right <= info.innerWidth + 1 && info.left >= -1,
        `painel fora do viewport horizontal: ${JSON.stringify(info)}`
      );
      assert(
        info.bottom <= info.innerHeight + 1 && info.top >= -1,
        `painel fora do viewport vertical: ${JSON.stringify(info)}`
      );

      await page.keyboard.press("Escape");
      await page.waitForFunction(() => !document.getElementById("site-menu").open);
      return info;
    } finally {
      await context.close();
    }
  });

  // 3. Posição do scroll restaurada exatamente.
  await check("scroll restaurado em 800px", async () => {
    const { context, page } = await openPage(browser, "/");
    try {
      await page.evaluate(() => window.scrollTo({ top: 800, behavior: "instant" }));
      await page.waitForTimeout(100);
      const before = await page.evaluate(() => window.scrollY);
      assert(Math.abs(before - 800) <= 1, `não foi possível rolar para 800 (${before})`);
      await clickToggle(page);
      const during = await page.evaluate(() => window.scrollY);
      assert(Math.abs(during - before) <= 1, `scroll mudou ao abrir: ${during} (antes ${before})`);
      await page.keyboard.press("Escape");
      await page.waitForFunction(() => !document.getElementById("site-menu").open);
      const after = await page.evaluate(() => window.scrollY);
      assert(Math.abs(after - before) <= 1, `scroll após fechar: ${after} (antes ${before})`);
      return { before, during, after };
    } finally {
      await context.close();
    }
  });

  // 4. 320x640: sem overflow horizontal e fechar acessível sem rolar a página.
  await check("320x640 sem overflow horizontal e fechar acessível", async () => {
    const { context, page } = await openPage(browser, "/", {
      viewport: { width: 320, height: 640 },
    });
    try {
      await openMenu(page);
      const info = await page.evaluate(() => {
        const dialog = document.getElementById("site-menu");
        const nav = document.querySelector(".site-menu__nav");
        const close = document.querySelector(".site-menu__close");
        const rect = close.getBoundingClientRect();
        return {
          docScrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
          navScrollHeight: nav.scrollHeight,
          navClientHeight: nav.clientHeight,
          closeTop: rect.top,
          closeBottom: rect.bottom,
          closeWidth: rect.width,
          closeHeight: rect.height,
          innerHeight: window.innerHeight,
          scrollY: window.scrollY,
        };
      });
      assert(
        info.docScrollWidth <= info.innerWidth,
        `overflow horizontal: ${info.docScrollWidth} > ${info.innerWidth}`
      );
      assert(info.closeTop >= 0, `fechar acima do viewport (${info.closeTop})`);
      assert(
        info.closeBottom <= info.innerHeight,
        `fechar abaixo do viewport (${info.closeBottom} > ${info.innerHeight})`
      );
      assert(
        info.closeWidth >= 44 && info.closeHeight >= 44,
        `alvo do fechar menor que 44px (${info.closeWidth}x${info.closeHeight})`
      );
      assertEqual(info.scrollY, 0, "a página precisou rolar para alcançar o fechar");
      return info;
    } finally {
      await context.close();
    }
  });

  // 5. prefers-reduced-motion: reduce desliga a animação de entrada.
  await check("reduced motion: animation-name none", async () => {
    const { context, page } = await openPage(browser, "/", {
      reducedMotion: "reduce",
    });
    try {
      await openMenu(page);
      await page.waitForTimeout(50);
      const animation = await page.evaluate(() => {
        const dialog = document.getElementById("site-menu");
        return getComputedStyle(dialog).animationName;
      });
      assertEqual(animation, "none", "animação ativa com reduced motion");
      return { animation };
    } finally {
      await context.close();
    }
  });

  // 6. Sem JS: fallback visível com os 10 links e dialog fechado.
  await check("sem JS: noscript-nav visível com 10 links", async () => {
    const seen = {};
    for (const route of ["/", "/ferramentas.html"]) {
      const { context, page } = await openPage(browser, route, {
        javaScriptEnabled: false,
      });
      try {
        const info = await page.evaluate(() => {
          const nav = document.querySelector(".noscript-nav");
          const links = nav ? [...nav.querySelectorAll("a")] : [];
          const visible = (el) => {
            const style = getComputedStyle(el);
            return (
              el.getClientRects().length > 0 &&
              style.display !== "none" &&
              style.visibility !== "hidden"
            );
          };
          const dialog = document.getElementById("site-menu");
          return {
            navVisible: Boolean(nav) && visible(nav),
            count: links.length,
            allVisible: links.every(visible),
            dialogOpen: dialog ? dialog.open : null,
            jsClass: document.documentElement.classList.contains("js"),
          };
        });
        assert(info.navVisible, `${route}: .noscript-nav não visível`);
        assertEqual(info.count, 10, `${route}: quantidade de links de fallback`);
        assert(info.allVisible, `${route}: link de fallback invisível`);
        assertEqual(info.dialogOpen, false, `${route}: dialog aberto sem JS`);
        assertEqual(info.jsClass, false, `${route}: classe .js presente sem JS`);
        seen[route] = info;
      } finally {
        await context.close();
      }
    }
    return seen;
  });
}

// ---------------------------------------------------------------- movimento
// Ondas do hero (task 5): rAF único, pausa, movimento reduzido, offscreen,
// teto de DPR e ausência de erro de console.

async function frameHash(page) {
  return page.evaluate(() => {
    const canvas = document.querySelector("[data-hero-canvas]");
    const data = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
    let hash = 0;
    for (let i = 0; i < data.length; i += 997) hash = (hash * 31 + data[i]) | 0;
    return hash;
  });
}

async function sampleHashes(page, count, gap) {
  const out = [];
  for (let i = 0; i < count; i += 1) {
    out.push(await frameHash(page));
    await page.waitForTimeout(gap);
  }
  return out;
}

async function runMotion(browser) {
  await check("canvas do hero pinta pixels e respeita o teto de DPR", async () => {
    const { context, page } = await openPage(browser, "/");
    try {
      await page.waitForTimeout(600);
      const measured = await page.evaluate(() => {
        const canvas = document.querySelector("[data-hero-canvas]");
        const ctx = canvas.getContext("2d");
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let painted = 0;
        for (let i = 3; i < data.length; i += 4) if (data[i] > 0) painted += 1;
        return {
          painted,
          ratio: canvas.width / canvas.clientWidth,
          hasContext: Boolean(ctx),
        };
      });
      assert(measured.hasContext, "getContext('2d') devolveu null");
      assert(measured.painted > 1000, `poucos pixels pintados: ${measured.painted}`);
      assert(
        measured.ratio <= 1.55,
        `DPR acima do teto de 1.5: ${measured.ratio.toFixed(2)}`
      );
      return measured;
    } finally {
      await context.close();
    }
  });

  await check("animação avança quadros enquanto o hero está visível", async () => {
    const { context, page } = await openPage(browser, "/");
    try {
      await page.waitForTimeout(500);
      const hashes = await sampleHashes(page, 4, 170);
      assert(
        new Set(hashes).size > 1,
        `quadros idênticos enquanto visível: ${hashes.join(",")}`
      );
      return { hashes, distinct: new Set(hashes).size };
    } finally {
      await context.close();
    }
  });

  await check("não existe controle de pausa e o canvas continua animando", async () => {
    const { context, page } = await openPage(browser, "/");
    try {
      await page.waitForTimeout(600);
      const controls = await page.evaluate(() =>
        document.querySelectorAll(".hero__motion").length
      );
      assertEqual(controls, 0, "a home não deve oferecer botão de pausa");
      const hashes = await sampleHashes(page, 3, 200);
      assert(new Set(hashes).size > 1, `canvas parado sem controle de pausa: ${hashes.join(",")}`);
      return { controls, hashes };
    } finally {
      await context.close();
    }
  });

  await check("prefers-reduced-motion desenha um quadro estático", async () => {
    const { context, page } = await openPage(browser, "/", {
      reducedMotion: "reduce",
    });
    try {
      await page.waitForTimeout(500);
      const hashes = await sampleHashes(page, 3, 300);
      assert(new Set(hashes).size === 1, `animou com movimento reduzido: ${hashes.join(",")}`);
      const state = await page.evaluate(() => {
        const button = document.querySelector(".hero__motion");
        const canvas = document.querySelector("[data-hero-canvas]");
        const data = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
        let painted = 0;
        for (let i = 3; i < data.length; i += 4) if (data[i] > 0) painted += 1;
        return { hasPauseControl: Boolean(button), painted };
      });
      assertEqual(state.hasPauseControl, false, "não deve existir controle de pausa");
      assert(state.painted > 1000, "quadro estático não foi desenhado");
      return { hashes, state };
    } finally {
      await context.close();
    }
  });

  await check("roda só na home e para quando o hero sai da viewport", async () => {
    const { context, page } = await openPage(browser, "/ferramentas.html");
    try {
      const offHome = await page.evaluate(() => ({
        canvas: Boolean(document.querySelector("[data-hero-canvas]")),
        errors: 0,
      }));
      assert(!offHome.canvas, "canvas do hero não deveria existir nas ferramentas");
      await page.goto(BASE + "/", { waitUntil: "load" });
      await page.waitForTimeout(600);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(400);
      const hashes = await sampleHashes(page, 3, 260);
      assert(new Set(hashes).size === 1, `continuou animando fora da viewport: ${hashes.join(",")}`);
      return { hashes };
    } finally {
      await context.close();
    }
  });

  await check("canvas não intercepta ponteiro e o CTA do hero abre o menu", async () => {
    const { context, page } = await openPage(browser, "/");
    try {
      const hit = await page.evaluate(() => {
        const cta = document.querySelector(".hero__actions .btn--accent");
        const rect = cta.getBoundingClientRect();
        const top = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
        return { tag: top && top.tagName, isCta: cta === top || cta.contains(top) };
      });
      assert(hit.isCta, `CTA coberto por ${hit.tag}`);
      await page.click(".hero__actions .btn--accent");
      await page.waitForFunction(
        () => document.getElementById("site-menu").open,
        null,
        { timeout: 4000 }
      );
      const state = await page.evaluate(() => ({
        open: document.getElementById("site-menu").open,
        expanded: document
          .querySelector(".hero__actions .btn--accent")
          .getAttribute("aria-expanded"),
        path: location.pathname,
      }));
      assertEqual(state.path, "/", "o CTA do hero não deve navegar");
      assertEqual(state.expanded, "true", "aria-expanded do CTA do hero");
      return { hit, state };
    } finally {
      await context.close();
    }
  });

  await check("sem erro de console na home com movimento", async () => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    const errors = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
    try {
      await page.goto(BASE + "/", { waitUntil: "load" });
      await page.waitForTimeout(900);
      assertEqual(errors.length, 0, `erros de console: ${errors.join(" | ")}`);
      return { errors };
    } finally {
      await context.close();
    }
  });
}

// ------------------------------------------------------------------- solar
// Painel HAMQSL (task 6): a resposta real nunca é falsificada como dado; os
// casos de sucesso usam uma imagem fixture declarada, e o endpoint real é
// sondado à parte, aceitando indisponibilidade.

// O painel vivo é o endpoint .php (o .gif é o arquivo estático de 2022).
const SOLAR_ENDPOINT = "https://www.hamqsl.com/solarn0nbh.php";
const SOLAR_FIXTURE = path.join(EVIDENCE, "fixtures/solar-fixture.png");

async function solarState(page) {
  return page.evaluate(() => {
    const frame = document.querySelector("[data-solar-frame]");
    const image = document.querySelector("[data-solar-image]");
    const media = document.querySelector("[data-solar-media]");
    const fallback = document.querySelector("[data-solar-fallback]");
    const credit = document.querySelector(".solar__credit");
    const note = document.querySelector(".solar__note");
    return {
      state: frame.getAttribute("data-solar-state"),
      natural: [image.naturalWidth, image.naturalHeight],
      mediaHidden: media.hidden,
      fallbackHidden: fallback.hidden,
      fallbackText: fallback.textContent.trim(),
      creditVisible: credit.getBoundingClientRect().height > 0,
      noteVisible: note.getBoundingClientRect().height > 0,
    };
  });
}

async function runSolar(browser) {
  await check("sucesso: fixture carrega, créditos ficam e aviso desaparece", async () => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    await page.route(SOLAR_ENDPOINT, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "image/png",
        body: await readFile(SOLAR_FIXTURE),
      });
    });
    try {
      await page.goto(BASE + "/", { waitUntil: "load" });
      await page.waitForFunction(
        () => document.querySelector("[data-solar-frame]").dataset.solarState === "loaded",
        null,
        { timeout: 5000 }
      );
      const state = await solarState(page);
      assertEqual(state.state, "loaded", "estado após load");
      assertEqual(state.natural[0], 600, "largura natural da fixture");
      assert(state.fallbackHidden, "aviso deveria estar oculto no sucesso");
      assert(!state.mediaHidden, "imagem deveria estar visível");
      assert(state.creditVisible, "créditos sumiram");
      assert(state.noteVisible, "nota de previsão sumiu");
      const links = await page.evaluate(() =>
        [...document.querySelectorAll('.solar a[href*="hamqsl.com"]')].length
      );
      assert(links >= 3, `links para a fonte insuficientes: ${links}`);
      await page.evaluate(() => document.querySelector(".section--solar").scrollIntoView());
      await page.waitForTimeout(300);
      await page.screenshot({
        path: path.join(EVIDENCE, "06-solar-success.png"),
      });
      return { state, links };
    } finally {
      await context.close();
    }
  });

  await check("falha: requisição abortada mostra aviso, esconde imagem e não quebra a home", async () => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.route(SOLAR_ENDPOINT, (route) => route.abort("failed"));
    try {
      await page.goto(BASE + "/", { waitUntil: "load" });
      await page.waitForFunction(
        () => document.querySelector("[data-solar-frame]").dataset.solarState === "unavailable",
        null,
        { timeout: 5000 }
      );
      const state = await solarState(page);
      assertEqual(state.state, "unavailable", "estado após abort");
      assert(state.mediaHidden, "imagem deveria estar oculta para não mostrar ícone quebrado");
      assert(!state.fallbackHidden, "aviso deveria aparecer");
      assert(/indispon[íi]vel/i.test(state.fallbackText), `aviso inesperado: ${state.fallbackText}`);
      assert(state.creditVisible, "créditos deveriam continuar visíveis");
      assertEqual(pageErrors.length, 0, `pageerror: ${pageErrors.join(" | ")}`);
      const brokenIcon = await page.evaluate(() => {
        const image = document.querySelector("[data-solar-image]");
        const rect = image.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });
      assert(!brokenIcon, "imagem quebrada ainda ocupa espaço");
      await page.click(".nav-toggle");
      await page.waitForFunction(() => document.getElementById("site-menu").open);
      await page.keyboard.press("Escape");
      return { state, brokenIcon };
    } finally {
      await context.close();
    }
  });

  await check("falha: resposta que não é imagem cai no aviso honesto", async () => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    await page.route(SOLAR_ENDPOINT, (route) =>
      route.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><p>bloqueado</p>" })
    );
    try {
      await page.goto(BASE + "/", { waitUntil: "load" });
      await page.waitForFunction(
        () => document.querySelector("[data-solar-frame]").dataset.solarState === "unavailable",
        null,
        { timeout: 5000 }
      );
      const state = await solarState(page);
      assert(state.mediaHidden && !state.fallbackHidden, "estado de falha incompleto");
      // A legenda em português cita os nomes dos índices de propósito, então o
      // que se proíbe é um VALOR ao lado do rótulo (SFI 153, K 4…), não a
      // menção ao nome.
      const fabricated = await page.evaluate(() => {
        const texto = document.querySelector(".section--solar").textContent;
        // Sensível a caixa: os rótulos do painel são maiúsculos. Assim a prosa
        // em português ("de 0 a 9") não vira falso positivo.
        return /\b(SFI|SSN|Bz|X-Ray)\s*[:=]?\s*\d/.test(texto)
          || /\bK\s*[:=]\s*\d/.test(texto)
          || /\bK-index\s*[:=]?\s*\d/.test(texto);
      });
      assert(!fabricated, "a página inventou índices solares em HTML");
      return { state, fabricated };
    } finally {
      await context.close();
    }
  });

  await check("timeout de 20 s mostra aviso e um load tardio recupera o painel", async () => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    const fixture = await readFile(SOLAR_FIXTURE);
    await page.route(SOLAR_ENDPOINT, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 20500));
      await route.fulfill({ status: 200, contentType: "image/png", body: fixture });
    });
    try {
      // domcontentloaded, não load: o evento load espera a imagem pendente e
      // consumiria os 20,5 s do atraso antes de qualquer medição.
      const startedAt = Date.now();
      await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
      await page.waitForFunction(
        () => document.querySelector("[data-solar-frame]").dataset.solarState === "unavailable",
        null,
        { timeout: 24000 }
      );
      const elapsed = Date.now() - startedAt;
      assert(
        elapsed >= 19500 && elapsed <= 22500,
        `timeout fora da janela esperada de 20 s: ${elapsed} ms`
      );
      const atTimeout = await solarState(page);
      assertEqual(atTimeout.state, "unavailable", "estado após 20 s sem resposta");
      assert(!atTimeout.fallbackHidden, "aviso deveria estar visível no timeout");
      await page.waitForFunction(
        () => document.querySelector("[data-solar-frame]").dataset.solarState === "loaded",
        null,
        { timeout: 6000 }
      );
      const recovered = await solarState(page);
      assertEqual(recovered.state, "loaded", "estado após load tardio");
      assert(recovered.fallbackHidden, "aviso deveria sair depois do load tardio");
      assert(recovered.creditVisible, "créditos não podem sumir na recuperação");
      return { elapsed, atTimeout, recovered };
    } finally {
      await context.close();
    }
  });

  await check("imagem larga não estoura a moldura em 320px", async () => {
    const context = await browser.newContext({ viewport: { width: 320, height: 640 } });
    const page = await context.newPage();
    const fixture = await readFile(SOLAR_FIXTURE);
    await page.route(SOLAR_ENDPOINT, (route) =>
      route.fulfill({ status: 200, contentType: "image/png", body: fixture })
    );
    try {
      await page.goto(BASE + "/", { waitUntil: "load" });
      await page.waitForFunction(
        () => document.querySelector("[data-solar-frame]").dataset.solarState === "loaded",
        null,
        { timeout: 5000 }
      );
      const measured = await page.evaluate(() => {
        const frame = document.querySelector("[data-solar-frame]");
        const image = document.querySelector("[data-solar-image]");
        return {
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
          imageWidth: image.getBoundingClientRect().width,
          frameWidth: frame.getBoundingClientRect().width,
        };
      });
      assert(
        measured.scrollWidth <= measured.innerWidth,
        `overflow horizontal: ${measured.scrollWidth} > ${measured.innerWidth}`
      );
      assert(
        measured.imageWidth <= measured.frameWidth + 0.5,
        `imagem ${measured.imageWidth}px maior que a moldura ${measured.frameWidth}px`
      );
      return measured;
    } finally {
      await context.close();
    }
  });

  await check("sem JS os créditos e os links continuam úteis", async () => {
    const { context, page } = await openPage(browser, "/", {
      viewport: { width: 390, height: 844 },
      javaScriptEnabled: false,
    });
    try {
      const useful = await page.evaluate(() => {
        const visible = (el) => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        };
        return {
          credit: visible(document.querySelector(".solar__credit")),
          note: visible(document.querySelector(".solar__note")),
          source: visible(document.querySelector(".solar__open")),
          href: document.querySelector(".solar__open").getAttribute("href"),
          rel: document.querySelector(".solar__open").getAttribute("rel"),
          state: document.querySelector("[data-solar-frame]").getAttribute("data-solar-state"),
        };
      });
      assert(useful.credit, "crédito invisível sem JS");
      assert(useful.note, "nota invisível sem JS");
      assert(useful.source, "link da fonte invisível sem JS");
      assert(useful.href.includes("hamqsl.com"), `href inesperado: ${useful.href}`);
      assert(useful.rel.includes("noopener"), `rel sem noopener: ${useful.rel}`);
      return useful;
    } finally {
      await context.close();
    }
  });

  await check("legenda em português: fechada, acessível por teclado e sem requisição nova", async () => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const externas = [];
    page.on("request", (req) => {
      const url = new URL(req.url());
      if (url.origin !== new URL(BASE).origin) externas.push(url.href);
    });
    await page.route(SOLAR_ENDPOINT, (route) =>
      route.fulfill({ status: 200, contentType: "image/png", body: "" })
    );
    try {
      await page.goto(BASE + "/", { waitUntil: "load" });
      const fechada = await page.evaluate(() => {
        const d = document.querySelector(".solar__legend");
        if (!d) return null;
        return {
          open: d.open,
          termos: d.querySelectorAll("dt").length,
          resumo: d.querySelector("summary").textContent.replace(/\s+/g, " ").trim(),
          altura: Math.round(d.getBoundingClientRect().height),
        };
      });
      assert(fechada, "legenda ausente");
      assertEqual(fechada.open, false, "legenda deveria começar fechada");
      assert(fechada.termos >= 12, `poucos termos traduzidos: ${fechada.termos}`);
      assert(
        fechada.resumo.includes("Poor = ruim") &&
          fechada.resumo.includes("Fair = média") &&
          fechada.resumo.includes("Good = boa"),
        `resumo sem a tradução principal: ${fechada.resumo}`
      );
      assert(fechada.altura < 130, `legenda fechada ocupa demais: ${fechada.altura}px`);

      await page.locator(".solar__legend summary").focus();
      await page.keyboard.press("Enter");
      await page.waitForFunction(() => document.querySelector(".solar__legend").open, null, {
        timeout: 2000,
      });
      const aberta = await page.evaluate(() => {
        const d = document.querySelector(".solar__legend");
        const corpo = d.querySelector(".solar__legend-body").textContent;
        return {
          open: d.open,
          temPortugues: /Fluxo solar|Manchas solares|Frequência máxima/.test(corpo),
          overflow: document.documentElement.scrollWidth > innerWidth,
        };
      });
      assert(aberta.temPortugues, "corpo da legenda não está em português");
      assertEqual(aberta.overflow, false, "legenda aberta estourou a largura");

      const hamqsl = externas.filter((u) => u.includes("hamqsl.com"));
      assertEqual(
        externas.length,
        hamqsl.length,
        `requisição externa inesperada: ${externas.join(", ")}`
      );
      return { fechada, aberta, externas };
    } finally {
      await context.close();
    }
  });

  await check("endpoint real: registra o resultado sem inventar dado", async () => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    const responses = [];
    page.on("response", (response) => {
      if (response.url().includes("hamqsl.com")) {
        responses.push({
          url: response.url(),
          status: response.status(),
          type: response.headers()["content-type"] || "",
        });
      }
    });
    try {
      await page.goto(BASE + "/", { waitUntil: "load" });
      await page.waitForTimeout(4500);
      const state = await solarState(page);
      const record = {
        checkedAt: new Date().toISOString(),
        endpoint: SOLAR_ENDPOINT,
        responses,
        state,
        verdict:
          state.state === "loaded"
            ? "loaded"
            : "unavailable — fallback correto, não é falha do hub",
      };
      await writeFile(
        path.join(EVIDENCE, "06-solar-live.json"),
        JSON.stringify(record, null, 2)
      );
      if (state.state === "loaded") {
        assert(state.natural[0] > 0, "naturalWidth zero apesar de loaded");
      } else {
        assert(!state.fallbackHidden, "endpoint indisponível mas sem aviso");
      }
      return record;
    } finally {
      await context.close();
    }
  });
}

// ---------------------------------------------------------------- jornadas
// Percursos reais de visitante (task 7). Cada jornada usa contexto isolado.

async function answerThreeQuestions(page) {
  const log = [];
  // A terceira resposta é ERRADO de propósito: garante que o simulado grave
  // algo no localStorage (as três classes usam chaves diferentes) e que a
  // persistência testada seja real, não um passo vazio.
  const plan = ["yes", "yes", "no"];
  for (let i = 0; i < plan.length; i += 1) {
    await page.waitForSelector(`#answerBtns button.${plan[i]}`, { state: "visible" });
    await page.click(`#answerBtns button.${plan[i]}`);
    await page.waitForTimeout(120);
    const counters = await page.evaluate(() => ({
      num: document.getElementById("num").textContent.trim(),
      hits: document.getElementById("hits").textContent.trim(),
      errors: document.getElementById("errors").textContent.trim(),
    }));
    log.push(counters);
    const next = await page.$("#next");
    if (next && (await next.isVisible())) {
      await page.click("#next");
      await page.waitForTimeout(120);
    }
  }
  return log;
}

async function runJourneys(browser) {
  const classes = [
    { label: "Classe C", link: "Simulado Classe C", path: "/simulados/classe-c.html" },
    { label: "Classe B", link: "Simulado Classe B", path: "/simulados/classe-b.html" },
    { label: "Classe A", link: "Simulado Classe A", path: "/simulados/classe-a.html" },
  ];

  for (const item of classes) {
    await check(`home -> menu -> ${item.label}: 3 respostas, avanço e erros após reload`, async () => {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const page = await context.newPage();
      try {
        await page.goto(BASE + "/", { waitUntil: "load" });
        await page.click(".nav-toggle");
        await page.waitForFunction(() => document.getElementById("site-menu").open);
        await page.click(`.site-menu__link[href="${item.path}"]`);
        await page.waitForLoadState("load");
        assert(
          page.url().endsWith(item.path),
          `menu não levou a ${item.path}: ${page.url()}`
        );

        await page.click('button[onclick="startOfficial()"]');
        const counters = await answerThreeQuestions(page);
        const last = counters[counters.length - 1];
        const answered = Number(last.hits) + Number(last.errors);
        assert(answered >= 3, `contadores não somam 3 respostas: ${JSON.stringify(last)}`);

        // As três classes originais usam chaves de storage diferentes
        // (radioBrasilC2026Errors, monstroB_errors_v3, radioBrasilA_errors_v1),
        // então a comparação é sobre o mapa inteiro, sem assumir nome.
        const before = await page.evaluate(() =>
          Object.fromEntries(Object.entries(window.localStorage))
        );
        assert(
          Object.keys(before).length > 0,
          `o simulado não gravou nada no storage: ${JSON.stringify(counters)}`
        );

        await page.reload({ waitUntil: "load" });
        const after = await page.evaluate(() =>
          Object.fromEntries(Object.entries(window.localStorage))
        );
        const preserved = Object.keys(before).filter((key) => after[key] === before[key]);
        assert(
          preserved.length === Object.keys(before).length,
          `chaves perdidas no reload: ${JSON.stringify({ before, after })}`
        );
        return { counters, storageKeys: Object.keys(before), preserved };
      } finally {
        await context.close();
      }
    });
  }

  await check("catálogo -> calculadora com 146 MHz: 2,053 / 0,979 / 0,490 m", async () => {
    const { context, page } = await openPage(browser, "/ferramentas.html");
    try {
      await page.click('.card__actions a[href="/ferramentas/antenas.html"]');
      await page.waitForLoadState("load");
      assert(page.url().endsWith("/ferramentas/antenas.html"), `url: ${page.url()}`);
      await page.fill("#antena-freq", "146");
      await page.click('#antena-form button[type="submit"]');
      await page.waitForTimeout(250);
      const text = (await page.textContent("#antena-result")).replace(/\s+/g, " ");
      assert(/2[,.]053/.test(text), `comprimento de onda ausente: ${text}`);
      assert(/0[,.]979/.test(text), `dipolo total ausente: ${text}`);
      assert(/0[,.]490/.test(text), `braço do dipolo ausente: ${text}`);
      return { text };
    } finally {
      await context.close();
    }
  });

  await check("Morse: SOS converte, reproduz, para e exercita", async () => {
    const { context, page } = await openPage(browser, "/ferramentas/morse.html");
    try {
      await page.fill("#morse-input", "SOS");
      await page.waitForTimeout(200);
      const output = (await page.textContent("#morse-output")).trim();
      assert(output.includes("..."), `conversão inesperada: ${output}`);
      await page.click("#morse-play");
      await page.waitForTimeout(250);
      const playing = await page.textContent("#morse-status");
      await page.click("#morse-stop");
      await page.waitForTimeout(250);
      const stopped = await page.textContent("#morse-status");
      assert(playing !== stopped, "status não mudou entre reproduzir e parar");
      await page.click("#ex-new");
      await page.waitForTimeout(150);
      assert(
        (await page.isVisible("#ex-input")) || (await page.isVisible("#ex-check")),
        "exercício não abriu entrada/verificação"
      );
      return { output, playing: playing.trim(), stopped: stopped.trim() };
    } finally {
      await context.close();
    }
  });

  await check("Referência: busca por qth filtra os blocos", async () => {
    const { context, page } = await openPage(browser, "/referencia.html");
    try {
      const before = await page.evaluate(() =>
        document.querySelectorAll(".ref-table tbody tr, .ref-grid > *").length
      );
      await page.fill("#ref-busca", "qth");
      await page.waitForTimeout(300);
      const result = await page.evaluate(() => {
        const visible = [...document.querySelectorAll(".ref-table tbody tr, .ref-grid > *")]
          .filter((el) => el.getBoundingClientRect().height > 0);
        const status = document.querySelector("[data-ref-status], .ref-status");
        return {
          visible: visible.length,
          text: visible.map((el) => el.textContent).join(" ").toUpperCase(),
          status: status ? status.textContent.trim() : null,
        };
      });
      assert(result.visible > 0, "busca por qth não retornou nada visível");
      assert(result.text.includes("QTH"), "resultado não contém QTH");
      assert(result.visible <= before, "busca aumentou o número de linhas");
      return { before, ...result };
    } finally {
      await context.close();
    }
  });
}

// ---------------------------------------------------------------- falhas
async function runFailures(browser) {
  await check("menu fechado não é focalizável", async () => {
    const { context, page } = await openPage(browser, "/");
    try {
      const reachable = await page.evaluate(() => {
        const link = document.querySelector(".site-menu__link");
        link.focus();
        return document.activeElement === link;
      });
      assert(!reachable, "link do menu fechado recebeu foco");
      return { reachable };
    } finally {
      await context.close();
    }
  });

  await check("input hostil da calculadora não executa nem gera resultado velho", async () => {
    const { context, page } = await openPage(browser, "/ferramentas/antenas.html");
    try {
      const fired = [];
      page.on("dialog", async (dialog) => {
        fired.push(dialog.message());
        await dialog.dismiss();
      });
      await page.fill("#antena-freq", "146");
      await page.click('#antena-form button[type="submit"]');
      await page.waitForTimeout(200);
      const good = await page.textContent("#antena-result");

      await page.fill("#antena-freq", "<img src=x onerror=alert(1)>");
      await page.click('#antena-form button[type="submit"]');
      await page.waitForTimeout(300);
      const hostile = await page.evaluate(() => ({
        result: document.getElementById("antena-result").textContent.trim(),
        injected: document.querySelectorAll("#antena-result img, #antena-result script").length,
        alerts: 0,
      }));
      assertEqual(fired.length, 0, `alert disparado: ${fired.join("|")}`);
      assertEqual(hostile.injected, 0, "HTML hostil virou nó no DOM");
      assert(
        hostile.result !== good.trim(),
        "resultado antigo permaneceu depois de entrada inválida"
      );
      return { good: good.trim(), hostile, fired };
    } finally {
      await context.close();
    }
  });

  await check("canvas indisponível não quebra a home", async () => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript(() => {
      HTMLCanvasElement.prototype.getContext = () => null;
    });
    try {
      await page.goto(BASE + "/", { waitUntil: "load" });
      await page.waitForTimeout(600);
      const state = await page.evaluate(() => ({
        rings: document.querySelectorAll(".hero__rings span").length,
        title: document.querySelector(".hero__title").textContent.trim().length,
        hasPauseControl: Boolean(document.querySelector(".hero__motion")),
      }));
      assertEqual(state.rings, 4, "anéis CSS deveriam continuar como fallback");
      assertEqual(state.hasPauseControl, false, "não deve existir controle de pausa");
      assert(state.title > 0, "título sumiu");
      assertEqual(errors.length, 0, `pageerror: ${errors.join(" | ")}`);
      await page.click(".hero__actions .btn--accent");
      await page.waitForFunction(
        () => document.getElementById("site-menu").open,
        null,
        { timeout: 4000 }
      );
      assertEqual(new URL(page.url()).pathname, "/", "CTA do hero não navega");
      return { state, errors };
    } finally {
      await context.close();
    }
  });

  await check("rotas inexistentes devolvem 404 sem servir o repositório", async () => {
    const { context, page } = await openPage(browser, "/");
    try {
      const missing = await page.request.get(BASE + "/inexistente.html");
      const pkg = await page.request.get(BASE + "/package.json");
      const tests = await page.request.get(BASE + "/tests/test_site.py");
      assertEqual(missing.status(), 404, "/inexistente.html");
      assertEqual(pkg.status(), 404, "/package.json exposto");
      assertEqual(tests.status(), 404, "/tests exposto");
      return { missing: missing.status(), pkg: pkg.status(), tests: tests.status() };
    } finally {
      await context.close();
    }
  });

  await check("com rede externa bloqueada as páginas continuam utilizáveis", async () => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.route("**://**", (route) => {
      const url = route.request().url();
      if (url.startsWith(BASE)) return route.continue();
      return route.abort("failed");
    });
    try {
      for (const route of ["/", "/simulados.html", "/ferramentas.html", "/referencia.html", "/links.html"]) {
        await page.goto(BASE + route, { waitUntil: "load" });
        const usable = await page.evaluate(() => ({
          h1: document.querySelectorAll("h1").length,
          overflow: document.documentElement.scrollWidth <= window.innerWidth,
        }));
        assertEqual(usable.h1, 1, `${route}: h1`);
        assert(usable.overflow, `${route}: overflow horizontal com rede bloqueada`);
      }
      await page.goto(BASE + "/", { waitUntil: "load" });
      await page.waitForTimeout(600);
      const solar = await page.evaluate(() =>
        document.querySelector("[data-solar-frame]").dataset.solarState
      );
      assertEqual(solar, "unavailable", "painel deveria cair no aviso com rede bloqueada");
      return { solar };
    } finally {
      await context.close();
    }
  });

  await check("todas as páginas próprias funcionam sem JS", async () => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      javaScriptEnabled: false,
    });
    const page = await context.newPage();
    try {
      const report = [];
      for (const route of ROUTES) {
        await page.goto(BASE + route, { waitUntil: "load" });
        const state = await page.evaluate(() => {
          const visible = (el) => {
            if (!el) return false;
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0 && getComputedStyle(el).opacity !== "0";
          };
          return {
            h1: document.querySelectorAll("h1").length,
            noscript: visible(document.querySelector(".noscript-nav")),
            overflow: document.documentElement.scrollWidth <= window.innerWidth,
          };
        });
        assertEqual(state.h1, 1, `${route}: h1`);
        assert(state.noscript, `${route}: menu noscript invisível`);
        assert(state.overflow, `${route}: overflow horizontal sem JS`);
        report.push({ route, ...state });
      }
      return report;
    } finally {
      await context.close();
    }
  });

  await check("preview continua na raiz certa e com os limites do baseline", async () => {
    const { context, page } = await openPage(browser, "/");
    try {
      const exposed = await page.request.get(BASE + "/../package.json");
      const readme = await page.request.get(BASE + "/README.md");
      assert(
        exposed.status() === 404 || exposed.status() === 400,
        `traversal devolveu ${exposed.status()}`
      );
      assertEqual(readme.status(), 404, "README.md fora de site/ foi servido");
      return { traversal: exposed.status(), readme: readme.status() };
    } finally {
      await context.close();
    }
  });
}

async function main() {
  await mkdir(EVIDENCE, { recursive: true });
  const browser = await chromium.launch({
    executablePath: EXECUTABLE,
    args: ["--no-sandbox"],
  });
  const MOTION = process.argv.includes("--motion");
  const SOLAR = process.argv.includes("--solar");
  const JOURNEYS = process.argv.includes("--journeys");
  const FAILURES = process.argv.includes("--failures");
  const mode = JOURNEYS
    ? "journeys"
    : FAILURES
      ? "failures"
      : SOLAR
        ? "solar"
        : MOTION
          ? "motion"
          : NEGATIVE
            ? "negative"
            : "happy";
  const outputFile = JOURNEYS
    ? "07-journeys.json"
    : FAILURES
      ? "07-negative.json"
      : SOLAR
        ? "06-solar-negative.json"
        : MOTION
          ? "05-waves.json"
          : NEGATIVE
            ? "03-menu-negative.json"
            : "03-menu.json";
  const startedAt = new Date().toISOString();

  try {
    if (JOURNEYS) {
      await runJourneys(browser);
    } else if (FAILURES) {
      await runFailures(browser);
    } else if (SOLAR) {
      await runSolar(browser);
    } else if (MOTION) {
      await runMotion(browser);
    } else if (NEGATIVE) {
      await runNegative(browser);
    } else {
      await runHappy(browser);
    }
  } finally {
    await browser.close();
  }

  const report = {
    mode,
    base: BASE,
    startedAt,
    finishedAt: new Date().toISOString(),
    total: results.length,
    passed: results.filter((r) => r.status === "pass").length,
    failed: results.filter((r) => r.status === "fail").length,
    results,
  };
  await writeFile(path.join(EVIDENCE, outputFile), JSON.stringify(report, null, 2));

  console.log(
    `\n${mode}: ${report.passed}/${report.total} pass, ${report.failed} fail -> ${outputFile}`
  );
  if (failed > 0) process.exitCode = 1;
}

await main();
