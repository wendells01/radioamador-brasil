import {chromium,webkit} from 'playwright';import assert from 'node:assert/strict';import {mkdir} from 'node:fs/promises';
const base=process.env.PREVIEW_URL||'http://100.125.41.28:18789';await mkdir('.omo/evidence/indicativos',{recursive:true});
for(const engine of [chromium,webkit]){
 const browser=await engine.launch(engine===chromium?{executablePath:process.env.CHROMIUM_EXECUTABLE||'/home/ubuntu/.cache/ms-playwright/chromium-1248/chrome-linux-arm64/chrome'}:{});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${base}/ferramentas/indicativos.html`);await page.waitForFunction(()=>document.getElementById('lookup-calls').textContent!=='—');
  for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
  await page.setViewportSize({width:390,height:844});if(engine===chromium)await page.screenshot({path:'.omo/evidence/indicativos/home.png',fullPage:true});
  await page.locator('#lookup-call').fill('pu2tsl');await page.locator('#lookup-submit').click();await page.locator('#lookup-result:visible').waitFor();
  assert((await page.locator('#lookup-result-heading').textContent()).startsWith('PU2TSL'));assert.equal(await page.locator('.lookup-station').count(),2);assert.equal(await page.locator('#lookup-call').inputValue(),'PU2TSL');assert((await page.locator('#lookup-results').textContent()).includes('Classe C'));
  for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${engine.name()} ${width} results`);}
  await page.setViewportSize({width:390,height:844});if(engine===chromium)await page.locator('#lookup-result').screenshot({path:'.omo/evidence/indicativos/result.png'});
  await page.locator('#lookup-call').fill('ZZ9ABCDEF');await page.locator('#lookup-submit').click();await page.waitForFunction(()=>document.getElementById('lookup-result-heading').textContent.includes('não foi encontrado'));assert((await page.locator('#lookup-result-summary').textContent()).includes('não comprova disponibilidade'));
  await page.locator('#lookup-call').fill('../bad');await page.locator('#lookup-submit').click();assert.equal(await page.locator('#lookup-call').getAttribute('aria-invalid'),'true');
  await page.locator('#lookup-clear').click();assert.equal(await page.locator('#lookup-result').isVisible(),false);assert.equal(await page.locator('#lookup-call').inputValue(),'');
  await page.route('**/assets/data/indicativos/manifest.json',route=>route.fulfill({status:503,body:'unavailable'}));await page.locator('#lookup-call').fill('PU2TSL');await page.locator('#lookup-submit').click();await page.locator('#lookup-status[data-state="error"]').waitFor();assert.equal(await page.locator('#lookup-result').isVisible(),false);assert.equal(await page.locator('#lookup-submit').isEnabled(),true);await page.unroute('**/assets/data/indicativos/manifest.json');
  await page.locator('[data-menu-open]').click();assert.equal(await page.locator('#site-menu [aria-current="page"]').count(),1);await page.keyboard.press('Escape');
  assert.deepEqual(errors,[]);await page.close();
  const offline=await browser.newPage({javaScriptEnabled:false});await offline.goto(`${base}/ferramentas/indicativos.html`);assert(await offline.locator('main noscript p').isVisible());await offline.close();
  console.log(`PASS ${engine.name()}: base real, duas estações, entrada, ausência, erro de rede, quatro larguras, menu e sem JavaScript.`);
 }finally{await browser.close();}
}
