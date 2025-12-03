// ============================================
// GSAP + ScrollTrigger + ScrollToPlugin
// ============================================
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

// ============================================
// LENIS - Smooth Scroll
// ============================================
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  orientation: 'vertical',
  smoothWheel: true,
});

// Synchroniser Lenis avec ScrollTrigger
lenis.on('scroll', ScrollTrigger.update);

gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});

gsap.ticker.lagSmoothing(0);

// ============================================
// CHAPTER MUSIC MANAGER
// ============================================
const ChapterMusicManager = {
  audioElements: new Map(),
  currentChapter: null,
  currentAudio: null,
  fadeDuration: 1000,
  isUserInteracted: false,
  
  init() {
    const sections = document.querySelectorAll('.horizontal-section[data-music]');
    
    sections.forEach(section => {
      const musicSrc = section.getAttribute('data-music');
      const audio = new Audio(musicSrc);
      audio.loop = true;
      audio.volume = 0;
      audio.preload = 'auto';
      
      this.audioElements.set(section.id, {
        audio: audio,
        startTime: parseFloat(section.getAttribute('data-music-start')) || 0,
        targetVolume: parseFloat(section.getAttribute('data-music-volume')) || 0.6
      });
    });
    
    // Débloquer l'audio après interaction utilisateur
    const unlockAudio = () => {
      if (this.isUserInteracted) return;
      this.isUserInteracted = true;
      
      // Précharger tous les audios
      this.audioElements.forEach(({ audio }) => {
        audio.muted = true;
        audio.play().then(() => {
          audio.pause();
          audio.currentTime = 0;
          audio.muted = false;
        }).catch(() => {});
      });
      
      // Si on est déjà dans un chapitre, jouer la musique
      if (this.currentChapter) {
        this.playChapterMusic(this.currentChapter);
      }
    };
    
    document.addEventListener('click', unlockAudio, { once: true });
    document.addEventListener('touchstart', unlockAudio, { once: true });
    document.addEventListener('keydown', unlockAudio, { once: true });
  },
  
  fadeTo(audio, targetVolume, duration, callback) {
    if (!audio) return;
    
    if (audio._fadeInterval) {
      clearInterval(audio._fadeInterval);
    }
    
    const startVolume = audio.volume;
    const volumeDiff = targetVolume - startVolume;
    const steps = duration / 20;
    const volumeStep = volumeDiff / steps;
    let currentStep = 0;
    
    audio._fadeInterval = setInterval(() => {
      currentStep++;
      audio.volume = Math.max(0, Math.min(1, startVolume + (volumeStep * currentStep)));
      
      if (currentStep >= steps) {
        clearInterval(audio._fadeInterval);
        audio._fadeInterval = null;
        audio.volume = targetVolume;
        if (callback) callback();
      }
    }, 20);
  },
  
  playChapterMusic(chapterId) {
    if (!this.isUserInteracted) {
      this.currentChapter = chapterId;
      return;
    }
    
    const chapterData = this.audioElements.get(chapterId);
    if (!chapterData) return;
    
    // Si c'est le même chapitre, ne rien faire
    if (this.currentAudio === chapterData.audio && !chapterData.audio.paused) {
      return;
    }
    
    // Fade out l'audio actuel
    if (this.currentAudio && this.currentAudio !== chapterData.audio) {
      const oldAudio = this.currentAudio;
      this.fadeTo(oldAudio, 0, this.fadeDuration, () => {
        oldAudio.pause();
      });
    }
    
    // Jouer le nouvel audio
    const { audio, startTime, targetVolume } = chapterData;
    
    if (audio.paused) {
      audio.currentTime = startTime;
      audio.volume = 0;
      audio.play().catch(() => {});
    }
    
    this.fadeTo(audio, targetVolume, this.fadeDuration);
    this.currentAudio = audio;
    this.currentChapter = chapterId;
  },
  
  stopAllMusic() {
    if (this.currentAudio) {
      this.fadeTo(this.currentAudio, 0, this.fadeDuration, () => {
        this.currentAudio.pause();
      });
    }
    this.currentChapter = null;
    this.currentAudio = null;
  }
};

