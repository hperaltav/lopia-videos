// ---------- generación del guion (Claude, o plantillas si no está disponible)
const PLAYER = {animado:'escenas/p_animado.html', collage:'escenas/p_collage.html', fieltro:'escenas/p_fieltro.html'};
const VIS = {persona:'Paciente cepillándose', dientes:'Dientes sanos', restos:'Restos de comida', placa:'Placa bacteriana', sarro:'Sarro', cepillado:'Cepillado', limpieza:'Limpieza profesional',
  brillo:'Diente brillante', caries:'Caries', doctora:'Dra. Verónica', reloj:'Reloj / tiempo', calendario:'Calendario', pregunta:'Texto grande', cta:'Cierre con logo'};
const NSC = {promo:[4, 6], viral:[7, 10], edu:[9, 13]};
let samplerP = null;
const getSampler = () => samplerP || (samplerP = (window.claude && window.claude.use ? window.claude.use('sample').catch(() => null) : Promise.resolve(null)));
const visRules = Object.entries(VIS).map(([k, v]) => `${k} (${v.toLowerCase()})`).join(', ');
function briefNow() {
  const f = FORMATS.find(x => x.id === wiz.fmt), s = STYLES.find(x => x.id === wiz.style);
  return {f, s, auto: wiz.mode === 'auto', hint: $('#bHint').value.trim(), tema: $('#bTema').value.trim(), hook: $('#bHook').value.trim(), msg: $('#bMsg').value.trim(), cta: $('#bCta').value.trim() || 'Agenda tu evaluación',
    assets: $('#autoAssets').checked ? 'los elige Lopia' : assets.filter(a => wiz.picks.has(a.id)).map(a => a.name).join(', ')};
}
function genPrompt(b) {
  const [n1, n2] = NSC[b.f.id];
  return `Eres guionista de videos verticales cortos para redes sociales de PazDentium, una clínica dental en Chile. Su dentista y personaje es la Dra. Verónica Cabrera.
El video NO lleva voz: todo el mensaje se entiende con los textos en pantalla.
Tipo de video: ${b.f.name} de ${b.f.dur} segundos. Estructura: ${b.f.beats.map(x => `${x[0]} (~${x[1]} s)`).join(', ')}.
Estilo visual: ${b.s.name}.
${b.auto ? `El cliente pidió que tú elijas el tema: algo útil y atractivo para pacientes de una clínica dental.${b.hint ? ` Su idea: "${b.hint}".` : ''}`
  : `Tema: ${b.tema || '(propón uno)'}${b.f.id === 'viral' ? `\nGancho inicial: ${b.hook || '(propón uno)'}` : ''}\nMensaje principal: ${b.msg || '(propón uno)'}\nLlamado a la acción: ${b.cta}`}
Assets a usar: ${b.assets || 'logo de PazDentium'}.
Reglas:
- Entre ${n1} y ${n2} escenas. "dur" en segundos; la suma debe ser exactamente ${b.f.dur}. Cada escena entre 2.5 y 7 s; la última entre 3.5 y 5 s.
- "texto": lo que se lee en pantalla, máximo 10 palabras, español de Chile, tuteo, cercano y claro.
- "visual": uno de estos (en minúsculas, sin otros): ${visRules}. "cta" solo en la última escena, y la última escena siempre es "cta". "pregunta" sirve para ganchos o frases clave.
- "destacar": una o dos palabras del texto que se resaltan.
- La primera escena debe enganchar en menos de 3 segundos.
Responde solo con JSON, sin comentarios: {"titulo":"…","escenas":[{"dur":3,"texto":"…","visual":"…","destacar":"…"}],"cta":{"boton":"…"}}`;
}
function normalize(p, total, ctaTxt) {
  let sc = (p && Array.isArray(p.escenas) ? p.escenas : []).filter(s => s && s.texto).map(s => ({dur: Math.max(2, +s.dur || 3), texto: String(s.texto).trim().slice(0, 140), visual: VISUALES.includes(s.visual) ? s.visual : 'dientes', destacar: String(s.destacar || '').trim()}));
  if (!sc.length) return null;
  if (sc[sc.length - 1].visual !== 'cta') sc.push({dur: 4, texto: '¿Te animas? Te esperamos', visual: 'cta', destacar: ''});
  sc.forEach((s, i) => { if (s.visual === 'cta' && i < sc.length - 1) s.visual = 'dientes'; });
  const sum = sc.reduce((a, s) => a + s.dur, 0); sc.forEach(s => s.dur = Math.round(s.dur*total/sum*10)/10);
  const drift = Math.round((total - sc.reduce((a, s) => a + s.dur, 0))*10)/10; sc[sc.length - 1].dur = Math.round((sc[sc.length - 1].dur + drift)*10)/10;
  return {titulo: String(p.titulo || 'Video nuevo').slice(0, 80), escenas: sc, cta: {boton: String((p.cta && p.cta.boton) || ctaTxt || 'Agenda tu evaluación').slice(0, 40)}};
}
const VISUALES = Object.keys(VIS);
const DEF_TXT = {persona:'Te lavas los dientes cada mañana', restos:'Pero siempre quedan restos entre tus dientes', placa:'Las bacterias forman una capa: la placa', sarro:'La placa se endurece y se vuelve sarro',
  caries:'Y el sarro abre paso a las caries', cepillado:'Cepíllate diente por diente', reloj:'Durante al menos dos minutos', doctora:'La Dra. Verónica te ayuda', limpieza:'Una limpieza profesional retira el sarro',
  brillo:'Y tu sonrisa vuelve a brillar', calendario:'Hazte un control cada seis meses', dientes:'Tu sonrisa te lo agradecerá'};
