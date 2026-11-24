#!/bin/sh
# Gera dist/ciranda3d.js e dist/tw.css. Antes, instale o componente Clothes Rack
# em src/dimaac/ (veja o README desta pasta).
cd "$(dirname "$0")" && npm install && \
npx esbuild src/entry.tsx --bundle --minify --format=iife --target=es2020 --jsx=automatic --define:process.env.NODE_ENV='"production"' --outfile=dist/ciranda3d.js --log-level=error && \
npx @tailwindcss/cli -i tw.css -o dist/tw.css --minify
