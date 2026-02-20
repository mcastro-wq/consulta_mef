let todosLosProyectos = [];
let filtroRango = 'todos';
let chartSectores = null;
let chartTorta = null;

document.addEventListener('DOMContentLoaded', () => {
    consultarMEF();
    document.getElementById('buscador').addEventListener('input', filtrarTodo);
    document.getElementById('select-anio').addEventListener('change', filtrarTodo);
});

async function consultarMEF() {
    const estadoMsg = document.getElementById('estado');
    try {
        estadoMsg.innerText = "⏳ Cargando datos...";
        const response = await fetch('data_mef.json');
        todosLosProyectos = await response.json();

        // --- CÓDIGO NUEVO PARA LA HORA ---
        const ahora = new Date();
        const opciones = { hour: '2-digit', minute: '2-digit' };
        const horaCarga = ahora.toLocaleTimeString('es-PE', opciones);
        
        const anios = [...new Set(todosLosProyectos.map(p => p.anio))].sort((a,b) => b-a);
        const selectAnio = document.getElementById('select-anio');
        if (anios.length > 0) {
            selectAnio.innerHTML = anios.map(a => `<option value="${a}">${a}</option>`).join('');
        }
        filtrarTodo();
    } catch (e) {
        estadoMsg.innerHTML = `<span class="text-danger">Error al cargar datos</span>`;
    }
}

function filtrarTodo() {
    const busqueda = document.getElementById('buscador').value.toLowerCase();
    const anioSel = document.getElementById('select-anio').value;

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

function actualizarKPIs(lista) {
    const tPim = lista.reduce((a, p) => a + (Number(p.pim) || 0), 0);
    const tDev = lista.reduce((a, p) => a + (Number(p.devengado) || 0), 0);
    document.getElementById('total-pim').innerText = "S/ " + tPim.toLocaleString('es-PE');
    document.getElementById('total-ejecutado').innerText = "S/ " + tDev.toLocaleString('es-PE');
    const avanceGlobal = tPim > 0 ? ((tDev / tPim) * 100).toFixed(1) : 0;
    document.getElementById('avance-global').innerText = avanceGlobal + "%";
}

function actualizarGraficos(lista) {
    const sectoresMap = {};
    lista.forEach(p => { 
        // Si el sector es nulo, indefinido o cadena vacía, forzamos "OTROS"
        let s = (p.sector && String(p.sector).trim() !== "") ? p.sector.trim().toUpperCase() : "OTROS";
        sectoresMap[s] = (sectoresMap[s] || 0) + (Number(p.pim) || 0); 
    });
    
    const sorted = Object.entries(sectoresMap).sort((a, b) => b[1] - a[1]).slice(0, 8);

    if (chartSectores) chartSectores.destroy();
    chartSectores = new Chart(document.getElementById('chartSectores'), {
        type: 'bar',
        data: {
            labels: sorted.map(s => s[0]),
            datasets: [{ label: 'PIM', data: sorted.map(s => s[1]), backgroundColor: '#0d47a1', borderRadius: 5 }]
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

function renderizarCards(lista) {
    const contenedor = document.getElementById('contenedor-proyectos');
    if (!contenedor) return;
    
    document.getElementById('estado').innerHTML = `📍 Lambayeque: <b>${lista.length}</b> proyectos encontrados.`;

    let html = '';
    lista.forEach(p => {
        const avanceNum = Number(p.avance) || 0;
        const color = avanceNum > 70 ? "#198754" : (avanceNum > 30 ? "#ffc107" : "#dc3545");
        
        let valSector = p.sector || p.SECTOR || p.Sector || "";
        let sectorLimpio = String(valSector).replace(/[´`']/g, '').trim();
        const sectorTexto = (sectorLimpio !== "") ? sectorLimpio.toUpperCase() : "OTROS";

        // Formateamos los montos para que tengan comas y decimales
        const pimStr = (Number(p.pim) || 0).toLocaleString('es-PE');
        const devStr = (Number(p.devengado) || 0).toLocaleString('es-PE');

        html += `
        <div class="col">
            <div class="proyecto-card">
                <div>
                    <span class="regiao">${sectorTexto}</span>
                    <h3>${p.NOMBRE || 'SIN NOMBRE'}</h3>
                </div>
                <div class="metricas-box">
                    <div class="d-flex justify-content-between mb-1">
                        <span class="text-muted small">PIM:</span>
                        <span class="fw-bold">S/ ${pimStr}</span>
                    </div>
                    
                    <div class="d-flex justify-content-between mb-1">
                        <span class="text-muted small">DEVENGADO:</span>
                        <span class="text-primary fw-bold">S/ ${devStr}</span>
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



