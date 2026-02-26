document.addEventListener('DOMContentLoaded', () => {
    consultarMEF();
});

async function consultarMEF() {
    try {
        // 1. Carga del JSON (forzamos refresco para evitar caché)
        const response = await fetch('data_proyectos.json?v=' + Math.random());
        const dataTotal = await response.json();
        
        // 2. Mostrar fecha de actualización
        // Buscamos la llave exacta de tu JSON: "fecha_extraccion"
        const elFecha = document.getElementById('fecha-actualizacion');
        if (elFecha) {
            elFecha.innerText = dataTotal.fecha_extraccion || "Actualizado";
        }

        const proyectos = dataTotal.proyectos || [];

        // 3. Cálculos de Totales
        // IMPORTANTE: Usamos MONTO_PIM y MONTO_DEVENGADO tal cual están en tu JSON
        let tPim = 0;
        let tDev = 0;

        proyectos.forEach(p => {
            tPim += (Number(p.MONTO_PIM) || 0);
            tDev += (Number(p.MONTO_DEVENGADO) || 0);
        });

        // 4. Renderizar en las Cards del index.html
        const elPim = document.getElementById('total-pim');
        const elDev = document.getElementById('total-ejecutado');
        const elAvance = document.getElementById('avance-global');
        const elBarra = document.getElementById('progreso-barra');

        if (elPim) elPim.innerText = "S/ " + tPim.toLocaleString('es-PE');
        if (elDev) elDev.innerText = "S/ " + tDev.toLocaleString('es-PE');
        
        // Calcular porcentaje
        const avanceGlobal = tPim > 0 ? ((tDev / tPim) * 100).toFixed(1) : 0;
        
        if (elAvance) elAvance.innerText = avanceGlobal + "%";
        
        // 5. Mover la barra de progreso minimalista
        if (elBarra) {
            elBarra.style.width = avanceGlobal + "%";
        }

    } catch (e) {
        console.error("Error cargando el JSON:", e);
        const elEstado = document.getElementById('estado');
        if (elEstado) elEstado.innerText = "Error: No se pudo leer el archivo de datos.";
    }
}

