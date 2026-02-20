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
    try {
        const response = await fetch('data_mef.json?v=' + Math.random());
        const dataTotal = await response.json();
        
        console.log("Datos recibidos:", dataTotal);

        // 1. Actualizar la fecha en el banner
        if (dataTotal.ultima_actualizacion) {
            const elFecha = document.getElementById('fecha-actualizacion');
            if (elFecha) elFecha.innerText = dataTotal.ultima_actualizacion;
        }

        // 2. Extraer la lista correctamente (Soporta formato viejo y nuevo)
        todosLosProyectos = dataTotal.proyectos || dataTotal; 

        if (!Array.isArray(todosLosProyectos)) {
            console.error("Formato de proyectos no reconocido");
            return;
        }

        // 3. Cargar años
        const anios = [...new Set(todosLosProyectos.map(p => p.anio))].sort((a,b) => b-a);
        const selectAnio = document.getElementById('select-anio');
        if (selectAnio && anios.length > 0) {
            selectAnio.innerHTML = anios.map(a => `<option value="${a}">${a}</option>`).join('');
        }
        
        // 4. Renderizar todo
        filtrarTodo(); 

    } catch (e) {
        console.error("Error crítico en carga:", e);
        const cont = document.getElementById('contenedor-proyectos');
        if (cont) cont.innerHTML = `<div class="col-12 text-center">Error al cargar datos.</div>`;
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
    
    const elPim = document.getElementById('total-pim');
    const elEjec = document.getElementById('total-ejecutado');
    const elAvance = document.getElementById('avance-global');

    if (elPim) elPim.innerText = "S/ " + tPim.toLocaleString('es-PE');
    if (elEjec) elEjec.innerText = "S/ " + tDev.toLocaleString('es-PE');
    
    const avanceGlobal = tPim > 0 ? ((tDev / tPim) * 100).toFixed(1) : 0;
    if (elAvance) elAvance.innerText = avanceGlobal + "%";
}

function actualizarGraficos(lista) {
    const sectoresMap = {};
    lista.forEach(p => { 
        let s = (p.sector && String(p.sector).trim() !== "") ? p.sector.trim().toUpperCase() : "OTROS";
        sectoresMap[s] = (sectoresMap[s] || 0) + (Number(p.pim) || 0); 
    });
    
    const sorted = Object.entries(sectoresMap).sort((a, b) => b[1] - a[1]).slice(0, 8);

    if (chartSectores) chartSectores.destroy();
    const ctxSectores = document.getElementById('chartSectores');
    if (ctxSectores) {
        chartSectores = new Chart(ctxSectores, {
            type: 'bar',
            data: {
                labels: sorted.map(s => s[0]),
                // Usamos el color granate solicitado: #801616
                datasets: [{ label: 'PIM', data: sorted.map(s => s[1]), backgroundColor: '#801616', borderRadius: 5 }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { x: { ticks: { autoSkip: false, maxRotation: 45, minRotation: 45, font: { size: 9 } } } }
            }
        });
    }

    const counts = [
        lista.filter(p => p.avance <= 30).length, 
        lista.filter(p => p.avance > 30 && p.avance <= 70).length, 
        lista.filter(p => p.avance > 70).length
    ];
    
    if (chartTorta) chartTorta.destroy();
    const ctxTorta = document.getElementById('chartTorta');
    if (ctxTorta) {
        chartTorta = new Chart(ctxTorta, {
            type: 'doughnut',
            data: { labels: ['Crítico', 'Medio', 'Óptimo'], datasets: [{ data: counts, backgroundColor: ['#dc3545', '#ffc107', '#198754'] }] },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
}

function renderizarCards(lista) {
    const contenedor = document.getElementById('contenedor-proyectos');
    if (!contenedor) return;
    
    const elEstado = document.getElementById('estado');
    if (elEstado) elEstado.innerHTML = `📍 Lambayeque: <b>${lista.length}</b> proyectos encontrados.`;

    let html = '';
    lista.forEach(p => {
        const avanceNum = Number(p.avance) || 0;
        const color = avanceNum > 70 ? "#198754" : (avanceNum > 30 ? "#ffc107" : "#dc3545");
        
        let valSector = p.sector || p.SECTOR || p.Sector || "";
        let sectorLimpio = String(valSector).replace(/[´`']/g, '').trim();
        const sectorTexto = (sectorLimpio !== "") ? sectorLimpio.toUpperCase() : "OTROS";

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
