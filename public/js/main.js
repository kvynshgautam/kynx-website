// KYNX High-End Scroll & Feature Simulator Core
// Engineered by KG | Peer: Gaurav Gautam

document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // 1. Sound FX Disabled
  // ==========================================
  function playClickSound() {}
  function playScanSound() {}
  function playPurgeSound() {}
  function playHeartSound() {}


  // ==========================================
  // 2. Lenis Momentum Smooth Scroll + GSAP Register
  // ==========================================
  let lenis = null;
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      duration: 1.25,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.5,
    });

    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);

      lenis.on('scroll', ScrollTrigger.update);

      gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
      });

      gsap.ticker.lagSmoothing(0);
    }
  }

  // Top Progress Bar & Navbar Scroll styling
  const progressBar = document.getElementById('scroll-progress');
  const navbar = document.querySelector('.navbar');

  window.addEventListener('scroll', () => {
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;
    if (progressBar) progressBar.style.width = `${progress}%`;

    if (navbar) {
      if (window.scrollY > 40) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }
  });


  // ==========================================
  // 3. Hero 3D Perspective Phone & Parallax Badges
  // ==========================================
  const heroPhone = document.getElementById('hero-phone');
  const badgeTopLeft = document.querySelector('.badge-top-left');
  const badgeBottomRight = document.querySelector('.badge-bottom-right');

  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined' && heroPhone) {
    gsap.set(heroPhone, {
      transformPerspective: 1200,
      rotateY: -8,
      rotateX: 6,
      scale: 0.98,
    });

    gsap.to(heroPhone, {
      scrollTrigger: {
        trigger: '.hero-section',
        start: 'top top',
        end: 'bottom top',
        scrub: 1,
      },
      rotateY: 0,
      rotateX: 0,
      scale: 1.02,
      y: 60,
      ease: 'power1.out',
    });

    if (badgeTopLeft) {
      gsap.to(badgeTopLeft, {
        scrollTrigger: {
          trigger: '.hero-section',
          start: 'top top',
          end: 'bottom top',
          scrub: 1.2,
        },
        y: -90,
        x: -20,
        opacity: 0.3,
      });
    }

    if (badgeBottomRight) {
      gsap.to(badgeBottomRight, {
        scrollTrigger: {
          trigger: '.hero-section',
          start: 'top top',
          end: 'bottom top',
          scrub: 1.2,
        },
        y: 80,
        x: 20,
        opacity: 0.3,
      });
    }
  }


  // ==========================================
  // 4. Pinned Scroll Storyboard (The Feature Theatre)
  // ==========================================
  const storyboardSection = document.querySelector('.storyboard-section');
  const sbPhone = document.getElementById('storyboard-phone');
  const sbScreen = document.getElementById('sb-screen');
  const sbStatus = document.getElementById('sb-phone-status');
  const sbDynamicNotch = document.getElementById('sb-dynamic-notch');
  const sbPills = document.querySelectorAll('.sb-pill');
  const chapterSteps = document.querySelectorAll('.chapter-step');

  const screenSteps = [
    document.getElementById('screen-step-0'),
    document.getElementById('screen-step-1'),
    document.getElementById('screen-step-2'),
    document.getElementById('screen-step-3'),
    document.getElementById('screen-step-4'),
  ];

  const shaderNames = [
    'Obsidian Velvet (#08090E)',
    'Electric Violet (#0E0720)',
    'Cyber Nebula (#040E1E)',
    'Emerald Matrix (#04140D)',
    'Crimson Eclipse (#160510)',
  ];

  const shaderGradients = [
    'linear-gradient(180deg, #08090e 0%, #131120 100%)',
    'linear-gradient(180deg, #0e0720 0%, #22113d 100%)',
    'linear-gradient(180deg, #040e1e 0%, #0a223e 100%)',
    'linear-gradient(180deg, #04140d 0%, #082b1c 100%)',
    'linear-gradient(180deg, #160510 0%, #330922 100%)',
  ];

  let currentActiveStep = 0;
  const sbMobileStepIndicator = document.getElementById('sb-mobile-step-indicator');

  function setStoryboardStep(stepIndex) {
    if (stepIndex === currentActiveStep && screenSteps[stepIndex] && screenSteps[stepIndex].style.display === 'flex') return;
    currentActiveStep = stepIndex;
    playClickSound();

    // 1. Update Pills
    sbPills.forEach((p, idx) => {
      p.classList.toggle('active', idx === stepIndex);
    });

    // Auto-scroll active pill into view on mobile
    if (window.innerWidth <= 992 && sbPills[stepIndex]) {
      sbPills[stepIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }

    // 2. Update Narrative Chapters
    chapterSteps.forEach((chap, idx) => {
      chap.classList.toggle('active', idx === stepIndex);
    });

    // 3. Update Phone Screen
    screenSteps.forEach((scr, idx) => {
      if (scr) {
        scr.style.display = (idx === stepIndex) ? 'flex' : 'none';
      }
    });

    // 4. Update Mobile Step Indicator (01 / 05)
    if (sbMobileStepIndicator) {
      sbMobileStepIndicator.textContent = `0${stepIndex + 1} / 05`;
    }

    // 5. Update 3D Phone Perspective, Status & Dynamic Notch
    if (sbPhone) {
      const isDesktop = window.innerWidth > 992;
      if (stepIndex === 0) {
        sbPhone.style.transform = isDesktop ? 'perspective(1200px) rotateY(-6deg) rotateX(4deg)' : 'none';
        if (sbStatus) sbStatus.textContent = '● Offline Mesh • 0 Internet';
        if (sbDynamicNotch) sbDynamicNotch.textContent = '📡 MESH ARMED';
      } else if (stepIndex === 1) {
        sbPhone.style.transform = isDesktop ? 'perspective(1200px) rotateY(6deg) rotateX(3deg)' : 'none';
        if (sbStatus) sbStatus.textContent = '● Instant Media • 120 FPS';
        if (sbDynamicNotch) sbDynamicNotch.textContent = '⚡ DECODE: 0.18ms';
      } else if (stepIndex === 2) {
        sbPhone.style.transform = isDesktop ? 'perspective(1200px) rotateY(-4deg) rotateX(-2deg)' : 'none';
        if (sbStatus) sbStatus.textContent = '● Protected • FLAG_SECURE';
        if (sbDynamicNotch) sbDynamicNotch.textContent = '🛡️ FLAG_SECURE';
        playPurgeSound();
      } else if (stepIndex === 3) {
        sbPhone.style.transform = isDesktop ? 'perspective(1200px) rotateY(4deg) rotateX(2deg)' : 'none';
        if (sbStatus) sbStatus.textContent = '● Physics Engine • 120Hz';
        if (sbDynamicNotch) sbDynamicNotch.textContent = '👆 GESTURE: 120 FPS';
      } else if (stepIndex === 4) {
        sbPhone.style.transform = isDesktop ? 'perspective(1200px) rotateY(0deg) rotateX(0deg) scale(1.02)' : 'none';
        if (sbStatus) sbStatus.textContent = '● Skia GL • 5 Shaders';
        if (sbDynamicNotch) sbDynamicNotch.textContent = '🎨 SKIA GL: SHADER';
      }
    }
  }

  // Chapter 0: Interactive Mesh Ping
  const btnPingMesh = document.getElementById('sb-ping-mesh-btn');
  const radarPacket = document.getElementById('sb-radar-packet');
  const meshFeedback = document.getElementById('sb-mesh-feedback');

  if (btnPingMesh && radarPacket) {
    btnPingMesh.addEventListener('click', () => {
      playScanSound();
      radarPacket.style.display = 'block';
      radarPacket.style.transition = 'none';
      radarPacket.style.top = '55px';
      radarPacket.style.left = '20px';
      radarPacket.style.opacity = '1';

      if (meshFeedback) meshFeedback.textContent = '[1/2] Packet hopping to Node 2 (Blind Relay)...';

      setTimeout(() => {
        radarPacket.style.transition = 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
        radarPacket.style.top = '25px';
        radarPacket.style.left = '125px';
      }, 50);

      setTimeout(() => {
        if (meshFeedback) meshFeedback.textContent = '[2/2] Hop 2: Arrived at Gaurav! Decrypting with PubKey...';
        radarPacket.style.top = '65px';
        radarPacket.style.left = '235px';
      }, 500);

      setTimeout(() => {
        if (meshFeedback) meshFeedback.textContent = '✓ Delivered! (2 Hops | RSSI -44 dBm | 0 Cellular Needed)';
        playHeartSound();
      }, 950);
    });
  }

  // Chapter 1: Interactive Audio Player Simulation
  const btnAudioPlay = document.getElementById('sb-audio-play-btn');
  const waveformBars = document.getElementById('sb-waveform-bars');
  let isAudioPlaying = false;

  if (btnAudioPlay && waveformBars) {
    btnAudioPlay.addEventListener('click', () => {
      isAudioPlaying = !isAudioPlaying;
      playClickSound();
      if (isAudioPlaying) {
        btnAudioPlay.textContent = '⏸';
        waveformBars.classList.add('playing');
      } else {
        btnAudioPlay.textContent = '▶';
        waveformBars.classList.remove('playing');
      }
    });
  }

  // Chapter 2: Interactive View-Once Shred Simulation
  const btnVoShred = document.getElementById('sb-vo-shred-btn');
  const vaultContent = document.getElementById('sb-vault-content');
  const vaultTimer = document.getElementById('sb-vault-timer');
  const voFeedback = document.getElementById('sb-vo-feedback');
  let voCountdownInterval = null;

  if (btnVoShred && vaultContent) {
    btnVoShred.addEventListener('click', () => {
      playClickSound();
      btnVoShred.disabled = true;
      let seconds = 3;
      if (voCountdownInterval) clearInterval(voCountdownInterval);

      if (voFeedback) voFeedback.textContent = '⚠️ Memory shred sequence initialized...';
      if (vaultTimer) vaultTimer.textContent = `⏱️ 00:0${seconds}s AUTO-PURGE`;

      voCountdownInterval = setInterval(() => {
        seconds--;
        if (seconds > 0) {
          if (vaultTimer) vaultTimer.textContent = `⏱️ 00:0${seconds}s AUTO-PURGE`;
        } else {
          clearInterval(voCountdownInterval);
          playPurgeSound();
          vaultContent.innerHTML = `
            <span style="font-size:30px">🗑️</span>
            <strong style="font-size:12px; color:#10b981; display:block">MEMORY PURGED DIRECTLY</strong>
            <span style="font-size:10px; color:#94a3b8; font-family:var(--font-mono)">0 Bytes remaining on disk</span>
          `;
          if (voFeedback) voFeedback.textContent = '✓ Raw cached bytes permanently shredded from RAM & Storage.';
          btnVoShred.innerHTML = '<span>Purge Complete ✓</span>';
        }
      }, 700);
    });
  }

  // Chapter 3: Interactive Storyboard Swipe & Reactions
  const sbSwipeTarget = document.getElementById('sb-swipe-target');
  const sbReplyBanner = document.getElementById('sb-reply-banner');
  const sbHeartBurst = document.getElementById('sb-heart-burst');
  const sbHeartCount = document.getElementById('sb-heart-count');
  const sbTriggerSwipeBtn = document.getElementById('sb-trigger-swipe-btn');
  let heartCount = 1;

  function triggerSbSwipe() {
    if (!sbSwipeTarget) return;
    playClickSound();
    sbSwipeTarget.style.transition = 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
    sbSwipeTarget.style.transform = 'translateX(55px)';

    setTimeout(() => {
      sbSwipeTarget.style.transform = 'translateX(0px)';
      if (sbReplyBanner) sbReplyBanner.style.display = 'block';
      if (sbHeartBurst) sbHeartBurst.style.display = 'inline-flex';
      playHeartSound();
    }, 380);
  }

  if (sbSwipeTarget) {
    let lastTap = 0;
    sbSwipeTarget.addEventListener('click', () => {
      const now = Date.now();
      if (now - lastTap < 350) {
        // Double tap for heart
        playHeartSound();
        heartCount++;
        if (sbHeartCount) sbHeartCount.textContent = heartCount;
        if (sbHeartBurst) sbHeartBurst.style.display = 'inline-flex';
      } else {
        triggerSbSwipe();
      }
      lastTap = now;
    });
  }

  if (sbTriggerSwipeBtn) {
    sbTriggerSwipeBtn.addEventListener('click', triggerSbSwipe);
  }

  // Chapter 4: In-Phone Shader Picker Dots
  const shaderDots = document.querySelectorAll('.sb-shader-dot');
  const activeShaderLabel = document.getElementById('active-shader-label');

  shaderDots.forEach(dot => {
    dot.addEventListener('click', () => {
      playClickSound();
      const sIdx = parseInt(dot.getAttribute('data-shader') || '0', 10);
      shaderDots.forEach((d, idx) => d.classList.toggle('active', idx === sIdx));
      if (sbScreen && shaderGradients[sIdx]) {
        sbScreen.style.background = shaderGradients[sIdx];
      }
      if (activeShaderLabel && shaderNames[sIdx]) {
        activeShaderLabel.textContent = shaderNames[sIdx];
      }
    });
  });

  // Storyboard Step Jump Helper (Smooth scroll sync on desktop, instant smooth switch on mobile)
  function jumpToStoryboardStep(targetStep) {
    const bounded = Math.max(0, Math.min(4, targetStep));
    setStoryboardStep(bounded);
    if (window.innerWidth > 992 && typeof ScrollTrigger !== 'undefined' && storyboardSection) {
      const st = ScrollTrigger.getById('storyboard') || ScrollTrigger.getAll().find(s => s.trigger === storyboardSection);
      if (st) {
        const targetScroll = st.start + (bounded / 4) * (st.end - st.start) + 2;
        if (typeof lenis !== 'undefined' && lenis) {
          lenis.scrollTo(targetScroll, { duration: 0.6 });
        } else {
          window.scrollTo({ top: targetScroll, behavior: 'smooth' });
        }
      }
    }
  }

  // Storyboard Pills Direct Step Activation
  sbPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      const targetStep = parseInt(pill.getAttribute('data-step') || '0', 10);
      jumpToStoryboardStep(targetStep);
    });
  });

  // Mobile Storyboard Prev / Next Controls
  const sbMobilePrev = document.getElementById('sb-mobile-prev');
  const sbMobileNext = document.getElementById('sb-mobile-next');
  if (sbMobilePrev) {
    sbMobilePrev.addEventListener('click', () => {
      jumpToStoryboardStep(currentActiveStep - 1);
    });
  }
  if (sbMobileNext) {
    sbMobileNext.addEventListener('click', () => {
      jumpToStoryboardStep(currentActiveStep + 1);
    });
  }

  // Touch Swipe Gesture on Phone Mockup (Left/Right to advance/rewind)
  if (sbPhone) {
    let touchStartX = 0;
    let touchStartY = 0;
    sbPhone.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    sbPhone.addEventListener('touchend', (e) => {
      if (e.changedTouches && e.changedTouches.length === 1) {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;
        if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
          if (diffX < 0) {
            // Swiped left -> next chapter
            jumpToStoryboardStep(currentActiveStep + 1);
          } else {
            // Swiped right -> prev chapter
            jumpToStoryboardStep(currentActiveStep - 1);
          }
        }
      }
    }, { passive: true });
  }

  // Mobile Smart Auto-Tour: Gently advances chapters every 5s when visible; pauses on any user tap
  let mobileTourTimer = null;
  let userInteracted = false;

  function stopMobileTour() {
    userInteracted = true;
    if (mobileTourTimer) {
      clearInterval(mobileTourTimer);
      mobileTourTimer = null;
    }
  }

  sbPills.forEach(p => p.addEventListener('click', stopMobileTour));
  if (sbMobilePrev) sbMobilePrev.addEventListener('click', stopMobileTour);
  if (sbMobileNext) sbMobileNext.addEventListener('click', stopMobileTour);
  if (sbPhone) sbPhone.addEventListener('touchstart', stopMobileTour, { passive: true });

  if (window.innerWidth <= 992 && 'IntersectionObserver' in window && storyboardSection) {
    const tourObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !userInteracted && !mobileTourTimer) {
          mobileTourTimer = setInterval(() => {
            if (userInteracted) {
              clearInterval(mobileTourTimer);
              return;
            }
            const nextStep = (currentActiveStep + 1) % 5;
            setStoryboardStep(nextStep);
          }, 5000);
        } else if (!entry.isIntersecting && mobileTourTimer) {
          clearInterval(mobileTourTimer);
          mobileTourTimer = null;
        }
      });
    }, { threshold: 0.35 });

    tourObserver.observe(storyboardSection);
  }

  // GSAP ScrollTrigger for Pinned Storyboard - Desktop Only (> 992px)
  // On mobile & tablet, pinning is disabled for full-size proud phone, touch swipe & steppers
  if (window.innerWidth > 992 && typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined' && storyboardSection) {
    ScrollTrigger.create({
      id: 'storyboard',
      trigger: storyboardSection,
      start: 'top top',
      end: '+=2400',
      pin: true,
      scrub: 0.5,
      onUpdate: (self) => {
        const progress = self.progress;
        let step = 0;
        if (progress < 0.20) step = 0;
        else if (progress < 0.40) step = 1;
        else if (progress < 0.60) step = 2;
        else if (progress < 0.80) step = 3;
        else step = 4;

        setStoryboardStep(step);

        // Dynamically shift GPU shaders during step 4
        if (step === 4 && sbScreen) {
          const subProgress = Math.max(0, Math.min(1, (progress - 0.80) / 0.20));
          const shaderIdx = Math.min(Math.floor(subProgress * shaderGradients.length), shaderGradients.length - 1);
          sbScreen.style.background = shaderGradients[shaderIdx];
          if (activeShaderLabel) activeShaderLabel.textContent = shaderNames[shaderIdx];
          shaderDots.forEach((d, idx) => d.classList.toggle('active', idx === shaderIdx));
        }
      }
    });
  }


  // ==========================================
  // 5. Interactive Canvas Particle Background
  // ==========================================
  const canvas = document.getElementById('bg-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const particleCount = Math.min(width > 768 ? 45 : 20, 50);

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        size: Math.random() * 2 + 1,
        color: Math.random() > 0.5 ? 'rgba(139, 92, 246,' : 'rgba(6, 182, 212,'
      });
    }

    function animateParticles() {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.fillStyle = `${p.color}0.8)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 130) {
            ctx.strokeStyle = `rgba(139, 92, 246, ${0.16 * (1 - dist / 130)})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(animateParticles);
    }
    animateParticles();
  }


  // ==========================================
  // 6. Interactive View-Once Simulator
  // ==========================================
  const voSimBtn = document.getElementById('vo-sim-btn');
  const voStatus = document.getElementById('vo-status-display');
  const voModal = document.getElementById('vo-preview-modal');
  const voCloseBtn = document.getElementById('vo-modal-close');
  let voIsOpened = false;

  if (voSimBtn && voModal) {
    voSimBtn.addEventListener('click', () => {
      if (voIsOpened) {
        alert("This media has already self-destructed and auto-purged from device storage!");
        return;
      }
      playScanSound();
      voModal.style.display = 'flex';
    });

    if (voCloseBtn) {
      voCloseBtn.addEventListener('click', () => {
        playPurgeSound();
        voModal.style.display = 'none';
        voIsOpened = true;
        if (voStatus) {
          voStatus.innerHTML = '<span style="color:#94a3b8">① Photo • Opened (Purged 0B)</span>';
        }
        if (voSimBtn) {
          voSimBtn.style.background = '#141520';
          voSimBtn.style.borderColor = 'rgba(255,255,255,0.1)';
          voSimBtn.style.cursor = 'not-allowed';
        }
      });
    }
  }


  // ==========================================
  // 7. Interactive Wallpaper Live Switcher on Hero Phone
  // ==========================================
  const heroPhoneBody = document.getElementById('hero-phone-body');
  const wallpaperChips = document.querySelectorAll('.wp-chip');

  const wallpaperGradients = {
    obsidian: 'linear-gradient(180deg, #08090e 0%, #131120 100%)',
    violet: 'linear-gradient(180deg, #0e0720 0%, #22113d 100%)',
    nebula: 'linear-gradient(180deg, #040e1e 0%, #0a223e 100%)',
    emerald: 'linear-gradient(180deg, #04140d 0%, #082b1c 100%)',
    crimson: 'linear-gradient(180deg, #160510 0%, #330922 100%)'
  };

  wallpaperChips.forEach(chip => {
    chip.addEventListener('click', () => {
      playClickSound();
      wallpaperChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const wpKey = chip.getAttribute('data-wp');
      if (heroPhoneBody && wallpaperGradients[wpKey]) {
        heroPhoneBody.style.background = wallpaperGradients[wpKey];
      }
    });
  });


  // ==========================================
  // 8. Interactive Swipe-to-Reply Simulator on Hero Phone
  // ==========================================
  const demoSwipeBubble = document.getElementById('demo-swipe-bubble');
  const demoQuoteBanner = document.getElementById('demo-quote-banner');
  const btnTriggerSwipe = document.getElementById('btn-trigger-swipe');

  function triggerHeroSwipe() {
    if (!demoSwipeBubble) return;
    playClickSound();
    demoSwipeBubble.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
    demoSwipeBubble.style.transform = 'translateX(55px)';

    setTimeout(() => {
      demoSwipeBubble.style.transform = 'translateX(0px)';
      if (demoQuoteBanner) {
        demoQuoteBanner.style.display = 'block';
        demoQuoteBanner.style.animation = 'fadeIn 0.3s forwards';
      }
      playHeartSound();
    }, 350);
  }

  if (btnTriggerSwipe) {
    btnTriggerSwipe.addEventListener('click', triggerHeroSwipe);
  }

  // Double-tap heart react
  if (demoSwipeBubble) {
    let lastTap = 0;
    demoSwipeBubble.addEventListener('click', () => {
      const now = Date.now();
      if (now - lastTap < 350) {
        playHeartSound();
        const heartPill = document.getElementById('demo-heart-pill');
        if (heartPill) {
          heartPill.style.display = (heartPill.style.display === 'inline-flex') ? 'none' : 'inline-flex';
        }
      } else {
        playClickSound();
      }
      lastTap = now;
    });
  }


  // ==========================================
  // 9. Interactive Holographic 3D Tilt & Mouse Spotlight on Cards
  // ==========================================
  const tiltCards = document.querySelectorAll('.feature-card, .stat-card, .terminal-card, .step-card');

  tiltCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -5;
      const rotateY = ((x - centerX) / centerX) * 5;

      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0px)';
      card.style.transition = 'transform 0.5s ease';
    });

    card.addEventListener('mouseenter', () => {
      card.style.transition = 'none';
    });
  });


  // ==========================================
  // 10. Copy SHA-256 Checksum Button
  // ==========================================
  const btnCopySha = document.getElementById('btn-copy-sha');
  const shaTextElem = document.getElementById('sha-text');
  if (btnCopySha && shaTextElem) {
    btnCopySha.addEventListener('click', () => {
      playClickSound();
      const fullHash = shaTextElem.textContent.trim() || "416fdbaf9d303f7ba031320829c7d2e5fb7e51ee846817b4d4e740f3d16ae13b";
      navigator.clipboard.writeText(fullHash).then(() => {
        btnCopySha.textContent = "Copied! ✓";
        setTimeout(() => {
          btnCopySha.textContent = "Copy Hash";
        }, 2000);
      });
    });
  }


  const btnCopyIosSha = document.getElementById('btn-copy-ios-sha');
  const iosShaTextElem = document.getElementById('ios-sha-text');
  if (btnCopyIosSha && iosShaTextElem) {
    btnCopyIosSha.addEventListener('click', () => {
      playClickSound();
      const fullHash = iosShaTextElem.textContent.trim();
      navigator.clipboard.writeText(fullHash).then(() => {
        btnCopyIosSha.textContent = "Copied! ✓";
        setTimeout(() => {
          btnCopyIosSha.textContent = "Copy Hash";
        }, 2000);
      });
    });
  }


  // ==========================================
  // 11. Interactive Terminal Commands
  // ==========================================
  window.runTermCommand = function(cmd) {
    playClickSound();
    const cmdText = document.getElementById('term-cmd-text');
    const out = document.getElementById('term-output');
    if (!cmdText || !out) return;

    if (cmd === 'status') {
      cmdText.textContent = 'kynx --status';
      out.innerHTML = `
        [SYS] KYNX Core — Unified v0.9.64 (Android &amp; iOS Build 74) [ONLINE - 26-NOV-2026]<br>
        [ARCHITECT] KG (Lead Systems Engineer)<br>
        [GRID_STATUS] Multi-Hop Mesh (7-Hop E2EE) + WebSockets [ARMED]<br>
        [WEB_DECK] Bidirectional Session Sync Active [MONITORED]<br>
        [MEMORY] 16 KB Page Aligned (Android 15+) | Skia 120 FPS<br>
        [SECURITY] Zero-Knowledge Relay + Hardware FLAG_SECURE
      `;
    } else if (cmd === 'benchmark') {
      cmdText.textContent = 'kynx --benchmark';
      playScanSound();
      out.innerHTML = `
        [BENCHMARK] Running LruCache & SQLite Direct I/O Test...<br>
        [TEST 1] 10,000 Messages Indexed: 14.2 ms (704,225 msg/s)<br>
        [TEST 2] 4K Image RAM Load: 0.21 ms direct bitmap decode<br>
        [TEST 3] View-Once Purge: 0.08 ms (0 bytes residual)<br>
        [VERDICT] 100% Zero-Lag Architecture Verified ✓
      `;
    } else if (cmd === 'mesh') {
      cmdText.textContent = 'kynx --mesh';
      playScanSound();
      out.innerHTML = `
        [MESH ENGINE] Offline Multi-Hop P2P Grid Active...<br>
        [ROUTE] Hop 0 (You) ➔ Node 2B ➔ User 100 (Est. ~90m)<br>
        [CRYPTO] ECDH secp256r1 + AES-256-GCM AEAD Sealed<br>
        [RELAY] Zero-Knowledge Blind Forwarding (0 Data Stored)<br>
        [STATUS] 0 Cellular / 0 Internet Required ✓
      `;
    }
  };

  // ==========================================
  // 12. Cyber Video Player Controller for Mesh Guide
  // ==========================================
  const meshVideo = document.getElementById('mesh-guide-video');
  const btnToggleVideo = document.getElementById('btn-toggle-mesh-video');
  const videoProgress = document.getElementById('mesh-video-progress');
  const videoScrub = document.getElementById('mesh-video-scrub');
  const videoTimecode = document.getElementById('mesh-video-timecode');
  const videoChapters = document.querySelectorAll('.video-chap-pill');

  if (meshVideo) {
    if (btnToggleVideo) {
      btnToggleVideo.addEventListener('click', () => {
        playClickSound();
        if (meshVideo.paused) {
          meshVideo.play();
          btnToggleVideo.textContent = '⏸';
        } else {
          meshVideo.pause();
          btnToggleVideo.textContent = '▶';
        }
      });
    }

    meshVideo.addEventListener('timeupdate', () => {
      const cur = meshVideo.currentTime;
      const dur = meshVideo.duration || 36;
      const pct = (cur / dur) * 100;
      if (videoProgress) videoProgress.style.width = `${pct}%`;

      if (videoTimecode) {
        const curSec = Math.floor(cur);
        const durSec = Math.floor(dur);
        videoTimecode.textContent = `00:${curSec < 10 ? '0' : ''}${curSec} / 00:${durSec < 10 ? '0' : ''}${durSec}`;
      }

      // Update active chapter pill based on playback time
      videoChapters.forEach(pill => {
        const seekTime = parseFloat(pill.getAttribute('data-seek') || '0');
        pill.classList.toggle('active', cur >= seekTime && cur < seekTime + 9.0);
      });
    });

    if (videoScrub) {
      videoScrub.addEventListener('click', (e) => {
        const rect = videoScrub.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const dur = meshVideo.duration || 14;
        meshVideo.currentTime = (clickX / rect.width) * dur;
      });
    }

    videoChapters.forEach(pill => {
      pill.addEventListener('click', () => {
        playClickSound();
        const seekTime = parseFloat(pill.getAttribute('data-seek') || '0');
        meshVideo.currentTime = seekTime;
        if (meshVideo.paused) {
          meshVideo.play();
          if (btnToggleVideo) btnToggleVideo.textContent = '⏸';
        }
      });
    });
  }

});
