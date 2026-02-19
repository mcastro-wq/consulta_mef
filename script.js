const URL_DATA = 'https://raw.githubusercontent.com/mcastro-wq/consulta_mef/main/data_mef.json';
let proyectosFull = [];
let miGrafico = null;

async function cargarDatos() {
    try {
        // Cargamos el JSON generado por Python
        const response = await fetch('data_mef.json');
        proyectosFull = await response.json();
        
        // Ejecutamos las dos lógicas del tablero
        actualizarTarjetasGlobales(proyectosFull);
        actualizarPanoramaRegional(proyectosFull);
        
        document.getElementById('status').innerText = "Datos actualizados: " + new Date().toLocaleDateString();
    } catch (e) {
        document.getElementById('status').innerText = "Error al sincronizar datos";
        console.error(e);
    }
}

// --- LÓGICA 1: BUSCADOR DE PROYECTOS ---
function buscarProyectos(query) {
    const list = document.getElementById('resultsList');
    list.innerHTML = '';
    if (query.length < 3) { list.style.display = 'none'; return; }

    const filtrados = proyectosFull.filter(p => 
        p.NOMBRE.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 8);
    
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
    document.getElementById('detPim').innerText = `S/ ${p.pim.toLocaleString('es-PE', {minimumFractionDigits:2})}`;
    document.getElementById('detDev').innerText = `S/ ${p.devengado.toLocaleString('es-PE', {minimumFractionDigits:2})}`;
    document.getElementById('detAvance').innerText = `${p.avance}%`;
    document.getElementById('detDepto').innerText = p.DEPARTAMENTO;
    
    const badge = document.getElementById('detBadge');
    const color = p.avance > 75 ? 'bg-success' : (p.avance > 40 ? 'bg-warning' : 'bg-danger');
    badge.className = `badge ${color}`;
    badge.innerText = p.avance > 75 ? 'Óptimo' : (p.avance > 40 ? 'En Proceso' : 'Crítico');
}

// --- LÓGICA 2: PANORAMA REGIONAL (AGRUPACIÓN) ---
function actualizarPanoramaRegional(data) {
    // Agrupamos y sumamos por departamento
    const resumen = data.reduce((acc, p) => {
        const d = p.DEPARTAMENTO || 'OTROS';
        if (!acc[d]) acc[d] = { pim: 0, dev: 0 };
        acc[d].pim += p.pim;
        acc[d].dev += p.devengado;
        return acc;
    }, {});

    // Convertimos a array y calculamos avance
    const listaDeptos = Object.keys(resumen).map(nombre => {
        const d = resumen[nombre];
        return {
            nombre: nombre,
            pim: d.pim,
            dev: d.dev,
            avance: d.pim > 0 ? ((d.dev / d.pim) * 100).toFixed(1) : 0
        };
    }).sort((a, b) => b.pim - a.pim); // Ordenar por mayor presupuesto

    renderizarTablaDeptos(listaDeptos);
    renderizarGraficoDeptos(listaDeptos);
}

function renderizarTablaDeptos(deptos) {
    const tbody = document.querySelector('#mefTable tbody');
    tbody.innerHTML = deptos.map(d => `
        <tr>
            <td><strong>${d.nombre}</strong></td>
            <td style="text-align: right;">${Number(d.pim).toLocaleString('es-PE')}</td>
            <td style="text-align: right;">${Number(d.dev).toLocaleString('es-PE')}</td>
            <td style="text-align: center;">
                <span class="badge ${d.avance > 50 ? 'bg-success' : 'bg-danger'}">${d.avance}%</span>
            </td>
        </tr>
    `).join('');
}

function renderizarGraficoDeptos(deptos) {
    const ctx = document.getElementById('mefChart').getContext('2d');
    if (miGrafico) miGrafico.destroy();

    const top10 = deptos.slice(0, 10);
    miGrafico = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: top10.map(d => d.nombre),
            datasets: [{
                label: '% de Avance Ejecución',
                data: top10.map(d => d.avance),
                backgroundColor: '#3b82f6',
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, max: 100 } }
        }
    });
}

function actualizarTarjetasGlobales(data) {
    const tp = data.reduce((a, b) => a + b.pim, 0);
    const td = data.reduce((a, b) => a + b.devengado, 0);
    const av = tp > 0 ? ((td / tp) * 100).toFixed(1) : 0;

    document.getElementById('totalPim').innerText = `S/ ${tp.toLocaleString('es-PE')}`;
    document.getElementById('totalDevengado').innerText = `S/ ${td.toLocaleString('es-PE')}`;
    document.getElementById('globalAvance').innerText = `${av}%`;
}

window.onload = cargarDatos;

