const resource_id = "749cb9b6-604f-485b-bb06-4b906b44034f";

async function consultarMEF() {
    const contenedor = document.getElementById('contenedor-proyectos');
    const estado = document.getElementById('estado');
    
    const sql = `SELECT "DEPARTAMENTO_META_NOMBRE", "PRODUCTO_PROYECTO_NOMBRE", "MONTO_PIM", "MONTO_DEVENGADO_ANO_EJE" FROM "${resource_id}" WHERE "SECTOR_NOMBRE" LIKE 'GOBIERNOS REGIONALES' AND "MONTO_PIM" > 0 LIMIT 500`;
    
    // URL original del MEF
    const mefUrl = `https://api.datosabiertos.mef.gob.pe/DatosAbiertos/v1/datastore_search_sql?sql=${encodeURIComponent(sql)}`;
    
    // Usamos un proxy para saltar el bloqueo de CORS
    const proxyUrl = "https://corsproxy.io/?" + encodeURIComponent(mefUrl);

    try {
        estado.innerHTML = "⏳ Conectando con el servidor central...";
        
        const response = await fetch(proxyUrl);
        
        if (!response.ok) throw new Error("Respuesta del servidor no válida");
        
        const data = await response.json();
        
        // El formato SQL del MEF a veces pone los datos en data.result.records 
        // o en data.records dependiendo de la versión
        const records = data.result?.records || data.records || [];

        if (records.length === 0) {
            estado.innerHTML = "⚠️ No se encontraron registros para el año actual.";
            return;
        }

        estado.innerHTML = `✅ Datos actualizados: ${records.length} proyectos encontrados.`;
        
        window.datosMEF = records.map(r => ({
            depto: r.DEPARTAMENTO_META_NOMBRE,
            nombre: r.PRODUCTO_PROYECTO_NOMBRE,
            pim: parseFloat(r.MONTO_PIM) || 0,
            dev: parseFloat(r.MONTO_DEVENGADO_ANO_EJE) || 0,
            avance: r.MONTO_PIM > 0 ? ((r.MONTO_DEVENGADO_ANO_EJE / r.MONTO_PIM) * 100).toFixed(1) : 0
        }));

        renderizar(window.datosMEF);

    } catch (error) {
        console.error("Error detallado:", error);
        estado.innerHTML = "❌ Error de seguridad (CORS) o servidor caído. Intentando conexión alternativa...";
        // Aquí podrías intentar una segunda ruta si fallara la primera
    }
}

function renderizar(proyectos) {
    const contenedor = document.getElementById('contenedor-proyectos');
    contenedor.innerHTML = proyectos.map(p => `
        <div class="col-md-6 col-lg-4 mb-3">
            <div class="card h-100 shadow-sm p-3 border-start border-4 ${p.avance > 40 ? 'border-success' : 'border-danger'}">
                <small class="text-uppercase fw-bold text-muted">${p.depto}</small>
                <h6 class="my-2" style="font-size: 0.9rem;">${p.nombre}</h6>
                <div class="d-flex justify-content-between small">
                    <span>PIM: S/ ${p.pim.toLocaleString()}</span>
                    <span class="fw-bold">${p.avance}%</span>
                </div>
                <div class="progress mt-2" style="height: 6px;">
                    <div class="progress-bar ${p.avance > 40 ? 'bg-success' : 'bg-warning'}" style="width: ${p.avance}%"></div>
                </div>
            </div>
        </div>
    `).join('');
}

// Filtro buscador
document.getElementById('buscador').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtrados = window.datosMEF.filter(p => 
        p.nombre.toLowerCase().includes(term) || p.depto.toLowerCase().includes(term)
    );
    renderizar(filtrados);
});

consultarMEF();
