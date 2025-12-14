// ============================================
// ECRAN D'ENTRÉE (Splash Screen)
// ============================================
let siteUnlocked = false;

function preventScroll(e) {
  if (!siteUnlocked) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
}

function initEntryScreen() {
  const entryOverlay = document.querySelector('.entry-overlay');
  const entryButton = document.querySelector('.entry-button');
  const body = document.body;
  
  if (!entryOverlay || !entryButton) {
    siteUnlocked = true;
    return;
  }
  
  // Bloquer le scroll (Lenis + events natifs)
  lenis.stop();
  window.addEventListener('wheel', preventScroll, { passive: false });
  window.addEventListener('touchmove', preventScroll, { passive: false });
  window.addEventListener('keydown', (e) => {
    if (!siteUnlocked && ['ArrowUp', 'ArrowDown', 'Space', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.code)) {
      e.preventDefault();
    }
  });
  
  entryButton.addEventListener('click', () => {
    // 1. Activer la musique
    ChapterMusicManager.isUserInteracted = true;
    ChapterMusicManager.isSoundMuted = false;
    
    // Précharger et préparer les audios
    ChapterMusicManager.audioElements.forEach(({ audio }) => {
      audio.muted = true;
      audio.play().then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.muted = false;
      }).catch(() => {});
    });
    
    // Mettre à jour le bouton son
    const soundToggle = document.querySelector('.sound-toggle');
    if (soundToggle) {
      soundToggle.classList.remove('muted');
    }
    
    // 2. Désactiver les clics sur l'overlay
    entryOverlay.classList.add('hidden');
    
    // 3. Animer l'entrée des personnages
    animateCarouselEntry();
    
    // 4. Débloquer le scroll une fois l'animation bien lancée
    setTimeout(() => {
      siteUnlocked = true;
      body.classList.remove('site-locked');
      window.removeEventListener('wheel', preventScroll);
      window.removeEventListener('touchmove', preventScroll);
      lenis.start();
    }, 1800);
  });
}

function animateCarouselEntry() {
  const body = document.body;
  const navbar = document.querySelector('.navbar');
  const entryContent = document.querySelector('.entry-content');
  
  // Récupérer toutes les cartes des deux rangées
  const backRowCards = document.querySelectorAll('.back-row .person-card');
  const frontRowCards = document.querySelectorAll('.front-row .person-card');
  const allCards = [...backRowCards, ...frontRowCards];
  
  // Timeline principale
  const tl = gsap.timeline({
    onComplete: () => {
      const entryOverlay = document.querySelector('.entry-overlay');
      if (entryOverlay) entryOverlay.remove();
      ChapterMusicManager.checkVisibleChapter();
    }
  });
  
  // Phase 1 : Disparition du contenu d'entrée
  tl.to(entryContent, {
    opacity: 0,
    scale: 1.1,
    duration: 0.5,
    ease: 'power2.in'
  });
  
  // Préparer les éléments (cachés) - seulement opacity, pas de transform
  gsap.set(allCards, { opacity: 0 });
  gsap.set(navbar, { opacity: 0 });
  
  // Retirer site-locked
  body.classList.remove('site-locked');
  
  // Phase 2 : Fade in de la rangée arrière depuis le centre
  tl.to(backRowCards, {
    opacity: 1,
    duration: 0.8,
    ease: 'power1.out',
    stagger: {
      each: 0.06,
      from: 'center'
    }
  }, '-=0.1');
  
  // Phase 3 : Fade in de la rangée avant
  tl.to(frontRowCards, {
    opacity: 1,
    duration: 0.8,
    ease: 'power1.out',
    stagger: {
      each: 0.08,
      from: 'center'
    }
  }, '-=0.6');
  
  // Phase 4 : Navbar - rapide et direct
  tl.to(navbar, {
    opacity: 1,
    duration: 0.4,
    ease: 'power1.out',
    clearProps: 'opacity'
  }, '-=0.3');
}

// ============================================
// GSAP + ScrollTrigger + ScrollToPlugin
// ============================================
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

// ============================================
// LENIS - Smooth Scroll
// ============================================
const lenis = new Lenis({
  duration: 1.2, // Retour à la valeur normale pour un momentum raisonnable
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  orientation: 'vertical',
  smoothWheel: true,
});

// Variable globale pour la transition rideau
let curtainTransitionState = {
  isAnimating: false,
  currentSection: 'hero',
  getChapter1Start: () => 0,
  updateSection: null, // Sera définie dans initCurtainTransition
  justNavigated: false // Flag pour éviter l'animation juste après un clic
};

// Variable globale pour les transitions entre chapitres
let chapterTransitionState = {
  isAnimating: false,
  currentChapterIndex: 0,
  getChapterBounds: null // Sera définie dans initChapterTransitions
};

