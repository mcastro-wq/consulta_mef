async function consultarMEF() {
    const estado = document.getElementById('estado');
    
    // ANTI-CACHÉ: Añadimos un número aleatorio al final de la URL 
    // para obligar al navegador a bajar la versión más nueva del JSON.
    const localUrl = `data_mef.json?v=${new Date().getTime()}`; 

    try {
        estado.innerHTML = "⏳ Sincronizando datos locales...";
        
        const response = await fetch(localUrl);
        
        if (!response.ok) throw new Error(`No se encontró el archivo de datos en el servidor.`);
        
        const records = await response.json();

        if (!Array.isArray(records) || records.length === 0) {
            estado.innerHTML = "⚠️ El archivo de datos está vacío o tiene un formato incorrecto.";
            return;
        }

        window.datosMEF = records;
        estado.innerHTML = `✅ Datos actualizados de Lambayeque cargados con éxito.`;
        
        renderizar(window.datosMEF);

    } catch (error) {
        console.error("Error local:", error);
        estado.innerHTML = `🚨 Error: No se pudo cargar la data automatizada. Verifica si la Action de GitHub ya generó el archivo.`;
    }
}

function renderizar(lista) {
    const contenedor = document.getElementById('contenedor-proyectos');
    if (!contenedor) return;
    if (!lista.length) {
        contenedor.innerHTML = "<p class='text-center'>No hay proyectos para mostrar.</p>";
        return;
    }
    
    contenedor.innerHTML = lista.map(p => {
        // Aseguramos que los valores sean numéricos para evitar errores de visualización
        const pimVal = parseFloat(p.pim) || 0;
        const devVal = parseFloat(p.devengado) || 0;
        const avanceVal = parseFloat(p.avance) || 0;

        return `
        <div class="col-md-6 mb-3">
            <div class="card h-100 shadow-sm border-start border-4 ${avanceVal > 40 ? 'border-success' : 'border-danger'}">
                <div class="card-body p-3">
                    <div class="d-flex justify-content-between">
                        <small class="fw-bold text-primary">${p.DEPARTAMENTO || 'LAMBAYEQUE'}</small>
                        <span class="badge ${avanceVal > 70 ? 'bg-success' : (avanceVal > 40 ? 'bg-warning text-dark' : 'bg-danger')}">
                            ${avanceVal}%
                        </span>
                    </div>
                    <h6 class="card-title mt-2 mb-3" style="font-size: 0.85rem; line-height: 1.2; height: 2.4em; overflow: hidden;">
                        ${p.NOMBRE}
                    </h6>
                    <div class="small text-muted mb-1">PIM: <b>S/ ${pimVal.toLocaleString('es-PE')}</b></div>
                    <div class="small text-muted mb-1">Devengado: <b>S/ ${devVal.toLocaleString('es-PE')}</b></div>
                    <div class="progress" style="height: 8px; background-color: #e9ecef;">
                        <div class="progress-bar ${avanceVal > 40 ? 'bg-success' : 'bg-danger'}" 
                             role="progressbar" 
                             style="width: ${avanceVal}%" 
                             aria-valuenow="${avanceVal}" 
                             aria-valuemin="0" 
                             aria-valuemax="100">
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `}).join('');
}

document.addEventListener('DOMContentLoaded', consultarMEF);
