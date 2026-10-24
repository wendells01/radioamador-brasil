import {chromium,webkit} from 'playwright';import assert from 'node:assert/strict';
const base=process.env.BASE_URL||'http://100.125.41.28:18789';
const hash=page=>page.evaluate(()=>window.heroDraws);
async function settle(page){
 let last=-1,stable=0;
 for(let i=0;i<30;i++){
  const count=await hash(page);stable=count===last?stable+1:0;last=count;
  if(stable>=3)return;
  await page.waitForTimeout(100);
 }
 throw new Error('Canvas continued rendering while paused');
}
for(const engine of [chromium,webkit].filter(engine=>!process.env.BROWSER||process.env.BROWSER===engine.name())){
 const browser=await engine.launch(engine===chromium&&process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{});
 try{
  let page;const errors=[];
  for(const width of (process.env.WIDTHS?process.env.WIDTHS.split(',').map(Number):[320,375,390,430,768,1440])){
   if(page)await page.close();
   page=await browser.newPage({deviceScaleFactor:width<860?3:2,reducedMotion:'no-preference'});
   page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(()=>{
    window.heroDraws=0;const request=window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame=callback=>request(time=>{
     if(callback.name==='step')window.heroDraws++;
     callback(time);
    });
   });
   await page.setViewportSize({width,height:900});await page.goto(base,{waitUntil:'domcontentloaded'});await page.waitForSelector('[data-radio-ready]');await page.evaluate(()=>document.fonts.ready);await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.bringToFront();
   const a=await hash(page);await page.waitForFunction(n=>window.heroDraws>n+3,a,{timeout:5000});
   assert.ok(await page.locator('canvas').evaluate(e=>e.width/e.clientWidth<=1.51));
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   if(width<860){
    const painted=await page.evaluate(()=>{
     const canvas=document.querySelector('canvas'),a=document.querySelector('.hero__actions').getBoundingClientRect(),r=canvas.getBoundingClientRect(),dpr=canvas.width/r.width;
     const data=canvas.getContext('2d').getImageData(0,Math.ceil((a.top-r.top)*dpr),canvas.width,Math.max(1,Math.floor(a.height*dpr))).data;
     let count=0;for(let i=3;i<data.length;i+=4)if(data[i]>0)count++;return count;
    });
    assert.equal(painted,0,'no artwork behind the mobile buttons');
   }

   await page.emulateMedia({reducedMotion:'reduce'});await settle(page);
   const b=await hash(page);await page.waitForTimeout(200);assert.ok((await hash(page))<=b+1,'reduced motion: at most one previously queued callback finishes');
   await page.emulateMedia({reducedMotion:'no-preference'});
   await page.evaluate(()=>window.scrollTo({top:document.body.scrollHeight,behavior:'instant'}));await settle(page);
   const c=await hash(page);await page.waitForTimeout(200);assert.ok((await hash(page))<=c+1,'offscreen: at most one previously queued callback finishes');
   await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(200);
   const d=await hash(page);await page.waitForFunction(n=>window.heroDraws>n+3,d,{timeout:5000});
   await page.locator('.nav-toggle').click();assert.ok(await page.locator('#site-menu').isVisible());await page.keyboard.press('Escape');await page.locator('#site-menu').waitFor({state:'hidden'});
   console.log(`${engine.name()} ${width}: movement, reduced motion, pause/resume, DPR, layout and menu OK`);
  }
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
  const hidden=await hash(page);await page.waitForTimeout(200);assert.ok((await hash(page))<=hidden+1,'hidden document: at most one previously queued callback finishes');
  assert.deepEqual(errors,[]);
  const fallback=await browser.newPage();await fallback.addInitScript(()=>{HTMLCanvasElement.prototype.getContext=()=>null;});
  await fallback.goto(base,{waitUntil:'domcontentloaded'});assert.ok(await fallback.locator('.hero__rings').isVisible());
 }finally{await browser.close();}
}
