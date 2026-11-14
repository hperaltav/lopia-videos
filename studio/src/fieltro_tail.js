// ===================================================== reproductor de planes · estilo Fieltro
const mat = {}; const F = (c, o) => mat[c] || (mat[c] = felt(c, o));
// ---------- boca: arcada superior e inferior de almohadita
const TX = [-1.65, -1.12, -0.58, 0, 0.58, 1.12, 1.65], TWD = [0.42, 0.44, 0.48, 0.56, 0.48, 0.44, 0.42];
function arch(lower) {
  const g = new THREE.Group();
  g.add(M(puffy([[-2.2, 0.2], [2.2, 0.2], [2.2, 1.15], [-2.2, 1.15]], 0.45, 0.2), F('#ee8f9f')));
  TX.forEach((x, i) => { const w = TWD[i]/2, hgt = i === 3 ? 0.95 : 0.8 + (i % 2)*0.05;
    const pts = [[-w, 0.25], [w, 0.25], [w*1.02, -hgt*0.45], [w*0.8, -hgt*0.85], [0, -hgt], [-w*0.8, -hgt*0.85], [-w*1.02, -hgt*0.45]];
    const sm = new THREE.SplineCurve(pts.concat([pts[0]]).map(([a, b]) => new THREE.Vector2(a, b))).getPoints(40).map(v => [v.x, v.y]);
    const t = M(puffy(sm, 0.34, 0.17), F('#fbf7ee')); t.position.set(x, 0.22, 0.12); g.add(t);
    const st = stitches(new THREE.CatmullRomCurve3(sm.slice(0, -1).map(([a, b]) => new THREE.Vector3(a*0.84, b*0.84 + 0.02, 0.4)), true), 22, '#c9b8a0', 0.008); st.position.copy(t.position); g.add(st); });
  g.add(stitches(new THREE.CatmullRomCurve3([[-2.05, 1.05], [2.05, 1.05]].map(([x, y]) => new THREE.Vector3(x, y, 0.45))), 34, '#fff3f5', 0.011));
  if (lower) g.scale.set(0.94, -1, 1); return g;
}
const mouth = new THREE.Group(); scene.add(mouth);
const upper = arch(false), lowerA = arch(true); mouth.add(upper, lowerA); upper.position.y = 0.95; lowerA.position.y = -0.95;
const UT = y => 0.95 + 0.22 + y;     // y local de la arcada superior → y en la boca
// placa (bolitas amarillas), sarro (franja ocre), restos (bolitas de colores), bacterias (pompones con ojos)
const plaque = [], tartar = [], crumbs = [], bugs = [];
TX.forEach((x, i) => { for (let j = 0; j < 2; j++) { const p = M(new THREE.SphereGeometry(0.075, 16, 12), F('#f1d36a'), 0); p.scale.z = 0.5; p.position.set(x + (j - 0.5)*0.16, UT(0.05 - j*0.06), 0.62); mouth.add(p); plaque.push(p); }
  const tr = M(new THREE.CapsuleGeometry(0.07, TWD[i]*0.55, 4, 12), F('#b58a3c'), 0); tr.rotation.z = Math.PI/2; tr.scale.z = 0.6; tr.position.set(x, UT(0.08), 0.6); mouth.add(tr); tartar.push(tr); });
['#e8476b', '#5cb85c', '#d9a35a', '#f39c4a', '#5cb85c'].forEach((c, i) => { const m = M(new THREE.IcosahedronGeometry(0.09, 1), F(c), 0); m.position.set((TX[i] + TX[i + 1])/2, UT(-0.55 - (i % 2)*0.12), 0.65); mouth.add(m); crumbs.push(m); });
['#7cc576', '#9b7ad6', '#f39c4a'].forEach((c, i) => { const g = new THREE.Group(); g.add(M(new THREE.SphereGeometry(0.26, 24, 18), F(c), 0.05));
  [-1, 1].forEach(dd => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 10), new THREE.MeshStandardMaterial({color: '#1d1b19', roughness: 0.3})); e.position.set(dd*0.09, 0.05, 0.24); g.add(e); });
  scene.add(g); bugs.push(g); });
