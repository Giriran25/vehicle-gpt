(() => {
  'use strict';
  const page = document.body.dataset.page || 'home';
  const vehicleId = 'demo-vehicle-01';
  const $ = (selector, root = document) => root.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt = (value, digits = 1) => value === null || value === undefined ? 'N/A' : Number(value).toFixed(digits);
  const dateFmt = value => {
    if (!value) return 'Time unavailable';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Time unavailable' : date.toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'});
  };
  async function api(path, options = {}) {
    const response = await fetch(path, {headers: {'Content-Type':'application/json', ...(options.headers || {})}, ...options});
    if (!response.ok) {
      let detail = `Request failed (${response.status})`;
      try { const body = await response.json(); detail = body.detail || detail; } catch (_) {}
      throw new Error(detail);
    }
    return response.json();
  }
  function shell(content) {
    $('#app').innerHTML = `
      <header class="site-header">
        <a class="brand" href="/" aria-label="VehicleGPT home"><span class="brand-mark">V</span><span>vehicle<span class="brand-muted">gpt</span><small>VEHICLE INTELLIGENCE SYSTEM</small></span></a>
        <button class="menu-toggle" aria-expanded="false" aria-controls="site-nav">Menu <span>☰</span></button>
        <nav id="site-nav" class="site-nav" aria-label="Primary navigation">
          <a class="${page === 'home' ? 'active' : ''}" href="/">Main</a>
          <a class="${page === 'analytics' ? 'active' : ''}" href="/analytics">System analytics</a>
          <a class="${page === 'llm' ? 'active' : ''}" href="/llm">LLM intelligence</a>
        </nav>
        <div class="header-status"><i></i><span id="globalStatus">Checking system</span></div>
      </header>
      <main class="page-shell">${content}</main>
      <footer class="site-footer"><div><b>VEHICLE<span>GPT</span></b><small>Evidence-grounded vehicle intelligence for every mile.</small></div><nav><a href="/">Main</a><a href="/analytics">Analytics</a><a href="/llm">Assistant</a><a href="/docs">API docs</a></nav><small>Prototype · Not a diagnostic tool</small></footer>
      <div class="robot-wrap" id="robotWrap"><button class="robot" id="robot" aria-label="Open co-pilot help"><span class="robot-antenna"></span><span class="robot-face"><i></i><i></i><b>⌣</b></span><span class="robot-body"><i></i><i></i></span><span class="robot-foot left"></span><span class="robot-foot right"></span></button><div class="robot-bubble hidden" id="robotBubble"><button class="bubble-close" aria-label="Close help">×</button><b id="robotTitle">Pit-crew co-pilot</b><span id="robotCopy"></span></div></div>
      <div class="toast" id="toast" role="status"></div>`;
    setupShell();
  }
  function setupShell() {
    const menu = $('.menu-toggle'), nav = $('#site-nav');
    menu?.addEventListener('click', () => { const open = nav.classList.toggle('open'); menu.setAttribute('aria-expanded', open); });
    nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', event => {
      nav.classList.remove('open');
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === '_blank') return;
      const transition = document.createElement('div');
      transition.className = 'page-transition';
      transition.innerHTML = '<i></i><b>LOADING SYSTEM</b>';
      document.body.appendChild(transition);
      requestAnimationFrame(() => transition.classList.add('active'));
    }));
    const robot = $('#robot'), bubble = $('#robotBubble'), close = $('.bubble-close');
    const help = {
      home: ['Welcome aboard.', 'I can point you to the real telemetry overview or the evidence assistant.'],
      analytics: ['Reading the signals.', 'Charts are built from stored measurements. “N/A” means the vehicle did not record that sensor.'],
      llm: ['Evidence first.', 'Ask about temperature, fuel, speed, or distance. I will abstain rather than invent an answer.']
    };
    $('#robotCopy').textContent = help[page][1]; $('#robotTitle').textContent = help[page][0];
    robot?.addEventListener('click', () => {
      const open = bubble.classList.toggle('hidden');
      bubble.classList.toggle('open', !open);
      $('#robotWrap').classList.toggle('robot-paused', !open);
    });
    close?.addEventListener('click', () => { bubble.classList.add('hidden'); bubble.classList.remove('open'); $('#robotWrap').classList.remove('robot-paused'); });
    let timer;
    const showIntro = () => { bubble.classList.remove('hidden'); timer = setTimeout(() => bubble.classList.add('hidden'), 5000); };
    setTimeout(showIntro, 900);
    let scrollFrame = 0;
    window.addEventListener('scroll', () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || scrollFrame) return;
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = 0;
        const progress = Math.min(1, window.scrollY / Math.max(1, document.body.scrollHeight - innerHeight));
        const robotWrap = $('#robotWrap');
        if (robotWrap && !bubble.classList.contains('open')) robotWrap.style.transform = `translate3d(${Math.round(progress * 28)}px, ${Math.round(progress * -34)}px, 0)`;
        const carStage = $('.car-stage');
        if (carStage) carStage.style.setProperty('--scroll-shift', `${Math.round(progress * 24)}px`);
      });
    }, {passive:true});
    const hero = $('.hero');
    if (hero && !window.matchMedia('(prefers-reduced-motion: reduce)').matches && matchMedia('(pointer:fine)').matches) {
      let pointerFrame = 0, pointerX = 0, pointerY = 0;
      hero.addEventListener('pointermove', event => {
        pointerX = (event.clientX / innerWidth - .5) * 2;
        pointerY = (event.clientY / innerHeight - .5) * 2;
        if (pointerFrame) return;
        pointerFrame = requestAnimationFrame(() => {
          pointerFrame = 0;
          hero.style.setProperty('--pointer-x', `${pointerX}`);
          hero.style.setProperty('--pointer-y', `${pointerY}`);
        });
      });
      hero.addEventListener('pointerleave', () => { hero.style.setProperty('--pointer-x', '0'); hero.style.setProperty('--pointer-y', '0'); });
    }
    if (page === 'home' && !sessionStorage.getItem('vehiclegpt-boot-seen') && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const boot = document.createElement('div');
      boot.className = 'boot-sequence';
      boot.innerHTML = '<div class="boot-wordmark">VEHICLE<span>GPT</span></div><div class="boot-scan"></div><div class="boot-status">SYSTEM INITIALISING <b>100%</b></div><button class="boot-skip">Skip intro</button>';
      document.body.appendChild(boot);
      sessionStorage.setItem('vehiclegpt-boot-seen', '1');
      const finish = () => { boot.classList.add('complete'); setTimeout(() => boot.remove(), 650); };
      boot.querySelector('.boot-skip').addEventListener('click', finish);
      setTimeout(finish, 1250);
    }
    api('/api/health').then(data => setStatus(data.status === 'ok' && data.database === 'connected')).catch(() => setStatus(false));
    document.querySelectorAll('.reveal').forEach(el => new IntersectionObserver(entries => entries.forEach(e => e.isIntersecting && e.target.classList.add('visible')), {threshold:.12}).observe(el));
  }
  function setupPointerInteractions() {
    if (matchMedia('(pointer:fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) document.querySelectorAll('.metric-card,.capability,.panel,.filter-bar').forEach(element => {
      let frame = 0, x = 50, y = 50;
      const update = () => {
        frame = 0;
        element.style.setProperty('--mx', `${x}%`);
        element.style.setProperty('--my', `${y}%`);
      };
      element.addEventListener('pointermove', event => {
        const bounds = element.getBoundingClientRect();
        x = Math.max(0, Math.min(100, ((event.clientX - bounds.left) / bounds.width) * 100));
        y = Math.max(0, Math.min(100, ((event.clientY - bounds.top) / bounds.height) * 100));
        if (!frame) frame = requestAnimationFrame(update);
      });
      element.addEventListener('pointerleave', () => {
        element.style.setProperty('--mx', '50%');
        element.style.setProperty('--my', '50%');
      });
    });
    document.querySelectorAll('.car-hotspot').forEach(hotspot => {
      const activate = () => { hotspot.classList.add('active'); $('.car-stage')?.classList.add('hotspot-focus'); };
      const deactivate = () => { hotspot.classList.remove('active'); if (!document.querySelector('.car-hotspot:focus')) $('.car-stage')?.classList.remove('hotspot-focus'); };
      hotspot.addEventListener('pointerenter', activate);
      hotspot.addEventListener('pointerleave', deactivate);
      hotspot.addEventListener('focus', activate);
      hotspot.addEventListener('blur', deactivate);
    });
    document.addEventListener('focusin', event => {
      if (event.target.matches?.('.car-hotspot')) {
        event.target.classList.add('active');
        $('.car-stage')?.classList.add('hotspot-focus');
      }
    });
    document.addEventListener('focusout', event => {
      if (event.target.matches?.('.car-hotspot') && !document.querySelector('.car-hotspot:focus')) {
        event.target.classList.remove('active');
        $('.car-stage')?.classList.remove('hotspot-focus');
      }
    });
    document.querySelectorAll('.table-scroll').forEach(table => table.addEventListener('click', event => {
      const row = event.target.closest('tbody tr');
      if (!row) return;
      table.querySelectorAll('tbody tr.selected').forEach(item => item.classList.remove('selected'));
      row.classList.add('selected');
    }));
  }
  function setStatus(online) { const status = $('#globalStatus'); if (status) status.textContent = online ? 'System operational' : 'Backend unavailable'; document.querySelector('.header-status')?.classList.toggle('offline', !online); }
  function toast(message) { const el = $('#toast'); if (!el) return; el.textContent = message; el.classList.add('show'); clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('show'), 3500); }
  function metric(label, value, unit, tone = 'cyan', note = 'Stored telemetry') { return `<article class="metric-card ${tone}"><div class="metric-label">${label}<span>◈</span></div><strong data-value="${esc(value)}">${esc(value)}</strong><small>${unit}</small><p>${note}</p></article>`; }
  function animateNumber(element, value, digits = 1) {
    if (!element || value === null || value === undefined || !Number.isFinite(Number(value))) { if (element) element.textContent = 'N/A'; return; }
    const target = Number(value), start = Number(element.dataset.current || 0), duration = 650, began = performance.now();
    const tick = now => {
      const progress = Math.min(1, (now - began) / duration), eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = (start + (target - start) * eased).toFixed(digits);
      if (progress < 1) requestAnimationFrame(tick); else element.dataset.current = target;
    };
    requestAnimationFrame(tick);
  }
  function replaceHelmetWithCar() {
    const legacy = $('.helmet-stage');
    if (!legacy) return;
    legacy.outerHTML = `<div class="hero-console car-stage" aria-label="Interactive VehicleGPT concept sports car">
      <div class="console-top"><span>DEMO-VEHICLE-01 / CONCEPT GT</span><span class="live-dot">● SIMULATED DATA</span></div>
      <div class="car-status-strip"><span>VEHICLE SYSTEM STATUS <b>ONLINE</b></span><span>POWERTRAIN DATA <b>AVAILABLE</b></span></div>
      <div class="car-viewport" id="carViewport">
        <canvas id="carCanvas" aria-label="Interactive 3D concept sports car"></canvas>
        <div class="car-fallback" aria-hidden="true"><div class="fallback-wheel fallback-wheel-front"></div><div class="fallback-wheel fallback-wheel-rear"></div><div class="fallback-body"><i></i><b></b></div><div class="fallback-light"></div></div>
        <div class="car-scanline"></div>
        <div class="car-hud hud-one">FRONT RADAR <b>READY</b></div>
        <div class="car-hud hud-two">TELEMETRY CORE <b>OK</b></div>
        <button class="car-hotspot hotspot-radar" type="button" aria-label="Explain front radar"><i></i><span>FRONT RADAR</span><em>Conceptual interface marker</em></button>
        <button class="car-hotspot hotspot-power" type="button" aria-label="Explain powertrain data"><i></i><span>POWERTRAIN DATA</span><em>Stored measurements only</em></button>
        <button class="car-hotspot hotspot-core" type="button" aria-label="Explain telemetry core"><i></i><span>TELEMETRY CORE</span><em>Evidence-grounded records</em></button>
        <div class="car-ground-shadow"></div>
      </div>
      <div class="car-controls"><span class="eyebrow">SIGNATURE INTERFACE / 01</span><button id="resetCarView" type="button">RESET VIEW ↺</button></div>
      <div class="car-caption"><b><span id="heroTemp">—</span>°C · Performance telemetry, made legible.</b><small id="heroTime">Waiting for the latest record</small></div>
      <div class="hotspot-note" aria-live="polite">Move across the panel or drag the car to inspect the vehicle interface.</div>
    </div>`;
    initCarScene();
  }
  function initCarScene() {
    const canvas = $('#carCanvas'), viewport = $('#carViewport'), stage = $('.car-stage');
    if (!canvas || !viewport || !stage) return;
    const fallback = $('.car-fallback');
    const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let active = true, cleanup = () => {};
    const loadThree = async () => {
      try {
        const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js');
        if (!canvas.isConnected) return;
        fallback.classList.add('hidden');
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(26, 1, .1, 100);
        camera.position.set(6.6, 3.2, 8.7);
        const renderer = new THREE.WebGLRenderer({canvas, antialias: true, alpha: true, powerPreference: 'high-performance'});
        renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        const root = new THREE.Group();
        root.rotation.y = -.22;
        scene.add(root);
        const paint = new THREE.MeshPhysicalMaterial({color:0x101b2a, metalness:.86, roughness:.2, clearcoat:1, clearcoatRoughness:.12});
        const dark = new THREE.MeshStandardMaterial({color:0x07101b, metalness:.55, roughness:.3});
        const glass = new THREE.MeshPhysicalMaterial({color:0x06121d, metalness:.25, roughness:.08, transmission:.12, transparent:true, opacity:.94});
        const cyan = new THREE.MeshStandardMaterial({color:0x35d7ff, emissive:0x0b718e, emissiveIntensity:1.6, metalness:.35, roughness:.22});
        const white = new THREE.MeshStandardMaterial({color:0xffffff, emissive:0x8feaff, emissiveIntensity:.9});
        const tire = new THREE.MeshStandardMaterial({color:0x020407, roughness:.78, metalness:.1});
        const add = (geometry, material, position, scale = [1,1,1], rotation = [0,0,0]) => {
          const mesh = new THREE.Mesh(geometry, material); mesh.position.set(...position); mesh.scale.set(...scale); mesh.rotation.set(...rotation); mesh.castShadow = true; mesh.receiveShadow = true; root.add(mesh); return mesh;
        };
        add(new THREE.SphereGeometry(1, 48, 24), paint, [0,.82,0], [3.25,.62,1.48]);
        add(new THREE.BoxGeometry(3.9,.38,1.7), paint, [0,.56,0], [1,1,1]);
        add(new THREE.SphereGeometry(1, 40, 20), paint, [1.15,.88,0], [1.75,.48,1.32]);
        add(new THREE.SphereGeometry(1, 32, 16), glass, [.05,1.35,0], [1.55,.5,1.02]);
        add(new THREE.BoxGeometry(2.15,.08,1.34), dark, [-.88,.97,0], [1,1,1], [0,0,.03]);
        add(new THREE.BoxGeometry(.14,.11,1.18), cyan, [-2.32,.82,0], [1,1,1]);
        add(new THREE.BoxGeometry(.12,.12,1.05), cyan, [2.78,.83,0], [1,1,1]);
        [-1.72,1.62].forEach(x => {
          [-.82,.82].forEach(z => {
            const wheel = new THREE.Group(); wheel.position.set(x,.48,z); wheel.rotation.y = Math.PI / 2;
            wheel.add(new THREE.Mesh(new THREE.CylinderGeometry(.56,.56,.28,32), tire));
            wheel.add(new THREE.Mesh(new THREE.CylinderGeometry(.32,.32,.3,24), new THREE.MeshStandardMaterial({color:0x6d7f91, metalness:.85, roughness:.2})));
            wheel.children.forEach(child => { child.castShadow = true; child.receiveShadow = true; }); root.add(wheel);
          });
        });
        const headlight = add(new THREE.BoxGeometry(.12,.13,.62), white, [2.54,.99,-.75], [1,1,1], [0,.14,-.12]);
        add(new THREE.BoxGeometry(.12,.13,.62), white, [2.54,.99,.75], [1,1,1], [0,.14,.12]);
        const light = new THREE.PointLight(0xbdefff, 0, 3.5); light.position.set(2.8,1.2,-1.7); root.add(light);
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(18,12), new THREE.MeshStandardMaterial({color:0x07101a, roughness:.75, metalness:.2, transparent:true, opacity:.55}));
        floor.rotation.x = -Math.PI / 2; floor.position.y = -.12; floor.receiveShadow = true; scene.add(floor);
        scene.add(new THREE.HemisphereLight(0x9edfff, 0x06101c, 1.3));
        const key = new THREE.DirectionalLight(0xdffaff, 3.2); key.position.set(-4,7,5); key.castShadow = true; scene.add(key);
        const rim = new THREE.PointLight(0x35d7ff, 18, 8); rim.position.set(-3,2,-3); scene.add(rim);
        const pointer = {x:0,y:0,targetX:0,targetY:0,dragging:false,lastX:0};
        const onMove = event => { const r = viewport.getBoundingClientRect(); pointer.targetX = ((event.clientX-r.left)/r.width-.5)*2; pointer.targetY = ((event.clientY-r.top)/r.height-.5)*2; };
        const onDown = event => { pointer.dragging = true; pointer.lastX = event.clientX; viewport.setPointerCapture?.(event.pointerId); };
        const onDrag = event => { if (!pointer.dragging) return; root.rotation.y += (event.clientX-pointer.lastX)*.006; pointer.lastX = event.clientX; };
        const onUp = () => { pointer.dragging = false; };
        viewport.addEventListener('pointermove', onMove); viewport.addEventListener('pointerdown', onDown); viewport.addEventListener('pointermove', onDrag); viewport.addEventListener('pointerup', onUp); viewport.addEventListener('pointercancel', onUp);
        $('#resetCarView')?.addEventListener('click', () => { root.rotation.set(0,-.22,0); pointer.targetX = 0; pointer.targetY = 0; });
        const resize = () => { const r = viewport.getBoundingClientRect(); camera.aspect = r.width / Math.max(1,r.height); camera.updateProjectionMatrix(); renderer.setSize(r.width,r.height,false); };
        const observer = new IntersectionObserver(entries => { active = entries[0].isIntersecting; }, {threshold:.05}); observer.observe(stage); resize(); addEventListener('resize', resize);
        let frame = 0, began = performance.now();
        const animate = now => { frame = requestAnimationFrame(animate); if (!active || document.hidden) return; const elapsed = now-began; pointer.x += (pointer.targetX-pointer.x)*.06; pointer.y += (pointer.targetY-pointer.y)*.06; if (!pointer.dragging) root.rotation.y += ((-.22 + pointer.x*.2)-root.rotation.y)*.045; root.rotation.x += ((pointer.y*.055)-root.rotation.x)*.045; root.position.y = Math.sin(elapsed*.0012)*.025 - Math.min(1,Math.max(0,scrollY/900))*.08; light.intensity = prefersReduced ? 1.6 : 1.2 + Math.abs(pointer.x)*1.3; headlight.material.emissiveIntensity = prefersReduced ? .9 : Math.min(2.4, .45 + Math.max(0,(elapsed-900)/900)); renderer.render(scene,camera); };
        animate(performance.now());
        cleanup = () => { cancelAnimationFrame(frame); observer.disconnect(); removeEventListener('resize', resize); renderer.dispose(); };
      } catch (_) {
        canvas.setAttribute('aria-hidden','true');
        fallback.classList.remove('hidden');
        stage.classList.add('car-fallback-active');
      }
    };
    if (!prefersReduced) loadThree(); else { fallback.classList.remove('hidden'); canvas.setAttribute('aria-hidden','true'); }
    addEventListener('pagehide', cleanup, {once:true});
  }
  function homePage() {
    shell(`<section class="hero reveal"><div class="eyebrow">VEHICLE INTELLIGENCE / 01</div><h1>Understand<br><em>every mile.</em></h1><p class="hero-copy">Your vehicle's history, translated into intelligence. Explore telemetry patterns and ask grounded questions without the guesswork.</p><div class="hero-actions"><a class="button primary" href="/analytics">Explore analytics <span>↗</span></a><a class="button ghost" href="/llm">Ask VehicleGPT <span>✦</span></a></div><div class="hero-console helmet-stage" aria-label="Decorative VehicleGPT performance helmet"><div class="console-top"><span>DEMO-VEHICLE-01</span><span class="live-dot">● SIMULATED DATA</span></div><div class="helmet-hud hud-one">AI / 07</div><div class="helmet-hud hud-two">VISOR LINK <b>OK</b></div><button class="helmet-hotspot hotspot-visor" type="button" aria-label="Explain visor system"><i></i><span>VISOR SYSTEM</span></button><button class="helmet-hotspot hotspot-core" type="button" aria-label="Explain telemetry core"><i></i><span>TELEMETRY CORE</span></button><div class="hotspot-note" aria-live="polite">Hover a marker to inspect this interface layer.</div><svg class="helmet-svg" viewBox="0 0 500 430" role="img" aria-label="Futuristic VehicleGPT racing helmet"><defs><linearGradient id="shellGradient" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#263b54"/><stop offset=".46" stop-color="#111925"/><stop offset="1" stop-color="#05080d"/></linearGradient><linearGradient id="visorGradient" x1="0" x2="1"><stop stop-color="#142d41"/><stop offset=".5" stop-color="#35d7ff"/><stop offset="1" stop-color="#08111c"/></linearGradient><filter id="helmetGlow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><g class="helmet-backdrop"><circle cx="250" cy="210" r="180"/><circle cx="250" cy="210" r="150"/><path d="M75 310H425M100 350H400"/></g><g class="helmet-shell"><path d="M128 322C93 265 90 166 130 102C164 48 215 26 276 31C367 38 414 105 409 203L392 319L335 364H177Z" fill="url(#shellGradient)" stroke="#35d7ff" stroke-width="2"/><path d="M138 267C127 208 140 119 191 79C218 59 258 49 296 55C359 65 389 116 385 181L369 237L327 263L170 270Z" fill="#0b1421" stroke="#1b6c82" stroke-width="2"/></g><path class="helmet-side-panel" d="M125 177L162 159L174 291L140 322Z" fill="#182333" stroke="#35d7ff"/><path class="helmet-visor" d="M164 151C218 126 316 126 374 160L354 230C304 249 221 248 169 225Z" fill="url(#visorGradient)" stroke="#c5ff54" stroke-width="3"/><path class="visor-reflection" d="M188 160C242 143 295 143 351 160L318 178C270 166 232 168 198 180Z" fill="#eaffff"/><g class="helmet-detail" stroke="#c5ff54" fill="none"><path d="M202 284H315"/><path d="M215 302H301"/><path d="M330 273L365 253M337 284L372 264"/><path d="M185 102L205 75M200 105L220 76"/></g><g class="helmet-markings" fill="#35d7ff"><circle cx="150" cy="144" r="4"/><circle cx="369" cy="143" r="4"/><circle cx="175" cy="335" r="3"/><circle cx="343" cy="334" r="3"/></g><path class="helmet-scan" d="M145 203H380" filter="url(#helmetGlow)"/></svg><div class="helmet-caption"><span class="eyebrow">SIGNATURE INTERFACE / 01</span><b><span id="heroTemp">—</span>°C · Performance telemetry, made legible.</b><small id="heroTime">Waiting for the latest record</small></div></div></section>
    <section class="section reveal"><div class="section-heading"><div><div class="eyebrow">LIVE VEHICLE OVERVIEW</div><h2>Signals, not assumptions.</h2></div><a class="text-link" href="/analytics">Open system analytics ↗</a></div><div class="metric-grid" id="homeMetrics">${metric('Latest temperature','—','°C','amber','Latest recorded reading')}${metric('Fuel level','—','%','lime','Latest recorded reading')}${metric('Max speed','—','km/h','cyan','Stored sample maximum')}${metric('Distance span','—','km','purple','Odometer difference')}</div></section>
    <section class="section cockpit-section reveal"><div class="section-heading"><div><div class="eyebrow">PERFORMANCE COCKPIT / 02</div><h2>Read the machine.</h2></div><span class="instrument-note">MEASURED VALUES · SIMULATED SOURCE</span></div><div class="cockpit-grid"><article class="instrument speed-instrument" tabindex="0" title="Maximum recorded speed"><div class="instrument-label">MAX RECORDED SPEED</div><div class="speed-dial"><div class="dial-ticks"></div><strong id="cockpitSpeed">—</strong><small>KM/H</small></div><p>Highest speed in the stored sample.</p></article><article class="instrument temp-instrument" tabindex="0" title="Latest engine temperature"><div class="instrument-label">LATEST TEMPERATURE</div><div class="temp-scale"><i></i><i></i><i></i><i></i><i></i><i></i><b id="cockpitTemp">—</b><span>°C</span></div><p id="cockpitTime">Latest recorded value</p></article><article class="instrument fuel-instrument" tabindex="0" title="Latest fuel level"><div class="instrument-label">FUEL LEVEL</div><div class="fuel-segments" id="fuelSegments">${Array.from({length:10},(_,i)=>`<i data-segment="${i}"></i>`).join('')}</div><strong id="cockpitFuel">—</strong><small>% · LATEST READING</small><p>Missing readings remain unavailable.</p></article><article class="instrument status-instrument"><div class="instrument-label">VEHICLE STATUS STRIP</div><div class="status-strip"><span><i></i><b>API</b><small>CONNECTED</small></span><span><b>DEMO-01</b><small>SIMULATED SOURCE</small></span><span><b id="cockpitRecords">—</b><small>TELEMETRY EVENTS</small></span><span><b>RPM N/A</b><small>NOT RECORDED</small></span></div></article></div></section>
    <section class="section capabilities reveal"><div class="section-heading"><div><div class="eyebrow">WHAT THE SYSTEM DOES</div><h2>A smarter cockpit for your data.</h2></div></div><div class="capability-grid"><a href="/analytics" class="capability"><span>01</span><b>Vehicle intelligence</b><p>Understand historical measurements and recorded events.</p><strong>Explore signals ↗</strong></a><a href="/analytics" class="capability"><span>02</span><b>System analytics</b><p>Inspect trends, calculated metrics, and data quality.</p><strong>Inspect telemetry ↗</strong></a><a href="/llm" class="capability"><span>03</span><b>Evidence assistant</b><p>Ask natural-language questions and see the evidence behind every answer.</p><strong>Ask a question ↗</strong></a></div></section>
    <section class="section process reveal"><div class="section-heading"><div><div class="eyebrow">HOW IT WORKS</div><h2>From signal to story.</h2></div></div><div class="process-grid">${[['01','Ingest','Vehicle telemetry enters the system.'],['02','Analyse','The backend retrieves records and calculates metrics.'],['03','Understand','Questions are checked against available evidence.'],['04','Explain','The interface presents an answer with its support.']].map(x => `<article><span>${x[0]}</span><b>${x[1]}</b><p>${x[2]}</p></article>`).join('')}</div></section>
    <section class="closing reveal"><div class="eyebrow">READY WHEN YOU ARE</div><h2>Every signal<br><em>tells a story.</em></h2><div class="hero-actions"><a class="button primary" href="/analytics">Read the system ↗</a><a class="button ghost" href="/llm">Talk to the co-pilot ✦</a></div></section>`);
    replaceHelmetWithCar();
    api(`/api/summary?vehicle_id=${vehicleId}`).then(data => {
      const latest = data.latest || {}, metrics = data.metrics || {};
      animateNumber($('#heroTemp'), latest.engine_temp_c, 0); $('#heroTime').textContent = latest.recorded_at ? `Last recorded ${dateFmt(latest.recorded_at)}` : 'No records available';
      $('#homeMetrics').innerHTML = metric('Latest temperature', fmt(latest.engine_temp_c), '°C', 'amber', 'Latest recorded reading') + metric('Fuel level', fmt(latest.fuel_level_pct, 0), '%', 'lime', 'Latest recorded reading') + metric('Max speed', fmt(metrics.max_speed_kph, 0), 'km/h', 'cyan', 'Stored sample maximum') + metric('Distance span', fmt(metrics.distance_span_km, 0), 'km', 'purple', 'Odometer difference');
      const values = [latest.engine_temp_c, latest.fuel_level_pct, metrics.max_speed_kph, metrics.distance_span_km];
      document.querySelectorAll('#homeMetrics [data-value]').forEach((element, index) => animateNumber(element, values[index], index === 1 || index === 2 || index === 3 ? 0 : 1));
      animateNumber($('#cockpitSpeed'), metrics.max_speed_kph, 0);
      animateNumber($('#cockpitTemp'), latest.engine_temp_c, 1);
      animateNumber($('#cockpitFuel'), latest.fuel_level_pct, 0);
      $('#cockpitTime').textContent = latest.recorded_at ? `Recorded ${dateFmt(latest.recorded_at)}` : 'No timestamp available';
      $('#cockpitRecords').textContent = data.total_records ?? 'N/A';
      if (latest.fuel_level_pct != null) document.querySelectorAll('#fuelSegments i').forEach((segment, index) => segment.classList.toggle('filled', index < Math.round(Number(latest.fuel_level_pct) / 10)));
    }).catch(() => { toast('Telemetry is unavailable. The dashboard will recover when the backend returns.'); });
  }
  function analyticsPage() {
    shell(`<section class="page-intro reveal"><div><div class="eyebrow">SYSTEM ANALYTICS / 02</div><h1>Inspect the <em>signals.</em></h1><p>Understand the machine through actual recorded telemetry. Calculated values are labelled; unavailable measurements stay unavailable.</p></div><div class="data-badge"><i></i><span id="analyticsStatus">Checking backend</span><small id="updatedAt">—</small></div></section>
    <section class="filter-bar reveal"><label>Vehicle<select id="vehicleFilter"><option value="${vehicleId}">Demo Vehicle 01</option></select></label><label>Start<input id="startFilter" type="datetime-local"></label><label>End<input id="endFilter" type="datetime-local"></label><button class="button primary" id="applyFilters">Refresh data ↻</button><button class="button ghost" id="resetFilters">Reset</button></section>
    <section class="metric-grid analytics-metrics reveal" id="analyticsMetrics">${metric('Total records','—','events','cyan','Measured count')}${metric('Latest temperature','—','°C','amber','Latest measured')}${metric('Maximum speed','—','km/h','purple','Measured maximum')}${metric('Average speed','—','km/h','cyan','Measured average')}${metric('Latest fuel','—','%','lime','Latest measured')}${metric('Distance span','—','km','lime','Calculated from odometer')}</section>
    <section class="chart-grid reveal"><article class="panel chart-panel"><div class="panel-heading"><div><div class="eyebrow">TEMPERATURE</div><h2>Engine temperature</h2></div><span class="unit">°C</span></div><div id="tempChart" class="chart"></div></article><article class="panel chart-panel"><div class="panel-heading"><div><div class="eyebrow">SPEED</div><h2>Recorded speed</h2></div><span class="unit">KM/H</span></div><div id="speedChart" class="chart"></div></article></section>
    <section class="panel data-panel reveal"><div class="panel-heading"><div><div class="eyebrow">SOURCE DATA</div><h2>Telemetry records</h2></div><div class="table-actions"><button class="text-link" id="prevPage">← Previous</button><span id="pageLabel">Page 1</span><button class="text-link" id="nextPage">Next →</button></div></div><div class="table-scroll"><table><thead><tr><th>TIME</th><th>EVENT</th><th>SPEED</th><th>TEMP</th><th>FUEL</th><th>ODOMETER</th><th>SOURCE</th></tr></thead><tbody id="analyticsTable"><tr><td colspan="7">Loading telemetry…</td></tr></tbody></table></div></section>
    <section class="insight-grid reveal"><article class="panel"><div class="eyebrow">DATA QUALITY</div><h2>Read the caveats.</h2><p id="insightText">Insights will be calculated from the selected records.</p></article><article class="panel"><div class="eyebrow">MEASUREMENT KEY</div><div class="key-list"><span><i class="key-dot measured"></i>Measured value</span><span><i class="key-dot calculated"></i>Calculated value</span><span><i class="key-dot missing"></i>N/A means not recorded</span></div></article></section>`);
    let currentPage = 1, allRows = [];
    async function load() {
      const vehicle = $('#vehicleFilter').value, start = $('#startFilter').value, end = $('#endFilter').value;
      if (start && end && new Date(start) > new Date(end)) { toast('Start must be before end.'); return; }
      const query = new URLSearchParams({vehicle_id: vehicle, page: String(currentPage), page_size: '10'}); if (start) query.set('start', new Date(start).toISOString()); if (end) query.set('end', new Date(end).toISOString());
      try {
        const [summary, rows, health] = await Promise.all([api(`/api/telemetry/summary?${query}`), api(`/api/telemetry?${query}`), api('/api/health')]);
        setStatus(health.status === 'ok' && health.database === 'connected'); $('#analyticsStatus').textContent = 'Backend connected'; $('#updatedAt').textContent = `Updated ${dateFmt(summary.latest_recorded_at)}`;
        const cards = [['Total records',summary.total_records,'events','cyan','Measured count'],['Latest temperature',fmt(summary.latest_temperature_c),'°C','amber','Latest measured'],['Maximum speed',fmt(summary.max_speed_kph),'km/h','purple','Measured maximum'],['Average speed',fmt(summary.average_speed_kph),'km/h','cyan','Measured average'],['Latest fuel',fmt(summary.latest_fuel_level_pct,0),'%','lime','Latest measured'],['Distance span',fmt(summary.distance_travelled_km),'km','lime','Calculated from odometer']];
        $('#analyticsMetrics').innerHTML = cards.map(x => metric(...x)).join(''); allRows = rows; renderRows(rows); drawChart('tempChart', rows, 'engine_temp_c', '°C', '#35d7ff'); drawChart('speedChart', rows, 'speed_kph', 'km/h', '#c5ff54');
        const missing = rows.filter(row => row.engine_temp_c == null).length; $('#insightText').textContent = rows.length ? `${missing} of ${rows.length} displayed records have no engine-temperature reading. Distance is an odometer difference, not a trip reconstruction.` : 'No telemetry matches these filters.';
      } catch (error) { toast(`Analytics unavailable: ${error.message}`); $('#analyticsTable').innerHTML = '<tr><td colspan="7">Unable to load records. Check the backend.</td></tr>'; }
    }
    function renderRows(rows) { $('#analyticsTable').innerHTML = rows.length ? rows.map(row => `<tr><td>${dateFmt(row.recorded_at)}</td><td><b>${esc(row.event_type)}</b></td><td>${fmt(row.speed_kph)} km/h</td><td>${fmt(row.engine_temp_c)} °C</td><td>${fmt(row.fuel_level_pct,0)}%</td><td>${fmt(row.odometer_km)} km</td><td><span class="source-tag">${esc(row.source || 'api')}</span></td></tr>`).join('') : '<tr><td colspan="7">No telemetry matches these filters.</td></tr>'; $('#pageLabel').textContent = `Page ${currentPage}`; }
    function drawChart(id, rows, field, unit, color) { const el = $(`#${id}`), pointsData = rows.filter(row => row[field] != null); if (pointsData.length < 2) { el.innerHTML = '<div class="empty-state">Not enough recorded values to draw this chart.</div>'; return; } const values = pointsData.map(r => r[field]), min = Math.min(...values), max = Math.max(...values), range = max - min || 1, points = values.map((v,i) => `${(i/(values.length-1))*100},${94-((v-min)/range)*76}`).join(' '), dots = pointsData.map((row,i) => `<circle class="chart-point" cx="${(i/(values.length-1))*100}" cy="${94-((row[field]-min)/range)*76}" r="2" data-tip="${esc(`${fmt(row[field])} ${unit} · ${dateFmt(row.recorded_at)}`)}"></circle>`).join(''); el.innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="${field} chart"><polyline class="chart-line" points="${points}" fill="none" stroke="${color}" stroke-width="1.4" vector-effect="non-scaling-stroke"/><polygon class="chart-area" points="${points} 100,100 0,100" fill="${color}" opacity=".08"/>${dots}</svg><div class="chart-tooltip" aria-live="polite"></div><div class="chart-labels"><span>${fmt(min)} ${unit}</span><span>${fmt(max)} ${unit}</span></div>`; el.querySelectorAll('.chart-point').forEach(point => point.addEventListener('pointerenter', () => { const tooltip = $('.chart-tooltip', el); tooltip.textContent = point.dataset.tip; tooltip.classList.add('visible'); })); el.addEventListener('pointerleave', () => $('.chart-tooltip', el)?.classList.remove('visible')); }
    $('#applyFilters').addEventListener('click', () => { currentPage = 1; load(); }); $('#resetFilters').addEventListener('click', () => { $('#startFilter').value = ''; $('#endFilter').value = ''; currentPage = 1; load(); }); $('#prevPage').addEventListener('click', () => { if (currentPage > 1) { currentPage--; load(); } }); $('#nextPage').addEventListener('click', () => { if (allRows.length === 10) { currentPage++; load(); } }); load();
  }
  function llmPage() {
    shell(`<section class="page-intro assistant-intro reveal"><div><div class="eyebrow">VEHICLEGPT INTELLIGENCE / 03</div><h1>Ask your <em>vehicle.</em></h1><p>Explore recorded history through evidence-grounded questions. The current answering mode is deterministic and rule-based — no model is being presented as active.</p></div><div class="mode-badge"><span>●</span><b>Evidence mode</b><small>Rule-based prototype</small></div></section><section class="assistant-layout reveal"><article class="panel chat-panel"><div class="chat-head"><div class="robot-mini">✦</div><div><b>VehicleGPT co-pilot</b><small>Grounded in demo-vehicle-01 telemetry</small></div><button id="clearChat" class="text-link">Clear</button></div><div id="chatMessages" class="chat-messages"><div class="message assistant"><span class="message-label">CO-PILOT · READY</span><p>Ask me about engine temperature, fuel changes, speed, or distance. I will show the evidence I used and say when the records are insufficient.</p></div></div><div class="suggestion-row"><button data-question="Has my engine temperature been unusually high?">Temperature history</button><button data-question="How has my fuel level changed?">Fuel changes</button><button data-question="What is my maximum recorded speed?">Maximum speed</button></div><form id="chatForm" class="chat-form"><label class="sr-only" for="chatInput">Ask VehicleGPT</label><textarea id="chatInput" rows="1" maxlength="500" placeholder="Ask about your recorded telemetry…" required></textarea><button id="sendButton" class="button primary" type="submit">Send ↗</button></form></article><aside class="panel evidence-guide"><div class="eyebrow">HOW TO ASK</div><h2>Good questions get grounded answers.</h2><div class="guide-item"><span>01</span><p>Choose a supported topic: temperature, fuel, speed, or odometer distance.</p></div><div class="guide-item"><span>02</span><p>Every response can include measurements from the stored telemetry.</p></div><div class="guide-item"><span>03</span><p>No evidence means no guess. The assistant will abstain honestly.</p></div><a class="text-link" href="/analytics">Inspect the source data ↗</a></aside></section>`);
    const messages = $('#chatMessages'), input = $('#chatInput'), send = $('#sendButton');
    function addMessage(kind, text, result) { const evidence = result?.evidence?.length ? `<div class="evidence-list">${result.evidence.map(item => `<span>${esc(item.metric)} <b>${fmt(item.value)} ${esc(item.unit || '')}</b></span>`).join('')}</div>` : ''; const node = document.createElement('div'); node.className = `message ${kind}`; node.innerHTML = `<span class="message-label">${kind === 'user' ? 'YOU' : 'CO-PILOT'} · ${dateFmt(new Date().toISOString())}</span><p>${esc(text)}</p>${evidence}`; messages.appendChild(node); messages.scrollTop = messages.scrollHeight; }
    async function ask(question) { if (!question.trim() || send.disabled) return; addMessage('user', question); input.value = ''; send.disabled = true; send.textContent = 'Checking…'; const pending = document.createElement('div'); pending.className = 'message assistant pending'; pending.textContent = 'Reading stored telemetry…'; messages.appendChild(pending); try { const result = await api('/api/ask', {method:'POST', body:JSON.stringify({question:question.trim(), vehicle_id:vehicleId})}); pending.remove(); addMessage('assistant', result.answer, result); } catch (error) { pending.remove(); addMessage('assistant', `I could not reach the telemetry service: ${error.message}. Your previous messages are still here.`); } finally { send.disabled = false; send.textContent = 'Send ↗'; input.focus(); } }
    $('#chatForm').addEventListener('submit', event => { event.preventDefault(); ask(input.value); }); input.addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); $('#chatForm').requestSubmit(); } }); document.querySelectorAll('[data-question]').forEach(button => button.addEventListener('click', () => ask(button.dataset.question))); $('#clearChat').addEventListener('click', () => { messages.innerHTML = '<div class="message assistant"><span class="message-label">CO-PILOT · READY</span><p>Conversation cleared. Ask me about your recorded telemetry.</p></div>'; });
  }
  if (page === 'home') homePage(); else if (page === 'analytics') analyticsPage(); else llmPage();
  setupPointerInteractions();
})();
