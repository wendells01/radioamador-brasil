import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
const base=process.env.BASE_URL||'http://127.0.0.1:18790';
for(const engine of [chromium,webkit]){
 const browser=await engine.launch(engine===chromium&&process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{});
 try{
  const page=await browser.newPage({viewport:{width:320,height:800}});
  await page.addInitScript(()=>{
   window.geoCalls=0;window.geoMode='success';
   Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition(success,error,options){
    window.geoCalls++;window.geoOptions=options;
    window.completeGeo=()=>window.geoMode==='success'?success({coords:{latitude:-23.550512345678,longitude:-46.633312345678,accuracy:24.2}}):error({code:Number(window.geoMode)});
   }}});
  });
  await page.goto(`${base}/ferramentas/locator.html`);
  const button=page.locator('#use-location'),status=page.locator('#location-status');
  await button.waitFor({state:'visible'});
  assert.equal(await page.evaluate(()=>window.geoCalls),0);
  await button.focus();await page.keyboard.press('Enter');
  assert.equal(await button.isDisabled(),true);
  assert.deepEqual(await page.evaluate(()=>window.geoOptions),{enableHighAccuracy:true,timeout:15000,maximumAge:0});
  await page.evaluate(()=>window.completeGeo());
  assert.equal(await page.locator('#latitude').inputValue(),'-23.550512345678');
  assert.equal(await page.locator('#longitude').inputValue(),'-46.633312345678');
  assert.equal(await page.locator('.locator-code').innerText(),'GG66qk');
  assert.match(await status.innerText(),/25 m/);
  for(const code of [1,2,3,99]){
   await page.evaluate(code=>window.geoMode=String(code),code);
   await button.click();await page.evaluate(()=>window.completeGeo());
   assert.match(await status.innerText(),/manualmente/);
   assert.equal(await button.isDisabled(),false);
   assert.equal(await page.locator('#latitude').inputValue(),'-23.550512345678');
  }
  await page.evaluate(()=>window.geoMode='success');await button.click();
  await page.locator('#latitude').fill('0');await page.evaluate(()=>window.completeGeo());
  assert.equal(await page.locator('#latitude').inputValue(),'0');assert.match(await status.innerText(),/valores foram mantidos/);
  await page.evaluate(()=>Object.defineProperty(window,'isSecureContext',{value:false,configurable:true}));
  const before=await page.evaluate(()=>window.geoCalls);await button.click();assert.match(await status.innerText(),/HTTPS/);
  assert.equal(await page.evaluate(()=>window.geoCalls),before);
  await page.locator('#coordinates-form button').click();assert.equal(await page.locator('#coordinates-result').getAttribute('data-state'),'valid');
  await page.evaluate(()=>{Object.defineProperty(window,'isSecureContext',{value:true,configurable:true});Object.defineProperty(navigator,'geolocation',{value:undefined,configurable:true});});
  await button.click();assert.match(await status.innerText(),/não oferece localização/);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  console.log(`${engine.name()}: geolocalização por teclado, precisão, erros, edições, HTTP e entrada manual OK`);
 }finally{await browser.close();}
}
