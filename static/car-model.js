/**
 * VehicleGPT — Detailed Procedural Sports Car Model
 * 
 * Creates a recognisable sports-car model using sculpted Three.js geometries.
 * The silhouette is built from profiled shapes, spline curves, and carefully
 * proportioned components to produce a convincing mid-engine GT coupe.
 * 
 * This is a PROCEDURAL model — not an imported GLB. It aims for the best
 * possible realism achievable without external mesh assets.
 */

export function createSportsCar(THREE) {
  const car = new THREE.Group();
  car.name = 'sportsCar';

  // ── Colour palette & materials ──────────────────────────────────────
  const bodyColor = 0x1a3d5c;          // midnight graphite-blue
  const bodyColorDark = 0x0e2238;      // shadow panels
  const glassColor = 0x1a3048;         // tinted glass
  const chromeColor = 0xb0c4d8;        // brushed aluminium
  const tireDark = 0x1a1a1a;           // rubber
  const brakeDiscColor = 0x99aab5;     // steel disc
  const caliperColor = 0x22bbee;       // sport caliper (cyan accent)
  const headlightColor = 0xe8f4ff;     // DRL white
  const tailColor = 0xcc2233;          // rear lights

  // Body paint — deep metallic with automotive clearcoat
  const paintMat = new THREE.MeshPhysicalMaterial({
    color: bodyColor,
    metalness: 0.82,
    roughness: 0.18,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
    envMapIntensity: 1.4,
    reflectivity: 0.9,
  });

  // Darker accent paint for lower body, sills, diffuser
  const paintDarkMat = new THREE.MeshPhysicalMaterial({
    color: bodyColorDark,
    metalness: 0.7,
    roughness: 0.25,
    clearcoat: 0.7,
    clearcoatRoughness: 0.12,
  });

  // Carbon fibre look
  const carbonMat = new THREE.MeshStandardMaterial({
    color: 0x0a1018,
    metalness: 0.45,
    roughness: 0.35,
  });

  // Glass — semi-transparent with reflections
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: glassColor,
    metalness: 0.1,
    roughness: 0.05,
    transmission: 0.55,
    transparent: true,
    opacity: 0.7,
    clearcoat: 0.4,
    ior: 1.5,
    thickness: 0.05,
  });

  // Chrome / aluminium
  const chromeMat = new THREE.MeshStandardMaterial({
    color: chromeColor,
    metalness: 0.95,
    roughness: 0.12,
  });

  // Tyre rubber
  const tireMat = new THREE.MeshStandardMaterial({
    color: tireDark,
    roughness: 0.92,
    metalness: 0.02,
  });

  // Brake disc
  const discMat = new THREE.MeshStandardMaterial({
    color: brakeDiscColor,
    metalness: 0.9,
    roughness: 0.3,
  });

  // Brake caliper
  const caliperMat = new THREE.MeshStandardMaterial({
    color: caliperColor,
    metalness: 0.75,
    roughness: 0.2,
    emissive: caliperColor,
    emissiveIntensity: 0.15,
  });

  // Headlight emissive
  const headlightMat = new THREE.MeshStandardMaterial({
    color: headlightColor,
    emissive: 0x88ccff,
    emissiveIntensity: 0.4,
    metalness: 0.15,
    roughness: 0.1,
  });

  // Headlight housing (dark chrome)
  const headlightHousingMat = new THREE.MeshStandardMaterial({
    color: 0x222830,
    metalness: 0.8,
    roughness: 0.2,
  });

  // Tail light emissive
  const tailMat = new THREE.MeshStandardMaterial({
    color: tailColor,
    emissive: tailColor,
    emissiveIntensity: 0.5,
    metalness: 0.2,
    roughness: 0.15,
  });

  // Interior dark
  const interiorMat = new THREE.MeshStandardMaterial({
    color: 0x080e14,
    roughness: 0.7,
    metalness: 0.1,
  });

  // ── Utility functions ───────────────────────────────────────────────
  const addMesh = (geometry, material, pos, rot, scale) => {
    const mesh = new THREE.Mesh(geometry, material);
    if (pos) mesh.position.set(pos[0], pos[1], pos[2]);
    if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
    if (scale) mesh.scale.set(scale[0], scale[1], scale[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    car.add(mesh);
    return mesh;
  };

  // ── 1. MAIN BODY — sculpted sports-car profile ─────────────────────
  // We create the body by combining several shaped pieces:
  // a) Lower body (slab with wheel arches carved out)
  // b) Upper cabin (greenhouse)
  // c) Hood (bonnet)
  // d) Rear deck
  
  // Overall dimensions (in Three.js units — approx 1 unit = 0.5m)
  const totalLength = 9.2;  // ~4.6m real-world
  const bodyWidth = 1.95;   // half-width = 0.975
  const bodyHeight = 0.72;  // lower body slab height
  const hw = bodyWidth / 2; // half width

  // ─── LOWER BODY SHAPE (side profile) ───
  // Creates the main body slab using ExtrudeGeometry
  const bodyShape = new THREE.Shape();
  // Start at rear-bottom
  bodyShape.moveTo(-3.8, 0);
  // Rear lower edge
  bodyShape.lineTo(-4.0, 0.08);
  bodyShape.lineTo(-4.2, 0.22);
  // Rear bumper curve
  bodyShape.quadraticCurveTo(-4.35, 0.35, -4.35, 0.52);
  bodyShape.lineTo(-4.35, 0.62);
  // Rear top edge
  bodyShape.quadraticCurveTo(-4.3, 0.72, -4.1, 0.72);
  // Rear deck (flat top going forward)
  bodyShape.lineTo(-1.8, 0.74);
  // Roof peak
  bodyShape.quadraticCurveTo(-1.2, 0.76, -0.6, 1.56);
  // Windshield top
  bodyShape.quadraticCurveTo(-0.15, 1.78, 0.3, 1.82);
  // Roof line
  bodyShape.lineTo(1.4, 1.82);
  // Rear glass slope
  bodyShape.quadraticCurveTo(2.0, 1.78, 2.6, 1.45);
  // C-pillar down to rear deck
  bodyShape.quadraticCurveTo(3.0, 1.2, 3.4, 0.86);
  // Rear deck
  bodyShape.lineTo(4.35, 0.8);
  // Rear end
  bodyShape.quadraticCurveTo(4.55, 0.78, 4.6, 0.65);
  bodyShape.lineTo(4.6, 0.22);
  bodyShape.quadraticCurveTo(4.55, 0.1, 4.35, 0.05);
  // Front lower edge
  bodyShape.lineTo(3.8, 0);
  // Close at bottom
  bodyShape.lineTo(-3.8, 0);

  // Extrude the side profile across the width
  const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, {
    depth: bodyWidth,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.04,
    bevelSegments: 3,
    curveSegments: 24,
  });
  // Center the body (extrude goes along Z, we need it centered)
  bodyGeo.translate(0, 0, -hw);
  const bodyMesh = addMesh(bodyGeo, paintMat, [0, 0, 0]);
  bodyMesh.name = 'body';

  // ─── FRONT HOOD (bonnet) ───
  // A slightly raised, curved surface over the front
  const hoodShape = new THREE.Shape();
  hoodShape.moveTo(-0.6, 0);
  hoodShape.quadraticCurveTo(-0.3, 0.06, 0, 0.08);
  hoodShape.lineTo(3.6, 0.08);
  hoodShape.quadraticCurveTo(3.9, 0.06, 4.0, 0);
  hoodShape.lineTo(-0.6, 0);
  
  const hoodGeo = new THREE.ExtrudeGeometry(hoodShape, {
    depth: bodyWidth - 0.16,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 2,
    curveSegments: 16,
  });
  hoodGeo.translate(0, 0, -(hw - 0.08));
  addMesh(hoodGeo, paintMat, [0, 0.75, 0]);

  // ─── HOOD CREASE LINES (panel definition) ───
  // Centre crease
  addMesh(
    new THREE.BoxGeometry(3.8, 0.005, 0.012),
    carbonMat,
    [1.5, 0.84, 0]
  );
  // Side creases
  addMesh(
    new THREE.BoxGeometry(3.4, 0.005, 0.012),
    carbonMat,
    [1.4, 0.83, 0.45]
  );
  addMesh(
    new THREE.BoxGeometry(3.4, 0.005, 0.012),
    carbonMat,
    [1.4, 0.83, -0.45]
  );

  // ─── FRONT BUMPER / FASCIA ───
  const bumperShape = new THREE.Shape();
  bumperShape.moveTo(0, 0);
  bumperShape.lineTo(0, 0.35);
  bumperShape.quadraticCurveTo(0.08, 0.42, 0.2, 0.42);
  bumperShape.lineTo(0.2, 0);
  bumperShape.lineTo(0, 0);

  const bumperGeo = new THREE.ExtrudeGeometry(bumperShape, {
    depth: bodyWidth + 0.04,
    bevelEnabled: false,
    curveSegments: 8,
  });
  bumperGeo.translate(0, 0, -(hw + 0.02));
  addMesh(bumperGeo, paintDarkMat, [-4.35, 0, 0]);

  // ─── FRONT GRILLE / INTAKE (large lower opening) ───
  addMesh(
    new THREE.BoxGeometry(0.06, 0.18, 1.3),
    carbonMat,
    [-4.38, 0.28, 0]
  );
  // Grille slats
  for (let i = -5; i <= 5; i++) {
    addMesh(
      new THREE.BoxGeometry(0.06, 0.012, 0.06),
      chromeMat,
      [-4.42, 0.22, i * 0.1]
    );
  }

  // ─── SIDE INTAKES (front fender vents) ───
  for (const side of [-1, 1]) {
    addMesh(
      new THREE.BoxGeometry(0.6, 0.08, 0.04),
      carbonMat,
      [-2.8, 0.52, side * (hw + 0.02)]
    );
    addMesh(
      new THREE.BoxGeometry(0.45, 0.04, 0.04),
      chromeMat,
      [-2.75, 0.48, side * (hw + 0.02)]
    );
  }

  // ─── HEADLIGHT ASSEMBLIES ───
  for (const side of [-1, 1]) {
    const hlGroup = new THREE.Group();
    hlGroup.position.set(-4.1, 0.58, side * 0.65);

    // Housing (swept back shape)
    const housingGeo = new THREE.BoxGeometry(0.45, 0.14, 0.3);
    const housing = new THREE.Mesh(housingGeo, headlightHousingMat);
    housing.rotation.y = side * 0.15;
    housing.castShadow = true;
    hlGroup.add(housing);

    // DRL strip (curved LED line)
    const drlGeo = new THREE.BoxGeometry(0.38, 0.025, 0.02);
    const drl = new THREE.Mesh(drlGeo, headlightMat);
    drl.position.set(0, 0.04, side * 0.12);
    drl.rotation.y = side * 0.12;
    hlGroup.add(drl);

    // Lower DRL accent
    const drl2Geo = new THREE.BoxGeometry(0.3, 0.02, 0.015);
    const drl2 = new THREE.Mesh(drl2Geo, headlightMat);
    drl2.position.set(0.04, -0.03, side * 0.1);
    drl2.rotation.y = side * 0.1;
    hlGroup.add(drl2);

    // Projector lens (sphere)
    const lensGeo = new THREE.SphereGeometry(0.04, 16, 16);
    const lens = new THREE.Mesh(lensGeo, glassMat);
    lens.position.set(-0.06, 0, side * 0.05);
    hlGroup.add(lens);

    car.add(hlGroup);
  }

  // ─── WINDSHIELD ───
  const windshieldShape = new THREE.Shape();
  windshieldShape.moveTo(-hw + 0.12, 0);
  windshieldShape.lineTo(-hw + 0.12, 0.78);
  windshieldShape.quadraticCurveTo(-hw + 0.15, 0.84, -hw + 0.3, 0.86);
  windshieldShape.lineTo(hw - 0.3, 0.86);
  windshieldShape.quadraticCurveTo(hw - 0.15, 0.84, hw - 0.12, 0.78);
  windshieldShape.lineTo(hw - 0.12, 0);
  windshieldShape.lineTo(-hw + 0.12, 0);

  const wsGeo = new THREE.ExtrudeGeometry(windshieldShape, {
    depth: 0.025,
    bevelEnabled: false,
    curveSegments: 12,
  });
  const wsMesh = addMesh(wsGeo, glassMat, [-0.6, 0.97, 0]);
  wsMesh.rotation.set(-0.52, 0, 0);
  wsMesh.rotation.order = 'XYZ';

  // ─── SIDE WINDOWS ───
  for (const side of [-1, 1]) {
    const winShape = new THREE.Shape();
    winShape.moveTo(0, 0);
    winShape.lineTo(0, 0.5);
    winShape.quadraticCurveTo(0.8, 0.55, 1.6, 0.35);
    winShape.quadraticCurveTo(2.0, 0.2, 2.2, 0);
    winShape.lineTo(0, 0);

    const winGeo = new THREE.ExtrudeGeometry(winShape, {
      depth: 0.02,
      bevelEnabled: false,
      curveSegments: 12,
    });
    const winMesh = addMesh(winGeo, glassMat, [-0.4, 1.33, side * (hw - 0.01)]);
    if (side === -1) {
      winMesh.rotation.y = Math.PI;
      winMesh.position.z = -side * (hw - 0.01);
    }
  }

  // ─── REAR WINDOW ───
  const rearWinShape = new THREE.Shape();
  rearWinShape.moveTo(-hw + 0.2, 0);
  rearWinShape.lineTo(-hw + 0.2, 0.32);
  rearWinShape.quadraticCurveTo(-hw + 0.25, 0.38, -hw + 0.35, 0.4);
  rearWinShape.lineTo(hw - 0.35, 0.4);
  rearWinShape.quadraticCurveTo(hw - 0.25, 0.38, hw - 0.2, 0.32);
  rearWinShape.lineTo(hw - 0.2, 0);
  rearWinShape.lineTo(-hw + 0.2, 0);

  const rwGeo = new THREE.ExtrudeGeometry(rearWinShape, {
    depth: 0.02,
    bevelEnabled: false,
    curveSegments: 8,
  });
  const rwMesh = addMesh(rwGeo, glassMat, [2.6, 1.07, 0]);
  rwMesh.rotation.set(0.45, 0, 0);

  // ─── A-PILLAR (windshield frame) ───
  for (const side of [-1, 1]) {
    const pillarGeo = new THREE.BoxGeometry(1.2, 0.05, 0.05);
    const pillar = addMesh(pillarGeo, carbonMat, [-0.25, 1.42, side * (hw - 0.08)]);
    pillar.rotation.z = -0.48;
    pillar.rotation.y = side * 0.08;
  }

  // ─── ROOF ───
  const roofGeo = new THREE.BoxGeometry(2.1, 0.05, bodyWidth - 0.1);
  addMesh(roofGeo, paintMat, [0.9, 1.84, 0]);

  // ─── SIDE MIRRORS ───
  for (const side of [-1, 1]) {
    const mirrorGroup = new THREE.Group();
    mirrorGroup.position.set(-0.55, 1.35, side * (hw + 0.15));

    // Stalk
    const stalkGeo = new THREE.BoxGeometry(0.06, 0.06, 0.12);
    const stalk = new THREE.Mesh(stalkGeo, carbonMat);
    stalk.castShadow = true;
    mirrorGroup.add(stalk);

    // Mirror housing
    const housingGeo = new THREE.BoxGeometry(0.18, 0.1, 0.08);
    const mirrorHousing = new THREE.Mesh(housingGeo, paintMat);
    mirrorHousing.position.set(-0.04, 0, side * 0.08);
    mirrorHousing.castShadow = true;
    mirrorGroup.add(mirrorHousing);

    // Mirror glass
    const mirrorGlassGeo = new THREE.PlaneGeometry(0.14, 0.08);
    const mirrorGlass = new THREE.Mesh(mirrorGlassGeo, chromeMat);
    mirrorGlass.position.set(-0.02, 0, side * 0.12);
    mirrorGlass.rotation.y = side * Math.PI / 2;
    mirrorGroup.add(mirrorGlass);

    car.add(mirrorGroup);
  }

  // ─── SIDE SKIRTS ───
  for (const side of [-1, 1]) {
    addMesh(
      new THREE.BoxGeometry(5.4, 0.1, 0.06),
      carbonMat,
      [0, 0.08, side * (hw + 0.02)]
    );
  }

  // ─── DOOR PANEL LINES ───
  for (const side of [-1, 1]) {
    // Door seam (vertical)
    addMesh(
      new THREE.BoxGeometry(0.005, 0.65, 0.012),
      carbonMat,
      [0.5, 0.7, side * (hw + 0.04)]
    );
    // Door handle
    addMesh(
      new THREE.BoxGeometry(0.18, 0.03, 0.02),
      chromeMat,
      [0.9, 1.05, side * (hw + 0.04)]
    );
  }

  // ─── REAR BODYWORK ───
  // Rear spoiler/lip
  addMesh(
    new THREE.BoxGeometry(0.12, 0.04, bodyWidth + 0.1),
    carbonMat,
    [4.45, 0.84, 0]
  );

  // Rear diffuser
  const diffuserGeo = new THREE.BoxGeometry(0.2, 0.12, bodyWidth - 0.2);
  addMesh(diffuserGeo, carbonMat, [4.5, 0.12, 0]);
  // Diffuser fins
  for (let i = -3; i <= 3; i++) {
    addMesh(
      new THREE.BoxGeometry(0.18, 0.1, 0.012),
      carbonMat,
      [4.5, 0.12, i * 0.14]
    );
  }

  // ─── TAIL LIGHTS ───
  for (const side of [-1, 1]) {
    const tlGroup = new THREE.Group();
    tlGroup.position.set(4.4, 0.62, side * 0.55);

    // Light bar
    const barGeo = new THREE.BoxGeometry(0.08, 0.08, 0.35);
    const bar = new THREE.Mesh(barGeo, tailMat);
    bar.castShadow = true;
    tlGroup.add(bar);

    car.add(tlGroup);
  }

  // Connecting tail light bar (full width strip)
  addMesh(
    new THREE.BoxGeometry(0.04, 0.03, bodyWidth - 0.3),
    tailMat,
    [4.55, 0.62, 0]
  );

  // ─── EXHAUST TIPS ───
  for (const side of [-1, 1]) {
    const exhaustGeo = new THREE.CylinderGeometry(0.05, 0.06, 0.12, 16);
    const exhaust = addMesh(exhaustGeo, chromeMat, [4.58, 0.18, side * 0.35]);
    exhaust.rotation.z = Math.PI / 2;
  }

  // ─── WHEEL ARCHES ───
  // Create visible wheel arch cutouts using torus segments
  const archPositions = [
    [-2.6, 0.42],   // front-left X, Y
    [3.0, 0.42],    // rear-left X, Y
  ];

  for (const [ax, ay] of archPositions) {
    for (const side of [-1, 1]) {
      const archGeo = new THREE.TorusGeometry(0.52, 0.06, 8, 24, Math.PI);
      const arch = addMesh(archGeo, paintDarkMat, [ax, ay, side * (hw - 0.01)]);
      arch.rotation.y = side * Math.PI / 2;
      arch.rotation.x = 0;
    }
  }

  // ─── WHEELS ───
  const wheelPositions = [
    { x: -2.6, z: -hw - 0.08, label: 'fl' },
    { x: -2.6, z: hw + 0.08, label: 'fr' },
    { x: 3.0, z: -hw - 0.08, label: 'rl' },
    { x: 3.0, z: hw + 0.08, label: 'rr' },
  ];

  const wheelRadius = 0.44;
  const tireWidth = 0.28;

  for (const wp of wheelPositions) {
    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(wp.x, wheelRadius, wp.z);
    wheelGroup.name = `wheel_${wp.label}`;

    // Tyre — torus for realistic shape
    const tyreGeo = new THREE.TorusGeometry(wheelRadius, tireWidth / 2, 16, 48);
    const tyre = new THREE.Mesh(tyreGeo, tireMat);
    tyre.castShadow = true;
    wheelGroup.add(tyre);

    // Wheel rim — disc
    const rimOuterGeo = new THREE.CylinderGeometry(wheelRadius - 0.06, wheelRadius - 0.06, tireWidth - 0.04, 48);
    const rimOuter = new THREE.Mesh(rimOuterGeo, chromeMat);
    rimOuter.rotation.x = Math.PI / 2;
    rimOuter.castShadow = true;
    wheelGroup.add(rimOuter);

    // Rim centre hub
    const hubGeo = new THREE.CylinderGeometry(0.08, 0.08, tireWidth - 0.02, 24);
    const hub = new THREE.Mesh(hubGeo, chromeMat);
    hub.rotation.x = Math.PI / 2;
    wheelGroup.add(hub);

    // Multi-spoke alloy (10 spokes, Y-pattern)
    const spokeCount = 10;
    for (let s = 0; s < spokeCount; s++) {
      const angle = (s / spokeCount) * Math.PI * 2;
      const spokeLen = wheelRadius - 0.14;
      
      const spokeGeo = new THREE.BoxGeometry(0.03, tireWidth - 0.08, spokeLen);
      const spoke = new THREE.Mesh(spokeGeo, chromeMat);
      spoke.position.set(
        Math.cos(angle) * spokeLen / 2,
        Math.sin(angle) * spokeLen / 2,
        0
      );
      spoke.rotation.z = angle;
      spoke.castShadow = true;
      wheelGroup.add(spoke);
    }

    // Brake disc (visible between spokes)
    const discGeo = new THREE.CylinderGeometry(0.28, 0.28, tireWidth - 0.12, 32);
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.rotation.x = Math.PI / 2;
    wheelGroup.add(disc);

    // Disc ventilation slots
    for (let v = 0; v < 12; v++) {
      const vAngle = (v / 12) * Math.PI * 2;
      const slotGeo = new THREE.BoxGeometry(0.015, tireWidth - 0.14, 0.12);
      const slot = new THREE.Mesh(slotGeo, new THREE.MeshStandardMaterial({
        color: 0x556677, metalness: 0.7, roughness: 0.4
      }));
      slot.position.set(
        Math.cos(vAngle) * 0.18,
        Math.sin(vAngle) * 0.18,
        0
      );
      slot.rotation.z = vAngle;
      wheelGroup.add(slot);
    }

    // Brake caliper
    const caliperGeo = new THREE.BoxGeometry(0.1, 0.12, 0.08);
    const caliper = new THREE.Mesh(caliperGeo, caliperMat);
    // Position caliper at the top of the disc, visible through spokes
    caliper.position.set(0, 0.22, tireWidth * 0.15);
    caliper.castShadow = true;
    wheelGroup.add(caliper);

    car.add(wheelGroup);
  }

  // ─── FRONT SPLITTER ───
  addMesh(
    new THREE.BoxGeometry(0.4, 0.04, bodyWidth + 0.12),
    carbonMat,
    [-4.4, 0.04, 0]
  );

  // ─── ANTENNA / SHARK FIN ───
  const finShape = new THREE.Shape();
  finShape.moveTo(0, 0);
  finShape.lineTo(-0.06, 0.14);
  finShape.quadraticCurveTo(-0.03, 0.18, 0, 0.16);
  finShape.quadraticCurveTo(0.08, 0.12, 0.12, 0);
  finShape.lineTo(0, 0);

  const finGeo = new THREE.ExtrudeGeometry(finShape, {
    depth: 0.04,
    bevelEnabled: false,
    curveSegments: 8,
  });
  addMesh(finGeo, paintMat, [1.8, 1.83, -0.02]);

  // ─── FRONT FENDER SCULPTING ───
  // Muscular fender bulges using scaled spheres
  for (const side of [-1, 1]) {
    const fenderGeo = new THREE.SphereGeometry(0.55, 24, 16, 0, Math.PI);
    const fender = addMesh(fenderGeo, paintMat, [-2.6, 0.55, side * (hw - 0.15)]);
    fender.scale.set(1.6, 0.5, 0.6);
    fender.rotation.y = side * Math.PI / 2;
  }

  // Rear fender bulges (wider — mid-engine GT proportion)
  for (const side of [-1, 1]) {
    const rFenderGeo = new THREE.SphereGeometry(0.6, 24, 16, 0, Math.PI);
    const rFender = addMesh(rFenderGeo, paintMat, [3.0, 0.55, side * (hw - 0.12)]);
    rFender.scale.set(1.8, 0.55, 0.7);
    rFender.rotation.y = side * Math.PI / 2;
  }

  // ─── INTERIOR (visible through glass) ───
  // Dashboard
  addMesh(
    new THREE.BoxGeometry(1.4, 0.2, bodyWidth - 0.4),
    interiorMat,
    [-0.1, 1.0, 0]
  );
  // Seats (basic shapes visible through side windows)
  for (const side of [-1, 1]) {
    addMesh(
      new THREE.BoxGeometry(0.5, 0.6, 0.3),
      interiorMat,
      [0.7, 1.15, side * 0.32]
    );
  }

  // ═══ POSITION ENTIRE CAR ═══
  // Set so tyres rest on Y=0 ground plane
  // The wheel centres are at wheelRadius (0.44) from the ground
  // We need to lower the body so it sits properly
  car.position.y = 0;

  return car;
}