const TPL = {promo:[['pregunta', 3.5], ['brillo', 5], ['doctora', 4.5], ['dientes', 3], ['cta', 4]],
  viral:[['pregunta', 4], ['persona', 4], ['restos', 4], ['placa', 5], ['sarro', 5], ['caries', 5], ['doctora', 5], ['limpieza', 5], ['brillo', 4], ['cta', 4]],
  edu:[['pregunta', 4], ['persona', 5], ['restos', 5], ['placa', 5], ['sarro', 5], ['caries', 5], ['cepillado', 5], ['reloj', 5], ['doctora', 5], ['limpieza', 5], ['calendario', 6], ['cta', 5]]};
function localPlan(b) {
  const tema = b.auto ? (b.hint || AUTO_TOPIC[b.f.id]) : (b.tema || AUTO_TOPIC[b.f.id]);
  const hook = (!b.auto && b.hook) || (/^¿/.test(tema) ? tema : `¿Sabías esto sobre ${tema.toLowerCase()}?`);
  const sent = (!b.auto && b.msg ? b.msg.split(/(?<=[.!?])\s+/).filter(Boolean) : []);
  let k = 0; const take = v => sent[k] ? sent[k++].replace(/\.$/, '') : DEF_TXT[v];
  const esc = TPL[b.f.id].map(([v, d]) => ({dur: d, visual: v, texto: v === 'pregunta' ? hook : v === 'cta' ? '¿Te animas? Te esperamos en PazDentium' : take(v), destacar: ''}));
  esc.forEach(s => { const w = s.texto.split(/\s+/).filter(x => x.length > 4); s.destacar = (w[w.length - 1] || '').replace(/[¿?¡!.,:;]/g, ''); });
  return normalize({titulo: tema.charAt(0).toUpperCase() + tema.slice(1), escenas: esc, cta: {boton: b.cta}}, b.f.dur, b.cta);
}
async function generate() {
  const b = briefNow(), stages = ['Escribiendo el guion', 'Armando el storyboard', 'Preparando personajes y assets', 'Animando la vista previa'];
  let k = 0; $('#genP').style.width = '8%'; $('#genS').textContent = stages[0];
  const iv = setInterval(() => { k = Math.min(k + 1, 3); $('#genP').style.width = Math.min(92, 8 + k*26) + '%'; $('#genS').textContent = stages[k]; }, 1400);
  let plan = null, src = 'plantilla';
  try { const sampler = await getSampler();
    if (sampler) { const out = await sampler.json(genPrompt(b), {modelTier: 'default'}); plan = normalize(out, b.f.dur, b.cta); if (plan) src = 'claude'; } } catch (e) { console.warn('sample', e); }
  if (!plan) plan = localPlan(b);
  clearInterval(iv); $('#genP').style.width = '100%';
  const v = {id:'n' + Date.now(), title:plan.titulo, style:b.s.name, fmt:b.f.name, dur:fmtT(b.f.dur), status:'Borrador', scene:b.s.id, img:b.s.img, plan};
  vids.unshift(v); wiz.step = 1; wiz.fmt = wiz.style = null; $('#bHint').value = '';
  const me = b.auto ? `${b.f.name} de ${b.f.dur} s en estilo ${b.s.name.toLowerCase()}. Créalo por mí${b.hint ? ': ' + b.hint : ''}.` : `${b.f.name} de ${b.f.dur} s en estilo ${b.s.name.toLowerCase()} sobre «${b.tema || 'tema a proponer'}».`;
  ed = {vid:v, title:v.title, sub:`${b.f.name} · ${b.s.name}`, scene:b.s.id, beats:b.f.beats, ver:1, plan, total:b.f.dur, thumbs:[],
    hist:[{me:1, t:me}, {me:0, t: src === 'claude' ? `Escribí un guion de ${plan.escenas.length} escenas: «${plan.titulo}». Puedes corregir cualquier texto en el storyboard o pedirme cambios aquí.`
      : `Armé el guion con una plantilla de ${plan.escenas.length} escenas (la IA no está disponible en esta vista). Corrige los textos en el storyboard: la vista previa se actualiza al instante.`}]};
  location.hash = 'editor';
}

