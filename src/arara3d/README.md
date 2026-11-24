# Arara 3D

Este pacote gera `dist/ciranda3d.js`, que expõe `window.Ciranda3D` com:

- `arara(el, itens, aoEscolher, opcoes)`: monta a arara do catálogo.
- `foto(spec, yaw, w, h)`: renderiza a foto de uma peça.
- `visor(canvas, spec)`: visor que gira na página da peça.
- `disponivel()`: diz se há WebGL.

## O que está aqui

- `src/entry.tsx`: ponto de entrada.
- `src/studio.ts`: estúdio de fotos e os modelos próprios do Ciranda (calça, saia, vestido, tênis e bolsa).
- `dist/`: o pacote já compilado, usado por `scripts/build.py`.

## O que não está aqui

A arara e os modelos de camiseta, moletom e camisa vêm do componente Clothes Rack, de DiMaac UI. A página do componente não informa a licença, então o código-fonte dele não foi incluído. Para recompilar:

1. Instale o componente pelo registro dele (https://ui.dimaac.com/components/clothes-rack) em `src/dimaac/`.
2. Aplique as adaptações do Ciranda: textos da interface em português e dois tipos de estampa a mais em `garment.ts` (`stripes` e `jacket`) e limite de 1,5 na densidade de pixels do renderizador.
3. Rode `sh build.sh`.