// cepillo
const brush = new THREE.Group(); scene.add(brush);
{ const handle = M(new THREE.CapsuleGeometry(0.14, 2.4, 8, 24), F('#3fb7c8')); handle.rotation.z = Math.PI/2; handle.position.x = 1.4; brush.add(handle);
  const head = M(new THREE.CapsuleGeometry(0.16, 0.55, 8, 24), F('#3fb7c8')); head.rotation.z = Math.PI/2; brush.add(head);
  for (let i = 0; i < 9; i++) for (let j = 0; j < 2; j++) { const b = M(new THREE.CapsuleGeometry(0.045, 0.32, 4, 10), F('#ffffff'), 0.01); b.position.set(-0.36 + i*0.09, 0.3, -0.05 + j*0.1); brush.add(b); }
  brush.add(stitches(new THREE.CatmullRomCurve3([[0.3, 0.13], [2.6, 0.13]].map(([x, y]) => new THREE.Vector3(x, y, 0.05))), 22, '#e8f7fa', 0.009)); }
// instrumento de limpieza
const scaler = new THREE.Group(); scene.add(scaler);
{ const h = M(new THREE.CapsuleGeometry(0.1, 2.2, 8, 16), F('#b9c2cc')); h.position.y = 1.2; scaler.add(h);
  const hook = M(new THREE.TorusGeometry(0.16, 0.05, 10, 24, Math.PI*1.2), F('#8d97a3'), 0); hook.rotation.z = Math.PI*0.9; scaler.add(hook); }
// estrellitas
const starPts = Array.from({length: 10}, (_, k) => { const a = k*Math.PI/5 + Math.PI/2, r = k % 2 ? 0.1 : 0.24; return [Math.cos(a)*r, Math.sin(a)*r]; });
const stars = [0, 1, 2, 3].map(i => { const s = M(puffy(starPts, 0.05, 0.05), F(['#f4d03f', '#ffffff', '#f4d03f', '#ffffff'][i])); scene.add(s); return s; });
// diente grande (brillo / caries)
const bigTooth = new THREE.Group(); scene.add(bigTooth);
{ const sh = [[-0.9, 0.9], [-0.45, 1.15], [0, 1.0], [0.45, 1.15], [0.9, 0.9], [0.95, 0.1], [0.7, -0.6], [0.55, -1.4], [0.25, -1.45], [0.12, -0.6], [-0.12, -0.6], [-0.25, -1.45], [-0.55, -1.4], [-0.7, -0.6], [-0.95, 0.1]];
  const sm = new THREE.SplineCurve(sh.concat([sh[0]]).map(([a, b]) => new THREE.Vector2(a, b))).getPoints(80).map(v => [v.x, v.y]);
  bigTooth.add(M(puffy(sm, 0.4, 0.25), F('#fbf7ee')));
  bigTooth.add(stitches(new THREE.CatmullRomCurve3(sm.slice(0, -1).map(([a, b]) => new THREE.Vector3(a*0.88, b*0.88, 0.47)), true), 60, '#c9b8a0', 0.012));
  const eyeM = new THREE.MeshStandardMaterial({color: '#1d1b19', roughness: 0.25});
  [-1, 1].forEach(d => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 12), eyeM); e.position.set(d*0.3, 0.35, 0.47); e.scale.z = 0.5; bigTooth.add(e); });
  bigTooth.userData.smile = stitches(new THREE.CatmullRomCurve3([[-0.25, 0.05], [0, -0.1], [0.25, 0.05]].map(([x, y]) => new THREE.Vector3(x, y, 0.5))), 7, '#9b2d3a', 0.016);
  bigTooth.userData.sad = stitches(new THREE.CatmullRomCurve3([[-0.25, -0.12], [0, 0.02], [0.25, -0.12]].map(([x, y]) => new THREE.Vector3(x, y, 0.5))), 7, '#9b2d3a', 0.016);
  bigTooth.add(bigTooth.userData.smile, bigTooth.userData.sad);
  const hole = M(new THREE.CylinderGeometry(0.28, 0.28, 0.04, 28), F('#4a2c1a'), 0.02); hole.rotation.x = Math.PI/2; hole.position.set(-0.38, 0.72, 0.42); bigTooth.add(hole); bigTooth.userData.hole = hole; }
