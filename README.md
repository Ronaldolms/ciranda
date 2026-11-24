# Ciranda

Brechó online em que cada peça mostra quantas voltas já deu e quanto de água e carbono deixou de ser gasto. MVP da disciplina Análise e Projeto de Sistemas (CEUB, 2026.2).

![Catálogo do Ciranda com a arara 3D](site/og.png)

## O que o MVP faz

- Catálogo com arara 3D, busca e filtros.
- Página da peça com visor 3D que gira.
- Sacola, reserva de 30 minutos e pagamento por Pix (simulado).
- Linha do tempo do pedido, etiqueta e rastreio (simulados).
- Consignação: o fornecedor publica, a administradora aprova, o repasse é calculado.
- Impacto ambiental por peça e programa de pontos.
- Painel "Bastidores": mostra as mensagens entre fronteira, controle e entidades na ordem em que acontecem, como no diagrama de sequência.

Pix, entrega e banco de dados são simulados no navegador. Nenhuma compra é real. Os dados ficam no `localStorage` de quem acessa.

## Perfis de demonstração

| Perfil | E-mail | Senha |
| --- | --- | --- |
| Cliente | marina@ciranda.app | ciranda123 |
| Fornecedor | ana@ciranda.app | ciranda123 |
| Administradora | lucia@ciranda.app | ciranda123 |

No rodapé do site há um botão para restaurar os dados de demonstração.

## Rodar

Não precisa instalar nada. Sirva a pasta `site/`:

```sh
python3 -m http.server 8000 --directory site
```

## Deploy

O `vercel.json` da raiz já aponta a pasta `site/` como saída e configura cache e cabeçalhos. Na Vercel, importe o repositório com framework "Other" e sem comando de build. Em outro serviço de site estático, publique a pasta `site/`.

## Estrutura

```
site/            site pronto (gerado, versionado para facilitar o deploy)
src/app/         aplicação em JavaScript puro
  dominio.js     regras de negócio, repositório e a Fachada de Compra
  arte.js        logo, ícones e fotos das peças
  ui.js          telas e eventos
  estilo.css     base do visual
  vida.css       cor, divisórias e movimento
src/arara3d/     arara 3D e estúdio de fotos (React + three.js)
src/estatico/    ícones e arquivos copiados como estão
scripts/build.py gera site/ a partir de src/
marca/           logo e símbolo
```

## Arquitetura

Camadas de fronteira (telas), controle (módulos de negócio) e entidades, com persistência em `localStorage`. A finalização do pedido passa por uma Fachada (`FachadaDeCompra`), que coordena Pedidos, Catálogo, Pontos, Pagamento e Consignação para que a tela não precise conhecer a ordem das operações.

## Gerar o site de novo

```sh
python3 scripts/build.py
```

O script junta os arquivos de `src/`, minifica (se o esbuild estiver instalado em `src/arara3d/node_modules`) e grava `site/`.

As fotos das peças de demonstração já vêm renderizadas em `src/estatico/fotos/`, para o site funcionar mesmo em navegador sem WebGL. Se mudar as peças ou os modelos 3D, gere as fotos de novo com `python3 scripts/fotos.py` e rode o build outra vez.

## Créditos

- Arara 3D: componente [Clothes Rack](https://ui.dimaac.com/components/clothes-rack), de DiMaac UI. O código-fonte do componente não está neste repositório; veja `src/arara3d/README.md`.
- [three.js](https://threejs.org) e [React](https://react.dev).
- Fontes: Bricolage Grotesque, Hanken Grotesk e DM Mono (SIL Open Font License).

Projeto acadêmico do grupo Ciranda, CEUB, 2026.
