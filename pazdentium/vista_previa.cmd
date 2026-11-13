@echo off
rem Vista previa (15 FPS) del video mas reciente. Tambien puedes arrastrar la carpeta de un video sobre este archivo.
cd /d "%~dp0"
deno run -A motor\render.ts preview %1 > motor\ultimo_render.txt 2>&1
type motor\ultimo_render.txt
echo Listo. Puedes cerrar esta ventana.
pause
