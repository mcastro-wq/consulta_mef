const resource_id = "749cb9b6-604f-485b-bb06-4b906b44034f";

async function consultarMEF() {
    const contenedor = document.getElementById('contenedor-proyectos');
    const estado = document.getElementById('estado');
    
    // SQL: Traemos proyectos con presupuesto real
    const sql = `SELECT "DEPARTAMENTO_META_NOMBRE", "PRODUCTO_PROYECTO_NOMBRE", "MONTO_PIM", "MONTO_DEVENGADO_ANO_EJE" FROM "${resource_id}" WHERE "SECTOR_NOMBRE" LIKE 'GOBIERNOS REGIONALES' AND "MONTO_PIM" > 0 LIMIT 100`;
    
    const mefUrl = `https://api.datosabiertos.mef.gob.pe/DatosAbiertos/v1/datastore_search_sql?sql=${encodeURIComponent(sql)}`;
    
    // TÚNEL PARA SALTAR EL BLOQUEO (CORS)
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(mefUrl)}`;

    try {
        estado.innerHTML = "⏳ Cruzando el firewall del MEF...";
        
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error("Error en el túnel de conexión");
        
        const wrapper = await response.json();
        // AllOrigins devuelve la respuesta dentro de .contents como un string
        const data = JSON.parse(wrapper.contents);
        
        const records = data.result?.records || [];

        if (records.length === 0) {
            estado.innerHTML = "⚠️ El servidor respondió, pero no hay datos actuales.";
            return;
        }

        estado.innerHTML = `✅ Conexión Exitosa: ${records.length} proyectos detectados.`;
        
        window.datosMEF = records.map(r => ({
            depto: r.DEPARTAMENTO_META_NOMBRE,
            nombre: r.PRODUCTO_PROYECTO_NOMBRE,
            pim: parseFloat(r.MONTO_PIM) || 0,
            dev: parseFloat(r.MONTO_DEVENGADO_ANO_EJE) || 0,
            avance: r.MONTO_PIM > 0 ? ((parseFloat(r.MONTO_DEVENGADO_ANO_EJE) / parseFloat(r.MONTO_PIM)) * 100).toFixed(1) : 0
        }));

        renderizar(window.datosMEF);

    } catch (error) {
        console.error(error);
        estado.innerHTML = "🚨 Error persistente. El servidor del MEF está en mantenimiento o bloqueado.";
    }
}

function renderizar(lista) {
    const contenedor = document.getElementById('contenedor-proyectos');
    contenedor.innerHTML = lista.map(p => `
        <div class="col-md-6 mb-3">
            <div class="card h-100 shadow-sm border-start border-4 ${p.avance > 40 ? 'border-success' : 'border-warning'}">
                <div class="card-body">
                    <small class="fw-bold text-primary">${p.depto}</small>
                    <h6 class="card-title mt-1" style="font-size: 0.85rem;">${p.nombre}</h6>
                    <div class="d-flex justify-content-between small text-muted mb-2">
                        <span>PIM: S/ ${p.pim.toLocaleString()}</span>
                        <span class="fw-bold">${p.avance}%</span>
                    </div>
                    <div class="progress" style="height: 8px;">
                        <div class="progress-bar ${p.avance > 40 ? 'bg-success' : 'bg-danger'}" style="width: ${p.avance}%"></div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Buscador activo
document.getElementById('buscador').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    if (!window.datosMEF) return;
    const filtrados = window.datosMEF.filter(p => 
        p.nombre.toLowerCase().includes(term) || p.depto.toLowerCase().includes(term)
    );
    renderizar(filtrados);
});

consultarMEF();
