(() => {
  const hero = document.querySelector('.home-body .home-hero');
  const layerA = hero?.querySelector('.home-carousel-layer-a');
  const layerB = hero?.querySelector('.home-carousel-layer-b');
  if (!hero || !layerA || !layerB) return;

  const mq = window.matchMedia('(max-width: 800px)');
  const sets = {
    mobile: [
      'assets/images/home/hero-home-mobile.jpg',
      'assets/images/carusel/1_carusel_mobile.jpg',
      'assets/images/carusel/2_carusel_mobile.jpg'
    ],
    desktop: [
      'assets/images/home/hero.jpg',
      'assets/images/carusel/1_carusel_desktop.jpg',
      'assets/images/carusel/2_carusel_desktop.jpg'
    ]
  };

  const CHANGE_MS = 3000;
  let images = mq.matches ? sets.mobile : sets.desktop;
  let index = 0;
  let front = layerA;
  let back = layerB;

  [...sets.mobile, ...sets.desktop].forEach(src => {
    const img = new Image();
    img.src = src;
  });

  function setImage(layer, src) {
    layer.style.backgroundImage = `url("${src}")`;
  }

  function reset() {
    images = mq.matches ? sets.mobile : sets.desktop;
    index = 0;
    setImage(front, images[0]);
    front.classList.add('is-visible');
    back.classList.remove('is-visible');
  }

  function nextImage() {
    const nextIndex = (index + 1) % images.length;
    const img = new Image();
    img.onload = () => {
      setImage(back, images[nextIndex]);
      back.classList.add('is-visible');
      front.classList.remove('is-visible');
      [front, back] = [back, front];
      index = nextIndex;
    };
    img.src = images[nextIndex];
  }

  reset();
  window.setInterval(nextImage, CHANGE_MS);
  mq.addEventListener?.('change', reset);
})();
