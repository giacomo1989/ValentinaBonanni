const qs=(s,p=document)=>p.querySelector(s), qsa=(s,p=document)=>[...p.querySelectorAll(s)];
// V65 — when a Portfolio category has already been rendered/preloaded behind the signature,
// suppress its second entrance choreography after URL hand-off.
let vbCategoryPreparedArrival=false;
try{
  const prepared=sessionStorage.getItem('vb_category_prepared');
  const here=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  if(prepared&&prepared.toLowerCase()===here){
    vbCategoryPreparedArrival=true;
    sessionStorage.removeItem('vb_category_prepared');
    document.documentElement.classList.add('category-prepared-arrival');
  }
}catch(_){}
async function getJSON(path){const r=await fetch(path);if(!r.ok)throw new Error(path);return r.json()}
function pathRoot(){return document.body.dataset.root||'.'}
async function applyI18n(){const root=pathRoot(),lang=localStorage.getItem('vb_lang')||'en';let t;try{t=await getJSON(`${root}/data/${lang}.json`)}catch{return}qsa('[data-i18n]').forEach(el=>{const v=el.dataset.i18n.split('.').reduce((o,k)=>o?.[k],t);if(v!==undefined)el.textContent=v});qsa('[data-lang]').forEach(b=>b.classList.toggle('active',b.dataset.lang===lang));}
async function applyImages(){const root=pathRoot();let d;try{d=await getJSON(`${root}/data/portfolio.json`)}catch{return}qsa('[data-featured]').forEach(el=>{const src=d.featured[el.dataset.featured];if(!src)return; if(el.tagName==='IMG'){const cover=el.closest('.cover');if(cover){cover.classList.add('cover-image-loading');if(!cover.querySelector('.cover-loading-signature')){const loader=document.createElement('img');loader.className='cover-loading-signature';loader.src=`${root}/assets/images/logo/valentina-bonanni-signature.png`;loader.alt='';loader.setAttribute('aria-hidden','true');cover.insertBefore(loader,el)}}const loaded=()=>{cover?.classList.remove('cover-image-loading','cover-image-error');cover?.classList.add('cover-image-loaded')};const failed=()=>{cover?.classList.remove('cover-image-loading','cover-image-loaded');cover?.classList.add('cover-image-error')};el.addEventListener('load',loaded,{once:true});el.addEventListener('error',failed,{once:true});el.src=`${root}/${src}`;if(el.complete&&el.naturalWidth>0)loaded()}else el.style.backgroundImage=`url('${root}/${src}')`});const gallery=qs('[data-gallery]');if(gallery){const cat=gallery.dataset.gallery;gallery.innerHTML=d.portfolio.filter(x=>x.category===cat).map(x=>`<figure class="gallery-item ${x.layout||'portrait'}"><img src="${root}/${x.src}" alt="${x.alt}" loading="${vbCategoryPreparedArrival?'eager':'lazy'}" onerror="this.parentElement.style.display='none'"></figure>`).join(''); if(vbCategoryPreparedArrival){gallery.querySelectorAll('.gallery-item').forEach(el=>el.classList.add('is-visible'))}else{initImageReveal(gallery.querySelectorAll('.gallery-item'))} initGalleryParallax(gallery); initGalleryLightbox(gallery)}}
document.addEventListener('click',e=>{const b=e.target.closest('[data-lang]');if(b){localStorage.setItem('vb_lang',b.dataset.lang);applyI18n()}const m=e.target.closest('.menu-toggle');if(m)qs('.nav')?.classList.toggle('open')});
document.addEventListener('DOMContentLoaded',()=>{
  // Always initialise the destination normally. For a category hand-off the gallery is eager
  // and immediately visible underneath the fixed cover; the cover duration never waits on images.
  Promise.all([applyI18n(),applyImages()]);
  if(vbCategoryPreparedArrival){
    let started=Date.now();
    try{started=Number(sessionStorage.getItem('vb_category_transition_started'))||started;sessionStorage.removeItem('vb_category_transition_started')}catch(_){}
    const remaining=Math.max(0,4000-(Date.now()-started));
    // Freeze the document at the top while the cover is present, then release without a layout shift.
    window.scrollTo(0,0);
    document.documentElement.classList.add('category-transition-lock');
    window.setTimeout(()=>{
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        document.documentElement.classList.add('category-cover-release');
        window.setTimeout(()=>{
          document.documentElement.classList.remove('category-cover-arrival','category-cover-release','category-prepared-arrival','category-transition-lock');
        },680);
      }));
    },remaining);
  }
});

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
    const isMobilePortfolioCheck=window.matchMedia('(max-width: 800px)').matches;
    if(!isMobilePortfolioCheck){
      cover.style.transitionDelay=(i*620)+'ms';
    } else {
      cover.style.transitionDelay=(i*400)+'ms';
    }
    const img=cover.querySelector('img');
    if(img) img.style.transitionDelay=(i*120)+'ms';
  });
  const grid=covers[0].closest('.portfolio-covers-four');
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(!entry.isIntersecting)return;
      if(grid.dataset.cinematicStarted==='1')return;
      grid.dataset.cinematicStarted='1';
      observer.disconnect();
      const isMobilePortfolio=window.matchMedia('(max-width: 800px)').matches;
      // On mobile give the browser one real painted frame with the cards off-screen
      // before starting the transform. Without this, the initial and final transforms
      // can be committed in the same paint and the side entrance is not visible.
      if(isMobilePortfolio){
        window.setTimeout(()=>covers.forEach(cover=>cover.classList.add('cinematic-visible')),0);
      }else{
        covers.forEach(cover=>cover.classList.add('cinematic-visible'));
      }

      // Desktop only: once the last entrance animation is complete, wait 1s,
      // then restore colour one cover at a time at 1s intervals.
      if(!isMobilePortfolio){
        const entranceDuration=1200;
        const lastEntranceDelay=(covers.length-1)*120;
        const firstColourAt=entranceDuration+lastEntranceDelay+1000;
        // Move a clean, full-colour zoom focus across the covers.
        // When focus leaves a cover it stays in colour, but returns to the normal muted rest state.
        covers.forEach((cover,i)=>{
          const focusAt=firstColourAt+(i*1000);
          window.setTimeout(()=>{
            cover.classList.add('portfolio-color-revealed','portfolio-auto-focus');
            if(i>0) covers[i-1].classList.remove('portfolio-auto-focus');
          },focusAt);
        });
        window.setTimeout(()=>covers[covers.length-1].classList.remove('portfolio-auto-focus'),firstColourAt+(covers.length*1000));
      } else {
        // Mobile: alternate entrances from left/right. Once all four cards are in,
        // reveal their real colour in order: Fashion, Commercial, Beauty, Digitals.
        const entranceDuration=900;
        const lastEntranceDelay=(covers.length-1)*120;
        const firstColourAt=900+entranceDuration+lastEntranceDelay;
        covers.forEach((cover,i)=>{
          const focusAt=firstColourAt+(i*1000);
          window.setTimeout(()=>{
            cover.classList.add('portfolio-color-revealed','portfolio-mobile-focus');
            if(i>0) covers[i-1].classList.remove('portfolio-mobile-focus');
          },focusAt);
        });
        window.setTimeout(()=>covers[covers.length-1].classList.remove('portfolio-mobile-focus'),firstColourAt+(covers.length*1000));
      }

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
    const status=document.getElementById('contactFormStatus');
    if(form&&status)form.addEventListener('submit',async e=>{
      e.preventDefault();
      status.textContent='';
      status.classList.remove('is-visible','is-error');
      const submit=form.querySelector('button[type="submit"]');
      if(submit)submit.disabled=true;
      try{
        const response=await fetch(form.action,{method:'POST',body:new FormData(form),headers:{Accept:'application/json'}});
        if(!response.ok)throw new Error('Formspree submission failed');
        form.reset();
        status.textContent='Messaggio inviato';
        status.classList.add('is-visible');
      }catch(err){
        status.textContent='Invio non riuscito. Riprova.';
        status.classList.add('is-visible','is-error');
      }finally{
        if(submit)submit.disabled=false;
      }
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
  const photoEl=card.querySelector('.agency-card-photo');
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
    const gap=window.innerWidth<=800?12:28, pad=10;
    let left, top;
    if(window.innerWidth<=800){
      // On touch screens keep the card inside the map regardless of marker proximity to an edge.
      left=Math.max(pad,Math.min(mx-cardW/2,mapRect.width-cardW-pad));
      top=my-cardH-gap;
      if(top<pad) top=my+gap;
      top=Math.max(pad,Math.min(top,mapRect.height-cardH-pad));
    }else{
      left=mx+gap;
      if(left+cardW>mapRect.width-pad) left=mx-cardW-gap;
      left=Math.max(pad,Math.min(left,mapRect.width-cardW-pad));
      top=my-cardH/2;
      top=Math.max(pad,Math.min(top,mapRect.height-cardH-pad));
    }
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
    if(photoEl && marker.dataset.photo){
      photoEl.src=marker.dataset.photo;
      photoEl.alt=`${marker.dataset.city} profile`;
    }
    if(marker.dataset.url){linkEl.href=marker.dataset.url;linkEl.classList.remove('is-disabled');linkEl.removeAttribute('aria-disabled');}
    else{linkEl.href='#';linkEl.classList.add('is-disabled');linkEl.setAttribute('aria-disabled','true');}
    card.classList.add('is-visible');
    requestAnimationFrame(()=>placeCard(marker));
  };
  markers.forEach(marker=>{
    // Hover behavior only exists on real pointer devices. On touch screens a
    // synthetic mouseenter can fire before click, which made the first tap
    // open and immediately close the card (appearing to require two taps).
    marker.addEventListener('mouseenter',()=>{if(fineHover.matches)show(marker)});
    marker.addEventListener('mouseleave',()=>{if(fineHover.matches)scheduleHide()});
    marker.querySelector('button').addEventListener('click',(event)=>{
      event.preventDefault();
      event.stopPropagation();
      if(fineHover.matches && marker.classList.contains('is-active') && card.classList.contains('is-visible')) hide();
      else show(marker);
    });
  });
  card.addEventListener('mouseenter',cancelHide);
  card.addEventListener('mouseleave',scheduleHide);
  map.addEventListener('mouseleave',scheduleHide);

  // V63 — touch/mobile popover behaviour: one tap outside the open card closes it.
  // Marker taps are stopped above, so tapping another marker opens that card directly.
  document.addEventListener('pointerdown',(event)=>{
    if(fineHover.matches || !card.classList.contains('is-visible')) return;
    if(card.contains(event.target)) return;
    if(event.target.closest('.agency-marker')) return;
    hide();
  });

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
  const order = ['barcelona','madrid','milan','london','stockholm'];
  const markers = order.map(city => section.querySelector('.marker-' + city)).filter(Boolean);
  let markerTimers = [];

  const clearMarkerTimers = () => {
    markerTimers.forEach(clearTimeout);
    markerTimers = [];
  };
  const resetMarkers = () => markers.forEach(marker => marker.classList.remove('is-sequenced'));
  const revealMarkers = () => {
    clearMarkerTimers();
    markers.forEach((marker, index) => {
      markerTimers.push(setTimeout(() => marker.classList.add('is-sequenced'), 4200 + index * 420));
    });
  };

  if (reducedMotion || !('IntersectionObserver' in window)) {
    section.classList.add('is-map-drawn');
    markers.forEach(marker => marker.classList.add('is-sequenced'));
    return;
  }

  section.classList.add('representation-sequence-ready');
  resetMarkers();

  let wasVisible = false;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const visible = entry.isIntersecting && entry.intersectionRatio >= 0.22;
      if (visible && !wasVisible) {
        // Restart the map, then reveal Barcelona → Madrid → Milan → London → Stockholm.
        section.classList.remove('is-map-drawn');
        resetMarkers();
        void section.offsetWidth;
        section.classList.add('is-map-drawn');
        revealMarkers();
      } else if (!entry.isIntersecting) {
        clearMarkerTimers();
        resetMarkers();
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
  if (vbCategoryPreparedArrival && document.querySelector('.gallery-page')) return;
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

// V60 — editorial lightbox with reliable touch/pointer swipe and animated photo changes.
function initGalleryLightbox(root=document){
  const gallery=root.matches?.('[data-gallery]')?root:root.querySelector?.('[data-gallery]');
  if(!gallery || gallery.dataset.lightboxBound==='1')return;
  gallery.dataset.lightboxBound='1';
  const items=[...gallery.querySelectorAll('.gallery-item')];
  if(!items.length)return;

  const overlay=document.createElement('div');
  overlay.className='gallery-lightbox';
  overlay.setAttribute('role','dialog'); overlay.setAttribute('aria-modal','true'); overlay.setAttribute('aria-label','Gallery viewer');
  overlay.innerHTML=`<div class="gallery-lightbox-stage"><button class="gallery-lightbox-close" type="button" aria-label="Close">×</button><div class="gallery-lightbox-viewer"><button class="gallery-lightbox-nav gallery-lightbox-prev" type="button" aria-label="Previous image"><svg viewBox="0 0 28 48" aria-hidden="true"><path d="M22 5L7 24l15 19"/></svg></button><div class="gallery-lightbox-photo"><img class="gallery-lightbox-image" alt=""></div><button class="gallery-lightbox-nav gallery-lightbox-next" type="button" aria-label="Next image"><svg viewBox="0 0 28 48" aria-hidden="true"><path d="M6 5l15 19L6 43"/></svg></button></div></div>`;
  document.body.appendChild(overlay);
  const photo=overlay.querySelector('.gallery-lightbox-photo'), image=overlay.querySelector('.gallery-lightbox-image');
  const closeBtn=overlay.querySelector('.gallery-lightbox-close'), prevBtn=overlay.querySelector('.gallery-lightbox-prev'), nextBtn=overlay.querySelector('.gallery-lightbox-next');
  let index=0,lastFocus=null,startX=null,startY=null,animating=false;
  const sourceAt=i=>items[(i+items.length)%items.length].querySelector('img');
  const setImage=i=>{ index=(i+items.length)%items.length; const src=sourceAt(index); if(src){image.src=src.currentSrc||src.src;image.alt=src.alt||'';} };
  const change=(nextIndex,direction)=>{
    if(animating)return; const target=(nextIndex+items.length)%items.length; if(target===index)return;
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){setImage(target);return;}
    animating=true; photo.classList.remove('slide-in-left','slide-in-right'); photo.classList.add(direction>0?'slide-out-left':'slide-out-right');
    window.setTimeout(()=>{setImage(target);photo.classList.remove('slide-out-left','slide-out-right');photo.classList.add(direction>0?'slide-in-right':'slide-in-left');requestAnimationFrame(()=>requestAnimationFrame(()=>photo.classList.remove('slide-in-right','slide-in-left')));window.setTimeout(()=>animating=false,390);},210);
  };
  const open=i=>{lastFocus=document.activeElement;setImage(i);overlay.classList.add('is-open');document.body.classList.add('lightbox-open');requestAnimationFrame(()=>closeBtn.focus({preventScroll:true}));};
  const close=()=>{overlay.classList.remove('is-open');document.body.classList.remove('lightbox-open');if(lastFocus?.focus)lastFocus.focus({preventScroll:true});};
  const prev=()=>change(index-1,-1), next=()=>change(index+1,1);
  items.forEach((item,i)=>{item.tabIndex=0;item.setAttribute('role','button');item.setAttribute('aria-label','Open image');item.addEventListener('click',()=>open(i));item.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open(i)}})});
  closeBtn.addEventListener('click',e=>{e.stopPropagation();close()}); prevBtn.addEventListener('click',e=>{e.stopPropagation();prev()}); nextBtn.addEventListener('click',e=>{e.stopPropagation();next()});
  overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
  document.addEventListener('keydown',e=>{if(!overlay.classList.contains('is-open'))return;if(e.key==='Escape')close();else if(e.key==='ArrowLeft')prev();else if(e.key==='ArrowRight')next()});
  const swipeStart=(x,y)=>{startX=x;startY=y};
  const swipeEnd=(x,y)=>{if(startX===null)return;const dx=x-startX,dy=y-startY;startX=startY=null;if(Math.abs(dx)>=38&&Math.abs(dx)>Math.abs(dy)*1.15)(dx>0?prev:next)();};
  photo.addEventListener('touchstart',e=>{const t=e.changedTouches[0];if(t)swipeStart(t.clientX,t.clientY)},{passive:true});
  photo.addEventListener('touchend',e=>{const t=e.changedTouches[0];if(t)swipeEnd(t.clientX,t.clientY)},{passive:true});
  photo.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'){swipeStart(e.clientX,e.clientY);try{photo.setPointerCapture(e.pointerId)}catch(_){}}});
  photo.addEventListener('pointerup',e=>{if(e.pointerType==='touch')swipeEnd(e.clientX,e.clientY)});
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

