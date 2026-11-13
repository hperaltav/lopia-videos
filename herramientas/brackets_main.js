// ------------------------------------------------ guion (tiempos medidos en la voz)
const B = [[0.0, 2.31], [2.51, 10.11], [10.45, 14.79], [15.01, 16.91], [17.12, 20.59], [20.77, 24.51], [24.74, 28.68], [28.87, 36.68], [36.89, 41.55], [41.75, 45.88], [46.1, 49.87]];
const OB = [[0.0,2.37],[2.6,6.91],[7.1,8.97],[9.24,12.75],[12.96,16.96],[17.22,21.5],[21.67,30.21],[30.41,35.12],[35.37,40.16],[40.44,44.22]];   // tiempos de la animación base
// tiempo real (voz nueva) -> tiempo de la animación base
const MAP = [[0, 0], [B[2][0] - 0.15, 2.45]];
for (let k = 2; k < B.length; k++) MAP.push([B[k][0], OB[k-1][0]], [B[k][1], OB[k-1][1]]);
const remap = t => { if (t >= MAP[MAP.length-1][0]) return MAP[MAP.length-1][1] + (t - MAP[MAP.length-1][0]);
  let i = 0; while (t > MAP[i+1][0]) i++; const [a0, b0] = MAP[i], [a1, b1] = MAP[i+1]; return b0 + (b1 - b0)*(t - a0)/(a1 - a0); };
const LINES = ["Los brackets no son todos iguales.",
"Cada diente lleva el suyo: los incisivos usan uno más ancho, los caninos traen un ganchito y las muelas llevan otra pieza.",
"Todo parte con el bracket: una pieza pequeña que se pega sobre cada diente.",
"Pero solo el bracket no hace nada.",
"Cada uno tiene una ranura al centro: ese es el slot.",
"Por ahí pasa un alambre que mueve los dientes: ese es el arco.",
"En cada esquina del bracket hay unos ganchitos: esas son las aletas.",
"Pero el arco se sale; para sujetarlo, se enganchan unos elásticos en las aletas: esas son las ligas, y las hay de muchos colores.",
"Y en las muelas, el arco se ancla en un pequeño tubo: ese es el tubo molar.",
"Se pueden instalar en una sola sesión, aunque esto depende de cada caso.",
"¿Quieres mejorar tu sonrisa? Agenda tu evaluación en PazDentium."];
const HI = [['iguales.'],['incisivos','caninos','muelas'],['bracket:'],['nada.'],['slot.'],['arco.'],['aletas.'],['ligas,','colores.'],['tubo','molar.'],['arriba','abajo.'],['PazDentium.']];
const RED = new Set([3]);
// grupos del gancho (medidos en las pausas de la voz)
const GROUPS = [[4.26, ['central','lateral'], 'INCISIVOS'], [6.6, ['canine'], 'CANINOS'], [8.42, ['molar'], 'MOLARES']];
const GEND = B[1][1];
const syl = w => Math.max(1, (w.toLowerCase().match(/[aeiouáéíóú]+/g) || []).length);
const CHUNKS = [];
LINES.forEach((line, li) => {
  const words = line.split(' '); const [a, b] = B[li];
  const tot = words.reduce((s, w) => s + syl(w) + (/[,:.?;]$/.test(w) ? 1 : 0), 0);
  let acc = 0; const times = words.map(w => { const t = a + (b - a) * acc / tot; acc += syl(w) + (/[,:.?;]$/.test(w) ? 1 : 0); return t; });
  let cur = [];
  words.forEach((w, i) => { cur.push(i);
    const end = /[,:.?;]$/.test(w) && cur.length >= 2 || cur.length >= 4 || i === words.length - 1;
    if (end) { CHUNKS.push({li, idx: cur.slice(), words, times}); cur = []; } });
});
CHUNKS.forEach((c, i) => { c.t0 = c.times[c.idx[0]]; const nx = CHUNKS[i + 1];
  c.t1 = nx && nx.li === c.li ? nx.times[nx.idx[0]] : B[c.li][1] + (nx ? Math.min(0.15, nx.times[nx.idx[0]] - B[c.li][1]) : 0.4); });
// instante en que se dice una palabra (para sincronizar "ese es el …")
const wordTime = (li, word) => { const c = CHUNKS.find(c => c.li === li && c.idx.some(i => c.words[i].startsWith(word)));
  const i = c.idx.find(i => c.words[i].startsWith(word)); return c.times[i]; };

__BASE__
__CHARS__

// ------------------------------------------------ bracket (pieza modelada)
const mMetal = toon('#c3cad3'), mMetalD = toon('#8d96a3'), mCeram = toon('#f2ece0'), mSlot = toon('#2fb3a6', {emissive: new THREE.Color('#2fb3a6'), emissiveIntensity: 0});
const mWingGlow = toon('#c3cad3', {emissive: new THREE.Color('#ffd36b'), emissiveIntensity: 0});
const BW = {central: 0.12, lateral: 0.095, canine: 0.105};
function makeBracket(kind) {
  const g = new THREE.Group(); const bw = BW[kind];
  const ph = 0.14, pw = bw + 0.05;
  const padPts = kind === 'canine' ? [[-pw,-ph+0.03],[pw,-ph-0.03],[pw,ph-0.03],[-pw,ph+0.03]] : [[-pw,-ph],[pw,-ph],[pw,ph],[-pw,ph]];
  const base = new THREE.Mesh(extrude(smoothClosed(padPts, 24), 0.02, true), mMetalD); g.add(base);          // base (z 0–0.06)
  const top = new THREE.Mesh(new THREE.BoxGeometry(2*bw, 0.065, 0.05), mMetal); top.position.set(0, 0.048, 0.075); g.add(top); // cuerpo (frente 0.10)
  const bot = top.clone(); bot.position.y = -0.048; g.add(bot);
  const slot = new THREE.Mesh(new THREE.BoxGeometry(2*bw, 0.031, 0.02), mSlot); slot.position.set(0, 0, 0.075); g.add(slot);  // ranura (hundida)
  const wings = [];
  for (const [sx, sy] of [[-1,1],[1,1],[-1,-1],[1,-1]]) {        // aletas: tallo + tapa (frente 0.20, delante de la liga)
    const w = new THREE.Group(); w.position.set((bw - 0.03)*sx, 0.105*sy, 0);
    const stem = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.055, 0.17), mWingGlow); stem.position.z = 0.18; w.add(stem);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.07, 0.03), mWingGlow); cap.position.set(0.006*sx, 0.012*sy, 0.275); w.add(cap);
    g.add(w); wings.push(w);
  }
  if (kind === 'canine') { const hook = new THREE.Mesh(new THREE.CapsuleGeometry(0.016, 0.09, 4, 8), mMetal);
    hook.position.set(bw - 0.01, 0.2, 0.25); hook.rotation.z = -0.6; g.add(hook); }
  g.userData = {base, top, bot, slot, wings, bw};
  return g;
}
const LIG_COLORS = ['#ff5a7a', '#2fb3a6', '#7c5cff', '#ffb02e', '#3fa9f5', '#ff7a3d', '#2ecc71', '#e84393'];
function makeLig(color, bw) { const m = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.018, 10, 32), toon(color)); m.userData.sx = (bw - 0.03)/0.0542; m.scale.set(m.userData.sx, 1.25, 1); m.position.z = 0.235; return m; }