// ---------- editor con vista previa en vivo
let pvTimer = null, playing = true, dur = 0, snapId = 0;
function fit() { const sc = $('#screen'), fr = $('#pv'); fr.style.transform = `scale(${sc.clientWidth/432})`; }
new ResizeObserver(fit).observe($('#screen'));
const pv = () => $('#pv').contentWindow;
function startPreview() {
  $('#edTitle').textContent = ed.title; $('#edSub').textContent = ed.sub; $('#edVer').textContent = 'Versión ' + ed.ver;
  $('#edBeats').innerHTML = beatsHtml(ed.beats); renderHist(); renderBoard();
  $('#sugg').innerHTML = (ed.plan ? ['Hazlo más divertido', 'Agrega a la Dra. Verónica al principio', 'Que el gancho sea una pregunta', 'Menos texto en cada escena'] : ['Haz los textos más grandes', 'Agrega a Verónica al final'])
    .map(t => `<button type="button" class="chip txt">${t}</button>`).join('');
  $('#pvLoad').hidden = false; $('#pvLoad').textContent = 'Cargando escena…'; playing = true; setPP();
  const fr = $('#pv'), src = (ed.plan ? PLAYER[ed.scene] : SCENE[ed.scene]) + '?scale=0.4&studio=1&fps=15';
  if (!fr.src.endsWith(src)) { fr.dataset.ready = ''; fr.src = src; } else { pv().postMessage({cmd:'play'}, '*'); if (ed.plan) sendPlan(true); }
  fit(); clearTimeout(pvTimer); pvTimer = setTimeout(() => { if (!$('#pvLoad').hidden) $('#pvLoad').innerHTML = `<div><img src="${ed.vid.img}" alt="" style="width:60%;border-radius:12px;opacity:.85"><p>La animación no pudo cargarse en este navegador. Prueba abrir el Studio en Chrome o Safari actualizado.</p></div>`; }, 15000);
}
function sendPlan(seek0) { if (!ed || !ed.plan || $('#pv').dataset.ready !== '1') return; pv().postMessage({cmd:'plan', plan:ed.plan}, '*'); if (seek0) pv().postMessage({cmd:'seek', t:0}, '*'); }
function requestSnaps(only) { if (!ed.plan) return; const L = planList(); const idx = only != null ? [only] : L.map((_, i) => i);
  snapId++; pv().postMessage({cmd:'snap', id:snapId + ':' + idx.join(','), ts:idx.map(i => L[i].t0 + Math.min(L[i].dur*0.6, L[i].dur - 0.3))}, '*'); }
function stopPreview() { const fr = $('#pv'); if (fr.src) fr.contentWindow?.postMessage({cmd:'pause'}, '*'); }
addEventListener('message', e => { const d = e.data; if (!d || !d.studio) return;
  if (d.ready) { $('#pv').dataset.ready = '1'; if (ed && ed.plan) sendPlan(true); return; }
  if (d.planOk) { if (!ed.thumbs || !ed.thumbs.length || ed.needSnaps) { ed.needSnaps = false; requestSnaps(); } return; }
  if (d.snaps) { const idx = String(d.id).split(':')[1].split(',').map(Number); idx.forEach((i, j) => { ed.thumbs[i] = d.snaps[j]; const im = $(`#board .pan[data-i="${i}"] img`); if (im) im.src = d.snaps[j]; });
    if (idx.includes(0) && ed.vid) ed.vid.img = ed.thumbs[0]; return; }
  $('#pvLoad').hidden = true; dur = d.dur; markNow(d.t); if (!seeking) $('#seek').value = d.t/d.dur*100; $('#tm').textContent = `${fmtT(d.t)} / ${fmtT(d.dur)}`; });
