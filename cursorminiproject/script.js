// CrowdWatch — Crowd Density Estimation for Public Safety

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initDensityIndicator();
  initContactForm();
  initScrollEffects();
});

function initNav() {
  const toggle = document.querySelector('.nav__toggle');
  const links = document.querySelector('.nav__links');

  toggle?.addEventListener('click', () => {
    links?.classList.toggle('nav__links--open');
    toggle.setAttribute('aria-expanded', links?.classList.contains('nav__links--open'));
  });

  // Close mobile menu on link click (for anchor links)
  links?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => links.classList.remove('nav__links--open'));
  });
}

function initDensityIndicator() {
  const bar = document.querySelector('.density-indicator__bar');
  if (!bar) return;

  const densities = [45, 65, 78, 55, 72];
  let i = 0;

   const statValues = document.querySelectorAll('.hero__stats .stat__value');

   const formatPeople = (value) => {
     // Show in \"k\" format, e.g. 2430 -> \"2.4k\"
     return `${(value / 1000).toFixed(1)}k`;
   };

  const animate = () => {
    const density = densities[i];
    bar.style.setProperty('--bar-width', `${density}%`);

    if (statValues.length >= 3) {
      // Simulate people count between 1.8k and 3.6k
      const people = Math.floor(1800 + Math.random() * 1800);

      // Density label based on current density value
      let densityLabel = 'Moderate';
      if (density < 40) densityLabel = 'Low';
      else if (density >= 70) densityLabel = 'High';

      // Accuracy between 96.0% and 99.5%
      const accuracy = (96 + Math.random() * 3.5).toFixed(1) + '%';

      statValues[0].textContent = formatPeople(people);
      statValues[1].textContent = densityLabel;
      statValues[2].textContent = accuracy;
    }

    i = (i + 1) % densities.length;
  };

  // Initial animation after short delay
  setTimeout(animate, 500);
  setInterval(animate, 3000);
}

function initContactForm() {
  const form = document.querySelector('.contact__form');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Thank you for your interest! Our team will be in touch shortly.');
    form.reset();
  });
}

function initScrollEffects() {
  const nav = document.querySelector('.nav');
  let lastScroll = 0;

  window.addEventListener(
    'scroll',
    () => {
      const current = window.scrollY;
      if (current > 100) {
        nav?.classList.add('nav--scrolled');
      } else {
        nav?.classList.remove('nav--scrolled');
      }
      lastScroll = current;
    },
    { passive: true }
  );
}
