# Análisis de Stupy Doo: últimos 20 shorts

Corpus: 20 shorts publicados entre el 6 y el 10 de noviembre de 2026 (20 en 5 días, unos 4 al día). Todos a 30 FPS, verticales 9:16, de 137 a 176 s (promedio 153 s). El canal tiene 290 mil suscriptores y se describe como "un desarrollador de inteligencia artificial que en el fondo quiere ser youtuber".

Método: análisis cuadro a cuadro a 30 FPS (≈93.000 cuadros) para medir cortes, "holds" (cuadros repetidos) y cantidad de movimiento; hojas de contacto de 20 cuadros por video; tiras de 30 cuadros para los primeros segundos; transcripciones automáticas en español, con metadata, vistas y likes.

---

## 1. Dos formatos, dos estilos

| | **A. "Construimos X desde cero"** | **B. "Dato que contradice lo que crees"** |
|---|---|---|
| Videos | 01, 04, 05, 08, 09, 13, 14, 16, 17, 18, 19 (11) | 02, 03, 06, 07, 10, 11, 12, 15, 20 (9) |
| Ejemplos | bicicleta, impresora, guitarra, lancha, cerca eléctrica | nautilus y proporción áurea, estrella de mar, Plutón, reCAPTCHA |
| Estética | 3D estilizado con contorno tipo cómic | Motion graphics 2D/2.5D en fondo negro o crema |
| Vistas (mediana) | **811 mil** | 145 mil |
| Likes/vistas | 7,7 % | 8,3 % |

El formato A tiene unas 5,6 veces más vistas medianas: es el motor del canal. El formato B tiene una tasa de likes algo mayor, pero menos alcance.

---

## 2. Estilos de animación

### A. 3D "ilustración técnica"
- **Render toon/NPR:** colores planos pastel, contorno negro fino en las siluetas (efecto de tinta) y una textura de papel o grano sobre todo el cuadro. Parece un libro ilustrado de "cómo funcionan las cosas".
- **Sombras de color:** sombras duras azul-violeta en vez de grises. Es una decisión muy reconocible y barata de hacer (color de sombra en el shader).
- **Rayos X dibujados:** las partes ocultas (bajo el agua, dentro de una carcasa) se muestran como line-art en boceto encima del modelo (video 18: el motor de la lancha bajo el agua).
- **Escenarios simples:** una mesa, una calle con casas pastel, un lago con isla. Siempre un solo escenario por video.
- **Mascota:** un pino de boliche blanco con franjas rojas (en el video 09, un peón rojo) que "usa" el objeto: se sube a la bici o se sienta en la lancha. Da escala y humor sin animación de personaje compleja (es un objeto rígido).
- **Construcción incremental:** el objeto se arma pieza por pieza. Cada pieza nueva entra con un pequeño movimiento (cae, se desliza o se atornilla) cuando el guion la nombra.
- **Física real:** en el video 09, cuadros 7–29, la cámara de seguridad se cae y queda colgando del cable con un balanceo de péndulo amortiguado. Se ve como simulación de cuerpo rígido más cuerda, no como keyframes a mano.
- **Fallas visibles:** cada "problema" se muestra: la tinta mancha, la tabla se hunde, la pata gira. Es el remate visual de cada "Pero…".

