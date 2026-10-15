// ============================================
// MESMA LISTA de informacoes.js (mantenha sincronizada)
// ============================================
const ARTIGOS = [
    './informacoes/como-ler-rotulos.js',
    './informacoes/erros-emagrecimento.js',
];

(async function () {
    const container = document.getElementById('artigo');
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('id');

    if (!slug) {
        container.innerHTML = '<div class="carregando">Informação não encontrada.</div>';
        return;
    }

    try {
        const carregados = await Promise.all(
            ARTIGOS.map(async (caminho) => {
                try {
                    const res = await fetch(caminho);
                    const texto = await res.text();
                    const match = texto.match(/window\.ARTIGO\s*=\s*([\s\S]*?);?\s*$/);
                    // eslint-disable-next-line no-new-func
                    return match ? new Function('return ' + match[1])() : null;
                } catch (e) {
                    return null;
                }
            })
        );

        const artigo = carregados.filter(Boolean).find(a => a.slug === slug);

        if (!artigo) {
            container.innerHTML = '<div class="carregando">Informação não encontrada.</div>';
            return;
        }

        document.title = artigo.titulo + ' - Paulo Henrique Souza';

        // Atualiza também o preview de compartilhamento
        const descricao = document.querySelector('meta[name="description"]');
        const ogTitulo = document.querySelector('meta[property="og:title"]');
        const ogDescricao = document.querySelector('meta[property="og:description"]');
        if (descricao) descricao.setAttribute('content', artigo.resumo);
        if (ogTitulo) ogTitulo.setAttribute('content', artigo.titulo);
        if (ogDescricao) ogDescricao.setAttribute('content', artigo.resumo);

        const dataFormatada = formatarData(artigo.data);
        const tempo = tempoDeLeitura(artigo.conteudo);

        container.classList.add('reveal');

        container.innerHTML = `
            <h1>${artigo.titulo}</h1>
            <div class="meta">
                <span>${dataFormatada}</span>
                <span class="sep" aria-hidden="true"></span>
                <span>${tempo} min de leitura</span>
            </div>
            <div class="conteudo">${artigo.conteudo}</div>
        `;

        // Ativa as animações e a barra de progresso (funções de script.js)
        if (typeof revelarAoRolar === 'function') {
            revelarAoRolar();
        } else {
            // Independência total: sem script.js o texto aparece mesmo assim.
            container.classList.add('is-visible');
        }
        iniciarProgressoDeLeitura();
    } catch (e) {
        console.error(e);
        container.innerHTML = '<div class="carregando">Erro ao carregar.</div>';
    }
})();

// --------------------------------------------
// Barra fina de progresso no topo da página
// --------------------------------------------
function iniciarProgressoDeLeitura() {
    const barra = document.createElement('div');
    barra.className = 'leitura-progresso';
    barra.setAttribute('aria-hidden', 'true');
    document.body.appendChild(barra);

    let agendado = false;

    function atualizar() {
        agendado = false;
        const alturaTotal = document.documentElement.scrollHeight - window.innerHeight;
        const progresso = alturaTotal > 0 ? Math.min(window.scrollY / alturaTotal, 1) : 0;
        barra.style.transform = `scaleX(${progresso})`;
    }

    window.addEventListener('scroll', () => {
        if (agendado) return;
        agendado = true;
        window.requestAnimationFrame(atualizar);
    }, { passive: true });

    atualizar();
}

// --------------------------------------------
// Tempo estimado de leitura (200 palavras/min)
// --------------------------------------------
function tempoDeLeitura(html) {
    const texto = String(html).replace(/<[^>]*>/g, ' ');
    const palavras = texto.split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(palavras / 200));
}

function formatarData(iso) {
    const [ano, mes, dia] = iso.split('-');
    const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun',
                   'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    return `${dia} ${meses[parseInt(mes) - 1]} ${ano}`;
}
