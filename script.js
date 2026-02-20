// 1. VARIABLES GLOBALES (Sin duplicados)
let todosLosProyectos = [];
let filtroRango = 'todos';
let chartSectores = null;
let chartTorta = null;

document.addEventListener('DOMContentLoaded', () => {
    consultarMEF();
    document.getElementById('buscador').addEventListener('input', filtrarTodo);
    document.getElementById('select-anio').addEventListener('change', filtrarTodo);
});

// 2. CARGA DE DATOS
async function consultarMEF() {
    try {
        const response = await fetch('data_mef.json?v=' + Math.random());
        const dataTotal = await response.json();
        
        // Mostrar fecha en el banner
        if (dataTotal.ultima_actualizacion) {
            const elFecha = document.getElementById('fecha-actualizacion');
            if (elFecha) elFecha.innerText = dataTotal.ultima_actualizacion;
        }

        // Extraer proyectos (soporta el nuevo formato con fecha)
        todosLosProyectos = dataTotal.proyectos || (Array.isArray(dataTotal) ? dataTotal : []);

        // Configurar selector de años
        const anios = [...new Set(todosLosProyectos.map(p => p.anio))].sort((a,b) => b-a);
        const selectAnio = document.getElementById('select-anio');
        if (selectAnio && anios.length > 0) {
            selectAnio.innerHTML = anios.map(a => `<option value="${a}">${a}</option>`).join('');
        }
        
        // Ejecutar primer renderizado
        filtrarTodo();

    } catch (e) {
        console.error("Error cargando JSON:", e);
        const cont = document.getElementById('contenedor-proyectos');
        if (cont) cont.innerHTML = "Error al conectar con la base de datos.";
    }
}

// 3. LÓGICA DE FILTROS
function filtrarTodo() {
    const busqueda = (document.getElementById('buscador')?.value || "").toLowerCase();
    const anioSel = document.getElementById('select-anio')?.value;

    const filtrados = todosLosProyectos.filter(p => {
        const coincideAnio = String(p.anio) === anioSel;
        const coincideTexto = (p.NOMBRE || "").toLowerCase().includes(busqueda);
        let coincideRango = true;
        if (filtroRango === 'bajo') coincideRango = p.avance <= 30;
        else if (filtroRango === 'medio') coincideRango = p.avance > 30 && p.avance <= 70;
        else if (filtroRango === 'alto') coincideRango = p.avance > 70;
        return coincideAnio && coincideTexto && coincideRango;
    });

    actualizarKPIs(filtrados);
    actualizarGraficos(filtrados);
    renderizarCards(filtrados);
}

// 4. ACTUALIZAR KPIs
function actualizarKPIs(lista) {
    const tPim = lista.reduce((a, p) => a + (Number(p.pim) || 0), 0);
    const tDev = lista.reduce((a, p) => a + (Number(p.devengado) || 0), 0);
    
    document.getElementById('total-pim').innerText = "S/ " + tPim.toLocaleString('es-PE');
    document.getElementById('total-ejecutado').innerText = "S/ " + tDev.toLocaleString('es-PE');
    
    const avanceGlobal = tPim > 0 ? ((tDev / tPim) * 100).toFixed(1) : 0;
    document.getElementById('avance-global').innerText = avanceGlobal + "%";
}

// 5. ACTUALIZAR GRÁFICOS (Color Granate #801616)
function actualizarGraficos(lista) {
    const sectoresMap = {};
    lista.forEach(p => { 
        let s = (p.sector && String(p.sector).trim() !== "") ? p.sector.trim().toUpperCase() : "OTROS";
        sectoresMap[s] = (sectoresMap[s] || 0) + (Number(p.pim) || 0); 
    });
    
    const sorted = Object.entries(sectoresMap).sort((a, b) => b[1] - a[1]).slice(0, 8);

    if (chartSectores) chartSectores.destroy();
    chartSectores = new Chart(document.getElementById('chartSectores'), {
        type: 'bar',
        data: {
            labels: sorted.map(s => s[0]),
            datasets: [{ label: 'PIM', data: sorted.map(s => s[1]), backgroundColor: '#801616', borderRadius: 5 }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { x: { ticks: { autoSkip: false, maxRotation: 45, minRotation: 45, font: { size: 9 } } } }
        }
    });

    const counts = [
        lista.filter(p => p.avance <= 30).length, 
        lista.filter(p => p.avance > 30 && p.avance <= 70).length, 
        lista.filter(p => p.avance > 70).length
    ];
    if (chartTorta) chartTorta.destroy();
    chartTorta = new Chart(document.getElementById('chartTorta'), {
        type: 'doughnut',
        data: { labels: ['Crítico', 'Medio', 'Óptimo'], datasets: [{ data: counts, backgroundColor: ['#dc3545', '#ffc107', '#198754'] }] },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

// 6. RENDERIZAR TARJETAS
function renderizarCards(lista) {
    const contenedor = document.getElementById('contenedor-proyectos');
    if (!contenedor) return;
    
    document.getElementById('estado').innerHTML = `📍 Lambayeque: <b>${lista.length}</b> proyectos encontrados.`;

    let html = '';
    lista.forEach(p => {
        const avanceNum = Number(p.avance) || 0;
        const color = avanceNum > 70 ? "#198754" : (avanceNum > 30 ? "#ffc107" : "#dc3545");
        
        let valSector = p.sector || "OTROS";
        let sectorTexto = String(valSector).replace(/[´`']/g, '').trim().toUpperCase();
        if (sectorTexto === "") sectorTexto = "OTROS";

        // Limpiamos el nombre para el atributo title (evita errores con comillas)
        const nombreCompleto = (p.NOMBRE || 'SIN NOMBRE').replace(/"/g, '&quot;');

        html += `
        <div class="col">
            <div class="proyecto-card" title="${nombreCompleto}">
                <div>
                    <span class="regiao">${sectorTexto}</span>
                    <h3 style="cursor: help;">${nombreCompleto}</h3>
                </div>
                <div class="metricas-box">
                    <div class="d-flex justify-content-between mb-1">
                        <span class="text-muted small">PIM:</span>
                        <span class="fw-bold">S/ ${(Number(p.pim) || 0).toLocaleString('es-PE')}</span>
                    </div>
                    <div class="d-flex justify-content-between mb-1">
                        <span class="text-muted small">DEVENGADO:</span>
                        <span class="text-primary fw-bold">S/ ${(Number(p.devengado) || 0).toLocaleString('es-PE')}</span>
                    </div>
                    <div class="d-flex justify-content-between mt-2">
                        <span class="text-muted small">Avance:</span>
                        <span style="color:${color}; font-weight:800;">${avanceNum}%</span>
                    </div>
                    <div class="barra-fondo">
                        <div class="barra-progreso" style="width:${avanceNum}%; background:${color}"></div>
                    </div>
                </div>
            </div>
        </div>`;
    });
    contenedor.innerHTML = html;
}

function setRango(r) { filtroRango = r; filtrarTodo(); }

