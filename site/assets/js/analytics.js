// Loaded only by production builds. Never read form values, quiz results or GPS.
(() => {
 const allowed=['radioamadorbrasil.site','www.radioamadorbrasil.site'];
 if(location.protocol!=='https:'||!allowed.includes(location.hostname))return;
 if(navigator.doNotTrack==='1'||window.doNotTrack==='1'||navigator.globalPrivacyControl===true)return;
 if(document.querySelector('script[src="/_vercel/insights/script.js"]'))return;

 window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments);};
 window.va('beforeSend',event=>{
  try{
   const clean=value=>{const url=new URL(value,location.origin);url.search='';url.hash='';return url.href;};
   return {...event,url:clean(event.url),...(event.referrer?{referrer:clean(event.referrer)}:{})};
  }catch{return null;}
 });
 const script=document.createElement('script');
 script.defer=true;script.src='/_vercel/insights/script.js';
 document.head.appendChild(script);
})();