### B. Motion graphics de divulgación
- **Paleta fija:** fondo negro azulado (≈#0d0d12) o crema; acentos **rojo**, **azul eléctrico** y **verde lima**; blanco y grises.
- **Texturas:** tramado de semitonos (halftone) en rellenos, nubes de puntos o partículas (el cerebro del video 02) y glitch en algunas transiciones.
- **Elementos de "evidencia":** tarjetas con nombre de investigador o institución en tipografía monoespaciada con cursor de máquina de escribir, años grandes en recuadro ("2008", "2023 · Nature"), contadores que suben ("819 millones de horas") y mini-gráficos que se dibujan.
- **Un solo objeto protagonista** que se transforma: la estrella de mar se colorea por zonas y la espiral se superpone a la concha.
- **2.5D:** los objetos estilo low-poly (Plutón, asteroides) giran en 3D dentro de la composición plana.

### Métricas técnicas a 30 FPS (los 20 videos)
- **Animación "on ones":** entre 92 % y 99 % de los cambios duran un solo cuadro. El movimiento es fluido a 30 FPS reales, sin la animación limitada a 12–15 FPS típica del 2D hecho a mano. Es render/procedural.
- **Pausas:** entre 9 % y 54 % de los cuadros son idénticos al anterior. Hay momentos quietos para que se lea el texto. Los videos 3D se mueven más (el video 17 tiene el máximo de movimiento) y los de dato, menos (el video 20 tiene un 54 % de cuadros quietos).
- **Muy pocos cortes duros:** entre 0 y 33 por video, con mediana ≈9. La toma media dura de 5 a 140 s. Los cambios de plano son sobre todo **movimientos de cámara continuos** (acercamiento a la pieza y regreso al plano general), como una sola toma que recorre la escena. El video con más cortes (17, impresora: 33 cortes, toma mediana de 1,6 s) es también uno de los más vistos.
- **El gancho visual empieza en el cuadro 0:** no hay intro, logo ni fade. En el video 09, el cuadro 0 ya muestra la cámara y en el cuadro 10 empieza la caída.
- **Audio continuo:** voz más música sin silencios de más de 0,4 s.

### Subtítulos
- Aparecen **palabra por palabra**, sincronizados con la voz. Cada palabra entra con un fade y un leve desplazamiento hacia arriba en unos 3 cuadros (video 03, cuadros 24–28).
- Son frases cortas de 2 a 5 palabras, no la oración completa.
- Usan una sans-serif bold redondeada, blanca o negra según el fondo, con **una palabra clave en rojo, azul o lima** ("directo a las **nalgas**", "solo por **fuera**").
- En el formato A, el **nombre de cada pieza** aparece como rótulo cuando el guion lo bautiza ("EL CABEZAL", "LA HORQUILLA").

---

## 3. Estructura del guion

La voz va a ≈3,4 palabras por segundo (≈200 palabras por minuto, rápido), con 440–610 palabras por video.

### Formato A: cadena problema → solución
```
1. GANCHO (título):     "Esa [pieza rara] de tu [objeto] NO está de adorno"
2. VERSIÓN MÍNIMA:      "Si pones [2-3 cosas simples], ya tienes un [objeto]."
3. BUCLE ×6-9:          "Pero [falla concreta y visual]."
                        "Así que / Lo que haces es [solución]."
                        "Ese es el [nombre técnico]."
4. PAYOFF:              la última pieza es la del título (la que "no está de adorno")
5. TIP PRÁCTICO:        "Si tu [objeto] [síntoma], [acción concreta]."
6. CIERRE FIJO:         "Y con esto ya puedes construir un [objeto] para tu [lugar]."
```
- En promedio aparecen 4–7 "Pero" y 5–9 "Ese es el…" por video: el ritmo es un problema cada 15–20 s.
- El título promete una pieza que **solo se explica al final**, y eso retiene hasta el cierre.
- El lenguaje es cotidiano y mexicano (tinaco, pijas, colonia, garrafones). Las magnitudes se comparan con objetos ("50 kg, como un costal de cemento").

### Formato B: afirmación contraintuitiva en bucle
```
1. AFIRMACIÓN = título:  "La estrella de mar es solo una cabeza."
2. MITO COMÚN:           "Mucha gente cree que..." / "Libros y museos repiten que..."
3. EVIDENCIA:            año + revista/institución + nombre del investigador
4. MECANISMO:            explicación paso a paso con una analogía cotidiana
5. GIRO PERSONAL:        conectar contigo ("Casi seguro tú eres una de ellas",
                         "Tus dedos son cinco rayas que se volvieron hueso")
6. LOOP:                 la última frase queda abierta y empalma con la primera
```
- **Bucle:** varios videos terminan a mitad de frase para empalmar con la primera línea cuando el short se repite. Por ejemplo, el 07 termina con "…aunque hayas hecho tu video con todo el corazón," y vuelve a empezar con "El algoritmo de TikTok no sabe si un video es bueno". Lo mismo pasa en 02, 03, 10 y 15. Esto infla las reproducciones repetidas.
- En la descripción repiten el gancho y citan fuentes (autores, año, revista).

---

## 4. Cómo genera los assets

Lo observado es seguro. Lo inferido, marcado con *(inferencia)*, se deduce del aspecto, el volumen y la consistencia, no de una fuente del canal.

**Observado**
- Hay dos sistemas visuales con reglas fijas (paleta, tipografía, shaders y mascota) que se repiten idénticas en todos los videos.
- Los modelos 3D son simples: primitivas, extrusiones y piezas mecánicas low/mid-poly con texturas casi planas.
- La animación está renderizada cuadro a cuadro a 30 FPS, con física en algunas escenas.
- Los subtítulos están sincronizados a nivel de palabra.
- Publican unos 4 videos al día, de casi 2,5 minutos cada uno.

**Inferido**
- *(inferencia)* Con unos 4 videos diarios de esta duración, el pipeline está muy automatizado: un LLM escribe el guion con la plantilla de arriba, la voz probablemente es TTS, y la alineación forzada de la voz da los tiempos por palabra que mueven subtítulos y animaciones.
- *(inferencia)* Las escenas parecen **generadas por código**: un motor 3D web (Three.js o similar) o Blender con scripts en Python. Lo sugieren el look NPR uniforme, la cámara procedural y las piezas que aparecen justo cuando se nombran. A 360p no se puede distinguir cuál.
- *(inferencia)* Los modelos se arman con piezas paramétricas (tubos, tablas, tornillos, engranes) más que modelados a mano. Probablemente los escribe el mismo LLM como código de geometría, y por eso el estilo "maqueta" es consistente.
- *(inferencia)* En el formato B, los gráficos (barras, espirales, contadores, tarjetas de cita) son plantillas de motion graphics parametrizadas con los datos del guion.

---

## 5. Qué copiar para nuestro proyecto en Three.js

1. **Empezar por el formato A**, porque es el que más alcance tiene: un objeto cotidiano, 6–9 problemas y una pieza "que no está de adorno".
2. **Guion como datos:** un JSON con `[{texto, pieza, accion_camara, falla}]` del que salen la voz, los subtítulos y la animación.
3. **Shader NPR propio:** contorno (inverted hull o detección de bordes en postprocesado), color de sombra azul-violeta, grano de papel en pantalla y paleta pastel.
4. **Cámara continua:** encuadres por pieza con interpolación suave; cortes duros solo para enfatizar.
5. **Física puntual** (cannon-es o Rapier) para las fallas: algo que cae, se hunde o cuelga.
6. **Subtítulos palabra por palabra** con una palabra en color, más rótulos con el nombre de cada pieza.
7. **Cuadro 0 con acción**, sin intro, y cierre que empalme con el inicio para el loop.
8. **Mascota-objeto** rígida que dé escala y humor sin rigging.
