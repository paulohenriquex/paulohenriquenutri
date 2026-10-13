// ============================================
// CALCULADORA DE IMC
// ============================================
(function () {
    const modal = document.getElementById('modalImc');
    const btnAbrir = document.getElementById('abrirImc');
    const btnCalcular = document.getElementById('btnCalcular');
    const inputPeso = document.getElementById('peso');
    const inputAltura = document.getElementById('altura');
    const valorImc = document.getElementById('valorImc');
    const classificacao = document.getElementById('classificacao');

    // Abre o modal
    btnAbrir.addEventListener('click', () => {
        modal.classList.add('aberto');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        setTimeout(() => inputPeso.focus(), 300);
    });

    // Fecha (clique no overlay ou no X)
    modal.querySelectorAll('[data-fechar]').forEach(el => {
        el.addEventListener('click', fechar);
    });

    // Fecha com ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('aberto')) {
            fechar();
        }
    });

    function fechar() {
        modal.classList.remove('aberto');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
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