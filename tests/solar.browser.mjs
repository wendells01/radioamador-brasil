// Requer Playwright no ambiente. Servir site/ antes de executar.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
const base=process.env.BASE_URL || 'http://127.0.0.1:18787';
const fixture=JSON.parse(readFileSync(new URL('./fixtures/solar.json',import.meta.url),'utf8'));
for(const [name,engine] of [['Chromium',chromium],['WebKit',webkit]]){
 const browser=await engine.launch({headless:true,...(name==='Chromium'&&process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
 try{
  for(const width of [320,390,768,1440]){
   const page=await browser.newPage({viewport:{width,height:900}});
   const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
   await page.goto(base);await page.waitForFunction(()=>['loaded','stale'].includes(document.querySelector('[data-solar-panel]').dataset.solarState));
   assert.equal(await page.locator('.solar-dashboard__table tbody tr').count(),4);
   assert.equal(await page.locator('.solar-dashboard__metric').count(),6);
   assert.match(await page.locator('[data-solar-content]').innerText(),/Condições estimadas de propagação em HF/);
   assert.match(await page.locator('[data-solar-content]').innerText(),/horário de Brasília/);
   assert.equal(requests.some(url=>/hamqsl\.com/.test(url)),false,'nenhum acesso ao HamQSL pelo visitante');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${name} overflow ${width}`);
   await page.locator('[data-solar-panel]').scrollIntoViewIfNeeded();
   if(name==='WebKit'&&width===390)await page.locator('[data-solar-panel]').screenshot({path:'/tmp/radio-fontes/solar-ptbr-mobile.png'});
   await page.route('**/assets/data/solar.json',route=>route.fulfill({status:503,body:'offline'}));
   await page.reload();await page.waitForFunction(()=>document.querySelector('[data-solar-panel]').dataset.solarState==='unavailable');
   assert.equal(await page.locator('[data-solar-content]').isVisible(),false);
   assert.equal(await page.locator('[data-solar-retry]').isVisible(),true);
   await page.unroute('**/assets/data/solar.json');
   await page.route('**/assets/data/solar.json',route=>route.fulfill({json:{...fixture,updatedAt:'2020-01-01T00:00:00Z'}}));
   await page.locator('[data-solar-retry]').click();await page.waitForFunction(()=>document.querySelector('[data-solar-panel]').dataset.solarState==='stale');
   assert.match(await page.locator('[data-solar-status]').innerText(),/mais de 6 horas/);
   assert.equal(await page.locator('[data-solar-content]').isVisible(),true);
   // Falha ao reler mantém a última informação, com aviso.
   await page.unroute('**/assets/data/solar.json');await page.route('**/assets/data/solar.json',route=>route.fulfill({status:200,contentType:'application/json',body:'{"version":999}'}));
   await page.locator('[data-solar-retry]').click();await page.waitForFunction(()=>document.querySelector('[data-solar-panel]').dataset.solarState==='unavailable');
   assert.equal(await page.locator('[data-solar-content]').isVisible(),true);
   assert.match(await page.locator('[data-solar-status]').innerText(),/última leitura/);
   assert.deepEqual(errors,[]);await page.close();console.log(`${name} ${width}px: dados reais, pt-BR, layout, indisponibilidade, retry e dados antigos OK`);
  }
 }finally{await browser.close();}
}
