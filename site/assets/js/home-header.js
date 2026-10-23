// Home only: preserve the sticky header while revealing the actual hero behind it.
const header=document.querySelector('.home .site-header');
if(header){
 const measure=()=>document.documentElement.style.setProperty('--home-header-height',`${header.getBoundingClientRect().height}px`);
 const update=()=>header.classList.toggle('is-scrolled',window.scrollY>8);
 measure();
 if('ResizeObserver' in window)new ResizeObserver(measure).observe(header);
 else window.addEventListener('resize',measure);
 window.addEventListener('scroll',update,{passive:true});
 window.addEventListener('pageshow',update);
 update();
}
