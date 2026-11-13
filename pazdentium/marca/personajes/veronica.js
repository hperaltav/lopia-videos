// Personaje fijo PazDentium: Dra. Verónica (estilo toon). Pelo con rulos y balayage dorado; versión clínica con gorro estampado y careta redondeada con banda verde.
// Requiere makePerson, toon, extrude, lerp del motor de escenas. Uso: const v = makeVeronica(false /* casual */ | true /* clínica */);
// ---------------- personaje: Dra. Verónica
function makeVeronica(clinical) {
  const p = makePerson({skin: '#f2c4a0', hair: '#6e4527', shirt: '#2b3a63', long: false, hairLen: 1.25, cap: false});
  const u = p.userData, head = u.head;
  const hairA = toon('#ffffff', {side: THREE.DoubleSide, vertexColors: true}), hairB = hairA;
  const ROOT = new THREE.Color('#6e4527'), MID = new THREE.Color('#a8733a'), TIP = new THREE.Color('#d6a352'), HL = new THREE.Color('#e8bc66');
  const balayage = (v, streak) => { const c = v < 0.35 ? ROOT.clone().lerp(MID, v/0.35) : MID.clone().lerp(TIP, Math.min(1, (v - 0.35)/0.5));
    return c.lerp(HL, Math.max(0, streak)*Math.min(1, v*1.6)*0.55); };
  // melena larga, lisa con ondas suaves: un manto que cae por atrás y los lados + mechones al frente
  { const NA = 64, NY = 48, pos = [], idx = [], col = [];
    for (let i = 0; i <= NA; i++) { const th = -2.35 + 4.7*i/NA;           // 0 = atrás; ±2.35 = a los lados de la cara
      for (let j = 0; j <= NY; j++) { const v = j/NY, y = 0.45 - 2.55*v;
        const r = 0.98 + 0.34*Math.pow(v, 1.3) + 0.24*Math.sin(v*17 + th*1.6)*Math.min(1, v*2.2) + 0.06*Math.sin(th*11 + v*6);
        pos.push(Math.sin(th)*r, y, -Math.cos(th)*r*0.92 - 0.05); const c = balayage(v, Math.sin(th*9)*1.4 - 0.4); col.push(c.r, c.g, c.b); } }
    for (let i = 0; i < NA; i++) for (let j = 0; j < NY; j++) { const a0 = i*(NY+1) + j, a1 = a0 + NY + 1; idx.push(a0, a1, a0 + 1, a1, a1 + 1, a0 + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); head.add(new THREE.Mesh(g, hairA)); }
  function strand(pts, w0, w1, mat, light = 0) {        // mechón plano y ondulado que se afina hacia la punta
    const c = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))), N = 80, R = 14, pos = [], idx = [], col = [];
    for (let i = 0; i <= N; i++) { const t = i/N, p = c.getPointAt(t), tg = c.getTangentAt(t), side = new THREE.Vector3().crossVectors(tg, new THREE.Vector3(0, 0, 1)).normalize();
      const w = lerp(w0, w1, t)*(t > 0.85 ? 1 - (t - 0.85)/0.15*0.7 : 1);
      for (let j = 0; j <= R; j++) { const a = j/R*Math.PI*2; const q = p.clone().addScaledVector(side, Math.cos(a)*w).add(new THREE.Vector3(0, 0, Math.sin(a)*w*0.35)); pos.push(q.x, q.y, q.z); const cc = balayage(t, light); col.push(cc.r, cc.g, cc.b); } }
    for (let i = 0; i < N; i++) for (let j = 0; j < R; j++) { const a0 = i*(R+1) + j, a1 = a0 + R + 1; idx.push(a0, a1, a0 + 1, a1, a1 + 1, a0 + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); return new THREE.Mesh(g, mat); }
  for (const s of [-1, 1]) {
    head.add(strand([[s*0.12, 0.86, 0.62], [s*0.75, 0.6, 0.66], [s*0.95, 0.05, 0.38], [s*1.18, -0.28, 0.45], [s*0.9, -0.58, 0.5], [s*1.2, -0.88, 0.5], [s*0.9, -1.18, 0.5], [s*1.22, -1.48, 0.48], [s*0.92, -1.78, 0.46], [s*1.18, -2.05, 0.44], [s*1.0, -2.3, 0.42]], 0.24, 0.2, hairA, 0.2));
    head.add(strand([[s*0.2, 0.9, 0.5], [s*0.88, 0.48, 0.48], [s*1.12, -0.1, 0.15], [s*1.4, -0.4, 0.2], [s*1.1, -0.7, 0.22], [s*1.42, -1.0, 0.22], [s*1.12, -1.3, 0.22], [s*1.44, -1.6, 0.2], [s*1.14, -1.9, 0.16], [s*1.36, -2.2, 0.12]], 0.18, 0.15, hairB, 0.9));
  }
  // raya al medio + mechones que caen sobre la frente a los lados
  // pestañas y labios
  u.eyes.forEach(e => { const lash = new THREE.Mesh(new THREE.CapsuleGeometry(0.02, 0.14, 4, 8), toon('#2a1d1a')); lash.rotation.z = Math.PI/2; lash.position.set(e.position.x, e.position.y + 0.13, e.position.z + 0.03); head.add(lash); });
  // uniforme: ambo azul marino con cuello en V y polera negra de manga larga debajo
  const vneck = new THREE.Mesh(extrude([[-0.3, 0.0], [0.3, 0.0], [0, -0.55]], 0.02), toon('#1e1e26')); vneck.position.set(0, -0.76, 0.62); vneck.rotation.x = -0.32; p.add(vneck);
  p.traverse(o => { if (o.isMesh && o.geometry.type === 'TorusGeometry') o.visible = false; });   // sin cuello blanco
  for (const side of ['R', 'L']) { u.arms[side].fo.material = toon('#1e1e26'); }
  if (clinical) {   // gorro clínico estampado + lentes de protección
    // gorro clínico estampado (tamaño original, sin elástico: la banda verde es de la careta)
    const capM = toon('#e9e4ef'); const cap = new THREE.Mesh(new THREE.SphereGeometry(1.2, 40, 20, 0, Math.PI*2, 0, 1.2), capM); cap.rotation.x = -0.3; cap.position.y = 0.12; head.add(cap);
    for (let i = 0; i < 40; i++) { const a = 2*Math.PI*((i*0.5698403) % 1), b = 0.15 + 1.0*((i*0.7548776 + 0.3) % 1); const dot = new THREE.Mesh(new THREE.CircleGeometry(0.07, 12), toon(['#e58aa0', '#7a9cc6', '#9a7ab8'][i % 3]));
      const v = new THREE.Vector3(Math.sin(b)*Math.sin(a), Math.cos(b), Math.sin(b)*Math.cos(a)).multiplyScalar(1.215).applyAxisAngle(new THREE.Vector3(1, 0, 0), -0.3);
      dot.position.copy(v).add(new THREE.Vector3(0, 0.12, 0)); dot.lookAt(v.clone().multiplyScalar(3).add(new THREE.Vector3(0, 0.12, 0))); head.add(dot); }
    // careta facial completa: visor curvo transparente desde la frente hasta bajo el mentón
    const R0 = 1.12, T0 = 0.85, T1 = 2.3, PH = 2.1;     // careta: casquete esférico más chico y redondeado
    const shield = new THREE.Mesh(new THREE.SphereGeometry(R0, 48, 24, Math.PI/2 - PH/2, PH, T0, T1 - T0),
      new THREE.MeshBasicMaterial({color: '#d6f0ff', transparent: true, opacity: 0.26, side: THREE.DoubleSide, depthWrite: false}));
    shield.material.userData.noOutline = true; shield.position.set(0, -0.05, 0.12); shield.scale.set(1, 1, 1.08); head.add(shield);
    const sg = new THREE.TorusGeometry(R0*Math.sin(T0) + 0.03, 0.06, 8, 40, PH + 0.5); sg.rotateZ(Math.PI/2 - (PH + 0.5)/2);
    const strap = new THREE.Mesh(sg, toon('#2fae5a')); strap.rotation.x = Math.PI/2; strap.position.set(0, -0.05 + R0*Math.cos(T0), 0.12); strap.scale.set(1, 1.08, 1); head.add(strap);   // banda verde de la careta
    const edgeM = new THREE.MeshBasicMaterial({color: '#e3f4fc', transparent: true, opacity: 0.8}); edgeM.userData.noOutline = true;
    const edge = new THREE.Mesh(new THREE.TorusGeometry(R0*Math.sin(T1), 0.014, 6, 40, PH), edgeM);
    edge.geometry.rotateZ(Math.PI/2 - PH/2); edge.rotation.x = Math.PI/2; edge.position.set(0, -0.05 + R0*Math.cos(T1), 0.12); edge.scale.set(1, 1.08, 1); head.add(edge);
  }
  return p;
}
