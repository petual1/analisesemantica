document.addEventListener('DOMContentLoaded', () => {

    // Seção: Gráfico de Componentes
    const grammarData = {
        datasets: [{
            label: 'Componentes da Análise Semântica',
            data: [40, 35, 25],
            backgroundColor: [
                'rgba(22, 163, 74, 0.7)',  
                'rgba(71, 85, 105, 0.7)',   
                'rgba(245, 158, 11, 0.7)'   
            ],
            borderColor: [
                '#16a34a',
                '#475569',
                '#f59e0b'
            ],
            borderWidth: 1
        }],
        labels: ['Gramáticas de Atributos', 'Gerenciamento da Tabela de Símbolos', 'Checagem de Tipos e Escopo']
    };

    const ctx = document.getElementById('semanticAnalysisChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: grammarData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#334155' 
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed !== null) {
                                label += context.parsed + '%';
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });

    //Abas de Gramáticas
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const target = tab.getAttribute('data-tab');
            tabContents.forEach(content => {
                if (content.id === target) {
                    content.classList.remove('hidden');
                } else {
                    content.classList.add('hidden');
                }
            });
        });
    });

    //Simulador de Tabela de Símbolos
    const symbolTableCodeLines = [
        { code: 'int x;', action: 'INSERT', symbol: { name: 'x', type: 'int', scope: 'global' } },
        { code: 'float y;', action: 'INSERT', symbol: { name: 'y', type: 'float', scope: 'global' } },
        { code: 'y = x + 1.0;', action: 'LOOKUP', symbol: 'x' },
        { code: 'y = x + 1.0;', action: 'LOOKUP', symbol: 'y' }
    ];
    let currentSymbolStep = 0;
    const symbolTableCodeEl = document.getElementById('symbolTableCode');
    const symbolTableVisualEl = document.getElementById('symbolTableVisual');
    const symbolTableStepBtn = document.getElementById('symbolTableStepBtn');
    let table = {};

    function updateSymbolTableVisual() {
        if (currentSymbolStep === 0) {
            symbolTableVisualEl.innerHTML = '<p class="text-slate-400">Tabela vazia.</p>';
            table = {};
        }
        const stepData = symbolTableCodeLines[currentSymbolStep];
        if (stepData.action === 'INSERT') {
            table[stepData.symbol.name] = stepData.symbol;
        }
        
        let html = '<ul class="space-y-2">';
        for (const key in table) {
            html += `<li class="font-mono text-sm p-2 bg-slate-50 rounded"><strong>${key}</strong>: { tipo: ${table[key].type}, escopo: ${table[key].scope} }</li>`;
        }
        html += '</ul>';

        if (stepData.action === 'LOOKUP') {
             html += `<p class="mt-4 p-2 bg-blue-100 text-blue-800 rounded"><strong>Ação:</strong> Busca por '${stepData.symbol}'... Encontrado!</p>`;
        } else if(stepData.action === 'INSERT'){
             html += `<p class="mt-4 p-2 bg-green-100 text-green-800 rounded"><strong>Ação:</strong> Insere '${stepData.symbol.name}' na tabela.</p>`;
        }


        symbolTableVisualEl.innerHTML = html;
        
        let codeHtml = '';
        symbolTableCodeLines.forEach((line, index) => {
            if (index === currentSymbolStep) {
                codeHtml += `<span class="highlight block">${line.code}</span>`;
            } else {
                codeHtml += `<span class="block">${line.code}</span>`;
            }
        });
        symbolTableCodeEl.innerHTML = codeHtml;

        currentSymbolStep = (currentSymbolStep + 1) % symbolTableCodeLines.length;
        if(currentSymbolStep === 0) symbolTableStepBtn.textContent = "Recomeçar";
        else symbolTableStepBtn.textContent = "Próximo Passo";
    }
    symbolTableStepBtn.addEventListener('click', updateSymbolTableVisual);
    updateSymbolTableVisual();

    //Simulador de Escopo
    const scopeCodeLines = [
        { line: 0, text: 'void test() {' },
        { line: 1, text: '  double a = 12.0;' },
        { line: 2, text: '  do {' },
        { line: 3, text: '    int a;' },
        { line: 4, text: '    a = 5;' },
        { line: 5, text: '  } while (a < 10);' },
        { line: 6, text: '  printf("%f", a);' },
        { line: 7, text: '}' },
    ];
    
    const scopeStates = [
        { line: 0, state: 'Entrando no escopo da função `test`.' },
        { line: 1, state: '`double a` (externa) declarada. Valor: 12.0. Visível.' },
        { line: 2, state: 'Entrando no escopo do bloco `do-while`.' },
        { line: 3, state: '`int a` (interna) declarada. Ela sombreia a externa. Valor: indefinido. Visível.' },
        { line: 4, state: 'Atribuição a `a`. Refere-se à `int a` interna. Valor: 5.'},
        { line: 5, state: 'Condição de loop usa `int a` (interna). Saindo do escopo do bloco.' },
        { line: 6, state: '`int a` interna foi destruída. `double a` externa está visível novamente. Valor: 12.0.' },
        { line: 7, state: 'Saindo do escopo da função `test`.' },
    ];

    let currentScopeStep = 0;
    const scopeCodeEl = document.getElementById('scopeCode');
    const scopeVisualEl = document.getElementById('scopeVisual');
    const scopeStepBtn = document.getElementById('scopeStepBtn');

    function updateScopeVisual() {
        const state = scopeStates[currentScopeStep];
        
        scopeVisualEl.innerHTML = `
            <div class="p-3 bg-white rounded-md shadow-sm">
                <p class="font-semibold text-slate-700">Variável Externa (\`double a\`)</p>
                <p class="text-sm">Estado: ${currentScopeStep > 0 && currentScopeStep < 7 ? 'Viva' : 'Inexistente'}</p>
                <p class="text-sm">Visível: ${currentScopeStep > 2 && currentScopeStep < 6 ? '<span class="font-bold text-red-600">Não</span>' : '<span class="font-bold text-green-600">Sim</span>'}</p>
            </div>
            <div class="p-3 bg-white rounded-md shadow-sm">
                <p class="font-semibold text-slate-700">Variável Interna (\`int a\`)</p>
                <p class="text-sm">Estado: ${currentScopeStep > 2 && currentScopeStep < 6 ? 'Viva' : 'Inexistente'}</p>
            </div>
             <div class="p-3 mt-4 bg-slate-100 rounded-md">
                <p class="font-semibold text-slate-800">Análise:</p>
                <p class="text-sm text-slate-700">${state.state}</p>
            </div>
        `;

        let codeHtml = '';
        scopeCodeLines.forEach((line, index) => {
            if (index === state.line) {
                codeHtml += `<div class="highlight">${line.text}</div>`;
            } else {
                codeHtml += `<div>${line.text}</div>`;
            }
        });
        scopeCodeEl.innerHTML = codeHtml;

        currentScopeStep = (currentScopeStep + 1) % scopeStates.length;
         if(currentScopeStep === 0) scopeStepBtn.textContent = "Recomeçar Análise";
        else scopeStepBtn.textContent = "Próximo Passo";
    }
    scopeStepBtn.addEventListener('click', updateScopeVisual);
    updateScopeVisual();

    //Calculadora de Tipos
    const type1El = document.getElementById('type1');
    const type2El = document.getElementById('type2');
    const operatorEl = document.getElementById('operator');
    const typeResultEl = document.getElementById('typeResult');

    const typeRules = {
        '+': {
            'int,int': { result: 'int', class: 'bg-green-100 text-green-800' },
            'int,float': { result: 'float (coerção)', class: 'bg-green-100 text-green-800' },
            'float,int': { result: 'float (coerção)', class: 'bg-green-100 text-green-800' },
            'float,float': { result: 'float', class: 'bg-green-100 text-green-800' },
            'string,string': { result: 'string (concatenação)', class: 'bg-green-100 text-green-800' }
        },
        '==': {
            'int,int': { result: 'boolean', class: 'bg-green-100 text-green-800' },
            'float,float': { result: 'boolean', class: 'bg-green-100 text-green-800' },
            'boolean,boolean': { result: 'boolean', class: 'bg-green-100 text-green-800' },
            'string,string': { result: 'boolean', class: 'bg-green-100 text-green-800' }
        }
    };
    
    function updateTypeCheck() {
        const t1 = type1El.value;
        const t2 = type2El.value;
        const op = operatorEl.value;
        const rule = typeRules[op]?.[`${t1},${t2}`] || { result: 'Erro de Tipo', class: 'bg-red-100 text-red-800' };

        typeResultEl.textContent = `Resultado: ${rule.result}`;
        typeResultEl.className = `mt-6 text-center text-lg font-mono p-4 rounded-md transition-colors ${rule.class}`;
    }

    type1El.addEventListener('change', updateTypeCheck);
    type2El.addEventListener('change', updateTypeCheck);
    operatorEl.addEventListener('change', updateTypeCheck);
    updateTypeCheck();
    
    //Navegação por Scroll
    const header = document.getElementById('main-header');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('main section');

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.4
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if(entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navLinks.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
                });
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        observer.observe(section);
    });
});