// Synchroniser Lenis avec ScrollTrigger
lenis.on('scroll', (e) => {
  ScrollTrigger.update();
  
  // Bloquer le scroll vers le haut au début du chapitre 1
  // Mais PAS si on vient de naviguer par clic (pour permettre d'aller vers les autres chapitres)
  if (!curtainTransitionState.isAnimating && 
      !curtainTransitionState.justNavigated && 
      curtainTransitionState.currentSection === 'chapitre1') {
    const chapter1Start = curtainTransitionState.getChapter1Start();
    if (e.scroll < chapter1Start) {
      lenis.scrollTo(chapter1Start, { immediate: true });
    }
  }
  
  // Bloquer le scroll aux fins/débuts de chapitres (transition entre chapitres)
  if (!chapterTransitionState.isAnimating && 
      chapterTransitionState.getChapterBounds &&
      curtainTransitionState.currentSection !== 'hero') {
    const bounds = chapterTransitionState.getChapterBounds();
    if (bounds) {
      // Bloquer à la fin du chapitre (sauf dernier chapitre)
      if (bounds.atEnd && bounds.maxScroll !== null) {
        if (e.scroll > bounds.maxScroll) {
          lenis.scrollTo(bounds.maxScroll, { immediate: true });
        }
      }
      // Bloquer au début du chapitre (sauf premier chapitre, géré par curtain)
      if (bounds.atStart && bounds.minScroll !== null && bounds.index > 0) {
        if (e.scroll < bounds.minScroll) {
          lenis.scrollTo(bounds.minScroll, { immediate: true });
        }
      }
    }
  }
});

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
  isSoundMuted: true, // Muté par défaut
  
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
      
      // Vérifier si un chapitre est visible à plus de 50%
      this.checkVisibleChapter();
    };
    
    document.addEventListener('click', unlockAudio, { once: true });
    document.addEventListener('touchstart', unlockAudio, { once: true });
    document.addEventListener('keydown', unlockAudio, { once: true });
    
    // Observer pour détecter quel chapitre est le plus visible (>50%)
    this.initChapterObserver();
  },
  
  initChapterObserver() {
    const sections = document.querySelectorAll('.horizontal-section[data-music]');
    
    // Observer avec plusieurs seuils pour une meilleure détection
    const observer = new IntersectionObserver((entries) => {
      // Vérifier tous les chapitres pour trouver celui avec la plus grande visibilité
      this.checkVisibleChapter();
    }, { 
      threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
      rootMargin: '0px'
    });
    
    sections.forEach(section => observer.observe(section));
    
    // Aussi écouter le scroll pour une détection plus précise
    let scrollTimeout;
    lenis.on('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.checkVisibleChapter();
      }, 50);
    });
  },
  
  checkVisibleChapter() {
    if (!this.isUserInteracted || this.isSoundMuted) return;
    
    const sections = document.querySelectorAll('.horizontal-section[data-music]');
    let mostVisibleSection = null;
    let highestVisibility = 0;
    
    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Calculer la partie visible
      const visibleTop = Math.max(0, rect.top);
      const visibleBottom = Math.min(windowHeight, rect.bottom);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);
      
      // Ratio de visibilité par rapport à la fenêtre
      const visibilityRatio = visibleHeight / windowHeight;
      
      if (visibilityRatio > highestVisibility) {
        highestVisibility = visibilityRatio;
        mostVisibleSection = section;
      }
    });
    
    // Si un chapitre est visible à plus de 50%, jouer sa musique
    if (mostVisibleSection && highestVisibility >= 0.5) {
      if (this.currentChapter !== mostVisibleSection.id) {
        this.playChapterMusic(mostVisibleSection.id);
      }
    } else {
      // Aucun chapitre visible à plus de 50%, arrêter la musique
      if (this.currentChapter) {
        this.stopAllMusic();
      }
    }
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
    if (!this.isUserInteracted || this.isSoundMuted) {
      this.currentChapter = chapterId;
      return;
    }
    
    const chapterData = this.audioElements.get(chapterId);
    if (!chapterData) return;
    
    // Si c'est le même chapitre et qu'il joue déjà, ne rien faire
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
      const audioToStop = this.currentAudio;
      this.fadeTo(audioToStop, 0, this.fadeDuration, () => {
        audioToStop.pause();
      });
    }
    this.currentChapter = null;
    this.currentAudio = null;
  },
  
  forcePlayIfVisible() {
    // Trouver le chapitre le plus visible
    const sections = document.querySelectorAll('.horizontal-section[data-music]');
    let mostVisibleSection = null;
    let highestVisibility = 0;
    
    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      const visibleTop = Math.max(0, rect.top);
      const visibleBottom = Math.min(windowHeight, rect.bottom);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);
      const visibilityRatio = visibleHeight / windowHeight;
      
      if (visibilityRatio > highestVisibility) {
        highestVisibility = visibilityRatio;
        mostVisibleSection = section;
      }
    });
    
    // Si un chapitre est visible à plus de 50%, lancer sa musique
    if (mostVisibleSection && highestVisibility >= 0.5) {
      const chapterData = this.audioElements.get(mostVisibleSection.id);
      if (chapterData) {
        const { audio, startTime, targetVolume } = chapterData;
        
        // Reset et jouer
        audio.currentTime = startTime;
        audio.volume = 0;
        audio.play().catch(() => {});
        this.fadeTo(audio, targetVolume, this.fadeDuration);
        
        this.currentAudio = audio;
        this.currentChapter = mostVisibleSection.id;
      }
    }
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
      end: () => `+=${getScrollAmount() * 3}`, // Multiplié par 3 : il faudra scroller 3x plus pour traverser le chapitre
      pin: true,
      animation: tween,
      scrub: 1, // Remis à 1 pour une réactivité normale
      invalidateOnRefresh: true,
      anticipatePin: 1,
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
            scrub: 0.5, // Remis à la valeur normale pour une apparition fluide
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
    
    // Déclencher le dernier parallax set automatiquement à la fin du chapitre
    // Vérifier si le dernier parallax set n'est pas déjà déclenché par un content-block
    if (parallaxSets.length > 0) {
      const lastParallaxSetNumber = parallaxSets.length;
      
      // Trouver le plus grand data-trigger-set dans les content-blocks
      let maxTriggerSet = 0;
      blocks.forEach(block => {
        const triggerSet = parseInt(block.getAttribute('data-trigger-set')) || 0;
        if (triggerSet > maxTriggerSet) {
          maxTriggerSet = triggerSet;
        }
      });
      
      // S'il y a des parallax sets non déclenchés, ajouter un trigger pour le dernier
      if (lastParallaxSetNumber > maxTriggerSet) {
        const lastBlock = blocks[blocks.length - 1];
        
        if (lastBlock) {
          ScrollTrigger.create({
            trigger: lastBlock,
            containerAnimation: tween,
            start: 'center 40%', // Quand le dernier bloc arrive au centre-gauche
            end: 'right 20%',
            onEnter: () => switchParallaxSet(section, lastParallaxSetNumber.toString()),
            onEnterBack: () => {
              // Revenir au set du dernier content-block
              if (maxTriggerSet >= 1) {
                switchParallaxSet(section, maxTriggerSet.toString());
              }
            },
          });
        }
      }
    }
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
  
  // Récupérer les éléments de l'overlay de transition
  const navTransitionOverlay = document.querySelector('.nav-transition-overlay');
  const navTransitionPanel = document.querySelector('.nav-transition-panel');
  const navTransitionContent = document.querySelector('.nav-transition-content');
  const navTransitionTitle = document.querySelector('.nav-transition-title');
  const navTransitionSubtitle = document.querySelector('.nav-transition-subtitle');
  
  // S'assurer que le panneau est hors écran au départ
  if (navTransitionPanel) {
    gsap.set(navTransitionPanel, { x: '-100%' });
    gsap.set(navTransitionContent, { opacity: 0, scale: 0.8 });
  }
  
  // Fonction pour animer la transition vers un chapitre
  function navigateToChapterWithTransition(targetSection, chapterName) {
    if (!navTransitionPanel || !navTransitionContent) return;
    
    // Mettre à jour le texte
    if (navTransitionTitle) navTransitionTitle.textContent = chapterName;
    if (navTransitionSubtitle) navTransitionSubtitle.textContent = 'Loading...';
    
    // Stopper le scroll
    lenis.stop();
    
    // Trouver le ScrollTrigger de la section cible
    const triggers = ScrollTrigger.getAll();
    const sectionTrigger = triggers.find(t => t.trigger === targetSection);
    const targetPosition = sectionTrigger ? sectionTrigger.start : targetSection.offsetTop;
    
    // Timeline d'animation
    const tl = gsap.timeline({
      onComplete: () => {
        // Redémarrer le scroll après un court délai
        setTimeout(() => {
          lenis.start();
        }, 100);
      }
    });
    
    // Phase 1: Slide in depuis la gauche (0 → 0.6s)
    tl.to(navTransitionPanel, { 
      x: '0%', 
      duration: 0.6, 
      ease: 'power2.inOut' 
    }, 0)
    
    // Phase 2: Afficher le contenu (0.3 → 0.6s)
    .to(navTransitionContent, { 
      opacity: 1, 
      scale: 1, 
      duration: 0.3, 
      ease: 'power2.out' 
    }, 0.3)
    
    // Phase 3: Téléportation (à 0.7s, quand le panneau recouvre tout)
    .call(() => {
      window.scrollTo(0, targetPosition);
      ScrollTrigger.refresh();
    }, null, 0.7)
    
    // Phase 4: Petite pause (0.7 → 1.0s)
    .to({}, { duration: 0.3 })
    
    // Phase 5: Masquer le contenu (1.0 → 1.2s)
    .to(navTransitionContent, { 
      opacity: 0, 
      scale: 1.1, 
      duration: 0.2, 
      ease: 'power2.in' 
    }, 1.0)
    
    // Phase 6: Slide out vers la droite (1.1 → 1.7s)
    .to(navTransitionPanel, { 
      x: '100%', 
      duration: 0.6, 
      ease: 'power2.inOut' 
    }, 1.1)
    
    // Phase 7: Reset (à la fin)
    .call(() => {
      gsap.set(navTransitionPanel, { x: '-100%' });
      gsap.set(navTransitionContent, { opacity: 0, scale: 0.8 });
    }, null, 1.8);
  }
  
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      const targetId = link.getAttribute('href');
      const targetSection = document.querySelector(targetId);
      
      if (!targetSection) return;
      
      // Fermer la navbar sur mobile
      const navbar = document.querySelector('.navbar');
      if (navbar) navbar.classList.remove('open');
      
      // Récupérer le nom du chapitre depuis le texte du lien
      const chapterName = link.textContent.trim();
      
      // Si on navigue depuis la hero vers un chapitre, mettre à jour l'état
      if (curtainTransitionState.currentSection === 'hero' && targetId.startsWith('#chapitre')) {
        // Utiliser la fonction d'update si elle existe, sinon fallback
        if (curtainTransitionState.updateSection) {
          curtainTransitionState.updateSection('chapitre1'); // On est sorti de la hero, donc on est dans la zone chapitres
        } else {
          curtainTransitionState.currentSection = 'chapitre1';
          document.body.classList.remove('in-hero');
        }
        
        // Désactiver temporairement l'animation de rideau
        curtainTransitionState.justNavigated = true;
        setTimeout(() => {
          curtainTransitionState.justNavigated = false;
        }, 3000); // Désactiver après 3 secondes (durée du smooth scroll + marge)
      }
      
      // Lancer l'animation de transition
      navigateToChapterWithTransition(targetSection, chapterName);
    });
  });
}

