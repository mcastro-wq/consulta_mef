const URL_DATA = 'https://raw.githubusercontent.com/mcastro-wq/consulta_mef/main/data_mef.json';
let proyectosFull = [];
let miGrafico = null;

async function cargarDatos() {
    try {
        const response = await fetch('data_mef.json');
        proyectosFull = await response.json();
        
        actualizarTarjetas(proyectosFull);
        actualizarResumenRegional(proyectosFull);
        document.getElementById('status').innerText = "Datos sincronizados";
    } catch (e) {
        document.getElementById('status').innerText = "Error cargando datos";
    }
}

// LÓGICA DEL BUSCADOR
function buscarProyectos(query) {
    const list = document.getElementById('resultsList');
    list.innerHTML = '';
    if (query.length < 3) { list.style.display = 'none'; return; }

    const filtrados = proyectosFull.filter(p => p.NOMBRE.toLowerCase().includes(query.toLowerCase())).slice(0, 8);
    
    if (filtrados.length > 0) {
        list.style.display = 'block';
        filtrados.forEach(p => {
            const div = document.createElement('div');
            div.className = 'result-item';
            div.innerHTML = `<strong>${p.NOMBRE}</strong><br><small>${p.DEPARTAMENTO}</small>`;
            div.onclick = () => { mostrarFicha(p); list.style.display = 'none'; };
            list.appendChild(div);
        });
    }
}

function mostrarFicha(p) {
    document.getElementById('projectDetail').style.display = 'block';
    document.getElementById('detNombre').innerText = p.NOMBRE;
    document.getElementById('detPim').innerText = `S/ ${p.pim.toLocaleString()}`;
    document.getElementById('detDev').innerText = `S/ ${p.devengado.toLocaleString()}`;
    document.getElementById('detAvance').innerText = `${p.avance}%`;
    document.getElementById('detDepto').innerText = p.DEPARTAMENTO;
    
    const badge = document.getElementById('detBadge');
    badge.className = 'badge ' + (p.avance > 70 ? 'bg-success' : (p.avance > 40 ? 'bg-warning' : 'bg-danger'));
    badge.innerText = p.avance > 70 ? 'Óptimo' : (p.avance > 40 ? 'En Proceso' : 'Crítico');
}

function actualizarResumenRegional(data) {
    // 1. Agrupamos y sumamos proyectos por Departamento
    const departamentosMap = data.reduce((acc, proyecto) => {
        const depto = proyecto.DEPARTAMENTO || 'OTROS';
        if (!acc[depto]) {
            acc[depto] = { nombre: depto, pim: 0, dev: 0 };
        }
        acc[depto].pim += parseFloat(proyecto.pim) || 0;
        acc[depto].dev += parseFloat(proyecto.devengado) || 0;
        return acc;
    }, {});

    // 2. Convertimos el objeto en un Array y calculamos el % de avance
    const listaDeptos = Object.values(departamentosMap).map(d => ({
        ...d,
        avance: d.pim > 0 ? ((d.dev / d.pim) * 100).toFixed(1) : 0
    })).sort((a, b) => b.pim - a.pim); // Ordenamos por presupuesto (PIM) de mayor a menor

    renderizarTabla(listaDeptos);
    renderizarGrafico(listaDeptos);
}

function renderizarTabla(deptos) {
    const tbody = document.querySelector('#mefTable tbody');
    tbody.innerHTML = deptos.map(d => {
        // Semáforo de avance regional
        const claseBadge = d.avance > 75 ? 'bg-success' : (d.avance > 40 ? 'bg-warning' : 'bg-danger');
        
        return `
            <tr>
                <td><strong>${d.nombre}</strong></td>
                <td style="text-align: right;">S/ ${Number(d.pim).toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
                <td style="text-align: right;">S/ ${Number(d.dev).toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
                <td style="text-align: center;">
                    <span class="badge ${claseBadge}">${d.avance}%</span>
                </td>
            </tr>
        `;
    }).join('');
}

function renderizarGrafico(deptos) {
    const ctx = document.getElementById('mefChart').getContext('2d');
    if (miGrafico) miGrafico.destroy();

    // Mostramos solo los 10 departamentos con más presupuesto para no amontonar el gráfico
    const top10 = deptos.slice(0, 10);

    miGrafico = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: top10.map(d => d.nombre),
            datasets: [
                {
                    label: 'PIM (Presupuesto)',
                    data: top10.map(d => d.pim),
                    backgroundColor: '#cbd5e1',
                    order: 2
                },
                {
                    label: 'Devengado (Gasto)',
                    data: top10.map(d => d.dev),
                    backgroundColor: '#3b82f6',
                    order: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: (value) => 'S/ ' + value.toLocaleString() }
                }
            },
            plugins: {
                title: { display: true, text: 'Top 10 Departamentos por Presupuesto y Gasto' }
            }
        }
    });
}


function actualizarTarjetas(data) {
    const tp = data.reduce((a, b) => a + b.pim, 0);
    const td = data.reduce((a, b) => a + b.devengado, 0);
    document.getElementById('totalPim').innerText = `S/ ${tp.toLocaleString()}`;
    document.getElementById('totalDevengado').innerText = `S/ ${td.toLocaleString()}`;
    document.getElementById('globalAvance').innerText = `${((td/tp)*100).toFixed(1)}%`;
}

window.onload = cargarDatos;

