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
  const sbPills = document.querySelectorAll('.sb-pill');
  const chapterSteps = document.querySelectorAll('.chapter-step');

  const screenSteps = [
    document.getElementById('screen-step-0'),
    document.getElementById('screen-step-1'),
    document.getElementById('screen-step-2'),
    document.getElementById('screen-step-3'),
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

  function setStoryboardStep(stepIndex) {
    if (stepIndex === currentActiveStep) return;
    currentActiveStep = stepIndex;
    playClickSound();

    // 1. Update Pills
    sbPills.forEach((p, idx) => {
      p.classList.toggle('active', idx === stepIndex);
    });

    // 2. Update Narrative Chapters
    chapterSteps.forEach((chap, idx) => {
      chap.classList.toggle('active', idx === stepIndex);
    });

    // 3. Update Phone Screen
    screenSteps.forEach((scr, idx) => {
      if (scr) {
        scr.style.display = (idx === stepIndex) ? (idx === 1 ? 'flex' : (idx === 2 ? 'flex' : 'flex')) : 'none';
      }
    });

    // 4. Update 3D Phone Perspective & Status
    if (sbPhone) {
      if (stepIndex === 0) {
        sbPhone.style.transform = 'perspective(1200px) rotateY(-5deg) rotateX(4deg)';
        if (sbStatus) sbStatus.textContent = '● Live Demo • 120 FPS';
      } else if (stepIndex === 1) {
        sbPhone.style.transform = 'perspective(1200px) rotateY(6deg) rotateX(3deg)';
        if (sbStatus) sbStatus.textContent = '● Protected • FLAG_SECURE';
        playPurgeSound();
      } else if (stepIndex === 2) {
        sbPhone.style.transform = 'perspective(1200px) rotateY(-3deg) rotateX(-2deg)';
        if (sbStatus) sbStatus.textContent = '● Physics Engine • 120Hz';
        // Auto trigger swipe in demo
        triggerSbSwipe();
      } else if (stepIndex === 3) {
        sbPhone.style.transform = 'perspective(1200px) rotateY(0deg) rotateX(0deg) scale(1.03)';
        if (sbStatus) sbStatus.textContent = '● Skia GPU • 5 Shaders';
      }
    }
  }

  // Interactive Storyboard Swipe in Chapter 3
  const sbSwipeTarget = document.getElementById('sb-swipe-target');
  const sbReplyBanner = document.getElementById('sb-reply-banner');
  const sbHeartBurst = document.getElementById('sb-heart-burst');

  function triggerSbSwipe() {
    if (!sbSwipeTarget) return;
    sbSwipeTarget.style.transition = 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
    sbSwipeTarget.style.transform = 'translateX(50px)';

    setTimeout(() => {
      sbSwipeTarget.style.transform = 'translateX(0px)';
      if (sbReplyBanner) sbReplyBanner.style.display = 'block';
      if (sbHeartBurst) sbHeartBurst.style.display = 'inline-flex';
      playHeartSound();
    }, 380);
  }

  if (sbSwipeTarget) {
    sbSwipeTarget.addEventListener('click', triggerSbSwipe);
  }

  // GSAP ScrollTrigger for Pinned Storyboard
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined' && storyboardSection) {
    ScrollTrigger.create({
      trigger: storyboardSection,
      start: 'top top',
      end: '+=2400',
      pin: true,
      scrub: 0.5,
      onUpdate: (self) => {
        const progress = self.progress;
        let step = 0;
        if (progress < 0.25) step = 0;
        else if (progress < 0.5) step = 1;
        else if (progress < 0.75) step = 2;
        else step = 3;

        setStoryboardStep(step);

        // Dynamically rotate phone and shift GPU shaders during step 4
        if (step === 3 && sbScreen) {
          const subProgress = (progress - 0.75) / 0.25;
          const shaderIdx = Math.min(Math.floor(subProgress * shaderGradients.length), shaderGradients.length - 1);
          sbScreen.style.background = shaderGradients[shaderIdx];
          const label = document.getElementById('active-shader-label');
          if (label) label.textContent = shaderNames[shaderIdx];
        }
      }
    });

    // Pill click smooth scrolling
    sbPills.forEach((pill) => {
      pill.addEventListener('click', () => {
        const targetStep = parseInt(pill.getAttribute('data-step') || '0', 10);
        if (lenis) {
          const st = ScrollTrigger.getById('storyboard') || ScrollTrigger.getAll().find(s => s.trigger === storyboardSection);
          if (st) {
            const targetScroll = st.start + (targetStep / 3) * (st.end - st.start);
            lenis.scrollTo(targetScroll, { duration: 1.2 });
          }
        }
      });
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
      const fullHash = "3ca78f3224e55c69270bb3ad75241f63135ce725902cac6be108da0efe6c1733";
      navigator.clipboard.writeText(fullHash).then(() => {
        btnCopySha.textContent = "Copied! ✓";
        setTimeout(() => {
          btnCopySha.textContent = "Copy Hash";
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
        [SYS] KYNX Core v0.9.32 Turbo [ONLINE]<br>
        [ARCHITECT] KG (Lead Systems Engineer)<br>
        [PEER_LINK] Gaurav Gautam (Connected via Cloud + Mesh)<br>
        [LATENCY] 0.8ms | WebSockets: 100% | Bluetooth: ARMED<br>
        [SECURITY] Hardware FLAG_SECURE + E2EE Active
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
        [RFCOMM] Bluetooth Low Energy P2P Discovery Active...<br>
        [PEER FOUND] Device: Gaurav's Phone (RSSI -42 dBm)<br>
        [CHANNEL] Secure RFCOMM Socket Opened on Port 7<br>
        [ROUTING] Offline Mesh Relay: Active (0 Internet Required)
      `;
    }
  };

});
