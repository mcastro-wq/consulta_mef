document.addEventListener('DOMContentLoaded', async () => {
    const contenedor = document.getElementById('lista-proyectos');
    const buscador = document.getElementById('buscador');

    try {
        const res = await fetch('data_mef.json');
        const datos = await res.json();

        const render = (filtro = "") => {
            const filtrados = datos.filter(p => 
                p.NOMBRE.toLowerCase().includes(filtro.toLowerCase()) || 
                p.DEPARTAMENTO.toLowerCase().includes(filtro.toLowerCase())
            );

            contenedor.innerHTML = filtrados.map(p => `
                <div class="card mb-3 p-3 shadow-sm">
                    <span class="badge bg-primary mb-2" style="width: fit-content;">${p.DEPARTAMENTO}</span>
                    <h5 class="h6">${p.NOMBRE}</h5>
                    <div class="d-flex justify-content-between small mb-1">
                        <span>PIM: S/ ${p.pim.toLocaleString()}</span>
                        <span>Avance: ${p.avance}%</span>
                    </div>
                    <div class="progress" style="height: 8px;">
                        <div class="progress-bar ${p.avance > 70 ? 'bg-success' : 'bg-warning'}" 
                             style="width: ${p.avance}%"></div>
                    </div>
                </div>
            `).join('');
        };

        buscador.addEventListener('input', (e) => render(e.target.value));
        render();

    } catch (e) {
        contenedor.innerHTML = "<p class='text-danger'>Error al cargar el tablero.</p>";
    }
});
