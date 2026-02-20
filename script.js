// 1. Variable global para mantener los datos en memoria
let todosLosProyectos = [];

async function consultarMEF() {
    const estado = document.getElementById('estado');
    // Forzamos descarga fresca
    const url = `data_mef.json?v=${new Date().getTime()}`;

    try {
        estado.innerHTML = "⏳ Cargando base de datos de Lambayeque...";
        const response = await fetch(url);
        if (!response.ok) throw new Error("No se pudo cargar el archivo data_mef.json");
        
        const data = await response.json();
        
        // 2. Guardamos en la variable global para que el buscador pueda verlos
        todosLosProyectos = data;

        estado.innerHTML = `✅ <b>${todosLosProyectos.length}</b> proyectos detectados.`;
        renderizar(todosLosProyectos);

    } catch (error) {
        console.error(error);
        estado.innerHTML = `🚨 Error: ${error.message}`;
    }
}

// 3. Función de filtrado (ahora más robusta)
function filtrarProyectos() {
    const texto = document.getElementById('buscador').value.toLowerCase().trim();
    const estado = document.getElementById('estado');

    const filtrados = todosLosProyectos.filter(p => {
        const nombre = (p.NOMBRE || "").toLowerCase();
        return nombre.includes(texto);
    });

    renderizar(filtrados);
    estado.innerHTML = `🔍 Mostrando <b>${filtrados.length}</b> de ${todosLosProyectos.length} proyectos.`;
}

function renderizar(lista) {
    const contenedor = document.getElementById('contenedor-proyectos');
    
    if (lista.length === 0) {
        contenedor.innerHTML = '<div class="col-12 text-center py-5 text-muted">No se encontraron coincidencias.</div>';
        return;
    }

    contenedor.innerHTML = lista.map(p => {
        // Determinamos la clase de color según el avance
        let claseAvance = "avance-bajo";
        if (p.avance > 30 && p.avance <= 70) claseAvance = "avance-medio";
        if (p.avance > 70) claseAvance = "avance-alto";

        return `
        <div class="col">
            <div class="card h-100 shadow-sm card-proyecto ${claseAvance}">
                <div class="card-body p-3">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="badge ${p.avance > 50 ? 'bg-success' : 'bg-danger'}">
                            ${p.avance}% avance
                        </span>
                    </div>
                    <h6 class="card-title text-uppercase mb-3" style="font-size: 0.75rem; height: 3.2em; overflow: hidden; font-weight: bold;">
                        ${p.NOMBRE}
                    </h6>
                    <div class="small mb-1">PIM: <b>S/ ${p.pim.toLocaleString('es-PE')}</b></div>
                    <div class="small mb-2">Devengado: <b class="text-success">S/ ${p.devengado.toLocaleString('es-PE')}</b></div>
                    <div class="progress" style="height: 6px;">
                        <div class="progress-bar ${p.avance > 50 ? 'bg-success' : 'bg-warning'}" style="width: ${p.avance}%"></div>
                    </div>
                </div>
            </div>
        </div>
    `}).join('');
}

// 4. IMPORTANTE: Conectar el buscador apenas cargue la página
document.addEventListener('DOMContentLoaded', () => {
    consultarMEF();
    
    // Escuchamos el teclado en el input de búsqueda
    const inputBuscador = document.getElementById('buscador');
    if(inputBuscador) {
        inputBuscador.addEventListener('input', filtrarProyectos);
    }
});
