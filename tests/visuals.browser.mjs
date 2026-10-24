import {chromium,webkit} from 'playwright';import assert from 'node:assert/strict';import {mkdir} from 'node:fs/promises';
const base=process.env.BASE_URL||'http://127.0.0.1:18787';
const pages=['/','/ferramentas.html','/aprendizado/ht.html','/referencia.html','/ferramentas/antenas.html','/ferramentas/locator.html','/ferramentas/coaxiais.html','/ferramentas/faixas.html','/ferramentas/chokes.html','/ferramentas/flowerpot.html','/ferramentas/morse.html'];
await mkdir('.omo/evidence/visual-upgrade',{recursive:true});
for(const engine of [chromium,webkit]){
 const browser=await engine.launch(engine===chromium&&process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{});
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
  for(const width of [320,375,390,430,768,1440]){
   await page.setViewportSize({width,height:900});
   for(const url of pages){
    await page.goto(base+url,{waitUntil:'domcontentloaded'});
    await page.waitForSelector('.site-menu__group-title .ui-icon',{state:'attached'});
    if(url==='/')assert.equal(await page.locator('.card-art').count(),3);
    if(url.includes('ht.html'))assert.equal(await page.locator('.visual-figure').count(),3);
    if(url.includes('antenas.html')){
     await page.locator('#antena-freq').fill('14,2');await page.locator('#antena-form button').click();
     assert.match(await page.locator('#antena-result').innerText(),/5,035 m/);
     await page.locator('#antena-freq').fill('0');await page.locator('#antena-form button').click();assert.equal(await page.locator('#antena-result .visual-figure').count(),0);
    }
    if(url.includes('locator.html')){
     await page.locator('#coordinates-form button').click();assert.match(await page.locator('#coordinates-result').innerText(),/GG66qk/);
     await page.locator('#route-form button').click();assert.equal(await page.locator('#route-result .visual-figure').count(),1);
    }
    if(url.includes('coaxiais.html')){
     await page.waitForSelector('.loss-chart');const before=await page.locator('.loss-chart figcaption').innerText();
     await page.locator('#length').fill('10');await page.locator('#length').dispatchEvent('input');assert.notEqual(await page.locator('.loss-chart figcaption').innerText(),before);
     await page.locator('#frequency').fill('invalid');await page.locator('#frequency').dispatchEvent('input');assert.equal(await page.locator('.loss-chart').count(),0);
    }
    if(url.includes('faixas.html')){
     assert.match(await page.locator('#band-count').innerText(),/34 segmentos/);
     await page.locator('[data-region="VHF"]').click();assert.equal(await page.locator('#region').inputValue(),'VHF');
     assert.equal(await page.locator('[data-region="VHF"]').getAttribute('aria-pressed'),'true');
     await page.keyboard.press('Enter');assert.equal(await page.locator('#region').inputValue(),'');
     await page.locator('#band-query').fill('40m');assert.match(await page.locator('#band-count').innerText(),/2 segmentos/);
    }
    if(url.includes('chokes.html')){
     await page.waitForSelector('#choke-result .visual-figure');await page.locator('#choke-type').selectOption('ferrite');
     await page.locator('#choke-frequency').fill('146');await page.locator('#choke-frequency').dispatchEvent('input');assert.match(await page.locator('#choke-result').innerText(),/Ferrites sobre o cabo/);
    }
    if(url.includes('flowerpot.html')){await page.waitForSelector('#flower-result .visual-figure');assert.match(await page.locator('#flower-result').innerText(),/457 mm/);}
    if(url.includes('morse.html')){
     await page.waitForSelector('.rhythm-beat');assert.equal(await page.locator('.rhythm-beat--tone').count(),9);
     await page.locator('#morse-wpm').fill('20');await page.locator('#morse-wpm').dispatchEvent('change');assert.match(await page.locator('.rhythm-meta').innerText(),/0,06 s/);
     await page.locator('#morse-input').fill('@');assert.equal(await page.locator('.rhythm-beat').count(),0);
    }
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${engine.name()} ${width} ${url}: overflow`);
    if(width===390&&['/','/aprendizado/ht.html','/referencia.html'].includes(url)){
     const target=url==='/'?page.locator('.home-highlights'):url.includes('ht.html')?page.locator('[data-drawing="ht"]'):page.locator('[data-drawing="wave"]');
     await target.screenshot({path:`.omo/evidence/visual-upgrade/${engine.name()}-${url==='/'?'home':url.includes('ht.html')?'ht':'reference'}.png`});
    }
   }
   console.log(`${engine.name()} ${width}: ${pages.length} páginas, diagramas, filtros e cálculos OK`);
  }
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
}