// ============================================
// PARALLAX LAYERS (basé sur le scroll)
// ============================================
function initParallaxLayers() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const sections = document.querySelectorAll('.horizontal-section');
  
  sections.forEach(section => {
    const allBgs = section.querySelectorAll('.layer-bg');
    const allMains = section.querySelectorAll('.layer-main');
    
    if (allBgs.length === 0 && allMains.length === 0) return;

    // Intensité du parallax (en pixels)
    const BG_STRENGTH = 100;   // Le bg bouge moins
    const MAIN_STRENGTH = 200; // Le main bouge plus (effet de profondeur)

    // Trouver le ScrollTrigger de cette section
    const track = section.querySelector('.horizontal-track');
    if (!track) return;

    const getScrollAmount = () => {
      return track.scrollWidth - window.innerWidth;
    };

    // Créer le parallax basé sur le scroll
    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: () => `+=${getScrollAmount() * 3}`, // Synchronisé avec le ScrollTrigger principal
      scrub: 1, // Remis à 1 pour une réactivité normale
      onUpdate: (self) => {
        // self.progress va de 0 à 1
        const progress = self.progress;
        
        // Convertir progress en valeur de -1 à 1 pour le déplacement
        // Au début (0) : décalage vers la droite (+)
        // À la fin (1) : décalage vers la gauche (-)
        const offset = (0.5 - progress) * 2; // Va de 1 à -1
        
        allBgs.forEach(bg => {
          bg.style.transform = `translate3d(${offset * BG_STRENGTH}px, 0, 0)`;
        });
        
        allMains.forEach(main => {
          main.style.transform = `translate3d(calc(-50% + ${offset * MAIN_STRENGTH}px), 0, 0)`;
        });
      }
    });
  });
}

// ============================================
// MENU BURGER
// ============================================
let isInHeroSection = true; // Par défaut on est dans la hero section

function initNavbar() {
  const navbar = document.querySelector('.navbar');
  const burgerIcon = document.querySelector('.burger-icon');

  if (navbar) {
    navbar.addEventListener('mouseenter', () => navbar.classList.add('open'));
    navbar.addEventListener('mouseleave', () => {
      // Ne pas fermer si on est dans la hero section
      if (!isInHeroSection) {
        navbar.classList.remove('open');
      }
    });

    if (window.innerWidth <= 768 && burgerIcon) {
      burgerIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        // Ne pas permettre de fermer si on est dans la hero section
        if (isInHeroSection) return;
        navbar.classList.toggle('open');
      });

      document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
          if (!isInHeroSection) {
            navbar.classList.remove('open');
          }
        });
      });

      document.addEventListener('click', (e) => {
        if (!navbar.contains(e.target) && !isInHeroSection) {
          navbar.classList.remove('open');
        }
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
    // Par défaut muté (la classe .muted est déjà dans le HTML)
    ChapterMusicManager.isSoundMuted = true;
    
    soundToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      soundToggle.classList.toggle('muted');
      
      const isMuted = soundToggle.classList.contains('muted');
      ChapterMusicManager.isSoundMuted = isMuted;
      
      if (isMuted) {
        // Couper le son
        if (ChapterMusicManager.currentAudio) {
          ChapterMusicManager.fadeTo(ChapterMusicManager.currentAudio, 0, 500, () => {
            ChapterMusicManager.currentAudio.pause();
          });
        }
      } else {
        // Activer le son - forcer la vérification et le lancement
        ChapterMusicManager.isUserInteracted = true;
        ChapterMusicManager.forcePlayIfVisible();
      }
    });
  }
}

// ============================================
// NAVBAR AUTO-CLOSE ON CHAPTER 1
// ============================================
function initNavbarAutoClose() {
  const navbar = document.querySelector('.navbar');
  const chapitre1 = document.getElementById('chapitre1');
  
  if (!navbar || !chapitre1) return;
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      // Quand le chapitre 1 est visible à plus de 50%, on n'est plus dans la hero section
      if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
        isInHeroSection = false;
        navbar.classList.remove('open');
      } else if (entry.intersectionRatio < 0.5) {
        // Vérifier si on est de retour dans la hero section (chapitre 1 peu visible depuis le haut)
        const rect = chapitre1.getBoundingClientRect();
        if (rect.top > window.innerHeight * 0.5) {
          // On est au-dessus du chapitre 1, donc dans la hero section
          isInHeroSection = true;
          navbar.classList.add('open');
        }
      }
    });
  }, {
    threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]
  });
  
  observer.observe(chapitre1);
  
  // Aussi écouter le scroll pour une détection plus précise
  lenis.on('scroll', () => {
    const rect = chapitre1.getBoundingClientRect();
    const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
    const visibilityRatio = visibleHeight / window.innerHeight;
    
    if (visibilityRatio >= 0.5) {
      if (isInHeroSection) {
        isInHeroSection = false;
        navbar.classList.remove('open');
      }
    } else if (rect.top > window.innerHeight * 0.5) {
      if (!isInHeroSection) {
        isInHeroSection = true;
        navbar.classList.add('open');
      }
    }
  });
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
// HOVER AUDIO SUR NAVBAR
// ============================================
function initHoverAudio() {
  const HOVER_FADE_MS = 600;
  const TARGET_VOLUME = 0.5;
  const audioMap = new Map();
  let audioUnlocked = false;
  let chapterVolumeBeforeHover = 0;

  function createAudioElement(src) {
    const a = new Audio(src);
    a.preload = 'auto';
    a.loop = true;
    a.volume = 0;
    return a;
  }

  function fadeTo(audio, toVolume, duration, cb) {
    if (!audio) return;
    if (audio._fadeTimer) clearInterval(audio._fadeTimer);
    
    const from = audio.volume;
    const steps = Math.max(1, Math.round(duration / 40));
    const stepDelta = (toVolume - from) / steps;
    let currentStep = 0;
    
    audio._fadeTimer = setInterval(() => {
      currentStep++;
      audio.volume = Math.min(1, Math.max(0, audio.volume + stepDelta));
      if (currentStep >= steps) {
        clearInterval(audio._fadeTimer);
        audio._fadeTimer = null;
        audio.volume = toVolume;
        if (cb) cb();
      }
    }, 40);
  }

  function onEnter(e) {
    // Ne pas jouer si le son global est muté
    if (ChapterMusicManager.isSoundMuted) return;
    
    const el = e.currentTarget;
    const audioSrc = el.getAttribute('data-audio');
    if (!audioSrc) return;
    
    // Mettre en pause la musique du chapitre avec fade
    if (ChapterMusicManager.currentAudio && !ChapterMusicManager.currentAudio.paused) {
      chapterVolumeBeforeHover = ChapterMusicManager.currentAudio.volume;
      ChapterMusicManager.fadeTo(ChapterMusicManager.currentAudio, 0, HOVER_FADE_MS);
    }
    
    let entry = audioMap.get(el);

    if (!entry || entry.src !== audioSrc) {
      if (entry?.audio) {
        clearInterval(entry.audio._fadeTimer);
        entry.audio.pause();
      }
      entry = { audio: createAudioElement(audioSrc), src: audioSrc };
      audioMap.set(el, entry);
    }

    const audio = entry.audio;
    const startTime = parseFloat(el.getAttribute('data-start-time')) || 0;
    if (startTime > 0 && audio.readyState >= 1) {
      audio.currentTime = startTime;
    }

    let targetVolume = parseFloat(el.getAttribute('data-volume')) || TARGET_VOLUME;
    targetVolume = Math.max(0, Math.min(1, targetVolume));

    if (audio.paused) audio.play().catch(() => {});
    fadeTo(audio, targetVolume, HOVER_FADE_MS);
  }

  function onLeave(e) {
    // Ne rien faire si le son global est muté
    if (ChapterMusicManager.isSoundMuted) return;
    
    const entry = audioMap.get(e.currentTarget);
    if (entry?.audio) {
      fadeTo(entry.audio, 0, HOVER_FADE_MS, () => {
        entry.audio.pause();
        entry.audio.currentTime = 0;
      });
    }
    
    // Reprendre la musique du chapitre avec fade
    if (ChapterMusicManager.currentAudio && ChapterMusicManager.currentChapter) {
      const targetVolume = ChapterMusicManager.audioElements.get(ChapterMusicManager.currentChapter)?.targetVolume || 0.6;
      ChapterMusicManager.fadeTo(ChapterMusicManager.currentAudio, targetVolume, HOVER_FADE_MS);
    }
  }

  // Arrêter la musique de hover au clic (avant la navigation)
  function onClick(e) {
    const entry = audioMap.get(e.currentTarget);
    if (entry?.audio) {
      // Arrêter immédiatement la musique de hover
      if (entry.audio._fadeTimer) clearInterval(entry.audio._fadeTimer);
      fadeTo(entry.audio, 0, 300, () => {
        entry.audio.pause();
        entry.audio.currentTime = 0;
      });
    }
    
    // Ne pas reprendre la musique du chapitre actuel car on va changer de chapitre
    // La nouvelle musique du chapitre sera gérée par ChapterMusicManager
  }

  const hoverTargets = document.querySelectorAll('.nav-links a[data-audio]');
  hoverTargets.forEach(t => {
    t.addEventListener('mouseenter', onEnter);
    t.addEventListener('mouseleave', onLeave);
    t.addEventListener('click', onClick);
  });

  // Débloquer l'audio au premier clic/toucher
  function unlockAudio() {
    if (audioUnlocked) return;
    audioUnlocked = true;
    hoverTargets.forEach(el => {
      const src = el.getAttribute('data-audio');
      if (!src) return;
      if (!audioMap.has(el)) {
        audioMap.set(el, { audio: createAudioElement(src), src });
      }
      const audio = audioMap.get(el).audio;
      audio.muted = true;
      audio.play().then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.muted = false;
      }).catch(() => {});
    });
  }

  document.addEventListener('pointerdown', unlockAudio, { once: true });
  document.addEventListener('keydown', unlockAudio, { once: true });
}