let seeking = false;
$('#seek').addEventListener('input', () => { seeking = true; pv().postMessage({cmd:'seek', t:$('#seek').value/100*dur}, '*'); });
$('#seek').addEventListener('change', () => seeking = false);
function setPP() { $('#ppI').innerHTML = playing ? '<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>' : '<path d="M7 4l13 8-13 8z"/>'; $('#pp').setAttribute('aria-label', playing ? 'Pausar' : 'Reproducir'); }
$('#pp').onclick = () => { playing = !playing; pv().postMessage({cmd:playing ? 'play' : 'pause'}, '*'); setPP(); };

// ---------- guion y storyboard
let sbNow = -1;
function planList() { let t = 0; return ed.plan.escenas.map(s => { const o = {...s, t0:t, t1:t + s.dur}; t += s.dur; return o; }); }
const sbList = () => ed.plan ? planList() : ((window.SB && SB[ed.scene]) || []);
const BLANK = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="9" height="16"><rect width="9" height="16" fill="#ece6f3"/></svg>');
function renderBoard() {
  sbNow = -1; const L = sbList(); ed.edits = ed.edits || {};
  if (ed.plan) {
    $('#board').innerHTML = L.map((p, i) => `<div class="pan" data-i="${i}"><button class="go" data-t="${p.t0}" aria-label="Ver la escena ${i + 1}"><img src="${(ed.thumbs || [])[i] || BLANK}" alt=""><span>${fmtT(p.t0)}</span></button>
      <select class="vis" data-v="${i}" aria-label="Imagen de la escena ${i + 1}">${VISUALES.filter(k => k !== 'cta' || i === L.length - 1).map(k => `<option value="${k}" ${k === p.visual ? 'selected' : ''}>${VIS[k]}</option>`).join('')}</select>
      <textarea data-e="${i}" aria-label="Texto de la escena ${i + 1}">${p.texto}</textarea></div>`).join('');
    $('#sbbar').hidden = true;
  } else {
    $('#board').innerHTML = L.map((p, i) => { const orig = p.voz || p.pantalla, val = ed.edits[i] ?? orig;
      return `<div class="pan ${ed.edits[i] !== undefined ? 'edited' : ''}" data-i="${i}"><button class="go" data-t="${p.t0}" aria-label="Ver la escena ${i + 1}"><img src="${p.img}" alt="" loading="lazy"><span>${fmtT(p.t0)}</span></button>
      <textarea data-e="${i}" aria-label="Texto de la escena ${i + 1}">${val}</textarea></div>`; }).join('');
    sbBar();
  }
  $('#sbNote').textContent = ed.plan ? 'Edita el texto o la imagen de cualquier escena: la vista previa cambia al instante.' : 'Este video ya está publicado: edita los textos y aplica los cambios para generar una nueva versión.';
  $$('#board textarea').forEach(grow);
}
function grow(ta) { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 2 + 'px'; }
function sbBar() { const n = Object.keys(ed.edits || {}).length; $('#sbbar').hidden = !n; $('#sbn').textContent = `${n} escena${n > 1 ? 's' : ''} editada${n > 1 ? 's' : ''}`; }
function markNow(t) { const L = sbList(); let k = L.findIndex(p => t >= p.t0 && t < p.t1); if (k < 0 && L.length && t < L[0].t0) k = 0; if (k === sbNow) return; sbNow = k;
  $$('#board .pan').forEach(x => x.classList.toggle('now', +x.dataset.i === k)); }
let liveT = null, snapT = null;
function liveUpdate(i, seekTo) { clearTimeout(liveT); liveT = setTimeout(() => { sendPlan(false); if (seekTo != null) pv().postMessage({cmd:'seek', t:seekTo}, '*');
  clearTimeout(snapT); snapT = setTimeout(() => requestSnaps(i), 700); }, 250); }
$('#board').addEventListener('click', e => { const g = e.target.closest('.go'); if (g) pv().postMessage({cmd:'seek', t:+g.dataset.t + 0.05}, '*'); });
$('#board').addEventListener('input', e => { const ta = e.target.closest('[data-e]'); if (!ta) return; grow(ta); const i = +ta.dataset.e;
  if (ed.plan) { ed.plan.escenas[i].texto = ta.value; liveUpdate(i, planList()[i].t0 + 0.05); return; }
  const p = sbList()[i], orig = p.voz || p.pantalla;
  if (ta.value.trim() === orig.trim()) delete ed.edits[i]; else ed.edits[i] = ta.value; ta.parentElement.classList.toggle('edited', ed.edits[i] !== undefined); sbBar(); });
