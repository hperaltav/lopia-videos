@echo off
rem LOPIA CONTENT STUDIO: abre el servidor local y el navegador. Cierra esta ventana para apagarlo.
cd /d "%~dp0"
start "" cmd /c "timeout /t 5 >nul & start http://localhost:8800"
deno run -A servidor.ts %*
pause
