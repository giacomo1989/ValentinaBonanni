const qs=(s,p=document)=>p.querySelector(s), qsa=(s,p=document)=>[...p.querySelectorAll(s)];
async function getJSON(path){const r=await fetch(path);if(!r.ok)throw new Error(path);return r.json()}
function pathRoot(){return document.body.dataset.root||'.'}
async function applyI18n(){const root=pathRoot(),lang=localStorage.getItem('vb_lang')||'en';let t;try{t=await getJSON(`${root}/data/${lang}.json`)}catch{return}qsa('[data-i18n]').forEach(el=>{const v=el.dataset.i18n.split('.').reduce((o,k)=>o?.[k],t);if(v!==undefined)el.textContent=v});qsa('[data-lang]').forEach(b=>b.classList.toggle('active',b.dataset.lang===lang));}
async function applyImages(){const root=pathRoot();let d;try{d=await getJSON(`${root}/data/portfolio.json`)}catch{return}qsa('[data-featured]').forEach(el=>{const src=d.featured[el.dataset.featured];if(!src)return; if(el.tagName==='IMG')el.src=`${root}/${src}`;else el.style.backgroundImage=`url('${root}/${src}')`});const gallery=qs('[data-gallery]');if(gallery){const cat=gallery.dataset.gallery;gallery.innerHTML=d.portfolio.filter(x=>x.category===cat).map(x=>`<figure class="gallery-item ${x.layout||'portrait'}"><img src="${root}/${x.src}" alt="${x.alt}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\"placeholder\">${x.id.toString().padStart(2,'0')}</div>'"></figure>`).join(''); initImageReveal(gallery.querySelectorAll('.gallery-item')); initGalleryParallax(gallery); initGalleryLightbox(gallery)}}
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
function initPortfolioCoverEntrance(){
  const covers=[...document.querySelectorAll('.portfolio-covers-four .cover')];
  if(!covers.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  if(!('IntersectionObserver' in window))return;
  covers.forEach((cover,i)=>{
    cover.classList.add('cinematic-ready');
    cover.style.transitionDelay=(i*120)+'ms';
    const img=cover.querySelector('img');
    if(img) img.style.transitionDelay=(i*120)+'ms';
  });
  const grid=covers[0].closest('.portfolio-covers-four');
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(!entry.isIntersecting)return;
      covers.forEach(cover=>cover.classList.add('cinematic-visible'));
      observer.disconnect();
    });
  },{threshold:.18,rootMargin:'0px 0px -5% 0px'});
  observer.observe(grid);
}
document.addEventListener('DOMContentLoaded',initPortfolioCoverEntrance);


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
    connector.style.width='0px';
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
    const connectorLength=Math.hypot(dx,dy);
    connector.style.left=`${mx}px`; connector.style.top=`${my}px`;
    connector.style.transform=`rotate(${Math.atan2(dy,dx)}rad)`;
    connector.style.width='0px';
    connector.classList.add('is-visible');
    card.style.setProperty('--card-origin', left>mx ? 'left center' : 'right center');
    requestAnimationFrame(()=>requestAnimationFrame(()=>{connector.style.width=`${connectorLength}px`;}));
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


// V41 — redraw Europe every time Representation re-enters the viewport.
document.addEventListener('DOMContentLoaded', () => {
  const section = document.querySelector('.representation');
  if (!section) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion || !('IntersectionObserver' in window)) {
    section.classList.add('is-map-drawn');
    return;
  }

  let wasVisible = false;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const visible = entry.isIntersecting && entry.intersectionRatio >= 0.22;
      if (visible && !wasVisible) {
        // Force a clean restart even after repeated scroll entries.
        section.classList.remove('is-map-drawn');
        void section.offsetWidth;
        section.classList.add('is-map-drawn');
      } else if (!entry.isIntersecting) {
        section.classList.remove('is-map-drawn');
      }
      wasVisible = visible;
    });
  }, { threshold: [0, 0.22] });

  observer.observe(section);
});

// V47 — masked reveal for the main editorial titles.
document.addEventListener('DOMContentLoaded', () => {
  const titles = document.querySelectorAll('.script-title, .representation-head h2');
  if (!titles.length) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  titles.forEach((title) => {
    if (title.closest('.title-reveal-mask')) return;
    const mask = document.createElement('span');
    mask.className = 'title-reveal-mask';
    const inner = document.createElement('span');
    inner.className = 'title-reveal-inner';
    title.parentNode.insertBefore(mask, title);
    mask.appendChild(inner);
    inner.appendChild(title);

    if (reduced || !('IntersectionObserver' in window)) {
      mask.classList.add('is-visible');
      return;
    }
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          requestAnimationFrame(() => mask.classList.add('is-visible'));
          obs.unobserve(mask);
        }
      });
    }, { threshold: 0.28 });
    observer.observe(mask);
  });
});

