#!/usr/bin/env python3
"""Gera a pasta site/ a partir de src/. Uso: python3 scripts/build.py
Minifica com esbuild se ele estiver instalado em src/arara3d/node_modules; sem ele, copia sem minificar."""
import hashlib, os, shutil, subprocess
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP, A3D, EST, S = (os.path.join(RAIZ, p) for p in ("src/app", "src/arara3d", "src/estatico", "site"))
ESB = os.path.join(A3D, "node_modules/.bin/esbuild")
ler = lambda *p: open(os.path.join(*p), encoding="utf-8").read()

shutil.rmtree(S, ignore_errors=True)
os.makedirs(os.path.join(S, "assets"))

def grava(nome, ext, conteudo, mini=None):
    if mini and os.path.exists(ESB):
        conteudo = subprocess.run([ESB, "--minify", "--loader=" + mini], input=conteudo.encode(), capture_output=True, check=True).stdout.decode()
    arq = f"assets/{nome}.{hashlib.sha256(conteudo.encode()).hexdigest()[:8]}.{ext}"
    open(os.path.join(S, arq), "w", encoding="utf-8").write(conteudo)
    return arq

css = grava("ciranda", "css", ler(A3D, "dist/tw.css") + ler(APP, "estilo.css") + ler(APP, "vida.css"), "css")
j3d = grava("arara3d", "js", ler(A3D, "dist/ciranda3d.js"))
app = grava("app", "js", '"use strict";{\n' + ler(APP, "dominio.js") + ler(APP, "arte.js") + ler(APP, "ui.js") + "\n}", "js")

TIT = "Ciranda · brechó online"
DESC = "Brechó online com arara 3D: cada peça mostra quantas voltas já deu e quanto de água e carbono deixou de ser gasto. MVP acadêmico, CEUB 2026."
open(os.path.join(S, "index.html"), "w", encoding="utf-8").write(f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{TIT}</title>
<meta name="description" content="{DESC}">
<meta name="theme-color" content="#FFD21F">
<meta name="robots" content="noindex">
<meta property="og:type" content="website"><meta property="og:title" content="{TIT}">
<meta property="og:description" content="{DESC}"><meta property="og:image" content="/og.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Hanken+Grotesk:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/{css}">
<link rel="preload" href="/{j3d}" as="script"><link rel="preload" href="/{app}" as="script">
</head>
<body>
{ler(APP, "corpo.html")}<noscript><p style="padding:24px;font-family:sans-serif">O Ciranda precisa de JavaScript para funcionar.</p></noscript>
<script defer src="/{j3d}"></script>
<script defer src="/{app}"></script>
</body>
</html>
""")
shutil.copy(os.path.join(APP, "favicon.svg"), S)
for a in os.listdir(EST):
    shutil.copy(os.path.join(EST, a), S)
print("site/ gerado:", css, j3d, app)
