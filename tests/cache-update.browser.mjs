// Local-only cache/update QA. WebKit on Linux is not Safari on a physical iPhone.
// CHROMIUM_EXECUTABLE=/path/to/chrome node tests/cache-update.browser.mjs
import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {mkdtempSync,cpSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {buildSite} from '../scripts/build-site.mjs';
import {publicationServer} from './helpers/publication-server.mjs';

const temp=mkdtempSync(path.join(tmpdir(),'radio-cache-'));
const source=path.join(temp,'site'),output=path.join(temp,'dist');
cpSync('site',source,{recursive:true});
const git=(...args)=>execFileSync('git',['-C',temp,...args],{stdio:'pipe'});
const commit=()=>{git('add','site');git('-c','user.name=Cache Test','-c','user.email=cache@example.invalid','commit','--allow-empty','-m','fixture');};
git('init');commit();
const build=()=>buildSite({source,output,repository:temp});
const cssPath=path.join(source,'assets/styles.css');
const originalCSS=readFileSync(cssPath,'utf8');
let served=source,poison=true;
const server=await publicationServer(()=>served,{poisonCSS:()=>poison});
try{
 for(const engine of [chromium,webkit]){
  writeFileSync(cssPath,originalCSS);commit();
  served=source;poison=true;
  const browser=await engine.launch(engine===chromium&&process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{});
  try{
   const profile=path.join(temp,`${engine.name()}-profile`);
   // Persistent (normal-like) context uses a disk profile; separate context is ephemeral.
   const context=await engine.launchPersistentContext(profile,{headless:true,viewport:{width:390,height:844},reducedMotion:'reduce',...(engine===chromium&&process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
   try{
    const page=await context.newPage();
    await page.goto(server.url);
    assert.equal(await page.evaluate(()=>document.styleSheets[0].cssRules.length),0);
    poison=false;
    await page.reload();
    // The unchanged URL + retained validator reproduces an unstyled normal session.
    assert.equal(await page.evaluate(()=>document.styleSheets[0].cssRules.length),0);
    assert.ok(server.requests.some(r=>r.path==='/assets/styles.css'&&r.status===304));
    const fresh=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
    const clean=await fresh.newPage();await clean.goto(server.url);
    assert.equal(await clean.evaluate(()=>getComputedStyle(document.body).backgroundColor),'rgb(8, 17, 31)');
    await fresh.close();
    const a=build();served=output;
    await page.goto(server.url);
    assert.equal(await page.evaluate(()=>getComputedStyle(document.body).backgroundColor),'rgb(8, 17, 31)');
    await page.reload();
    assert.equal(await page.evaluate(()=>getComputedStyle(document.body).backgroundColor),'rgb(8, 17, 31)');
    assert.ok(await page.locator('.brand__logo').evaluate(e=>e.getBoundingClientRect().height<=42));
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    const sheets=await page.locator('link[rel="stylesheet"]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')));
    assert.ok(sheets.every(url=>url.includes(`/assets/releases/${a.release}/`)));
    // Open an A tab with a lazy audio import, then generate and serve B from scratch.
    const oldTab=await context.newPage();await oldTab.goto(`${server.url}/ferramentas/morse.html`);
    writeFileSync(cssPath,originalCSS+'\n:root { --cache-test-release: updated; }\n');
    const audioPath=path.join(source,'assets/js/morse-audio.js');
    writeFileSync(audioPath,readFileSync(audioPath,'utf8')+'\n// cache update regression\n');commit();
    rmSync(output,{recursive:true});const b=build();assert.notEqual(a.release,b.release);
    // Actual lazy import resolves the older release even after the new deployment.
    assert.equal(await oldTab.evaluate(async url=>typeof (await import(url)).createPlayer,a.assets['/assets/js/morse-audio.js']),'function');
    await page.reload();
    assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--cache-test-release').trim()),'updated');
    const toggle=page.locator('.nav-toggle');await toggle.click();
    assert.ok(await page.locator('#site-menu').evaluate(e=>e.open));await page.keyboard.press('Escape');
    assert.equal(await toggle.getAttribute('aria-expanded'),'false');
    await page.goto(`${server.url}/ferramentas/faixas.html`);await page.locator('#band-query').fill('40m');
    assert.equal(await page.locator('.band-card').count(),2);
    for(const [original,url] of Object.entries(b.assets)){
     const result=await fetch(server.url+url);
     assert.equal(result.status,200,url);
     assert.match(result.headers.get('cache-control'),/max-age=31536000, immutable/);
     assert.match(result.headers.get('content-type'),original.endsWith('.css')?/^text\/css/:/javascript/);
     assert.deepEqual(Buffer.from(await result.arrayBuffer()),readFileSync(path.join(source,original)));
     const conditional=await fetch(server.url+url,{headers:{'If-None-Match':result.headers.get('etag')}});
     assert.equal(conditional.status,304);
    }
    assert.equal((await fetch(server.url+'/assets/releases/missing/styles.css')).status,404);
    const html=await fetch(server.url);assert.equal(html.headers.get('cache-control'),'public, no-cache');
    const workers=await page.evaluate(async()=>('serviceWorker' in navigator)?(await navigator.serviceWorker.getRegistrations()).length:0);
    assert.equal(workers,0);
    console.log(`${engine.name()}: persistent/ephemeral isolation, damaged-cache simulation, initial load, reload, A→B, lazy import A, MIME/ETag/304, 404, menu and filters OK`);
   }finally{await context.close();}
  }finally{await browser.close();}
 }
}finally{await server.close();rmSync(temp,{recursive:true,force:true});}
