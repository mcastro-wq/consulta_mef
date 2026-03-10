document.addEventListener('DOMContentLoaded', () => {
    consultarMEF();
});

async function consultarMEF() {
    try {
        // 1. Carga del JSON con preventor de caché
        const response = await fetch('data_ranking.json?v=' + Math.random());
        if (!response.ok) throw new Error("No se pudo cargar el archivo JSON");
        
        const dataTotal = await response.json();
        
        // 2. Mostrar fecha de actualización (usando la llave correcta del JSON)
        const elFecha = document.getElementById('fecha-actualizacion');
        if (elFecha) {
            elFecha.innerText = dataTotal.ultima_actualizacion || "Actualizado";
        }

        // 3. Filtrar específicamente Lambayeque
        const proyectos = dataTotal.ranking || [];
        const lambayeque = proyectos.find(p => p.pliego === "LAMBAYEQUE");

        if (lambayeque) {
            // Extraemos los valores del objeto encontrado
            const tPim = Number(lambayeque.pim) || 0;
            const tDev = Number(lambayeque.devengado) || 0;

            // usamos el avance con el truncado
            const avanceReal = (tDev / tPim * 100);
            const avanceGlobal = (Math.floor(avanceReal * 10) / 10).toFixed(1);
            // usamos el avance con el truncado
            
            //const avanceGlobal = lambayeque.avance || 0; // Usamos el avance que ya viene en el JSON

            // 4. Renderizar en las Cards del index.html
            const elPim = document.getElementById('total-pim');
            const elDev = document.getElementById('total-ejecutado');
            const elAvance = document.getElementById('avance-global');
            const elBarra = document.getElementById('progreso-barra');

            // Formatear a moneda Soles (S/ 0,000.00)
            if (elPim) {
                elPim.innerText = "S/ " + tPim.toLocaleString('es-PE', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                });
            }
            if (elDev) {
                elDev.innerText = "S/ " + tDev.toLocaleString('es-PE', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                });
            }
            
            // Mostrar porcentaje de avance
            if (elAvance) {
                elAvance.innerText = avanceGlobal + "%";
            }
            
            // 5. Mover la barra de progreso
            if (elBarra) {
                elBarra.style.width = avanceGlobal + "%";
            }

        } else {
            console.error("No se encontró el pliego 'LAMBAYEQUE' en el ranking.");
            const elEstado = document.getElementById('estado');
            if (elEstado) elEstado.innerText = "Error: Datos de Lambayeque no encontrados.";
        }

    } catch (e) {
        console.error("Error cargando el JSON:", e);
        const elEstado = document.getElementById('estado');
        if (elEstado) elEstado.innerText = "Error: No se pudo leer el archivo de datos.";
    }
}

