import {chromium,webkit} from 'playwright';
import {readFileSync,mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
const base=process.env.PREVIEW_URL||'http://100.125.41.28:18789';
mkdirSync('.omo/evidence/header-logo',{recursive:true});
for(const engine of [chromium,webkit]){
 const browser=await engine.launch(engine===chromium?{executablePath:process.env.CHROMIUM_EXECUTABLE||'/home/ubuntu/.cache/ms-playwright/chromium-1248/chrome-linux-arm64/chrome'}:{});
 try{
  // The previous picture fails when both external logo requests fail, despite its JS fallback.
  const before=await browser.newPage();await before.route('**/assets/logo-header*',route=>route.abort());
  await before.route('**/header-logo-before.html',route=>route.fulfill({contentType:'text/html',body:readFileSync('site/index.html','utf8')}));
  await before.goto(`${base}/header-logo-before.html`);await before.waitForFunction(()=>document.querySelector('.brand__logo').complete);
  assert.equal(await before.locator('.brand__logo').evaluate(img=>img.naturalWidth),0);await before.close();
  for(const javaScriptEnabled of [true,false]){
   const context=await browser.newContext({javaScriptEnabled,viewport:{width:390,height:844},reducedMotion:'reduce'});
   try{
    let requests=0;await context.route('**/assets/logo-header*',route=>{requests++;return route.abort();});
    const page=await context.newPage();
    for(const route of ['/','/ferramentas/indicativos.html','/simulados/classe-c.html']){
     await page.goto(`${base}${route}`);
     for(let reload=0;reload<3;reload++){
      if(reload)await page.reload();
      const logo=await page.locator('.brand__logo').evaluate(img=>({complete:img.complete,width:img.naturalWidth,src:img.currentSrc,height:img.getBoundingClientRect().height}));
      assert(logo.complete&&logo.width===126);assert(logo.src.startsWith('data:image/jpeg;base64,'));assert.equal(logo.height,42);
     }
     assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    }
    assert.equal(requests,0,'logo não deve depender de nenhum pedido separado');
    if(javaScriptEnabled)await page.locator('.site-header').screenshot({path:`.omo/evidence/header-logo/${engine.name()}.png`});
   }finally{await context.close();}
  }
  console.log(`PASS ${engine.name()}: falha anterior simulada; três rotas, primeiro acesso/reloads, imagens bloqueadas e JavaScript desligado.`);
 }finally{await browser.close();}
}
