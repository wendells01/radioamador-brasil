import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
const base=process.env.PREVIEW_URL||'http://100.125.41.28:18789';
for(const engine of [chromium,webkit]){
 const browser=await engine.launch(engine===chromium?{executablePath:process.env.CHROMIUM_EXECUTABLE||'/home/ubuntu/.cache/ms-playwright/chromium-1248/chrome-linux-arm64/chrome'}:{});
 try{
  for(const width of [320,390,768,1440]){
   const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
   assert([200,304].includes((await page.goto(`${base}/aprendizado/primeiro-coer.html`)).status()));
   await page.locator('[data-coer-progress]:visible').waitFor();
   assert.equal(await page.locator('h1').count(),1);
   assert.equal(await page.locator('[data-coer-step]').count(),6);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${engine.name()} ${width}`);
   const issues=await page.evaluate(()=>{const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);return {duplicates:ids.length-new Set(ids).size,anchors:[...document.querySelectorAll('a[href^="#"]')].map(e=>e.hash.slice(1)).filter(id=>id&&!document.getElementById(id))};});assert.deepEqual(issues,{duplicates:0,anchors:[]});
   await page.locator('[data-coer-step="acessos"]').check();await page.locator('[data-coer-step="estudo"]').check();
   assert.equal(await page.locator('#coer-progress').getAttribute('value'),'2');
   await page.reload();await page.locator('[data-coer-progress]:visible').waitFor();assert.equal(await page.locator('[data-coer-step="acessos"]').isChecked(),true);assert.equal(await page.locator('#coer-progress-label').textContent(),'2 de 6 etapas marcadas');
   await page.locator('#coer-reset').click();assert.equal(await page.locator('input:checked').count(),0);
   await page.reload();await page.locator('[data-coer-progress]:visible').waitFor();assert.equal(await page.locator('input:checked').count(),0);
   await page.locator('summary').filter({hasText:'Sou menor'}).click();assert(await page.getByText('O responsável solicita pelo SEI', {exact:false}).isVisible());
   await page.locator('[data-menu-open]').click();assert.equal(await page.locator('#site-menu [aria-current="page"]').count(),1);assert.equal(await page.locator('#site-menu [aria-current="page"]').getAttribute('href'),'/aprendizado/primeiro-coer.html');await page.keyboard.press('Escape');
   if(width===390&&engine===chromium){await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'.omo/evidence/coer/mobile.png',fullPage:true});}
   assert.deepEqual(errors,[]);await page.close();
  }
  const plain=await browser.newPage({javaScriptEnabled:false});await plain.goto(`${base}/aprendizado/primeiro-coer.html`);assert.equal(await plain.locator('.coer-step').count(),6);assert.equal(await plain.locator('[data-coer-progress]').isVisible(),false);await plain.close();
  const blocked=await browser.newPage();await blocked.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new Error('blocked');}}));await blocked.goto(`${base}/aprendizado/primeiro-coer.html`);await blocked.locator('[data-coer-progress]:visible').waitFor();await blocked.locator('[data-coer-step="acessos"]').check();assert.equal(await blocked.locator('#coer-progress').getAttribute('value'),'1');assert((await blocked.locator('#coer-save-note').textContent()).includes('indisponível'));await blocked.close();
  console.log(`PASS ${engine.name()}: 4 larguras, navegação, persistência, reset, sem JS e armazenamento bloqueado.`);
 }finally{await browser.close();}
}
