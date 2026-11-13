// Vigilante de render: deja esta ventana abierta y los renders se ejecutan solos.
// Claude deja un "pedido" en motor\cola\ (ej: 20261112-0930_preview_limpieza.pedido) y aquí se renderiza.
// Modo: preview | final. El resultado queda en previews\ o finales\ y el registro en motor\ultimo_render.txt.
const here = decodeURIComponent(new URL(".", import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, "$1").replace(/\/$/, "");
const root = here.replace(/[\\/]motor$/, "");
const cola = `${here}/cola`, hechos = `${cola}/hechos`;
Deno.mkdirSync(hechos, { recursive: true });
const stamp = () => new Date().toLocaleTimeString("es-CL");
console.log(`[${stamp()}] Vigilante activo. Esperando pedidos en motor\\cola ... (cierra esta ventana para detenerlo)`);
Deno.writeTextFileSync(`${here}/vigilante_estado.txt`, `activo desde ${new Date().toISOString()}\n`);
while (true) {
  const pedidos = [...Deno.readDirSync(cola)].filter(e => e.isFile && e.name.endsWith(".pedido")).map(e => e.name).sort();
  for (const p of pedidos) {
    const m = p.replace(/\.pedido$/, "").match(/_(preview|final)_([\w-]+)$/);
    const destino = `${hechos}/${p}`;
    if (!m) { console.log(`[${stamp()}] Pedido no reconocido: ${p}`); Deno.renameSync(`${cola}/${p}`, destino); continue; }
    const [, modo, video] = m;
    console.log(`[${stamp()}] Renderizando ${video} (${modo})...`);
    Deno.renameSync(`${cola}/${p}`, destino);
    const log = await Deno.open(`${here}/ultimo_render.txt`, { write: true, create: true, truncate: true });
    const proc = new Deno.Command(Deno.execPath(), { args: ["run", "-A", `${here}/render.ts`, modo, video], cwd: root, stdout: "piped", stderr: "piped" }).spawn();
    const enc = new TextEncoder();
    const pipe = async (r: ReadableStream<Uint8Array>) => { for await (const chunk of r) { await log.write(chunk); Deno.stdout.writeSync(chunk); } };
    await Promise.all([pipe(proc.stdout), pipe(proc.stderr)]);
    const st = await proc.status; await log.write(enc.encode(`\nFIN codigo=${st.code}\n`)); log.close();
    console.log(`[${stamp()}] Terminado ${video} (${modo}) codigo=${st.code}`);
  }
  await new Promise(r => setTimeout(r, 2000));
}
