let todosLosProyectos = [];
let proyectosFiltrados = []; // Para mantener los filtros aplicados

async function consultarMEF() {
    const estado = document.getElementById('estado');
    const url = `data_mef.json?v=${new Date().getTime()}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        todosLosProyectos = data;
        
        // Cargar los años disponibles en el SELECT dinámicamente
        configurarSelectorAnios();
        
        // Iniciar con el año más reciente (2025 o el último encontrado)
        const anioActual = document.getElementById('select-anio').value;
        filtrarTodo(); 

    } catch (error) {
        estado.innerHTML = "🚨 Error al cargar datos.";
    }
}

function configurarSelectorAnios() {
    const select = document.getElementById('select-anio');
    // Extraer años únicos del JSON
    const aniosUnicos = [...new Set(todosLosProyectos.map(p => p.anio))].sort((a, b) => b - a);
    
    select.innerHTML = aniosUnicos.map(a => `<option value="${a}">${a}</option>`).join('');
}

function filtrarTodo() {
    const anioSeleccionado = document.getElementById('select-anio').value;
    const textoBusqueda = document.getElementById('buscador').value.toLowerCase();
    
    // Aplicamos ambos filtros: Año Y Búsqueda de texto
    proyectosFiltrados = todosLosProyectos.filter(p => {
        const coincideAnio = p.anio === anioSeleccionado;
        const coincideTexto = p.NOMBRE.toLowerCase().includes(textoBusqueda);
        return coincideAnio && coincideTexto;
    });

    renderizar(proyectosFiltrados);
    actualizarKPIs(proyectosFiltrados);
}

function filtrarPorRango(rango) {
    let final = proyectosFiltrados;
    if (rango === 'bajo') final = proyectosFiltrados.filter(p => p.avance <= 30);
    if (rango === 'medio') final = proyectosFiltrados.filter(p => p.avance > 30 && p.avance <= 70);
    if (rango === 'alto') final = proyectosFiltrados.filter(p => p.avance > 70);
    
    renderizar(final);
}

function actualizarKPIs(lista) {
    const totalPim = lista.reduce((acc, p) => acc + (p.pim || 0), 0);
    const totalDev = lista.reduce((acc, p) => acc + (p.devengado || 0), 0);
    const avanceGlobal = totalPim > 0 ? ((totalDev / totalPim) * 100).toFixed(1) : 0;

    document.getElementById('total-pim').innerText = `S/ ${totalPim.toLocaleString('es-PE')}`;
    document.getElementById('total-ejecutado').innerText = `S/ ${totalDev.toLocaleString('es-PE')}`;
    document.getElementById('avance-global').innerText = `${avanceGlobal}%`;
}
// ... (Resto de funciones renderizar y exportar)
