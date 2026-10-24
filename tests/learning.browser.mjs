import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {challengeFor} from '../site/assets/js/daily-challenge.js';
const base=process.env.BASE_URL||'http://127.0.0.1:18790';
await mkdir('.omo/evidence/learning',{recursive:true});
for(const engine of [chromium,webkit]){
 const browser=await engine.launch(engine===chromium&&process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{});
 try{
  const page=await browser.newPage({reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  for(const width of [320,375,390,430,768,1440]){
   await page.setViewportSize({width,height:900});await page.goto(base);
   await page.waitForSelector('.daily-challenge input');
   const q=challengeFor();
   assert.equal(await page.locator('.daily-challenge input').count(),q.options.length);
   await page.locator('.daily-challenge input').nth(q.options.indexOf(q.answer)).check();
   await page.locator('.daily-challenge button').click();
   assert.equal(await page.locator('.daily-challenge__feedback').getAttribute('data-correct'),'true');
   assert.ok(await page.locator('.daily-challenge__feedback').evaluate(e=>e===document.activeElement));
   await page.reload();
   await page.waitForSelector('.daily-challenge input');
   assert.equal(await page.locator('.daily-challenge legend').innerText(),q.question);
   await page.locator('.daily-challenge input').nth(q.options.findIndex(option=>option!==q.answer)).check();
   await page.locator('.daily-challenge button').click();
   assert.equal(await page.locator('.daily-challenge__feedback').getAttribute('data-correct'),'false');
   assert.ok((await page.locator('.daily-challenge__feedback').innerText()).includes(q.answer));
   assert.equal(await page.locator('.home-highlights .card').count(),3);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   if(width===390){await page.locator('#desafio').scrollIntoViewIfNeeded();await page.screenshot({path:`.omo/evidence/learning/${engine.name()}-home.png`});}
   await page.goto(`${base}/aprendizado/ht.html`);
   assert.equal(await page.locator('.ht-concepts article').count(),4);
   const summary=page.locator('#duvidas-ht summary').first();await summary.focus();await page.keyboard.press('Enter');
   assert.ok(await page.locator('#duvidas-ht details p').first().isVisible());
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await page.locator('.nav-toggle').click();
   assert.equal(await page.locator('#site-menu a[href="/aprendizado/ht.html"]').count(),1);
   assert.equal(await page.locator('#site-menu a[href="/ferramentas/locator.html"]').count(),1);
   await page.keyboard.press('Escape');
   await page.goto(`${base}/ferramentas/locator.html`);
   await page.locator('#coordinates-form button').click();assert.equal(await page.locator('.locator-code').innerText(),'GG66qk');
   await page.locator('#precision').selectOption('4');await page.locator('#coordinates-form button').click();assert.equal(await page.locator('.locator-code').innerText(),'GG66');
   await page.locator('#latitude').fill('91');await page.locator('#coordinates-form button').click();assert.equal(await page.locator('#coordinates-result').getAttribute('data-state'),'error');
   await page.locator('#locator-form button').click();assert.match(await page.locator('#locator-result').innerText(),/Centro da célula GG66qk/);
   await page.locator('#origin').fill('0;179');await page.locator('#destination').fill('0;-179');await page.locator('#route-form button').click();
   assert.match(await page.locator('#route-result').innerText(),/222,4 km/);assert.match(await page.locator('#route-result').innerText(),/90°/);
   if(width===390){await page.locator('#trajeto').scrollIntoViewIfNeeded();await page.screenshot({path:`.omo/evidence/learning/${engine.name()}-locator.png`});}
   await page.locator('#destination').fill('0;179');await page.locator('#route-form button').click();assert.match(await page.locator('#route-result').innerText(),/Não definido/);
   await page.locator('#destination').fill('ZZ99');await page.locator('#route-form button').click();assert.equal(await page.locator('#route-result').getAttribute('data-state'),'error');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   console.log(`${engine.name()} ${width}: desafio, destaques, HT, locator, cálculos, teclado e overflow OK`);
  }
  assert.deepEqual(errors,[]);
  const noScript=await browser.newContext({javaScriptEnabled:false});const fallback=await noScript.newPage();
  await fallback.goto(`${base}/aprendizado/ht.html`);assert.equal(await fallback.locator('.ht-concepts article').count(),4);
  await fallback.goto(base);assert.ok(await fallback.locator('.home-highlights a[href="/aprendizado/ht.html"]').isVisible());
  await noScript.close();
 }finally{await browser.close();}
}
