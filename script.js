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

/*
 Hover audio: play associated music while hovering a button and fade in/out.
 - Buttons can specify `data-audio="music/filename.mp3"` on the element.
 - If no `data-audio` provided, the script will try to derive a file name from
   the button text (lowercase, spaces -> '-', strip non-alphanum) and try .mp3.
 - Fade durations and target volume are configurable via constants below.
*/
(function attachHoverAudio() {
  const HOVER_FADE_MS = 800; // fade in/out duration (increased for a slower fade)
  const TARGET_VOLUME = 0.8; // target playback volume

  const audioMap = new Map(); // element -> { audio, fadeTimer }
  let audioUnlocked = false;

  function deriveSrcFromText(text) {
    const name = text.trim().toLowerCase()
      .replace(/[\s\/\\]+/g, '-')
      .replace(/[^a-z0-9\-]/g, '') || 'audio';
    return `music/${name}.mp3`;
  }

  function createAudioElement(src) {
    const a = new Audio(src);
    a.preload = 'auto';
    a.loop = true;
    a.volume = 0;
    // If loading fails, try common alternate extensions (.ogg, .m4a)
    a._tryFallbacks = [
      src.replace(/\.mp3$/i, '.ogg'),
      src.replace(/\.mp3$/i, '.m4a')
    ].filter(s => s !== src);
    a.addEventListener('error', (ev) => {
      console.error('[HoverAudio] failed to load audio', src, ev);
      // try fallbacks sequentially
      if (a._tryFallbacks && a._tryFallbacks.length) {
        const next = a._tryFallbacks.shift();
        console.debug('[HoverAudio] trying fallback', next);
        a.src = next;
        a.load();
        try { a.play().catch(()=>{}); } catch(e){}
      } else {
        console.error('[HoverAudio] no more fallbacks for', src);
      }
    });
    a.addEventListener('canplaythrough', () => {
      console.debug('[HoverAudio] canplaythrough', src);
    });
    return a;
  }

  function fadeTo(audio, toVolume, duration, cb) {
    if (!audio) return;
    if (audio._fadeTimer) {
      clearInterval(audio._fadeTimer);
      audio._fadeTimer = null;
    }
    const from = audio.volume;
    const dt = 40; // ms step
    const steps = Math.max(1, Math.round(duration / dt));
    const stepDelta = (toVolume - from) / steps;
    let currentStep = 0;
    audio._fadeTimer = setInterval(() => {
      currentStep++;
      const next = Math.min(1, Math.max(0, audio.volume + stepDelta));
      audio.volume = next;
      if (currentStep >= steps) {
        clearInterval(audio._fadeTimer);
        audio._fadeTimer = null;
        audio.volume = toVolume;
        if (cb) cb();
      }
    }, dt);
  }

  function onEnter(e) {
    const el = e.currentTarget;
    console.debug('[HoverAudio] hover enter on', el, 'text:', (el.textContent||el.innerText));
    let entry = audioMap.get(el);
    let audioSrc = el.getAttribute('data-audio');
    if (!audioSrc) {
      audioSrc = deriveSrcFromText(el.textContent || el.innerText || 'audio');
    }
    console.debug('[HoverAudio] resolved audio src:', audioSrc);

    if (!entry || entry.src !== audioSrc) {
      // if different audio is playing for this element, stop it
      if (entry && entry.audio) {
        if (entry.audio._fadeTimer) { clearInterval(entry.audio._fadeTimer); entry.audio._fadeTimer = null; }
        try { entry.audio.pause(); } catch (err) {}
      }
      const audio = createAudioElement(audioSrc);
      entry = { audio, src: audioSrc };
      audioMap.set(el, entry);
    }

    const audio = entry.audio;
      // If the element specifies a start time (in seconds), seek when possible
      const startTimeAttr = el.getAttribute('data-start-time');
      if (startTimeAttr !== null) {
        const parsedStart = parseFloat(startTimeAttr);
        if (!isNaN(parsedStart) && parsedStart > 0) {
          const seek = () => {
            try { audio.currentTime = parsedStart; } catch (err) { /* ignore */ }
          };
          if (audio.readyState >= 1) {
            seek();
          } else {
            audio.addEventListener('loadedmetadata', function onMeta() {
              audio.removeEventListener('loadedmetadata', onMeta);
              seek();
            });
          }
        }
      }

      // Per-element volume override via `data-volume` (0.0 - 1.0). Falls back to TARGET_VOLUME.
      let targetVolume = TARGET_VOLUME;
      const volAttr = el.getAttribute('data-volume');
      if (volAttr !== null) {
        const parsedVol = parseFloat(volAttr);
        if (!isNaN(parsedVol)) targetVolume = Math.max(0, Math.min(1, parsedVol));
      }
    // if already playing, just ensure fade to target
    if (audio.paused) {
      // play returns a promise in modern browsers
      const p = audio.play();
      if (p && p.catch) p.catch((err) => {
        console.warn('[HoverAudio] play() rejected for', audioSrc, err);
      });
    }
      // fade in to the element's target volume
      console.debug('[HoverAudio] fade in ->', targetVolume, 'for', audioSrc);
      fadeTo(audio, targetVolume, HOVER_FADE_MS);
  }

  function onLeave(e) {
    const el = e.currentTarget;
    console.debug('[HoverAudio] hover leave on', el);
    const entry = audioMap.get(el);
    if (!entry || !entry.audio) return;
    const audio = entry.audio;
    // fade out then pause
    console.debug('[HoverAudio] fade out for', entry.src);
    fadeTo(audio, 0, HOVER_FADE_MS, () => {
      try { audio.pause(); audio.currentTime = 0; } catch (err) {}
    });
  }

  // Attach to nav-links a elements and any element with `data-audio` (buttons)
  const hoverTargets = Array.from(document.querySelectorAll('.nav-links a, [data-audio]'));
  hoverTargets.forEach(t => {
    t.addEventListener('mouseenter', onEnter);
    t.addEventListener('mouseleave', onLeave);
    // also support focus/blur for keyboard users
    t.addEventListener('focus', onEnter);
    t.addEventListener('blur', onLeave);
  });

  // Some browsers block audible play until a user gesture; hover may not count.
  // To avoid requiring a click on a specific link, listen for the first
  // user gesture (pointerdown or keydown) anywhere and pre-play muted audio
  // for each target to "unlock" playback capability.
  function unlockAllAudio() {
    if (audioUnlocked) return;
    audioUnlocked = true;
    console.debug('[HoverAudio] unlocking audio by preplaying muted tracks');
    hoverTargets.forEach(t => {
      try {
        const src = t.getAttribute('data-audio') || deriveSrcFromText(t.textContent || t.innerText || 'audio');
        const a = createAudioElement(src);
        a.muted = true;
        // try to play briefly to unlock autoplay policy
        const p = a.play();
        if (p && p.catch) p.catch(() => {});
        // stop after a short time
        setTimeout(() => {
          try { a.pause(); a.currentTime = 0; } catch (e) {}
        }, 200);
      } catch (e) {
        // ignore per-source errors
      }
    });
    document.removeEventListener('pointerdown', unlockAllAudio);
    document.removeEventListener('keydown', unlockAllAudio);
  }

  document.addEventListener('pointerdown', unlockAllAudio, { once: true });
  document.addEventListener('keydown', unlockAllAudio, { once: true });
})();
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
      // initial offset: priority order
      // 1) `data-initial-time` in seconds (start as if carousel ran this many seconds)
      // 2) `data-initial-offset` in pixels
      // 3) default small initial time (5s)
      let offset = 0;
      const initTimeAttr = track.getAttribute('data-initial-time');
      if (initTimeAttr !== null) {
        const parsedTime = parseFloat(initTimeAttr);
        if (!isNaN(parsedTime) && parsedTime > 0) {
          // offset = seconds * speed, wrapped within groupWidth
          offset = (parsedTime * speed) % groupWidth;
        }
      } else {
        const initOffsetAttr = track.getAttribute('data-initial-offset');
        if (initOffsetAttr !== null) {
          const parsed = parseFloat(initOffsetAttr);
          if (!isNaN(parsed)) offset = Math.max(0, parsed) % groupWidth;
        } else {
          // default: start as if carousel already ran 5 seconds
          const defaultStartSeconds = 5;
          offset = (defaultStartSeconds * speed) % groupWidth;
        }
      }
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

