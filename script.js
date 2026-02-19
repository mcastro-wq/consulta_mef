async function cargarTablero() {
    try {
        const response = await fetch('data_mef.json');
        const datos = await response.json();

        // 1. Filtrar solo Lambayeque para los KPIs principales
        const dataLambayeque = datos.filter(d => d.DEPARTAMENTO === 'LAMBAYEQUE');
        
        const totalPim = dataLambayeque.reduce((acc, curr) => acc + curr.pim, 0);
        const totalDev = dataLambayeque.reduce((acc, curr) => acc + curr.devengado, 0);
        const avanceGlobal = totalPim > 0 ? (totalDev / totalPim * 100).toFixed(1) : 0;

        // Actualizar números en el HTML
        document.getElementById('pim-total').innerText = `S/ ${totalPim.toLocaleString()}`;
        document.getElementById('avance-percent').innerText = `${avanceGlobal}%`;

        // 2. Configurar Buscador
        const inputBusqueda = document.getElementById('buscar-proyecto');
        const listaResultados = document.getElementById('lista-proyectos');

        inputBusqueda.addEventListener('input', () => {
            const busqueda = inputBusqueda.value.toLowerCase();
            const filtrados = datos.filter(p => p.NOMBRE.toLowerCase().includes(busqueda)).slice(0, 10);
            
            listaResultados.innerHTML = filtrados.map(p => `
                <div class="card mb-2 p-2">
                    <h6>${p.NOMBRE}</h6>
                    <p class="mb-0">Región: ${p.DEPARTAMENTO} | Avance: <strong>${p.avance}%</strong></p>
                    <div class="progress" style="height: 10px;">
                        <div class="progress-bar ${p.avance < 40 ? 'bg-danger' : 'bg-success'}" 
                             style="width: ${p.avance}%"></div>
                    </div>
                </div>
            `).join('');
        });

    } catch (error) {
        console.error("Error cargando datos:", error);
    }
}

document.addEventListener('DOMContentLoaded', cargarTablero);