// ------------------------------------------------ arcada (dientes + encía + brackets + ligas + arco)
const WID = [0.62, 0.44, 0.48, 0.58, 0.58, 0.48, 0.44, 0.62];   // muela, canino, lateral, central ×2, lateral, canino, muela
function makeArch(lower) {
  const grp = new THREE.Group(); const teeth = [];
  const mEn = toon(COL.enamel);
  let xs = -WID.reduce((a,b)=>a+b+0.04,0)/2;
  WID.forEach((w, i) => {
    const cx = xs + w/2; xs += w + 0.04;
    const molar = i === 0 || i === WID.length - 1, canine = i === 1 || i === WID.length - 2, central = i === 3 || i === 4;
    const kind = molar ? 'molar' : canine ? 'canine' : central ? 'central' : 'lateral';
    // formas redondeadas y amables (sin puntas)
    const pts = molar ? [[-w/2,0.5],[w/2,0.5],[w*0.5,-0.18],[w*0.42,-0.36],[w*0.18,-0.42],[0,-0.38],[-w*0.18,-0.42],[-w*0.42,-0.36],[-w*0.5,-0.18]]
      : canine ? [[-w/2,0.5],[w/2,0.5],[w*0.5,-0.12],[w*0.36,-0.4],[0,-0.52],[-w*0.36,-0.4],[-w*0.5,-0.12]]
               : [[-w/2,0.5],[w/2,0.5],[w*0.5,-0.2],[w*0.44,-0.42],[w*0.2,-0.5],[-w*0.2,-0.5],[-w*0.44,-0.42],[-w*0.5,-0.2]];
    const poly = inset(smoothClosed(pts, 90), () => 0.05);
    const tg = new THREE.Group(); const zf = -0.55*Math.pow(cx/1.6, 2);
    tg.position.set(cx, 0, zf); tg.rotation.y = Math.atan(1.1*cx/2.56);   // mira hacia afuera: arcada convexa
    const mesh = new THREE.Mesh(new THREE.ExtrudeGeometry(shapeOf(poly), {depth: 0.28, bevelEnabled: true, bevelThickness: 0.09, bevelSize: 0.06, bevelSegments: 6, curveSegments: 1}), mEn);
    mesh.position.z = -0.33; tg.add(mesh);                     // cara frontal acolchada (frente en z ≈ 0.04)
    const shine = new THREE.Mesh(new THREE.CapsuleGeometry(0.02, 0.1, 4, 10), new THREE.MeshBasicMaterial({color: '#ffffff', transparent: true, opacity: 0.85}));
    shine.material.userData.noOutline = true; shine.position.set(-w*0.3, -0.3, 0.06); shine.rotation.z = 0.1; tg.add(shine);
    let br = null, lig = null, tube = null;
    if (molar) { tube = new THREE.Group();
      const band = new THREE.Mesh(new THREE.BoxGeometry(w*0.9, 0.2, 0.03), mMetalD); band.position.z = 0.04; tube.add(band);
      const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.26, 16), mMetal); cyl.rotation.z = Math.PI/2; cyl.position.z = 0.15; tube.add(cyl);
      const hole = new THREE.Mesh(new THREE.CircleGeometry(0.028, 14), toon('#2b2d42')); hole.position.set(cx < 0 ? 0.131 : -0.131, 0, 0.15); hole.rotation.y = cx < 0 ? Math.PI/2 : -Math.PI/2; tube.add(hole);
      const sgn = cx < 0 ? -1 : 1, hook = new THREE.Mesh(new THREE.CapsuleGeometry(0.016, 0.09, 4, 8), mMetal);
      hook.position.set(sgn*0.08, 0.075, 0.19); hook.rotation.z = -sgn*0.6; tube.add(hook);
      tube.position.set(0, -0.06, 0.04); tg.add(tube); }
    else { br = makeBracket(kind); br.position.set(0, -0.06, 0.05); br.scale.setScalar(0.85); tg.add(br);
      lig = makeLig(LIG_COLORS[i % LIG_COLORS.length], br.userData.bw); br.add(lig); }
    const halo = new THREE.Mesh(new THREE.CircleGeometry(molar ? 0.34 : 0.27, 40), new THREE.MeshBasicMaterial({color: '#7fe0d6', transparent: true, opacity: 0, depthWrite: false}));
    halo.material.userData.noOutline = true; halo.position.set(0, -0.06, 0.03); halo.visible = false; tg.add(halo);
    grp.add(tg); teeth.push({g: tg, cx, zf, w, br, lig, tube, molar, kind, halo});
  });
  // encía festoneada: superficie curva que sigue la arcada, con un borde redondeado sobre cada diente
  const XS = -WID.reduce((a,b)=>a+b+0.04,0)/2;
  const ys = x => { let y = 0.42, xx = XS; for (const w of WID) { const c = xx + w/2, d = (x - c)/(w/2); if (Math.abs(d) <= 1.15) y = Math.min(y, 0.18 + 0.2*d*d); xx += w + 0.04; } return Math.min(0.42, y); };
  const NX = 160, NY = 26, pos = [], idx = [];
  for (let i = 0; i <= NX; i++) { const x = -4 + 8*i/NX, y0 = ys(x), f = -0.55*Math.pow(Math.min(Math.abs(x), 3.4)/1.6, 2) - 0.3*Math.max(0, Math.abs(x) - 3.4);
    for (let j = 0; j <= NY; j++) { const v = j/NY, y = y0 + (0.8 - y0)*v; const bulge = 0.13*Math.exp(-(y - y0)*5);
      pos.push(x, y, f + 0.06 + bulge - 0.04*(y - y0)); } }
  for (let i = 0; i < NX; i++) for (let j = 0; j < NY; j++) { const a0 = i*(NY+1) + j, a1 = a0 + NY + 1; idx.push(a0, a1, a0 + 1, a1, a1 + 1, a0 + 1); }
  const gumG = new THREE.BufferGeometry(); gumG.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); gumG.setIndex(idx); gumG.computeVertexNormals();
  const gum = new THREE.Mesh(gumG, toon(COL.gum, {side: THREE.DoubleSide})); grp.add(gum);
  // labio y piel: enmarcan la sonrisa y dejan ver solo una franja de encía
  // labio natural: más grueso al centro, se afina hacia las comisuras; arco de cupido en el labio superior
  { const NL = 200, NR = 24, lp = [], li = [];
    for (let i = 0; i <= NL; i++) { const x = -3.9 + 7.8*i/NL, u = Math.min(1, Math.abs(x)/3.9), f = -0.55*Math.pow(Math.min(Math.abs(x), 3.4)/1.6, 2) - 0.3*Math.max(0, Math.abs(x) - 3.4);
      let c = 0.86 - 0.12*Math.pow(u, 3);
      if (!lower) c += -0.035*Math.exp(-Math.pow(x/0.2, 2)) + 0.03*Math.exp(-Math.pow((Math.abs(x) - 0.32)/0.2, 2));
      const fat = lower ? 1.3 : 1, h = (0.15*Math.pow(1 - u*u, 0.6) + 0.025)*fat, rz = (0.11*Math.pow(1 - u*u, 0.6) + 0.03)*fat;
      for (let j = 0; j <= NR; j++) { const a = j/NR*Math.PI*2; lp.push(x, c + h*Math.sin(a), f + 0.17 + rz*Math.cos(a)); } }
    for (let i = 0; i < NL; i++) for (let j = 0; j < NR; j++) { const a0 = i*(NR+1) + j, a1 = a0 + NR + 1; li.push(a0, a1, a0 + 1, a1, a1 + 1, a0 + 1); }
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3)); lg.setIndex(li); lg.computeVertexNormals();
    grp.add(new THREE.Mesh(lg, toon(lower ? '#e48089' : '#d96f7a', {side: THREE.DoubleSide}))); }
  { const sp = [], si = [], NS = 18;
    for (let i = 0; i <= NX; i++) { const x = -5 + 10*i/NX, f = -0.55*Math.pow(Math.min(Math.abs(x), 3.4)/1.6, 2) - 0.3*Math.max(0, Math.abs(x) - 3.4);
      for (let j = 0; j <= NS; j++) { const y = 0.95 + 3.0*(j/NS); sp.push(x, y, f + 0.12 - 0.06*(y - 0.95)); } }
    for (let i = 0; i < NX; i++) for (let j = 0; j < NS; j++) { const a0 = i*(NS+1) + j, a1 = a0 + NS + 1; si.push(a0, a1, a0 + 1, a1, a1 + 1, a0 + 1); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); sg.setIndex(si); sg.computeVertexNormals();
    grp.add(new THREE.Mesh(sg, toon('#f6cfae', {side: THREE.DoubleSide}))); }
  // arco: curva que pasa por los slots y termina en los tubos
  grp.updateMatrixWorld(true);
  // arco liso: misma curva que siguen los dientes, desplazada hacia afuera (pasa justo por cada slot y tubo)
  const arcPt = x => { const th = Math.atan(1.1*x/2.56), d = 0.19; return new THREE.Vector3(x + d*Math.sin(th), -0.06, -0.55*Math.pow(x/1.6, 2) + d*Math.cos(th)); };
  const x0 = teeth[0].cx - 0.18, x1 = teeth[teeth.length-1].cx + 0.18; const pts = [];   // termina dentro del tubo molar
  for (let k = 0; k <= 120; k++) pts.push(arcPt(lerp(x0, x1, k/120)));
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  const wire = new THREE.Mesh(new THREE.TubeGeometry(curve, 400, 0.02, 16, false), toon('#dfe5ec')); grp.add(wire);
  if (lower) { grp.scale.y = -1; }
  add(grp);
  return {grp, teeth, gum, wire, mEn};
}
const upper = makeArch(false);
const lower = makeArch(true); lower.grp.position.y = -1.32; lower.grp.position.z = -0.05;
const lip = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.3), toon('#5a2232')); lip.position.set(0, -0.66, -1.3); scene.add(lip);   // interior de la boca

