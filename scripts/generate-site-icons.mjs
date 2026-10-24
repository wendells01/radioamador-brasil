// Development-only rasterization of the existing vector mark. Commit the outputs;
// the production build needs no browser or image processing dependency.
import {readFile,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';

const root=new URL('../site/',import.meta.url);
const svg=await readFile(new URL('assets/favicon.svg',root),'utf8');
const browser=await chromium.launch(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{});
try{
 const page=await browser.newPage();
 const images=new Map();
 for(const size of [16,32,48,180]){
  const encoded=await page.evaluate(async({svg,size})=>{
   const image=new Image();
   image.src=`data:image/svg+xml,${encodeURIComponent(svg)}`;
   await image.decode();
   const canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;
   const context=canvas.getContext('2d');
   context.fillStyle='#08111F';context.fillRect(0,0,size,size);
   context.drawImage(image,0,0,size,size);
   return canvas.toDataURL('image/png').split(',')[1];
  },{svg,size});
  images.set(size,Buffer.from(encoded,'base64'));
 }
 await writeFile(new URL('assets/favicon-32.png',root),images.get(32));
 await writeFile(new URL('apple-touch-icon.png',root),images.get(180));
 const sizes=[16,32,48],header=Buffer.alloc(6+sizes.length*16);
 header.writeUInt16LE(1,2);header.writeUInt16LE(sizes.length,4);
 let offset=header.length;
 for(const [index,size] of sizes.entries()){
  const entry=6+index*16,bytes=images.get(size);
  header[entry]=size;header[entry+1]=size;
  header.writeUInt16LE(1,entry+4);header.writeUInt16LE(32,entry+6);
  header.writeUInt32LE(bytes.length,entry+8);header.writeUInt32LE(offset,entry+12);
  offset+=bytes.length;
 }
 await writeFile(new URL('favicon.ico',root),Buffer.concat([header,...sizes.map(size=>images.get(size))]));
 console.log('Generated favicon.ico, favicon-32.png and apple-touch-icon.png from favicon.svg.');
}finally{await browser.close();}