/**
 * Creates the studio lighting setup for automotive CGI
 */
export function createStudioLighting(THREE, scene) {
  // Hemisphere light for ambient fill (sky / ground)
  const hemi = new THREE.HemisphereLight(0xb0d8f0, 0x0a1520, 1.8);
  scene.add(hemi);

  // Key light — soft, warm-white, from front-left-top
  const key = new THREE.DirectionalLight(0xf0f5ff, 4.0);
  key.position.set(-6, 8, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -8;
  key.shadow.camera.right = 8;
  key.shadow.camera.top = 5;
  key.shadow.camera.bottom = -5;
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 25;
  key.shadow.bias = -0.0005;
  scene.add(key);

  // Fill light — cooler, softer, from front-right
  const fill = new THREE.DirectionalLight(0x8ab5d8, 2.8);
  fill.position.set(6, 4, -4);
  scene.add(fill);

  // Rim light — cyan tinted, from behind to separate roofline
  const rimLight = new THREE.PointLight(0x35d7ff, 18, 12);
  rimLight.position.set(5, 3, -5);
  scene.add(rimLight);

  // Front accent — reveals grille and bumper detail
  const frontAccent = new THREE.PointLight(0xd0e8ff, 8, 8);
  frontAccent.position.set(-6, 1.5, 0);
  scene.add(frontAccent);

  // Under-car subtle light for ground shadow definition
  const underLight = new THREE.PointLight(0x0a2030, 3, 5);
  underLight.position.set(0, -0.5, 0);
  scene.add(underLight);

  // Top fill to reveal hood surface
  const topFill = new THREE.DirectionalLight(0xe0ecf8, 1.5);
  topFill.position.set(0, 10, 0);
  scene.add(topFill);

  return { key, fill, rimLight, frontAccent };
}

/**
 * Creates a realistic ground plane with contact shadow
 */
export function createGroundPlane(THREE, scene) {
  const floorGeo = new THREE.PlaneGeometry(30, 20);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x080e16,
    roughness: 0.7,
    metalness: 0.15,
    transparent: true,
    opacity: 0.6,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.02;
  floor.receiveShadow = true;
  scene.add(floor);

  // Soft reflection plane
  const reflectGeo = new THREE.PlaneGeometry(14, 8);
  const reflectMat = new THREE.MeshPhysicalMaterial({
    color: 0x0a1520,
    roughness: 0.85,
    metalness: 0.1,
    transparent: true,
    opacity: 0.3,
  });
  const reflect = new THREE.Mesh(reflectGeo, reflectMat);
  reflect.rotation.x = -Math.PI / 2;
  reflect.position.y = -0.01;
  reflect.receiveShadow = true;
  scene.add(reflect);

  return floor;
}

