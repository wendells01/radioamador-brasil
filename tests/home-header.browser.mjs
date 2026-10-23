// Run with site/ served locally: PREVIEW_URL=http://127.0.0.1:18790 node tests/home-header.browser.mjs
// Optional CHROMIUM_EXECUTABLE selects a locally installed Chromium binary.
import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const base=process.env.PREVIEW_URL||'http://127.0.0.1:18790';
await mkdir('.omo/evidence/header',{recursive:true});
for(const engine of [chromium,webkit]){
 const browser=await engine.launch(engine===chromium&&process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{});
 try{
  const context=await browser.newContext({reducedMotion:'reduce'});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const width of [320,375,390,430,768,1440]){
   await page.setViewportSize({width,height:900});
   await page.goto(base);
   await page.waitForFunction(()=>document.documentElement.classList.contains('js')&&document.documentElement.style.getPropertyValue('--home-header-height'));
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   const geometry=await page.evaluate(()=>{
    const header=document.querySelector('.site-header'),hero=document.querySelector('.hero'),ambient=document.querySelector('.hero__ambient');
    const rect=header.getBoundingClientRect(),style=getComputedStyle(header);
    return {headerTop:rect.top,heroTop:hero.getBoundingClientRect().top,ambientTop:ambient.getBoundingClientRect().top,clear:document.querySelector('.hero__text').getBoundingClientRect().top>=rect.bottom,background:style.backgroundColor,border:style.borderBottomWidth,shadow:style.boxShadow,overflow:document.documentElement.scrollWidth>innerWidth};
   });
   assert.deepEqual(geometry,{headerTop:0,heroTop:0,ambientTop:0,clear:true,background:'rgba(0, 0, 0, 0)',border:'0px',shadow:'none',overflow:false},`${engine.name()} ${width}`);
   const toggle=page.locator('.nav-toggle');
   await toggle.click();assert.ok(await page.locator('#site-menu').evaluate(e=>e.open));
   await page.keyboard.press('Escape');assert.equal(await toggle.getAttribute('aria-expanded'),'false');
   assert.ok(await toggle.evaluate(e=>e===document.activeElement));
   // Changing the measured safe-area/wrapping height must reserve more hero space.
   await page.locator('.site-header').evaluate(e=>e.style.paddingTop='24px');
   await page.waitForFunction(()=>parseFloat(document.documentElement.style.getPropertyValue('--home-header-height'))===document.querySelector('.site-header').getBoundingClientRect().height);
   assert.ok(await page.evaluate(()=>document.querySelector('.hero__text').getBoundingClientRect().top>=document.querySelector('.site-header').getBoundingClientRect().bottom));
   await page.locator('.site-header').evaluate(e=>e.style.removeProperty('padding-top'));
   await page.evaluate(()=>window.scrollTo({top:500,behavior:'instant'}));
   await page.waitForSelector('.site-header.is-scrolled');
   assert.equal(await page.locator('.site-header').evaluate(e=>e.getBoundingClientRect().top),0);
   assert.notEqual(await page.locator('.site-header').evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)');
   await toggle.click();await page.locator('.site-menu__close').click();
   assert.equal(await page.evaluate(()=>document.documentElement.style.overflow),'');
   await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
   await page.waitForFunction(()=>!document.querySelector('.site-header').classList.contains('is-scrolled'));
   if([390,1440].includes(width))await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   if([390,1440].includes(width))await page.screenshot({path:`.omo/evidence/header/${engine.name()}-${width}.png`});
   console.log(`${engine.name()} ${width}: hero continuity, spacing, safe-area sizing, sticky contrast and menu OK`);
  }
  // Text zoom can wrap the brand and button; spacing follows actual header height.
  await page.setViewportSize({width:320,height:900});
  await page.addStyleTag({content:'html { font-size: 200%; }'});
  await page.waitForFunction(()=>parseFloat(document.documentElement.style.getPropertyValue('--home-header-height'))===document.querySelector('.site-header').getBoundingClientRect().height);
  assert.ok(await page.evaluate(()=>document.querySelector('.hero__text').getBoundingClientRect().top>=document.querySelector('.site-header').getBoundingClientRect().bottom));
  await page.goto(`${base}/ferramentas/faixas.html`);
  assert.equal(await page.locator('.site-header').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(8, 17, 31)');
  assert.equal(await page.locator('.site-header').evaluate(e=>getComputedStyle(e).borderBottomWidth),'1px');
  assert.deepEqual(errors,[]);
  await context.close();
  const noScript=await browser.newContext({javaScriptEnabled:false});
  const fallback=await noScript.newPage();await fallback.goto(base);
  assert.equal(await fallback.locator('.site-header').evaluate(e=>getComputedStyle(e).position),'relative');
  assert.ok(await fallback.evaluate(()=>document.querySelector('.noscript-nav').getBoundingClientRect().top>=document.querySelector('.site-header').getBoundingClientRect().bottom));
  await noScript.close();
 }finally{await browser.close();}
}
