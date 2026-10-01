const qs=(s,p=document)=>p.querySelector(s), qsa=(s,p=document)=>[...p.querySelectorAll(s)];
async function getJSON(path){const r=await fetch(path);if(!r.ok)throw new Error(path);return r.json()}
function pathRoot(){return document.body.dataset.root||'.'}
async function applyI18n(){const root=pathRoot(),lang=localStorage.getItem('vb_lang')||'en';let t;try{t=await getJSON(`${root}/data/${lang}.json`)}catch{return}qsa('[data-i18n]').forEach(el=>{const v=el.dataset.i18n.split('.').reduce((o,k)=>o?.[k],t);if(v!==undefined)el.textContent=v});qsa('[data-lang]').forEach(b=>b.classList.toggle('active',b.dataset.lang===lang));}
async function applyImages(){const root=pathRoot();let d;try{d=await getJSON(`${root}/data/portfolio.json`)}catch{return}qsa('[data-featured]').forEach(el=>{const src=d.featured[el.dataset.featured];if(!src)return; if(el.tagName==='IMG')el.src=`${root}/${src}`;else el.style.backgroundImage=`url('${root}/${src}')`});const gallery=qs('[data-gallery]');if(gallery){const cat=gallery.dataset.gallery;gallery.innerHTML=d.portfolio.filter(x=>x.category===cat).map(x=>`<figure class="gallery-item ${x.layout||'portrait'}"><img src="${root}/${x.src}" alt="${x.alt}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\"placeholder\">${x.id.toString().padStart(2,'0')}</div>'"></figure>`).join(''); initImageReveal(gallery.querySelectorAll('.gallery-item'))}}
document.addEventListener('click',e=>{const b=e.target.closest('[data-lang]');if(b){localStorage.setItem('vb_lang',b.dataset.lang);applyI18n()}const m=e.target.closest('.menu-toggle');if(m)qs('.nav')?.classList.toggle('open')});
document.addEventListener('DOMContentLoaded',()=>{applyI18n();applyImages()});

function initStickyHeader(){const h=qs('.home-body .site-header');if(!h)return;const sync=()=>h.classList.toggle('scrolled',window.scrollY>24);sync();window.addEventListener('scroll',sync,{passive:true});}
document.addEventListener('DOMContentLoaded',initStickyHeader);

function initVBCursor(){if(!window.matchMedia('(pointer:fine)').matches)return;const c=document.createElement('div');c.className='vb-cursor';c.setAttribute('aria-hidden','true');document.body.appendChild(c);document.addEventListener('mousemove',e=>{c.style.left=e.clientX+'px';c.style.top=e.clientY+'px'});document.addEventListener('mouseover',e=>c.classList.toggle('is-link',!!e.target.closest('a,button')));document.addEventListener('mouseleave',()=>c.style.opacity='0');document.addEventListener('mouseenter',()=>c.style.opacity='1')}
document.addEventListener('DOMContentLoaded',initVBCursor);


function initImageReveal(nodes){
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const items=[...(nodes||document.querySelectorAll('.portfolio-covers .cover'))];
  if(!items.length)return;
  if(!('IntersectionObserver' in window))return;
  items.forEach((el,i)=>{el.classList.add('reveal-ready');el.style.transitionDelay=Math.min(i%4,3)*70+'ms'});
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target)}})
  },{threshold:.08,rootMargin:'0px 0px -4% 0px'});
  items.forEach(el=>observer.observe(el));
}
document.addEventListener('DOMContentLoaded',()=>initImageReveal(document.querySelectorAll('.portfolio-covers .cover')));