// Home signature — replay the ink drawing every time Home is entered/loaded.
document.addEventListener('DOMContentLoaded',()=>{
  const logo=document.querySelector('.home-body .logo-signature');
  if(!logo)return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  logo.classList.remove('home-entry-ink');
  requestAnimationFrame(()=>requestAnimationFrame(()=>logo.classList.add('home-entry-ink')));
});

// V80 — robust real-document hand-off for Portfolio/category navigation.
// We deliberately use a normal HTML navigation (no fetch/body replacement). The destination
// paints behind the same signature cover for a fixed 4 seconds measured from the click.
document.addEventListener('DOMContentLoaded',()=>{
  if(!document.body.querySelector('.portfolio-page, .gallery-page'))return;
  const isCategoryTransitionLink=(a)=>{
    if(!a || !a.matches('.portfolio-covers a.cover[href], .gallery-page .mobile-gallery-tabs a[href]')) return false;
    return /\/(fashion|commercial|digitals|beauty)\.html$|^(fashion|commercial|digitals|beauty)\.html$/i.test(a.getAttribute('href')||'');
  };
  document.addEventListener('click',e=>{
    const a=e.target.closest?.('a[href]');
    if(!isCategoryTransitionLink(a))return;
    if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
    const href=a.getAttribute('href');
    try{
      const target=new URL(href,location.href).pathname.split('/').pop().toLowerCase();
      sessionStorage.setItem('vb_category_prepared',target);
      sessionStorage.setItem('vb_category_transition_started',String(Date.now()));
    }catch(_){}
    // Do not preventDefault: Safari performs a genuine document navigation.
  },true);
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

// V80 — Home: after 1s the dark veil fades in for 2s; Europe starts at 3s; copy remains visible.
document.addEventListener('DOMContentLoaded',()=>{
  const body=document.body;
  const overlay=document.querySelector('.home-map-overlay');
  const rep=overlay?.querySelector('.home-hero-representation');
  if(!overlay||!rep)return;

  const order=['barcelona','madrid','milan','london','stockholm'];
  const markers=order.map(city=>overlay.querySelector('.marker-'+city)).filter(Boolean);
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const timers=[];

  const reveal=()=>{
    body.classList.add('home-map-active');
    rep.classList.remove('is-map-drawn');
    void rep.offsetWidth;
    rep.classList.add('is-map-drawn');

    if(reduced){
      markers.forEach(m=>m.classList.add('is-sequenced'));
      return;
    }

    // First draw Europe, then reveal Barcelona → Madrid → Milan → London → Stockholm.
    markers.forEach((m,i)=>timers.push(setTimeout(()=>m.classList.add('is-sequenced'),4200+i*420)));
  };

  if(reduced){
    body.classList.add('home-veil-active');
    reveal();
  }else{
    // Let the untouched hero breathe for 1s, then darken it smoothly over 2s.
    timers.push(setTimeout(()=>body.classList.add('home-veil-active'),1000));
    // Start drawing Europe exactly as the 2s veil transition completes.
    timers.push(setTimeout(reveal,3000));
  }
});