// muela sola (escena del tubo molar): se ve girando, como recorriendo la mordida
const solo = new THREE.Group(); solo.position.set(30, 0, 0);
{ const prof = [[0,-0.36],[0.2,-0.37],[0.38,-0.3],[0.48,-0.12],[0.5,0.08],[0.46,0.3],[0.4,0.5],[0,0.5]].map(([r,y]) => new THREE.Vector2(r, y));
  const mEn2 = toon(COL.enamel);
  const crown = new THREE.Mesh(new THREE.LatheGeometry(prof, 48), mEn2); crown.scale.z = 0.85; solo.add(crown);
  for (const [x, z] of [[-0.2,-0.17],[0.2,-0.17],[-0.2,0.17],[0.2,0.17]]) { const c = new THREE.Mesh(new THREE.SphereGeometry(0.19, 24, 16), mEn2); c.position.set(x, -0.33, z*0.85); c.scale.y = 0.75; solo.add(c); }
  const gumS = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 24), toon(COL.gum)); gumS.position.y = 0.56; gumS.scale.set(0.6, 0.24, 0.52); solo.add(gumS);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.505, 0.505, 0.24, 48, 1, true), toon('#a7b0bb', {side: THREE.DoubleSide})); band.position.y = 0.02; band.scale.z = 0.86; solo.add(band);
  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.34, 20), mMetal); cyl.rotation.z = Math.PI/2; cyl.position.set(0, 0.02, 0.5); solo.add(cyl);
  const hole = new THREE.Mesh(new THREE.CircleGeometry(0.036, 16), toon('#2b2d42')); hole.position.set(-0.171, 0.02, 0.5); hole.rotation.y = -Math.PI/2; solo.add(hole);
  const hookS = new THREE.Mesh(new THREE.CapsuleGeometry(0.024, 0.15, 4, 10), mMetal); hookS.position.set(0.12, 0.13, 0.57); hookS.rotation.z = -0.6; solo.add(hookS);
  const wc = new THREE.CatmullRomCurve3([[-2.6,0.02,1.55],[-1.5,0.02,1.05],[-0.7,0.02,0.64],[0.0,0.02,0.5],[0.24,0.02,0.49]].map(p => new THREE.Vector3(...p)));
  const sw = new THREE.Mesh(new THREE.TubeGeometry(wc, 80, 0.022, 8, false), toon('#dfe5ec')); solo.add(sw);
  solo.userData = {cyl}; }