// Parallax for `.layer-bg` and `.layer-main` — mouse position driven, eased via rAF
function initParallaxLayers() {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const container = document.querySelector('.transition') || document.querySelector('.hero-section');
  const bg = document.querySelector('.layer-bg');
  const main = document.querySelector('.layer-main');
  if (!container || (!bg && !main)) return;

  // Strength in pixels (how much each layer moves). Background moves less and opposite,
  // foreground/main moves more. Reduced strength for a subtler effect.
  // reduce strengths and slow lerp so movement is subtler and takes longer
  // Larger amplitude on X, but keep easing slow so motion doesn't feel faster
  const BG_STRENGTH_X = 40; // px (subtle but larger than before)
  const BG_STRENGTH_Y = 0; // vertical movement disabled
  const MAIN_STRENGTH_X = 80; // px (foreground moves more noticeably)
  const MAIN_STRENGTH_Y = 0; // vertical movement disabled

  // smoothed values (horizontal-only). Lower ease => slower to reach target.
  let targetX = 0;
  let currentX = 0;
  const ease = 0.002; // keep slow easing so movement takes longer (unchanged)

  function onMove(e) {
    const rect = container.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const x = (e.clientX - cx) / (rect.width / 2); // -1 .. 1
    // clamp only horizontal axis
    targetX = Math.max(-1, Math.min(1, x));
  }

  function onLeave() {
    targetX = 0;
  }

  container.addEventListener('mousemove', onMove);
  container.addEventListener('mouseleave', onLeave);
  container.addEventListener('touchstart', (ev) => {
    if (ev.touches && ev.touches[0]) onMove(ev.touches[0]);
  }, { passive: true });
  container.addEventListener('touchmove', (ev) => {
    if (ev.touches && ev.touches[0]) onMove(ev.touches[0]);
  }, { passive: true });
  container.addEventListener('touchend', onLeave);

  function rafStep() {
    // simple lerp toward target
    // horizontal-only lerp
    currentX += (targetX - currentX) * ease;

    // Apply horizontal-only transforms
    if (bg) {
      // background moves opposite and subtly on X only
      const bx = -currentX * BG_STRENGTH_X;
      bg.style.transform = `translate3d(${bx}px, 0, 0)`;
    }
    if (main) {
      // main moves with cursor horizontally; vertical is disabled
      const mx = currentX * MAIN_STRENGTH_X;
      main.style.transform = `translate3d(calc(-50% + ${mx}px), 0, 0)`;
    }

    requestAnimationFrame(rafStep);
  }

  requestAnimationFrame(rafStep);
}

initParallaxLayers();

// Scrollbar edge-hider removed: scrollbars are hidden globally via CSS.