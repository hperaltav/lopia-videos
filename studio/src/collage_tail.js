// ===================================================== reproductor de planes · estilo Collage de revista
let LOGO = null, CAPS = [];
function clearItems() { for (const it of ITEMS) { scene.remove(it.P.root); it.P.geo.dispose(); it.P.mat.dispose(); } ITEMS.length = 0; }
const short = (s, n) => { const w = String(s).split(/\s+/); return w.slice(0, n).join(' '); };
function buildFromPlan(scn) {
  clearItems(); if (!LOGO) return;
  scn.forEach((s, si) => {
    const T = s.t0 + 0.05, E = s.t1 + 0.1, d = s.dur, v = s.visual, hi = String(s.destacar || '').trim();
    if (v === 'persona') {
      item(once('clock', () => shape(520, 560, (ctx, w, h) => { ctx.fillStyle = '#e8476b'; [w/2 - 150, w/2 + 150].forEach(x => { ctx.beginPath(); ctx.arc(x, 110, 70, 0, Math.PI*2); ctx.fill(); });
        ctx.fillStyle = '#fbf8f0'; ctx.beginPath(); ctx.arc(w/2, 300, 210, 0, Math.PI*2); ctx.fill(); ctx.strokeStyle = '#e8476b'; ctx.lineWidth = 34; ctx.stroke();
        ctx.strokeStyle = INK; ctx.lineWidth = 16; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(w/2, 300); ctx.lineTo(w/2, 180); ctx.moveTo(w/2, 300); ctx.lineTo(w/2 + 90, 340); ctx.stroke(); })), 1.5,
        {x: -0.55, y: 1.25, r: -0.15, tin: T, tout: E - 0.3, fx: (t) => ({r: -0.15 + 0.08*Math.sin(t*40)*seg(t, T + 0.2, T + 1.2)*(1 - seg(t, T + 1.0, T + 1.4))})});
      item(once('brushS', () => brush(true)), 2.2, {x: 0.35, y: 0.1, r: 0.3, tin: T + 0.5, tout: E - 0.2, fx: (t) => ({x: 0.35 + 0.22*Math.sin(t*22)*seg(t, T + 0.8, T + 1.0)})});
    }
    if (['dientes', 'restos', 'placa', 'sarro', 'cepillado', 'limpieza'].includes(v)) item(once('strip', () => teethStrip()), 2.7, {x: 0, y: 0.45, tin: T, tout: E, layer: 1, seg: 30});
    if (v === 'dientes') [[-0.9, 1.45], [0.1, 1.75], [1.0, 1.4]].forEach(([x, y], i) => item(once('star', () => star()), 0.3, {x, y, r: i, tin: T + 0.6 + i*0.2, tout: E, layer: 6, seg: 6, fx: (t) => ({r: i + t*2})}));
    if (v === 'restos' || v === 'placa') [['#d9a35a', '#a8722f'], ['#5cb85c', '#3d8b3d'], ['#e8476b', '#b02a4a'], ['#d9a35a', '#a8722f'], ['#5cb85c', '#3d8b3d']].forEach(([c, k], i) =>
      item(once('crumb' + i, () => blob(c, k, 500 + i)), 0.28, {x: (toothX(i + 1) + toothX(i + 2))/2, y: 0.42 + (i % 2)*0.12, r: i, tin: T + 0.5 + i*0.15, tout: E, layer: 4, seg: 8, out: 'drop'}));
    if (v === 'placa') {
      [[-0.95, 1.7], [0.95, 1.6], [0.05, 2.05]].forEach(([x, y], i) => item(once('bact' + i, () => blob(['#7cc576', '#9b7ad6', '#f39c4a'][i], '#2e6b2a', 600 + i, true, 26)), 0.7,
        {x, y, r: (i - 1)*0.3, tin: T + 0.3 + i*0.2, tout: E, layer: 5, seg: 10, fx: (t) => ({y: y + 0.05*Math.sin(t*6 + i)})}));
      item(once('plaque', () => cutout(1000, 180, (ctx, w, h) => { paperFill(ctx, w, h, '#efe08a', 0.06); halftone(ctx, 0, 0, w, h, '#c9b24a', () => 0.4, 10, 0.4); }, {seed: 640, rough: 20, rim: '#efe08a', rimW: 0, margin: 14})), 2.5,
        {x: 0, y: 0.66, tin: T + 1.0, tout: E, layer: 3, seg: 20, fx: (t) => ({sx: 0.95, sy: 0.2 + 0.35*eout(seg(t, T + 1.0, T + 2.0))})});
    }
    if (v === 'sarro' || v === 'limpieza') for (let i = 0; i < 6; i++) { const tr = v === 'limpieza' ? T + 0.8 + (i/5)*(d - 1.4) : E;
      item(once('tar' + (i % 3), () => blob(['#c9a24a', '#b08a3a', '#d4b260'][i % 3], '#7a5a20', 950 + i)), 0.2,
        {x: toothX(i + 1), y: gumY(0.45), r: i, tin: v === 'sarro' ? T + 0.6 + i*0.12 : T, dur: v === 'sarro' ? 0.36 : 0.05, tout: tr, layer: 4, seg: 8, out: 'drop', dir: i % 2 ? 1 : -1}); }
    if (v === 'limpieza') item(once('scaler', () => scaler()), 1.6, {x: 0.6, y: 0.4, r: 0.35, tin: T + 0.3, tout: E, layer: 7, seg: 12,
      fx: (t) => { const k = seg(t, T + 0.8, s.t1 - 0.4); return {x: lerp(-0.45, 1.45, k) + 0.05*Math.sin(t*30), y: 0.7 + 0.04*Math.sin(t*30)}; }});
    if (v === 'cepillado') item(once('brushS', () => brush(true)), 1.9, {x: 0.6, y: 0.1, r: -1.35, tin: T + 0.2, tout: E, layer: 6,
      fx: (t) => ({x: lerp(-0.9, 1.0, seg(t, T + 0.5, s.t1 - 0.5)) + 0.07*Math.sin(t*28), y: 0.1 + 0.04*Math.sin(t*28)})});
    if (v === 'reloj') { item(once('hour', () => hourglass()), 1.3, {x: -0.45, y: 0.7, r: 0.1, tin: T + 0.1, tout: E, layer: 3, fx: (t) => ({r: 0.1 + Math.PI*eio(seg(t, T + d*0.5, T + d*0.5 + 0.8))})});
      item(once('brushS', () => brush(true)), 1.6, {x: 0.6, y: 0.9, r: -1.2, tin: T + 0.4, tout: E, layer: 4, fx: (t) => ({x: 0.6 + 0.08*Math.sin(t*25)})}); }
    if (v === 'brillo') { item(once('tHappy', () => bigTooth('happy')), 1.7, {x: 0, y: 0.75, tin: T, tout: E, layer: 2});
      [[-0.85, 1.75], [0.2, 2.1], [1.0, 1.55]].forEach(([x, y], i) => item(once('star', () => star()), 0.34, {x, y, r: i, tin: T + 0.4 + i*0.2, tout: E, layer: 6, seg: 6, fx: (t) => ({r: i + t*2})})); }
    if (v === 'caries') { item(once('tSad', () => bigTooth('sad')), 1.9, {x: 0, y: 0.6, tin: T, tout: E, layer: 2});
      item(once('hole', () => blob('#3a2418', '#1a0e08', 800)), 0.6, {x: -0.25, y: 0.9, tin: T + 0.6, tout: E, layer: 4, seg: 10, fx: (t) => { const k = eout(seg(t, T + 0.6, s.t1 - 0.4)); return {sx: 0.3 + 0.9*k, sy: 0.3 + 0.9*k}; }}); }
    if (v === 'doctora') puppet(0, 0.1, T + 0.05, E, 1.45);
    if (v === 'calendario') { item(once('calE', () => calendar('ENERO', 12)), 1.25, {x: -0.6, y: 0.95, r: -0.12, tin: T + 0.2, tout: E, layer: 2, seg: 16});
      item(once('calJ', () => calendar('JULIO', 12)), 1.25, {x: 0.6, y: 0.75, r: 0.12, tin: T + 0.8, tout: E, layer: 3, seg: 16}); }
    if (v === 'pregunta') { item(once('news', () => newspaper(900, 1200)), 2.8, {x: 0, y: 0.35, r: -0.04, tin: T, tout: E, layer: 1, seg: 40, flat: 0.07});
      const wtxt = (hi || short(s.texto, 2)).toUpperCase().slice(0, 12); word(wtxt, 0, 0.75, Math.min(0.3, 2.6/Math.max(4, wtxt.length)), T + 0.3, E, {seed: si*3 + 1}); }
    if (v === 'cta') { item(once('banner', () => banner(LOGO)), 2.6, {x: 0, y: 0.85, r: -0.04, tin: T + 0.4, tout: 99, layer: 2, seg: 30});
      const bt = (PLAN.cta && PLAN.cta.boton) || 'Agenda tu evaluación', w = bt.split(/\s+/), half = Math.ceil(w.length/2);
      strip(w.slice(0, half).join(' '), 0, -0.35, 0.42, T + 1.0, 99, 4, -1, 0.04); if (w.length > 1) strip(w.slice(half).join(' '), 0, -0.85, 0.44, T + 1.4, 99, 1, 1, -0.04); }
    if (hi && !['pregunta', 'cta'].includes(v)) strip(hi, 0, v === 'doctora' ? -1.5 : -1.25, 0.42, T + Math.min(1.2, d*0.4), E, si, si % 2 ? 1 : -1, si % 2 ? 0.04 : -0.04);
  });
}
function onPlan(p, scn) {
  CAPS = scn.map(s => { const words = s.texto.split(/\s+/).filter(Boolean), span = Math.min(s.dur*0.55, 0.28*words.length + 0.3);
    return {words, hi: hiWords(s), times: words.map((w, i) => s.t0 + 0.1 + span*i/Math.max(1, words.length))}; });
  buildFromPlan(scn);
}
function captionAt(t) {
  const s = sceneAt(t), c = CAPS[s.i];
  if (!c || !c.words.length) { capEl.style.opacity = 0; return; }
  capEl.style.opacity = 1 - seg(t, s.t1 - 0.15, s.t1); const j = Math.floor(t*STOP); capEl.style.transform = `translateX(-50%) rotate(${(hash(s.i*10, 3) - 0.5)*3 + (hash(j, 4) - 0.5)*0.4}deg)`;
  capEl.innerHTML = c.words.map((w, i) => { const on = t >= c.times[i] - 0.03, hi = c.hi.includes(clean(w));
    return `<span style="opacity:${on ? 1 : 0};${hi ? 'background:#f4d03f;padding:0 6px;' : ''}">${w}</span>`; }).join(' ');
}
const capEl = document.getElementById('cap');
async function build() {
  await Promise.all(['40px Abril', '40px Anton', '40px Elite', '900 40px Playfair', 'italic 400 40px Playfair', '40px Bebas', '700 40px Caveat'].map(f => document.fonts.load(f)));
  await document.fonts.ready;
  const logo = new Image(); logo.src = LOGO_SRC; await logo.decode(); LOGO = logo;
  planSet(PLAN || window.DEFAULT_PLAN);
}
function frame(f) {
  const t = f/FPS, tq = Math.floor(t*STOP)/STOP;
  grainEl.style.backgroundImage = grains[Math.floor(t*STOP) % grains.length];
  for (const it of ITEMS) updateItem(it, tq);
  captionAt(t);
  renderer.render(scene, camera);
}
function SNAP_OVER(x, t) { const s = sceneAt(t); if (!s.texto) return;
  x.font = '58px Elite'; x.textAlign = 'center'; x.textBaseline = 'middle'; const words = s.texto.split(/\s+/), tx = words.slice(0, 9).join(' ') + (words.length > 9 ? '…' : '');
  x.fillStyle = '#fbf8f0'; x.fillRect(110, 1530, 860, 170); x.fillStyle = '#1d1b19'; wrapText(x, tx, 540, 1615, 800, 66); }
window.renderFrame = f => { frame(f); return true; };
window.GPU = 'webgl';
build().then(() => { window.READY = true; });
