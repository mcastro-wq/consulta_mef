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
        let clase = item.avance > 70 ? 'bg-success' : (item.avance > 40 ? 'bg-warning' : 'bg-danger');
        return `
            <tr>
                <td><small>${item.NOMBRE}</small><br><strong>${item.DEPARTAMENTO}</strong></td>
                <td style="text-align: right;">${item.pim.toLocaleString()}</td>
                <td style="text-align: right;">${item.devengado.toLocaleString()}</td>
                <td style="text-align: center;">${item.avance}%</td>
                <td style="text-align: center;"><span class="badge ${clase}">${item.avance}%</span></td>
            </tr>
        `;
    }).join('');
}

function renderizarGrafico(data) {
    const ctx = document.getElementById('mefChart');
    if (!ctx) return; // Seguridad si el elemento no existe

    if (window.miGrafico) window.miGrafico.destroy();

    // Filtramos los 10 proyectos con mayor PIM para que el gráfico no se sature
    const topProyectos = data.sort((a, b) => b.pim - a.pim).slice(0, 10);

    window.miGrafico = new Chart(ctx, {
        type: 'bar',
        data: {
            // Usamos los nombres de los proyectos en las etiquetas
            labels: topProyectos.map(i => i.NOMBRE.substring(0, 30) + "..."), 
            datasets: [{
                label: '% de Avance por Proyecto',
                data: topProyectos.map(i => i.avance),
                backgroundColor: '#3b82f6',
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, max: 100 }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Avance: ${context.raw}%`;
                        }
                    }
                }
            }
        }
    });
}

// En renderizarTabla, ahora mostramos el nombre del proyecto


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

// Variable para guardar todos los proyectos cargados
let proyectosFull = [];

async function cargarDatos() {
    try {
        const response = await fetch('data_mef.json');
        proyectosFull = await response.json();
        // Llenamos los totales de las tarjetas como antes
        actualizarTarjetas(proyectosFull); 
    } catch (e) { console.error("Error cargando JSON", e); }
}

function buscarProyectos(query) {
    const list = document.getElementById('resultsList');
    list.innerHTML = '';
    if (query.length < 3) return; // Solo buscar si hay más de 3 letras

    const filtrados = proyectosFull.filter(p => 
        p.NOMBRE.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5); // Mostrar solo top 5 sugerencias

    filtrados.forEach(p => {
        const div = document.createElement('div');
        div.className = 'result-item';
        div.innerText = p.NOMBRE;
        div.onclick = () => mostrarFicha(p);
        list.appendChild(div);
    });
}

function mostrarFicha(p) {
    document.getElementById('resultsList').innerHTML = '';
    document.getElementById('projectSearch').value = p.NOMBRE;
    document.getElementById('projectDetail').style.display = 'block';

    // Llenar datos
    document.getElementById('detNombre').innerText = p.NOMBRE;
    document.getElementById('detPim').innerText = `S/ ${p.pim.toLocaleString()}`;
    document.getElementById('detDev').innerText = `S/ ${p.devengado.toLocaleString()}`;
    document.getElementById('detAvance').innerText = `${p.avance}%`;
    document.getElementById('detDepto').innerText = p.DEPARTAMENTO;

    // Actualizar Badge
    const badge = document.getElementById('detBadge');
    badge.className = 'badge ' + (p.avance > 70 ? 'bg-success' : (p.avance > 40 ? 'bg-warning' : 'bg-danger'));
    badge.innerText = p.avance > 70 ? 'Óptimo' : (p.avance > 40 ? 'En Proceso' : 'Crítico');
}

window.onload = cargarDatos;







