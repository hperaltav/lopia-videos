// LOPIA CONTENT STUDIO · servidor local
// Uso:  deno run -A servidor.ts            (solo este PC: http://localhost:8800)
//       deno run -A servidor.ts --red      (también otros equipos de la misma red, ej. el MacBook)
// Sirve la app, guarda videos y assets en datos\, pide guiones a Claude (clave en .env) y renderiza los finales con la GPU.
import puppeteer from "npm:puppeteer-core@23.11.1";

const here = decodeURIComponent(new URL(".", import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, "$1").replace(/\/$/, "");
const DATOS = `${here}/datos`;
for (const d of ["", "/assets", "/finales", "/planes"]) Deno.mkdirSync(DATOS + d, { recursive: true });
const PORT = 8800, RED = Deno.args.includes("--red");

// ---------- configuración (.env: ANTHROPIC_API_KEY, MODELO opcional, FFMPEG opcional)
const env: Record<string, string> = {};
try { for (const l of Deno.readTextFileSync(`${here}/.env`).split(/\r?\n/)) { const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, ""); } } catch { /* sin .env: guiones con plantilla */ }
const API_KEY = env.ANTHROPIC_API_KEY || Deno.env.get("ANTHROPIC_API_KEY") || "";
const MODELO = env.MODELO || "claude-sonnet-5-5";
const exists = (p: string) => { try { Deno.statSync(p); return true; } catch { return false; } };
const FFMPEG = env.FFMPEG || Deno.env.get("FFMPEG") || [`${here}/../pazdentium/motor/ffmpeg_path.txt`].filter(exists).map(p => Deno.readTextFileSync(p).trim())[0] || "ffmpeg";
const CHROME = env.CHROME || ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome"].find(exists) || "";

const GPU_ARGS = Deno.build.os === "windows" ? ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11", "--enable-webgl"]
  : Deno.build.os === "darwin" ? ["--ignore-gpu-blocklist", "--enable-webgl"] : ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"];

// ---------- almacenamiento simple en archivos JSON
const readJ = (f: string, d: unknown) => { try { return JSON.parse(Deno.readTextFileSync(`${DATOS}/${f}`)); } catch { return d; } };
const writeJ = (f: string, v: unknown) => Deno.writeTextFileSync(`${DATOS}/${f}`, JSON.stringify(v));
const json = (v: unknown, status = 200) => new Response(JSON.stringify(v), { status, headers: { "content-type": "application/json; charset=utf-8" } });
const TYPES: Record<string, string> = { html: "text/html; charset=utf-8", js: "text/javascript", css: "text/css", svg: "image/svg+xml", png: "image/png", jpg: "image/jpeg",
  jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif", woff2: "font/woff2", ttf: "font/ttf", otf: "font/otf", mp4: "video/mp4", json: "application/json", wav: "audio/wav", mp3: "audio/mpeg" };

// ---------- IA: guiones con Claude (la clave nunca sale de este servidor)
async function pedirGuion(prompt: string) {
  const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST",
    headers: { "x-api-key": API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: MODELO, max_tokens: 4000, messages: [{ role: "user", content: prompt }] }) });
  const d = await r.json();
  if (!r.ok) throw new Error(d?.error?.message || `Error ${r.status} de la API`);
  const text = (d.content || []).filter((c: { type: string }) => c.type === "text").map((c: { text: string }) => c.text).join("");
  const a = text.indexOf("{"), b = text.lastIndexOf("}");
  return JSON.parse(text.slice(a, b + 1));
}