// ============================================
// SCROLL HORIZONTAL SECTIONS
// ============================================
function initHorizontalSections() {
  const sections = document.querySelectorAll('.horizontal-section');
  
  sections.forEach((section, index) => {
    const track = section.querySelector('.horizontal-track');
    const blocks = section.querySelectorAll('.content-block');
    const parallaxSets = section.querySelectorAll('.parallax-set');
    
    if (!track) return;
    
    // Calculer la distance à parcourir
    const getScrollAmount = () => {
      return track.scrollWidth - window.innerWidth;
    };
    
    // Créer l'animation du track horizontal
    const tween = gsap.to(track, {
      x: () => -getScrollAmount(),
      ease: 'none',
    });
    
    // ScrollTrigger qui pin la section et lie le scroll vertical au mouvement horizontal
    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: () => `+=${getScrollAmount()}`,
      pin: true,
      animation: tween,
      scrub: 1,
      invalidateOnRefresh: true,
      anticipatePin: 1,
      onEnter: () => {
        ChapterMusicManager.playChapterMusic(section.id);
      },
      onEnterBack: () => {
        ChapterMusicManager.playChapterMusic(section.id);
      },
      onLeave: () => {
        // Optionnel: arrêter la musique en quittant
      },
      onLeaveBack: () => {
        // Optionnel: arrêter la musique en quittant vers le haut
      }
    });
    
    // Animation d'apparition des blocs
    blocks.forEach((block, blockIndex) => {
      const style = window.getComputedStyle(block);
      const matrix = new DOMMatrix(style.transform);
      const originalY = matrix.m42;
      
      gsap.fromTo(block,
        {
          opacity: 0,
          y: originalY + 60,
          scale: 0.95,
        },
        {
          opacity: 1,
          y: originalY,
          scale: 1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: block,
            containerAnimation: tween,
            start: 'left 80%',
            end: 'left 50%',
            scrub: 0.5,
          }
        }
      );
      
      // Changement d'images parallax
      const triggerSet = block.getAttribute('data-trigger-set');
      if (triggerSet && parallaxSets.length > 0) {
        ScrollTrigger.create({
          trigger: block,
          containerAnimation: tween,
          start: 'left 60%',
          end: 'left 40%',
          onEnter: () => switchParallaxSet(section, triggerSet),
          onEnterBack: () => {
            const prevSet = parseInt(triggerSet) - 1;
            if (prevSet >= 1) {
              switchParallaxSet(section, prevSet.toString());
            }
          },
        });
      }
    });
  });
  
  function switchParallaxSet(section, setNumber) {
    const sets = section.querySelectorAll('.parallax-set');
    sets.forEach(set => {
      if (set.getAttribute('data-set') === setNumber) {
        set.classList.add('active');
      } else {
        set.classList.remove('active');
      }
    });
  }
  
  window.addEventListener('load', () => {
    ScrollTrigger.refresh();
  });
  
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 250);
  });
}

// ============================================
// NAVIGATION SMOOTH SCROLL
// ============================================
function initNavigation() {
  const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
  
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      const targetId = link.getAttribute('href');
      const targetSection = document.querySelector(targetId);
      
      if (!targetSection) return;
      
      // Fermer la navbar sur mobile
      const navbar = document.querySelector('.navbar');
      if (navbar) navbar.classList.remove('open');
      
      // Utiliser Lenis pour le smooth scroll
      lenis.scrollTo(targetSection, {
        duration: 2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });
    });
  });
}

// ============================================
// PARALLAX LAYERS
// ============================================
function initParallaxLayers() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const sections = document.querySelectorAll('.horizontal-section');
  
  sections.forEach(section => {
    const allBgs = section.querySelectorAll('.layer-bg');
    const allMains = section.querySelectorAll('.layer-main');
    
    if (allBgs.length === 0 && allMains.length === 0) return;

    const BG_STRENGTH = 30;
    const MAIN_STRENGTH = 60;

    let targetX = 0;
    let currentX = 0;
    const ease = 0.05;
    let isInView = false;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isInView = entry.isIntersecting;
      });
    }, { threshold: 0.1 });
    
    observer.observe(section);

    function onMove(e) {
      if (!isInView) return;
      
      const cx = window.innerWidth / 2;
      const x = (e.clientX - cx) / cx;
      targetX = Math.max(-1, Math.min(1, x));
    }

    document.addEventListener('mousemove', onMove);

    function animate() {
      if (isInView) {
        currentX += (targetX - currentX) * ease;

        allBgs.forEach(bg => {
          bg.style.transform = `translate3d(${-currentX * BG_STRENGTH}px, 0, 0)`;
        });
        allMains.forEach(main => {
          main.style.transform = `translate3d(calc(-50% + ${currentX * MAIN_STRENGTH}px), 0, 0)`;
        });
      }
      requestAnimationFrame(animate);
    }

    animate();
  });
}

