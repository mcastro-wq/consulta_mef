// Variable global para guardar los datos y no volver a pedirlos al MEF al buscar
window.datosMEF = [];

async function consultarMEF() {
    const estado = document.getElementById('estado');
    const url = `data_mef.json?v=${new Date().getTime()}`;

    try {
        estado.innerHTML = "⏳ Sincronizando con los datos del MEF...";
        const response = await fetch(url);
        if (!response.ok) throw new Error("Archivo de datos no encontrado.");
        
        const records = await response.json();
        window.datosMEF = records; // Guardamos la data real aquí

        estado.innerHTML = `✅ <b>${records.length}</b> proyectos de Lambayeque listos.`;
        renderizar(records);

    } catch (error) {
        estado.innerHTML = `🚨 Error: ${error.message}`;
    }
}

// ESTA ES LA FUNCIÓN DEL BUSCADOR QUE FALTABA O FALLABA
function filtrarProyectos() {
    const busqueda = document.getElementById('inputBusqueda').value.toLowerCase();
    
    const filtrados = window.datosMEF.filter(p => 
        p.NOMBRE.toLowerCase().includes(busqueda) || 
        p.DEPARTAMENTO.toLowerCase().includes(busqueda)
    );

    renderizar(filtrados);
    
    // Actualizamos el contador de resultados
    document.getElementById('estado').innerHTML = `🔍 Encontrados: <b>${filtrados.length}</b> proyectos.`;
}

function renderizar(lista) {
    const contenedor = document.getElementById('contenedor-proyectos');
    
    if (lista.length === 0) {
        contenedor.innerHTML = '<div class="col-12 text-center text-muted">No se encontraron proyectos con ese nombre.</div>';
        return;
    }

    contenedor.innerHTML = lista.map(p => `
        <div class="col-md-6 col-lg-4 mb-3">
            <div class="card h-100 shadow-sm border-start border-4 ${p.avance > 40 ? 'border-success' : 'border-danger'}">
                <div class="card-body p-3">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="badge ${p.avance > 70 ? 'bg-success' : (p.avance > 30 ? 'bg-warning text-dark' : 'bg-danger')}">
                            ${p.avance}% avance
                        </span>
                        <small class="text-primary fw-bold">ID: 14</small>
                    </div>
                    <h6 class="card-title text-uppercase" style="font-size: 0.8rem; min-height: 3.5em; overflow: hidden;">
                        ${p.NOMBRE}
                    </h6>
                    <hr class="my-2">
                    <div class="d-flex justify-content-between small">
                        <span class="text-muted">PIM:</span>
                        <span class="fw-bold">S/ ${p.pim.toLocaleString('es-PE')}</span>
                    </div>
                    <div class="d-flex justify-content-between small mb-2">
                        <span class="text-muted">Ejecutado:</span>
                        <span class="fw-bold text-success">S/ ${p.devengado.toLocaleString('es-PE')}</span>
                    </div>
                    <div class="progress" style="height: 6px;">
                        <div class="progress-bar ${p.avance > 40 ? 'bg-success' : 'bg-danger'}" style="width: ${p.avance}%"></div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

document.addEventListener('DOMContentLoaded', consultarMEF);
