const resource_id = "749cb9b6-604f-485b-bb06-4b906b44034f";

async function consultarMEF() {
    const contenedor = document.getElementById('contenedor-proyectos');
    const estado = document.getElementById('estado');
    
    // Consulta SQL para traer datos reales de Gobiernos Regionales
    const sql = `SELECT "DEPARTAMENTO_META_NOMBRE", "PRODUCTO_PROYECTO_NOMBRE", "MONTO_PIM", "MONTO_DEVENGADO_ANO_EJE" FROM "${resource_id}" WHERE "SECTOR_NOMBRE" LIKE 'GOBIERNOS REGIONALES' AND "MONTO_PIM" > 0 LIMIT 100`;
    
    const mefUrl = `https://api.datosabiertos.mef.gob.pe/DatosAbiertos/v1/datastore_search_sql?sql=${encodeURIComponent(sql)}`;
    
    // Usamos un proxy público para saltar el bloqueo de seguridad (CORS)
    const proxyUrl = "https://corsproxy.io/?" + encodeURIComponent(mefUrl);

    try {
        estado.innerHTML = "⏳ Conectando de forma segura con el MEF...";
        
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error("Error en servidor MEF");
        
        const data = await response.json();
        const records = data.result?.records || [];

        if (records.length === 0) {
            estado.innerHTML = "⚠️ No se encontraron datos para esta consulta.";
            return;
        }

        estado.innerHTML = `✅ Datos en vivo: ${records.length} proyectos encontrados.`;
        
        // Procesamos los datos
        const proyectos = records.map(r => ({
            depto: r.DEPARTAMENTO_META_NOMBRE,
            nombre: r.PRODUCTO_PROYECTO_NOMBRE,
            pim: parseFloat(r.MONTO_PIM) || 0,
            dev: parseFloat(r.MONTO_DEVENGADO_ANO_EJE) || 0,
            avance: r.MONTO_PIM > 0 ? ((parseFloat(r.MONTO_DEVENGADO_ANO_EJE) / parseFloat(r.MONTO_PIM)) * 100).toFixed(1) : 0
        }));

        // Guardamos para el buscador y mostramos
        window.datosMEF = proyectos;
        renderizar(proyectos);

    } catch (error) {
        console.error(error);
        estado.innerHTML = "❌ El servidor del MEF no responde. Intente en unos minutos.";
    }
}

function renderizar(lista) {
    const contenedor = document.getElementById('contenedor-proyectos');
    contenedor.innerHTML = lista.map(p => `
        <div class="col-md-6 mb-3">
            <div class="card h-100 shadow-sm border-start border-4 ${p.avance > 50 ? 'border-success' : 'border-warning'}">
                <div class="card-body">
                    <small class="fw-bold text-primary">${p.depto}</small>
                    <h6 class="card-title mt-1">${p.nombre}</h6>
                    <div class="d-flex justify-content-between small text-muted mb-2">
                        <span>PIM: S/ ${p.pim.toLocaleString()}</span>
                        <span class="fw-bold">${p.avance}%</span>
                    </div>
                    <div class="progress" style="height: 8px;">
                        <div class="progress-bar ${p.avance > 50 ? 'bg-success' : 'bg-danger'}" style="width: ${p.avance}%"></div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Filtro de búsqueda
document.getElementById('buscador').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    if (!window.datosMEF) return;
    const filtrados = window.datosMEF.filter(p => 
        p.nombre.toLowerCase().includes(term) || p.depto.toLowerCase().includes(term)
    );
    renderizar(filtrados);
});

consultarMEF();
