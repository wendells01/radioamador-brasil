// Verificação opcional: requer Playwright disponível no ambiente, sem dependência de produção.
// Sirva site/ e defina BASE_URL. CHROMIUM_EXECUTABLE permite usar um navegador já instalado.
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
import {spawn} from 'node:child_process';
const server=process.env.BASE_URL?null:spawn('python3',['-m','http.server','18788','--bind','127.0.0.1','--directory','site'],{stdio:'ignore'});
process.on('exit',()=>server?.kill());
const base=process.env.BASE_URL || 'http://127.0.0.1:18788';
if(server){for(let attempt=0;attempt<50;attempt++){try{await fetch(base);break;}catch{await new Promise(r=>setTimeout(r,100));}}}
const engines=process.env.BROWSER==='webkit'?[['WebKit',webkit]]:[['Chromium',chromium],['WebKit',webkit]];
const routes=['coaxiais','faixas','emergencias','flowerpot','chokes','exposicao-rf'];
for(const [name,engine] of engines){
 const browser=await engine.launch({headless:true,...(name==='Chromium'&&process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
 try{
 for(const width of [320,390,768,1440]){
  const context=await browser.newContext({viewport:{width,height:900},...(width<500?{isMobile:true,hasTouch:true}:{})});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  for(const route of routes){
   await page.goto(`${base}/ferramentas/${route}.html`);await page.waitForLoadState('networkidle');
   assert.equal(await page.locator('h1').count(),1);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${name} ${width}: overflow ${route}`);
   // Todos os controles recebem nome acessível por label ou texto de botão.
   assert.equal(await page.locator('main input:not([type=checkbox]),main select').evaluateAll(els=>els.every(el=>el.labels?.length>0)),true);
   assert.equal(await page.evaluate(()=>{const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);return new Set(ids).size===ids.length;}),true);
   if(route==='coaxiais'){
    assert.equal(await page.locator('#coax-result').getAttribute('data-state'),'valid');
    assert.equal(await page.locator('#compare-result').getAttribute('data-state'),'valid');
    await page.locator('#frequency').fill('10000');assert.equal(await page.locator('#coax-result').getAttribute('data-state'),'error');
    await page.locator('#frequency').fill('146');await page.locator('#length').fill('0');await page.locator('#additional').fill('3,010299956639812');
    assert.match(await page.locator('#coax-result').innerText(),/50 W/);
    await page.locator('#additional').fill('0');await page.locator('#length').fill('20');
    for(const el of await page.locator('#compare-choices input').all())await el.uncheck();
    assert.match(await page.locator('#compare-result').innerText(),/pelo menos dois/);
    await page.locator('#cable').focus();assert.equal(await page.locator('#cable').evaluate(el=>el===document.activeElement),true);
   } else if(route==='faixas'){
    await page.locator('#band-query').fill('146');assert.match(await page.locator('#bands').innerText(),/2 m/);
    await page.locator('#operator').selectOption('C');await page.locator('#band-query').fill('20 m');assert.match(await page.locator('#bands').innerText(),/Nenhuma/);
   } else if(route==='emergencias'){
    await page.locator('#em-query').fill('DSC');assert.match(await page.locator('#em-results').innerText(),/156,525/);
    await page.locator('#em-query').fill('inexistente');assert.match(await page.locator('#em-results').innerText(),/Nenhuma/);
   } else if(route==='flowerpot'){
    assert.match(await page.locator('#flower-result').innerText(),/457 mm/);await page.locator('#flower-model').selectOption('dual');assert.match(await page.locator('#flower-result').innerText(),/235 mm/);
    await page.locator('#flower-frequency').fill('145');assert.equal(await page.locator('#flower-result').getAttribute('data-state'),'error');
   } else if(route==='chokes'){
    assert.equal(await page.locator('#choke-result').getAttribute('data-state'),'valid');await page.locator('#former').fill('25');assert.match(await page.locator('#choke-result').innerText(),/inferior ao mínimo/);
    await page.locator('#choke-type').selectOption('ferrite');assert.equal(await page.locator('#air-fields').isVisible(),false);assert.equal(await page.locator('#choke-result').getAttribute('data-state'),'valid');
   } else {
    assert.match(await page.locator('#rf-result').innerText(),/164,06 W/);await page.locator('#rf-basis').selectOption('ERP');assert.equal(await page.locator('#rf-line-fields').isVisible(),false);
    await page.locator('#rf-frequency').fill('0,137');assert.equal(await page.locator('#rf-result').getAttribute('data-state'),'error');
   }
  }
  assert.deepEqual(errors,[]);await context.close();console.log(`${name} ${width}px: seis páginas, interações, rótulos, overflow e carregamento OK`);
 }
 }finally{await browser.close();}
}

server?.kill();
