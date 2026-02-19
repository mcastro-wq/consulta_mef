const URL_DATA = 'https://raw.githubusercontent.com/mcastro-wq/consulta_mef/main/data_mef.json';
let datosGlobales = []; // Para guardar los datos y poder filtrarlos

async function cargarDatos() {
    try {
        const response = await fetch(URL_DATA);
        datosGlobales = await response.json();
        
        // Ordenar de mayor a menor
        datosGlobales.sort((a, b) => b.total - a.total);

        document.getElementById('status').innerText = "Última actualización: Hoy (Sincronizado cada 6h)";
        
        actualizarUI(datosGlobales);
    } catch (error) {
        document.getElementById('status').innerText = "Error al conectar con los datos.";
        console.error(error);
    }
}

function actualizarUI(data) {
    renderizarGrafico(data);
    renderizarTabla(data);
}

function renderizarGrafico(data) {
    const ctx = document.getElementById('mefChart').getContext('2d');
    if (window.miGrafico) window.miGrafico.destroy();

    window.miGrafico = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(i => i.DEPARTAMENTO_META_NOMBRE),
            datasets: [{
                label: 'Soles (S/.)',
                data: data.map(i => i.total),
                backgroundColor: '#3b82f6'
            }]
        },
        options: {
            indexAxis: 'y',
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        }
    });
}

function renderizarTabla(data) {
    const tbody = document.querySelector('#mefTable tbody');
    // Actualizamos las cabeceras de la tabla en tu index.html para que coincidan
    tbody.innerHTML = data.map(item => {
        // Lógica de semáforo para el avance
        const colorClase = item.avance < 40 ? 'text-red' : (item.avance < 75 ? 'text-orange' : 'text-green');
        
        return `
        <tr>
            <td><strong>${item.DEPARTAMENTO}</strong></td>
            <td style="text-align: right;">S/ ${item.pim.toLocaleString()}</td>
            <td style="text-align: right;">S/ ${item.devengado.toLocaleString()}</td>
            <td style="text-align: right; font-weight: bold;" class="${colorClase}">
                ${item.avance}%
            </td>
        </tr>
    `}).join('');
}

function filtrarDatos() {
    const termino = document.getElementById('searchInput').value.toLowerCase();
    const filtrados = datosGlobales.filter(item => 
        item.DEPARTAMENTO_META_NOMBRE.toLowerCase().includes(termino)
    );
    actualizarUI(filtrados);
}

cargarDatos();



