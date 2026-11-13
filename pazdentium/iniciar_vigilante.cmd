@echo off
title Vigilante de render PazDentium
cd /d "%~dp0"
deno run -A motor\vigilante.ts
pause
