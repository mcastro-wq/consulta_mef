let todosLosProyectos = [];
let filtroRango = 'todos';
let chartSectores = null;
let chartTorta = null;

async function consultarMEF() {
    const estado = document.getElementById('estado');
    const url = `data_mef.json?v=${new Date().getTime()}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        todosLosProyectos = data;

        const aniosUnicos = [...new Set(todosLosProyectos.map(p => p.anio))].filter(a => a).sort((a,b) => b-a);
        const selectAnio = document.getElementById('select-anio');
        
        if (aniosUnicos.length > 0) {
            selectAnio.innerHTML = aniosUnicos.map(a => `<option value="${a}">${a}</option>`).join('');
        } else {
            selectAnio.innerHTML = '<option value="2025">2025</option>';
        }

        filtrarTodo();
    } catch (error) {
        estado.innerHTML = `🚨 Error de carga de datos.`;
    }
}

function filtrarTodo() {
    const busqueda = document.getElementById('buscador').value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const anioSel = document.getElementById('select-anio').value;

    const filtrados = todosLosProyectos.filter(p => {
        const coincideAnio = String(p.anio) === String(anioSel);
        const nombreLimpio = p.NOMBRE.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const coincideTexto = nombreLimpio.includes(busqueda);
        
        let coincideRango = true;
        if (filtroRango === 'bajo') coincideRango = p.avance <= 30;
        else if (filtroRango === 'medio') coincideRango = p.avance > 30 && p.avance <= 70;
        else if (filtroRango === 'alto') coincideRango = p.avance > 70;

        return coincideAnio && coincideTexto && coincideRango;
    });

    actualizarKPIs(filtrados);
    actualizarGraficos(filtrados);
    renderizar(filtrados);
}

function actualizarKPIs(lista) {
    const totalPim = lista.reduce((acc, p) => acc + (p.pim || 0), 0);
    const totalDev = lista.reduce((acc, p) => acc + (p.devengado || 0), 0);
    const avanceGlobal = totalPim > 0 ? ((totalDev / totalPim) * 100).toFixed(1) : 0;

    document.getElementById('total-pim').innerText = `S/ ${totalPim.toLocaleString('es-PE')}`;
    document.getElementById('total-ejecutado').innerText = `S/ ${totalDev.toLocaleString('es-PE')}`;
    document.getElementById('avance-global').innerText = `${avanceGlobal}%`;
    document.getElementById('estado').innerHTML = `📍 Lambayeque: <b>${lista.length}</b> proyectos filtrados.`;
}

function actualizarGraficos(lista) {
    // 1. Agrupar PIM por Sector (para gráfico de barras)
    const sectoresMap = {};
    lista.forEach(p => {
        const s = p.sector || 'OTROS';
        sectoresMap[s] = (sectoresMap[s] || 0) + p.pim;
    });

    const labels = Object.keys(sectoresMap).slice(0, 8); // Top 8 sectores
    const dataPim = labels.map(l => sectoresMap[l]);

    // 2. Contar proyectos por rango (para gráfico de torta)
    const bajos = lista.filter(p => p.avance <= 30).length;
    const medios = lista.filter(p => p.avance > 30 && p.avance <= 70).length;
    const altos = lista.filter(p => p.avance > 70).length;

    // --- Gráfico de Barras ---
    if (chartSectores) chartSectores.destroy();
    const ctxBar = document.getElementById('chartSectores').getContext('2d');
    chartSectores = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Presupuesto PIM (Soles)',
                data: dataPim,
                backgroundColor: '#0d47a1'
            }]
        },
        options: { responsive: true, plugins: { legend: { display: false } } }
    });

    // --- Gráfico de Torta ---
    if (chartTorta) chartTorta.destroy();
    const ctxPie = document.getElementById('chartTorta').getContext('2d');
    chartTorta = new Chart(ctxPie, {
        type: 'doughnut',
        data: {
            labels: ['Bajo (0-30%)', 'Medio (30-70%)', 'Alto (>70%)'],
            datasets: [{
                data: [bajos, medios, altos],
                backgroundColor: ['#dc3545', '#ffc107', '#198754']
            }]
        },
        options: { responsive: true, cutout: '60%' }
    });
}

function renderizar(lista) {
    const contenedor = document.getElementById('contenedor-proyectos');
    if (lista.length === 0) {
        contenedor.innerHTML = '<div class="col-12 text-center py-5 text-muted">Sin resultados.</div>';
        return;
    }

    contenedor.innerHTML = lista.map(p => {
        let claseBorde = p.avance > 70 ? "avance-alto" : (p.avance > 30 ? "avance-medio" : "avance-bajo");
        return `
        <div class="col">
            <div class="card h-100 card-proyecto ${claseBorde} shadow-sm">
                <div class="card-body p-3">
                    <div class="d-flex justify-content-between mb-2">
                        <span class="badge ${p.avance > 50 ? 'bg-success' : 'bg-danger'}">${p.avance}%</span>
                        <small class="fw-bold text-muted">${p.anio}</small>
                    </div>
                    <h6 class="card-title text-uppercase fw-bold mb-3" style="font-size: 0.7rem; height: 3.2em; overflow: hidden;">${p.NOMBRE}</h6>
                    <div class="small">PIM: <b>S/ ${p.pim.toLocaleString('es-PE')}</b></div>
                    <div class="progress mt-2" style="height: 5px;"><div class="progress-bar ${p.avance > 50 ? 'bg-success' : 'bg-warning'}" style="width: ${p.avance}%"></div></div>
                </div>
            </div>
        </div>`;
    }).join('');
}

function setRango(rango) { filtroRango = rango; filtrarTodo(); }

document.addEventListener('DOMContentLoaded', () => {
    consultarMEF();
    document.getElementById('buscador').addEventListener('input', filtrarTodo);
    document.getElementById('select-anio').addEventListener('change', filtrarTodo);
});
