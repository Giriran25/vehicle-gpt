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
        const camera = new THREE.PerspectiveCamera(46, 1, .1, 100);
        camera.position.set(7.8, 3.8, 10.8);
        camera.lookAt(0, .72, 0);
        const renderer = new THREE.WebGLRenderer({canvas, antialias: true, alpha: true, powerPreference: 'high-performance'});
        renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.18;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        const root = new THREE.Group();
        root.rotation.y = -.22;
        scene.add(root);
        const paint = new THREE.MeshPhysicalMaterial({color:0x1b4770, metalness:.78, roughness:.23, clearcoat:1, clearcoatRoughness:.1});
        const paintDark = new THREE.MeshPhysicalMaterial({color:0x0c2036, metalness:.72, roughness:.27, clearcoat:.8});
        const carbon = new THREE.MeshStandardMaterial({color:0x07101a, metalness:.5, roughness:.3});
        const glass = new THREE.MeshPhysicalMaterial({color:0x19364b, metalness:.3, roughness:.12, transmission:.18, transparent:true, opacity:.9, clearcoat:.5});
        const chrome = new THREE.MeshStandardMaterial({color:0x9eb7c9, metalness:.95, roughness:.18});
        const cyan = new THREE.MeshStandardMaterial({color:0x35d7ff, emissive:0x0b718e, emissiveIntensity:1.3, metalness:.35, roughness:.22});
        const headlightMaterial = new THREE.MeshStandardMaterial({color:0xd9f8ff, emissive:0x7adfff, emissiveIntensity:.55, metalness:.2, roughness:.15});
        const red = new THREE.MeshStandardMaterial({color:0x401016, emissive:0x9d1c2a, emissiveIntensity:.7});
        const tire = new THREE.MeshStandardMaterial({color:0x111820, roughness:.84, metalness:.06});
        const brake = new THREE.MeshStandardMaterial({color:0xb8c6ce, metalness:.9, roughness:.24});
        const caliper = new THREE.MeshStandardMaterial({color:0xb9edff, emissive:0x174e62, emissiveIntensity:.3, metalness:.72, roughness:.25});
        const add = (geometry, material, position, scale = [1,1,1], rotation = [0,0,0]) => {
          const mesh = new THREE.Mesh(geometry, material); mesh.position.set(...position); mesh.scale.set(...scale); mesh.rotation.set(...rotation); mesh.castShadow = true; mesh.receiveShadow = true; root.add(mesh); return mesh;
        };
        add(new THREE.SphereGeometry(1, 64, 32), paint, [0,.9,0], [3.35,.67,1.5]);
        add(new THREE.BoxGeometry(4.35,.34,1.9), paintDark, [-.05,.57,0]);
        add(new THREE.SphereGeometry(1, 56, 28), paint, [1.58,.88,0], [1.92,.5,1.34]);
        add(new THREE.SphereGeometry(1, 48, 24), glass, [.05,1.42,0], [1.7,.54,1.03]);
        add(new THREE.BoxGeometry(2.55,.1,1.48), carbon, [-.72,.96,0]);
        add(new THREE.BoxGeometry(1.05,.07,1.72), carbon, [2.35,.65,0]);
        add(new THREE.BoxGeometry(.28,.11,1.23), cyan, [2.55,.89,0]);
        add(new THREE.BoxGeometry(.18,.1,1.18), cyan, [-2.7,.82,0]);
        add(new THREE.BoxGeometry(.34,.08,1.72), carbon, [-2.16,.52,0]);
        add(new THREE.BoxGeometry(.38,.1,.18), carbon, [.25,1.86,-1.13], [1,1,1], [0,.35,0]);
        add(new THREE.BoxGeometry(.38,.1,.18), carbon, [.25,1.86,1.13], [1,1,1], [0,-.35,0]);
        add(new THREE.BoxGeometry(.12,.1,1.2), red, [-2.75,.98,0]);
        const wheelPositions = [[-1.72,-.9],[-1.72,.9],[1.68,-.9],[1.68,.9]];
        wheelPositions.forEach(([x,z]) => {
          const wheel = new THREE.Group(); wheel.position.set(x,.53,z); wheel.rotation.x = Math.PI / 2;
          const tyreMesh = new THREE.Mesh(new THREE.CylinderGeometry(.6,.6,.32,48), tire);
          const rim = new THREE.Mesh(new THREE.CylinderGeometry(.39,.39,.34,32), chrome);
          const rotor = new THREE.Mesh(new THREE.CylinderGeometry(.27,.27,.35,32), brake);
          tyreMesh.castShadow = rim.castShadow = rotor.castShadow = true;
          wheel.add(tyreMesh, rim, rotor);
          for (let spoke = 0; spoke < 10; spoke++) {
            const spokeMesh = new THREE.Mesh(new THREE.BoxGeometry(.075,.08,.34), chrome);
            spokeMesh.rotation.z = spoke * Math.PI / 5; spokeMesh.position.z = .03; wheel.add(spokeMesh);
          }
          const caliperMesh = new THREE.Mesh(new THREE.BoxGeometry(.12,.16,.12), caliper); caliperMesh.position.set(.2,.05,.17); wheel.add(caliperMesh);
          root.add(wheel);
          add(new THREE.TorusGeometry(.68,.1,12,48,Math.PI), paintDark, [x,.56,z > 0 ? .9 : -.9], [1,1,1], [Math.PI / 2,0,Math.PI]);
        });
        const headlight = add(new THREE.BoxGeometry(.1,.16,.72), headlightMaterial, [2.84,1.06,-.76], [1,1,1], [0,.16,-.12]);
        add(new THREE.BoxGeometry(.1,.16,.72), headlightMaterial, [2.84,1.06,.76], [1,1,1], [0,.16,.12]);
        add(new THREE.BoxGeometry(.18,.32,.36), carbon, [2.86,.68,-.53], [1,1,1], [0,.18,0]);
        add(new THREE.BoxGeometry(.18,.32,.36), carbon, [2.86,.68,.53], [1,1,1], [0,-.18,0]);
        const grille = add(new THREE.BoxGeometry(.12,.3,.85), carbon, [2.9,.68,0], [1,1,1]);
        for (let line = -3; line <= 3; line++) add(new THREE.BoxGeometry(.14,.02,.08), chrome, [2.98,.59,line * .11]);
        const splitter = add(new THREE.BoxGeometry(.25,.06,1.7), carbon, [2.85,.42,0]);
        const light = new THREE.PointLight(0xbdefff, 0, 3.5); light.position.set(2.8,1.2,-1.7); root.add(light);
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(18,12), new THREE.MeshStandardMaterial({color:0x07101a, roughness:.75, metalness:.2, transparent:true, opacity:.55}));
        floor.rotation.x = -Math.PI / 2; floor.position.y = -.12; floor.receiveShadow = true; scene.add(floor);
        scene.add(new THREE.HemisphereLight(0xb9e8ff, 0x14283a, 2.2));
        const key = new THREE.DirectionalLight(0xe9f8ff, 4.5); key.position.set(-4,7,5); key.castShadow = true; key.shadow.mapSize.set(1024,1024); scene.add(key);
        const fill = new THREE.DirectionalLight(0x7fa8c8, 2.6); fill.position.set(5,3,-6); scene.add(fill);
        const rim = new THREE.PointLight(0x35d7ff, 14, 8); rim.position.set(-3,2,-3); scene.add(rim);
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
  function initVoiceAssistant(messagesContainer) {
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    const isSpeechSupported = !!(synth && typeof SpeechSynthesisUtterance !== 'undefined');
    const SpeechRec = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
    const isRecSupported = !!SpeechRec;

    const toggleBtn = $('#voiceToggle');
    const liveBadge = $('#voiceIndicator');
    const statusText = $('#voiceStatusText');
    const playBtn = $('#voicePlayBtn');
    const pauseBtn = $('#voicePauseBtn');
    const resumeBtn = $('#voiceResumeBtn');
    const stopBtn = $('#voiceStopBtn');
    const replayBtn = $('#voiceReplayBtn');
    const voiceSelect = $('#voiceSelect');
    const rateSelect = $('#rateSelect');
    const micBtn = $('#micButton');
    const micBanner = $('#micListeningBanner');
    const micCancelBtn = $('#micCancelBtn');
    const chatInput = $('#chatInput');

    let voiceEnabled = true;
    try {
      const saved = localStorage.getItem('vehiclegpt_voice_enabled');
      if (saved !== null) voiceEnabled = saved === '1';
    } catch (_) {}

    let savedVoiceURI = '';
    try { savedVoiceURI = localStorage.getItem('vehiclegpt_voice_uri') || ''; } catch (_) {}

    let savedRate = '1.0';
    try {
      savedRate = localStorage.getItem('vehiclegpt_voice_rate') || '1.0';
      if (rateSelect) rateSelect.value = savedRate;
    } catch (_) {}

    let speaking = false;
    let paused = false;
    let listening = false;
    let latestAnswerText = '';
    let voices = [];
    let recognition = null;
    let keepAliveTimer = null;

    const initialWelcome = messagesContainer ? messagesContainer.querySelector('.message.assistant p') : null;
    if (initialWelcome) {
      latestAnswerText = initialWelcome.textContent.trim();
    }

    function updateToggleUI() {
      if (!toggleBtn) return;
      toggleBtn.classList.toggle('active', voiceEnabled);
      toggleBtn.setAttribute('aria-pressed', voiceEnabled ? 'true' : 'false');
      const label = toggleBtn.querySelector('.voice-toggle-label');
      if (label) {
        label.innerHTML = `VOICE NARRATION: <b>${voiceEnabled ? 'ACTIVE' : 'MUTED'}</b>`;
      }
    }

    function setPlaybackState(state) {
      if (!liveBadge || !statusText) return;
      liveBadge.className = `voice-live-badge ${state}`;
      if (state === 'speaking') {
        speaking = true; paused = false;
        statusText.textContent = 'SPEAKING';
        if (playBtn) playBtn.disabled = true;
        if (pauseBtn) { pauseBtn.disabled = false; pauseBtn.style.display = ''; }
        if (resumeBtn) resumeBtn.style.display = 'none';
        if (stopBtn) stopBtn.disabled = false;
        if (replayBtn) replayBtn.disabled = false;
      } else if (state === 'paused') {
        speaking = true; paused = true;
        statusText.textContent = 'PAUSED';
        if (playBtn) playBtn.disabled = true;
        if (pauseBtn) pauseBtn.style.display = 'none';
        if (resumeBtn) { resumeBtn.disabled = false; resumeBtn.style.display = ''; }
        if (stopBtn) stopBtn.disabled = false;
        if (replayBtn) replayBtn.disabled = false;
      } else if (state === 'listening') {
        statusText.textContent = 'LISTENING';
        if (playBtn) playBtn.disabled = true;
        if (pauseBtn) pauseBtn.disabled = true;
        if (stopBtn) stopBtn.disabled = true;
      } else {
        speaking = false; paused = false;
        statusText.textContent = 'IDLE';
        if (playBtn) playBtn.disabled = !latestAnswerText;
        if (pauseBtn) { pauseBtn.disabled = true; pauseBtn.style.display = ''; }
        if (resumeBtn) resumeBtn.style.display = 'none';
        if (stopBtn) stopBtn.disabled = true;
        if (replayBtn) replayBtn.disabled = !latestAnswerText;
      }
    }

    function cleanTextForSpeech(text) {
      if (!text) return '';
      const div = document.createElement('div');
      div.innerHTML = text;
      let clean = div.textContent || div.innerText || '';
      return clean
        .replace(/°C/g, ' degrees Celsius')
        .replace(/km\/h/g, ' kilometers per hour')
        .replace(/%/g, ' percent')
        .replace(/\s+/g, ' ')
        .trim();
    }

    function loadVoices() {
      if (!isSpeechSupported || !synth) return;
      try {
        voices = synth.getVoices() || [];
      } catch (_) {
        voices = [];
      }
      if (!voiceSelect || !voices.length) return;

      const currentVal = voiceSelect.value || savedVoiceURI;
      voiceSelect.innerHTML = '<option value="">Default System Voice</option>';
      voices.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.voiceURI;
        opt.textContent = `${v.name} (${v.lang})${v.default ? ' — Default' : ''}`;
        if (currentVal && v.voiceURI === currentVal) {
          opt.selected = true;
        }
        voiceSelect.appendChild(opt);
      });
    }

    function stopSpeech() {
      if (keepAliveTimer) {
        clearInterval(keepAliveTimer);
        keepAliveTimer = null;
      }
      if (isSpeechSupported && synth) {
        try { synth.cancel(); } catch (_) {}
      }
      setPlaybackState('idle');
    }

    function speakText(rawText, isAuto = false) {
      if (!isSpeechSupported || !synth) return;
      if (isAuto && !voiceEnabled) return;

      const speechText = cleanTextForSpeech(rawText);
      if (!speechText) return;

      latestAnswerText = rawText;
      stopSpeech();

      let utterance;
      try {
        utterance = new SpeechSynthesisUtterance(speechText);
      } catch (e) {
        return;
      }

      const selectedURI = voiceSelect ? voiceSelect.value : '';
      if (selectedURI) {
        const matched = voices.find(v => v.voiceURI === selectedURI);
        if (matched) utterance.voice = matched;
      }

      const currentRate = rateSelect ? parseFloat(rateSelect.value) || 1.0 : 1.0;
      utterance.rate = currentRate;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        setPlaybackState('speaking');
        if (keepAliveTimer) clearInterval(keepAliveTimer);
        keepAliveTimer = setInterval(() => {
          if (!synth || !synth.speaking) {
            clearInterval(keepAliveTimer);
            keepAliveTimer = null;
            return;
          }
          if (!synth.paused) {
            synth.pause();
            synth.resume();
          }
        }, 10000);
      };

      utterance.onpause = () => {
        setPlaybackState('paused');
      };

      utterance.onresume = () => {
        setPlaybackState('speaking');
      };

      utterance.onend = () => {
        if (keepAliveTimer) {
          clearInterval(keepAliveTimer);
          keepAliveTimer = null;
        }
        setPlaybackState('idle');
      };

      utterance.onerror = (e) => {
        if (keepAliveTimer) {
          clearInterval(keepAliveTimer);
          keepAliveTimer = null;
        }
        if (e.error !== 'canceled' && e.error !== 'interrupted') {
          if (typeof console !== 'undefined') console.warn('Speech synthesis error:', e.error);
        }
        setPlaybackState('idle');
      };

      try {
        synth.speak(utterance);
      } catch (err) {
        if (typeof console !== 'undefined') console.warn('speak failed:', err);
        setPlaybackState('idle');
      }
    }

    function pauseSpeech() {
      if (isSpeechSupported && synth && synth.speaking && !synth.paused) {
        try { synth.pause(); } catch (_) {}
        setPlaybackState('paused');
      }
    }

    function resumeSpeech() {
      if (isSpeechSupported && synth && synth.paused) {
        try { synth.resume(); } catch (_) {}
        setPlaybackState('speaking');
      } else if (latestAnswerText) {
        speakText(latestAnswerText);
      }
    }

    function toggleVoice() {
      voiceEnabled = !voiceEnabled;
      try {
        localStorage.setItem('vehiclegpt_voice_enabled', voiceEnabled ? '1' : '0');
      } catch (_) {}
      updateToggleUI();
      if (!voiceEnabled && speaking) {
        stopSpeech();
      }
      toast(voiceEnabled ? 'Voice narration enabled' : 'Voice narration muted');
    }

    function stopListening() {
      if (recognition) {
        try { recognition.stop(); } catch (_) {}
      }
      listening = false;
      if (micBtn) micBtn.classList.remove('listening');
      if (micBanner) micBanner.classList.add('hidden');
      if (!speaking) setPlaybackState('idle');
    }

    function startListening() {
      if (!isRecSupported) {
        toast('Voice input is not supported in this browser.');
        return;
      }
      if (listening) {
        stopListening();
        return;
      }

      stopSpeech();

      try {
        recognition = new SpeechRec();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = (typeof navigator !== 'undefined' && navigator.language) ? navigator.language : 'en-US';
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          listening = true;
          if (micBtn) micBtn.classList.add('listening');
          if (micBanner) micBanner.classList.remove('hidden');
          setPlaybackState('listening');
        };

        recognition.onresult = (event) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          if (chatInput && transcript) {
            chatInput.value = transcript;
          }
        };

        recognition.onerror = (event) => {
          const err = event.error;
          if (err === 'not-allowed') {
            toast('Microphone permission was denied. Allow microphone access in your browser.');
          } else if (err === 'no-speech') {
            toast('No speech detected. Please try again.');
          } else if (err === 'audio-capture') {
            toast('No microphone found on this device.');
          } else if (err !== 'aborted') {
            toast(`Voice input error: ${err}`);
          }
          stopListening();
        };

        recognition.onend = () => {
          stopListening();
          if (chatInput) chatInput.focus();
        };

        recognition.start();
      } catch (err) {
        toast(`Could not start speech recognition: ${err.message || err}`);
        stopListening();
      }
    }

    if (toggleBtn) toggleBtn.addEventListener('click', toggleVoice);
    if (playBtn) playBtn.addEventListener('click', () => {
      if (paused) resumeSpeech();
      else if (latestAnswerText) speakText(latestAnswerText);
    });
    if (pauseBtn) pauseBtn.addEventListener('click', pauseSpeech);
    if (resumeBtn) resumeBtn.addEventListener('click', resumeSpeech);
    if (stopBtn) stopBtn.addEventListener('click', stopSpeech);
    if (replayBtn) replayBtn.addEventListener('click', () => {
      if (latestAnswerText) speakText(latestAnswerText);
    });

    if (rateSelect) rateSelect.addEventListener('change', () => {
      try { localStorage.setItem('vehiclegpt_voice_rate', rateSelect.value); } catch (_) {}
    });

    if (voiceSelect) voiceSelect.addEventListener('change', () => {
      try { localStorage.setItem('vehiclegpt_voice_uri', voiceSelect.value); } catch (_) {}
    });

    if (micBtn) {
      if (!isRecSupported) {
        micBtn.title = 'Voice recognition not supported in this browser';
        micBtn.classList.add('disabled');
      }
      micBtn.addEventListener('click', startListening);
    }

    if (micCancelBtn) {
      micCancelBtn.addEventListener('click', stopListening);
    }

    if (isSpeechSupported && synth) {
      loadVoices();
      if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = loadVoices;
      }
      setTimeout(loadVoices, 300);
      setTimeout(loadVoices, 1000);
    } else {
      if (statusText) statusText.textContent = 'NO TTS';
      if (toggleBtn) toggleBtn.disabled = true;
      if (playBtn) playBtn.disabled = true;
      if (replayBtn) replayBtn.disabled = true;
    }

    updateToggleUI();
    setPlaybackState('idle');

    const cleanup = () => {
      stopSpeech();
      stopListening();
    };
    window.addEventListener('pagehide', cleanup, {once: true});
    window.addEventListener('beforeunload', cleanup, {once: true});

    return {
      onAnswerReceived: (answerText) => {
        latestAnswerText = answerText;
        if (playBtn) playBtn.disabled = false;
        if (replayBtn) replayBtn.disabled = false;
        if (voiceEnabled) {
          speakText(answerText, true);
        }
      },
      speakSpecific: (text) => {
        speakText(text, false);
      },
      setLatestAnswer: (text) => {
        latestAnswerText = text;
        if (playBtn) playBtn.disabled = !text;
        if (replayBtn) replayBtn.disabled = !text;
      },
      stop: stopSpeech
    };
  }
  function llmPage() {
    shell(`<section class="page-intro assistant-intro reveal"><div><div class="eyebrow">VEHICLEGPT INTELLIGENCE / 03</div><h1>Ask your <em>vehicle.</em></h1><p>Explore recorded history through evidence-grounded questions. Telemetry answers can be read aloud using browser voice narration or entered with voice input.</p></div><div class="mode-badge"><span>●</span><b>Evidence mode</b><small>Web speech enabled</small></div></section><section class="assistant-layout reveal"><article class="panel chat-panel"><div class="chat-head"><div class="robot-mini">✦</div><div><b>VehicleGPT co-pilot</b><small>Grounded in demo-vehicle-01 telemetry</small></div><button id="clearChat" class="text-link">Clear</button></div><div class="voice-toolbar" role="region" aria-label="Voice audio controls"><div class="voice-status-group"><button id="voiceToggle" class="voice-toggle-btn active" type="button" aria-pressed="true" title="Toggle automatic speech narration"><span class="voice-toggle-led"></span><span class="voice-toggle-label">VOICE NARRATION: <b>ACTIVE</b></span></button><div id="voiceIndicator" class="voice-live-badge idle" aria-live="polite"><span class="audio-bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span id="voiceStatusText" class="voice-status-text">IDLE</span></div></div><div class="voice-actions-group"><button id="voicePlayBtn" class="voice-btn" type="button" title="Play latest answer" aria-label="Play latest answer"><span aria-hidden="true">▶</span> Play</button><button id="voicePauseBtn" class="voice-btn" type="button" title="Pause narration" aria-label="Pause narration" disabled><span aria-hidden="true">⏸</span> Pause</button><button id="voiceResumeBtn" class="voice-btn" type="button" title="Resume narration" aria-label="Resume narration" style="display:none"><span aria-hidden="true">⏯</span> Resume</button><button id="voiceStopBtn" class="voice-btn" type="button" title="Stop narration" aria-label="Stop narration" disabled><span aria-hidden="true">⏹</span> Stop</button><button id="voiceReplayBtn" class="voice-btn" type="button" title="Replay latest answer" aria-label="Replay latest answer"><span aria-hidden="true">↺</span> Replay</button></div><div class="voice-settings-group"><label class="voice-select-label" for="voiceSelect"><span>VOICE</span><select id="voiceSelect" aria-label="Select speech synthesis voice"><option value="">Default System Voice</option></select></label><label class="voice-rate-label" for="rateSelect"><span>SPEED</span><select id="rateSelect" aria-label="Select speech rate"><option value="0.8">0.8x</option><option value="1.0" selected>1.0x</option><option value="1.2">1.2x</option><option value="1.5">1.5x</option></select></label></div></div><div id="chatMessages" class="chat-messages"><div class="message assistant"><span class="message-label">CO-PILOT · READY</span><button class="message-speak-btn" type="button" title="Read this answer aloud" aria-label="Read this answer aloud"><span>🔊 Listen</span></button><p>Ask me about engine temperature, fuel changes, speed, or distance. I will show the evidence I used and say when the records are insufficient.</p></div></div><div class="suggestion-row"><button data-question="Has my engine temperature been unusually high?">Temperature history</button><button data-question="How has my fuel level changed?">Fuel changes</button><button data-question="What is my maximum recorded speed?">Maximum speed</button></div><form id="chatForm" class="chat-form"><label class="sr-only" for="chatInput">Ask VehicleGPT</label><div class="chat-input-wrapper"><textarea id="chatInput" rows="1" maxlength="500" placeholder="Ask about your recorded telemetry…" required></textarea><button id="micButton" class="mic-button" type="button" aria-label="Speak your question using microphone" title="Speak question"><svg class="mic-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path fill="currentColor" d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg><span class="mic-pulse" aria-hidden="true"></span></button></div><button id="sendButton" class="button primary" type="submit">Send ↗</button></form><div id="micListeningBanner" class="mic-banner hidden" role="status" aria-live="polite"><span class="mic-live-dot"></span><span>LISTENING: Speak your question now...</span><button id="micCancelBtn" type="button" class="mic-cancel-btn">Cancel ✕</button></div></article><aside class="panel evidence-guide"><div class="eyebrow">HOW TO ASK</div><h2>Good questions get grounded answers.</h2><div class="guide-item"><span>01</span><p>Choose a supported topic: temperature, fuel, speed, or odometer distance.</p></div><div class="guide-item"><span>02</span><p>Every response can include measurements from the stored telemetry.</p></div><div class="guide-item"><span>03</span><p>No evidence means no guess. The assistant will abstain honestly.</p></div><div class="guide-item"><span>04</span><p>Use voice controls to listen to answers or speak questions via microphone.</p></div><a class="text-link" href="/analytics">Inspect the source data ↗</a></aside></section>`);
    const messages = $('#chatMessages'), input = $('#chatInput'), send = $('#sendButton');
    const voiceAssistant = initVoiceAssistant(messages);

    const initialSpeakBtn = messages?.querySelector('.message.assistant .message-speak-btn');
    if (initialSpeakBtn) {
      const initialText = messages.querySelector('.message.assistant p')?.textContent || '';
      initialSpeakBtn.addEventListener('click', () => voiceAssistant.speakSpecific(initialText));
    }

    function addMessage(kind, text, result) {
      const evidence = result?.evidence?.length ? `<div class="evidence-list">${result.evidence.map(item => `<span>${esc(item.metric)} <b>${fmt(item.value)} ${esc(item.unit || '')}</b></span>`).join('')}</div>` : '';
      const speakBtn = kind === 'assistant' ? `<button class="message-speak-btn" type="button" title="Read this answer aloud" aria-label="Read this answer aloud"><span>🔊 Listen</span></button>` : '';
      const node = document.createElement('div');
      node.className = `message ${kind}`;
      node.innerHTML = `<span class="message-label">${kind === 'user' ? 'YOU' : 'CO-PILOT'} · ${dateFmt(new Date().toISOString())}</span>${speakBtn}<p>${esc(text)}</p>${evidence}`;
      if (kind === 'assistant') {
        const btn = node.querySelector('.message-speak-btn');
        if (btn) btn.addEventListener('click', () => voiceAssistant.speakSpecific(text));
      }
      messages.appendChild(node);
      messages.scrollTop = messages.scrollHeight;
    }

    async function ask(question) {
      if (!question.trim() || send.disabled) return;
      voiceAssistant.stop();
      addMessage('user', question);
      input.value = '';
      send.disabled = true;
      send.textContent = 'Checking…';
      const pending = document.createElement('div');
      pending.className = 'message assistant pending';
      pending.textContent = 'Reading stored telemetry…';
      messages.appendChild(pending);
      try {
        const result = await api('/api/ask', {method: 'POST', body: JSON.stringify({question: question.trim(), vehicle_id: vehicleId})});
        pending.remove();
        addMessage('assistant', result.answer, result);
        voiceAssistant.onAnswerReceived(result.answer);
      } catch (error) {
        pending.remove();
        addMessage('assistant', `I could not reach the telemetry service: ${error.message}. Your previous messages are still here.`);
      } finally {
        send.disabled = false;
        send.textContent = 'Send ↗';
        input.focus();
      }
    }

    $('#chatForm').addEventListener('submit', event => {
      event.preventDefault();
      ask(input.value);
    });
    input.addEventListener('keydown', event => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        $('#chatForm').requestSubmit();
      }
    });
    document.querySelectorAll('[data-question]').forEach(button => button.addEventListener('click', () => ask(button.dataset.question)));
    $('#clearChat').addEventListener('click', () => {
      voiceAssistant.stop();
      const clearText = 'Conversation cleared. Ask me about your recorded telemetry.';
      messages.innerHTML = `<div class="message assistant"><span class="message-label">CO-PILOT · READY</span><button class="message-speak-btn" type="button" title="Read this answer aloud" aria-label="Read this answer aloud"><span>🔊 Listen</span></button><p>${clearText}</p></div>`;
      voiceAssistant.setLatestAnswer(clearText);
      const btn = messages.querySelector('.message-speak-btn');
      if (btn) btn.addEventListener('click', () => voiceAssistant.speakSpecific(clearText));
    });
  }
  if (page === 'home') homePage(); else if (page === 'analytics') analyticsPage(); else llmPage();
  setupPointerInteractions();
})();
