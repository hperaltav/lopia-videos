// ===================================================== Lopia Studio · reproductor de planes (común a los tres estilos)
// Un "plan" es el guion estructurado: {titulo, escenas:[{dur, texto, visual, destacar?}], cta:{boton}}.
const VISUALES = ['persona', 'dientes', 'restos', 'placa', 'sarro', 'cepillado', 'limpieza', 'brillo', 'caries', 'doctora', 'reloj', 'calendario', 'pregunta', 'cta'];
window.DEFAULT_PLAN = window.DEFAULT_PLAN || {titulo: 'Muestra', cta: {boton: 'Agenda tu evaluación'}, escenas: [
  {dur: 3, visual: 'pregunta', texto: '¿Sabías que el sarro no sale con el cepillo?', destacar: 'sarro'},
  {dur: 3, visual: 'persona', texto: 'Te lavas los dientes cada mañana', destacar: ''},
  {dur: 3, visual: 'restos', texto: 'Pero siempre quedan restos', destacar: 'restos'},
  {dur: 3, visual: 'placa', texto: 'Las bacterias forman la placa', destacar: 'placa'},
  {dur: 3, visual: 'sarro', texto: 'Y la placa se endurece: sarro', destacar: 'sarro'},
  {dur: 3, visual: 'cepillado', texto: 'Cepíllate diente por diente', destacar: 'diente'},
  {dur: 3, visual: 'reloj', texto: 'Durante dos minutos', destacar: 'dos minutos'},
  {dur: 3, visual: 'caries', texto: 'Si no, aparecen las caries', destacar: 'caries'},
  {dur: 3, visual: 'doctora', texto: 'La Dra. Verónica te ayuda', destacar: 'Verónica'},
  {dur: 3, visual: 'limpieza', texto: 'Una limpieza retira el sarro', destacar: 'limpieza'},
  {dur: 3, visual: 'brillo', texto: 'Y tus dientes quedan brillantes', destacar: 'brillantes'},
  {dur: 3, visual: 'calendario', texto: 'Hazla cada seis meses', destacar: 'seis meses'},
  {dur: 3, visual: 'dientes', texto: 'Tu sonrisa te lo agradecerá', destacar: 'sonrisa'},
  {dur: 4, visual: 'cta', texto: '¿Hace cuánto no te haces una?', destacar: ''}]};
let PLAN = null, SCN = [], PDUR = 10;
function planSet(p) {
  PLAN = p; let t = 0;
  SCN = (p.escenas || []).map((s, i) => { const d = Math.max(1.5, Math.min(12, +s.dur || 3)); const o = {...s, i, dur: d, t0: t, t1: t + d, visual: VISUALES.includes(s.visual) ? s.visual : 'dientes', texto: String(s.texto || '')}; t += d; return o; });
  if (!SCN.length) SCN = [{i: 0, dur: 3, t0: 0, t1: 3, visual: 'dientes', texto: ''}];
  PDUR = SCN[SCN.length - 1].t1; window.TOTAL_FRAMES = Math.max(1, Math.round(PDUR*30));
  if (typeof onPlan === 'function') onPlan(PLAN, SCN);
  window.__dirty = true;
}
const sceneAt = t => SCN.find(s => t >= s.t0 && t < s.t1) || SCN[SCN.length - 1];
const hiWords = s => String(s.destacar || '').toLowerCase().split(/\s+/).filter(Boolean);
const clean = w => w.toLowerCase().replace(/[¿?¡!.,:;«»"]/g, '');
function snapImg(t) {
  const c = document.createElement('canvas'); c.width = 216; c.height = 384; const x = c.getContext('2d');
  const src = document.getElementById('c'); x.drawImage(src, 0, 0, src.width, src.height, 0, 0, 216, 384);
  if (typeof SNAP_OVER === 'function') { x.save(); x.scale(216/1080, 384/1920); SNAP_OVER(x, t); x.restore(); }
  return c.toDataURL('image/jpeg', 0.72);
}
addEventListener('message', e => { const d = e.data || {};
  if (d.cmd === 'plan') { planSet(d.plan); parent.postMessage({studio: 1, planOk: 1, dur: PDUR}, '*'); }
  if (d.cmd === 'snap' && window.READY) { const out = d.ts.map(t => { window.renderFrame(Math.floor(t*30)); return snapImg(t); }); window.__dirty = true;
    parent.postMessage({studio: 1, snaps: out, id: d.id}, '*'); } });
// texto en lienzo con saltos de línea (para miniaturas y parches)
function wrapText(ctx, text, x, y, maxW, lh) { const words = String(text).split(/\s+/); let line = '', lines = [];
  for (const w of words) { const tst = line ? line + ' ' + w : w; if (ctx.measureText(tst).width > maxW && line) { lines.push(line); line = w; } else line = tst; }
  if (line) lines.push(line); lines.forEach((l, i) => ctx.fillText(l, x, y + (i - (lines.length - 1)/2)*lh)); return lines.length; }
// para el render final (servidor local): cargar un plan y saber qué GPU se usa
window.planSet = planSet;
window.GPU_REAL = (() => { try { const g = renderer.getContext(); const e = g.getExtension('WEBGL_debug_renderer_info'); return e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER); } catch (e) { return ''; } })();
