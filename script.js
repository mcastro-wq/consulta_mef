document.addEventListener('DOMContentLoaded', () => {
    consultarMEF();
});

async function consultarMEF() {
    try {
        // 1. Carga del JSON (forzamos refresco para evitar caché)
        const response = await fetch('data_ranking.json?v=' + Math.random());
        const dataTotal = await response.json();
        
        // 2. Mostrar fecha de actualización
        // Ajustado a la llave: "ultima_actualizacion"
        const elFecha = document.getElementById('fecha-actualizacion');
        if (elFecha) {
            elFecha.innerText = dataTotal.ultima_actualizacion || "Actualizado";
        }

        // Ajustado a la llave: "ranking"
        const proyectos = dataTotal.ranking || [];

        // 3. Cálculos de Totales
        let tPim = 0;
        let tDev = 0;

        proyectos.forEach(p => {
            tPim += (Number(p.pim) || 0);
            tDev += (Number(p.devengado) || 0);
        });

        // 4. Renderizar en las Cards del index.html
        const elPim = document.getElementById('total-pim');
        const elDev = document.getElementById('total-ejecutado');
        const elAvance = document.getElementById('avance-global');
        const elBarra = document.getElementById('progreso-barra');

        // Formato de moneda local (Soles)
        if (elPim) elPim.innerText = "S/ " + tPim.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        if (elDev) elDev.innerText = "S/ " + tDev.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        
        // Calcular porcentaje
        const avanceGlobal = tPim > 0 ? ((tDev / tPim) * 100).toFixed(1) : 0;
        
        if (elAvance) elAvance.innerText = avanceGlobal + "%";
        
        // 5. Mover la barra de progreso
        if (elBarra) {
            // Asegúrate de que el estilo de la barra permita transiciones
            elBarra.style.width = avanceGlobal + "%";
        }

    } catch (e) {
        console.error("Error cargando el JSON:", e);
        const elEstado = document.getElementById('estado');
        if (elEstado) elEstado.innerText = "Error: No se pudo leer el archivo de datos.";
    }
}
