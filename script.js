const resource_id = "749cb9b6-604f-485b-bb06-4b906b44034f";

async function cargarDatosEnVivo() {
    const contenedor = document.getElementById('lista-proyectos'); // Asegúrate que este ID exista en tu HTML
    
    // Consulta SQL optimizada para Lambayeque y Gobiernos Regionales 2025
    const sql = `SELECT "DEPARTAMENTO_META_NOMBRE", "PRODUCTO_PROYECTO_NOMBRE", "MONTO_PIM", "MONTO_DEVENGADO_ANO_EJE" FROM "${resource_id}" WHERE "SECTOR_NOMBRE" LIKE 'GOBIERNOS REGIONALES' AND "MONTO_PIM" > 0 LIMIT 500`;
    const url = `https://api.datosabiertos.mef.gob.pe/DatosAbiertos/v1/datastore_search_sql?sql=${encodeURIComponent(sql)}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        const records = data.result.records;

        // Guardamos en una variable global para el buscador
        window.proyectosCache = records.map(r => ({
            depto: r.DEPARTAMENTO_META_NOMBRE,
            nombre: r.PRODUCTO_PROYECTO_NOMBRE,
            pim: parseFloat(r.MONTO_PIM) || 0,
            dev: parseFloat(r.MONTO_DEVENGADO_ANO_EJE) || 0,
            avance: r.MONTO_PIM > 0 ? ((r.MONTO_DEVENGADO_ANO_EJE / r.MONTO_PIM) * 100).toFixed(1) : 0
        }));

        renderizar(window.proyectosCache);
    } catch (error) {
        contenedor.innerHTML = `<div class="alert alert-danger">Error conectando con el MEF. Intenta recargar la página.</div>`;
    }
}

function renderizar(datos) {
    const contenedor = document.getElementById('lista-proyectos');
    contenedor.innerHTML = datos.map(p => `
        <div class="card mb-3 shadow-sm border-start border-4 ${p.avance > 50 ? 'border-success' : 'border-warning'}">
            <div class="card-body">
                <span class="badge bg-secondary mb-2">${p.depto}</span>
                <h6 class="card-title">${p.nombre}</h6>
                <div class="d-flex justify-content-between small text-muted">
                    <span>PIM: S/ ${p.pim.toLocaleString()}</span>
                    <span>Ejecutado: ${p.avance}%</span>
                </div>
                <div class="progress mt-2" style="height: 8px;">
                    <div class="progress-bar ${p.avance > 50 ? 'bg-success' : 'bg-danger'}" style="width: ${p.avance}%"></div>
                </div>
            </div>
        </div>
    `).join('');
}

// Configurar el buscador
document.getElementById('buscador').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtrados = window.proyectosCache.filter(p => 
        p.nombre.toLowerCase().includes(term) || p.depto.toLowerCase().includes(term)
    );
    renderizar(filtrados);
});

// Iniciar carga
cargarDatosEnVivo();