// ============================================
// TRANSITION RIDEAU (Animation automatique)
// ============================================
function initCurtainTransition() {
  const curtainOverlay = document.querySelector('.curtain-overlay');
  const header = document.querySelector('header');
  const chapitre1 = document.getElementById('chapitre1');
  
  if (!curtainOverlay || !header || !chapitre1) return;
  
  const curtainLeft = curtainOverlay.querySelector('.curtain-left');
  const curtainRight = curtainOverlay.querySelector('.curtain-right');
  const curtainContent = curtainOverlay.querySelector('.curtain-content');
  
  if (!curtainLeft || !curtainRight) return;
  
  let isAnimating = false;
  let currentSection = 'hero';
  
  // Fonction pour synchroniser les états
  function updateCurrentSection(newSection) {
    currentSection = newSection;
    curtainTransitionState.currentSection = newSection;
    isInHeroSection = (newSection === 'hero');
    
    if (isInHeroSection) {
      document.body.classList.add('in-hero');
    } else {
      document.body.classList.remove('in-hero');
    }
  }
  
  // Exposer la fonction globalement
  curtainTransitionState.updateSection = updateCurrentSection;
  
  // S'assurer que les rideaux sont ouverts au départ
  gsap.set(curtainLeft, { x: '-100%' });
  gsap.set(curtainRight, { x: '100%' });
  gsap.set(curtainContent, { opacity: 0, scale: 0.8 });
  
  // Fonction pour obtenir la position de début du chapitre 1
  function getChapter1Start() {
    const triggers = ScrollTrigger.getAll();
    const chapter1Trigger = triggers.find(t => t.trigger === chapitre1);
    return chapter1Trigger ? chapter1Trigger.start : chapitre1.offsetTop;
  }
  
  // Synchroniser avec la variable globale
  curtainTransitionState.getChapter1Start = getChapter1Start;
  
  // Animation vers le chapitre 1
  function goToChapter1() {
    if (isAnimating || !siteUnlocked) return;
    isAnimating = true;
    curtainTransitionState.isAnimating = true;
    lenis.stop();
    
    // Trouver la position du chapitre 1 AVANT l'animation
    const targetPosition = getChapter1Start();
    
    const tl = gsap.timeline({
      onComplete: () => {
        // Attendre un peu avant de réactiver le scroll pour éviter le rollback
        setTimeout(() => {
          // Re-téléporter pour être sûr d'être à la bonne position
          window.scrollTo(0, targetPosition);
          ScrollTrigger.refresh();
          
          setTimeout(() => {
            isAnimating = false;
            curtainTransitionState.isAnimating = false;
            lenis.start();
          }, 50);
        }, 50);
      }
    });
    
    // Phase 1: Fermer les rideaux
    tl.to(curtainLeft, { x: '0%', duration: 0.5, ease: 'power2.inOut' }, 0)
      .to(curtainRight, { x: '0%', duration: 0.5, ease: 'power2.inOut' }, 0)
      .to(curtainContent, { opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out' }, 0.3)
      
      // Phase 2: Téléportation (rideaux fermés) - à 0.6s
      .call(() => {
        updateCurrentSection('chapitre1');
        window.scrollTo(0, targetPosition);
        
        const navbar = document.querySelector('.navbar');
        if (navbar) navbar.classList.remove('open');
      }, null, 0.6)
      
      // Phase 3: Pause avec texte visible
      .to({}, { duration: 0.3 })
      
      // Phase 4: Ouvrir les rideaux
      .to(curtainContent, { opacity: 0, scale: 1.1, duration: 0.2, ease: 'power2.in' })
      .to(curtainLeft, { x: '-100%', duration: 0.5, ease: 'power2.inOut' }, '-=0.1')
      .to(curtainRight, { x: '100%', duration: 0.5, ease: 'power2.inOut' }, '<');
  }
  
  // Animation vers la hero
  function goToHero() {
    if (isAnimating || !siteUnlocked) return;
    isAnimating = true;
    curtainTransitionState.isAnimating = true;
    lenis.stop();
    
    const tl = gsap.timeline({
      onComplete: () => {
        setTimeout(() => {
          window.scrollTo(0, 0);
          ScrollTrigger.refresh();
          
          setTimeout(() => {
            isAnimating = false;
            curtainTransitionState.isAnimating = false;
            lenis.start();
          }, 50);
        }, 50);
      }
    });
    
    // Phase 1: Fermer les rideaux
    tl.to(curtainLeft, { x: '0%', duration: 0.5, ease: 'power2.inOut' }, 0)
      .to(curtainRight, { x: '0%', duration: 0.5, ease: 'power2.inOut' }, 0)
      .to(curtainContent, { opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out' }, 0.3)
      
      // Phase 2: Téléportation (rideaux fermés) - à 0.6s
      .call(() => {
        updateCurrentSection('hero');
        window.scrollTo(0, 0);
        
        const navbar = document.querySelector('.navbar');
        if (navbar) navbar.classList.add('open');
      }, null, 0.6)
      
      // Phase 3: Pause avec texte visible
      .to({}, { duration: 0.3 })
      
      // Phase 4: Ouvrir les rideaux
      .to(curtainContent, { opacity: 0, scale: 1.1, duration: 0.2, ease: 'power2.in' })
      .to(curtainLeft, { x: '-100%', duration: 0.5, ease: 'power2.inOut' }, '-=0.1')
      .to(curtainRight, { x: '100%', duration: 0.5, ease: 'power2.inOut' }, '<');
  }
  
  // Écouter la molette - bloquer le scroll vers le haut au début du chapitre 1
  window.addEventListener('wheel', (e) => {
    // Bloquer si le site n'est pas encore débloqué
    if (!siteUnlocked) {
      e.preventDefault();
      return;
    }
    
    // Toujours bloquer pendant l'animation
    if (isAnimating) {
      e.preventDefault();
      return;
    }
    
    // Ne pas déclencher d'animation si on vient de naviguer par clic
    if (curtainTransitionState.justNavigated) {
      return;
    }
    
    // Si on est dans la hero et scroll vers le bas → aller au chapitre 1
    if (currentSection === 'hero' && e.deltaY > 0) {
      e.preventDefault();
      goToChapter1();
      return;
    }
    
    // Si on est au début du chapitre 1 et scroll vers le haut
    if (currentSection === 'chapitre1' && e.deltaY < 0) {
      const scrollY = window.scrollY;
      const chapter1Start = getChapter1Start();
      
      // Zone de protection : bloquer tout scroll vers le haut dans les 100 premiers pixels
      if (scrollY <= chapter1Start + 100) {
        e.preventDefault();
        
        // Si vraiment au début, lancer l'animation
        if (scrollY <= chapter1Start + 20) {
          goToHero();
        }
        return;
      }
    }
  }, { passive: false });
  
  // Intercepter aussi le scroll natif pour bloquer complètement
  window.addEventListener('scroll', () => {
    if (!siteUnlocked || isAnimating) return;
    
    if (currentSection === 'chapitre1') {
      const scrollY = window.scrollY;
      const chapter1Start = getChapter1Start();
      
      // Si on essaie de remonter au-dessus du chapitre 1, bloquer la position
      if (scrollY < chapter1Start - 5) {
        window.scrollTo(0, chapter1Start);
      }
    }
  });
  
  // Touch pour mobile
  let touchStartY = 0;
  let touchHandled = false;
  
  window.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
    touchHandled = false;
  }, { passive: true });
  
  window.addEventListener('touchmove', (e) => {
    // Bloquer si le site n'est pas encore débloqué
    if (!siteUnlocked) return;
    
    if (isAnimating || touchHandled) return;
    
    // Ne pas déclencher d'animation si on vient de naviguer par clic
    if (curtainTransitionState.justNavigated) return;
    
    const touchY = e.touches[0].clientY;
    const deltaY = touchStartY - touchY; // positif = swipe up
    
    // Hero → Chapitre 1 (swipe up)
    if (currentSection === 'hero' && deltaY > 50) {
      touchHandled = true;
      goToChapter1();
      return;
    }
    
    // Chapitre 1 → Hero (swipe down, au début du chapitre)
    if (currentSection === 'chapitre1' && deltaY < -30) {
      const scrollY = window.scrollY;
      const chapter1Start = getChapter1Start();
      
      if (scrollY <= chapter1Start + 100) {
        touchHandled = true;
        e.preventDefault();
        goToHero();
      }
    }
  }, { passive: false });
  
  // Déterminer la section initiale au chargement
  setTimeout(() => {
    const chapter1Start = getChapter1Start();
    const scrollY = window.scrollY;
    
    if (scrollY >= chapter1Start - 100) {
      updateCurrentSection('chapitre1');
    } else {
      updateCurrentSection('hero');
    }
  }, 200);
}

// ============================================
// PERSONNAGES CLIQUABLES (CARROUSEL)
// ============================================

// Données des chapitres pour les transitions
const chapterData = {
  'chapitre1': {
    title: 'Chapitre I',
    subtitle: 'Boyz-N-The-Hood',
    icon: 'img/icon-chapitre1.png'
  },
  'chapitre2': {
    title: 'Chapitre II',
    subtitle: 'Straight Outta Compton',
    icon: 'img/icon-chapitre2.png'
  },
  'chapitre3': {
    title: 'Chapitre III',
    subtitle: 'Fuck Tha Police',
    icon: 'img/icon-chapitre3.png'
  },
  'chapitre4': {
    title: 'Chapitre IV',
    subtitle: 'No Vaseline',
    icon: 'img/icon-chapitre4.png'
  },
  'chapitre5': {
    title: 'Chapitre V',
    subtitle: 'I Need a Doctor',
    icon: 'img/icon-chapitre5.png'
  }
};

// ============================================
// TRANSITION ENTRE CHAPITRES
// ============================================
function initChapterTransitions() {
  const chapters = ['chapitre1', 'chapitre2', 'chapitre3', 'chapitre4', 'chapitre5'];
  const transitionOverlay = document.querySelector('.chapter-transition-overlay');
  const transitionPanel = document.querySelector('.chapter-transition-panel');
  const transitionContent = document.querySelector('.chapter-transition-content');
  const transitionTitle = document.querySelector('.chapter-transition-title');
  const transitionSubtitle = document.querySelector('.chapter-transition-subtitle');
  const transitionIcon = document.getElementById('chapterTransitionIcon');
  
  if (!transitionOverlay || !transitionPanel) return;
  
  // S'assurer que le panneau est caché au départ
  gsap.set(transitionPanel, { scaleY: 0 });
  gsap.set(transitionContent, { opacity: 0, y: 30 });
  
  // Zone de blocage (en pourcentage de progression)
  const END_ZONE = 0.97;
  const START_ZONE = 0.03;
  
  // Récupérer les infos de scroll de chaque chapitre
  function getChapterInfo(chapterId) {
    const section = document.getElementById(chapterId);
    if (!section) return null;
    
    const triggers = ScrollTrigger.getAll();
    const trigger = triggers.find(t => t.trigger === section);
    
    if (!trigger) return null;
    
    return {
      section,
      trigger,
      start: trigger.start,
      end: trigger.end
    };
  }
  
  // Déterminer le chapitre visible et sa progression
  function getCurrentChapterState() {
    const scrollY = window.scrollY;
    
    for (let i = 0; i < chapters.length; i++) {
      const info = getChapterInfo(chapters[i]);
      if (!info) continue;
      
      // Si on est dans la plage de ce chapitre
      if (scrollY >= info.start - 50 && scrollY <= info.end + 50) {
        const progress = (scrollY - info.start) / (info.end - info.start);
        return {
          index: i,
          id: chapters[i],
          progress: Math.max(0, Math.min(1, progress)),
          info
        };
      }
    }
    return null;
  }
  
  // Exposer la fonction pour obtenir les limites de scroll du chapitre courant
  chapterTransitionState.getChapterBounds = function() {
    const state = getCurrentChapterState();
    if (!state) return null;
    
    const { index, info, progress } = state;
    const totalRange = info.end - info.start;
    
    return {
      index,
      progress,
      atEnd: progress >= END_ZONE,
      atStart: progress <= START_ZONE,
      maxScroll: index < chapters.length - 1 ? info.start + totalRange * END_ZONE : null,
      minScroll: index > 0 ? info.start + totalRange * START_ZONE : null
    };
  };
  
  // Animation de transition vers un chapitre
  function transitionToChapter(toChapterId, direction) {
    if (chapterTransitionState.isAnimating) return;
    chapterTransitionState.isAnimating = true;
    
    // Cacher la barre de progression pendant la transition
    const progressContainer = document.querySelector('.progress-bar-container');
    if (progressContainer) {
      progressContainer.classList.remove('visible');
    }
    
    const toChapter = chapterData[toChapterId];
    if (!toChapter) {
      chapterTransitionState.isAnimating = false;
      return;
    }
    
    // Mettre à jour le texte de la transition
    transitionTitle.textContent = toChapter.title;
    transitionSubtitle.textContent = toChapter.subtitle;
    
    // Mettre à jour l'icône de transition
    if (transitionIcon && toChapter.icon) {
      transitionIcon.src = toChapter.icon;
    }
    
    // Stopper le scroll
    lenis.stop();
    
    // Trouver la position cible
    const targetInfo = getChapterInfo(toChapterId);
    if (!targetInfo) {
      chapterTransitionState.isAnimating = false;
      lenis.start();
      return;
    }
    
    let targetPosition;
    if (direction === 'next') {
      // Aller au début du chapitre suivant (un peu après le start pour être dans la zone safe)
      targetPosition = targetInfo.start + (targetInfo.end - targetInfo.start) * 0.05;
    } else {
      // Aller vers la fin du chapitre précédent (85% pour avoir de la marge)
      targetPosition = targetInfo.start + (targetInfo.end - targetInfo.start) * 0.85;
    }
    
    // Mettre à jour l'index du chapitre courant
    chapterTransitionState.currentChapterIndex = chapters.indexOf(toChapterId);
    
    // Timeline d'animation
    const tl = gsap.timeline({
      onComplete: () => {
        // Reset
        gsap.set(transitionPanel, { scaleY: 0 });
        gsap.set(transitionContent, { opacity: 0, y: 30 });
        transitionTitle.classList.remove('pulse');
        
        setTimeout(() => {
          chapterTransitionState.isAnimating = false;
          lenis.start();
        }, 100);
      }
    });
    
    // Phase 1: Le panneau apparaît (scale depuis le centre)
    tl.to(transitionPanel, {
      scaleY: 1,
      duration: 0.4,
      ease: 'power2.inOut'
    }, 0)
    
    // Phase 2: Le contenu apparaît
    .to(transitionContent, {
      opacity: 1,
      y: 0,
      duration: 0.3,
      ease: 'power2.out',
      onStart: () => {
        transitionTitle.classList.add('pulse');
      }
    }, 0.25)
    
    // Phase 3: Téléportation (panneau fermé)
    .call(() => {
      window.scrollTo(0, targetPosition);
      ScrollTrigger.refresh();
    }, null, 0.5)
    
    // Phase 4: Pause pour lire le titre
    .to({}, { duration: 0.5 })
    
    // Phase 5: Le contenu disparaît
    .to(transitionContent, {
      opacity: 0,
      y: -20,
      duration: 0.25,
      ease: 'power2.in'
    })
    
    // Phase 6: Le panneau disparaît
    .to(transitionPanel, {
      scaleY: 0,
      duration: 0.4,
      ease: 'power2.inOut'
    }, '-=0.1');
  }
  
  // Gérer le scroll wheel
  window.addEventListener('wheel', (e) => {
    if (!siteUnlocked || chapterTransitionState.isAnimating) {
      e.preventDefault();
      return;
    }
    
    // Ne pas interférer avec la transition hero ↔ chapitre1
    if (curtainTransitionState.currentSection === 'hero') return;
    if (curtainTransitionState.isAnimating) return;
    
    const state = getCurrentChapterState();
    if (!state) return;
    
    const { index, id, progress } = state;
    
    // === FIN DU CHAPITRE : scroll vers le bas ===
    if (e.deltaY > 0 && progress >= END_ZONE) {
      // Vérifier qu'il y a un chapitre suivant (pas après chapitre 5)
      if (index < chapters.length - 1) {
        e.preventDefault();
        transitionToChapter(chapters[index + 1], 'next');
        return;
      }
    }
    
    // === DÉBUT DU CHAPITRE : scroll vers le haut ===
    if (e.deltaY < 0 && progress <= START_ZONE) {
      // Vérifier qu'il y a un chapitre précédent (pas avant chapitre 1, géré par curtain)
      if (index > 0) {
        e.preventDefault();
        transitionToChapter(chapters[index - 1], 'prev');
        return;
      }
    }
  }, { passive: false });
  
  // Support tactile
  let touchStartY = 0;
  let touchHandled = false;
  
  window.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
    touchHandled = false;
  }, { passive: true });
  
  window.addEventListener('touchmove', (e) => {
    if (!siteUnlocked || chapterTransitionState.isAnimating || touchHandled) return;
    if (curtainTransitionState.currentSection === 'hero') return;
    if (curtainTransitionState.isAnimating) return;
    
    const touchY = e.touches[0].clientY;
    const deltaY = touchStartY - touchY; // positif = swipe vers le haut (scroll down)
    
    const state = getCurrentChapterState();
    if (!state) return;
    
    const { index, progress } = state;
    
    // Swipe up (scroll down) à la fin du chapitre
    if (deltaY > 50 && progress >= END_ZONE && index < chapters.length - 1) {
      touchHandled = true;
      e.preventDefault();
      transitionToChapter(chapters[index + 1], 'next');
      return;
    }
    
    // Swipe down (scroll up) au début du chapitre
    if (deltaY < -50 && progress <= START_ZONE && index > 0) {
      touchHandled = true;
      e.preventDefault();
      transitionToChapter(chapters[index - 1], 'prev');
      return;
    }
  }, { passive: false });
}

