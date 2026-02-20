let todosLosProyectos = [];
let filtroRango = 'todos';

async function consultarMEF() {
    const estado = document.getElementById('estado');
    // Forzamos la descarga sin caché para ver cambios del script.py
    const url = `data_mef.json?v=${new Date().getTime()}`;

    try {
        estado.innerHTML = "⏳ Cargando datos del MEF...";
        const response = await fetch(url);
        if (!response.ok) throw new Error("No se encontró el archivo de datos.");
        
        const data = await response.json();
        todosLosProyectos = data;

        // Configurar el selector de años automáticamente
        const aniosUnicos = [...new Set(todosLosProyectos.map(p => p.anio))].sort((a,b) => b-a);
        const selectAnio = document.getElementById('select-anio');
        selectAnio.innerHTML = aniosUnicos.map(a => `<option value="${a}">${a}</option>`).join('');

        // Ejecutar primer filtrado y renderizado
        filtrarTodo();

    } catch (error) {
        console.error(error);
        estado.innerHTML = `🚨 Error: ${error.message}`;
    }
}

function filtrarTodo() {
    const busqueda = document.getElementById('buscador').value
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    const anioSeleccionado = document.getElementById('select-anio').value;

    const filtrados = todosLosProyectos.filter(p => {
        const coincideAnio = p.anio === anioSeleccionado;
        const nombreLimpio = p.NOMBRE.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const coincideTexto = nombreLimpio.includes(busqueda);
        
        let coincideRango = true;
        if (filtroRango === 'bajo') coincideRango = p.avance <= 30;
        else if (filtroRango === 'medio') coincideRango = p.avance > 30 && p.avance <= 70;
        else if (filtroRango === 'alto') coincideRango = p.avance > 70;

        return coincideAnio && coincideTexto && coincideRango;
    });

    actualizarKPIs(filtrados);
    renderizar(filtrados);
}

function actualizarKPIs(lista) {
    const totalPim = lista.reduce((acc, p) => acc + (p.pim || 0), 0);
    const totalDev = lista.reduce((acc, p) => acc + (p.devengado || 0), 0);
    const avanceGlobal = totalPim > 0 ? ((totalDev / totalPim) * 100).toFixed(1) : 0;

    document.getElementById('total-pim').innerText = `S/ ${totalPim.toLocaleString('es-PE')}`;
    document.getElementById('total-ejecutado').innerText = `S/ ${totalDev.toLocaleString('es-PE')}`;
    document.getElementById('avance-global').innerText = `${avanceGlobal}%`;
    document.getElementById('estado').innerHTML = `✅ Mostrando <b>${lista.length}</b> proyectos`;
}

function setRango(rango) {
    filtroRango = rango;
    filtrarTodo();
}

function renderizar(lista) {
    const contenedor = document.getElementById('contenedor-proyectos');
    
    if (lista.length === 0) {
        contenedor.innerHTML = '<div class="col-12 text-center py-5 text-muted">No hay proyectos que coincidan con los filtros.</div>';
        return;
    }

    const html = lista.map(p => {
        let claseBorde = "avance-bajo";
        if (p.avance > 30 && p.avance <= 70) claseBorde = "avance-medio";
        if (p.avance > 70) claseBorde = "avance-alto";

        return `
        <div class="col">
            <div class="card h-100 card-proyecto ${claseBorde}">
                <div class="card-body p-3">
                    <div class="d-flex justify-content-between mb-2">
                        <span class="badge ${p.avance > 50 ? 'bg-success' : 'bg-danger'}">${p.avance}% Avance</span>
                        <small class="text-muted fw-bold">AÑO ${p.anio}</small>
                    </div>
                    <h6 class="card-title text-uppercase mb-3" style="font-size: 0.75rem; font-weight: bold; height: 3.2em; overflow: hidden;">
                        ${p.NOMBRE}
                    </h6>
                    <div class="small text-muted">PIM: <span class="text-dark fw-bold">S/ ${p.pim.toLocaleString('es-PE')}</span></div>
                    <div class="small text-muted mb-2">Devengado: <span class="text-success fw-bold">S/ ${p.devengado.toLocaleString('es-PE')}</span></div>
                    <div class="progress" style="height: 6px;">
                        <div class="progress-bar ${p.avance > 50 ? 'bg-success' : 'bg-warning'}" style="width: ${p.avance}%"></div>
                    </div>
                </div>
            </div>
        </div>`;
    }).join('');

    contenedor.innerHTML = html;
}

function exportarCSV() {
    const anio = document.getElementById('select-anio').value;
    let csv = "Año,Proyecto,PIM,Devengado,Avance\n";
    todosLosProyectos.filter(p => p.anio === anio).forEach(p => {
        csv += `${p.anio},"${p.NOMBRE}",${p.pim},${p.devengado},${p.avance}%\n`;
    });
    
    const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Reporte_Lambayeque_${anio}.csv`;
    link.click();
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    consultarMEF();
    document.getElementById('buscador').addEventListener('input', filtrarTodo);
    document.getElementById('select-anio').addEventListener('change', filtrarTodo);
});
