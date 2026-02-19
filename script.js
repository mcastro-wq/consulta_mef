const URL_DATA = 'https://raw.githubusercontent.com/mcastro-wq/consulta_mef/main/data_mef.json';
let datosGlobales = [];




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
        
        // Actualizar visualización general
        actualizarUI(proyectosFull);
        actualizarTarjetas(proyectosFull);
        
        document.getElementById('status').innerText = "Datos actualizados del MEF";
    } catch (error) {
        document.getElementById('status').innerText = "Error cargando datos";
    }
}

// ESTA FUNCIÓN ES LA QUE HACE QUE EL BUSCADOR FUNCIONE
function buscarProyectos(query) {
    const list = document.getElementById('resultsList');
    list.innerHTML = ''; // Limpiar resultados previos
    
    if (query.length < 3) {
        list.style.display = 'none';
        return;
    }

    const filtrados = proyectosFull.filter(p => 
        p.NOMBRE.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 8); // Mostrar máximo 8 para no saturar

    if (filtrados.length > 0) {
        list.style.display = 'block';
        filtrados.forEach(p => {
            const div = document.createElement('div');
            div.className = 'result-item';
            div.innerHTML = `<strong>${p.NOMBRE}</strong> <br> <small>${p.DEPARTAMENTO}</small>`;
            div.onclick = () => {
                mostrarFicha(p);
                list.style.display = 'none';
                document.getElementById('projectSearch').value = p.NOMBRE;
            };
            list.appendChild(div);
        });
    } else {
        list.style.display = 'none';
    }
}

function mostrarFicha(p) {
    const detalle = document.getElementById('projectDetail');
    detalle.style.display = 'block';

    document.getElementById('detNombre').innerText = p.NOMBRE;
    document.getElementById('detPim').innerText = `S/ ${p.pim.toLocaleString('es-PE')}`;
    document.getElementById('detDev').innerText = `S/ ${p.devengado.toLocaleString('es-PE')}`;
    document.getElementById('detAvance').innerText = `${p.avance}%`;
    document.getElementById('detDepto').innerText = p.DEPARTAMENTO;

    const badge = document.getElementById('detBadge');
    badge.className = 'badge ' + (p.avance > 70 ? 'bg-success' : (p.avance > 40 ? 'bg-warning' : 'bg-danger'));
    badge.innerText = p.avance > 70 ? 'Óptimo' : (p.avance > 40 ? 'En Proceso' : 'Crítico');
    
    // Scroll suave hasta la ficha para que el Gobernador la vea
    detalle.scrollIntoView({ behavior: 'smooth' });
}

window.onload = cargarDatos;