// reloj
const clock = new THREE.Group(); scene.add(clock);
{ const rim = M(new THREE.CylinderGeometry(1.05, 1.05, 0.25, 48), F('#e8476b')); rim.rotation.x = Math.PI/2; clock.add(rim);
  const face = M(new THREE.CylinderGeometry(0.88, 0.88, 0.1, 48), F('#fbf8f0'), 0.01); face.rotation.x = Math.PI/2; face.position.z = 0.13; clock.add(face);
  [-1, 1].forEach(d => { const b = M(new THREE.SphereGeometry(0.32, 24, 16, 0, Math.PI*2, 0, Math.PI/2), F('#e8476b')); b.position.set(d*0.7, 0.95, 0); b.rotation.z = -d*0.5; clock.add(b); });
  for (let i = 0; i < 12; i++) { const a = i/12*Math.PI*2, dt = M(new THREE.SphereGeometry(0.045, 10, 8), F('#2b3a63'), 0); dt.position.set(Math.sin(a)*0.72, Math.cos(a)*0.72, 0.2); clock.add(dt); }
  const hm = M(new THREE.BoxGeometry(0.09, 0.5, 0.05), F('#2b3a63'), 0); hm.geometry.translate(0, 0.25, 0); hm.position.z = 0.22; clock.add(hm); clock.userData.h = hm;
  const mm = M(new THREE.BoxGeometry(0.06, 0.7, 0.05), F('#2b3a63'), 0); mm.geometry.translate(0, 0.35, 0); mm.position.z = 0.24; clock.add(mm); clock.userData.m = mm; }
// muñecos: Dra. Verónica (ya construida arriba) y un paciente
function makePatient() { const g = new THREE.Group();
  const body = M(new THREE.CapsuleGeometry(0.62, 0.9, 12, 32), F('#f2b630')); body.position.y = -1.0; body.scale.set(1, 1, 0.9); g.add(body);
  const neck = M(new THREE.CylinderGeometry(0.16, 0.18, 0.3, 20), F('#e9b48c')); neck.position.y = -0.2; g.add(neck);
  const head = new THREE.Group(); head.position.y = 0.35; g.add(head); g.userData.head = head;
  const face = M(new THREE.SphereGeometry(0.55, 40, 32), F('#e9b48c')); face.scale.set(1, 1.08, 0.9); head.add(face);
  const hair = M(new THREE.SphereGeometry(0.6, 40, 20, 0, Math.PI*2, 0, 1.35), F('#4a2f24')); hair.position.set(0, 0.06, -0.04); hair.rotation.x = -0.35; head.add(hair);
  const bun = M(new THREE.SphereGeometry(0.25, 24, 16), F('#4a2f24')); bun.position.set(0, 0.62, -0.15); head.add(bun);
  [-1, 1].forEach(d => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), new THREE.MeshStandardMaterial({color: '#1d1b19', roughness: 0.25})); e.position.set(d*0.19, 0.05, 0.47); e.scale.z = 0.5; head.add(e); });
  head.add(stitches(new THREE.CatmullRomCurve3([[-0.14, -0.18], [0, -0.26], [0.14, -0.18]].map(([x, y]) => new THREE.Vector3(x, y, 0.5))), 7, '#9b2d3a', 0.014));
  const arm = new THREE.Group(); arm.position.set(-0.62, -0.55, 0); g.add(arm); g.userData.arm = arm;
  const a = M(new THREE.CapsuleGeometry(0.15, 0.6, 8, 20), F('#f2b630')); a.position.y = 0.38; arm.add(a); const h = M(new THREE.SphereGeometry(0.16, 20, 16), F('#e9b48c')); h.position.y = 0.82; arm.add(h);
  const b = brush.clone(); b.scale.setScalar(0.45); b.rotation.z = 0.0; b.position.set(0.2, 0.95, 0.2); arm.add(b);
  const armL = M(new THREE.CapsuleGeometry(0.15, 0.6, 8, 20), F('#f2b630')); armL.position.set(0.7, -1.0, 0); armL.rotation.z = 0.25; g.add(armL);
  scene.add(g); return g; }
