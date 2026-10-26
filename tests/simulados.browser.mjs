import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const base=process.env.PREVIEW_URL||'http://100.125.41.28:18789';
await mkdir('.omo/evidence/simulados',{recursive:true});
const configs={c:{count:15,min:8,time:20,errors:'radioBrasilC2026Errors',history:'radioBrasilC2026History'},b:{count:20,min:11,time:30,errors:'monstroB_errors_v3',history:'monstroB_history_v3'},a:{count:30,min:16,time:40,errors:'radioBrasilA_errors_v1',history:'radioBrasilA_history_v1'}};
for(const engine of [chromium,webkit]){
 const browser=await engine.launch(engine===chromium?{executablePath:process.env.CHROMIUM_EXECUTABLE||'/home/ubuntu/.cache/ms-playwright/chromium-1248/chrome-linux-arm64/chrome'}:{});
 try{
  for(const [cls,config] of Object.entries(configs)){
   const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
   await page.goto(`${base}/simulados/classe-${cls}.html`);await page.waitForFunction(()=>!document.getElementById('start-exam').disabled);
   // Existing question IDs, duplicate aliases, and history survive the UI revision.
   const legacy=await page.evaluate(()=>{const groups=new Map();for(const q of BANK){const key=q.text.replace(/^(?:Situação de prova|Questão aplicada)\s*—\s*/i,'').toLowerCase();const group=groups.get(key)||[];group.push(q.id);groups.set(key,group);}return [...groups.values()].find(g=>g.length>1);});
   await page.evaluate(({config,legacy})=>{localStorage.setItem(config.errors,JSON.stringify(legacy));localStorage.setItem(config.history,JSON.stringify([{date:'25/10/2026',mode:'train',hits:7,total:15,pct:47}]));localStorage.setItem('unrelated-class-data','preserve');},{config,legacy});
   await page.reload();await page.waitForFunction(()=>!document.getElementById('start-exam').disabled);assert.equal(await page.locator('#error-count').textContent(),'1');
   await page.locator('#show-history').click();assert((await page.locator('#historyBody').textContent()).includes('7/15'));await page.locator('#history-back').click();
   for(const width of [320,390,768,1440]){
    await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${engine.name()} ${cls} ${width} home`);
   }
   await page.setViewportSize({width:390,height:844});
   if(engine===chromium)await page.screenshot({path:`.omo/evidence/simulados/${cls}-home.png`,fullPage:true});
   await page.locator('#start-errors').click();assert.equal(await page.locator('#num').textContent(),'1/1');
   await page.evaluate(()=>{const key=text=>text.replace(/^(?:Situação de prova|Questão aplicada)\s*—\s*/i,'').toLowerCase();const q=BANK.find(q=>key(q.text)===key(document.getElementById('qtext').textContent));document.getElementById(q.answer?'answer-true':'answer-false').click();document.getElementById('next').click();});
   assert.equal(await page.locator('#result').isVisible(),true);assert.deepEqual(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),config.errors),[]);await page.locator('#new-quiz').click();
   // Complete two rounds in the same subject: no statement may repeat.
   const rounds=[];
   for(let round=0;round<2;round++){
    await page.locator('[data-subject="Legislação"]').click();
    const texts=await page.evaluate(count=>{const texts=[];for(let i=0;i<count;i++){texts.push(document.getElementById('qtext').textContent);document.getElementById('answer-true').click();document.getElementById('next').click();}return texts;},config.count);rounds.push(texts);
    assert.equal(await page.locator('#resultTitle').textContent(),'Treino concluído.');await page.locator('#new-quiz').click();
   }
   assert.equal(new Set(rounds.flat()).size,config.count*2);
   // Resume an answered question without recounting it or dropping the answer.
   await page.locator('[data-subject="Técnica e Ética Operacional"]').click();await page.locator('#answer-true').click();
   const saved=await page.evaluate(cls=>({usage:localStorage.getItem(`radioBrasil${cls.toUpperCase()}Usage_v1`),question:document.getElementById('qtext').textContent}),cls);
   await page.reload();await page.locator('#resume-quiz').click();assert.equal(await page.locator('#qtext').textContent(),saved.question);assert.equal(await page.locator('#next').isVisible(),true);assert.equal(await page.evaluate(cls=>localStorage.getItem(`radioBrasil${cls.toUpperCase()}Usage_v1`),cls),saved.usage);await page.locator('#quit-quiz').click();
   // Full exam: all subjects must pass; answer key remains hidden until the end.
   page.once('dialog',d=>d.accept());await page.locator('#start-exam').click();
   assert.equal(await page.locator('#timer').textContent(),`${config.time}:00`);
   const outcome=await page.evaluate(({config})=>{const key=t=>t.replace(/^(?:Situação de prova|Questão aplicada)\s*—\s*/i,'').toLowerCase();const texts=[];let leaked=false;for(let i=0;i<config.count*3;i++){const text=document.getElementById('qtext').textContent,q=BANK.find(q=>key(q.text)===key(text));texts.push(text);const correct=i%config.count<config.min;document.getElementById((correct?q.answer:!q.answer)?'answer-true':'answer-false').click();leaked||=document.getElementById('feedback').textContent.includes('Gabarito:');document.getElementById('next').click();}return {texts,leaked};},{config});
   assert.equal(outcome.leaked,false);assert.equal(new Set(outcome.texts).size,config.count*3);assert.equal(await page.locator('#resultTitle').textContent(),'Meta atingida nas três matérias.');assert.equal(await page.locator('#answer-review details').count(),config.count*3);
   assert.equal(await page.evaluate(()=>localStorage.getItem('unrelated-class-data')),'preserve');
   assert.deepEqual(errors,[]);await page.close();
   // Background/timeout: even zero answers must produce failure and the full denominator.
   const timed=await browser.newPage();await timed.clock.install();await timed.goto(`${base}/simulados/classe-${cls}.html`);await timed.locator('#start-exam').click();
   for(let i=0;i<3;i++)await timed.clock.fastForward(config.time*60000+1000);
   assert.equal(await timed.locator('#resultTitle').textContent(),'Há matérias para reforçar.');assert((await timed.locator('#resultText').textContent()).includes(`${config.count*3} sem resposta`));assert.equal(await timed.locator('#breakdown article').count(),3);await timed.close();
   console.log(`PASS ${engine.name()} ${cls.toUpperCase()}: telas, duas rodadas sem repetição, aliases, histórico, retomada, prova completa e timeout.`);
  }
  const blocked=await browser.newPage();await blocked.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw Error('blocked');}}));await blocked.goto(`${base}/simulados/classe-c.html`);await blocked.locator('[data-subject="Legislação"]').click();await blocked.locator('#answer-true').click();assert.equal(await blocked.locator('#feedback').isVisible(),true);assert.equal(await blocked.locator('#storage-note').isVisible(),true);await blocked.close();
 }finally{await browser.close();}
}
