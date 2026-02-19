document.addEventListener('DOMContentLoaded', async () => {
    const lista = document.getElementById('lista-proyectos');
    const buscador = document.getElementById('buscador');

    try {
        const res = await fetch('data_mef.json');
        const datos = await res.json();

        const mostrar = (filtro = "") => {
            const filtrados = datos.filter(p => 
                p.NOMBRE.toLowerCase().includes(filtro.toLowerCase()) || 
                p.DEPARTAMENTO.toLowerCase().includes(filtro.toLowerCase())
            ).slice(0, 50); // Mostramos los primeros 50 para no saturar

            lista.innerHTML = filtrados.map(p => `
                <div class="proyecto-card">
                    <div class="regiao">${p.DEPARTAMENTO}</div>
                    <h3>${p.NOMBRE}</h3>
                    <div class="metricas">
                        <span>PIM: S/ ${p.pim.toLocaleString()}</span>
                        <span>Avance: ${p.avance}%</span>
                    </div>
                    <div class="barra-fondo">
                        <div class="barra-progreso" style="width: ${p.avance}%"></div>
                    </div>
                </div>
            `).join('');
        };

        buscador.addEventListener('input', (e) => mostrar(e.target.value));
        mostrar(); // Carga inicial

    } catch (e) {
        lista.innerHTML = `<p style="color:red">Error cargando datos: ${e.message}</p>`;
    }
});
