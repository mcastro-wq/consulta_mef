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
    document.getElementById('estado').innerHTML = `📍 Lambayeque: <b>${lista.length}</b> proyectos en este filtro.`;
}

function actualizarGraficos(lista) {
    if (lista.length === 0) return;

    // 1. Agrupar PIM por Sector
    const sectores = {};
    lista.forEach(p => {
        const s = p.sector || 'OTROS';

        // Si el sector viene vacío, nulo o es solo un espacio, le ponemos "NO ASIGNADO"
    const s = (p.sector && p.sector.trim() !== "") ? p.sector.trim() : 'OTROS / NO ASIGNADO';
        // Solo sumamos si el PIM es mayor a 0, si no, le damos un valor mínimo 
        // para que la barra exista en el gráfico (opcional)
        sectores[s] = (sectores[s] || 0) + (p.pim || 0);
    });

    const sortSectores = Object.entries(sectores).sort((a,b) => b[1] - a[1]).slice(0, 8);
    const labelsSector = sortSectores.map(s => s[0]);
    const dataSector = sortSectores.map(s => s[1]);

    // Verificación en consola (Presiona F12 en tu navegador para ver esto)
    console.log("Datos para gráfico de barras:", dataSector);

    // 2. Datos por Avance (Torta)
    const bajos = lista.filter(p => p.avance <= 30).length;
    const medios = lista.filter(p => p.avance > 30 && p.avance <= 70).length;
    const altos = lista.filter(p => p.avance > 70).length;

    // --- GRÁFICO DE BARRAS ---
    const ctxBar = document.getElementById('chartSectores');
    if (ctxBar) {
        if (chartSectores) chartSectores.destroy();
        chartSectores = new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels: labelsSector,
                datasets: [{
                    label: 'Presupuesto PIM (Soles)',
                    data: dataSector,
                    backgroundColor: '#0d47a1',
                    borderRadius: 5
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { legend: { display: false } } 
            }
        });
    }

    // --- GRÁFICO DE TORTA ---
    const ctxPie = document.getElementById('chartTorta');
    if (ctxPie) {
        if (chartTorta) chartTorta.destroy();
        chartTorta = new Chart(ctxPie, {
            type: 'doughnut',
            data: {
                labels: ['Crítico (0-30%)', 'Medio (30-70%)', 'Óptimo (>70%)'],
                datasets: [{
                    data: [bajos, medios, altos],
                    backgroundColor: ['#dc3545', '#ffc107', '#198754']
                }]
            },
            options: { 
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%' 
            }
        });
    }
}

function renderizar(lista) {
    const contenedor = document.getElementById('contenedor-proyectos');
    contenedor.innerHTML = lista.map(p => {
        let clase = p.avance > 70 ? "avance-alto" : (p.avance > 30 ? "avance-medio" : "avance-bajo");
        return `
        <div class="col">
            <div class="card h-100 card-proyecto ${clase}">
                <div class="card-body p-3">
                    <div class="d-flex justify-content-between mb-2">
                        <span class="badge ${p.avance > 50 ? 'bg-success' : 'bg-danger'}">${p.avance}%</span>
                        <small class="text-muted fw-bold">AÑO ${p.anio}</small>
                    </div>
                    <h6 class="card-title text-uppercase fw-bold mb-3" style="font-size: 0.7rem; height: 3.2em; overflow: hidden;">${p.NOMBRE}</h6>
                    <div class="small">PIM: <b>S/ ${p.pim.toLocaleString('es-PE')}</b></div>
                    <div class="progress mt-2" style="height: 5px;"><div class="progress-bar" style="width: ${p.avance}%"></div></div>
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


