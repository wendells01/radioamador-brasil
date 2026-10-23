// Run with site/ or dist/ served at BASE_URL. No production browser dependency.
import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {coaxLoss,compareCables,CABLES} from '../site/assets/js/tecnica/coaxiais.js';
import {fmt} from '../site/assets/js/tecnica/ui.js';
const base=process.env.BASE_URL||'http://127.0.0.1:18790';
await mkdir('.omo/evidence/coax-design',{recursive:true});
for(const engine of [chromium,webkit]){
 const browser=await engine.launch(engine===chromium&&process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{});
 try{
  const page=await browser.newPage({reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const width of [320,375,390,430,768,1440]){
   await page.setViewportSize({width,height:900});
   await page.goto(`${base}/ferramentas/coaxiais.html`);
   await page.locator('#cable').selectOption('8259');
   for(const [id,value] of [['frequency','435'],['length','8'],['power','25'],['additional','0']])await page.locator(`#${id}`).fill(value);
   const expected=coaxLoss('8259',435,8,25);
   assert.equal(await page.locator('.coax-flow__end--antenna strong').innerText(),`${fmt(expected.output)} W`);
   assert.match(await page.locator('.coax-flow__link').innerText(),new RegExp(fmt(expected.totalDb).replace('.', '\\.')));
   for(const checkbox of await page.locator('#compare-choices input').all())await checkbox.check();
   assert.equal(await page.locator('.coax-compare').count(),CABLES.length);
   assert.match(await page.locator('.coax-compare--selected h3').innerText(),/8259/);
   const ordered=compareCables(CABLES.map(c=>c.id),435,8,25).map(r=>CABLES.find(c=>c.id===r.id).model);
   assert.deepEqual(await page.locator('.coax-compare h3').allTextContents(),ordered);
   const details=page.locator('.coax-compare details').first();
   await details.locator('summary').focus();await page.keyboard.press('Enter');
   assert.ok(await details.locator('dl').isVisible());
   await page.locator('#baseline').selectOption('lmr600');
   assert.equal(await page.locator('#compare-result').getAttribute('data-state'),'valid');
   // Preserved error handling, including comparator selection constraints.
   await page.locator('#frequency').fill('10000');assert.equal(await page.locator('#coax-result').getAttribute('data-state'),'error');
   await page.locator('#frequency').fill('435');
   for(const el of await page.locator('#compare-choices input').all())await el.uncheck();
   assert.match(await page.locator('#compare-result').innerText(),/pelo menos dois/);
   for(const id of ['8259','lmr400','lmr600'])await page.locator(`#compare-choices input[value="${id}"]`).check();
   const overflow=()=>page.evaluate(()=>({page:document.documentElement.scrollWidth>innerWidth,boxes:[...document.querySelectorAll('.coax-summary *, .coax-details *, .coax-compare *')].filter(e=>e.getClientRects().length&&e.clientWidth&&e.scrollWidth>e.clientWidth+1).map(e=>e.className||e.tagName)}));
   assert.deepEqual(await overflow(),{page:false,boxes:[]},`${engine.name()} ${width}`);
   if([390,1440].includes(width)){
    await page.locator('.coax-summary').scrollIntoViewIfNeeded();
    await page.screenshot({path:`.omo/evidence/coax-design/${engine.name()}-${width}-result.png`});
    await page.locator('.coax-compare').first().evaluate(el=>window.scrollTo({top:el.getBoundingClientRect().top+scrollY-80,behavior:'instant'}));
    await page.screenshot({path:`.omo/evidence/coax-design/${engine.name()}-${width}-compare.png`});
   }
   await page.locator('#power').fill('10000000');await page.locator('#length').fill('100000');
   assert.equal(await page.locator('#coax-result').getAttribute('data-state'),'valid');
   assert.deepEqual(await overflow(),{page:false,boxes:[]},`${engine.name()} ${width} extremos`);
   console.log(`${engine.name()} ${width}: resultado, comparação, dados, teclado, erros e overflow OK`);
  }
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
}
