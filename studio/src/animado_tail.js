// ===================================================== reproductor de planes · estilo Animado 3D
const $ = id => document.getElementById(id);
const capEl = $('caption'), v3 = new THREE.Vector3();
const months = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
$('calg').innerHTML = months.map((m, i) => `<div class="m" id="mo${i}">${m}<em></em><b>✦</b></div>`).join('');
const pop = (el, k) => { el.style.opacity = clamp01(k); el.style.transform = `scale(${Math.max(0.01, eback(clamp01(k)))})`; };
['meals', 'tagSoft', 'tagHard', 'moon', 'stars', 'labels'].forEach(id => { const el = $(id); if (el) el.style.display = 'none'; });
const ROWV = new Set(['dientes', 'restos', 'placa', 'sarro', 'cepillado', 'limpieza', 'brillo', 'reloj', 'calendario', 'pregunta']);
const CAMS = {
  persona: [[0.1, 0.15, 5.6], [0.0, 0.1, 5.0], [0, -0.3, 0]],
  row: [[0.2, -0.55, 6.7], [-0.1, -0.5, 5.9], [0, -0.32, 0]],
  rowLow: [[0.0, -0.95, 7.2], [0.0, -0.9, 6.8], [0, -0.6, 0]],
  caries: [[0.5, -0.3, 7.6], [0.3, -0.2, 7.0], [0, -0.85, 0]],
  doctora: [[0.0, 0.3, 7.6], [0.1, 0.4, 6.6], [0, 0.15, 0]],
};
const camKey = v => v === 'persona' ? 'persona' : v === 'caries' ? 'caries' : v === 'doctora' ? 'doctora' : (v === 'calendario' || v === 'reloj' || v === 'pregunta') ? 'rowLow' : 'row';
let CAPS = [];
function onPlan(p, scn) {
  CAPS = scn.map(s => { const words = s.texto.split(/\s+/).filter(Boolean), hi = hiWords(s);
    const span = Math.min(s.dur*0.55, 0.28*words.length + 0.3);
    return {words, hi, times: words.map((w, i) => s.t0 + 0.15 + span*i/Math.max(1, words.length))}; });
  $('ctabtn').textContent = (p.cta && p.cta.boton) || 'Agenda tu evaluación';
}
function captionAt(t, s) {
  if (!s || s.visual === 'cta' || s.visual === 'pregunta') { capEl.innerHTML = ''; return; }
  const c = CAPS[s.i]; if (!c) return;
  const out = 1 - seg(t, s.t1 - 0.2, s.t1);
  capEl.innerHTML = c.words.map((w, i) => { const k = eout(seg(t, c.times[i] - 0.04, c.times[i] + 0.12))*out; const hi = c.hi.includes(clean(w));
    return `<span style="opacity:${k};transform:translateY(${(1-k)*26}px);${hi ? 'color:#0f8f86' : ''}">${w}</span>`; }).join('');
}
function resetAll() {
  person.visible = sunDisc.visible = slice.visible = dentist.visible = row.visible = false;
  brushSoft.visible = brushHard.visible = floss.visible = scaler.visible = cup.visible = lens.visible = ring.visible = false;
  crumbs.forEach(c => c.visible = false); bugs.forEach(b => b.visible = false); drops.forEach(d => d.visible = false); flakes.forEach(f => f.visible = false);
  gapCrumbs.forEach(c => c.visible = false); sparkles.forEach(s => s.visible = false); acid.forEach(a => a.visible = false); winkStar.visible = false; smallCaries.visible = false;
  teeth.forEach(tt => { tt.plaque.visible = tt.tartar.visible = tt.sub.visible = tt.stain.visible = false; });
  mEn.color.set(COL.enamel); mGum.color.set(COL.gum); gum.scale.y = 1; gum.position.y = 0;
  ['timer', 'calendar', 'cta', 'big'].forEach(id => $(id).style.opacity = 0); $('ching').style.opacity = 0;
  scene.background.copy(BG); hemi.intensity = 1.1; sun.intensity = 2.2;
}
const setPlaque = (tt, k) => { tt.plaque.visible = k > 0.02; tt.plaque.material.opacity = 0.9*k; const sy = 0.4 + 0.6*k; tt.plaque.scale.y = sy; tt.plaque.position.y = 0.45*(1 - sy); };
const setTartar = (tt, k) => { tt.tartar.visible = k > 0.02; const sy = Math.max(0.01, k); tt.tartar.scale.set(1, sy, 1); tt.tartar.position.y = 0.45*(1 - sy); };
const zOf = cx => -0.55*Math.pow(cx/1.6, 2);
function frame(f) {
  const t = f/FPS, s = sceneAt(t), lt = t - s.t0, d = s.dur, p = clamp01(lt/d), v = s.visual;
  resetAll();
  // cámara: un plano por escena, con acercamiento suave
  const [a, b, g] = CAMS[camKey(v)], k = eio(p);
  camera.position.set(lerp(a[0], b[0], k) + 0.04*Math.sin(t*0.7), lerp(a[1], b[1], k), lerp(a[2], b[2], k)); camera.lookAt(g[0], g[1], g[2]);
  $('flash').style.opacity = lt < 0.22 && s.i > 0 ? 0.8*(1 - lt/0.22) : 0;
  row.visible = ROWV.has(v);
  if (v === 'persona') { person.visible = sunDisc.visible = true; const u = person.userData, stroke = 0.13*Math.sin(2*Math.PI*2.6*t), mouthP = new THREE.Vector3(0, 0.03, 1.02);
    pBrush.position.set(mouthP.x - 0.24 + stroke, mouthP.y, mouthP.z); const hand = new THREE.Vector3(pBrush.position.x - 0.62, mouthP.y - 0.02, mouthP.z - 0.02);
    u.arms.R.set(new THREE.Vector3(-1.55, -1.05, 0.55), hand); u.arms.L.set(new THREE.Vector3(1.15, -1.7, 0.15), new THREE.Vector3(1.1, -2.4, 0.35));
    u.head.rotation.z = 0.05*Math.sin(2*Math.PI*1.3*t); u.head.rotation.x = 0.05; const bl = (t % 2.4) > 2.25; u.eyes.forEach(e => e.scale.y = bl ? 0.15 : 1.2);
    foam.forEach((fb, i) => { const kk = seg(lt, 0.6 + i*0.12, 1.0 + i*0.12); fb.visible = kk > 0; fb.position.set(-0.22 + (i%5)*0.11 + 0.02*Math.sin(t*5 + i), -0.12 + ((i*7)%3)*0.05, 0.98 + (i%2)*0.04); fb.scale.setScalar(Math.max(.01, kk)); });
    sunDisc.position.y = 1.0 + 0.8*eout(seg(lt, 0, 2.5)); }
  if (v === 'restos' || v === 'placa') { const kin = seg(lt, 0.2, 1.4);
    crumbs.forEach((c, i) => { const kk = eback(clamp01(kin*1.6 - i*0.09)); c.visible = kk > 0.01; c.scale.setScalar(Math.max(0.01, kk)); c.rotation.set(t + i, t*0.7, 0); }); }
  if (v === 'placa' || v === 'pregunta') { const kp = v === 'pregunta' ? 0.6 : eout(seg(lt, 0.6, 2.0));
    teeth.forEach(tt => setPlaque(tt, kp));
    bugs.forEach((bg, i) => { const kk = v === 'pregunta' ? 0 : seg(lt, 0.4 + i*0.06, 0.8 + i*0.06); bg.visible = kk > 0.01; const tt = teeth[i % 6], an = t*1.3 + i*1.9;
      bg.position.set(tt.cx + 0.12*Math.cos(an), 0.05 + 0.14*Math.sin(an*1.2) - 0.1*(i%2), 0.3 + zOf(tt.cx)); bg.rotation.z = an*2; bg.scale.setScalar(Math.max(.01, kk)); }); }
  if (v === 'sarro') { teeth.forEach((tt, i) => { setPlaque(tt, 1 - seg(lt, 0.8, 1.6)); setTartar(tt, seg(lt, 0.8 + i*0.1, 1.8 + i*0.1)); }); mEn.color.set('#ece0c4'); }
  if (v === 'cepillado' || v === 'reloj') { const pp = seg(lt, 0.3, d - 0.4), idx = Math.min(5, Math.floor(pp*6));
    teeth.forEach((tt, i) => setPlaque(tt, 1 - seg(pp, i/6, (i + 0.8)/6)));
    brushSoft.visible = true; brushSoft.scale.setScalar(0.9); brushSoft.quaternion.copy(Q_TILT).multiply(Q_TEETH);
    const tt = teeth[idx]; brushSoft.position.set(tt.cx - 0.22 + 0.07*Math.cos(t*12), -0.16 + 0.06*Math.sin(t*12), zOf(tt.cx) + 0.36); }
  if (v === 'reloj') { pop($('timer'), seg(lt, 0.1, 0.5)*(1 - seg(lt, d - 0.3, d)));
    const tp = seg(lt, 0.4, d - 0.4); $('timerArc').setAttribute('stroke-dashoffset', 653*(1 - tp)); const secs = Math.round(tp*120); $('timerTxt').textContent = `${Math.floor(secs/60)}:${String(secs%60).padStart(2, '0')}`; }
  if (v === 'limpieza') { const pp = seg(lt, 0.4, d - 0.4), idx = Math.min(5, Math.floor(pp*6));
    teeth.forEach((tt, i) => setTartar(tt, 1 - seg(pp, i/6, (i + 0.8)/6)));
    scaler.visible = true; scaler.rotation.set(0, 0, 0.5); const tt = teeth[idx]; scaler.position.set(tt.cx + 0.05*Math.sin(t*18), 0.12 + 0.05*Math.cos(t*18), 0.5 + zOf(tt.cx));
    flakes.forEach((fl, i) => { const life = (t*1.5 + i*0.1) % 1; fl.visible = pp > 0 && pp < 1; fl.position.set(tt.cx + Math.cos(i*2.4)*life*0.8, 0.1 + life*0.7 - life*life*1.4, 0.6 + Math.sin(i)*0.3); fl.scale.setScalar(1 - life); }); }
  if (v === 'brillo' || v === 'dientes' || v === 'calendario') { const sk = v === 'dientes' ? 0.5 : 1;
    sparkles.forEach((sp, i) => { const kk = Math.sin(Math.PI*seg(lt, 0.3 + i*0.12, Math.min(d, 2.4) + i*0.12))*sk; sp.visible = kk > 0.01; sp.scale.setScalar(Math.max(.01, kk*1.4)); sp.rotation.z = t*1.4; }); }
  if (v === 'brillo') { cup.visible = lt < d*0.5; if (cup.visible) { const tt = teeth[Math.min(5, Math.floor(seg(lt, 0.1, d*0.5)*6))]; cup.scale.setScalar(0.6); cup.rotation.set(0.5, 0, -0.6);
    cup.position.set(tt.cx + 0.06*Math.sin(t*10), -0.12 + 0.04*Math.cos(t*10), 0.5 + zOf(tt.cx)); } }
  if (v === 'caries') { slice.visible = true; const sc = lerp(0.25, 1.7, eio(seg(lt, 0.4, d - 0.3)));
    if (cariesMesh) { sIn.remove(cariesMesh); cariesMesh.geometry.dispose(); }
    cariesMesh = new THREE.Mesh(extrude(cariesPoly(sc, t*2), 0.01), mCar); cariesMesh.position.z = SD + 0.004; sIn.add(cariesMesh);
    acid.forEach((ac, i) => { const life = (t*0.9 + i*0.125) % 1; ac.visible = true; ac.position.set(-0.25 + (i%4)*0.17, 2.3 - life*1.25, 0.5); ac.scale.set(1, 1.3, 1).multiplyScalar(1 - 0.6*life); });
    slice.rotation.y = -0.16 + 0.05*Math.sin(t*0.4); }
  if (v === 'doctora') { dentist.visible = true; const u = dentist.userData, w = Math.sin(Math.PI*seg(lt, d*0.45, d*0.45 + 0.6));
    u.eyes[1].scale.y = 1.25 - 1.15*w; u.eyes[1].userData.shine.visible = w < 0.3; u.head.rotation.z = -0.08*w;
    const wave = Math.sin(t*9)*seg(lt, 0.3, 0.6);
    const hnd = new THREE.Vector3(-1.25 + 0.12*wave, 0.2 + 0.05*Math.sin(t*3), 0.75); u.arms.R.set(new THREE.Vector3(-1.62, -1.15, 0.3), hnd);
    u.arms.L.set(new THREE.Vector3(1.15, -1.7, 0.15), new THREE.Vector3(1.1, -2.4, 0.35));
    dTool.position.set(hnd.x, hnd.y + 0.84, hnd.z); dTool.rotation.set(0, 0, Math.PI + 0.12); dTool.visible = false;
    v3.set(0.33, 0.12, 0.9); u.head.localToWorld(v3); winkStar.position.copy(v3).add(new THREE.Vector3(0.28, 0.25, 0.3));
    const sk = Math.sin(Math.PI*seg(lt, d*0.47, d*0.47 + 0.9)); winkStar.visible = sk > 0.02; winkStar.scale.setScalar(Math.max(.01, 1.6*sk)); winkStar.rotation.z = t*3; winkStar.lookAt(camera.position); }
  if (v === 'calendario') { pop($('calendar'), seg(lt, 0.1, 0.5)*(1 - seg(lt, d - 0.3, d))); $('calh').textContent = s.destacar ? s.destacar.charAt(0).toUpperCase() + s.destacar.slice(1) : 'Tu próximo control';
    [[2, 0.8], [8, 1.6]].forEach(([mi, at]) => { const el = $('mo' + mi), kk = seg(lt, at, at + 0.35); el.querySelector('em').style.opacity = kk; el.querySelector('b').style.opacity = kk; el.style.background = kk > 0.5 ? '#d6f0ec' : '#f5efe3'; }); }
  if (v === 'pregunta') { const kk = eback(seg(lt, 0.1, 0.6)); const bg = $('big'); bg.style.opacity = clamp01(seg(lt, 0.1, 0.4))*(1 - seg(lt, d - 0.25, d)); bg.style.transform = `scale(${0.8 + 0.2*kk})`;
    const hi = hiWords(s); bg.innerHTML = s.texto.split(/\s+/).map(w => `<span style="${hi.includes(clean(w)) ? 'color:#e2483d' : ''}">${w}</span>`).join(' '); }
  if (v === 'cta') { const ck = seg(lt, 0, 0.5); $('cta').style.opacity = eio(ck);
    const q = eback(seg(lt, 0.2, 0.8)), lg = eback(seg(lt, 0.6, 1.4)), bt = eback(seg(lt, 1.2, 1.8));
    $('ctaq').textContent = s.texto; $('ctaq').style.opacity = clamp01(q); $('ctaq').style.transform = `translateY(${(1-q)*50}px)`;
    $('ctalogo').style.opacity = clamp01(lg*1.2); $('ctalogo').style.transform = `scale(${0.85 + 0.15*lg})`;
    $('ctabtn').style.opacity = clamp01(bt); $('ctabtn').style.transform = `scale(${Math.max(0.01, bt)})`; }
  captionAt(t, s); renderAll();
}
// miniaturas del storyboard: los elementos de la interfaz (temporizador, calendario, cierre) se dibujan encima del 3D
const ctaImg = $('ctalogo');
function SNAP_OVER(x, t) { const s = sceneAt(t), v = s.visual; x.textAlign = 'center'; x.textBaseline = 'middle';
  if (v === 'cta') { x.fillStyle = '#f5efe3'; x.fillRect(0, 0, 1080, 1920); x.fillStyle = '#1d1b2a'; x.font = '800 70px Inter'; wrapText(x, s.texto, 540, 560, 900, 84);
    try { x.drawImage(ctaImg, 130, 760, 820, 820*ctaImg.naturalHeight/Math.max(1, ctaImg.naturalWidth)); } catch (e) {}
    x.fillStyle = '#2f5f86'; x.beginPath(); x.roundRect(170, 1300, 740, 150, 75); x.fill(); x.fillStyle = '#fff'; x.font = '800 58px Inter'; x.fillText($('ctabtn').textContent, 540, 1378); }
  if (v === 'pregunta') { x.fillStyle = '#1d1b2a'; x.font = '900 96px Inter'; wrapText(x, s.texto, 540, 520, 920, 110); }
  if (v === 'reloj') { x.fillStyle = '#fff'; x.strokeStyle = '#1d1b2a'; x.lineWidth = 10; x.beginPath(); x.arc(540, 380, 128, 0, Math.PI*2); x.fill(); x.stroke(); x.fillStyle = '#1d1b2a'; x.font = '900 80px Inter'; x.fillText('2:00', 540, 380); }
  if (v === 'calendario') { x.fillStyle = '#fff'; x.strokeStyle = '#1d1b2a'; x.lineWidth = 6; x.beginPath(); x.roundRect(110, 180, 860, 640, 44); x.fill(); x.stroke();
    x.fillStyle = '#1d1b2a'; x.font = '900 54px Inter'; x.fillText($('calh').textContent || 'Tu próximo control', 540, 270); x.font = '700 38px DejaVu Sans Mono';
    months.forEach((m, i) => { const cx = 230 + (i%4)*205, cy = 400 + Math.floor(i/4)*130; if (i === 2 || i === 8) { x.strokeStyle = '#0f8f86'; x.lineWidth = 7; x.strokeRect(cx - 85, cy - 45, 170, 90); } x.fillText(m, cx, cy); }); }
  if (v !== 'cta' && v !== 'pregunta') { x.font = '800 64px Inter'; x.lineWidth = 14; x.strokeStyle = '#f5efe3'; x.fillStyle = '#1d1b2a';
    const words = s.texto.split(/\s+/); const tx = words.slice(0, 9).join(' ') + (words.length > 9 ? '…' : ''); x.save(); x.textBaseline = 'middle';
    const lines = []; let ln = ''; for (const w of tx.split(' ')) { const ts = ln ? ln + ' ' + w : w; if (x.measureText(ts).width > 940 && ln) { lines.push(ln); ln = w; } else ln = ts; } if (ln) lines.push(ln);
    lines.forEach((l, i) => { x.strokeText(l, 540, 1470 + i*76); x.fillText(l, 540, 1470 + i*76); }); x.restore(); } }
window.renderFrame = f => { frame(f); return true; };
window.GPU = 'webgl';
planSet(window.DEFAULT_PLAN);
document.fonts.ready.then(() => { window.READY = true; });