const patient = makePatient();
// ---------- parches con texto (subtítulos, pregunta, calendario, cierre)
function textPatchTex(text, bg, fg, font, maxLines = 3) { const [c, ctx] = mk(1024, 512); ctx.fillStyle = bg; ctx.fillRect(0, 0, 1024, 512);
  ctx.globalAlpha = 0.18; ctx.drawImage(FIB, 0, 0, 1024, 512); ctx.globalAlpha = 1; ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  let fs = 120; const words = String(text).split(/\s+/);
  const fit = () => { ctx.font = `${font} ${fs}px ${font.includes('700') ? 'Caveat' : 'Bebas'}`.replace(/^700 /, '700 ').replace(/^ /, ''); const lines = []; let ln = '';
    for (const w of words) { const ts = ln ? ln + ' ' + w : w; if (ctx.measureText(ts).width > 900 && ln) { lines.push(ln); ln = w; } else ln = ts; } if (ln) lines.push(ln); return lines; };
  let lines = fit(); while ((lines.length > maxLines || lines.length*fs*1.05 > 460) && fs > 40) { fs -= 8; lines = fit(); }
  lines.forEach((l, i) => ctx.fillText(l, 512, 256 + (i - (lines.length - 1)/2)*fs*1.02));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
function calendarTex(head) { const [c, ctx] = mk(1024, 1024); ctx.fillStyle = '#fbf8f0'; ctx.fillRect(0, 0, 1024, 1024); ctx.globalAlpha = 0.18; ctx.drawImage(FIB, 0, 0, 1024, 1024); ctx.globalAlpha = 1;
  ctx.fillStyle = '#e8476b'; ctx.fillRect(0, 0, 1024, 230); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '120px Bebas'; ctx.fillText(head.toUpperCase().slice(0, 18), 512, 120);
  ctx.font = '74px Bebas'; ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'].forEach((m, i) => { const x = 170 + (i % 4)*228, y = 360 + Math.floor(i/4)*210;
    ctx.fillStyle = '#2b3a63'; ctx.fillText(m, x, y); if (i === 0 || i === 6) { ctx.strokeStyle = '#2fae5a'; ctx.lineWidth = 14; ctx.beginPath(); ctx.ellipse(x, y, 100, 72, 0, 0, Math.PI*2); ctx.stroke(); } });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
