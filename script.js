async function consultarMEF() {
    const estado = document.getElementById('estado');
    // Forzamos la descarga de la versión más reciente con un timestamp (?v=...)
    const url = `data_mef.json?v=${new Date().getTime()}`;

    try {
        estado.innerHTML = "⏳ Sincronizando con los datos recolectados del MEF...";
        const response = await fetch(url);
        if (!response.ok) throw new Error("Aún no hay datos recolectados.");
        
        const records = await response.json();
        window.datosMEF = records;

        estado.innerHTML = `✅ Datos Reales actualizados. ${records.length} proyectos activos.`;
        renderizar(records);

    } catch (error) {
        estado.innerHTML = `🚨 Error: ${error.message}. Ejecuta la Action en GitHub por primera vez.`;
    }
}

function renderizar(lista) {
    const contenedor = document.getElementById('contenedor-proyectos');
    contenedor.innerHTML = lista.map(p => `
        <div class="col-md-6 mb-3">
            <div class="card h-100 shadow-sm border-start border-4 ${p.avance > 50 ? 'border-success' : 'border-danger'}">
                <div class="card-body">
                    <div class="d-flex justify-content-between mb-2">
                        <small class="fw-bold text-primary">${p.DEPARTAMENTO}</small>
                        <span class="badge ${p.avance > 50 ? 'bg-success' : 'bg-danger'}">${p.avance}%</span>
                    </div>
                    <h6 class="card-title">${p.NOMBRE}</h6>
                    <p class="small text-muted mb-1">PIM: S/ ${p.pim.toLocaleString()}</p>
                    <div class="progress" style="height: 8px;">
                        <div class="progress-bar ${p.avance > 50 ? 'bg-success' : 'bg-warning'}" style="width: ${p.avance}%"></div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

document.addEventListener('DOMContentLoaded', consultarMEF);