// ---------- render final: cola de trabajos, uno a la vez, con la GPU
type Job = { id: string; estilo: string; plan: unknown; estado: string; progreso: number; url?: string; error?: string };
const JOBS: Record<string, Job> = readJ("trabajos.json", {});
for (const j of Object.values(JOBS)) if (j.estado !== "listo") { j.estado = "error"; j.error = "El servidor se reinició durante el render; vuelve a aprobar el video."; }
const saveJobs = () => writeJ("trabajos.json", JOBS);
const cola: string[] = []; let trabajando = false;
async function procesar() {
  if (trabajando) return; trabajando = true;
  while (cola.length) { const job = JOBS[cola.shift()!]; try { await renderizar(job); } catch (e) { job.estado = "error"; job.error = String((e as Error).message || e); console.log("[render]", job.error); } saveJobs(); }
  trabajando = false;
}
async function renderizar(job: Job) {
  if (!CHROME) throw new Error("No encontré Google Chrome instalado.");
  job.estado = "renderizando"; job.progreso = 0; saveJobs();
  const open = async (headless: boolean) => {
    const browser = await puppeteer.launch({ executablePath: CHROME, headless,
      args: [...GPU_ARGS, "--window-position=-3000,0", "--window-size=1080,2060"] });
    const page = await browser.newPage(); page.on("pageerror", (e) => console.log("[página]", e.message));
    await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
    await page.goto(`http://127.0.0.1:${PORT}/escenas/p_${job.estilo}.html?scale=1`, { waitUntil: "networkidle0" });
    await page.waitForFunction("window.READY === true", { timeout: 180000 });
    return { browser, page, gpu: await page.evaluate("window.GPU_REAL || ''") as string };
  };
  let { browser, page, gpu } = await open(true);
  if (/swiftshader|software|llvmpipe/i.test(gpu) && Deno.build.os === "windows") { await browser.close(); ({ browser, page, gpu } = await open(false)); }
  console.log(`[render] ${job.id} · ${job.estilo} · GPU: ${gpu}`);
  await page.evaluate((p) => (window as any).planSet(p), job.plan);
  const total = await page.evaluate("window.TOTAL_FRAMES") as number;
  const out = `${DATOS}/finales/${job.id}.mp4`;
  const musica = [...Deno.readDirSync(`${here}/musica`)].filter(f => /\.(mp3|wav|m4a)$/i.test(f.name)).map(f => `${here}/musica/${f.name}`);
  const audioIn = musica.length ? ["-stream_loop", "-1", "-i", musica[Math.floor(Math.random()*musica.length)]] : ["-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo"];
  const dur = (total/30).toFixed(2);
  const ff = new Deno.Command(FFMPEG, { args: ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", "30", "-c:v", "png", "-i", "-", ...audioIn,
    "-vf", "format=yuv420p", "-af", `afade=t=out:st=${Math.max(0, total/30 - 1.5).toFixed(2)}:d=1.5,volume=0.8`, "-t", dur,
    "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-tune", "animation", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", out], stdin: "piped" }).spawn();
  const w = ff.stdin.getWriter();
  for (let f = 0; f < total; f++) {
    await page.evaluate((f) => (window as any).renderFrame(f), f);
    await w.write(await page.screenshot({ type: "png" }) as Uint8Array);
    if (f % 15 === 0) { job.progreso = Math.round(f/total*100); }
  }
  await w.close(); const st = await ff.status; await browser.close();
  if (!st.success) throw new Error("ffmpeg no pudo crear el video.");
  job.estado = "listo"; job.progreso = 100; job.url = `/datos/finales/${job.id}.mp4`;
  console.log(`[render] listo: ${out}`);
}

// ---------- servidor web
Deno.mkdirSync(`${here}/musica`, { recursive: true });
Deno.serve({ port: PORT, hostname: RED ? "0.0.0.0" : "127.0.0.1", onListen() {
  console.log(`\n  LOPIA CONTENT STUDIO listo en  http://localhost:${PORT}${RED ? "  (también desde otros equipos de tu red)" : ""}`);
  console.log(`  Guiones con IA: ${API_KEY ? "activados (" + MODELO + ")" : "desactivados (falta ANTHROPIC_API_KEY en .env; se usan plantillas)"}`);
  console.log(`  Chrome: ${CHROME || "NO ENCONTRADO"}   ffmpeg: ${FFMPEG}\n`); } }, async (req) => {
  const url = new URL(req.url), p = decodeURIComponent(url.pathname);
  try {
    if (p === "/api/estado") return json({ ok: true, ia: !!API_KEY, render: !!CHROME });
    if (p === "/api/ia" && req.method === "POST") {
      if (!API_KEY) return json({ error: "sin_clave" }, 503);
      const { prompt } = await req.json(); return json({ json: await pedirGuion(String(prompt)) });
    }
    if (p === "/api/videos") { if (req.method === "PUT") { writeJ("videos.json", await req.json()); return json({ ok: true }); } return json(readJ("videos.json", [])); }
    if (p === "/api/assets") {
      if (req.method === "POST") {
        const nombre = decodeURIComponent(req.headers.get("x-nombre") || "foto"), ext = (req.headers.get("content-type") || "image/jpeg").split("/")[1].replace("jpeg", "jpg").replace("svg+xml", "svg").slice(0, 4);
        const id = "a" + Date.now().toString(36); Deno.writeFileSync(`${DATOS}/assets/${id}.${ext}`, new Uint8Array(await req.arrayBuffer()));
        const list = readJ("assets.json", []); const a = { id, name: nombre.replace(/\.[^.]+$/, ""), kind: "Fotos", src: `/datos/assets/${id}.${ext}`, cover: 1, used: 0 };
        list.unshift(a); writeJ("assets.json", list); return json(a);
      }
      return json(readJ("assets.json", []));
    }
    if (p === "/api/render" && req.method === "POST") {
      const { id, estilo, plan } = await req.json(); if (!["animado", "collage", "fieltro"].includes(estilo)) return json({ error: "estilo" }, 400);
      const jid = String(id).replace(/[^a-zA-Z0-9_-]/g, "") || "v" + Date.now();
      JOBS[jid] = { id: jid, estilo, plan, estado: "en cola", progreso: 0 }; writeJ(`planes/${jid}.json`, plan); saveJobs(); cola.push(jid); procesar();
      return json({ id: jid, enCola: cola.length });
    }
    if (p.startsWith("/api/render/")) { const j = JOBS[p.split("/").pop()!]; return j ? json({ ...j, plan: undefined, enCola: cola.indexOf(j.id) + 1 }) : json({ error: "no existe" }, 404); }
    // archivos estáticos (la app) y datos (assets y finales)
    let f = p === "/" ? "/index.html" : p;
    if (f.includes("..")) return new Response("400", { status: 400 });
    if (/^\/(src\/|servidor\.ts|\.env)/.test(f)) return new Response("404", { status: 404 });
    const body = await Deno.readFile(`${here}${f}`);
    return new Response(body, { headers: { "content-type": TYPES[f.split(".").pop()!.toLowerCase()] ?? "application/octet-stream", "cache-control": "no-cache" } });
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) return new Response("404", { status: 404 });
    console.log("[error]", (e as Error).message); return json({ error: String((e as Error).message) }, 500);
  }
});