// V28 — translated form placeholders and email handoff
(function(){
  function applyFormPlaceholders(){
    const lang=localStorage.getItem('vb_lang')||localStorage.getItem('lang')||document.documentElement.lang||'en';
    fetch(`data/${['it','en','es'].includes(lang)?lang:'en'}.json`).then(r=>r.json()).then(d=>{
      document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{const path=el.dataset.i18nPlaceholder.split('.');let v=d;path.forEach(k=>v=v&&v[k]);if(v)el.placeholder=v;});
    }).catch(()=>{});
  }
  document.addEventListener('DOMContentLoaded',()=>{
    applyFormPlaceholders();
    document.querySelectorAll('[data-lang]').forEach(b=>b.addEventListener('click',()=>setTimeout(applyFormPlaceholders,80)));
    const form=document.getElementById('contactForm');
    if(form)form.addEventListener('submit',e=>{
      e.preventDefault(); const fd=new FormData(form);
      const subject=`${fd.get('project')||'Booking'} — ${fd.get('name')||''}`;
      const body=`Name: ${fd.get('name')||''}\nEmail: ${fd.get('email')||''}\nProject type: ${fd.get('project')||''}\n\n${fd.get('message')||''}`;
      window.location.href=`mailto:valentinabonanni@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  });
})();

// V33 — interactive representation map: elegant hover in/out + card anchored to city
function initRepresentationMap(){
  const map=document.querySelector('[data-representation-map]');
  if(!map)return;
  const markers=[...map.querySelectorAll('.agency-marker')];
  const card=map.querySelector('.agency-card');
  const connector=map.querySelector('.agency-connector');
  const cityEl=card.querySelector('.agency-card-city');
  const nameEl=card.querySelector('h3');
  const linkEl=card.querySelector('.agency-card-link');
  const fineHover=window.matchMedia('(hover:hover) and (pointer:fine)');
  let hideTimer=null;

  const cancelHide=()=>{if(hideTimer){clearTimeout(hideTimer);hideTimer=null;}};
  const hide=()=>{
    cancelHide();
    card.classList.remove('is-visible');
    connector.classList.remove('is-visible');
    markers.forEach(m=>m.classList.remove('is-active'));
  };
  const scheduleHide=()=>{
    if(!fineHover.matches)return;
    cancelHide();
    hideTimer=setTimeout(hide,180);
  };
  const placeCard=(marker)=>{
    const mapRect=map.getBoundingClientRect();
    const markerRect=marker.getBoundingClientRect();
    const cardW=card.offsetWidth, cardH=card.offsetHeight;
    const mx=markerRect.left-mapRect.left+markerRect.width/2;
    const my=markerRect.top-mapRect.top+markerRect.height/2;
    const gap=window.innerWidth<=800?16:28, pad=10;
    let left=mx+gap;
    if(left+cardW>mapRect.width-pad) left=mx-cardW-gap;
    left=Math.max(pad,Math.min(left,mapRect.width-cardW-pad));
    let top=my-cardH/2;
    top=Math.max(pad,Math.min(top,mapRect.height-cardH-pad));
    card.style.left=`${left}px`; card.style.top=`${top}px`;
    const targetX=left>mx?left:left+cardW;
    const targetY=Math.max(top+18,Math.min(my,top+cardH-18));
    const dx=targetX-mx, dy=targetY-my;
    connector.style.left=`${mx}px`; connector.style.top=`${my}px`;
    connector.style.width=`${Math.hypot(dx,dy)}px`;
    connector.style.transform=`rotate(${Math.atan2(dy,dx)}rad)`;
    connector.classList.add('is-visible');
  };
  const show=(marker)=>{
    cancelHide();
    markers.forEach(m=>m.classList.toggle('is-active',m===marker));
    cityEl.textContent=`${marker.dataset.city} · ${marker.dataset.country}`;
    nameEl.textContent=marker.dataset.agency||'Agency name';
    if(marker.dataset.url){linkEl.href=marker.dataset.url;linkEl.classList.remove('is-disabled');linkEl.removeAttribute('aria-disabled');}
    else{linkEl.href='#';linkEl.classList.add('is-disabled');linkEl.setAttribute('aria-disabled','true');}
    card.classList.add('is-visible');
    requestAnimationFrame(()=>placeCard(marker));
  };
  markers.forEach(marker=>{
    marker.addEventListener('mouseenter',()=>show(marker));
    marker.addEventListener('mouseleave',scheduleHide);
    marker.querySelector('button').addEventListener('click',()=>{
      if(marker.classList.contains('is-active')&&card.classList.contains('is-visible')) hide();
      else show(marker);
    });
  });
  card.addEventListener('mouseenter',cancelHide);
  card.addEventListener('mouseleave',scheduleHide);
  map.addEventListener('mouseleave',scheduleHide);
  window.addEventListener('resize',()=>{
    const active=markers.find(m=>m.classList.contains('is-active'));
    if(active&&card.classList.contains('is-visible'))placeCard(active);
  });
}
document.addEventListener('DOMContentLoaded',initRepresentationMap);
