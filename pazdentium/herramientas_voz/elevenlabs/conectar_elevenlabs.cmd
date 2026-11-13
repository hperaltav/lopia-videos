@echo off
cd /d "%~dp0"
echo Conectando tu cuenta de ElevenLabs (se abrira el navegador para autorizar)...
deno run -A npm:@elevenlabs/cli@latest onboard connect --env-path .env.local
echo.
echo Verificando la clave...
deno run -A npm:@elevenlabs/cli@latest onboard check --env-path .env.local
echo.
echo Listo. Puedes cerrar esta ventana.
pause
