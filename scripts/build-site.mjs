// Dependency-free publication step. Source files remain usable without a build.
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {cpSync,existsSync,mkdirSync,readFileSync,readdirSync,realpathSync,renameSync,rmSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {verifyDailyBank} from './generate-daily-bank.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const versioned=name=>/\.(css|js)$/.test(name);
function files(dir,prefix=''){
 return readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
  const name=path.posix.join(prefix,entry.name);
  return entry.isDirectory()?files(path.join(dir,entry.name),name):[name];
 });
}
export function releaseId(assets){
 const hash=createHash('sha256');
 for(const [name,bytes] of [...assets].sort(([a],[b])=>a<b?-1:a>b?1:0)){
  hash.update(`${name}\0${bytes.length}\0`);hash.update(bytes);
 }
 return hash.digest('hex').slice(0,24);
}
function writeRelease(output,assets){
 const id=releaseId(assets),dir=path.join(output,'assets/releases',id);
 for(const [name,bytes] of assets){
  const target=path.join(dir,name);mkdirSync(path.dirname(target),{recursive:true});writeFileSync(target,bytes);
 }
 return id;
}
// Keep releases referenced by older documents and lazy imports across deployments.
// Rebuild them from Git instead of relying on an ephemeral provider build cache.
function historicalReleases(repository,output){
 const git=args=>execFileSync('git',['-C',repository,...args],{encoding:'utf8',maxBuffer:32*1024*1024});
 if(!existsSync(path.join(repository,'.git')))throw new Error('Publicação exige checkout Git com histórico para preservar recursos de versões antigas.');
 if(git(['rev-parse','--is-shallow-repository']).trim()==='true'){
  // A managed checkout can be shallow without configuring an origin remote.
  // Fetch from the declared public repository in that case; never discard history.
  const hasOrigin=git(['remote']).trim().split('\n').includes('origin');
  const metadata=hasOrigin?null:JSON.parse(readFileSync(path.join(repository,'package.json'),'utf8'));
  const remote=hasOrigin?'origin':metadata.repository?.url;
  if(!remote)throw new Error('Checkout raso sem origin: declare repository.url no package.json para recuperar as releases antigas.');
  git(['fetch','--unshallow',remote]);
 }
 const commits=git(['log','--format=%H','--',':(glob)site/assets/**/*.css',':(glob)site/assets/**/*.js']).trim().split('\n').filter(Boolean);
 const blobs=new Map();
 for(const commit of commits){
  const assets=new Map();
  for(const record of git(['ls-tree','-r',commit,'--','site/assets']).trim().split('\n').filter(Boolean)){
   const [metadata,name]=record.split('\t');
   if(!versioned(name))continue;
   const blob=metadata.split(' ')[2];
   if(!blobs.has(blob))blobs.set(blob,execFileSync('git',['-C',repository,'cat-file','blob',blob]));
   assets.set(name.slice('site/assets/'.length),blobs.get(blob));
  }
  if(assets.size)writeRelease(output,assets);
 }
}
export function buildSite({source=path.join(ROOT,'site'),output=path.join(ROOT,'dist'),repository=ROOT,history=true,analytics=false}={}){
 const stage=`${output}.building`;
 rmSync(stage,{recursive:true,force:true});
 try{
  if(existsSync(path.join(source,'assets/js/daily-challenge-bank.js')))verifyDailyBank(source);
  cpSync(source,stage,{recursive:true});
  // Include previous local builds too; production history is restored below.
  const previous=path.join(output,'assets/releases');
  if(existsSync(previous))cpSync(previous,path.join(stage,'assets/releases'),{recursive:true});
  if(history)historicalReleases(repository,stage);
  const assets=new Map(files(path.join(source,'assets')).filter(versioned).map(name=>[name,readFileSync(path.join(source,'assets',name))]));
  // Imports remain relative inside one release, including the Morse cycle and
  // its lazy audio import. Reject a broken graph before replacing any output.
  for(const [name,bytes] of assets){
   if(!name.endsWith('.js'))continue;
   for(const match of bytes.toString().matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)(['"])([^'"]+)\1/g)){
    const specifier=match[2];
    if(!specifier.startsWith('.'))throw new Error(`Import não relativo em ${name}: ${specifier}`);
    const dependency=path.posix.normalize(path.posix.join(path.posix.dirname(name),specifier));
    if(!assets.has(dependency))throw new Error(`Import ausente em ${name}: ${specifier}`);
   }
  }
  const release=writeRelease(stage,assets);
  const manifest=Object.fromEntries([...assets.keys()].map(name=>[`/assets/${name}`,`/assets/releases/${release}/${name}`]));
  if(analytics&&!manifest['/assets/js/analytics.js'])throw new Error('Integração de Analytics ausente.');
  for(const name of files(stage).filter(name=>name.endsWith('.html'))){
   const target=path.join(stage,name),original=readFileSync(target,'utf8');
   // The small header logo travels with HTML: no separate image request, image
   // cache validator, or JavaScript fallback is needed for the site's identity.
   // Keep the source picture usable when serving site/ directly.
   let documentHTML=original;
   if(original.includes('<picture class="brand__image">')){
    const logo=path.join(source,'assets/logo-header.930be75f8e12.jpg');
    const data=`data:image/jpeg;base64,${readFileSync(logo).toString('base64')}`;
    documentHTML=original.replace(/<picture class="brand__image">[\s\S]*?<\/picture>/g,picture=>picture.replace(/<source\b[^>]*>/g,'').replace(/(<img\b[^>]*\bsrc=)["'][^"']*["']/,`$1"${data}"`));
   }
   // Only rewrite CSS/JS URL attributes. Inline quiz scripts and storage keys stay intact.
   let html=documentHTML.replace(/\b(href|src)=(['"])(\/assets\/[^'"?#]+\.(?:css|js))\2/g,(match,attribute,quote,url)=>{
    if(!manifest[url])throw new Error(`Recurso ausente em ${name}: ${url}`);
    return `${attribute}=${quote}${manifest[url]}${quote}`;
   });
   // Enhance the shared site head. Standalone quizzes receive no icon changes;
   // browsers can discover the conventional root icons on those pages.
   if(original.includes('href="/assets/favicon.svg"')&&existsSync(path.join(stage,'apple-touch-icon.png'))&&existsSync(path.join(stage,'favicon.ico'))){
    const icons=[
     '<link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48">',
     '<link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32.png">',
     '<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">'
    ];
    html=html.replace(/<\/head>/i,`${icons.join('\n')}\n</head>`);
   }
   // Instrument every published page, including standalone quizzes, without
   // editing their source HTML, question banks, inline scripts or storage keys.
   if(analytics){
    const tag=`<script defer data-site-analytics src="${manifest['/assets/js/analytics.js']}"></script>\n`;
    html=html.replace(/<\/body>/i,`${tag}</body>`);
   }
   if(html!==original)writeFileSync(target,html);
  }
  // A static file would take precedence over Vercel's live-data rewrite.
  // Development still reads site/assets/data/solar.json directly.
  rmSync(path.join(stage,'assets/data/solar.json'),{force:true});
  rmSync(path.join(stage,'assets/data/indicativos'),{recursive:true,force:true});
  writeFileSync(path.join(stage,'asset-manifest.json'),JSON.stringify({release,assets:manifest},null,2)+'\n');
  rmSync(output,{recursive:true,force:true});renameSync(stage,output);
  return {release,assets:manifest};
 }catch(error){rmSync(stage,{recursive:true,force:true});throw error;}
}
// Node resolves import.meta.url through symlinks; argv may retain the link.
// Comparing unresolved paths could silently skip the entire CLI build.
if(process.argv[1]&&existsSync(process.argv[1])&&realpathSync(process.argv[1])===fileURLToPath(import.meta.url)){
 const invocationRoot=realpathSync(process.env.INIT_CWD||process.cwd());
 if(invocationRoot!==realpathSync(ROOT)){
  throw new Error(`Build iniciado em ${invocationRoot}, mas a raiz do projeto é ${ROOT}. Na Vercel, deixe Root Directory vazio (raiz do repositório), Build Command "npm run build" e Output Directory "dist".`);
 }
 const result=buildSite({analytics:process.env.VERCEL_ENV==='production'});console.log(`Publicação gerada em ${path.join(ROOT,'dist')} · release ${result.release}`);
}
