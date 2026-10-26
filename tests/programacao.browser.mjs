import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
for(const kind of [chromium,webkit]){
 const browser=await kind.launch({headless:true,...(kind===chromium?{executablePath:'/home/ubuntu/.cache/ms-playwright/chromium-1248/chrome-linux-arm64/chrome'}:{})});
 for(const width of [320,390,768,1440]){
  const page=await browser.newPage({viewport:{width,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${process.env.PREVIEW_URL || 'http://100.125.41.28:18789'}/downloads.html`);
  await assert.equal(await page.locator('[data-program-profile]:visible tbody tr:visible').count(),26);
  await page.locator('#channel-query').fill('467,5625');await assert.equal(await page.locator('[data-program-profile]:visible tbody tr:visible').count(),1);
  await page.locator('#channel-profile').selectOption('bf777');await assert.equal(await page.locator('[data-program-profile]:visible tbody tr:visible').count(),16);
  await page.locator('#channel-query').fill('zzzz');await assert.equal(await page.locator('#channel-empty').isVisible(),true);
  await page.locator('#channel-reset').click();await assert.equal(await page.locator('[data-program-profile]:visible tbody tr:visible').count(),16);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${kind.name()} ${width}`);
  assert.deepEqual(errors,[]);
  if(width===390&&kind===chromium)await page.screenshot({path:'/tmp/programacao-mobile.png',fullPage:true});
  await page.close();
 }
 const page=await browser.newPage({javaScriptEnabled:false});await page.goto(`${process.env.PREVIEW_URL || 'http://100.125.41.28:18789'}/downloads.html`);assert.equal(await page.locator('tbody tr').count(),64);await browser.close();
}
console.log('PASS: Chromium + WebKit, 4 larguras, filtros, sem JavaScript, sem overflow ou erros JS.');