// V48 — micro-parallax for gallery photography while scrolling.
function initGalleryParallax(root=document){
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const items=[...root.querySelectorAll('.gallery-item')].filter(el=>!el.dataset.parallaxBound);
  if(!items.length)return;
  items.forEach(el=>{el.dataset.parallaxBound='1';el.classList.add('parallax-photo');});
  let ticking=false;
  const update=()=>{
    ticking=false;
    const vh=window.innerHeight||document.documentElement.clientHeight;
    items.forEach(item=>{
      const r=item.getBoundingClientRect();
      if(r.bottom<0||r.top>vh)return;
      const center=r.top+r.height/2;
      const progress=Math.max(-1,Math.min(1,(center-vh/2)/(vh/2+r.height/2)));
      item.style.setProperty('--parallax-y',`${(-progress*16).toFixed(2)}px`);
      const img=item.querySelector('img');
      if(img)img.style.setProperty('--parallax-y',`${(-progress*16).toFixed(2)}px`);
    });
  };
  const request=()=>{if(!ticking){ticking=true;requestAnimationFrame(update);}};
  update();
  window.addEventListener('scroll',request,{passive:true});
  window.addEventListener('resize',request,{passive:true});
}

document.addEventListener('DOMContentLoaded',()=>initGalleryParallax());

