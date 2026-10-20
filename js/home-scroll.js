(() => {
  const track = document.querySelector('.home-scroll-track');
  const editorial = document.querySelector('.home-editorial-panel');
  const final = document.querySelector('.home-final-panel');
  if (!track || !editorial || !final) return;

  // Reuse the exact four category cover images already configured for Portfolio.
  fetch('data/portfolio.json').then(r => r.json()).then(data => {
    const covers = { fashion:'fashionCover', commercial:'commercialCover', beauty:'beautyCover', digitals:'digitalsCover' };
    Object.entries(covers).forEach(([category, key]) => {
      const img = editorial.querySelector(`[data-home-panel="${category}"]`);
      if (img && data.featured?.[key]) img.src = data.featured[key];
    });
    const finalHero = data.homeExperience?.finalHero || data.featured?.home;
    if (finalHero) final.style.backgroundImage = `url("${finalHero}")`;
  }).catch(() => {});

  // Always start the Home on the original fullscreen hero, including reloads.
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  let pending = false;
  const clamp = n => Math.min(1, Math.max(0, n));
  function render() {
    pending = false;
    const viewport = track.querySelector('.home-scroll-stage').getBoundingClientRect().height;
    const traveled = -track.getBoundingClientRect().top;
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
  addEventListener('resize', schedule);
  addEventListener('pageshow', () => {
    window.scrollTo(0, 0);
    schedule();
  });
  render();
})();