$('#board').addEventListener('change', e => { const se = e.target.closest('[data-v]'), ta = e.target.closest('[data-e]');
  if (se && ed.plan) { const i = +se.dataset.v; ed.plan.escenas[i].visual = se.value; liveUpdate(i, planList()[i].t0 + 0.05); ed.hist.push({me:1, t:`Escena ${i + 1}: cambié la imagen a «${VIS[se.value]}».`}); renderHist(); }
  if (ta && ed.plan) { ed.hist.push({me:1, t:`Escena ${+ta.dataset.e + 1}: «${ta.value.trim()}».`}); renderHist(); } });
$('#sbUndo').onclick = () => { ed.edits = {}; renderBoard(); };
$('#sbApply').onclick = () => { const ks = Object.keys(ed.edits).map(Number).sort((a, b) => a - b); if (!ks.length) return;
  ed.hist.push({me:1, t:`Cambié el guion en ${ks.length === 1 ? 'la escena' : 'las escenas'} ${ks.map(k => k + 1).join(', ')}.`});
  ks.forEach(k => { const p = sbList()[k]; if (p.voz) p.voz = ed.edits[k]; else p.pantalla = ed.edits[k]; });
  ed.edits = {}; renderBoard(); ed.ver++; ed.hist.push({me:0, t:`Guardé tu guion corregido como versión ${ed.ver}. Este video fue animado a mano: los cambios se aplican al generar la versión final.`}); $('#edVer').textContent = 'Versión ' + ed.ver; renderHist(); };
function renderHist() { $('#hist').innerHTML = ed.hist.map(m => `<div class="msg ${m.me ? 'me' : ''}"><b>${m.me ? 'Tú' : 'Lopia Studio'}</b>${m.t}</div>`).join(''); $('#hist').scrollTop = 1e6; }
$('#sugg').addEventListener('click', e => { const c = e.target.closest('.chip'); if (c) { $('#pt').value = c.textContent; $('#pt').focus(); } });
$('#pf').addEventListener('submit', async e => { e.preventDefault(); const t = $('#pt').value.trim(); if (!t) return;
  ed.hist.push({me:1, t}); $('#pt').value = ''; $('#ps').disabled = true; ed.hist.push({me:0, t:'Reescribiendo el guion…'}); renderHist();
  let done = false;
  if (ed.plan) { try { const sampler = await getSampler();
      if (sampler) { const out = await sampler.json(`Este es el guion actual de un video vertical sin voz para PazDentium (clínica dental en Chile), en JSON:
${JSON.stringify(ed.plan)}
El cliente pide este cambio: "${t}".
Devuelve el guion completo con el cambio aplicado y las mismas reglas: duración total ${ed.total} s; "texto" máximo 10 palabras; "visual" uno de: ${visRules}; la última escena es "cta" y ninguna otra lo es; "destacar" una o dos palabras del texto.
Agrega "resumen": una frase corta, en tuteo, con lo que cambiaste.
Responde solo con JSON: {"titulo":"…","resumen":"…","escenas":[{"dur":3,"texto":"…","visual":"…","destacar":"…"}],"cta":{"boton":"…"}}`, {modelTier: 'default'});
        const np = normalize(out, ed.total, ed.plan.cta.boton);
        if (np) { ed.plan = np; ed.vid.plan = np; ed.thumbs = []; ed.needSnaps = true; ed.ver++; ed.hist.pop(); ed.hist.push({me:0, t:`Versión ${ed.ver}: ${out.resumen || 'apliqué tu cambio'}.`}); renderBoard(); sendPlan(true); done = true; } } } catch (err) { console.warn(err); }
    if (!done) { ed.hist.pop(); ed.hist.push({me:0, t:'La IA no está disponible en esta vista, así que no pude reescribir el guion. Puedes corregir los textos y las imágenes directamente en el storyboard.'}); }
  } else { ed.hist.pop(); ed.ver++; ed.hist.push({me:0, t:`Anoté tu pedido para la versión ${ed.ver}. Este video fue animado a mano, así que el cambio se aplica al generar la versión final.`}); $('#edVer').textContent = 'Versión ' + ed.ver; }
  $('#edVer').textContent = 'Versión ' + ed.ver; $('#ps').disabled = false; renderHist(); });
