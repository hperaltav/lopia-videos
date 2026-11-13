# lopia-videos

Pipeline de videos animados con three.js para redes sociales (Lopia). Primer cliente: **PazDentium**.

## Estructura
- `pazdentium/` — misma estructura que la carpeta del PC (`D:\claude\animaciones\pazdentium`):
  - `vista_previa.cmd` / `final.cmd` — render manual (15 FPS / 30 FPS) del video más reciente.
  - `iniciar_vigilante.cmd` — deja corriendo el vigilante que renderiza los pedidos de `motor/cola/`.
  - `motor/` — `render.ts` (render con GPU), `vigilante.ts`, fuentes. Requiere `motor/node_modules/three/build/three.module.js` y `three.core.js` (three r17x) y `motor/ffmpeg_path.txt` (lo crea `instalar_motor.cmd`).
  - `videos/<nombre>/` — `escena.html` (animación), `guion.txt`. La voz y la mezcla (`*.mp3`, `*.wav`) no se suben.
  - `marca/` — logos y personajes (Dra. Verónica).
  - `herramientas_voz/elevenlabs/` — generación de voz (la clave va en `.env.local`, que no se sube).
- `herramientas/` — scripts de producción en la nube: armado de escenas (`build.py`, `parts.py`, `brackets_main.js`), separación de la voz por frases (`split4.py`), mezcla de música y efectos (`audio6.py`), render de prueba (`render.mjs`).
- `docs/` — análisis de referencia y plan del pipeline.

## Videos
| Video | Escena | Notas |
|---|---|---|
| Brackets | `pazdentium/videos/brackets/escena.html` | 52 s, Dra. Verónica al inicio y cierre |
| Limpieza | `pazdentium/videos/limpieza/escena.html` | 70 s, Dra. Verónica como dentista |
| Resinas | `pazdentium/videos/resinas/escena.html` | 47 s, giro de 180° al final |
