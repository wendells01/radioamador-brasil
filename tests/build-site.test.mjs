import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,existsSync,rmSync,readdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {buildSite} from '../scripts/build-site.mjs';

function fixture(t){
 const repository=mkdtempSync(path.join(tmpdir(),'radio-build-'));
 t.after(()=>rmSync(repository,{recursive:true,force:true}));
 const source=path.join(repository,'site'),output=path.join(repository,'dist');
 mkdirSync(path.join(source,'assets/js'),{recursive:true});
 mkdirSync(path.join(source,'simulados'),{recursive:true});
 writeFileSync(path.join(source,'index.html'),'<link rel="stylesheet" href="/assets/styles.css"><script type="module" src="/assets/js/app.js"></script>');
 writeFileSync(path.join(source,'assets/styles.css'),'body { background: #08111f; }');
 writeFileSync(path.join(source,'assets/js/app.js'),"import {value} from './data.js'; export const lazy=()=>import('./audio.js');");
 writeFileSync(path.join(source,'assets/js/data.js'),'export const value=1;');
 writeFileSync(path.join(source,'assets/js/audio.js'),"import {lazy} from './app.js'; export const value=1;");
 writeFileSync(path.join(source,'simulados/classe-c.html'),'<style>body{color:red}</style><script>localStorage.setItem("history", "test")</script>');
 const build=options=>buildSite({source,output,repository,history:false,...options});
 const git=(...args)=>execFileSync('git',['-C',repository,...args],{stdio:'pipe'});
 const commit=()=>{git('add','site');git('-c','user.name=Build Test','-c','user.email=build@example.invalid','commit','-m','fixture');};
 return {repository,source,output,build,git,commit};
}
test('build determinístico, URLs automáticas e fonte/simulados intactos',t=>{
 const f=fixture(t),before=readFileSync(path.join(f.source,'index.html'));
 const a=f.build(),b=f.build();assert.deepEqual(a,b);
 for(const [original,url] of Object.entries(a.assets)){
  assert.match(url,/^\/assets\/releases\/[a-f0-9]{24}\//);
  assert.deepEqual(readFileSync(path.join(f.output,url)),readFileSync(path.join(f.source,original)));
 }
 assert.deepEqual(readFileSync(path.join(f.source,'index.html')),before);
 assert.deepEqual(readFileSync(path.join(f.source,'simulados/classe-c.html')),readFileSync(path.join(f.output,'simulados/classe-c.html')));
 assert.ok(readFileSync(path.join(f.output,'index.html'),'utf8').includes(a.assets['/assets/styles.css']));
});
test('build restaura arquivo ausente ou incorreto no cache de artefatos',t=>{
 const f=fixture(t),a=f.build();
 const css=path.join(f.output,a.assets['/assets/styles.css']);
 const js=path.join(f.output,a.assets['/assets/js/app.js']);
 rmSync(css);writeFileSync(js,'');
 const b=f.build();assert.equal(a.release,b.release);
 assert.deepEqual(readFileSync(css),readFileSync(path.join(f.source,'assets/styles.css')));
 assert.deepEqual(readFileSync(js),readFileSync(path.join(f.source,'assets/js/app.js')));
});
test('dependências estáticas, ciclo e import dinâmico permanecem na mesma versão',t=>{
 const f=fixture(t),a=f.build();
 writeFileSync(path.join(f.source,'assets/js/data.js'),'export const value=2;');
 const b=f.build();assert.notEqual(a.release,b.release);
 assert.notEqual(a.assets['/assets/styles.css'],b.assets['/assets/styles.css']);
 for(const release of [a,b]){
  const app=path.join(f.output,release.assets['/assets/js/app.js']);
  assert.ok(existsSync(path.join(path.dirname(app),'audio.js')));
  assert.ok(existsSync(path.join(path.dirname(app),'data.js')));
 }
});
test('build limpo restaura versões antigas pelo Git, sem depender de cache do provedor',t=>{
 const f=fixture(t);f.git('init');f.commit();const a=f.build({history:true});
 writeFileSync(path.join(f.source,'assets/styles.css'),'body { background: #112233; }');f.commit();
 rmSync(f.output,{recursive:true});const b=f.build({history:true});
 assert.notEqual(a.release,b.release);
 assert.equal(readFileSync(path.join(f.output,a.assets['/assets/styles.css']),'utf8'),'body { background: #08111f; }');
 assert.ok(existsSync(path.join(f.output,b.assets['/assets/styles.css'])));
});
test('checkout raso recupera histórico automaticamente antes de publicar',t=>{
 const f=fixture(t);f.git('init');f.commit();const a=f.build({history:true});
 writeFileSync(path.join(f.source,'assets/styles.css'),'body { background: #112233; }');f.commit();
 const clone=path.join(f.repository,'shallow');
 execFileSync('git',['clone','--depth=1',`file://${f.repository}`,clone],{stdio:'pipe'});
 const b=buildSite({source:path.join(clone,'site'),output:path.join(clone,'dist'),repository:clone});
 assert.notEqual(a.release,b.release);
 assert.ok(existsSync(path.join(clone,'dist',a.assets['/assets/styles.css'])));
});
test('import ou recurso ausente interrompe o build e preserva a publicação anterior',t=>{
 const f=fixture(t),a=f.build();
 writeFileSync(path.join(f.source,'assets/js/app.js'),"import './inexistente.js';");
 assert.throws(()=>f.build(),/Import ausente/);
 assert.equal(JSON.parse(readFileSync(path.join(f.output,'asset-manifest.json'))).release,a.release);
 assert.ok(!existsSync(`${f.output}.building`));
});
test('build real inclui todos os CSS/JS e preserva hashes dos três simulados',t=>{
 const output=mkdtempSync(path.join(tmpdir(),'radio-real-build-'));t.after(()=>rmSync(output,{recursive:true,force:true}));
 const result=buildSite({output});assert.ok(Object.keys(result.assets).length>20);
 for(const name of readdirSync('site/simulados'))assert.deepEqual(readFileSync(`site/simulados/${name}`),readFileSync(path.join(output,'simulados',name)));
 const config=JSON.parse(readFileSync('vercel.json'));
 assert.equal(config.outputDirectory,'dist');assert.equal(config.buildCommand,'npm run build');
 assert.equal(config.headers[0].headers.find(h=>h.key==='Cache-Control').value,'public, no-cache');
 assert.match(config.headers[1].headers[0].value,/immutable/);
 assert.ok(!config.rewrites,'CSS inexistente não deve virar uma página HTML');
});