const characterData = {
  'dr-dre': {
    name: 'Dr. Dre',
    role: 'Producteur & Rappeur',
    bio: "Andre Romelle Young, dit Dr. Dre, est le cerveau musical de N.W.A. Producteur visionnaire, il crée le son du G-funk qui définira le rap West Coast. Après N.W.A, il fonde Death Row Records puis Aftermath Entertainment, lançant les carrières de Snoop Dogg, Eminem et 50 Cent."
  },
  'eazy-e': {
    name: 'Eazy-E',
    role: 'Fondateur & Rappeur',
    bio: "Eric Lynn Wright, dit Eazy-E, est le parrain du gangsta rap. Ancien dealer devenu entrepreneur, il fonde Ruthless Records et finance le premier single de N.W.A. Sa voix nasillarde et son flow unique deviennent la signature du groupe. Il décède en 1995 du SIDA à seulement 30 ans."
  },
  'ice-cube': {
    name: 'Ice Cube',
    role: 'Rappeur & Parolier',
    bio: "O'Shea Jackson, dit Ice Cube, est la plume de N.W.A. Auteur de la majorité des textes de 'Straight Outta Compton', il quitte le groupe en 1989 pour une carrière solo explosive. Il devient également acteur et réalisateur à succès à Hollywood."
  },
  'mc-ren': {
    name: 'MC Ren',
    role: 'Rappeur',
    bio: "Lorenzo Jerald Patterson, dit MC Ren, rejoint N.W.A en 1988. Considéré comme le 'Ruthless Villain', son flow agressif et ses textes crus incarnent l'essence du gangsta rap. Après la séparation, il poursuit une carrière solo underground respectée."
  },
  'dj-yella': {
    name: 'DJ Yella',
    role: 'DJ & Producteur',
    bio: "Antoine Carraby, dit DJ Yella, est le DJ officiel de N.W.A. Aux côtés de Dr. Dre, il façonne le son révolutionnaire du groupe. Expert du scratch et du sampling, il est le pilier discret mais essentiel de la machine N.W.A."
  },
  'arabian-prince': {
    name: 'Arabian Prince',
    role: 'Producteur & Rappeur',
    bio: "Mik Lezan, dit Arabian Prince, est un membre fondateur souvent oublié de N.W.A. Pionnier de l'electro-hop, il co-produit les premiers morceaux du groupe avant de partir en 1988. Son influence sur le son early N.W.A reste indéniable."
  }
};

