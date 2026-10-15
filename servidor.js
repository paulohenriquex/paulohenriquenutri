#!/usr/bin/env node
/* ============================================================
   SERVIDOR LOCAL DO PAINEL
   ------------------------------------------------------------
   Serve o site e, além disso, busca os dados no GoatCounter
   pelo computador (não pelo navegador). Assim o painel funciona
   mesmo com bloqueador de anúncios ativo.

   Como usar:

       node servidor.js

   Depois abra:  http://127.0.0.1:8811/painel.html

   A chave da API nunca vai para o navegador nem para o site:
   ela fica guardada só neste computador, no arquivo
   NUNCA-PUBLICAR-chave.json (que está no .gitignore).

   Sem dependências: usa apenas o Node.js.
   ============================================================ */
'use strict';

const http = require('http');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const os = require('os');

const RAIZ = __dirname;
const PORTA = Number(process.env.PORTA || 8811);
const ARQUIVO_CHAVE = path.join(RAIZ, 'NUNCA-PUBLICAR-chave.json');

// Código da conta GoatCounter (em js/analytics.js está o mesmo)
const CODIGO_PADRAO = 'paulohenriquenutri';

const TIPOS = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.ico': 'image/x-icon',
    '.md': 'text/markdown; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8',
};

// ------------------------------------------------------------
// Chave da API
// ------------------------------------------------------------
function lerChave() {
    if (process.env.GOATCOUNTER_TOKEN) {
        return Promise.resolve({
            codigo: process.env.GOATCOUNTER_CODE || CODIGO_PADRAO,
            token: process.env.GOATCOUNTER_TOKEN,
            origem: 'variáveis de ambiente',
        });
    }

    return fsp.readFile(ARQUIVO_CHAVE, 'utf8').then(function (texto) {
        const dados = JSON.parse(texto);
        if (!dados.token) throw new Error('sem token');
        dados.codigo = dados.codigo || CODIGO_PADRAO;
        dados.origem = 'NUNCA-PUBLICAR-chave.json';
        return dados;
    });
}

function gravarChave(codigo, token) {
    const conteudo = JSON.stringify({ codigo: codigo, token: token }, null, 2) + '\n';
    return fsp.writeFile(ARQUIVO_CHAVE, conteudo, { mode: 0o600 });
}

// ------------------------------------------------------------
// Chamada à API do GoatCounter (feita pelo Node, não pelo navegador)
// ------------------------------------------------------------
function buscarNoGoatcounter(codigo, token, caminho, parametros) {
    const url = new URL('https://' + codigo + '.goatcounter.com/api/v0' + caminho);
    Object.keys(parametros || {}).forEach(function (chave) {
        url.searchParams.set(chave, parametros[chave]);
    });

    return fetch(url.toString(), {
        headers: {
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + token,
        },
    }).then(function (resposta) {
        return resposta.text().then(function (texto) {
            let dados = {};
            try { dados = JSON.parse(texto); } catch (e) { dados = {}; }
            return { status: resposta.status, ok: resposta.ok, dados: dados };
        });
    });
}

// ------------------------------------------------------------
// Traduz os dados do GoatCounter para o formato do painel:
//   window.GC_PRONTO = { dias: { 'AAAA-MM-DD': {visitas, cliques} } }
// ------------------------------------------------------------
function montarDias(hitsVisitas, hitsCliques) {
    const dias = {};

    function garantir(dia) {
        if (!dias[dia]) dias[dia] = { visitas: 0, cliques: 0 };
        return dias[dia];
    }

    function somar(hits, campo) {
        (hits || []).forEach(function (hit) {
            (hit.stats || []).forEach(function (dia) {
                if (!dia.day) return;
                garantir(dia.day)[campo] += (dia.daily || 0);
            });
        });
    }

    somar(hitsVisitas, 'visitas');
    somar(hitsCliques, 'cliques');
    return dias;
}

function coletarDados(codigo, token) {
    // Busca ampla: o agrupamento por dia traz os valores diários e mensais
    const parametros = { limit: '100', group: 'day', start: '2019-01-01T00:00:00Z' };
    const parametrosEvento = Object.assign({}, parametros, {
        path_by_name: 'true',
        include_paths: 'whatsapp-',
    });

    return Promise.all([
        buscarNoGoatcounter(codigo, token, '/stats/hits', parametros),
        buscarNoGoatcounter(codigo, token, '/stats/hits', parametrosEvento),
    ]).then(function (respostas) {
        const visitas = respostas[0];
        const cliques = respostas[1];

        if (!visitas.ok) {
            const erro = new Error((visitas.dados && visitas.dados.error) || ('Erro ' + visitas.status));
            erro.status = visitas.status;
            throw erro;
        }

        // Se a busca de eventos falhar (ex.: token sem permissão), o painel
        // continua funcionando com as visitas.
        if (!cliques.ok) {
            console.warn('  ! Não consegui buscar os cliques no WhatsApp:', cliques.dados.error || cliques.status);
        }

        return {
            ok: true,
            geradoEm: new Date().toISOString(),
            dias: montarDias(
                (visitas.dados && visitas.dados.hits) || [],
                (cliques.ok && cliques.dados && cliques.dados.hits) || []
            ),
        };
    });
}

// ------------------------------------------------------------
// Servidor
// ------------------------------------------------------------
function responderJson(res, status, objeto, semCache) {
    const corpo = JSON.stringify(objeto);
    const cabecalhos = {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(corpo),
    };
    // Sem cache apenas quando a chamada falhou (para não repetir erro eternamente)
    if (semCache) cabecalhos['Cache-Control'] = 'no-store';
    res.writeHead(status, cabecalhos);
    res.end(corpo);
}

