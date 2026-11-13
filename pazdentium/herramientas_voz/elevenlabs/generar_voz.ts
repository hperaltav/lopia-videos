// Genera la voz en off del video PazDentium con ElevenLabs.
// Uso: deno run --env-file=.env.local --allow-env --allow-net=api.elevenlabs.io --allow-read --allow-write generar_voz.ts
const KEY = Deno.env.get("ELEVENLABS_API_KEY");
if (!KEY) throw new Error("Falta ELEVENLABS_API_KEY en .env.local");
const API = "https://api.elevenlabs.io";
const H = { "xi-api-key": KEY, "Content-Type": "application/json" };
const OUT = "voz";
await Deno.mkdir(OUT, { recursive: true });
const log: string[] = [];
const say = (s: string) => { console.log(s); log.push(s); };

const LINES = [
  "Esa mancha café en tu muela no se quita blanqueando.",
  "Es una caries: bacterias que se comen tu diente por dentro.",
  "Si solo la tapas, la caries sigue avanzando por debajo.",
  "Así que primero se retira todo el tejido dañado.",
  "Pero la resina no se pega sola.",
  "Por eso, un gel abre poros microscópicos, y encima, un adhesivo.",
  "La resina entra en capas delgadas, y cada capa se endurece con luz azul.",
  "Su color se elige igual al de tu diente.",
  "Al final se le da forma, y se pule hasta que brille.",
  "Sin metal, sin gris, normalmente en una sola sesión.",
  "¿Ves una mancha oscura en tu muela? Agenda tu evaluación en Paz Dentium.",
];

async function j(url: string, init?: RequestInit) {
  const r = await fetch(url, init);
  const t = await r.text();
  return { ok: r.ok, status: r.status, body: (() => { try { return JSON.parse(t); } catch { return t; } })() };
}

// 0) Si ya agregaste a "Mis voces" una voz chilena (Francisca, Catalina, Camila...), usar esa
let voiceId: string | null = null, voiceName = "";
{
  const PREF = /francisca|catalina|camila|marcela|cami|victoria|angela|esperanza|olivia|emma|chile/i;
  const r = await j(`${API}/v2/voices?page_size=100`, { headers: H });
  const mine = ((r.ok && r.body.voices) || []).filter((v: any) => v.category !== "premade" && PREF.test(v.name + JSON.stringify(v.labels || {})));
  if (mine.length) { voiceId = mine[0].voice_id; voiceName = mine[0].name; say(`Uso tu voz agregada: ${voiceName}`); }
}

// 1) Buscar voces femeninas en español con acento chileno (si no hay, latino)
const candidates: any[] = [];
for (const accent of (voiceId ? [] : ["chilean", "latin american", ""])) {
  const q = new URLSearchParams({ page_size: "10", gender: "female", language: "es", sort: "usage_character_count_1y" });
  if (accent) q.set("accent", accent);
  const r = await j(`${API}/v1/shared-voices?${q}`, { headers: H });
  const vs = (r.ok && r.body.voices) || [];
  say(`Busqueda acento="${accent || "cualquiera"}": ${vs.length} voces`);
  for (const v of vs) candidates.push({ accent, name: v.name, accent_label: v.accent, voice_id: v.voice_id, owner: v.public_owner_id, preview: v.preview_url, description: v.description });
  if (vs.length) break;
}
await Deno.writeTextFile(`${OUT}/voces_candidatas.json`, JSON.stringify(candidates, null, 2));

// 2) Agregar la primera candidata a "Mis voces" (necesario para usarla por API)
for (const c of (voiceId ? [] : candidates.slice(0, 3))) {
  const r = await j(`${API}/v1/voices/add/${c.owner}/${c.voice_id}`, { method: "POST", headers: H, body: JSON.stringify({ new_name: `PazDentium - ${c.name}`.slice(0, 60) }) });
  if (r.ok) { voiceId = r.body.voice_id; voiceName = c.name; say(`Voz elegida: ${c.name} (${c.accent_label})`); break; }
  say(`No se pudo agregar ${c.name}: ${r.status} ${JSON.stringify(r.body).slice(0, 200)}`);
}
// 3) Respaldo: una voz femenina propia de la cuenta (multilingüe)
if (!voiceId) {
  const r = await j(`${API}/v2/voices?page_size=100`, { headers: H });
  const vs = (r.ok && r.body.voices) || [];
  const f = vs.find((v: any) => v.labels?.gender === "female" && /es|spanish/i.test(JSON.stringify(v.labels) + JSON.stringify(v.verified_languages || "")))
    || vs.find((v: any) => v.labels?.gender === "female");
  if (!f) throw new Error("No encontré ninguna voz femenina disponible");
  voiceId = f.voice_id; voiceName = f.name;
  say(`Respaldo: uso la voz de la cuenta "${f.name}"`);
}

// 4) Generar cada frase (con contexto de la anterior y la siguiente para una entonación continua)
for (let i = 0; i < LINES.length; i++) {
  const r = await fetch(`${API}/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
    method: "POST", headers: H,
    body: JSON.stringify({
      text: LINES[i], model_id: "eleven_multilingual_v2", language_code: "es",
      previous_text: LINES[i - 1] ?? undefined, next_text: LINES[i + 1] ?? undefined,
      voice_settings: { stability: 0.5, similarity_boost: 0.8, style: 0.25, use_speaker_boost: true, speed: 1.0 },
    }),
  });
  if (!r.ok) { say(`Error en frase ${i + 1}: ${r.status} ${(await r.text()).slice(0, 300)}`); continue; }
  await Deno.writeFile(`${OUT}/l${String(i).padStart(2, "0")}.mp3`, new Uint8Array(await r.arrayBuffer()));
  say(`Frase ${i + 1}/${LINES.length} lista`);
}
say(`Voz usada: ${voiceName} (${voiceId})`);
await Deno.writeTextFile(`${OUT}/log.txt`, log.join("\n"));
say("Terminado.");