add(solo);

// piezas de muestra del gancho (incisivo, canino, tubo molar), siempre al frente
const DISP = [makeBracket('central'), makeBracket('canine'), (() => { const g = new THREE.Group();
  const band = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.2, 0.03), mMetalD); band.position.z = 0.0; g.add(band);
  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.3, 20), mMetal); cyl.rotation.z = Math.PI/2; cyl.position.z = 0.07; g.add(cyl);
  const hole = new THREE.Mesh(new THREE.CircleGeometry(0.035, 16), toon('#2b2d42')); hole.position.set(-0.151, 0, 0.07); hole.rotation.y = -Math.PI/2; g.add(hole);
  const hk = new THREE.Mesh(new THREE.CapsuleGeometry(0.02, 0.12, 4, 10), mMetal); hk.position.set(0.1, 0.1, 0.11); hk.rotation.z = -0.6; g.add(hk);
  return g; })()];
DISP.forEach(d => { const h = new THREE.Mesh(new THREE.CircleGeometry(0.3, 48), new THREE.MeshBasicMaterial({color: '#bff0ea'}));
  h.material.userData.noOutline = true; h.position.z = -0.03; d.add(h); d.visible = false; add(d, frontScene); });

// bracket grande que entra (escena 2) y arco corto (escenas 5–7)
const hero = upper.teeth[3];                 // incisivo central
const heroBr = hero.br, heroLig = hero.lig;

// ------------------------------------------------ paciente final con brackets
// Personaje fijo PazDentium: Dra. Verónica (estilo toon de los videos).
// Requiere makePerson, toon, extrude, lerp del motor de escenas. Uso: const v = makeVeronica(false /* casual */ | true /* clínica */);
// ---------------- personaje: Dra. Verónica
function makeVeronica(clinical) {
  const p = makePerson({skin: '#f2c4a0', hair: '#7a4a2a', shirt: '#2b3a63', long: false, hairLen: 1.25, cap: false});
  const u = p.userData, head = u.head;
  const hairA = toon('#7a4a2a', {side: THREE.DoubleSide}), hairB = toon('#a8703f', {side: THREE.DoubleSide});
  // melena larga, lisa con ondas suaves: un manto que cae por atrás y los lados + mechones al frente
  { const NA = 48, NY = 40, pos = [], idx = [];
    for (let i = 0; i <= NA; i++) { const th = -2.35 + 4.7*i/NA;           // 0 = atrás; ±2.35 = a los lados de la cara
      for (let j = 0; j <= NY; j++) { const v = j/NY, y = 0.45 - 2.55*v;
        const r = 0.98 + 0.32*Math.pow(v, 1.3) + 0.13*Math.sin(v*10 + th*1.2)*Math.min(1, v*2);
        pos.push(Math.sin(th)*r, y, -Math.cos(th)*r*0.92 - 0.05); } }
    for (let i = 0; i < NA; i++) for (let j = 0; j < NY; j++) { const a0 = i*(NY+1) + j, a1 = a0 + NY + 1; idx.push(a0, a1, a0 + 1, a1, a1 + 1, a0 + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    head.add(new THREE.Mesh(g, toon('#7a4a2a', {side: THREE.DoubleSide}))); }
  function strand(pts, w0, w1, mat) {        // mechón plano y ondulado que se afina hacia la punta
    const c = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))), N = 60, R = 14, pos = [], idx = [];
    for (let i = 0; i <= N; i++) { const t = i/N, p = c.getPointAt(t), tg = c.getTangentAt(t), side = new THREE.Vector3().crossVectors(tg, new THREE.Vector3(0, 0, 1)).normalize();
      const w = lerp(w0, w1, t)*(t > 0.85 ? 1 - (t - 0.85)/0.15*0.7 : 1);
      for (let j = 0; j <= R; j++) { const a = j/R*Math.PI*2; const q = p.clone().addScaledVector(side, Math.cos(a)*w).add(new THREE.Vector3(0, 0, Math.sin(a)*w*0.35)); pos.push(q.x, q.y, q.z); } }
    for (let i = 0; i < N; i++) for (let j = 0; j < R; j++) { const a0 = i*(R+1) + j, a1 = a0 + R + 1; idx.push(a0, a1, a0 + 1, a1, a1 + 1, a0 + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    return new THREE.Mesh(g, mat); }
  for (const s of [-1, 1]) {
    head.add(strand([[s*0.12, 0.86, 0.62], [s*0.75, 0.6, 0.66], [s*0.98, 0.0, 0.35], [s*1.12, -0.55, 0.45], [s*0.92, -1.1, 0.5], [s*1.15, -1.65, 0.45], [s*0.98, -2.2, 0.4]], 0.24, 0.2, hairA));
    head.add(strand([[s*0.2, 0.9, 0.5], [s*0.88, 0.48, 0.48], [s*1.12, -0.2, 0.15], [s*1.3, -0.75, 0.2], [s*1.1, -1.35, 0.22], [s*1.32, -1.95, 0.15]], 0.18, 0.15, hairB));
  }
  // raya al medio + mechones que caen sobre la frente a los lados
  // pestañas y labios
  u.eyes.forEach(e => { const lash = new THREE.Mesh(new THREE.CapsuleGeometry(0.02, 0.14, 4, 8), toon('#2a1d1a')); lash.rotation.z = Math.PI/2; lash.position.set(e.position.x, e.position.y + 0.13, e.position.z + 0.03); head.add(lash); });
  // uniforme: ambo azul marino con cuello en V y polera negra de manga larga debajo
  const vneck = new THREE.Mesh(extrude([[-0.3, 0.0], [0.3, 0.0], [0, -0.55]], 0.02), toon('#1e1e26')); vneck.position.set(0, -0.76, 0.62); vneck.rotation.x = -0.32; p.add(vneck);
  p.traverse(o => { if (o.isMesh && o.geometry.type === 'TorusGeometry') o.visible = false; });   // sin cuello blanco
  for (const side of ['R', 'L']) { u.arms[side].fo.material = toon('#1e1e26'); }
  if (clinical) {   // gorro clínico estampado + lentes de protección
    const capM = toon('#e9e4ef'); const cap = new THREE.Mesh(new THREE.SphereGeometry(1.2, 40, 20, 0, Math.PI*2, 0, 1.2), capM); cap.rotation.x = -0.3; cap.position.y = 0.12; head.add(cap);
    for (let i = 0; i < 40; i++) { const a = i*2.4, b = 0.2 + (i % 7)*0.13; const dot = new THREE.Mesh(new THREE.CircleGeometry(0.07, 12), toon(['#e58aa0', '#7a9cc6', '#9a7ab8'][i % 3]));
      const v = new THREE.Vector3(Math.sin(b)*Math.sin(a), Math.cos(b), Math.sin(b)*Math.cos(a)).multiplyScalar(1.215);
      dot.position.copy(v).add(new THREE.Vector3(0, 0.12, 0)); dot.lookAt(v.clone().multiplyScalar(3)); if (v.z > -0.3) head.add(dot); }
    const band = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.05, 8, 40), toon("#2fae5a")); band.rotation.x = Math.PI/2 - 0.35; band.position.set(0, 0.4, -0.05); head.add(band);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.34, 0.04), new THREE.MeshBasicMaterial({color: '#cfe8f5', transparent: true, opacity: 0.45}));
    glass.material.userData.noOutline = true; glass.position.set(0, 0.1, 0.98); head.add(glass);
    const frame = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.02, 6, 30), toon('#d8d8de')); frame.scale.set(1, 0.33, 1); frame.position.set(0, 0.1, 0.99); head.add(frame);
  }
  return p;
}

