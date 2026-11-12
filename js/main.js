(function () {
  'use strict';

  // ── Utilities ─────────────────────────────────────────────────────
  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), hi); }

  var mouse = { x: 0, y: 0, nx: 0, ny: 0 };
  var isTouch = 'ontouchstart' in window;

  // ── Global mouse tracking (always active, even on touch devices) ──
  document.addEventListener('mousemove', function (e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.nx = (e.clientX / innerWidth - 0.5) * 2;
    mouse.ny = (e.clientY / innerHeight - 0.5) * 2;
  });

  // ── 1. Preloader ──────────────────────────────────────────────────
  function initPreloader() {
    window.addEventListener('load', function () {
      setTimeout(function () { document.body.classList.add('loaded'); }, 500);
    });
  }

  // ── 2. Lenis Smooth Scroll ────────────────────────────────────────
  function initLenis() {
    if (typeof Lenis === 'undefined') return null;
    var lenis = new Lenis({
      duration: 1.3,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      touchMultiplier: 1.5
    });
    // Sync with GSAP ScrollTrigger
    if (typeof ScrollTrigger !== 'undefined') {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(time) { lenis.raf(time); requestAnimationFrame(raf); })(performance.now());
    }
    return lenis;
  }

  // ── 3. Three.js — Interactive 3D Background ──────────────────────
  function initThreeBackground() {
    var canvas = document.getElementById('bgCanvas');
    if (!canvas || typeof THREE === 'undefined') return;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 1000);
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

    // ── Circle texture for soft particles ──
    var tc = document.createElement('canvas'); tc.width = tc.height = 64;
    var tx = tc.getContext('2d');
    var tg = tx.createRadialGradient(32, 32, 0, 32, 32, 32);
    tg.addColorStop(0, 'rgba(255,255,255,1)');
    tg.addColorStop(0.25, 'rgba(255,255,255,0.6)');
    tg.addColorStop(1, 'rgba(255,255,255,0)');
    tx.fillStyle = tg; tx.fillRect(0, 0, 64, 64);
    var circTex = new THREE.CanvasTexture(tc);

    // ── Glow sprite texture ──
    var gc = document.createElement('canvas'); gc.width = gc.height = 256;
    var gx = gc.getContext('2d');
    var gg = gx.createRadialGradient(128, 128, 0, 128, 128, 128);
    gg.addColorStop(0, 'rgba(139,92,246,0.18)');
    gg.addColorStop(0.4, 'rgba(139,92,246,0.05)');
    gg.addColorStop(1, 'rgba(139,92,246,0)');
    gx.fillStyle = gg; gx.fillRect(0, 0, 256, 256);
    var glowTex = new THREE.CanvasTexture(gc);

    // ── Wireframe mesh ──
    var GRID = 70, SEG = 50;
    var planeGeo = new THREE.PlaneGeometry(GRID, GRID, SEG, SEG);
    var mesh = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({
      color: 0x8b5cf6, wireframe: true, transparent: true, opacity: 0.03
    }));
    mesh.rotation.x = -Math.PI / 2.2;
    mesh.position.y = -10;
    scene.add(mesh);

    // Vertex dots
    var meshDots = new THREE.Points(planeGeo, new THREE.PointsMaterial({
      color: 0x8b5cf6, size: 0.6, map: circTex,
      sizeAttenuation: true, transparent: true, opacity: 0.07,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    meshDots.rotation.x = mesh.rotation.x;
    meshDots.position.y = mesh.position.y;
    scene.add(meshDots);

    // ── Floating particles ──
    var PC = 90;
    var fpGeo = new THREE.BufferGeometry();
    var fpPos = new Float32Array(PC * 3), fpVel = [];
    for (var i = 0; i < PC; i++) {
      fpPos[i*3]=(Math.random()-0.5)*60; fpPos[i*3+1]=(Math.random()-0.5)*40; fpPos[i*3+2]=(Math.random()-0.5)*25;
      fpVel.push({ x:(Math.random()-0.5)*0.01, y:(Math.random()-0.5)*0.01, z:(Math.random()-0.5)*0.005 });
    }
    fpGeo.setAttribute('position', new THREE.BufferAttribute(fpPos, 3));
    var fpPts = new THREE.Points(fpGeo, new THREE.PointsMaterial({
      color: 0x8b5cf6, size: 1.8, map: circTex,
      sizeAttenuation: true, transparent: true, opacity: 0.3,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    scene.add(fpPts);

    // ── Cursor glow sprite ──
    var glowSprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
    }));
    glowSprite.scale.set(14, 14, 1);
    glowSprite.position.y = -6;
    scene.add(glowSprite);

    // ── Cursor particle trail ──
    var TRAIL = 35;
    var trGeo = new THREE.BufferGeometry();
    var trPos = new Float32Array(TRAIL * 3);
    var trAge = new Float32Array(TRAIL);
    for (var j = 0; j < TRAIL; j++) { trPos[j*3+1] = -200; trAge[j] = 1; }
    trGeo.setAttribute('position', new THREE.BufferAttribute(trPos, 3));
    var trPts = new THREE.Points(trGeo, new THREE.PointsMaterial({
      color: 0x8b5cf6, size: 1.0, map: circTex,
      sizeAttenuation: true, transparent: true, opacity: 0.35,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    scene.add(trPts);
    var trIdx = 0;

    camera.position.set(0, 6, 28);

    // ── Raycaster & Plane for exact cursor-to-mesh projection (zero vertical offset) ──
    var raycaster = new THREE.Raycaster();
    var rayMouse = new THREE.Vector2();
    var hitPoint = new THREE.Vector3(0, -10, 0);
    var planeNormal = new THREE.Vector3();
    var mathPlane = new THREE.Plane();
    var localHit = new THREE.Vector3();

    // ── Mouse mapping for mesh interaction ──
    var meshMouse = { x: 0, y: 0 };
    var meshMouseSmooth = { x: 0, y: 0 };
    var scrollY = 0;
    window.addEventListener('scroll', function () { scrollY = pageYOffset; }, { passive: true });

    var paused = false;
    document.addEventListener('visibilitychange', function () { paused = document.hidden; });

    var camTarget = { x: 0, y: 6 };
    var frame = 0;

    function animate() {
      requestAnimationFrame(animate);
      if (paused) return;
      frame++;

      var t = performance.now() * 0.00025;

      // ── Camera parallax updated first so raycast uses active camera position ──
      camTarget.x = mouse.nx * 3;
      camTarget.y = 6 - mouse.ny * 1.5;
      camera.position.x = lerp(camera.position.x, camTarget.x, 0.02);
      camera.position.y = lerp(camera.position.y, camTarget.y, 0.02);
      camera.position.z = 28 + scrollY * 0.004;
      camera.lookAt(0, -2, 0);

      // Very slow Z rotation
      mesh.rotation.z = t * 0.05;
      meshDots.rotation.z = mesh.rotation.z;

      // Update mesh world matrix
      mesh.updateMatrixWorld();

      // ── Exact cursor raycast onto mesh plane (eliminates vertical offset) ──
      planeNormal.set(0, 0, 1).applyQuaternion(mesh.quaternion);
      mathPlane.setFromNormalAndCoplanarPoint(planeNormal, mesh.position);

      rayMouse.set(mouse.nx, -mouse.ny);
      raycaster.setFromCamera(rayMouse, camera);

      if (raycaster.ray.intersectPlane(mathPlane, hitPoint)) {
        var toHit = hitPoint.clone().sub(camera.position);
        if (toHit.dot(raycaster.ray.direction) > 0 && hitPoint.distanceTo(camera.position) < 250) {
          localHit.copy(hitPoint);
          mesh.worldToLocal(localHit);
          meshMouse.x = localHit.x;
          meshMouse.y = localHit.y;
        }
      }

      meshMouseSmooth.x = lerp(meshMouseSmooth.x, meshMouse.x, 0.15);
      meshMouseSmooth.y = lerp(meshMouseSmooth.y, meshMouse.y, 0.15);

      // ── Animate mesh vertices — waves + mouse push ──
      var pos = planeGeo.attributes.position;
      var pushRadius = 9, pushStrength = 3.6;
      for (var i = 0; i < pos.count; i++) {
        var vx = pos.getX(i), vy = pos.getY(i);

        // Wave
        var wave = Math.sin(vx * 0.12 + t * 7) * Math.cos(vy * 0.12 + t * 5) * 1.6
                 + Math.sin(vx * 0.22 + t * 3) * 0.5;

        // Mouse push (cloth-like bump) directly under the cursor
        var dx = vx - meshMouseSmooth.x;
        var dy = vy - meshMouseSmooth.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var push = 0;
        if (dist < pushRadius) {
          var n = 1 - dist / pushRadius;
          push = n * n * pushStrength;
        }

        pos.setZ(i, wave + push);
      }
      pos.needsUpdate = true;

      // ── Float particles ──
      var pp = fpGeo.attributes.position;
      for (var k = 0; k < PC; k++) {
        var ki = k * 3;
        pp.array[ki]   += fpVel[k].x;
        pp.array[ki+1] += fpVel[k].y;
        pp.array[ki+2] += fpVel[k].z;
        if (Math.abs(pp.array[ki])   > 30) fpVel[k].x *= -1;
        if (Math.abs(pp.array[ki+1]) > 20) fpVel[k].y *= -1;
        if (Math.abs(pp.array[ki+2]) > 12) fpVel[k].z *= -1;
      }
      pp.needsUpdate = true;

      // ── Cursor glow sprite follows 3D hit point ──
      glowSprite.position.lerp(hitPoint, 0.08);

      // ── Cursor particle trail ──
      if (frame % 3 === 0 && (Math.abs(mouse.nx) > 0.01 || Math.abs(mouse.ny) > 0.01)) {
        var tp = trGeo.attributes.position;
        tp.array[trIdx*3]   = hitPoint.x + (Math.random()-0.5) * 1.5;
        tp.array[trIdx*3+1] = hitPoint.y + Math.random() * 1.2;
        tp.array[trIdx*3+2] = hitPoint.z + (Math.random()-0.5) * 1.5;
        trAge[trIdx] = 0;
        trIdx = (trIdx + 1) % TRAIL;
      }
      var tp2 = trGeo.attributes.position;
      for (var m = 0; m < TRAIL; m++) {
        trAge[m] += 0.012;
        tp2.array[m*3+1] += 0.03;
        if (trAge[m] > 1) tp2.array[m*3+1] = -200;
      }
      tp2.needsUpdate = true;

      renderer.render(scene, camera);
    }

    window.addEventListener('resize', function () {
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
    });

    animate();
  }

  // ── 4. Custom Cursor ──────────────────────────────────────────────
  function initCursor() {
    var cur = document.getElementById('cursor');
    var fol = document.getElementById('cursorFollower');
    if (!cur || !fol || isTouch) { if(cur)cur.style.display='none'; if(fol)fol.style.display='none'; return; }

    var fx = 0, fy = 0, hovering = false, pressing = false;

    // Cursor dot follows mouse instantly
    document.addEventListener('mousemove', function () {
      cur.style.left = mouse.x + 'px'; cur.style.top = mouse.y + 'px';
    });

    (function tick() {
      fx = lerp(fx, mouse.x, 0.15); fy = lerp(fy, mouse.y, 0.15);
      fol.style.left = fx + 'px'; fol.style.top = fy + 'px';
      var s = hovering ? 1.5 : 1; if (pressing) s *= 0.85;
      fol.style.width = fol.style.height = (36 * s) + 'px';
      requestAnimationFrame(tick);
    })();

    var sel = 'a, button, .magnetic, input, textarea, .filter-btn, .chip';
    document.addEventListener('mouseover', function (e) { if(e.target.closest(sel)){hovering=true;cur.classList.add('hover');fol.classList.add('hover');} });
    document.addEventListener('mouseout',  function (e) { if(e.target.closest(sel)){hovering=false;cur.classList.remove('hover');fol.classList.remove('hover');} });
    document.addEventListener('mousedown', function () { pressing = true; });
    document.addEventListener('mouseup',   function () { pressing = false; });
  }

  // ── 5. Mouse Glow (2D) ───────────────────────────────────────────
  function initMouseGlow() {
    var g = document.getElementById('mouseGlow');
    if (!g || isTouch) return;
    var gx = 0, gy = 0;
    (function t() { gx=lerp(gx,mouse.x,0.06); gy=lerp(gy,mouse.y,0.06); g.style.left=gx+'px'; g.style.top=gy+'px'; requestAnimationFrame(t); })();
  }

  // ── 6. Scroll Progress ───────────────────────────────────────────
  function initScrollProgress() {
    var bar = document.getElementById('scrollProgress');
    if (!bar) return;
    window.addEventListener('scroll', function () {
      var h = document.documentElement.scrollHeight - innerHeight;
      bar.style.width = (h > 0 ? (pageYOffset / h) * 100 : 0) + '%';
    }, { passive: true });
  }

  // ── 7. Navbar ─────────────────────────────────────────────────────
  function initNavbar() {
    var nb = document.getElementById('navbar'); if (!nb) return;
    var links = nb.querySelectorAll('.nav-link'), secs = [];
    links.forEach(function (l) { var s = document.getElementById(l.getAttribute('href').substring(1)); if(s) secs.push({el:s,link:l}); });
    window.addEventListener('scroll', function () {
      nb.classList.toggle('scrolled', scrollY > 50);
      var p = scrollY + 120;
      for (var i = secs.length-1; i >= 0; i--) { if(secs[i].el.offsetTop<=p){links.forEach(function(l){l.classList.remove('active');}); secs[i].link.classList.add('active'); break;} }
    }, { passive: true });
  }

  // ── 8. Mobile Nav ─────────────────────────────────────────────────
  function initMobileNav() {
    var tog = document.getElementById('navToggle'), nl = document.getElementById('navLinks');
    if (!tog || !nl) return;
    tog.addEventListener('click', function () { nl.classList.toggle('open'); tog.classList.toggle('open'); document.body.classList.toggle('nav-open'); });
    nl.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { nl.classList.remove('open'); tog.classList.remove('open'); document.body.classList.remove('nav-open'); }); });
  }

  // ── 9. Smooth Scroll (anchor links) ───────────────────────────────
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var h = this.getAttribute('href'); if (h === '#') return;
        var t = document.querySelector(h); if (!t) return;
        e.preventDefault();
        window.scrollTo({ top: t.offsetTop - 80, behavior: 'smooth' });
      });
    });
  }

  // ── 10. Section Snap Scroll ───────────────────────────────────────
  function initSectionSnap(lenis) {
    var sections = document.querySelectorAll('#hero, #about, #skills, #projects, #contact');
    if (!sections.length) return;

    var currentIdx = 0;
    var isSnapping = false;
    var lastWheelTime = 0;
    var wheelAccum = 0;
    var WHEEL_THRESHOLD = 50; // minimum delta to trigger snap

    // Update current section based on scroll position
    function updateCurrentSection() {
      var scrollTop = window.scrollY || window.pageYOffset;
      var viewH = window.innerHeight;
      var best = 0;
      var bestDist = Infinity;
      for (var i = 0; i < sections.length; i++) {
        var dist = Math.abs(sections[i].offsetTop - scrollTop);
        if (dist < bestDist) { bestDist = dist; best = i; }
      }
      currentIdx = best;
    }

    // Snap to a section
    function snapTo(idx) {
      if (idx < 0 || idx >= sections.length || isSnapping) return;
      isSnapping = true;
      currentIdx = idx;

      var target = sections[idx].offsetTop;
      if (lenis) {
        lenis.scrollTo(target, {
          duration: 1.0,
          onComplete: function () {
            setTimeout(function () { isSnapping = false; wheelAccum = 0; }, 300);
          }
        });
      } else {
        window.scrollTo({ top: target, behavior: 'smooth' });
        setTimeout(function () { isSnapping = false; wheelAccum = 0; }, 1200);
      }
    }

    // Listen for wheel events
    window.addEventListener('wheel', function (e) {
      if (isSnapping) { e.preventDefault(); return; }

      var now = Date.now();
      // Reset accumulator if wheel was idle for a bit
      if (now - lastWheelTime > 300) wheelAccum = 0;
      lastWheelTime = now;

      wheelAccum += e.deltaY;

      if (Math.abs(wheelAccum) > WHEEL_THRESHOLD) {
        e.preventDefault();
        updateCurrentSection();
        var dir = wheelAccum > 0 ? 1 : -1;
        var nextIdx = clamp(currentIdx + dir, 0, sections.length - 1);
        if (nextIdx !== currentIdx) {
          snapTo(nextIdx);
        } else {
          isSnapping = false;
        }
        wheelAccum = 0;
      }
    }, { passive: false });

    // Allow keyboard navigation
    document.addEventListener('keydown', function (e) {
      if (isSnapping) return;
      updateCurrentSection();
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        snapTo(currentIdx + 1);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        snapTo(currentIdx - 1);
      }
    });
  }

  // ── 11. GSAP Scroll Animations ────────────────────────────────────
  function initGSAPAnimations() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') { initFallback(); return; }
    gsap.registerPlugin(ScrollTrigger);

    // Section labels — slide from left
    gsap.utils.toArray('.section-label').forEach(function (el) {
      gsap.fromTo(el,
        { x: -40, opacity: 0 },
        { scrollTrigger:{trigger:el,start:'top 88%'}, x: 0, opacity: 1, duration: 0.7, ease:'power3.out' }
      );
    });

    // Section titles
    gsap.utils.toArray('.section-title').forEach(function (el) {
      gsap.fromTo(el,
        { y: 50, opacity: 0 },
        { scrollTrigger:{trigger:el,start:'top 85%'}, y: 0, opacity: 1, duration: 0.9, ease:'power3.out' }
      );
    });

    // About paragraphs
    gsap.fromTo('#about .about-paragraphs p',
      { y: 40, opacity: 0 },
      { scrollTrigger:{trigger:'#about .about-paragraphs',start:'top 80%'},
        y: 0, opacity: 1, duration: 0.8, stagger: 0.2, ease:'power3.out' }
    );

    // Stats — pop with bounce
    gsap.fromTo('.stat-card',
      { y: 60, opacity: 0, scale: 0.85 },
      { scrollTrigger:{trigger:'.about-stats',start:'top 82%'},
        y: 0, opacity: 1, scale: 1, duration: 0.7, stagger: 0.12, ease:'back.out(1.7)' }
    );

    // Pipeline
    gsap.fromTo('.pipe-step',
      { y: 30, opacity: 0, scale: 0.5 },
      { scrollTrigger:{trigger:'.pipeline',start:'top 80%'},
        y: 0, opacity: 1, scale: 1, duration: 0.5, stagger: 0.15, ease:'back.out(2)' }
    );
    gsap.fromTo('.pipe-line',
      { scaleX: 0, opacity: 0 },
      { scrollTrigger:{trigger:'.pipeline',start:'top 80%'},
        scaleX: 1, opacity: 1, duration: 0.4, stagger: 0.15, delay: 0.1, ease:'power2.out', transformOrigin:'left center' }
    );

    // Skills — cascade
    gsap.fromTo('.skill-domain',
      { y: 70, opacity: 0 },
      { scrollTrigger:{trigger:'#skills .skills-grid',start:'top 82%'},
        y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease:'power3.out' }
    );
    gsap.utils.toArray('.skill-domain').forEach(function (d) {
      gsap.fromTo(d.querySelectorAll('.chip'),
        { y: 15, opacity: 0, scale: 0.9 },
        { scrollTrigger:{trigger:d,start:'top 78%'},
          y: 0, opacity: 1, scale: 1, duration: 0.35, stagger: 0.03, ease:'power2.out', delay: 0.4 }
      );
    });

    // Project filters
    gsap.fromTo('.project-filters',
      { y: 20, opacity: 0 },
      { scrollTrigger:{trigger:'.project-filters',start:'top 85%'},
        y: 0, opacity: 1, duration: 0.6, ease:'power2.out' }
    );

    // Project cards — scale up
    gsap.fromTo('.project-card',
      { y: 80, opacity: 0, scale: 0.92 },
      { scrollTrigger:{trigger:'#projects .projects-grid',start:'top 82%'},
        y: 0, opacity: 1, scale: 1, duration: 0.8, stagger: 0.12, ease:'power3.out' }
    );

    // Contact — slide from sides
    gsap.fromTo('.contact-info',
      { x: -60, opacity: 0 },
      { scrollTrigger:{trigger:'#contact .contact-layout',start:'top 80%'},
        x: 0, opacity: 1, duration: 0.8, ease:'power3.out' }
    );
    gsap.fromTo('.contact-form',
      { x: 60, opacity: 0 },
      { scrollTrigger:{trigger:'#contact .contact-layout',start:'top 80%'},
        x: 0, opacity: 1, duration: 0.8, delay: 0.15, ease:'power3.out' }
    );

    gsap.fromTo('.footer-inner',
      { y: 20, opacity: 0 },
      { scrollTrigger:{trigger:'.footer',start:'top 95%'},
        y: 0, opacity: 1, duration: 0.6, ease:'power2.out' }
    );
  }

  function initFallback() {
    var els = document.querySelectorAll('.reveal-scroll'); if (!els.length) return;
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if(e.isIntersecting){e.target.style.opacity='1';e.target.style.transform='none';e.target.style.transition='all 0.8s cubic-bezier(0.16,1,0.3,1)';obs.unobserve(e.target);} });
    }, { threshold: 0.15 });
    els.forEach(function (el) { el.style.opacity='0'; el.style.transform='translateY(30px)'; obs.observe(el); });
  }

  // ── 12. Stat Counters ─────────────────────────────────────────────
  function initStatCounters() {
    var nums = document.querySelectorAll('.stat-number[data-target]'); if (!nums.length) return;
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if(e.isIntersecting){anim(e.target);obs.unobserve(e.target);} });
    }, { threshold: 0.5 });
    nums.forEach(function (n) { obs.observe(n); });
    function anim(el) {
      var tgt = parseFloat(el.getAttribute('data-target')),
          dec = parseInt(el.getAttribute('data-decimals')||'0',10),
          dur = 1500, st = null;
      (function step(ts) {
        if(!st) st = ts; var p = Math.min((ts-st)/dur,1);
        el.textContent = (easeOutCubic(p)*tgt).toFixed(dec);
        if(p<1) requestAnimationFrame(step); else el.textContent=tgt.toFixed(dec);
      })(performance.now());
    }
  }

  // ── 13. Project Filter ────────────────────────────────────────────
  function initProjectFilter() {
    var btns = document.querySelectorAll('.filter-btn'), cards = document.querySelectorAll('.project-card');
    if (!btns.length || !cards.length) return;
    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        btns.forEach(function (b) { b.classList.remove('active'); }); btn.classList.add('active');
        var f = btn.getAttribute('data-filter');
        cards.forEach(function (c, idx) {
          var match = f === 'all' || c.getAttribute('data-category') === f;
          if (!match) { c.style.opacity='0'; c.style.transform='scale(0.92) translateY(20px)'; setTimeout(function(){c.style.display='none';},350); }
          else { c.style.display=''; setTimeout(function(){c.style.opacity='1';c.style.transform='scale(1) translateY(0)';}, 50+idx*80); }
        });
      });
    });
  }

  // ── 14. Magnetic Buttons ──────────────────────────────────────────
  function initMagnetic() {
    if (isTouch) return;
    document.querySelectorAll('.magnetic').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var dx = e.clientX - (r.left+r.width/2), dy = e.clientY - (r.top+r.height/2);
        el.style.transform = 'translate('+clamp(dx*0.3,-8,8)+'px,'+clamp(dy*0.3,-8,8)+'px)';
        el.style.transition = 'transform 0.2s ease-out';
      });
      el.addEventListener('mouseleave', function () { el.style.transform='translate(0,0)'; el.style.transition='transform 0.4s ease-out'; });
    });
  }

  // ── 15. Card Tilt ─────────────────────────────────────────────────
  function initCardTilt() {
    if (isTouch) return;
    document.querySelectorAll('.project-card').forEach(function (c) {
      c.addEventListener('mousemove', function (e) {
        var r = c.getBoundingClientRect();
        var rx = -((e.clientY-r.top-r.height/2)/(r.height/2))*4;
        var ry =  ((e.clientX-r.left-r.width/2)/(r.width/2))*4;
        c.style.transform = 'perspective(800px) rotateX('+rx+'deg) rotateY('+ry+'deg) translateY(-6px)';
        c.style.transition = 'transform 0.1s ease-out';
      });
      c.addEventListener('mouseleave', function () { c.style.transform=''; c.style.transition='transform 0.5s ease-out,border-color 0.4s,box-shadow 0.4s'; });
    });
  }

  // ── 16. Contact Form ──────────────────────────────────────────────
  function initContactForm() {
    var form = document.getElementById('contactForm'); if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]'); if (!btn) return;
      var sp = btn.querySelector('span'), orig = sp ? sp.textContent : btn.textContent;
      if(sp) sp.textContent='Message sent!'; else btn.textContent='Message sent!';
      btn.disabled=true; btn.style.opacity='0.7';
      setTimeout(function () { if(sp) sp.textContent=orig; else btn.textContent=orig; btn.disabled=false; btn.style.opacity='1'; form.reset(); }, 2000);
    });
  }

  // ── 17. Project Details Modal (Pop-up to GitHub / Hugging Face) ────
  var projectsData = {
    'cmos-180nm': {
      title: '180nm CMOS Analog Circuit Design',
      category: 'Electronics & VLSI',
      desc: 'Full-custom design, schematic capture, and parametric transient/AC simulation of analog integrated circuits using 180nm CMOS technology in Cadence Virtuoso. Focuses on low-noise signal conditioning blocks designed for sensor telemetry.',
      highlights: [
        'Designed two-stage operational amplifier with 68 dB open-loop DC gain and 62° phase margin at 45 MHz UGF',
        'Implemented high-swing cascode current mirrors and temperature-compensated bandgap reference',
        'Pre-layout and post-layout Monte Carlo parametric mismatch analyses using BSIM4 models'
      ],
      tags: ['Cadence Virtuoso', 'CMOS 180nm', 'Analog IC', 'Spectre Simulation', 'BSIM4', 'VLSI'],
      github: 'https://github.com/abishektamilarasan',
      huggingface: null
    },
    'csrr-sensor': {
      title: 'CSRR Microwave Sensor for Dielectric Characterization',
      category: 'RF & Microwave',
      desc: 'Planar metamaterial Complementary Split Ring Resonator (CSRR) etched on microstrip transmission lines for high-precision, non-destructive microwave dielectric permittivity sensing.',
      highlights: [
        'Full-wave 3D electromagnetic modeling and S-parameter (S11, S21) optimization using CST Microwave Studio',
        'Sharp transmission notch at resonant frequency with high Q-factor for sub-millimeter shift discrimination',
        'Designed for non-invasive dielectric characterization of biological fluids and liquid chemicals'
      ],
      tags: ['CST Studio', 'RF Engineering', 'Microwave', 'Metamaterials', 'CSRR', 'S-Parameters'],
      github: 'https://github.com/abishektamilarasan',
      huggingface: null
    },
    'smart-environment': {
      title: 'Smart Environmental Monitoring & Telemetry Network',
      category: 'Embedded Systems & IoT',
      desc: 'Edge sensor node built around the ESP8266 microcontroller providing continuous environmental surveillance with automated anomaly alerts and cloud dashboard telemetry.',
      highlights: [
        'Multi-sensor integration: MQ-2 combustible gas/smoke detector, DHT11 temp/humidity, and optical flame detector',
        'Real-time automated incident alerts delivered via Telegram Bot API with sub-second notification latency',
        'Optimized power budgeting with asynchronous telemetry transmission and local threshold calibration'
      ],
      tags: ['ESP8266', 'IoT', 'Sensors', 'Telegram API', 'C++', 'Edge Telemetry'],
      github: 'https://github.com/abishektamilarasan',
      huggingface: null
    },
    'multi-robot': {
      title: 'Multi-Robot Autonomous Fleet Orchestration',
      category: 'Robotics & Computer Vision',
      desc: 'Decentralized multi-robot coordination and localization framework built with ROS2 Humble and simulated in physics-accurate Gazebo simulation environments.',
      highlights: [
        'ArUco visual marker tracking pipeline utilizing OpenCV for real-time 6-DoF relative pose estimation',
        'Extended Kalman Filter (EKF) sensor fusion combining wheel odometry, IMU measurements, and camera feeds',
        'Closed-loop PID velocity control and dynamic inter-robot collision avoidance algorithms'
      ],
      tags: ['ROS2', 'Gazebo', 'OpenCV', 'ArUco', 'Kalman Filter', 'PID Control', 'Python'],
      github: 'https://github.com/abishektamilarasan',
      huggingface: null
    },
    'crop-disease': {
      title: 'Agricultural Crop Disease Detection & Classification',
      category: 'AI & Edge Machine Learning',
      desc: 'Deep learning computer vision system trained on extensive plant leaf pathology imagery to identify and classify crop diseases directly in the field.',
      highlights: [
        'Fine-tuned EfficientNetV2-B0 architecture achieving 96.4% test accuracy across 38 crop disease classes',
        'Quantized into ONNX format for efficient low-power edge inference on Raspberry Pi hardware',
        'High-performance REST API backend built with FastAPI and hosted model weights on Hugging Face'
      ],
      tags: ['PyTorch', 'EfficientNetV2', 'Edge AI', 'FastAPI', 'ONNX', 'Computer Vision'],
      github: 'https://github.com/abishektamilarasan',
      huggingface: 'https://huggingface.co/abishektamilarasan'
    },
    'local-rag': {
      title: 'Local Privacy-First RAG Assistant',
      category: 'Generative AI & LLMs',
      desc: 'Self-hosted, air-gapped Retrieval-Augmented Generation assistant running completely on local hardware. No cloud dependency, zero data leaks, and zero recurring API costs.',
      highlights: [
        'Integrated with Ollama running quantized Qwen2.5 language models with GPU acceleration',
        'ChromaDB vector database with recursive semantic chunking and cosine similarity retrieval',
        'FastAPI interface with streaming token response and citation provenance tracking'
      ],
      tags: ['Ollama', 'RAG', 'Qwen2.5', 'FastAPI', 'ChromaDB', 'Local LLM', 'Python'],
      github: 'https://github.com/abishektamilarasan',
      huggingface: 'https://huggingface.co/abishektamilarasan'
    }
  };

  function initProjectModal(lenis) {
    var modalBackdrop = document.getElementById('projectModal');
    var modalClose = document.getElementById('modalClose');
    var modalBadge = document.getElementById('modalBadge');
    var modalTitle = document.getElementById('modalTitle');
    var modalDesc = document.getElementById('modalDesc');
    var modalHighlightsList = document.getElementById('modalHighlightsList');
    var modalTags = document.getElementById('modalTags');
    var modalActions = document.getElementById('modalActions');

    if (!modalBackdrop) return;

    var ghSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>';
    var hfSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.025 1.13c-5.77 0-10.449 4.647-10.449 10.378 0 1.112.178 2.181.503 3.185.064-.222.203-.444.416-.577a.96.96 0 0 1 .524-.15c.293 0 .584.124.84.284.278.173.48.408.71.694.226.282.458.611.684.951v-.014c.017-.324.106-.622.264-.874s.403-.487.762-.543c.3-.047.596.06.787.203s.31.313.4.467c.15.257.212.468.233.542.01.026.653 1.552 1.657 2.54.616.605 1.01 1.223 1.082 1.912.055.537-.096 1.059-.38 1.572.637.121 1.294.187 1.967.187.657 0 1.298-.063 1.921-.178-.287-.517-.44-1.041-.384-1.581.07-.69.465-1.307 1.081-1.913 1.004-.987 1.647-2.513 1.657-2.539.021-.074.083-.285.233-.542.09-.154.208-.323.4-.467a1.08 1.08 0 0 1 .787-.203c.359.056.604.29.762.543s.247.55.265.874v.015c.225-.34.457-.67.683-.952.23-.286.432-.52.71-.694.257-.16.547-.284.84-.285a.97.97 0 0 1 .524.151c.228.143.373.388.43.625l.006.04a10.3 10.3 0 0 0 .534-3.273c0-5.731-4.678-10.378-10.449-10.378M8.327 6.583a1.5 1.5 0 0 1 .713.174 1.487 1.487 0 0 1 .617 2.013c-.183.343-.762-.214-1.102-.094-.38.134-.532.914-.917.71a1.487 1.487 0 0 1 .69-2.803m7.486 0a1.487 1.487 0 0 1 .689 2.803c-.385.204-.536-.576-.916-.71-.34-.12-.92.437-1.103.094a1.487 1.487 0 0 1 .617-2.013 1.5 1.5 0 0 1 .713-.174m-10.68 1.55a.96.96 0 1 1 0 1.921.96.96 0 0 1 0-1.92m13.838 0a.96.96 0 1 1 0 1.92.96.96 0 0 1 0-1.92M8.489 11.458c.588.01 1.965 1.157 3.572 1.164 1.607-.007 2.984-1.155 3.572-1.164.196-.003.305.12.305.454 0 .886-.424 2.328-1.563 3.202-.22-.756-1.396-1.366-1.63-1.32q-.011.001-.02.006l-.044.026-.01.008-.03.024q-.018.017-.035.036l-.032.04a1 1 0 0 0-.058.09l-.014.025q-.049.088-.11.19a1 1 0 0 1-.083.116 1.2 1.2 0 0 1-.173.18q-.035.029-.075.058a1.3 1.3 0 0 1-.251-.243 1 1 0 0 1-.076-.107c-.124-.193-.177-.363-.337-.444-.034-.016-.104-.008-.2.022q-.094.03-.216.087-.06.028-.125.063l-.13.074q-.067.04-.136.086a3 3 0 0 0-.135.096 3 3 0 0 0-.26.219 2 2 0 0 0-.12.121 2 2 0 0 0-.106.128l-.002.002a2 2 0 0 0-.09.132l-.001.001a1.2 1.2 0 0 0-.105.212q-.013.036-.024.073c-1.139-.875-1.563-2.317-1.563-3.203 0-.334.109-.457.305-.454m.836 10.354c.824-1.19.766-2.082-.365-3.194-1.13-1.112-1.789-2.738-1.789-2.738s-.246-.945-.806-.858-.97 1.499.202 2.362c1.173.864-.233 1.45-.685.64-.45-.812-1.683-2.896-2.322-3.295s-1.089-.175-.938.647 2.822 2.813 2.562 3.244-1.176-.506-1.176-.506-2.866-2.567-3.49-1.898.473 1.23 2.037 2.16c1.564.932 1.686 1.178 1.464 1.53s-3.675-2.511-4-1.297c-.323 1.214 3.524 1.567 3.287 2.405-.238.839-2.71-1.587-3.216-.642-.506.946 3.49 2.056 3.522 2.064 1.29.33 4.568 1.028 5.713-.624m5.349 0c-.824-1.19-.766-2.082.365-3.194 1.13-1.112 1.789-2.738 1.789-2.738s.246-.945.806-.858.97 1.499-.202 2.362c-1.173.864.233 1.45.685.64.451-.812 1.683-2.896 2.322-3.295s1.089-.175.938.647-2.822 2.813-2.562 3.244 1.176-.506 1.176-.506 2.866-2.567 3.49-1.898-.473 1.23-2.037 2.16c-1.564.932-1.686 1.178-1.464 1.53s3.675-2.511 4-1.297c.323 1.214-3.524 1.567-3.287 2.405.238.839 2.71-1.587 3.216-.642.506.946-3.49 2.056-3.522 2.064-1.29.33-4.568 1.028-5.713-.624"/></svg>';

    function openModal(id) {
      var data = projectsData[id];
      if (!data) return;

      modalBadge.textContent = data.category;
      modalTitle.textContent = data.title;
      modalDesc.textContent = data.desc;

      // Populate highlights
      modalHighlightsList.innerHTML = '';
      data.highlights.forEach(function (h) {
        var li = document.createElement('li');
        li.textContent = h;
        modalHighlightsList.appendChild(li);
      });

      // Populate tags
      modalTags.innerHTML = '';
      data.tags.forEach(function (t) {
        var span = document.createElement('span');
        span.textContent = t;
        modalTags.appendChild(span);
      });

      // Populate action buttons
      modalActions.innerHTML = '';

      if (data.github) {
        var ghBtn = document.createElement('a');
        ghBtn.href = data.github;
        ghBtn.target = '_blank';
        ghBtn.rel = 'noopener';
        ghBtn.className = 'btn btn-primary';
        ghBtn.innerHTML = ghSvg + ' <span>View on GitHub</span>';
        modalActions.appendChild(ghBtn);
      }

      if (data.huggingface) {
        var hfBtn = document.createElement('a');
        hfBtn.href = data.huggingface;
        hfBtn.target = '_blank';
        hfBtn.rel = 'noopener';
        hfBtn.className = 'btn btn-ghost';
        hfBtn.innerHTML = hfSvg + ' <span>Hugging Face</span>';
        modalActions.appendChild(hfBtn);
      }

      var closeBtn = document.createElement('button');
      closeBtn.className = 'btn btn-ghost';
      closeBtn.textContent = 'Close';
      closeBtn.addEventListener('click', closeModal);
      modalActions.appendChild(closeBtn);

      modalBackdrop.classList.add('active');
      modalBackdrop.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';

      if (lenis && typeof lenis.stop === 'function') lenis.stop();
    }

    function closeModal() {
      modalBackdrop.classList.remove('active');
      modalBackdrop.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';

      if (lenis && typeof lenis.start === 'function') lenis.start();
    }

    // Attach click listeners to cards and "View Details" links
    document.querySelectorAll('.project-card').forEach(function (card) {
      card.addEventListener('click', function (e) {
        // Prevent default if clicking the link
        var link = e.target.closest('.card-link');
        if (link) e.preventDefault();
        var id = card.getAttribute('data-project-id');
        if (id) openModal(id);
      });
    });

    if (modalClose) {
      modalClose.addEventListener('click', closeModal);
    }

    modalBackdrop.addEventListener('click', function (e) {
      if (e.target === modalBackdrop) closeModal();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modalBackdrop.classList.contains('active')) {
        closeModal();
      }
    });
  }

  // ── 18. Init ──────────────────────────────────────────────────────
  initPreloader();

  document.addEventListener('DOMContentLoaded', function () {
    var lenis = initLenis();
    initThreeBackground();
    initCursor();
    initMouseGlow();
    initScrollProgress();
    initNavbar();
    initMobileNav();
    initSmoothScroll();
    initGSAPAnimations();
    initSectionSnap(lenis);
    initStatCounters();
    initProjectFilter();
    initMagnetic();
    initCardTilt();
    initContactForm();
    initProjectModal(lenis);
  });

})();