// Système de détection de hitbox précise
const CharacterHitbox = {
  canvasCache: new Map(),
  
  // Initialiser le cache pour toutes les images
  init() {
    const images = document.querySelectorAll('.person-card img');
    images.forEach(img => {
      if (img.complete) {
        this.cacheImage(img);
      } else {
        img.addEventListener('load', () => this.cacheImage(img));
      }
    });
  },
  
  cacheImage(img) {
    if (this.canvasCache.has(img.src)) return;
    
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
      
      // Test si on peut lire les pixels (CORS)
      ctx.getImageData(0, 0, 1, 1);
      
      this.canvasCache.set(img.src, { canvas, ctx });
    } catch (e) {
      // CORS error - on marque comme non-disponible
      this.canvasCache.set(img.src, null);
    }
  },
  
  // Vérifier si un point est sur un pixel visible de l'image
  isPixelVisible(img, clientX, clientY) {
    const cached = this.canvasCache.get(img.src);
    
    // Si pas de cache ou erreur CORS, fallback sur bounding box simple
    if (!cached) return this.isInBoundingBox(img, clientX, clientY);
    
    const { canvas, ctx } = cached;
    const rect = img.getBoundingClientRect();
    
    // Coordonnées relatives à l'image affichée
    const relX = (clientX - rect.left) / rect.width;
    const relY = (clientY - rect.top) / rect.height;
    
    // Hors de l'image
    if (relX < 0 || relX > 1 || relY < 0 || relY > 1) return false;
    
    // Convertir en coordonnées canvas
    const canvasX = Math.floor(relX * canvas.width);
    const canvasY = Math.floor(relY * canvas.height);
    
    try {
      const pixel = ctx.getImageData(canvasX, canvasY, 1, 1).data;
      return pixel[3] > 50; // Alpha > 50 = pixel visible
    } catch (e) {
      return this.isInBoundingBox(img, clientX, clientY);
    }
  },
  
  isInBoundingBox(img, clientX, clientY) {
    const rect = img.getBoundingClientRect();
    return clientX >= rect.left && clientX <= rect.right && 
           clientY >= rect.top && clientY <= rect.bottom;
  },
  
  // Trouver le personnage sous le curseur
  findCharacterAt(clientX, clientY) {
    const allCards = document.querySelectorAll('.person-card[data-character]');
    let foundCard = null;
    let highestZIndex = -1;
    
    allCards.forEach(card => {
      const img = card.querySelector('img');
      if (!img) return;
      
      // Vérifier si le point est sur un pixel visible
      if (this.isPixelVisible(img, clientX, clientY)) {
        // Calculer le z-index effectif (front-row > back-row)
        const row = card.closest('.carousel-row');
        const isFrontRow = row && row.classList.contains('front-row');
        const baseZ = isFrontRow ? 1000 : 0;
        const cardZ = parseInt(window.getComputedStyle(card).zIndex) || 0;
        const effectiveZ = baseZ + cardZ;
        
        // Si ce personnage est devant, vérifier s'il bloque
        if (effectiveZ > highestZIndex) {
          highestZIndex = effectiveZ;
          foundCard = card;
        }
      }
    });
    
    return foundCard;
  }
};

