// ============================================
// INICIALIZAÇÃO GERAL (todas as páginas)
// ============================================
document.addEventListener('DOMContentLoaded', function () {
    revelarAoRolar();
    atualizarAno();
    botaoWhatsAppAoRolar();
});

// Rede de segurança: nada pode ficar invisível para sempre.
// Se qualquer coisa falhar, os elementos aparecem em 2s.
window.addEventListener('load', function () {
    setTimeout(mostrarTudo, 2000);
});

function mostrarTudo() {
    document.querySelectorAll('.reveal:not(.is-visible)').forEach(el => {
        el.style.transitionDelay = '0s';
        el.classList.add('is-visible');
    });
}

// --------------------------------------------
// Revela elementos .reveal quando entram na tela
// (usa --i para escalonar e --d para atraso manual)
// --------------------------------------------
function revelarAoRolar() {
    const elementos = Array.from(document.querySelectorAll('.reveal'));
    if (!elementos.length) return;

    try {
        // Sem IntersectionObserver: mostra tudo imediatamente
        if (!('IntersectionObserver' in window)) {
            elementos.forEach(el => el.classList.add('is-visible'));
            return;
        }

        const observador = new IntersectionObserver((entradas) => {
            entradas.forEach(entrada => {
                if (!entrada.isIntersecting) return;
                const el = entrada.target;
                const passo = el.style.getPropertyValue('--i');
                const atrasoBase = parseFloat(getComputedStyle(el).getPropertyValue('--d')) || 0;
                el.style.transitionDelay = passo !== ''
                    ? (atrasoBase + Number(passo) * 0.07).toFixed(2) + 's'
                    : atrasoBase + 's';
                el.classList.add('is-visible');
                observador.unobserve(el);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

        elementos.forEach(el => observador.observe(el));
    } catch (e) {
        // Nunca deixar conteúdo escondido por causa da animação
        console.warn('Animação de entrada desativada:', e);
        elementos.forEach(el => el.classList.add('is-visible'));
    }
}

// --------------------------------------------
// Ano atual no rodapé
// --------------------------------------------
function atualizarAno() {
    document.querySelectorAll('[data-ano]').forEach(el => {
        el.textContent = new Date().getFullYear();
    });
}

// --------------------------------------------
// O botão flutuante só aparece depois de rolar
// --------------------------------------------
function botaoWhatsAppAoRolar() {
    const botao = document.querySelector('.float-wpp');
    if (!botao) return;

    let visivel = null;
    const limite = 180;

    function atualizar() {
        const deveAparecer = window.scrollY > limite;
        if (deveAparecer === visivel) return;

        visivel = deveAparecer;
        botao.style.opacity = deveAparecer ? '1' : '0';
        botao.style.pointerEvents = deveAparecer ? 'auto' : 'none';
        botao.style.transform = deveAparecer ? '' : 'translateY(14px) scale(.9)';
    }

    botao.style.transition = 'opacity .35s ease, transform .35s ease, background .4s ease, box-shadow .4s ease';
    window.addEventListener('scroll', atualizar, { passive: true });
    atualizar();
}

// ============================================
// CALCULADORA DE IMC (página inicial)
// ============================================
(function () {
    const modal = document.getElementById('modalImc');
    const btnAbrir = document.getElementById('abrirImc');
    const btnCalcular = document.getElementById('btnCalcular');
    const inputPeso = document.getElementById('peso');
    const inputAltura = document.getElementById('altura');
    const valorImc = document.getElementById('valorImc');
    const classificacao = document.getElementById('classificacao');

    // Sai silenciosamente se não existir modal nesta página
    if (!modal || !btnAbrir || !btnCalcular || !inputPeso || !inputAltura) return;

    let focoAnterior = null;

    // Abre o modal
    btnAbrir.addEventListener('click', () => {
        focoAnterior = document.activeElement;
        modal.classList.add('aberto');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        setTimeout(() => inputPeso.focus(), 320);
    });

    // Fecha (clique no overlay ou no X)
    modal.querySelectorAll('[data-fechar]').forEach(el => {
        el.addEventListener('click', fechar);
    });

    // Fecha com ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('aberto')) fechar();
    });

    function fechar() {
        modal.classList.remove('aberto');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        if (focoAnterior) focoAnterior.focus();
    }

    // Calcula IMC
    btnCalcular.addEventListener('click', calcular);

    // Enter nos inputs também calcula
    [inputPeso, inputAltura].forEach(input => {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') calcular();
        });
    });

    function calcular() {
        const peso = parseFloat(inputPeso.value);
        const alturaCm = parseFloat(inputAltura.value);

        if (!peso || !alturaCm || peso < 20 || peso > 300 || alturaCm < 80 || alturaCm > 250) {
            valorImc.textContent = '--';
            classificacao.textContent = 'Verifique os valores informados';
            classificacao.style.color = '#f87171';
            return;
        }

        const alturaM = alturaCm / 100;
        const imc = peso / (alturaM * alturaM);
        const imcFormatado = imc.toFixed(1).replace('.', ',');

        let texto = '';
        let cor = '';

        if (imc < 18.5) {
            texto = 'Abaixo do peso';
            cor = '#60a5fa';
        } else if (imc < 25) {
            texto = 'Peso normal';
            cor = '#4ade80';
        } else if (imc < 30) {
            texto = 'Sobrepeso';
            cor = '#facc15';
        } else if (imc < 35) {
            texto = 'Obesidade grau I';
            cor = '#fb923c';
        } else if (imc < 40) {
            texto = 'Obesidade grau II';
            cor = '#f87171';
        } else {
            texto = 'Obesidade grau III';
            cor = '#ef4444';
        }

        valorImc.textContent = imcFormatado;
        classificacao.textContent = texto;
        classificacao.style.color = cor;
    }
})();
