const URL_DATA = 'https://raw.githubusercontent.com/mcastro-wq/consulta_mef/main/data_mef.json';
let datosGlobales = [];

async function cargarDatos() {
    try {
        const response = await fetch('data_mef.json');
        datosGlobales = await response.json();
        actualizarUI(datosGlobales);
        actualizarTarjetas(datosGlobales);
        document.getElementById('status').innerText = "Datos actualizados del MEF";
    } catch (error) {
        document.getElementById('status').innerText = "Error cargando datos";
    }
}

function actualizarTarjetas(data) {
    // Importante: usamos item.pim y item.devengado (nombres en minúscula como en el JSON)
    const totalPim = data.reduce((acc, i) => acc + (parseFloat(i.pim) || 0), 0);
    const totalDev = data.reduce((acc, i) => acc + (parseFloat(i.devengado) || 0), 0);
    const avanceGlobal = totalPim > 0 ? ((totalDev / totalPim) * 100).toFixed(1) : 0;

    document.getElementById('totalPim').innerText = `S/ ${totalPim.toLocaleString('es-PE')}`;
    document.getElementById('totalDevengado').innerText = `S/ ${totalDev.toLocaleString('es-PE')}`;
    document.getElementById('globalAvance').innerText = `${avanceGlobal}%`;
}

function renderizarTabla(data) {
    const tbody = document.querySelector('#mefTable tbody');
    tbody.innerHTML = data.map(item => {
        let clase = 'bg-danger';
        let texto = 'Crítico';
        if (item.avance > 70) { clase = 'bg-success'; texto = 'Óptimo'; }
        else if (item.avance > 40) { clase = 'bg-warning'; texto = 'En Proceso'; }

        return `
            <tr>
                <td><strong>${item.DEPARTAMENTO}</strong></td>
                <td style="text-align: right;">${item.pim.toLocaleString()}</td>
                <td style="text-align: right;">${item.devengado.toLocaleString()}</td>
                <td style="text-align: center;"><strong>${item.avance}%</strong></td>
                <td style="text-align: center;"><span class="badge ${clase}">${texto}</span></td>
            </tr>
        `;
    }).join('');
}

function renderizarGrafico(data) {
    const ctx = document.getElementById('mefChart').getContext('2d');
    if (window.miGrafico) window.miGrafico.destroy();

    window.miGrafico = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(i => i.DEPARTAMENTO),
            datasets: [{
                label: '% de Avance Presupuestal',
                data: data.map(i => i.avance),
                backgroundColor: '#3b82f6'
            }]
        },
        options: {
            scales: { y: { beginAtZero: true, max: 100 } }
        }
    });
}

function actualizarUI(data) {
    renderizarTabla(data);
    renderizarGrafico(data);
}

function filtrarDatos() {
    const termino = document.getElementById('searchInput').value.toLowerCase();
    const filtrados = datosGlobales.filter(item => 
        item.DEPARTAMENTO.toLowerCase().includes(termino)
    );
    actualizarUI(filtrados);
}

window.onload = cargarDatos;




