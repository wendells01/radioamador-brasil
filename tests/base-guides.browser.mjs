import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const base=process.env.BASE_URL||'http://100.125.41.28:18789';
await mkdir('.omo/evidence/base-guides',{recursive:true});
for(const engine of [chromium,webkit]){
 const browser=await engine.launch(engine===chromium?{executablePath:process.env.CHROMIUM_EXECUTABLE||'/home/ubuntu/.cache/ms-playwright/chromium-1248/chrome-linux-arm64/chrome'}:{});
 try{
  const page=await browser.newPage({reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  for(const width of [320,390,768,1440]){
   await page.setViewportSize({width,height:900});
   for(const slug of ['estacao-base','roe','antenas']){
    assert.ok([200,304].includes((await page.goto(`${base}/aprendizado/${slug}.html`)).status()));
    await page.waitForSelector('.guide-intro');
    assert.equal(await page.locator('h1').count(),1);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${engine.name()} ${width} ${slug}`);
    const issues=await page.evaluate(()=>{const ids=[...document.querySelectorAll('[id]')].map(el=>el.id);return {duplicates:ids.length-new Set(ids).size,anchors:[...document.querySelectorAll('a[href^="#"]')].map(a=>a.getAttribute('href')).filter(h=>h.length>1&&!document.getElementById(h.slice(1)))};});
    assert.deepEqual(issues,{duplicates:0,anchors:[]});
    if(slug==='estacao-base'){
     await page.waitForSelector('[data-part-panel="radio"]:visible');
     const covered=await page.locator('.bench-point > span').evaluateAll(markers=>{
      const equipment=document.querySelector('[data-bench-equipment]').getBoundingClientRect();
      return markers.filter(marker=>{const r=marker.getBoundingClientRect();return r.left<equipment.right&&r.right>equipment.left&&r.top<equipment.bottom&&r.bottom>equipment.top;}).map(m=>m.textContent);
     });
     assert.deepEqual(covered,[],`números cobrindo equipamentos: ${covered}`);
     await page.locator('.bench-point[data-bench-part="fonte"]').click();
     assert.ok(await page.locator('[data-part-panel="fonte"]').isVisible());
     assert.equal(await page.locator('[data-part-panel]:visible').count(),1);
     assert.equal(await page.locator('.bench-picker [data-bench-part="fonte"]').getAttribute('aria-current'),'true');
     await page.locator('.bench-picker [data-bench-part="antena"]').focus();await page.keyboard.press('Enter');
     assert.ok(await page.locator('[data-part-panel="antena"]').isVisible());
     if(width===390){await page.locator('#bancada').scrollIntoViewIfNeeded();await page.screenshot({path:`.omo/evidence/base-guides/${engine.name()}-bench.png`});}
    }else if(slug==='roe'){
     assert.equal(await page.locator('#entender-roe .guide-number svg').count(),3);
     assert.equal(await page.locator('#roe-reflected').innerText(),'11,11 W');
     await page.locator('#roe-value').fill('5');assert.equal(await page.locator('#roe-reflected').innerText(),'44,44 W');
     await page.locator('#roe-power').fill('0');assert.ok(await page.locator('#roe-error').isVisible());assert.ok(await page.locator('#roe-lab-results').isHidden());
     await page.locator('#roe-power').fill('1,5');await page.locator('#roe-value').fill('1');
     assert.equal(await page.locator('#roe-reflected').innerText(),'0 W');assert.equal(await page.locator('#roe-net').innerText(),'1,5 W');
     assert.equal(await page.locator('#roe-return-loss').innerText(),'∞ dB');
     if(width===390){await page.locator('#roe-lab-results').scrollIntoViewIfNeeded();await page.screenshot({path:`.omo/evidence/base-guides/${engine.name()}-roe.png`});}
    }else{
     assert.equal(await page.locator('[data-antenna-card]:visible').count(),20);
     await page.locator('#antenna-search').fill('efhw');assert.equal(await page.locator('[data-antenna-card]:visible').count(),1);
     await page.locator('#antenna-reset').click();await page.locator('#antenna-application').selectOption('px');await page.locator('#antenna-family').selectOption('loops');
     assert.equal(await page.locator('[data-antenna-card]:visible').count(),1);
     await page.locator('[data-antenna-card]:visible summary').click();assert.ok(await page.locator('[data-antenna-card]:visible details').evaluate(e=>e.open));
     await page.locator('#antenna-search').fill('sem-resultados-xyz');assert.ok(await page.locator('#antenna-empty').isVisible());
     await page.locator('#antenna-reset').click();assert.equal(await page.locator('[data-antenna-card]:visible').count(),20);
     if(width===390){await page.locator('[data-antenna-card]').first().scrollIntoViewIfNeeded();await page.screenshot({path:`.omo/evidence/base-guides/${engine.name()}-antennas.png`});}
    }
    if(width===390){await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`.omo/evidence/base-guides/${engine.name()}-${slug}-hero.png`});}
   }
   console.log(`${engine.name()} ${width}: bancada, teclado, ROE, filtros, detalhes e layout OK`);
  }
  assert.deepEqual(errors,[]);
  const context=await browser.newContext({javaScriptEnabled:false}),fallback=await context.newPage();
  await fallback.goto(`${base}/aprendizado/estacao-base.html`);assert.equal(await fallback.locator('[data-part-panel]:visible').count(),8);
  await fallback.goto(`${base}/aprendizado/antenas.html`);assert.equal(await fallback.locator('[data-antenna-card]').count(),20);
  await fallback.goto(`${base}/aprendizado/roe.html`);assert.match(await fallback.locator('#roe-reflected').innerText(),/11,11/);
  await context.close();
 }finally{await browser.close();}
}
