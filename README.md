# Site — Paulo Henrique Souza (Nutricionista)

Site pessoal com link na bio, calculadora de IMC, artigos de nutrição e
contador de acessos/cliques.

## Como está organizado

```
.
├── index.html               Página inicial (link na bio)
├── informacoes.html         Lista de artigos
├── artigo.html              Leitor de artigo (?id=slug)
├── painel.html              Painel privado de estatísticas (não publicado)
│
├── css/
│   ├── style.css            Estilos base: variáveis, fundo, cartões, botões, modal
│   ├── informacoes.css      Páginas internas: topo, lista de artigos, leitura
│   └── painel.css           Só do painel de estatísticas
│
├── js/
│   ├── script.js            Utilidades gerais: animações de entrada, ano, IMC
│   ├── informacoes.js       Monta a lista de artigos
│   ├── artigo.js            Carrega um artigo pelo endereço (?id=...)
│   ├── analytics.js         Contador de acessos e cliques (GoatCounter)
│   └── painel.js            Só do painel de estatísticas
│
├── img/
│   ├── favicon.svg
│   ├── apple-touch-icon.png
│   ├── og-image.jpg         Imagem de preview ao compartilhar o link
│   └── img1.jpeg            Foto de perfil
│
├── informacoes/             Conteúdo dos artigos (um arquivo .js por artigo)
│   ├── como-ler-rotulos.js
│   └── erros-emagrecimento.js
│
├── servidor.js              Servidor local + leitura das estatísticas
├── COMO-MEDIR-ACESSOS.md    Passo a passo do contador e do painel
└── README.md                Este arquivo
```

## Como publicar

O GitHub Pages serve os arquivos da raiz, então os `.html` ficam na raiz e o
resto em pastas. Basta:

```sh
git add .
git commit -m "mensagem"
git push
```

## Como ver o site no seu computador

Para os artigos carregarem, é preciso um servidor local (abrir por `file://`
não funciona, porque o navegador bloqueia a leitura dos arquivos):

```sh
node servidor.js          # modo completo: site + dados do painel
# ou, se preferir algo mais simples:
python3 -m http.server 8811
```

Depois abra <http://127.0.0.1:8811/>.

O `servidor.js` tem uma vantagem: ele busca as estatísticas do GoatCounter pelo
seu computador, driblando o bloqueador de anúncios que barra `goatcounter.com`
no navegador. Detalhes em [COMO-MEDIR-ACESSOS.md](COMO-MEDIR-ACESSOS.md).

## Como adicionar um artigo novo

1. Crie um arquivo em `informacoes/`, copiando o formato dos existentes:

   ```js
   window.ARTIGO = {
       slug: 'meu-artigo',
       titulo: 'Título do artigo',
       data: '2026-10-15',
       resumo: 'Uma frase que resume o conteúdo.',
       conteudo: ` ... HTML do texto ... `,
   };
   ```

2. Registre o arquivo nas duas listas (elas precisam ficar iguais):
   `js/informacoes.js` e `js/artigo.js`, no topo:

   ```js
   const ARTIGOS = [
       './informacoes/como-ler-rotulos.js',
       './informacoes/erros-emagrecimento.js',
       './informacoes/meu-artigo.js',   // <-- novo
   ];
   ```

> Rode o site com um servidor local (ex.: `python3 -m http.server`) para testar:
> abrir os arquivos direto pelo `file://` impede o carregamento dos artigos.

## Contador de acessos

Veja [COMO-MEDIR-ACESSOS.md](COMO-MEDIR-ACESSOS.md).
