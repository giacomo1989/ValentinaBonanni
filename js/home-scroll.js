(() => {
  const track = document.querySelector('.home-scroll-track');
  const editorial = document.querySelector('.home-editorial-panel');
  const final = document.querySelector('.home-final-panel');
  if (!track || !editorial || !final) return;

  // Use the exact same footer markup on both the opening and final heroes.
  const originalFooter = track.querySelector('.home-hero .home-footer');
  const finalFooterHost = final.querySelector('.home-final-footer');
  if (originalFooter && finalFooterHost) {
    const footer = originalFooter.cloneNode(true);
    footer.removeAttribute('aria-label');
    finalFooterHost.appendChild(footer);
  }

  // Reuse the original desktop signature, role and Portfolio CTA in the final hero.
  // Cloning preserves the exact markup, typography, translations and link.
  const originalIdentity = track.querySelector('.home-hero > .home-identity');
  const finalIdentityHost = final.querySelector('.home-final-identity');
  if (originalIdentity && finalIdentityHost) {
    finalIdentityHost.appendChild(originalIdentity.cloneNode(true));
  }

  // Reuse the exact four category cover images already configured for Portfolio.
  fetch('data/portfolio.json').then(r => r.json()).then(data => {
    const covers = { fashion:'fashionCover', commercial:'commercialCover', beauty:'beautyCover', digitals:'digitalsCover' };
    Object.entries(covers).forEach(([category, key]) => {
      const img = editorial.querySelector(`[data-home-panel="${category}"]`);
      if (img && data.featured?.[key]) img.src = data.featured[key];
    });
    // Desktop and mobile final hero are independently configurable in portfolio.json.
    const mobileQuery = window.matchMedia('(max-width: 800px)');
    const updateFinalHero = () => {
      const settings = data.homeExperience || {};
      const finalHero = mobileQuery.matches
        ? (settings.finalHeroMobile || settings.finalHeroDesktop || settings.finalHero || data.featured?.home)
        : (settings.finalHeroDesktop || settings.finalHero || data.featured?.home);
      if (finalHero) final.style.backgroundImage = `url("${finalHero}")`;
    };
    updateFinalHero();
    mobileQuery.addEventListener?.('change', updateFinalHero);
  }).catch(() => {});

  // The discreet arrow takes the visitor to the fully revealed four-card panel.
  const scrollCue = track.querySelector('.home-scroll-cue');
  scrollCue?.addEventListener('click', () => {
    const stageHeight = track.querySelector('.home-scroll-stage').getBoundingClientRect().height;
    const top = track.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + stageHeight, behavior: 'smooth' });
  });

  // Always start the Home on the original fullscreen hero, including reloads.
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  // Safari iOS collapses/expands its browser chrome during scrolling.
  // Freeze the scroll geometry across height-only resizes; update it when
  // the device rotates or when the layout width actually changes.
  const stage = track.querySelector('.home-scroll-stage');
  let geometryWidth = document.documentElement.clientWidth;
  let stableViewport = stage.getBoundingClientRect().height;
  let stableTrackTop = track.getBoundingClientRect().top + window.scrollY;
  function refreshGeometry() {
    geometryWidth = document.documentElement.clientWidth;
    stableViewport = stage.getBoundingClientRect().height;
    stableTrackTop = track.getBoundingClientRect().top + window.scrollY;
  }
  let pending = false;
  const clamp = n => Math.min(1, Math.max(0, n));
  function render() {
    pending = false;
    const viewport = stableViewport;
    const traveled = window.scrollY - stableTrackTop;
    const progress = clamp(traveled / (2 * viewport));
    // The editorial panel must not be visible until scrolling actually begins.
    track.classList.toggle('home-scroll-active', traveled > 1);
    // Phase 1: the four-photo strip enters as one block and stops at 30vh.
    // Phase 2: the entire strip exits upwards, while the final hero follows
    // immediately behind it (never underneath / overlapping the photos).
    const phase1 = clamp(progress * 2);
    const phase2 = clamp((progress - .5) * 2);
    const editorialTop = viewport * (1 - .7 * phase1 - phase2);
    // The final photograph stays fixed in the viewport: uncover its BOTTOM
    // first as the editorial strip moves upwards. Never scroll the photo itself.
    const revealBoundary = Math.max(0, Math.min(viewport, editorialTop + viewport * .7));
    editorial.style.transform = `translate3d(0, ${editorialTop}px, 0)`;
    final.style.transform = 'none';
    final.style.clipPath = `inset(${(revealBoundary / viewport) * 100}% 0 0 0)`;
  }
  function schedule() { if (!pending) { pending = true; requestAnimationFrame(render); } }
  addEventListener('scroll', schedule, { passive:true });
  addEventListener('resize', () => {
    if (document.documentElement.clientWidth !== geometryWidth) refreshGeometry();
    schedule();
  });
  addEventListener('orientationchange', () => { setTimeout(() => { refreshGeometry(); schedule(); }, 350); });
  addEventListener('pageshow', () => {
    window.scrollTo(0, 0);
    refreshGeometry();
    schedule();
  });
  render();
})();
