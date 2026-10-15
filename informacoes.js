// ============================================
// LISTA DE ARTIGOS
// Adicione o nome do arquivo novo aqui embaixo
// ============================================
const ARTIGOS = [
    './informacoes/como-ler-rotulos.js',
    './informacoes/erros-emagrecimento.js',
];

// ============================================
// CARREGA E MONTA A LISTAGEM
// ============================================
(async function () {
    const container = document.getElementById('listaInfo');
    if (!container) return;

    try {
        // Carrega todos os arquivos em paralelo
        const carregados = await Promise.all(
            ARTIGOS.map(async (caminho) => {
                try {
                    const res = await fetch(caminho);
                    if (!res.ok) throw new Error('não encontrado');
                    const texto = await res.text();

                    // Cada arquivo usa: window.ARTIGO = { ... }
                    // Extrai o objeto com segurança
                    const match = texto.match(/window\.ARTIGO\s*=\s*([\s\S]*?);?\s*$/);
                    if (!match) throw new Error('formato inválido');

                    // eslint-disable-next-line no-new-func
                    return new Function('return ' + match[1])();
                } catch (e) {
                    console.warn('Erro ao carregar ' + caminho, e);
                    return null;
                }
            })
        );

        // Remove os que falharam e ordena por data (mais recente primeiro)
        const validos = carregados
            .filter(Boolean)
            .sort((a, b) => new Date(b.data) - new Date(a.data));

        if (validos.length === 0) {
            container.innerHTML = '<div class="carregando">Nenhuma informação publicada ainda.</div>';
            return;
        }

        // Renderiza
        container.innerHTML = validos.map((artigo, i) => `
            <a href="artigo.html?id=${encodeURIComponent(artigo.slug)}"
               class="card-info reveal"
               style="--i:${i}"
               aria-label="Ler: ${artigo.titulo}">
                <span class="indice" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>

                <span class="card-texto">
                    <span class="data">${formatarData(artigo.data)}</span>
                    <h2>${artigo.titulo}</h2>
                    <span class="resumo">${artigo.resumo}</span>
                </span>

                <span class="card-seta" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"/>
                        <polyline points="12 5 19 12 12 19"/>
                    </svg>
                </span>
            </a>
        `).join('');

        // Ativa as animações de entrada (função definida em script.js)
        if (typeof revelarAoRolar === 'function') {
            revelarAoRolar();
        } else {
            // Independência total: se script.js não estiver na página,
            // os cards aparecem mesmo assim (nunca ficam invisíveis).
            container.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
        }
    } catch (e) {
        console.error(e);
        container.innerHTML = '<div class="carregando">Erro ao carregar informações.</div>';
    }
})();

function formatarData(iso) {
    const [ano, mes, dia] = iso.split('-');
    const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun',
                   'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    return `${dia} ${meses[parseInt(mes) - 1]} ${ano}`;
}
