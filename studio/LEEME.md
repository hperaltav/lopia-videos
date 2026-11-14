# LOPIA CONTENT STUDIO · versión local

Corre el Studio en tu PC y ábrelo desde el navegador. Guarda tus videos y fotos, escribe los guiones con Claude y genera los videos finales con la GPU.

## Primera vez (PC con Windows)
1. Copia esta carpeta `studio` junto a la carpeta `pazdentium` (por ejemplo `D:\claude\animaciones\studio`). Así usa el mismo ffmpeg del motor.
2. Opcional, para guiones con IA: copia `ejemplo_env.txt` como `.env` (sin extensión .txt) y pega tu clave de la API de Anthropic. Sin clave se usan plantillas.
3. Opcional: pon música con licencia comercial en la carpeta `musica`.
4. Doble clic en `iniciar_studio.cmd`. Se abre `http://localhost:8800`.

Requisitos: Deno y Google Chrome (los mismos del motor de render).

## En el MacBook
1. Opcional: copia `ejemplo_env.txt` como `.env` y pega tu clave de la API de Anthropic.
2. Doble clic en `iniciar_studio.command`. La primera vez instala Deno y ffmpeg dentro de tu usuario y pide tener Google Chrome.
   Si macOS dice que no puede abrirlo, haz clic derecho → Abrir → Abrir.
3. Se abre `http://localhost:8800`. Los renders usan la GPU del Mac.

## Desde otro equipo de tu casa u oficina (ej. el MacBook)
Usa `iniciar_studio_red.cmd` (Windows pedirá permiso en el firewall). En el otro equipo abre `http://IP-DEL-PC:8800`;
la IP aparece con el comando `ipconfig` (Dirección IPv4). Solo funciona dentro de la misma red.

## Dónde queda todo
- `datos\videos.json`: tus videos y sus guiones.
- `datos\assets\`: fotos subidas.
- `datos\finales\`: videos finales en alta calidad (1080×1920, 30 cuadros por segundo). También se descargan desde "Mis contenidos".

## Notas
- Los renders se hacen uno a la vez; si apruebas varios, quedan en cola.
- Si cierras la ventana del servidor durante un render, ese video vuelve a "Borrador" y hay que aprobarlo de nuevo.
- La clave de la API solo la lee el servidor; nunca llega al navegador.
