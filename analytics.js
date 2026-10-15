/* ============================================================
   CONTADOR DE ACESSOS E CLIQUES — GoatCounter
   ============================================================

   O código da sua conta já está preenchido abaixo
   (paulohenriquenutri). Nada mais precisa ser feito para
   a contagem funcionar: basta publicar o site.

   O que é contado:
   - cada visita à página inicial, informações e artigos;
   - cada clique nos botões de WhatsApp, como evento separado
     (whatsapp-botao-principal e whatsapp-botao-flutuante).

   Sem cookies e sem guardar dados pessoais (conforme as regras
   do GoatCounter), então não precisa de aviso de LGPD.

   IMPORTANTE: não adicione a tag <script ... count.js> direto no
   HTML. Este arquivo já faz isso, e a tag duplicada faria cada
   visita ser contada duas vezes.
   ============================================================ */
(function () {
    var CONFIG = {
        // Código da conta GoatCounter (o endereço é CODIGO.goatcounter.com)
        CODIGO: 'https://paulohenriquenutri.goatcounter.com',

        // Em qual endereço a contagem roda. Só mude se usar domínio próprio.
        URL: 'https://gc.zgo.at/count.js',

        // O site fica em /paulohenriquenutri/ no GitHub Pages.
        // Isso faz os relatórios mostrarem "/", "/informacoes.html" etc.
        PREFIXO: '/paulohenriquenutri',

        // Contar também os acessos feitos no seu computador?
        // true  = sim (útil enquanto você testa o painel)
        // false = não (recomendado depois de testar, para os seus
        //         próprios acessos não entrarem nas estatísticas)
        CONTAR_LOCAL: true,

        // true = mostra no console o que foi contado (ajuda a testar)
        DEBUG: false,
    };

    // ---------------- Não é preciso mexer daqui para baixo ----------------

    var local = location.hostname === 'localhost' ||
        location.hostname === '127.0.0.1' ||
        location.protocol === 'file:';

    function registrarNoConsole(mensagem, dado) {
        if (CONFIG.DEBUG) console.log('[analytics] ' + mensagem, dado || '');
    }

    if (!CONFIG.CODIGO) {
        registrarNoConsole('GoatCounter desativado: preencha CODIGO em analytics.js');
        return;
    }

    if (local && !CONFIG.CONTAR_LOCAL) {
        registrarNoConsole('Acesso local ignorado (CONTAR_LOCAL = false)');
        return;
    }

    // Preserva qualquer configuração já existente (evita sobrescrever)
    var gc = window.goatcounter || {};

    gc.path = function (p) {
        // Remove o /paulohenriquenutri do início para os relatórios
        // ficarem limpos: "/", "/informacoes.html", "/artigo.html"...
        if (CONFIG.PREFIXO && p && p.indexOf(CONFIG.PREFIXO) === 0) {
            return p.slice(CONFIG.PREFIXO.length) || '/';
        }
        return p || location.pathname;
    };

    // O count.js ignora acessos locais, a menos que allow_local seja true.
    // Assim o painel pode ser testado no seu computador.
    gc.allow_local = true;

    window.goatcounter = gc;

    var script = document.createElement('script');
    script.async = true;
    script.src = CONFIG.URL;
    script.setAttribute('data-goatcounter', 'https://' + CONFIG.CODIGO + '.goatcounter.com/count');
    script.onerror = function () {
        registrarNoConsole('Não foi possível carregar o contador (bloqueador de anúncios?)');
    };
    document.head.appendChild(script);

    /* ---------------------------------------------
       CLIQUE NO WHATSAPP

       Os botões já têm data-goatcounter-click, então o próprio
       count.js registra o evento automaticamente (sem risco de
       contar duas vezes).

       O código abaixo é uma rede de segurança:
       - atende qualquer botão futuro que tenha data-wpp mas não
         tenha data-goatcounter-click;
       - se a pessoa clicar antes do count.js terminar de carregar,
         o clique fica guardado e é enviado assim que ele chegar.
       --------------------------------------------- */
    var pendentes = [];

    function eventosJaProntos() {
        return window.goatcounter &&
            typeof window.goatcounter.count === 'function' &&
            window.goatcounter.loaded;
    }

    function enviarPendentes() {
        if (!pendentes.length || !eventosJaProntos()) return;

        var fila = pendentes.slice();
        pendentes.length = 0;

        fila.forEach(function (evento) {
            registrarNoConsole('Evento enviado', evento.path);
            window.goatcounter.count(evento);
        });
    }

    window.addEventListener('goatcounter:load', function () {
        registrarNoConsole('Contador carregado');
        enviarPendentes();
    });

    document.addEventListener('click', function (evento) {
        var alvo = evento.target.closest ? evento.target.closest('[data-wpp]') : null;
        if (!alvo) return;

        // Já tratado pelo count.js via data-goatcounter-click
        if (alvo.hasAttribute('data-goatcounter-click')) return;

        var nome = 'whatsapp-' + (alvo.getAttribute('data-wpp') || 'botao');
        var dados = {
            path: nome,
            title: 'Clique no WhatsApp — ' + (alvo.getAttribute('data-wpp') || 'botao'),
            event: true,
        };

        if (eventosJaProntos()) {
            registrarNoConsole('Clique registrado', nome);
            window.goatcounter.count(dados);
        } else {
            // Guarda para enviar quando o contador carregar (o clique
            // abre o WhatsApp em outra aba, então não dá para esperar)
            registrarNoConsole('Clique na fila (contador ainda carregando)', nome);
            pendentes.push(dados);
            setTimeout(enviarPendentes, 1500);
        }
    }, true);
})();
