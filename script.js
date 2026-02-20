async function consultarMEF() {
    const estado = document.getElementById('estado');
    const contenedor = document.getElementById('contenedor-proyectos');
    
    // IMPORTANTE: Ahora leemos el archivo que genera tu GitHub Action
    // No usamos proxies porque el archivo está en tu propio servidor/repo
    const localUrl = 'data_mef.json'; 

    try {
        estado.innerHTML = "⏳ Cargando datos actualizados...";
        
        // Fetch simple al archivo local
        const response = await fetch(localUrl);
        
        if (!response.ok) throw new Error(`No se encontró el archivo de datos.`);
        
        const records = await response.json();

        if (records.length === 0) {
            estado.innerHTML = "⚠️ El archivo de datos está vacío.";
            return;
        }

        // Ya no mapeamos 'result.records' porque tu script.py ya guardó la lista limpia
        // Tu script.py usa minúsculas: 'pim', 'devengado', 'avance', 'NOMBRE'
        window.datosMEF = records;

        estado.innerHTML = `✅ Datos sincronizados con el MEF (GitHub Actions).`;
        
        renderizar(window.datosMEF);

    } catch (error) {
        console.error("Error local:", error);
        estado.innerHTML = `🚨 Error: No se pudo cargar el JSON automatizado. Asegúrate de que el Workflow de GitHub haya terminado.`;
    }
}

function renderizar(lista) {
    const contenedor = document.getElementById('contenedor-proyectos');
    if (!lista.length) return;
    
    // Adaptado a las claves que genera tu script.py: NOMBRE, DEPARTAMENTO, pim, devengado, avance
    contenedor.innerHTML = lista.map(p => `
        <div class="col-md-6 mb-3">
            <div class="card h-100 shadow-sm border-start border-4 ${p.avance > 40 ? 'border-success' : 'border-danger'}">
                <div class="card-body p-3">
                    <div class="d-flex justify-content-between">
                        <small class="fw-bold text-primary">${p.DEPARTAMENTO}</small>
                        <span class="badge ${p.avance > 40 ? 'bg-success' : 'bg-danger'}">${p.avance}%</span>
                    </div>
                    <h6 class="card-title mt-2 mb-3" style="font-size: 0.85rem; line-height: 1.2;">${p.NOMBRE}</h6>
                    <div class="small text-muted mb-1">PIM: S/ ${p.pim.toLocaleString()}</div>
                    <div class="small text-muted mb-1">Ejecutado: S/ ${p.devengado.toLocaleString()}</div>
                    <div class="progress" style="height: 6px;">
                        <div class="progress-bar ${p.avance > 40 ? 'bg-success' : 'bg-warning'}" style="width: ${p.avance}%"></div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Inicializar
document.addEventListener('DOMContentLoaded', consultarMEF);