function initCharacterCards() {
  const infoPanel = document.querySelector('.character-info');
  const overlay = document.querySelector('.character-overlay');
  const closeBtn = document.querySelector('.character-info-close');
  const heroSection = document.querySelector('.hero-section');
  const carouselRows = document.querySelectorAll('.carousel-row');
  
  if (!infoPanel || !overlay || !heroSection) return;
  
  // Initialiser le système de hitbox
  CharacterHitbox.init();
  
  const nameEl = infoPanel.querySelector('.character-name');
  const roleEl = infoPanel.querySelector('.character-role');
  const bioEl = infoPanel.querySelector('.character-bio');
  
  let currentHoveredCard = null;
  
  function openCharacter(characterId) {
    const data = characterData[characterId];
    if (!data) return;
    
    nameEl.textContent = data.name;
    roleEl.textContent = data.role;
    bioEl.textContent = data.bio;
    
    infoPanel.classList.add('is-visible');
    overlay.classList.add('is-visible');
  }
  
  function closeCharacter() {
    infoPanel.classList.remove('is-visible');
    overlay.classList.remove('is-visible');
  }
  
  function updateHover(card) {
    if (card === currentHoveredCard) return;
    
    // Retirer l'ancien hover
    if (currentHoveredCard) {
      currentHoveredCard.classList.remove('is-hovered');
    }
    
    // Appliquer le nouveau hover
    if (card) {
      card.classList.add('is-hovered');
      heroSection.style.cursor = 'pointer';
    } else {
      heroSection.style.cursor = '';
    }
    
    currentHoveredCard = card;
  }
  
  // Écouter les mouvements sur la hero section
  heroSection.addEventListener('mousemove', (e) => {
    // Bloquer le hover tant que le site n'est pas déverrouillé
    if (!siteUnlocked) return;
    
    const card = CharacterHitbox.findCharacterAt(e.clientX, e.clientY);
    updateHover(card);
    
    // Pauser le carrousel si on hover un personnage
    carouselRows.forEach(row => {
      if (card && card.closest('.carousel-row') === row) {
        row.classList.add('is-paused');
      } else {
        row.classList.remove('is-paused');
      }
    });
  });
  
  heroSection.addEventListener('mouseleave', () => {
    updateHover(null);
    carouselRows.forEach(row => row.classList.remove('is-paused'));
  });
  
  // Clic
  heroSection.addEventListener('click', (e) => {
    // Bloquer les clics tant que le site n'est pas déverrouillé
    if (!siteUnlocked) return;
    
    // Ignorer si on clique sur l'overlay ou le panel
    if (e.target.closest('.character-info') || e.target.closest('.character-overlay')) return;
    
    const card = CharacterHitbox.findCharacterAt(e.clientX, e.clientY);
    if (card) {
      openCharacter(card.dataset.character);
    }
  });
  
  // Fermeture
  if (closeBtn) closeBtn.addEventListener('click', closeCharacter);
  overlay.addEventListener('click', closeCharacter);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeCharacter();
  });
}
    
// ============================================
// INITIALISATION
// ============================================
function init() {
  initEntryScreen(); // IMPORTANT: Doit être appelé en premier
  ChapterMusicManager.init();
  initHorizontalSections();
  initCurtainTransition(); // Après initHorizontalSections pour avoir les ScrollTriggers
  initChapterTransitions(); // Transitions entre chapitres
  initProgressBar(); // Barre de progression
  initNavigation();
  initParallaxLayers();
  initNavbar();
  initNavIndicator();
  initSoundToggle();
  initNavbarAutoClose();
  initHoverAudio();
  initSmoothCarousels();
  initCharacterCards(); // Personnages cliquables
}

