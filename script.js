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

// LÓGICA DE PANORAMA REGIONAL
function actualizarResumenRegional(data) {
    // Agrupamos por departamento
    const resumen = {};
    data.forEach(p => {
        if (!resumen[p.DEPARTAMENTO]) resumen[p.DEPARTAMENTO] = { pim: 0, dev: 0 };
        resumen[p.DEPARTAMENTO].pim += p.pim;
        resumen[p.DEPARTAMENTO].dev += p.devengado;
    });

    const listaDeptos = Object.keys(resumen).map(d => ({
        nombre: d,
        pim: resumen[d].pim,
        dev: resumen[d].dev,
        avance: ((resumen[d].dev / resumen[d].pim) * 100).toFixed(1)
    })).sort((a, b) => b.pim - a.pim);

    renderizarTabla(listaDeptos);
    renderizarGrafico(listaDeptos);
}

function renderizarTabla(deptos) {
    const tbody = document.querySelector('#mefTable tbody');
    tbody.innerHTML = deptos.map(d => `
        <tr>
            <td><strong>${d.nombre}</strong></td>
            <td style="text-align: right;">${d.pim.toLocaleString()}</td>
            <td style="text-align: right;">${d.dev.toLocaleString()}</td>
            <td style="text-align: center;"><span class="badge ${d.avance > 40 ? 'bg-success' : 'bg-danger'}">${d.avance}%</span></td>
        </tr>
    `).join('');
}

function renderizarGrafico(deptos) {
    const ctx = document.getElementById('mefChart').getContext('2d');
    if (miGrafico) miGrafico.destroy();
    miGrafico = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: deptos.slice(0, 10).map(d => d.nombre),
            datasets: [{ label: '% Avance', data: deptos.slice(0, 10).map(d => d.avance), backgroundColor: '#3b82f6' }]
        },
        options: { responsive: true, maintainAspectRatio: false }
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