let capPatches = [], bigPatches = [], LOGOP = null, CTAP = null;
function dropGroup(g) { if (!g) return; scene.remove(g); g.traverse(o => { if (o.isMesh) { o.geometry.dispose(); if (o.material.map && o.material.map.isCanvasTexture) o.material.map.dispose(); } }); }
function onPlan(p, scn) {
  capPatches.forEach(dropGroup); bigPatches.forEach(dropGroup); dropGroup(CTAP); capPatches = []; bigPatches = [];
  scn.forEach((s, i) => {
    const show = s.visual !== 'pregunta' && s.texto;
    const cp = show ? patch(3.7, 1.2, textPatchTex(s.texto, i % 2 ? '#fbf8f0' : '#f6e7c8', '#2b3a63', '', 3), i % 2 ? '#fbf8f0' : '#f6e7c8') : null; if (cp) scene.add(cp); capPatches.push(cp);
    let bp = null;
    if (s.visual === 'pregunta') bp = patch(3.5, 2.5, textPatchTex(s.texto, '#2b3a63', '#fbf8f0', '', 4), '#2b3a63');
    if (s.visual === 'calendario') bp = patch(2.8, 2.8, calendarTex(s.destacar || 'Tu control'), '#fbf8f0');
    if (bp) scene.add(bp); bigPatches.push(bp);
  });
  CTAP = patch(3.4, 1.1, textPatchTex((p.cta && p.cta.boton) || 'Agenda tu evaluación', '#d8a596', '#ffffff', '', 2), '#d8a596'); scene.add(CTAP);
}
// ---------- línea de tiempo (stop-motion a 12 cuadros/s)
const boil = (t, id, a = 1) => { const f = Math.floor(t*STOP); return [(hash(f, id) - 0.5)*0.01*a, (hash(f, id + 9) - 0.5)*0.01*a, (hash(f, id + 17) - 0.5)*0.02*a]; };
const pop = (lt, d = 0.35, at = 0) => Math.max(0.001, eback(seg(lt, at, at + d)));
const ALL = () => [mouth, brush, scaler, bigTooth, clock, vero, patient, ...stars, ...bugs, ...capPatches, ...bigPatches, LOGOP, CTAP].filter(Boolean);
function frame(f) {
  const t = f/FPS, tq = Math.floor(t*STOP)/STOP, s = sceneAt(tq), lt = tq - s.t0, d = s.dur, v = s.visual, [bx, by, br] = boil(tq, s.i + 1);
  ALL().forEach(o => o.visible = false);
  camera.position.set(0.15*Math.sin(s.i*1.7), 0.3, 14.2 - 0.8*eio(clamp01(lt/d))); camera.lookAt(0, 0.3, 0);
  plaque.forEach(p => p.visible = false); tartar.forEach(p => p.visible = false); crumbs.forEach(p => p.visible = false);
  const showMouth = ['dientes', 'restos', 'placa', 'sarro', 'cepillado', 'limpieza', 'reloj'].includes(v);
  if (showMouth) { mouth.visible = true; mouth.position.set(bx, 1.0 + by, 0); mouth.rotation.z = br*0.5; mouth.scale.setScalar(v === 'reloj' ? 0.62 : 0.84*pop(lt, 0.45)); if (v === 'reloj') mouth.position.set(bx, 2.35, 0); }
  if (v === 'restos' || v === 'placa') crumbs.forEach((c, i) => { const k = seg(lt, 0.4 + i*0.15, 0.6 + i*0.15); c.visible = k > 0; c.scale.setScalar(Math.max(0.01, eback(k))); });
  if (v === 'placa') { plaque.forEach((p, i) => { const k = seg(lt, 0.8 + i*0.05, 1.2 + i*0.05); p.visible = k > 0; p.scale.set(k, k, 0.5*k); });
    bugs.forEach((g, i) => { const k = pop(lt, 0.4, 0.3 + i*0.25); g.visible = true; g.scale.setScalar(k); g.position.set([-1.3, 0, 1.3][i] + 0.08*Math.sin(tq*5 + i), 3.0 + 0.1*Math.sin(tq*4 + i*2), 0.6); g.rotation.z = 0.2*Math.sin(tq*3 + i); }); }
  if (v === 'sarro') tartar.forEach((p, i) => { const k = seg(lt, 0.5 + i*0.12, 0.9 + i*0.12); p.visible = k > 0; p.scale.set(1, Math.max(0.01, k), 0.6); });
  if (v === 'cepillado' || v === 'reloj') { brush.visible = true; const k = seg(lt, 0.4, d - 0.4); const yb = v === 'reloj' ? 2.35 + (1.55 - 1.0)*0.62 : 1.0 + 0.55*0.84;
    brush.position.set(lerp(-1.6, 1.5, k)*(v === 'reloj' ? 0.62 : 1) + 0.15*Math.sin(tq*22), yb + 0.05*Math.sin(tq*22), 0.75); brush.rotation.set(0, 0, Math.PI + 0.05*Math.sin(tq*11)); brush.scale.setScalar(v === 'reloj' ? 0.62 : 0.84);
    if (v === 'cepillado') plaque.forEach((p, i) => { const tx = TX[Math.floor(i/2)]/1.7, gone = seg(k*2 - 1, tx - 0.15, tx + 0.15); p.visible = gone < 1; p.scale.setScalar(Math.max(0.01, 1 - gone)); }); }
  if (v === 'limpieza') { scaler.visible = true; const k = seg(lt, 0.4, d - 0.4); scaler.position.set(lerp(-1.4, 1.4, k) + 0.04*Math.sin(tq*30), 1.0 + UT(0.05)*0.84 + 0.04*Math.cos(tq*30), 0.85); scaler.rotation.z = 0.35;
    tartar.forEach((p, i) => { const tx = TX[i]/1.7, gone = seg(k*2 - 1, tx - 0.1, tx + 0.1); p.visible = gone < 1; p.scale.set(1, Math.max(0.01, 1 - gone), 0.6); }); }
  if (v === 'dientes' || v === 'brillo') stars.forEach((st, i) => { const k = pop(lt, 0.3, 0.6 + i*0.18); st.visible = true; st.scale.setScalar(k); st.position.set([-1.5, 0.1, 1.6, -0.6][i], [3.15, 3.4, 3.1, 0.2][i] + (v === 'brillo' ? -0.3 : 0), 0.7); st.rotation.z = tq*1.5 + i; });
  if (v === 'brillo' || v === 'caries') { bigTooth.visible = true; bigTooth.position.set(bx, 1.2 + by, 0.2); bigTooth.rotation.z = br; bigTooth.scale.setScalar(1.15*pop(lt, 0.45));
    bigTooth.userData.smile.visible = v === 'brillo'; bigTooth.userData.sad.visible = v === 'caries'; const h = bigTooth.userData.hole; h.visible = v === 'caries'; const hk = 0.35 + 0.9*eout(seg(lt, 0.5, d - 0.4)); h.scale.set(hk, 1, hk); }
  if (v === 'reloj') { clock.visible = true; clock.position.set(bx, 0.15 + by, 0.3); clock.scale.setScalar(0.95*pop(lt, 0.45)); clock.userData.m.rotation.z = -tq*2.5; clock.userData.h.rotation.z = -tq*0.3; }
  if (v === 'doctora') { vero.visible = true; vero.position.set(bx, 1.05 + by, 0); vero.scale.setScalar(1.25*pop(lt, 0.5)); vero.rotation.z = br*0.4;
    veroParts.armR.rotation.z = 0.5 + 0.45*Math.sin(tq*9)*seg(lt, 0.5, 0.8); veroParts.head.rotation.z = 0.12*Math.sin(tq*2.5); veroParts.head.rotation.y = 0.15*Math.sin(tq*1.3); }
  if (v === 'persona') { patient.visible = true; patient.position.set(bx, 1.15 + by, 0); patient.scale.setScalar(1.2*pop(lt, 0.5)); patient.userData.arm.rotation.z = 0.35 + 0.18*Math.sin(tq*16); patient.userData.head.rotation.z = 0.06*Math.sin(tq*3); }
  const bp = bigPatches[s.i]; if (bp) { bp.visible = true; bp.scale.setScalar(pop(lt, 0.4, 0.1)); bp.position.set(bx, (v === 'calendario' ? 1.2 : 0.8) + by, 0.4); bp.rotation.z = -0.03 + br; }
  if (v === 'cta') { LOGOP.visible = CTAP.visible = true; LOGOP.scale.setScalar(1.25*pop(lt, 0.45, 0.1)); LOGOP.position.set(bx, 1.75 + by, 0.1); LOGOP.rotation.z = -0.04 + br;
    CTAP.scale.setScalar(pop(lt, 0.45, 0.8)); CTAP.position.set(-bx, 0.05 - by, 0.2); CTAP.rotation.z = 0.04 - br; }
  const cp = capPatches[s.i]; if (cp) { cp.visible = true; cp.scale.setScalar(pop(lt, 0.35, 0.25)); cp.position.set(-bx, (v === 'cta' ? -1.6 : -2.15) - by, 0.6); cp.rotation.z = (s.i % 2 ? 0.025 : -0.025) - br; }
  renderer.render(scene, camera);
}
async function build() {
  await Promise.all(['40px Bebas', '700 40px Caveat'].map(f => document.fonts.load(f))); await document.fonts.ready;
  const logo = new Image(); logo.src = LOGO_SRC; await logo.decode();
  const [c, ctx] = mk(1024, 512); ctx.fillStyle = '#f6efe2'; ctx.fillRect(0, 0, 1024, 512); ctx.globalAlpha = 0.2; ctx.drawImage(FIB, 0, 0, 1024, 512); ctx.globalAlpha = 1;
  const lw = 800, lh = lw*logo.height/logo.width; ctx.drawImage(logo, 112, 256 - lh/2, lw, lh); const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace;
  LOGOP = patch(2.7, 1.35, tx, '#f6efe2'); scene.add(LOGOP);
  planSet(PLAN || window.DEFAULT_PLAN);
}
window.renderFrame = f => { frame(f); return true; };
window.GPU = 'webgl';
build().then(() => { window.READY = true; });
