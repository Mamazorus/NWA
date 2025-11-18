const lenis = new Lenis({
  autoRaf: true,
});

// Gestion du menu burger
const navbar = document.querySelector('.navbar');
const burgerIcon = document.querySelector('.burger-icon');

// Toggle du menu au hover (on simule avec mouseenter/mouseleave)
navbar.addEventListener('mouseenter', () => {
  navbar.classList.add('open');
});

navbar.addEventListener('mouseleave', () => {
  navbar.classList.remove('open');
});

// Sur mobile, on utilise le clic
if (window.innerWidth <= 768) {
  burgerIcon.addEventListener('click', (e) => {
    e.stopPropagation();
    navbar.classList.toggle('open');
  });

  // Fermer le menu quand on clique sur un lien
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
      navbar.classList.remove('open');
    });
  });

  // Fermer le menu si on clique en dehors
  document.addEventListener('click', (e) => {
    if (!navbar.contains(e.target)) {
      navbar.classList.remove('open');
    }
  });
}

// Animation de l'indicateur de navigation
const navLinks = document.querySelectorAll('.nav-links a');
const indicator = document.querySelector('.nav-indicator');

navLinks.forEach(link => {
  link.addEventListener('mouseenter', (e) => {
    const linkRect = e.target.getBoundingClientRect();
    const navLinksRect = document.querySelector('.nav-links').getBoundingClientRect();
    
    indicator.style.width = `${linkRect.width}px`;
    indicator.style.left = `${linkRect.left - navLinksRect.left}px`;
    indicator.style.opacity = '1';
  });
});

document.querySelector('.nav-links').addEventListener('mouseleave', () => {
  indicator.style.opacity = '0';
});

// Smooth continuous carousel (JS-driven) to avoid visible jump at loop reset
// Replaces CSS animation on each `.carousel-track` after images load.
function initSmoothCarousels() {
  const tracks = document.querySelectorAll('.carousel-track');

  tracks.forEach(track => {
    // Read intended duration from CSS animation-duration if present
    const style = getComputedStyle(track);
    let duration = 0;
    if (style.animationName && style.animationName !== 'none') {
      const dur = style.animationDuration || '';
      if (dur.endsWith('ms')) duration = parseFloat(dur) / 1000;
      else if (dur.endsWith('s')) duration = parseFloat(dur);
    }

    // If no duration found, fallback to 80s for front-row, 120s for back-row
    if (!duration || isNaN(duration) || duration <= 0) {
      if (track.closest('.front-row')) duration = 80;
      else duration = 120;
    }

    // Disable CSS animation to avoid conflict
    track.style.animation = 'none';

    // Ensure GPU hints
    track.style.willChange = 'transform';

    // We'll compute group width after images/layout complete
    function start() {
      const children = Array.from(track.children);
      if (children.length < 2) return;
      const half = Math.floor(children.length / 2);

      // compute group width precisely as horizontal distance from first item
      // to the first item of the duplicated group (handles gaps and negative margins)
      let groupWidth = 0;
      const firstRect = children[0].getBoundingClientRect();
      const nextGroupFirst = children[half];
      if (nextGroupFirst) {
        const nextRect = nextGroupFirst.getBoundingClientRect();
        groupWidth = Math.abs(nextRect.left - firstRect.left);
      }

      // Fallback if we failed to compute: use half of scrollWidth
      if (!groupWidth || isNaN(groupWidth) || groupWidth <= 0) {
        const totalWidth = track.scrollWidth || 0;
        groupWidth = totalWidth / 2 || 0;
      }
      if (!groupWidth) return;

      const speed = groupWidth / duration; // pixels per second
      let offset = 0;
      let last = performance.now();

      function step(now) {
        const dt = (now - last) / 1000;
        last = now;
        offset = (offset + speed * dt) % groupWidth; // keep in [0, groupWidth)
        // Apply transform with subpixel precision
        track.style.transform = `translate3d(${-offset}px,0,0)`;
        requestAnimationFrame(step);
      }

      requestAnimationFrame(step);
    }

    // If images may still be loading, wait for load; otherwise start now
    if (document.readyState === 'complete') {
      // small timeout to ensure layout
      setTimeout(start, 50);
    } else {
      window.addEventListener('load', () => setTimeout(start, 50));
    }
  });
}

initSmoothCarousels();