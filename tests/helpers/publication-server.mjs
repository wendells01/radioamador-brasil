// HTTP harness for the declared Vercel static policy, not a production server.
import {createServer} from 'node:http';
import {readFileSync,statSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
const policy=JSON.parse(readFileSync(new URL('../../vercel.json',import.meta.url)));
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.webp':'image/webp','.svg':'image/svg+xml','.txt':'text/plain; charset=utf-8'};
export async function publicationServer(root,{poisonCSS=()=>false}={}){
 const requests=[];
 const server=createServer((request,response)=>{
  let pathname;
  try{pathname=decodeURIComponent(new URL(request.url,'http://localhost').pathname);}catch{response.writeHead(400);response.end();return;}
  const resolved=path.resolve(root(),`.${pathname==='/'?'/index.html':pathname}`);
  const entry={path:pathname,status:0};requests.push(entry);
  const finish=(status,body)=>{entry.status=status;response.writeHead(status);response.end(body);};
  for(const rule of policy.headers){
   const matches=rule.source==='/(.*)'||rule.source==='/assets/releases/:release/:path*'&&/^\/assets\/releases\/[^/]+\/.+/.test(pathname);
   if(matches)for(const {key,value} of rule.headers)response.setHeader(key,value);
  }
  if(!resolved.startsWith(path.resolve(root())+path.sep)){finish(404,'Not found');return;}
  // Serve a deterministic local stand-in for the external production rewrite.
  const fixturePath=pathname==='/assets/data/solar.json'&&!existsSync(resolved)?new URL('../../site/assets/data/solar.json',import.meta.url):resolved;
  let bytes,stat;
  try{stat=statSync(fixturePath);bytes=readFileSync(fixturePath);}catch{response.setHeader('Cache-Control','no-store');finish(404,'Not found');return;}
  const etag=`"${createHash('sha256').update(bytes).digest('hex')}"`;
  response.setHeader('ETag',etag);response.setHeader('Last-Modified',stat.mtime.toUTCString());
  response.setHeader('Content-Type',types[path.extname(resolved)]||'application/octet-stream');
  if(request.headers['if-none-match']===etag){finish(304);return;}
  // Controlled damaged-cache simulation: body is empty but its original ETag survives.
  if(pathname==='/assets/styles.css'&&poisonCSS()){finish(200,'');return;}
  finish(200,bytes);
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 return {url:`http://127.0.0.1:${server.address().port}`,requests,close:()=>new Promise(resolve=>server.close(resolve))};
}
