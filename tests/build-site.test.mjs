import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,existsSync,rmSync,readdirSync,symlinkSync} from 'node:fs';
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
test('ícones PNG, ICO e Apple são publicados e os simulados permanecem idênticos',t=>{
 const f=fixture(t);
 for(const name of ['favicon.ico','apple-touch-icon.png','assets/favicon-32.png']){
  writeFileSync(path.join(f.source,name),readFileSync(path.join('site',name)));
 }
 const original='<html><head><title>Simulado</title></head><body><script>localStorage.setItem("history", "original")</script></body></html>';
 writeFileSync(path.join(f.source,'index.html'),'<html><head><link rel="icon" type="image/x-icon" sizes="16x16 32x32 48x48" href="/favicon.ico"><link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32.png"><link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png"></head><body></body></html>');
 writeFileSync(path.join(f.source,'simulados/classe-c.html'),original);
 f.build();
 const html=readFileSync(path.join(f.output,'index.html'),'utf8');
 assert.match(html,/rel="apple-touch-icon" sizes="180x180" href="\/apple-touch-icon.png\?v=[a-f0-9]{12}"/);
 assert.match(html,/rel="icon" type="image\/png" sizes="32x32"/);
 assert.match(html,/href="\/favicon.ico\?v=[a-f0-9]{12}"/);
 const pngURL=html.match(/href="(\/assets\/favicon-32.png\?v=[a-f0-9]{12})"/)[1];
 assert.equal((html.match(/rel="apple-touch-icon"/g)||[]).length,1);
 writeFileSync(path.join(f.source,'assets/favicon-32.png'),'changed icon');
 f.build();
 const updated=readFileSync(path.join(f.output,'index.html'),'utf8');
 assert.ok(!updated.includes(pngURL),'conteúdo novo recebe URL nova para invalidar cache');
 // Restore the fixture before checking exact publication bytes below.
 writeFileSync(path.join(f.source,'assets/favicon-32.png'),readFileSync('site/assets/favicon-32.png'));
 f.build();
 assert.equal(readFileSync(path.join(f.output,'simulados/classe-c.html'),'utf8'),original);
 assert.equal(readFileSync(path.join(f.source,'simulados/classe-c.html'),'utf8'),original);
 for(const name of ['favicon.ico','apple-touch-icon.png','assets/favicon-32.png']){
  assert.deepEqual(readFileSync(path.join(f.output,name)),readFileSync(path.join(f.source,name)));
 }
});
test('Analytics cobre páginas e simulados só no build de produção, preservando a fonte',t=>{
 const f=fixture(t);
 writeFileSync(path.join(f.source,'assets/js/analytics.js'),readFileSync('site/assets/js/analytics.js'));
 const home='<html><head></head><body><h1>Home</h1></body></html>';
 const quiz='<html><head></head><body><script>const BANK=[1,2,3];localStorage.setItem("history", "original")</script></body></html>';
 writeFileSync(path.join(f.source,'index.html'),home);
 writeFileSync(path.join(f.source,'simulados/classe-c.html'),quiz);
 f.build();
 assert.equal(readFileSync(path.join(f.output,'index.html'),'utf8'),home);
 assert.equal(readFileSync(path.join(f.output,'simulados/classe-c.html'),'utf8'),quiz);
 const result=f.build({analytics:true});
 const tag=`<script defer data-site-analytics src="${result.assets['/assets/js/analytics.js']}"></script>\n`;
 for(const [name,original] of [['index.html',home],['simulados/classe-c.html',quiz]]){
  const html=readFileSync(path.join(f.output,name),'utf8');
  assert.equal(html.split(tag).length,2,'uma única inclusão por documento');
  assert.equal(html.replace(tag,''),original,'nenhuma outra alteração no documento');
  assert.equal(readFileSync(path.join(f.source,name),'utf8'),original,'fonte preservada');
 }
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
test('checkout raso sem origin usa o repositório declarado e preserva releases antigas',t=>{
 const f=fixture(t);f.git('init');f.commit();const a=f.build({history:true});
 writeFileSync(path.join(f.source,'assets/styles.css'),'body { background: #112233; }');f.commit();
 const clone=path.join(f.repository,'vercel-checkout');
 execFileSync('git',['clone','--depth=1',`file://${f.repository}`,clone],{stdio:'pipe'});
 execFileSync('git',['-C',clone,'remote','remove','origin'],{stdio:'pipe'});
 writeFileSync(path.join(clone,'package.json'),JSON.stringify({repository:{type:'git',url:`file://${f.repository}`}}));
 const b=buildSite({source:path.join(clone,'site'),output:path.join(clone,'dist'),repository:clone});
 assert.notEqual(a.release,b.release);
 assert.ok(existsSync(path.join(clone,'dist/index.html')));
 assert.equal(readFileSync(path.join(clone,'dist',a.assets['/assets/styles.css']),'utf8'),'body { background: #08111f; }');
 assert.equal(execFileSync('git',['-C',clone,'rev-parse','--is-shallow-repository'],{encoding:'utf8'}).trim(),'false');
});
test('import ou recurso ausente interrompe o build e preserva a publicação anterior',t=>{
 const f=fixture(t),a=f.build();
 writeFileSync(path.join(f.source,'assets/js/app.js'),"import './inexistente.js';");
 assert.throws(()=>f.build(),/Import ausente/);
 assert.equal(JSON.parse(readFileSync(path.join(f.output,'asset-manifest.json'))).release,a.release);
 assert.ok(!existsSync(`${f.output}.building`));
});
test('build real inclui todos os CSS/JS e preserva os bancos dos três simulados',t=>{
 const output=mkdtempSync(path.join(tmpdir(),'radio-real-build-'));t.after(()=>rmSync(output,{recursive:true,force:true}));
 const result=buildSite({output});assert.ok(Object.keys(result.assets).length>20);
 for(const name of readdirSync('site/simulados')){
  const source=readFileSync(`site/simulados/${name}`,'utf8'),built=readFileSync(path.join(output,'simulados',name),'utf8');
  assert.equal(source.match(/const BANK=(\[.*?\]);/s)[1],built.match(/const BANK=(\[.*?\]);/s)[1]);
  assert.ok(built.includes(result.assets['/assets/js/simulados/ui.js']));
 }
 const config=JSON.parse(readFileSync('vercel.json'));
 assert.equal(config.outputDirectory,'dist');assert.equal(config.buildCommand,'npm run build');
 assert.equal(config.headers[0].headers.find(h=>h.key==='Cache-Control').value,'public, no-cache');
 assert.match(config.headers[1].headers[0].value,/immutable/);
 assert.deepEqual(config.rewrites,[{source:'/assets/data/solar.json',destination:'https://raw.githubusercontent.com/wendells01/radioamador-brasil/solar-data/solar.json'},{source:'/assets/data/indicativos/:path*',destination:'https://raw.githubusercontent.com/wendells01/radioamador-brasil/indicativos-data/:path*'}]);
 assert.ok(!existsSync(path.join(output,'assets/data/indicativos')));
 assert.equal(config.git.deploymentEnabled['indicativos-data'],false);
 assert.ok(!existsSync(path.join(output,'assets/data/solar.json')),'snapshot estático não pode sombrear o rewrite');
 assert.equal(config.git.deploymentEnabled['solar-data'],false);
});


test('CLI gera dist em checkout limpo, inclusive quando chamado por link simbólico',t=>{
 const temp=mkdtempSync(path.join(tmpdir(),'radio-cli-'));
 t.after(()=>rmSync(temp,{recursive:true,force:true}));
 const repository=path.join(temp,'checkout');
 execFileSync('git',['clone','--quiet','--no-hardlinks','.',repository],{stdio:'pipe'});
 // Use the working implementation, not the earlier committed CLI guard.
 mkdirSync(path.join(repository,'scripts'),{recursive:true});
 for(const name of ['build-site.mjs','generate-daily-bank.mjs'])writeFileSync(path.join(repository,'scripts',name),readFileSync(`scripts/${name}`));
 const link=path.join(temp,'linked-checkout');symlinkSync(repository,link,'dir');
 for(const entry of [path.join(link,'scripts/build-site.mjs'),path.join(repository,'scripts/build-site.mjs')]){
  rmSync(path.join(repository,'dist'),{recursive:true,force:true});
  const stdout=execFileSync(process.execPath,[entry],{cwd:repository,encoding:'utf8',env:{...process.env,INIT_CWD:repository}});
  assert.match(stdout,/Publicação gerada/);
  assert.ok(existsSync(path.join(repository,'dist/index.html')));
  assert.ok(existsSync(path.join(repository,'dist/asset-manifest.json')));
 }
 rmSync(path.join(repository,'dist'),{recursive:true,force:true});
 assert.throws(()=>execFileSync('npm',['run','build'],{cwd:path.join(repository,'site'),stdio:'pipe'}),error=>{
  assert.match(error.stderr.toString(),/Root Directory vazio/);
  return true;
 });
 assert.ok(!existsSync(path.join(repository,'dist')));
});

test('logo do cabeçalho vai no HTML, sem pedido de imagem ou dependência de JavaScript',t=>{
 const output=mkdtempSync(path.join(tmpdir(),'radio-logo-build-'));t.after(()=>rmSync(output,{recursive:true,force:true}));
 buildSite({output,history:false});
 const expected=readFileSync('site/assets/logo-header.930be75f8e12.jpg');
 for(const name of ['index.html','ferramentas.html','ferramentas/indicativos.html','simulados/classe-c.html']){
  const html=readFileSync(path.join(output,name),'utf8');
  const picture=html.match(/<picture class="brand__image">[\s\S]*?<\/picture>/)[0];
  assert.ok(!picture.includes('<source'));const encoded=picture.match(/src="data:image\/jpeg;base64,([^"]+)"/)[1];
  assert.deepEqual(Buffer.from(encoded,'base64'),expected,name);
 }
 assert.match(readFileSync('site/index.html','utf8'),/srcset="\/assets\/logo-header/,'fonte original continua disponível');
});
