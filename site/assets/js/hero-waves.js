/* A quiet radio network, drawn locally. No images, tracking or pointer handlers.
   One RAF, capped at 30 fps / 1.5 DPR. Hidden/offscreen pauses freeze the scene.
   Reduced motion draws the same composition once. CSS rings remain a fallback. */
const canvas=document.querySelector('[data-hero-canvas]');
if(canvas?.parentElement){
 const ctx=canvas.getContext('2d',{alpha:true});
 if(ctx){
  const ambient=canvas.parentElement;
  const actions=ambient.parentElement.querySelector('.hero__actions');
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const styles=getComputedStyle(document.documentElement);
  const accent=styles.getPropertyValue('--accent').trim()||'#F5C542';
  const light=styles.getPropertyValue('--text').trim()||'#F4F6FA';
  let width=1,height=1,actionTop=1,raf=0,running=false,last=0,time=4;
  let inView=true,visible=!document.hidden;
  const narrow=()=>width<860;
  function resize(){
   const rect=ambient.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.5);
   width=Math.max(1,Math.round(rect.width));height=Math.max(1,Math.round(rect.height));
   actionTop=actions?actions.getBoundingClientRect().top-rect.top:height;
   canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
   ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  function stroke(color,alpha,lineWidth,draw){
   ctx.strokeStyle=color;ctx.globalAlpha=alpha;ctx.lineWidth=lineWidth;
   ctx.beginPath();draw();ctx.stroke();
  }
  function dot(x,y,r,color,alpha){
   ctx.fillStyle=color;ctx.globalAlpha=alpha;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
  }
  function mast(x,y,size,alpha,color=light){
   stroke(color,alpha,1.5,()=>{
    ctx.moveTo(x-size*.36,y+size);ctx.lineTo(x,y);ctx.lineTo(x+size*.36,y+size);
    ctx.moveTo(x-size*.23,y+size*.65);ctx.lineTo(x+size*.23,y+size*.65);
    ctx.moveTo(x-size*.14,y+size*.4);ctx.lineTo(x+size*.14,y+size*.4);
   });
   dot(x,y,2,accent,alpha);
  }
  function frame(){
   const small=narrow(),cx=width*(small ? .91 : .79);
   if(small&&actions)actionTop=actions.getBoundingClientRect().top-ambient.getBoundingClientRect().top;
   const cy=small?Math.min(height*.56,Math.max(90,actionTop-100)):height*.48;
   const reach=small ? Math.min(width*.72,height*.48):Math.min(width*.36,height*.6);
   ctx.clearRect(0,0,width,height);ctx.lineCap='round';ctx.lineJoin='round';
   // A small glow around the transmitting antenna; no moving background field.
   const glow=ctx.createRadialGradient(cx,cy,0,cx,cy,reach*.8);
   glow.addColorStop(0,'rgba(245,197,66,.08)');glow.addColorStop(1,'rgba(245,197,66,0)');
   ctx.globalAlpha=1;ctx.fillStyle=glow;ctx.fillRect(cx-reach,cy-reach,reach*2,reach*2);
   const radii=[];
   for(let i=0;i<3;i++){
    const progress=(time/12+i/3)%1,r=20+progress*reach;
    radii.push(r);
    stroke(accent,Math.sin(Math.PI*progress)*(small ? .27 : .30),1,()=>ctx.arc(cx,cy,r,0,Math.PI*2));
   }
   const nodes=small ? [[-.62,-.58],[-.54,.63]]:[[-.59,-.68],[.36,-.61],[.50,.65],[-.56,.76]];
   for(const [nx,ny] of nodes){
    const x=cx+nx*reach,y=cy+ny*reach,distance=Math.hypot(x-cx,y-cy);
    const pulse=motion.matches ? .28:Math.max(...radii.map(r=>Math.exp(-(((r-distance)/19)**2))));
    stroke(light,small ? .04 : .065,1,()=>{ctx.moveTo(cx,cy);ctx.lineTo(x,y);});
    stroke(accent,.08+pulse*(small ? .2 : .38),1,()=>ctx.arc(x,y,10+pulse*5,0,Math.PI*2));
    dot(x,y,2.5,light,.22+pulse*.55);
    mast(x,y-19,12,(small ? .27 : .40)+pulse*.28);
   }
   // Origin marker and antenna remain still while the wavefronts travel outwards.
   stroke(light,small ? .30 : .40,1,()=>{
    ctx.ellipse(cx,cy+68,38,9,0,0,Math.PI*2);
   });
   mast(cx,cy,60,small ? .65 : .85,accent);
   for(const side of [-1,1])stroke(accent,small ? .40 : .55,1.5,()=>{
    const start=side<0?Math.PI*.77:-Math.PI*.23;
    ctx.arc(cx,cy,13,start,start+Math.PI*.46);
   });
   // Keep the reading area quiet; the artwork is decorative, never an overlay.
   ctx.globalCompositeOperation='destination-in';ctx.globalAlpha=1;
   const mask=ctx.createLinearGradient(0,0,width,0);
   mask.addColorStop(0,'rgba(0,0,0,0)');
   mask.addColorStop(small ? .28 : .43,'rgba(0,0,0,0)');
   mask.addColorStop(small ? .76 : .68,'rgba(0,0,0,1)');
   mask.addColorStop(1,'rgba(0,0,0,1)');
   ctx.fillStyle=mask;ctx.fillRect(0,0,width,height);
   if(small){
    // End the artwork before the CTA group, including its transparent button.
    const end=Math.max(1,actionTop-4),begin=Math.max(0,end-30);
    const fade=ctx.createLinearGradient(0,begin,0,end);
    fade.addColorStop(0,'rgba(0,0,0,1)');fade.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=fade;ctx.fillRect(0,0,width,height);
   }
   ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
  }
  function step(now){
   if(!running)return;
   if(motion.matches||document.hidden||!inView){stop();return;}
   raf=requestAnimationFrame(step);
   if(!last){last=now;return;}
   const elapsed=now-last;if(elapsed<1000/30)return;
   last=now;time+=Math.min(elapsed,100)/1000;frame();
  }
  function stop(){running=false;if(raf)cancelAnimationFrame(raf);raf=0;last=0;}
  function start(){if(running||!inView||!visible||motion.matches)return;running=true;raf=requestAnimationFrame(step);}
  function preference(){stop();frame();start();}
  document.addEventListener('visibilitychange',()=>{visible=!document.hidden;visible?start():stop();});
  if('IntersectionObserver' in window)new IntersectionObserver(entries=>{
   inView=entries.some(entry=>entry.isIntersecting);inView?start():stop();
  }).observe(canvas);
  motion.addEventListener?.('change',preference);
  if('ResizeObserver' in window)new ResizeObserver(()=>{resize();frame();}).observe(ambient);
  else window.addEventListener('resize',()=>{resize();frame();});
  window.addEventListener('pagehide',stop);
  window.addEventListener('pageshow',()=>{visible=!document.hidden;start();});
  resize();frame();ambient.dataset.radioReady='true';start();
 }
}