// Dra. Verónica: abre el video negando con la cabeza y cierra detrás de la paciente (versión clínica)
const vIntro = makeVeronica(false); vIntro.position.set(-24, 0, 0); add(vIntro);
{ const h = vIntro.userData.arms.R.hand; h.scale.set(1.1, 1.35, 0.7); }   // mano abierta (palma)
const vEnd = makeVeronica(true); vEnd.position.set(1.05, 0.2, -1.9); vEnd.rotation.y = -0.25; add(vEnd);

const VEND = B[1][0] - 0.05;
const person = makePerson({skin: COL.skin, hair: '#4a2f24', shirt: '#f2b630', bun: true, long: true});
person.position.set(-0.6, -0.3, -6); add(person);
{ const mouthT = person.userData.mouth;
  for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.02), mMetal); b.position.set(-0.2 + i*0.08, 0.03, 0.035); mouthT.add(b);
    const l = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.008, 6, 14), toon(LIG_COLORS[i])); l.position.set(-0.2 + i*0.08, 0.03, 0.045); mouthT.add(l); }
  const w = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.5, 6), toon('#dfe5ec')); w.rotation.z = Math.PI/2; w.position.set(0, 0.03, 0.05); mouthT.add(w); }
function star4() { const s = new THREE.Shape(); const R=.2, r=.05;
  for (let i=0;i<8;i++){const a=i*Math.PI/4+Math.PI/2; const rr=i%2?r:R; i?s.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):s.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);} return s; }
const mStar = new THREE.MeshBasicMaterial({color:'#ffffff'}); mStar.userData.id = idCounter++;
const sparkles = [[-1.0,0.9],[1.1,1.0],[0.2,1.4],[-1.4,-0.2],[1.5,-0.1]].map(([x,y]) => { const m = new THREE.Mesh(new THREE.ShapeGeometry(star4()), mStar); scene.add(m); m.userData.p = [x, y]; return m; });
// lámpara de luz azul (instalación)
const wand = new THREE.Group();
{ const body = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.19, 2.0, 24), toon('#2b2d42')); body.position.y = 1.2; wand.add(body);
  const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.08, 20), toon('#9fd0ff')); tip.position.y = 0.16; wand.add(tip);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.7, 28, 1, true), new THREE.MeshBasicMaterial({color:'#5aa9ff', transparent:true, opacity:.35, blending:THREE.AdditiveBlending, depthWrite:false}));
  cone.material.userData.noOutline = true; cone.position.y = -0.2; wand.add(cone); wand.userData.cone = cone; }
add(wand, frontScene);

__OUTLINE__

