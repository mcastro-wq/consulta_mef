const resource_id = "749cb9b6-604f-485b-bb06-4b906b44034f";

async function consultarMEF() {
    const contenedor = document.getElementById('contenedor-proyectos');
    const estado = document.getElementById('estado');
    
    // SQL optimizado para Gobiernos Regionales 2025/2026
    const sql = `SELECT "DEPARTAMENTO_META_NOMBRE", "PRODUCTO_PROYECTO_NOMBRE", "MONTO_PIM", "MONTO_DEVENGADO_ANO_EJE" FROM "${resource_id}" WHERE "SECTOR_NOMBRE" LIKE 'GOBIERNOS REGIONALES' AND "MONTO_PIM" > 0 LIMIT 500`;
    
    const url = `https://api.datosabiertos.mef.gob.pe/DatosAbiertos/v1/datastore_search_sql?sql=${encodeURIComponent(sql)}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        const records = data.result.records;

        estado.innerHTML = `✅ ${records.length} proyectos encontrados en el servidor oficial.`;
        
        window.datosMEF = records.map(r => ({
            depto: r.DEPARTAMENTO_META_NOMBRE,
            nombre: r.PRODUCTO_PROYECTO_NOMBRE,
            pim: parseFloat(r.MONTO_PIM) || 0,
            dev: parseFloat(r.MONTO_DEVENGADO_ANO_EJE) || 0,
            avance: r.MONTO_PIM > 0 ? ((r.MONTO_DEVENGADO_ANO_EJE / r.MONTO_PIM) * 100).toFixed(1) : 0
        }));

        renderizar(window.datosMEF);

    } catch (error) {
        console.error(error);
        estado.innerHTML = "❌ Error al conectar con el MEF. Intente recargar la página.";
    }
}

function renderizar(proyectos) {
    const contenedor = document.getElementById('contenedor-proyectos');
    contenedor.innerHTML = proyectos.map(p => `
        <div class="col-md-6 col-lg-4 mb-3">
            <div class="card card-proyecto h-100 shadow-sm p-3 ${p.avance > 50 ? 'avance-alto' : 'avance-bajo'}">
                <small class="text-primary fw-bold">${p.depto}</small>
                <h6 class="my-2">${p.nombre}</h6>
                <div class="d-flex justify-content-between small text-muted">
                    <span>PIM: S/ ${p.pim.toLocaleString()}</span>
                    <span>${p.avance}%</span>
                </div>
                <div class="progress mt-2" style="height: 6px;">
                    <div class="progress-bar ${p.avance > 50 ? 'bg-success' : 'bg-danger'}" style="width: ${p.avance}%"></div>
                </div>
            </div>
        </div>
    `).join('');
}

// Filtro de búsqueda en tiempo real
document.getElementById('buscador').addEventListener('input', (e) => {
    const busqueda = e.target.value.toLowerCase();
    const filtrados = window.datosMEF.filter(p => 
        p.nombre.toLowerCase().includes(busqueda) || p.depto.toLowerCase().includes(busqueda)
    );
    renderizar(filtrados);
});

consultarMEF();
