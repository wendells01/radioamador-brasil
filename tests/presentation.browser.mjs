import {chromium,webkit} from 'playwright';import assert from 'node:assert/strict';import {mkdir} from 'node:fs/promises';
const base=process.env.PREVIEW_URL||'http://100.125.41.28:18789';await mkdir('.omo/evidence/presentation',{recursive:true});
for(const engine of [chromium,webkit]){
 const browser=await engine.launch(engine===chromium?{executablePath:process.env.CHROMIUM_EXECUTABLE||'/home/ubuntu/.cache/ms-playwright/chromium-1248/chrome-linux-arm64/chrome'}:{});
 try{
  for(const reducedMotion of ['no-preference','reduce']){
   const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion});const errors=[];page.on('pageerror',e=>errors.push(e.message));
   for(const route of ['/','/ferramentas/indicativos.html','/simulados/classe-c.html']){
    await page.goto(base+route,{waitUntil:'domcontentloaded'});
    const state=await page.evaluate(()=>{const header=getComputedStyle(document.querySelector('.site-header')),title=getComputedStyle(document.querySelector('main h1')),art=document.querySelector('.editorial-intro__art');return {headerOpacity:header.opacity,headerAnimation:header.animationName,titleAnimation:title.animationName,titleDuration:title.animationDuration,titleOpacity:title.opacity,artAnimation:art?getComputedStyle(art).animationName:null};});
    assert.equal(state.headerOpacity,'1');assert.equal(state.headerAnimation,'none');assert(Number(state.titleOpacity)>=.85);
    if(reducedMotion==='reduce'){assert.equal(state.titleAnimation,'none');assert(!state.artAnimation||state.artAnimation==='none');}
    else {assert.equal(state.titleAnimation,route==='/'?'hero-rise':'editorial-enter');assert.equal(state.titleDuration,'0.25s');}
   }
   await page.waitForFunction(()=>!document.getElementById('start-exam').disabled);
   for(const width of [320,390,430,1440]){await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.equal(await page.locator('.exam-timing__choice').count(),2);}
   await page.setViewportSize({width:390,height:844});await page.locator('#exam-no-timer').check();assert((await page.locator('#exam-timer-help').textContent()).startsWith('Sem limite'));
   await page.waitForFunction(()=>getComputedStyle(document.querySelector('.exam-timing__choice:has(#exam-no-timer)')).backgroundColor==='rgb(245, 197, 66)');
   const selected=await page.locator('.exam-timing__choice:has(#exam-no-timer)').evaluate(e=>getComputedStyle(e).backgroundColor);assert.equal(selected,'rgb(245, 197, 66)');
   await page.locator('#exam-no-timer').focus();await page.keyboard.press('ArrowLeft');assert(await page.locator('#exam-use-timer').isChecked());assert((await page.locator('#exam-timer-help').textContent()).startsWith('20 minutos'));
   await page.keyboard.press('ArrowRight');assert(await page.locator('#exam-no-timer').isChecked());
   if(engine===chromium&&reducedMotion==='reduce')await page.locator('.editorial-intro__copy').screenshot({path:'.omo/evidence/presentation/timer-selector.png'});
   await page.locator('#start-exam').click();assert.equal(await page.locator('#timer').textContent(),'Sem limite');assert.deepEqual(errors,[]);await page.close();
  }
  console.log(`PASS ${engine.name()}: seletor destacado, teclado, quatro larguras, animação 250ms, cabeçalho imediato e movimento reduzido.`);
 }finally{await browser.close();}
}
