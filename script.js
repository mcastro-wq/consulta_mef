let todosLosProyectos = [];
let filtroRango = 'todos';
let chartSectores = null, chartTorta = null;

async function consultarMEF() {
    try {
        const response = await fetch('data_mef.json');
        todosLosProyectos = await response.json();
        const anios = [...new Set(todosLosProyectos.map(p => p.anio))].sort((a,b) => b-a);
        const selectAnio = document.getElementById('select-anio');
        if (anios.length > 0) {
            selectAnio.innerHTML = anios.map(a => `<option value="${a}">${a}</option>`).join('');
        }
        filtrarTodo();
    } catch (e) {
        console.error("Error cargando datos", e);
        document.getElementById('estado').innerText = "Error al cargar data_mef.json";
    }
}

function filtrarTodo() {
    const busqueda = document.getElementById('buscador').value.toLowerCase();
    const anioSel = document.getElementById('select-anio').value;

    const filtrados = todosLosProyectos.filter(p => {
        const coincideAnio = String(p.anio) === anioSel;
        const coincideTexto = p.NOMBRE.toLowerCase().includes(busqueda);
        let coincideRango = true;
        if (filtroRango === 'bajo') coincideRango = p.avance <= 30;
        else if (filtroRango === 'medio') coincideRango = p.avance > 30 && p.avance <= 70;
        else if (filtroRango === 'alto') coincideRango = p.avance > 70;
        return coincideAnio && coincideTexto && coincideRango;
    });

    actualizarKPIs(filtrados);
    actualizarGraficos(filtrados);
    renderizar(filtrados); // Llamada vital
}

function actualizarKPIs(lista) {
    const tPim = lista.reduce((a, p) => a + (p.pim || 0), 0);
    const tDev = lista.reduce((a, p) => a + (p.devengado || 0), 0);
    document.getElementById('total-pim').innerText = `S/ ${tPim.toLocaleString('es-PE')}`;
    document.getElementById('total-ejecutado').innerText = `S/ ${tDev.toLocaleString('es-PE')}`;
    const avance = tPim > 0 ? ((tDev / tPim) * 100).toFixed(1) : 0;
    document.getElementById('avance-global').innerText = `${avance}%`;
}

function actualizarGraficos(lista) {
    const sectoresMap = {};
    lista.forEach(p => { 
        let s = (p.sector && p.sector !== "undefined" && p.sector.trim() !== "") ? p.sector.trim().toUpperCase() : "OTROS";
        sectoresMap[s] = (sectoresMap[s] || 0) + (p.pim || 0); 
    });
    
    const sorted = Object.entries(sectoresMap).sort((a, b) => b[1] - a[1]).slice(0, 8);

    if (chartSectores) chartSectores.destroy();
    chartSectores = new Chart(document.getElementById('chartSectores'), {
        type: 'bar',
        data: {
            labels: sorted.map(s => s[0]),
            datasets: [{ label: 'PIM', data: sorted.map(s => s[1]), backgroundColor: '#0d47a1', borderRadius: 5 }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    const counts = [
        lista.filter(p => p.avance <= 30).length, 
        lista.filter(p => p.avance > 30 && p.avance <= 70).length, 
        lista.filter(p => p.avance > 70).length
    ];
    if (chartTorta) chartTorta.destroy();
    chartTorta = new Chart(document.getElementById('chartTorta'), {
        type: 'doughnut',
        data: { labels: ['Bajo', 'Medio', 'Alto'], datasets: [{ data: counts, backgroundColor: ['#dc3545', '#ffc107', '#198754'] }] },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function renderizar(lista) {
    const contenedor = document.getElementById('contenedor-proyectos');
    if (!contenedor) return;
    
    document.getElementById('estado').innerHTML = `📍 Lambayeque: <b>${lista.length}</b> proyectos encontrados.`;
    
    // Limpiar y reconstruir
    let html = '';
    lista.forEach(p => {
        const color = p.avance > 70 ? "#198754" : (p.avance > 30 ? "#ffc107" : "#dc3545");
        html += `
        <div class="col">
            <div class="proyecto-card">
                <div>
                    <span class="regiao">${p.sector || 'OTROS'}</span>
                    <h3>${p.NOMBRE}</h3>
                </div>
                <div class="metricas-box">
                    <div class="d-flex justify-content-between mb-1">
                        <span class="text-muted small">PIM:</span>
                        <span class="fw-bold">S/ ${(p.pim || 0).toLocaleString('es-PE')}</span>
                    </div>
                    <div class="d-flex justify-content-between mb-1">
                        <span class="text-muted small">DEVENGADO:</span>
                        <span class="text-primary fw-bold">S/ ${(p.devengado || 0).toLocaleString('es-PE')}</span>
                    </div>
                    <div class="d-flex justify-content-between mt-2">
                        <span class="text-muted small">Avance:</span>
                        <span style="color:${color}; font-weight:800;">${p.avance}%</span>
                    </div>
                    <div class="barra-fondo">
                        <div class="barra-progreso" style="width:${p.avance}%; background:${color}"></div>
                    </div>
                </div>
            </div>
        </div>`;
    });
    contenedor.innerHTML = html;
}

function setRango(r) { filtroRango = r; filtrarTodo(); }
document.addEventListener('DOMContentLoaded', consultarMEF);
document.getElementById('buscador').addEventListener('input', filtrarTodo);
document.getElementById('select-anio').addEventListener('change', filtrarTodo);