// ------------------------------------------------ cámara
const CAM = [
  [0.0,  [0.0, -0.25, 6.2], [0, -0.2, 0]],
  [2.45, [0.2, -0.25, 5.8], [0, -0.2, 0]],
  [3.4,  [hero.cx + 0.25, -0.05, 1.9], [hero.cx, -0.07, hero.zf]],        // primer plano del incisivo
  [12.9, [hero.cx + 0.1, -0.05, 1.55], [hero.cx, -0.07, hero.zf]],
  [21.6, [hero.cx - 0.15, -0.02, 1.5], [hero.cx, -0.07, hero.zf]],
  [26.3, [hero.cx - 0.1, -0.05, 1.8], [hero.cx, -0.07, hero.zf]],
  [28.0, [0.0, -0.2, 5.8], [0, -0.15, 0]],                                // toda la arcada con ligas
  [30.3, [0.0, -0.2, 5.8], [0, -0.15, 0]],
  [35.3, [0.0, -0.95, 7.0], [0, -0.75, 0]],                                // arriba y abajo                                // arriba y abajo
  [40.3, [0.0, -0.95, 7.0], [0, -0.75, 0]],
  [40.35,[0.25, -0.2, 9.4], [0.25, -0.75, 0]],                                   // paciente sonriendo
  [46.5, [0.25, -0.25, 8.8], [0.25, -0.75, 0]],
];
function cameraAt(t) {
  let i = 0; while (i < CAM.length - 2 && t > CAM[i+1][0]) i++;
  const [t0, p0, g0] = CAM[i], [t1, p1, g1] = CAM[i+1]; const k = (t1 - t0) < 0.1 ? 1 : eio(seg(t, t0, t1));
  camera.position.set(lerp(p0[0],p1[0],k) + 0.03*Math.sin(t*0.7), lerp(p0[1],p1[1],k) + 0.02*Math.sin(t*0.53), lerp(p0[2],p1[2],k));
  camera.lookAt(lerp(g0[0],g1[0],k), lerp(g0[1],g1[1],k), lerp(g0[2],g1[2],k));
  if (t >= 30.4 && t < 35.3) {            // órbita alrededor de la muela sola
    const k2 = eio(seg(t, 30.4, 35.2)); const a = lerp(-1.0, 0.5, k2), r = lerp(3.3, 2.7, k2), y = lerp(0.7, -0.25, k2);
    camera.position.set(30 + Math.sin(a)*r, y, Math.cos(a)*r); camera.lookAt(30, -0.05, 0.12);
  }
  camera.updateMatrixWorld();
}

// ------------------------------------------------ DOM
const $ = id => document.getElementById(id);
const capEl = $('caption'), lblEl = $('labels');
function captionAt(t) {
  const c = CHUNKS.find(c => t >= c.t0 && t < c.t1);
  if (!c || remap(t) > 41.75) { capEl.innerHTML = ''; return; }
  capEl.innerHTML = c.idx.map(i => { const w = c.words[i]; const k = eout(seg(t, c.times[i] - 0.04, c.times[i] + 0.1));
    const hi = HI[c.li].includes(w); const col = hi ? (RED.has(c.li) ? '#e2483d' : '#0f8f86') : '';
    return `<span style="opacity:${k};transform:translateY(${(1-k)*26}px) scale(${0.92+0.08*k});${col ? 'color:'+col : ''}">${w}</span>`; }).join('');
}
const v3 = new THREE.Vector3();
const tSlot = remap(wordTime(4, 'slot')), tArco = remap(wordTime(5, 'arco')), tAletas = remap(wordTime(6, 'aletas')), tLigas = remap(wordTime(7, 'ligas')), tTubo = remap(wordTime(8, 'tubo')), tBracket = remap(wordTime(2, 'bracket'));
window.WT = {tBracket, tSlot, tArco, tAletas, tLigas, tTubo};
window.MAP = MAP;
const LABELS = [ // t0,t1,texto, objeto, punto local, color
  [tBracket, 7.0, 'BRACKET', () => heroBr, [0.0, 0.34, 0.12], '#1d1b2a'],
  [tSlot, tArco - 0.1, 'SLOT', () => heroBr, [0.0, 0.34, 0.12], '#0f8f86'],
  [tArco, tAletas - 0.1, 'ARCO', () => heroBr, [0.0, 0.34, 0.12], '#1d1b2a'],
  [tAletas, 22.0, 'ALETAS', () => heroBr, [0.0, 0.34, 0.12], '#c98a00'],
  [tLigas, 30.2, 'LIGAS', () => heroBr, [0.0, 0.34, 0.12], '#e84393'],
  [tTubo, 35.2, 'TUBO MOLAR', () => solo, [0.0, -0.22, 0.6], '#1d1b2a'],
];
function labelsAt(t) {
  let html = '';
  for (const [a, b, txt, obj, p, col] of LABELS) { const o = vis(t, a - 0.05, b, .2); if (o <= 0) continue;
    v3.set(...p); obj().localToWorld(v3); v3.project(camera);
    html += `<div class="lbl" style="left:${(v3.x*.5+.5)*1080}px;top:${(-v3.y*.5+.5)*1920}px;opacity:${o};color:${col}"><i></i>${txt}</div>`; }
  lblEl.innerHTML = html;
}
const pop = (el, k) => { el.style.opacity = clamp01(k); el.style.transform = `translateX(-50%) scale(${Math.max(0.01, eback(clamp01(k)))})`; };

