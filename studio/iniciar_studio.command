#!/bin/bash
# LOPIA CONTENT STUDIO para Mac: doble clic para abrir. Cierra esta ventana para apagarlo.
# La primera vez instala Deno y ffmpeg dentro de tu usuario (no pide contraseña de administrador).
cd "$(dirname "$0")"
export PATH="$HOME/.deno/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"
pausa() { echo; read -n 1 -s -r -p "Presiona una tecla para cerrar…"; echo; }

if ! command -v deno >/dev/null 2>&1; then
  echo "Instalando Deno (solo la primera vez)…"
  curl -fsSL https://deno.land/install.sh | sh -s -- -y >/dev/null || { echo "No pude instalar Deno. Revisa tu conexión."; pausa; exit 1; }
  export PATH="$HOME/.deno/bin:$PATH"
fi

if [ ! -d "/Applications/Google Chrome.app" ]; then
  echo "Falta Google Chrome. Instálalo desde https://www.google.com/chrome y vuelve a abrir este archivo."; pausa; exit 1
fi

if command -v ffmpeg >/dev/null 2>&1; then export FFMPEG="$(command -v ffmpeg)"
elif [ -x "herramientas/ffmpeg" ]; then export FFMPEG="$PWD/herramientas/ffmpeg"
else
  echo "Descargando ffmpeg (solo la primera vez)…"
  ARQ=$([ "$(uname -m)" = "arm64" ] && echo arm64 || echo x64)
  URL=$(deno eval "const r=await fetch('https://registry.npmjs.org/@ffmpeg-installer/darwin-$ARQ/latest');console.log((await r.json()).dist.tarball)")
  mkdir -p herramientas/tmp_ffmpeg && curl -fsSL "$URL" | tar -xz -C herramientas/tmp_ffmpeg \
    && mv herramientas/tmp_ffmpeg/package/ffmpeg herramientas/ffmpeg && chmod +x herramientas/ffmpeg
  rm -rf herramientas/tmp_ffmpeg
  if [ -x "herramientas/ffmpeg" ]; then export FFMPEG="$PWD/herramientas/ffmpeg"
  else echo "No pude descargar ffmpeg. Puedes instalarlo con Homebrew: brew install ffmpeg"; pausa; exit 1; fi
fi

(sleep 5; open "http://localhost:8800") &
deno run -A servidor.ts "$@"
pausa
