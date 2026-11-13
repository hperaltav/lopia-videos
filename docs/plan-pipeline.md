# Plan del pipeline de videos

## Decisiones
- **Render en el PC** (GTX 1080 Ti) con Deno + puppeteer-core + Chrome (D3D11), cuadros por tubería a ffmpeg.
- **Dos etapas**: vista previa 15 FPS (540×960) → aprobación → final 30 FPS (1080×1920, x264 slow CRF 16).
- **Vigilante** (`motor/vigilante.ts`): procesa pedidos dejados en `motor/cola/` sin intervención manual.
- **Set de assets por marca**, creado una vez y reutilizado (logo, colores, tipografía, personajes, voz, cierre).
- **6–7 estilos de video**: animado 3D, revista/editorial, transiciones sobre video del cliente, datos, promoción, testimonio/FAQ, antes/después.

## Próximos pasos
1. Separar el código en librería reutilizable (personajes, arcada de dientes, corte, instrumentos, subtítulos, rótulos, CTA, sonidos).
2. Formato JSON de escenas (frase → escena, cámara, rótulos, efectos).
3. Kit de marca PazDentium (logo, paleta, voz Francisca/ElevenLabs, Dra. Verónica).
4. Sincronía voz-subtítulos por palabra.
5. Skill de producción.

## Aprendizajes
- Herramientas en capa aparte, siempre delante de dientes/encías.
- Arcada convexa: cada diente rota `+atan(1.1·x/2.56)`; encía curva con borde redondeado; labios y piel enmarcan la sonrisa.
- Capas del bracket: cuerpo < arco < liga < aletas.
- Placa y sarro crecen desde debajo de la encía (borde superior siempre oculto).
- Voz: ElevenLabs (Francisca) principal; Chatterbox local como respaldo (torch 2.6.0 cu126 para la 1080 Ti).