// V50 — overlay lightbox: browse the current gallery without leaving the page.
function initGalleryLightbox(root=document){
  const gallery=root.matches?.('[data-gallery]')?root:root.querySelector?.('[data-gallery]');
  if(!gallery || gallery.dataset.lightboxBound==='1')return;
  gallery.dataset.lightboxBound='1';
  const items=[...gallery.querySelectorAll('.gallery-item')];
  if(!items.length)return;

  const overlay=document.createElement('div');
  overlay.className='gallery-lightbox';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');
  overlay.setAttribute('aria-label','Gallery viewer');
  overlay.innerHTML=`<div class="gallery-lightbox-stage">
    <button class="gallery-lightbox-close" type="button" aria-label="Close">×</button>
    <div class="gallery-lightbox-viewer">
      <button class="gallery-lightbox-nav gallery-lightbox-prev" type="button" aria-label="Previous image"><svg viewBox="0 0 28 48" aria-hidden="true"><path d="M22 5L7 24l15 19"/></svg></button>
      <img class="gallery-lightbox-image" alt="">
      <button class="gallery-lightbox-nav gallery-lightbox-next" type="button" aria-label="Next image"><svg viewBox="0 0 28 48" aria-hidden="true"><path d="M6 5l15 19L6 43"/></svg></button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  const image=overlay.querySelector('.gallery-lightbox-image');
  const closeBtn=overlay.querySelector('.gallery-lightbox-close');
  const prevBtn=overlay.querySelector('.gallery-lightbox-prev');
  const nextBtn=overlay.querySelector('.gallery-lightbox-next');
  let index=0, lastFocus=null, touchX=null;

  const render=(nextIndex)=>{
    index=(nextIndex+items.length)%items.length;
    const source=items[index].querySelector('img');
    if(!source)return;
    image.src=source.currentSrc||source.src;
    image.alt=source.alt||'';
  };
  const open=(i)=>{
    lastFocus=document.activeElement;
    render(i);
    overlay.classList.add('is-open');
    document.body.classList.add('lightbox-open');
    requestAnimationFrame(()=>closeBtn.focus({preventScroll:true}));
  };
  const close=()=>{
    overlay.classList.remove('is-open');
    document.body.classList.remove('lightbox-open');
    if(lastFocus?.focus)lastFocus.focus({preventScroll:true});
  };
  const prev=()=>render(index-1), next=()=>render(index+1);

  items.forEach((item,i)=>{
    item.tabIndex=0;
    item.setAttribute('role','button');
    item.setAttribute('aria-label',`Open image ${i+1} of ${items.length}`);
    item.addEventListener('click',()=>open(i));
    item.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open(i)}});
  });
  closeBtn.addEventListener('click',close); prevBtn.addEventListener('click',prev); nextBtn.addEventListener('click',next);
  overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
  document.addEventListener('keydown',e=>{
    if(!overlay.classList.contains('is-open'))return;
    if(e.key==='Escape')close(); else if(e.key==='ArrowLeft')prev(); else if(e.key==='ArrowRight')next();
  });
  overlay.addEventListener('touchstart',e=>{touchX=e.changedTouches[0]?.clientX??null},{passive:true});
  overlay.addEventListener('touchend',e=>{if(touchX===null)return;const dx=(e.changedTouches[0]?.clientX??touchX)-touchX;touchX=null;if(Math.abs(dx)>45)(dx>0?prev:next)()},{passive:true});
}

// V52 — reveal the real footer signature like ink being written when it enters view.
document.addEventListener('DOMContentLoaded',()=>{
  const logos=[...document.querySelectorAll('.footer-logo')];
  if(!logos.length)return;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduced||!('IntersectionObserver' in window)){
    logos.forEach(logo=>logo.classList.add('is-ink-written'));
    return;
  }
  const observer=new IntersectionObserver((entries,obs)=>{
    entries.forEach(entry=>{
      if(!entry.isIntersecting)return;
      requestAnimationFrame(()=>entry.target.classList.add('is-ink-written'));
      obs.unobserve(entry.target);
    });
  },{threshold:.35});
  logos.forEach(logo=>observer.observe(logo));
});

// V54 — write the home signature only on the first Home entry of this browsing session.
document.addEventListener('DOMContentLoaded',()=>{
  const logo=document.querySelector('.home-body .logo-signature');
  if(!logo)return;
  const key='vb_home_signature_seen';
  let seen=false;
  try{seen=sessionStorage.getItem(key)==='1'}catch(e){}
  if(seen)return;
  try{sessionStorage.setItem(key,'1')}catch(e){}
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  requestAnimationFrame(()=>logo.classList.add('home-entry-ink'));
});

// V57 — seamless cross-document dissolve.
// Modern browsers use the native cross-document View Transition API: the old
// and new documents are composited at the same time, removing the navigation cut.
// The V56 veil remains only as a lightweight fallback for browsers without it.
(()=>{
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduced)return;

  const supportsCrossDocument = CSS.supports?.('view-transition-name: none') && ('ViewTransition' in window);

  // V58 — delayed loading indicator. It stays invisible during normal fast
  // navigation and appears only when the destination takes perceptibly longer.
  const loader=document.createElement('div');
  loader.className='page-load-indicator';
  loader.setAttribute('aria-hidden','true');
  loader.innerHTML='<span></span>';
  document.documentElement.appendChild(loader);
  let loaderTimer=0;
  const isInternalForLoader=(a)=>{
    if(!a||a.target==='_blank'||a.hasAttribute('download'))return false;
    const raw=a.getAttribute('href');
    if(!raw||raw.startsWith('#')||raw.startsWith('mailto:')||raw.startsWith('tel:')||raw.startsWith('javascript:'))return false;
    let url; try{url=new URL(a.href,location.href)}catch(e){return false}
    return url.origin===location.origin && !(url.pathname===location.pathname&&url.search===location.search) && /(?:\/|\.html)$/i.test(url.pathname);
  };
  document.addEventListener('click',e=>{
    if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
    const a=e.target.closest?.('a[href]');
    if(!isInternalForLoader(a))return;
    clearTimeout(loaderTimer);
    loaderTimer=window.setTimeout(()=>loader.classList.add('is-visible'),360);
  },{capture:true});
  window.addEventListener('pagehide',()=>clearTimeout(loaderTimer),{once:true});

  if(supportsCrossDocument)return;

  const veil=document.createElement('div');
  veil.className='page-transition-veil';
  veil.setAttribute('aria-hidden','true');
  document.documentElement.appendChild(veil);

  const arrivalKey='vb_page_transition_arrival';
  let arriving=false;
  try{arriving=sessionStorage.getItem(arrivalKey)==='1'}catch(e){}
  if(arriving){
    try{sessionStorage.removeItem(arrivalKey)}catch(e){}
    document.body.classList.add('page-transition-in');
    veil.classList.add('is-visible');
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      document.body.classList.add('is-visible');
      veil.classList.remove('is-visible');
    }));
    window.setTimeout(()=>document.body.classList.remove('page-transition-in','is-visible'),520);
  }

  const isInternalPageLink=(a)=>{
    if(!a||a.target==='_blank'||a.hasAttribute('download'))return false;
    const raw=a.getAttribute('href');
    if(!raw||raw.startsWith('#')||raw.startsWith('mailto:')||raw.startsWith('tel:')||raw.startsWith('javascript:'))return false;
    let url; try{url=new URL(a.href,location.href)}catch(e){return false}
    if(url.origin!==location.origin)return false;
    if(url.pathname===location.pathname&&url.search===location.search)return false;
    return /(?:\/|\.html)$/i.test(url.pathname);
  };

  document.addEventListener('click',e=>{
    if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
    const a=e.target.closest?.('a[href]');
    if(!isInternalPageLink(a))return;
    e.preventDefault();
    document.body.classList.add('page-transition-out');
    veil.classList.add('is-visible');
    try{sessionStorage.setItem(arrivalKey,'1')}catch(err){}
    window.setTimeout(()=>{location.href=a.href},300);
  });

  window.addEventListener('pageshow',e=>{
    if(!e.persisted)return;
    document.body.classList.remove('page-transition-out','page-transition-in','is-visible');
    veil.classList.remove('is-visible');
  });
})();
