// Development-only rasterization of the existing vector mark. Commit the outputs;
// the production build needs no browser or image processing dependency.
import {readFile,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';

const root=new URL('../site/',import.meta.url);
const svg=await readFile(new URL('assets/favicon.svg',root),'utf8');
const browser=await chromium.launch(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{});
try{
 const page=await browser.newPage();
 const images=new Map(),bitmaps=new Map();
 for(const size of [16,32,48,96,180,192,512]){
  const encoded=await page.evaluate(async({svg,size})=>{
   const image=new Image();
   image.src=`data:image/svg+xml,${encodeURIComponent(svg)}`;
   await image.decode();
   const canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;
   const context=canvas.getContext('2d');
   context.fillStyle='#08111F';context.fillRect(0,0,size,size);
   context.drawImage(image,0,0,size,size);
   return {png:canvas.toDataURL('image/png').split(',')[1],rgba:Array.from(context.getImageData(0,0,size,size).data)};
  },{svg,size});
  images.set(size,Buffer.from(encoded.png,'base64'));
  // ICO uses a bottom-up BGRA bitmap plus an AND mask, rather than embedded PNG.
  const stride=Math.ceil(size/32)*4;
  const bitmap=Buffer.alloc(40+size*size*4+stride*size);
  bitmap.writeUInt32LE(40,0);bitmap.writeInt32LE(size,4);bitmap.writeInt32LE(size*2,8);
  bitmap.writeUInt16LE(1,12);bitmap.writeUInt16LE(32,14);
  bitmap.writeUInt32LE(size*size*4,20);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
   const src=(y*size+x)*4,dst=40+((size-1-y)*size+x)*4;
   bitmap[dst]=encoded.rgba[src+2];bitmap[dst+1]=encoded.rgba[src+1];
   bitmap[dst+2]=encoded.rgba[src];bitmap[dst+3]=encoded.rgba[src+3];
  }
  bitmaps.set(size,bitmap);
 }
 await writeFile(new URL('assets/favicon-32.png',root),images.get(32));
 await writeFile(new URL('apple-touch-icon.png',root),images.get(180));
 for(const [name,size] of [['favicon-96x96.png',96],['web-app-manifest-192x192.png',192],['web-app-manifest-512x512.png',512]]){
  await writeFile(new URL(name,root),images.get(size));
 }
 const sizes=[16,32,48],header=Buffer.alloc(6+sizes.length*16);
 header.writeUInt16LE(1,2);header.writeUInt16LE(sizes.length,4);
 let offset=header.length;
 for(const [index,size] of sizes.entries()){
  const entry=6+index*16,bytes=bitmaps.get(size);
  header[entry]=size;header[entry+1]=size;
  header.writeUInt16LE(1,entry+4);header.writeUInt16LE(32,entry+6);
  header.writeUInt32LE(bytes.length,entry+8);header.writeUInt32LE(offset,entry+12);
  offset+=bytes.length;
 }
 await writeFile(new URL('favicon.ico',root),Buffer.concat([header,...sizes.map(size=>bitmaps.get(size))]));
 console.log('Generated favicon.ico, favicon-32.png and apple-touch-icon.png from favicon.svg.');
}finally{await browser.close();}
