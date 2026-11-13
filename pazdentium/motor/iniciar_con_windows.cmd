@echo off
rem Hace que el vigilante de render se inicie solo al encender el PC (minimizado).
set "DEST=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\vigilante_pazdentium.cmd"
(echo @echo off
echo start "Vigilante de render PazDentium" /min cmd /c "cd /d "%~dp0.." ^&^& deno run -A motor\vigilante.ts") > "%DEST%"
echo Listo: el vigilante se iniciara solo cada vez que enciendas el PC.
echo Para quitarlo, borra: %DEST%
pause