// ------------------------------------------------ línea de tiempo
function frame(f) {
  const tr = f / FPS, t = remap(tr);
  cameraAt(t);
  if (tr < B[2][0]) {                        // gancho: la cámara se acerca a cada grupo de dientes
    const GX = [[0.0, -0.1, 4.1], [0.95, -0.1, 3.9], [1.3, -0.1, 3.8]];
    const gi2 = GROUPS.findIndex((g, i) => tr >= g[0] - 0.2 && tr < (GROUPS[i+1] ? GROUPS[i+1][0] - 0.2 : GEND));
    let px = 0, py = -0.25, pz = 6.2, k = 0;
    if (gi2 >= 0) { const s0 = GROUPS[gi2][0] - 0.2, e0 = GROUPS[gi2+1] ? GROUPS[gi2+1][0] - 0.2 : GEND;
      k = eio(seg(tr, s0, s0 + 0.6)) * (gi2 === GROUPS.length - 1 ? 1 - eio(seg(tr, e0 - 0.5, e0)) : 1); }
    const prev = gi2 > 0 ? GX[gi2-1] : [0, -0.25, 6.2], cur = gi2 >= 0 ? GX[gi2] : prev;
    const from = gi2 > 0 && gi2 < GROUPS.length ? prev : [0, -0.25, 6.2];
    px = lerp(from[0], cur[0], k); py = lerp(from[1], cur[1], k); pz = lerp(from[2], cur[2], k);
    if (gi2 === GROUPS.length - 1 && tr > GEND - 0.5) { const k3 = eio(seg(tr, GEND - 0.5, GEND)); px = lerp(cur[0], 0, k3); py = lerp(cur[1], -0.25, k3); pz = lerp(cur[2], 6.2, k3); }
    camera.position.set(px + 0.03*Math.sin(t*0.7), py, pz); camera.lookAt(px, -0.15, 0); camera.updateMatrixWorld();
  }
  // 0) Dra. Verónica: "no son todos iguales" (niega con la cabeza y el dedo)
  vIntro.visible = tr < VEND + 0.05;
  if (vIntro.visible) { const u = vIntro.userData, sh = seg(tr, 0.45, 0.7)*(1 - seg(tr, 1.95, 2.25));
    vIntro.scale.setScalar(Math.max(0.01, eback(seg(tr, 0, 0.4))));
    u.head.rotation.y = 0.38*Math.sin(tr*10)*sh; u.head.rotation.z = 0.05*Math.sin(tr*5)*sh;
    const raise = eout(seg(tr, 0.2, 0.55));
    u.arms.R.set(new THREE.Vector3(-1.35, lerp(-1.75, -1.35, raise), 0.3), new THREE.Vector3(lerp(-1.12, -0.85, raise) + 0.16*Math.sin(tr*13)*sh, lerp(-2.4, -0.55, raise), lerp(0.35, 0.85, raise)));
    const bl = (tr % 2.3) > 2.18; u.eyes.forEach(e => e.scale.y = bl ? 0.15 : 1.2);
    camera.position.set(-24 + 0.04*Math.sin(tr), -0.2, 6.6 - 0.5*eio(seg(tr, 0, VEND))); camera.lookAt(-24, -0.55, 0); camera.updateMatrixWorld(); }
  const sPerson = t >= 40.35;
  vEnd.visible = sPerson;
  if (sPerson) { const u = vEnd.userData, k = eback(seg(t, 40.6, 41.1));
    vEnd.scale.setScalar(Math.max(0.01, k)); u.head.rotation.z = -0.06 + 0.04*Math.sin(t*2);
    u.arms.L.set(new THREE.Vector3(1.35, -1.45, 0.35), new THREE.Vector3(1.05 , -0.75 + 0.05*Math.sin(t*4), 0.75)); }
  const sSolo = t >= 30.4 && t < 35.3; solo.visible = sSolo;
  upper.grp.visible = lower.grp.visible = lip.visible = !sPerson && !sSolo; person.visible = sPerson;
  person.position.z = sPerson ? 0 : -6;

  // 1) gancho: cada diente lleva un bracket distinto
  const gI = GROUPS.findIndex((g, i) => tr >= g[0] && tr < (GROUPS[i+1] ? GROUPS[i+1][0] : GEND));
  const gS = gI >= 0 ? GROUPS[gI][0] : 0, gE = gI >= 0 ? (GROUPS[gI+1] ? GROUPS[gI+1][0] : GEND) : 0;
  const gK = gI >= 0 ? eout(seg(tr, gS, gS + 0.35)) * (1 - eio(seg(tr, gE - 0.3, gE))) : 0;
  if (t < 2.45) { const tg = $('typeTag'); if (gI >= 0) tg.textContent = GROUPS[gI][2]; pop(tg, gK);
    upper.wire.visible = false; upper.teeth.forEach(tt => { if (tt.lig) tt.lig.visible = false; if (tt.br) tt.br.visible = true; });
  } else $('typeTag').style.opacity = 0;
  // 2–7) armado sobre el incisivo central
  const building = t >= 2.45 && t < 26.6;
  upper.teeth.forEach(tt => { if (tt.br && tt !== hero && t >= 2.45) tt.br.visible = t >= 26.6; if (tt.tube) tt.tube.visible = t < 2.45 || t >= 29.0; });
  if (building) {
    // el bracket llega y se pega
    const land = seg(t, 3.0, 4.6); heroBr.visible = t > 3.0;
    heroBr.position.set(0, -0.06 + 0.9*(1 - eout(land)), 0.05 + 1.2*(1 - eout(land))); heroBr.rotation.z = (1 - eout(land))*1.2;
    const squash = pulse(t, 4.55, 4.85); heroBr.scale.set(0.85*(1 + 0.12*squash), 0.85*(1 - 0.12*squash), 0.85);
  } else { heroBr.position.set(0, -0.06, 0.05); heroBr.rotation.z = 0; heroBr.scale.setScalar(0.85); }
  heroBr.rotation.x = 0;
  if (t < 2.45) upper.teeth.forEach((tt, i) => { const on = gI >= 0 && GROUPS[gI][1].includes(tt.kind);
    const wave = 0.8*pulse(tr, 2.55 + i*0.15, 3.0 + i*0.15);   // "cada diente lleva el suyo": ola de izquierda a derecha
    const k = on ? gK : 0, dim = gI >= 0 && !on ? gK : 0;           // la pieza nombrada sobresale; las demás se achican
    const o = tt.br || tt.tube, base = tt.br ? 0.85 : 1;
    o.scale.setScalar(base*(1 + 0.3*wave + 0.15*k - 0.12*dim));
    o.position.z = (tt.br ? 0.05 : 0.04) + 0.12*wave + 0.06*k;
    tt.halo.visible = k > 0.01; tt.halo.material.opacity = 0.55*k; tt.halo.scale.setScalar(1 + 0.25*k); tt.halo.position.z = 0.03; });
  else upper.teeth.forEach(tt => { tt.halo.visible = false; if (tt.tube) { tt.tube.scale.setScalar(1); tt.tube.position.set(0, -0.06, 0.04); tt.tube.rotation.x = 0; } if (tt.br && tt !== hero) { tt.br.scale.setScalar(0.85); tt.br.position.set(0, -0.06, 0.05); tt.br.rotation.x = 0; } });
  // pieza ampliada que sale al frente, sobre la fila, para distinguir su forma
  DISP.forEach((d, i) => { const k = i === gI && t < 2.45 ? gK : 0; d.visible = k > 0.01; if (!d.visible) return;
    const fw = new THREE.Vector3(); camera.getWorldDirection(fw);
    d.position.copy(camera.position).addScaledVector(fw, 2.0); d.position.y += 0.43;
    d.quaternion.copy(camera.quaternion); d.rotateY(0.45*Math.sin(tr*1.8)); d.rotateX(0.12);
    d.scale.setScalar(Math.max(0.01, eback(k))*0.95); });
  // 3) "no hace nada": el diente intenta moverse y no puede
  hero.g.rotation.z = 0.04*Math.sin(t*18)*pulse(t, 7.4, 8.8);
  // 4) slot brilla
  mSlot.emissiveIntensity = 0.9*Math.max(pulse(t, tSlot - 0.5, tSlot + 1.2), 0) ;
  // 5) arco entra por el slot; 7) se sale y vuelve sujeto por la liga
  const wireIn = seg(t, 13.2, 16.2);
  const popOut = pulse(t, 22.0, 24.6);
  upper.wire.visible = t >= 2.45 && t > 13.2;
  upper.wire.geometry.setDrawRange(0, Math.round(400*wireIn)*96);
  upper.wire.position.set(0, 0.13*popOut*(t < 23.4 ? 1 : 1 - seg(t, 23.4, 24.6)), 0.06*popOut);
  // 6) aletas brillan una por una
  heroBr.userData.wings.forEach((w, i) => { w.material = mWingGlow; });
  mWingGlow.emissiveIntensity = 0.85*Math.max(...[0,1,2,3].map(i => pulse(t, 17.6 + i*0.45, 18.4 + i*0.45)), pulse(t, tAletas - 0.2, tAletas + 0.9));
  // 7) la liga se engancha en el incisivo, luego en todos y cambian de color
  const ligK = seg(t, 23.3, 24.1);
  heroLig.visible = t > 23.3; heroLig.scale.set(heroLig.userData.sx*(1 + 1.2*(1 - eout(ligK))), 1.25*(1 + 1.2*(1 - eout(ligK))), 1);
  upper.teeth.forEach((tt, i) => { if (!tt.lig || tt === hero) return; const k = seg(t, 26.8 + i*0.12, 27.2 + i*0.12); tt.lig.visible = k > 0; tt.lig.scale.set(tt.lig.userData.sx*(2 - eback(k)), 1.25*(2 - eback(k)), 1); });
  [upper, lower].forEach(a => a.teeth.forEach((tt, i) => { if (!tt.lig) return;
    const shift = t > 28.4 ? Math.floor((t - 28.4) / 0.35) : 0; tt.lig.material.color.set(LIG_COLORS[(i + shift) % LIG_COLORS.length]); }));
  // 8) tubo molar brilla
  solo.userData.cyl.scale.setScalar(1 + 0.15*pulse(t, tTubo - 0.3, tTubo + 0.7));
  // 9) arriba y abajo: la arcada inferior recibe sus brackets
  lower.teeth.forEach((tt, i) => { const k = seg(t, 37.9 + i*0.12, 38.3 + i*0.12);
    if (tt.br) { tt.br.visible = k > 0; tt.br.scale.setScalar(0.85*Math.max(0.01, eback(k))); tt.lig.visible = k > 0.8; }
    if (tt.tube) tt.tube.visible = k > 0; });
  lower.wire.visible = t > 38.9; lower.wire.geometry.setDrawRange(0, Math.round(400*eio(seg(t, 38.9, 39.6)))*96);
  pop($('ses1'), vis(t, 35.6, 40.2, .3)); pop($('ses2'), vis(t, 37.7, 40.2, .3));
  // lámpara (pegado con luz azul) en la escena 2
  wand.visible = inW(t, 4.3, 6.6);
  if (wand.visible) { const k = eio(seg(t, 4.3, 4.9)), o = eio(seg(t, 6.1, 6.6)); upper.grp.updateMatrixWorld(true);
    const aim = heroBr.localToWorld(new THREE.Vector3(0, 0, 0.1));
    wand.rotation.z = -0.5; wand.position.set(aim.x + 0.22 + (1 - k)*1.2 + o*1.5, aim.y + 0.4 + (1 - k)*1.5 + o*1.5, aim.z + 0.15);
    wand.userData.cone.material.opacity = 0.45*pulse(t, 4.9, 6.1); }
  // paciente con brackets + destellos
  if (sPerson) { const u = person.userData; u.head.rotation.z = 0.05*Math.sin(t*1.6);
    u.arms.R.set(new THREE.Vector3(-1.15, -1.7, 0.15), new THREE.Vector3(-1.1, -2.4, 0.35)); u.arms.L.set(new THREE.Vector3(1.15, -1.7, 0.15), new THREE.Vector3(1.1, -2.4, 0.35));
    const bl = (t % 2.1) > 1.97; u.eyes.forEach(e => e.scale.y = bl ? 0.15 : 1.2); }
  sparkles.forEach((sp, i) => { const k = pulse(t, 40.6 + i*0.12, 41.8 + i*0.1); sp.visible = sPerson && k > 0.01;
    sp.position.set(sp.userData.p[0], sp.userData.p[1], 1.2); sp.scale.setScalar(Math.max(.01, k*1.3)); sp.rotation.z = t*1.5; sp.lookAt(camera.position); });
  // cierre
  $('flash').style.opacity = Math.max((tr >= VEND && tr < VEND + 0.2) ? 0.8*(1 - (tr - VEND)/0.2) : 0, ...[2.45, 28.0, 30.4, 35.3, 40.35].map(c => (t >= c && t < c + 0.2) ? 0.8*(1 - (t - c)/0.2) : 0));
  const ck = seg(t, 41.8, 42.4); $('cta').style.opacity = eio(ck);
  const q = eback(seg(t, 42.1, 42.7)), lg = eback(seg(t, 42.5, 43.3)), bt = eback(seg(t, 43.2, 43.8));
  $('ctaq').style.opacity = clamp01(q); $('ctaq').style.transform = `translateY(${(1-q)*50}px)`;
  $('ctalogo').style.opacity = clamp01(lg*1.2); $('ctalogo').style.transform = `scale(${0.85 + 0.15*lg})`;
  $('ctabtn').style.opacity = clamp01(bt); $('ctabtn').style.transform = `scale(${Math.max(0.01, bt)})`;
  captionAt(tr); labelsAt(t); renderAll();
}
window.TOTAL_FRAMES = Math.round(DURATION * FPS);
window.renderFrame = f => { frame(f); return true; };
window.GPU = (() => { try { const g = document.createElement('canvas').getContext('webgl2'); const e = g.getExtension('WEBGL_debug_renderer_info'); return e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER); } catch (e) { return 'desconocido'; } })();
document.fonts.ready.then(() => { window.READY = true; });