function servirArquivo(res, caminhoArquivo) {
    fsp.readFile(caminhoArquivo).then(function (conteudo) {
        res.writeHead(200, {
            'Content-Type': TIPOS[path.extname(caminhoArquivo).toLowerCase()] || 'application/octet-stream',
            'Content-Length': conteudo.length,
            'Cache-Control': 'no-cache',
        });
        res.end(conteudo);
    }).catch(function () {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Não encontrado: ' + caminhoArquivo);
    });
}

function enderecosDaRede() {
    const lista = [];
    Object.keys(os.networkInterfaces()).forEach(function (nome) {
        (os.networkInterfaces()[nome] || []).forEach(function (info) {
            if (info.family === 'IPv4' && !info.internal) lista.push(info.address);
        });
    });
    return lista;
}

const servidor = http.createServer(function (req, res) {
    const url = new URL(req.url, 'http://localhost');

    // ---------- API do painel ----------
    if (url.pathname === '/api/panel/hits') {
        lerChave().then(function (cred) {
            return coletarDados(cred.codigo, cred.token);
        }).then(function (dados) {
            responderJson(res, 200, dados);
        }).catch(function (erro) {
            const status = erro.status === 401 ? 401 : (erro.status || 500);
            let mensagem = erro.message;
            if (erro.status === 401) {
                mensagem = 'Chave da API incorreta ou expirada. Salve de novo em /api/panel/token.';
            } else if (/sem token|ENOENT/.test(String(erro.message))) {
                mensagem = 'Nenhuma chave salva ainda. Envie a chave para /api/panel/token ou preencha em painel.html.';
            }
            console.error('  ! Erro ao buscar dados:', mensagem);
            responderJson(res, status, { ok: false, error: mensagem }, true);
        });
        return;
    }

    // ---------- Salvar a chave (usada pelo painel, só em localhost) ----------
    if (url.pathname === '/api/panel/token' && req.method === 'POST') {
        let corpo = '';
        req.on('data', function (pedaco) {
            corpo += pedaco;
            if (corpo.length > 4096) req.destroy();
        });
        req.on('end', function () {
            let dados;
            try {
                dados = JSON.parse(corpo);
            } catch (e) {
                return responderJson(res, 400, { ok: false, error: 'JSON inválido.' }, true);
            }

            const codigo = String(dados.codigo || CODIGO_PADRAO).trim().toLowerCase()
                .replace(/^https?:\/\//, '').replace(/\.goatcounter\.com.*$/, '');
            const token = String(dados.token || '').trim();
            if (!token) return responderJson(res, 400, { ok: false, error: 'Chave vazia.' }, true);

            gravarChave(codigo, token).then(function () {
                console.log('  ✓ Chave salva em NUNCA-PUBLICAR-chave.json');
                responderJson(res, 200, { ok: true }, true);
            }).catch(function (erro) {
                responderJson(res, 500, { ok: false, error: erro.message }, true);
            });
        });
        return;
    }

    // ---------- Arquivos do site ----------
    let caminhoRelativo = decodeURIComponent(url.pathname);
    if (caminhoRelativo === '/') caminhoRelativo = '/index.html';

    const caminhoCompleto = path.join(RAIZ, caminhoRelativo);
    const raizResolvida = path.resolve(RAIZ);

    // Impede sair da pasta do projeto (../..)
    if (!path.resolve(caminhoCompleto).startsWith(raizResolvida)) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('Acesso negado.');
    }

    servirArquivo(res, caminhoCompleto);
});

// Se a porta estiver ocupada (por exemplo, por outro servidor de preview),
// tenta a próxima e avisa — em vez de morrer sem explicação.
let portaEmUso = PORTA;

servidor.on('error', function (erro) {
    if (erro.code === 'EADDRINUSE' && portaEmUso < PORTA + 10) {
        console.log('  ! A porta ' + portaEmUso + ' já está ocupada por outro servidor.');
        portaEmUso++;
        console.log('  → Tentando a porta ' + portaEmUso + '...');
        setTimeout(function () { servidor.listen(portaEmUso, '0.0.0.0'); }, 150);
        return;
    }
    console.error('  ! Não consegui iniciar o servidor:', erro.message);
    process.exit(1);
});

servidor.listen(portaEmUso, '0.0.0.0', function () {
    console.log('');
    console.log('  Painel de acessos — servidor local no ar');
    console.log('  ==========================================');
    console.log('  ABRA ESTE ENDEREÇO:  http://127.0.0.1:' + portaEmUso + '/painel.html');
    enderecosDaRede().forEach(function (ip) {
        console.log('  No celular (mesma rede Wi-Fi): http://' + ip + ':' + portaEmUso + '/painel.html');
    });
    console.log('  ==========================================');
    console.log('');

    lerChave().then(function (cred) {
        console.log('  Chave da API encontrada (' + cred.origem + '). Buscando os dados...');
        return coletarDados(cred.codigo, cred.token).then(function (dados) {
            const total = Object.keys(dados.dias).length;
            const visitas = Object.keys(dados.dias).reduce(function (s, d) { return s + dados.dias[d].visitas; }, 0);
            const cliques = Object.keys(dados.dias).reduce(function (s, d) { return s + dados.dias[d].cliques; }, 0);
            console.log('  ✓ ' + total + ' dias com registro — ' + visitas + ' visitas e ' + cliques + ' cliques no total.');
            console.log('');
        });
    }).catch(function (erro) {
        console.log('  Ainda sem chave da API guardada (ou ela está incorreta).');
        console.log('  Abra o painel e cole a chave no formulário — ele salva aqui automaticamente:');
        console.log('  http://127.0.0.1:' + portaEmUso + '/painel.html');
        console.log('');
    });
});

process.on('SIGINT', function () {
    console.log('\n  Servidor encerrado.\n');
    process.exit(0);
});
