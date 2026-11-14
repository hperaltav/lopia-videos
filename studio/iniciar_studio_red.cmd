@echo off
rem Igual que iniciar_studio.cmd, pero tambien accesible desde otros equipos de tu red (ej. el MacBook).
cd /d "%~dp0"
start "" cmd /c "timeout /t 5 >nul & start http://localhost:8800"
deno run -A servidor.ts --red
pause