// ============================================
// MENU BURGER
// ============================================
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  const burgerIcon = document.querySelector('.burger-icon');

  if (navbar) {
    navbar.addEventListener('mouseenter', () => navbar.classList.add('open'));
    navbar.addEventListener('mouseleave', () => navbar.classList.remove('open'));

    if (window.innerWidth <= 768 && burgerIcon) {
      burgerIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        navbar.classList.toggle('open');
      });

      document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => navbar.classList.remove('open'));
      });

      document.addEventListener('click', (e) => {
        if (!navbar.contains(e.target)) navbar.classList.remove('open');
      });
    }
  }
}

// ============================================
// SOUND TOGGLE
// ============================================
function initSoundToggle() {
  const soundToggle = document.querySelector('.sound-toggle');
  
  if (soundToggle) {
    // Charger l'état du son depuis le localStorage
    const isMuted = localStorage.getItem('soundMuted') === 'true';
    if (isMuted) {
      soundToggle.classList.add('muted');
      ChapterMusicManager.isSoundMuted = true;
    }
    
    soundToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      soundToggle.classList.toggle('muted');
      
      const isMuted = soundToggle.classList.contains('muted');
      ChapterMusicManager.isSoundMuted = isMuted;
      localStorage.setItem('soundMuted', isMuted);
      
      // Mettre à jour la musique en cours
      if (ChapterMusicManager.currentAudio) {
        if (isMuted) {
          ChapterMusicManager.fadeTo(ChapterMusicManager.currentAudio, 0, 500);
        } else {
          const targetVolume = ChapterMusicManager.audioElements.get(ChapterMusicManager.currentChapter)?.targetVolume || 0.6;
          ChapterMusicManager.fadeTo(ChapterMusicManager.currentAudio, targetVolume, 500);
        }
      }
    });
  }
}

// ============================================
// INDICATEUR DE NAVIGATION
// ============================================
function initNavIndicator() {
  const navLinks = document.querySelectorAll('.nav-links a');
  const indicator = document.querySelector('.nav-indicator');

  if (navLinks.length && indicator) {
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
  }
}

// ============================================
// CARROUSEL SMOOTH
// ============================================
function initSmoothCarousels() {
  const tracks = document.querySelectorAll('.carousel-track');

  tracks.forEach(track => {
    const style = getComputedStyle(track);
    let duration = parseFloat(style.animationDuration) || 0;
    if (style.animationDuration?.endsWith('ms')) duration /= 1000;
    
    if (!duration) {
      duration = track.closest('.front-row') ? 80 : 120;
    }

    track.style.animation = 'none';

    function start() {
      const children = Array.from(track.children);
      if (children.length < 2) return;
      
      const half = Math.floor(children.length / 2);
      const firstRect = children[0].getBoundingClientRect();
      const nextRect = children[half]?.getBoundingClientRect();
      let groupWidth = nextRect ? Math.abs(nextRect.left - firstRect.left) : track.scrollWidth / 2;
      
      if (!groupWidth) return;

      const speed = groupWidth / duration;
      let offset = (5 * speed) % groupWidth;
      let last = performance.now();

      function step(now) {
        const dt = (now - last) / 1000;
        last = now;
        offset = (offset + speed * dt) % groupWidth;
        track.style.transform = `translate3d(${-offset}px, 0, 0)`;
        requestAnimationFrame(step);
      }

      requestAnimationFrame(step);
    }

    if (document.readyState === 'complete') {
      setTimeout(start, 50);
    } else {
      window.addEventListener('load', () => setTimeout(start, 50));
    }
  });
}

// ============================================
// INITIALISATION
// ============================================
function init() {
  ChapterMusicManager.init();
  initHorizontalSections();
  initNavigation();
  initParallaxLayers();
  initNavbar();
  initNavIndicator();
  initSmoothCarousels();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}