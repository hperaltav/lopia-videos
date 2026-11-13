@echo off
cd /d "%~dp0"
echo Generando la voz con ElevenLabs...
deno run --env-file=.env.local --allow-env --allow-net=api.elevenlabs.io --allow-read --allow-write generar_voz.ts
echo.
echo Listo. Puedes cerrar esta ventana.
pause
