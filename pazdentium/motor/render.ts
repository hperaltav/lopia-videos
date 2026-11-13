// Motor de render local con GPU (PazDentium).
// Uso: deno run -A motor/render.ts <preview|final> [video]
//   video = nombre de una carpeta en videos\ (ej: brackets). Si no se indica, usa el video modificado más recientemente.
//   En la carpeta del video se usa el .html más reciente (las versiones anteriores pasan a versiones\) y el .wav más reciente.
//   Salida: previews\<video>.mp4  o  finales\pazdentium_<video>.mp4
import puppeteer from "npm:puppeteer-core@23.11.1";
const here = decodeURIComponent(new URL(".", import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, "$1").replace(/\/$/, "");
const root = here.replace(/[\\/]motor$/, "");
const mode = (Deno.args[0] || "preview").toLowerCase(); const preview = mode !== "final";
let video = (Deno.args[1] || "").replace(/[\\/]+$/, "").split(/[\\/]/).pop() || "";
const ls = (d: string) => [...Deno.readDirSync(d)];
const mtime = (p: string) => Deno.statSync(p).mtime?.getTime() ?? 0;
if (!video) {
  let best = -1;
  for (const e of ls(`${root}/videos`)) if (e.isDirectory) for (const f of ls(`${root}/videos/${e.name}`))
    if (f.isFile && /\.(html|wav)$/i.test(f.name)) { const m = mtime(`${root}/videos/${e.name}/${f.name}`); if (m > best) { best = m; video = e.name; } }
}
const dir = `${root}/videos/${video}`;
const newest = (re: RegExp) => ls(dir).filter(f => f.isFile && re.test(f.name)).map(f => f.name).sort((a, b) => mtime(`${dir}/${b}`) - mtime(`${dir}/${a}`));
const htmls = newest(/\.html$/i), wavs = newest(/\.wav$/i);
if (!htmls.length || !wavs.length) { console.log(`Falta el .html o el .wav en videos\\${video}`); Deno.exit(1); }
for (const old of htmls.slice(1)) { Deno.mkdirSync(`${dir}/versiones`, { recursive: true }); Deno.renameSync(`${dir}/${old}`, `${dir}/versiones/${old}`); }
const html = htmls[0], audio = `${dir}/${wavs[0]}`;
const outDir = `${root}/${preview ? "previews" : "finales"}`; Deno.mkdirSync(outDir, { recursive: true });
const out = `${outDir}/${preview ? video : "pazdentium_" + video}.mp4`;
console.log(`Video: ${video} | escena: ${html} | audio: ${wavs[0]} | modo: ${preview ? "vista previa 15 FPS" : "final 30 FPS"}`);
const ffmpeg = Deno.readTextFileSync(`${here}/ffmpeg_path.txt`).trim();
const CHROME = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"]
  .find(p => { try { Deno.statSync(p); return true; } catch { return false; } });
const types: Record<string, string> = { js: "text/javascript", html: "text/html", svg: "image/svg+xml", otf: "font/otf", ttf: "font/ttf", wav: "audio/wav", png: "image/png", jpg: "image/jpeg" };
const server = Deno.serve({ port: 8765, hostname: "127.0.0.1", onListen() {} }, async (req) => {
  const p = decodeURIComponent(new URL(req.url).pathname).replace(/^\/+/, "");
  try { return new Response(await Deno.readFile(`${root}/${p}`), { headers: { "content-type": types[p.split(".").pop()!] ?? "application/octet-stream" } }); }
  catch { return new Response("404", { status: 404 }); }
});
const SC = preview ? 0.5 : 1, W = 1080 * SC, H = 1920 * SC, FPS = preview ? 15 : 30, STEP = preview ? 2 : 1;
async function open(headless: boolean) {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless,
    args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11", "--enable-webgl", "--window-position=-3000,0", `--window-size=${W},${H + 140}`] });
  const page = await browser.newPage();
  page.on("pageerror", (e) => console.log("[error página]", e.message));
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  await page.goto(`http://127.0.0.1:8765/videos/${video}/${html}?scale=${SC}`, { waitUntil: "networkidle0" });
  await page.waitForFunction("window.READY === true", { timeout: 120000 });
  const gpu = await page.evaluate("window.GPU") as string;
  return { browser, page, gpu };
}
let { browser, page, gpu } = await open(true);
console.log("GPU usada:", gpu);
if (/swiftshader|software|llvmpipe/i.test(gpu)) {
  await browser.close(); ({ browser, page, gpu } = await open(false)); console.log("Reintento con ventana. GPU usada:", gpu);
}
const total = await page.evaluate("window.TOTAL_FRAMES") as number;
const vf = preview ? "format=yuv420p" : "noise=alls=3:allf=t,vignette=PI/7,format=yuv420p";
const enc = preview ? ["-preset", "veryfast", "-crf", "26"] : ["-preset", "slow", "-crf", "16", "-tune", "animation"];
const ff = new Deno.Command(ffmpeg, { args: ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", preview ? "mjpeg" : "png", "-i", "-",
  "-i", audio, "-vf", vf, "-c:v", "libx264", ...enc, "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", out], stdin: "piped" }).spawn();
const w = ff.stdin.getWriter();
const t0 = performance.now(); let n = 0;
for (let f = 0; f < total; f += STEP) {
  await page.evaluate((f) => (window as any).renderFrame(f), f);
  const img = await page.screenshot(preview ? { type: "jpeg", quality: 90 } : { type: "png" });
  await w.write(img as Uint8Array); n++;
  if (n % 60 === 0) console.log(`cuadro ${f}/${total}  ${(n / ((performance.now() - t0) / 1000)).toFixed(1)} cuadros/s`);
}
await w.close(); await ff.status;
const secs = (performance.now() - t0) / 1000;
console.log(`Listo: ${out} | ${n} cuadros en ${secs.toFixed(0)} s (${(n / secs).toFixed(1)} cuadros/s) | GPU: ${gpu}`);
await browser.close(); await server.shutdown();