// ============================================
// BARRE DE PROGRESSION
// ============================================
function initProgressBar() {
  const progressContainer = document.querySelector('.progress-bar-container');
  const progressFill = document.querySelector('.progress-fill');
  const progressChapterNumber = document.querySelector('.progress-chapter-number');
  const progressChapterName = document.querySelector('.progress-chapter-name');
  const progressMarkers = document.querySelectorAll('.progress-marker');
  
  if (!progressContainer || !progressFill) return;
  
  const chapters = ['chapitre1', 'chapitre2', 'chapitre3', 'chapitre4', 'chapitre5'];
  const chapterRomanNumerals = ['I', 'II', 'III', 'IV', 'V'];
  
  // Éléments de transition (les mêmes que la navbar)
  const navTransitionPanel = document.querySelector('.nav-transition-panel');
  const navTransitionContent = document.querySelector('.nav-transition-content');
  const navTransitionTitle = document.querySelector('.nav-transition-title');
  const navTransitionSubtitle = document.querySelector('.nav-transition-subtitle');
  
  // Récupérer les infos d'un chapitre
  function getChapterInfo(chapterId) {
    const section = document.getElementById(chapterId);
    if (!section) return null;
    
    const triggers = ScrollTrigger.getAll();
    const trigger = triggers.find(t => t.trigger === section);
    
    if (!trigger) return null;
    
    return {
      start: trigger.start,
      end: trigger.end
    };
  }
  
  // Fonction pour naviguer vers un chapitre avec transition (comme la navbar)
  function navigateToChapter(chapterIndex) {
    if (!navTransitionPanel || !navTransitionContent) return;
    
    const chapterId = chapters[chapterIndex];
    const targetSection = document.getElementById(chapterId);
    const chapterInfo = chapterData[chapterId];
    
    if (!targetSection || !chapterInfo) return;
    
    // Cacher la barre de progression
    progressContainer.classList.remove('visible');
    
    // Mettre à jour le texte de transition
    if (navTransitionTitle) navTransitionTitle.textContent = chapterInfo.title;
    if (navTransitionSubtitle) navTransitionSubtitle.textContent = chapterInfo.subtitle;
    
    // Stopper le scroll
    lenis.stop();
    
    // Trouver la position cible
    const triggers = ScrollTrigger.getAll();
    const sectionTrigger = triggers.find(t => t.trigger === targetSection);
    const targetPosition = sectionTrigger ? sectionTrigger.start : targetSection.offsetTop;
    
    // Mettre à jour l'état si on vient de la hero
    if (curtainTransitionState.currentSection === 'hero') {
      if (curtainTransitionState.updateSection) {
        curtainTransitionState.updateSection('chapitre1');
      } else {
        curtainTransitionState.currentSection = 'chapitre1';
        document.body.classList.remove('in-hero');
      }
      curtainTransitionState.justNavigated = true;
      setTimeout(() => {
        curtainTransitionState.justNavigated = false;
      }, 3000);
    }
    
    // Timeline d'animation (identique à la navbar)
    const tl = gsap.timeline({
      onComplete: () => {
        setTimeout(() => {
          lenis.start();
        }, 100);
      }
    });
    
    // Phase 1: Slide in depuis la gauche
    tl.to(navTransitionPanel, { 
      x: '0%', 
      duration: 0.6, 
      ease: 'power2.inOut' 
    }, 0)
    
    // Phase 2: Afficher le contenu
    .to(navTransitionContent, { 
      opacity: 1, 
      scale: 1, 
      duration: 0.3, 
      ease: 'power2.out' 
    }, 0.3)
    
    // Phase 3: Téléportation
    .call(() => {
      window.scrollTo(0, targetPosition);
      ScrollTrigger.refresh();
    }, null, 0.7)
    
    // Phase 4: Petite pause
    .to({}, { duration: 0.3 })
    
    // Phase 5: Masquer le contenu
    .to(navTransitionContent, { 
      opacity: 0, 
      scale: 1.1, 
      duration: 0.2, 
      ease: 'power2.in' 
    }, 1.0)
    
    // Phase 6: Slide out vers la droite
    .to(navTransitionPanel, { 
      x: '100%', 
      duration: 0.6, 
      ease: 'power2.inOut' 
    }, 1.1)
    
    // Phase 7: Reset
    .call(() => {
      gsap.set(navTransitionPanel, { x: '-100%' });
      gsap.set(navTransitionContent, { opacity: 0, scale: 0.8 });
    }, null, 1.8);
  }
  
  // Ajouter les event listeners sur les marqueurs
  progressMarkers.forEach((marker, index) => {
    marker.addEventListener('click', (e) => {
      e.stopPropagation();
      navigateToChapter(index);
    });
  });
  
  // Mettre à jour la barre de progression
  function updateProgressBar() {
    const scrollY = window.scrollY;
    
    // Trouver le chapitre actuel
    let currentChapterIndex = -1;
    let currentProgress = 0;
    
    for (let i = 0; i < chapters.length; i++) {
      const info = getChapterInfo(chapters[i]);
      if (!info) continue;
      
      if (scrollY >= info.start - 50 && scrollY <= info.end + 50) {
        currentChapterIndex = i;
        currentProgress = (scrollY - info.start) / (info.end - info.start);
        currentProgress = Math.max(0, Math.min(1, currentProgress));
        break;
      }
    }
    
    // Si on n'est pas dans un chapitre, cacher la barre
    if (currentChapterIndex === -1 || curtainTransitionState.currentSection === 'hero') {
      progressContainer.classList.remove('visible');
      return;
    }
    
    // Afficher la barre
    progressContainer.classList.add('visible');
    
    // Mettre à jour le texte du chapitre
    const chapterInfo = chapterData[chapters[currentChapterIndex]];
    if (chapterInfo) {
      progressChapterNumber.textContent = chapterRomanNumerals[currentChapterIndex];
      progressChapterName.textContent = chapterInfo.subtitle;
    }
    
    // Mettre à jour la barre de remplissage
    // 5 chapitres = 20% chacun, progression globale de 0% à 100%
    const chapterWidth = 100 / chapters.length; // 20%
    const globalProgress = (currentChapterIndex * chapterWidth) + (currentProgress * chapterWidth);
    progressFill.style.width = `${globalProgress}%`;
    
    // Mettre à jour les marqueurs
    progressMarkers.forEach((marker, index) => {
      marker.classList.remove('active', 'passed');
      
      if (index === currentChapterIndex) {
        marker.classList.add('active');
      } else if (index < currentChapterIndex) {
        marker.classList.add('passed');
      }
    });
  }
  
  // Écouter le scroll
  lenis.on('scroll', updateProgressBar);
  
  // Écouter aussi les transitions
  const observer = new MutationObserver(() => {
    if (chapterTransitionState.isAnimating || curtainTransitionState.isAnimating) {
      progressContainer.classList.remove('visible');
    }
  });
  
  // Mise à jour initiale après un délai pour que les ScrollTriggers soient prêts
  setTimeout(updateProgressBar, 500);
}

// ============================================
// SORTIR LES TITRES DES BLOCS DE CONTENU
// ============================================
function extractTitlesFromBlocks() {
  const contentTitles = document.querySelectorAll('.content-block-title');
  
  contentTitles.forEach((title) => {
    const block = title.closest('.content-block');
    if (!block) return;
    
    const track = block.closest('.horizontal-track');
    if (!track) return;
    
    // Créer un élément titre détaché
    const detachedTitle = title.cloneNode(true);
    detachedTitle.classList.add('title-detached');
    
    // Insérer le titre détaché dans le track (après le contenu)
    track.appendChild(detachedTitle);
    
    // Masquer le titre original
    title.style.display = 'none';
    
    // Synchroniser les positions avec GSAP
    gsap.ticker.add(() => {
      const blockRect = block.getBoundingClientRect();
      const trackRect = track.getBoundingClientRect();
      
      // Position relative au track - dépasser du bloc vers haut et gauche
      const relativeX = blockRect.left - trackRect.left;
      const relativeY = blockRect.top - trackRect.top;
      
      detachedTitle.style.left = (relativeX - 30) + 'px';
      detachedTitle.style.top = (relativeY - 20) + 'px';
    });
  });
}

// ============================================
// LOGO FIXE - RETOUR HERO
// ============================================
function initHomeFixedLogo() {
  const homeFixedLogo = document.getElementById('homeFixedLogo');
  
  if (!homeFixedLogo) return;
  
  homeFixedLogo.addEventListener('click', (e) => {
    e.preventDefault();
    
    // Utiliser Lenis pour un smooth scroll vers le haut
    if (typeof lenis !== 'undefined') {
      lenis.scrollTo(0, { duration: 1.5 });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
}

// ============================================
// ICÔNE CHAPITRE FIXE
// ============================================
const ChapterIconManager = {
  currentChapter: null,
  iconContainer: null,
  iconImg: null,
  
  init() {
    this.iconContainer = document.getElementById('chapterIconFixed');
    this.iconImg = document.getElementById('chapterIconImg');
    
    if (!this.iconContainer || !this.iconImg) return;
    
    // Observer les changements de chapitre via ChapterMusicManager
    this.startObserving();
  },
  
  startObserving() {
    // Vérifier le chapitre courant régulièrement
    const checkChapter = () => {
      const currentChapterId = ChapterMusicManager.currentChapter;
      
      if (currentChapterId && currentChapterId !== this.currentChapter) {
        this.updateIcon(currentChapterId);
      }
    };
    
    // Vérifier toutes les 200ms
    setInterval(checkChapter, 200);
  },
  
  updateIcon(chapterId) {
    if (!this.iconContainer || !this.iconImg) return;
    if (!chapterData[chapterId]) return;
    
    const newIcon = chapterData[chapterId].icon;
    if (!newIcon) return;
    
    // Animation de changement
    this.iconContainer.classList.add('is-changing');
    
    setTimeout(() => {
      this.iconImg.src = newIcon;
      this.currentChapter = chapterId;
      
      // Attendre le chargement de l'image
      this.iconImg.onload = () => {
        this.iconContainer.classList.remove('is-changing');
      };
      
      // Fallback si l'image ne charge pas
      setTimeout(() => {
        this.iconContainer.classList.remove('is-changing');
      }, 300);
    }, 200);
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    extractTitlesFromBlocks();
    initHomeFixedLogo();
    ChapterIconManager.init();
    init();
  });
} else {
  extractTitlesFromBlocks();
  initHomeFixedLogo();
  ChapterIconManager.init();
  init();
}