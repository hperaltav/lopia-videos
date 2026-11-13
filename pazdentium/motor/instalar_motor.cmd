@echo off
cd /d "%~dp0"
set PATH=%USERPROFILE%\.local\bin;%PATH%
echo === Instalando ffmpeg (dentro del entorno local) ===
uv pip install --python ..\tts_local\.venv\Scripts\python.exe imageio-ffmpeg
..\tts_local\.venv\Scripts\python.exe -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())" > ffmpeg_path.txt
type ffmpeg_path.txt
echo === Descargando componentes del render (primera vez) ===
deno cache --allow-scripts npm:puppeteer-core@23.11.1
echo Listo. Puedes cerrar esta ventana.
pause
