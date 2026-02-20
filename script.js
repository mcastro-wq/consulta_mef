let todosLosProyectos = [];
let filtroRango = 'todos';

async function consultarMEF() {
    const estado = document.getElementById('estado');
    const url = `data_mef.json?v=${new Date().getTime()}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        // Verificación de seguridad: ¿Es Lambayeque?
        todosLosProyectos = data;

        const aniosUnicos = [...new Set(todosLosProyectos.map(p => p.anio))].filter(a => a).sort((a,b) => b-a);
        const selectAnio = document.getElementById('select-anio');
        
        if (aniosUnicos.length > 0) {
            selectAnio.innerHTML = aniosUnicos.map(a => `<option value="${a}">${a}</option>`).join('');
        } else {
            selectAnio.innerHTML = '<option value="2025">2025</option>';
        }

        filtrarTodo();
    } catch (error) {
        estado.innerHTML = `🚨 Error de carga.`;
    }
}

function filtrarTodo() {
    const busqueda = document.getElementById('buscador').value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const anioSel = document.getElementById('select-anio').value;

    const filtrados = todosLosProyectos.filter(p => {
        const coincideAnio = String(p.anio) === String(anioSel);
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
    document.getElementById('estado').innerHTML = `📍 Lambayeque: <b>${lista.length}</b> proyectos mostrados.`;
}

function renderizar(lista) {
    const contenedor = document.getElementById('contenedor-proyectos');
    if (lista.length === 0) {
        contenedor.innerHTML = '<div class="col-12 text-center py-5 text-muted">No hay proyectos.</div>';
        return;
    }

    contenedor.innerHTML = lista.map(p => {
        let claseBorde = p.avance > 70 ? "avance-alto" : (p.avance > 30 ? "avance-medio" : "avance-bajo");
        return `
        <div class="col">
            <div class="card h-100 card-proyecto ${claseBorde} shadow-sm border-0">
                <div class="card-body p-3">
                    <div class="d-flex justify-content-between mb-2">
                        <span class="badge ${p.avance > 50 ? 'bg-success' : 'bg-danger'}">${p.avance}%</span>
                        <span class="badge bg-light text-dark border small">AÑO ${p.anio}</span>
                    </div>
                    <h6 class="card-title text-uppercase mb-3" style="font-size: 0.75rem; font-weight: 800; height: 3.2em; overflow: hidden;">${p.NOMBRE}</h6>
                    <div class="small">PIM: <b>S/ ${p.pim.toLocaleString('es-PE')}</b></div>
                    <div class="small mb-2 text-success">DEV: <b>S/ ${p.devengado.toLocaleString('es-PE')}</b></div>
                    <div class="progress" style="height: 6px; background: #eee;">
                        <div class="progress-bar ${p.avance > 50 ? 'bg-success' : 'bg-warning'}" style="width: ${p.avance}%"></div>
                    </div>
                </div>
            </div>
        </div>`;
    }).join('');
}

function setRango(rango) { filtroRango = rango; filtrarTodo(); }

document.addEventListener('DOMContentLoaded', () => {
    consultarMEF();
    document.getElementById('buscador').addEventListener('input', filtrarTodo);
    document.getElementById('select-anio').addEventListener('change', filtrarTodo);
});
