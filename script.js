const resource_id = "749cb9b6-604f-485b-bb06-4b906b44034f";

async function consultarMEF() {
    const estado = document.getElementById('estado');
    const contenedor = document.getElementById('contenedor-proyectos');
    
    // Cambiamos a datastore_search (más estable) con un filtro de texto para Lambayeque
    const apiUrl = `https://api.datosabiertos.mef.gob.pe/DatosAbiertos/v1/datastore_search?resource_id=${resource_id}&q=LAMBAYEQUE&limit=50`;
    
    // Usamos el Proxy de Cloudflare (muy potente)
    const finalUrl = `https://corsproxy.io/?${encodeURIComponent(apiUrl)}`;

    try {
        estado.innerHTML = "⏳ Intentando conexión de alta prioridad...";
        
        const response = await fetch(finalUrl);
        
        if (!response.ok) throw new Error(`Error del servidor: ${response.status}`);
        
        const data = await response.json();
        
        // Estructura para datastore_search
        const records = data.result?.records || [];

        if (records.length === 0) {
            estado.innerHTML = "⚠️ Conexión establecida, pero no hay datos para LAMBAYEQUE.";
            return;
        }

        estado.innerHTML = `✅ ¡Conectado! Mostrando proyectos de la región.`;
        
        window.datosMEF = records.map(r => ({
            depto: r.DEPARTAMENTO_META_NOMBRE || "REGIONAL",
            nombre: r.PRODUCTO_PROYECTO_NOMBRE || "PROYECTO SIN NOMBRE",
            pim: parseFloat(r.MONTO_PIM) || 0,
            dev: parseFloat(r.MONTO_DEVENGADO_ANO_EJE) || 0,
            avance: parseFloat(r.MONTO_PIM) > 0 ? ((parseFloat(r.MONTO_DEVENGADO_ANO_EJE) / parseFloat(r.MONTO_PIM)) * 100).toFixed(1) : 0
        }));

        renderizar(window.datosMEF);

    } catch (error) {
        console.error("Detalle del error:", error);
        estado.innerHTML = `🚨 Error de Red: ${error.message}. El MEF ha bloqueado el acceso temporalmente.`;
    }
}

function renderizar(lista) {
    const contenedor = document.getElementById('contenedor-proyectos');
    if (!lista.length) return;
    
    contenedor.innerHTML = lista.map(p => `
        <div class="col-md-6 mb-3">
            <div class="card h-100 shadow-sm border-start border-4 ${p.avance > 40 ? 'border-success' : 'border-danger'}">
                <div class="card-body p-3">
                    <div class="d-flex justify-content-between">
                        <small class="fw-bold text-primary">${p.depto}</small>
                        <span class="badge ${p.avance > 40 ? 'bg-success' : 'bg-danger'}">${p.avance}%</span>
                    </div>
                    <h6 class="card-title mt-2 mb-3" style="font-size: 0.85rem; line-height: 1.2;">${p.nombre}</h6>
                    <div class="small text-muted mb-1">PIM: S/ ${p.pim.toLocaleString()}</div>
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
