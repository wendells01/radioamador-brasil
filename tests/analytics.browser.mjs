// Simulate the first-party SDK. This test sends no events to Vercel.
import {chromium,webkit} from 'playwright';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const loader=readFileSync(new URL('../site/assets/js/analytics.js',import.meta.url),'utf8');
for(const engine of [chromium,webkit]){
 const browser=await engine.launch(engine===chromium&&process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{});
 try{
  for(const scenario of [
   {url:'https://www.radioamadorbrasil.site/ferramentas/locator.html?lat=-23#coordinates',expected:1},
   {url:'https://radioamadorbrasil.site/simulados/classe-c.html',expected:1},
   {url:'http://100.125.41.28:18789/',expected:0},
   {url:'https://example.vercel.app/',expected:0},
   {url:'https://www.radioamadorbrasil.site/',dnt:true,expected:0},
   {url:'https://www.radioamadorbrasil.site/',gpc:true,expected:0},
   {url:'https://www.radioamadorbrasil.site/',blocked:true,expected:1}
  ]){
   const page=await browser.newPage(),requests=[],errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   await page.addInitScript(({dnt,gpc})=>{
    if(dnt)Object.defineProperty(navigator,'doNotTrack',{value:'1'});
    if(gpc)Object.defineProperty(navigator,'globalPrivacyControl',{value:true});
   },scenario);
   await page.route('**/*',route=>{
    if(route.request().url().endsWith('/_vercel/insights/script.js')){
     requests.push(route.request().url());
     return scenario.blocked?route.abort():route.fulfill({contentType:'application/javascript',body:'window.mockAnalyticsLoaded=true;'});
    }
    return route.fulfill({contentType:'text/html',body:`<html><head></head><body><button id="action">Usar ferramenta</button><script>${loader}</script></body></html>`});
   });
   await page.goto(scenario.url,{waitUntil:'load'});
   assert.equal(requests.length,scenario.expected);
   await page.locator('#action').click();
   if(scenario.expected&&!scenario.blocked){
    assert.ok(await page.evaluate(()=>window.mockAnalyticsLoaded));
    const event=await page.evaluate(()=>{
     const callback=window.vaq.find(args=>args[0]==='beforeSend')[1];
     return callback({type:'pageview',url:location.href,referrer:'https://example.com/entry?private=value#token'});
    });
    assert.equal(new URL(event.url).search,'');assert.equal(new URL(event.url).hash,'');
    assert.equal(event.referrer,'https://example.com/entry');
    await page.addScriptTag({content:loader});
    assert.equal(requests.length,1,'sem segundo carregamento ou contagem duplicada');
   }
   assert.deepEqual(errors,[]);
   await page.close();
  }
  console.log(`${engine.name()}: produção, simulados, prévia, DNT/GPC, limpeza de URLs e coletor bloqueado OK`);
 }finally{await browser.close();}
}
