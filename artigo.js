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

        container.innerHTML = `
            <h1>${artigo.titulo}</h1>
            <div class="data">${formatarData(artigo.data)}</div>
            <div class="conteudo">${artigo.conteudo}</div>
        `;
    } catch (e) {
        console.error(e);
        container.innerHTML = '<div class="carregando">Erro ao carregar.</div>';
    }
})();

function formatarData(iso) {
    const [ano, mes, dia] = iso.split('-');
    const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun',
                   'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    return `${dia} ${meses[parseInt(mes) - 1]} ${ano}`;
}