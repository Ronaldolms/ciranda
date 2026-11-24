#!/usr/bin/env python3
"""Renderiza as fotos 3D das peças de demonstração e grava em src/estatico/fotos/, com o
índice em src/app/fotos.js. Assim o site mostra as roupas mesmo sem WebGL e sem gastar
processamento no aparelho de quem visita. Requer: pip install playwright && playwright install chromium.
Uso: python3 scripts/build.py && python3 scripts/fotos.py && python3 scripts/build.py"""
import asyncio, base64, functools, hashlib, http.server, json, os, threading
from playwright.async_api import async_playwright
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEST = os.path.join(RAIZ, "src/estatico/fotos"); os.makedirs(DEST, exist_ok=True)
srv = http.server.ThreadingHTTPServer(("127.0.0.1", 8799), functools.partial(http.server.SimpleHTTPRequestHandler, directory=os.path.join(RAIZ, "site")))
srv.RequestHandlerClass.log_message = lambda *a: None
threading.Thread(target=srv.serve_forever, daemon=True).start()
JS = """async () => {
  const b64 = (blob) => new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result.split(",")[1]); f.readAsDataURL(blob); });
  const saida = {}, D = window.CirandaDev;
  for (const p of D.pecas()) { if (p.fotos && p.fotos.length) continue; const spec = D.spec3d(p), s = JSON.stringify(spec);
    for (const yaw of D.YAW) { const k = s + "|" + yaw; if (saida[k]) continue; const blob = await window.Ciranda3D.fotoBlob(spec, yaw, 480, 600); if (blob) saida[k] = await b64(blob); } }
  return saida; }"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
        pg = await b.new_page(); await pg.goto("http://127.0.0.1:8799/"); await pg.wait_for_selector("[data-acao=demo]")
        fotos = await pg.evaluate(JS); await b.close()
    indice = {}
    for k, dados in fotos.items():
        bruto = base64.b64decode(dados); nome = hashlib.sha256(bruto).hexdigest()[:10] + ".webp"
        open(os.path.join(DEST, nome), "wb").write(bruto); indice[k] = nome
    open(os.path.join(RAIZ, "src/app/fotos.js"), "w", encoding="utf-8").write("window.CIRANDA_FOTOS=" + json.dumps(indice, ensure_ascii=False, separators=(",", ":")) + ";\n")
    print(len(indice), "fotos,", sum(os.path.getsize(os.path.join(DEST, f)) for f in os.listdir(DEST)) // 1024, "KB")
asyncio.run(main())
