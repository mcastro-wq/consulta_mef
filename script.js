document.addEventListener('DOMContentLoaded', () => {
    consultarMEF();
});

async function consultarMEF() {
    try {
        // Fetch con timestamp para evitar caché
        const response = await fetch('data_ranking.json?v=' + Date.now());
        if (!response.ok) throw new Error("Error al cargar data_ranking.json");
        
        const jsonData = await response.json();
        
        // 1. Actualizar fecha en el UI
        const elFecha = document.getElementById('fecha-actualizacion');
        if (elFecha) elFecha.innerText = jsonData.ultima_actualizacion;

        // 2. Filtrar todos los registros que pertenezcan a LAMBAYEQUE
        // Usamos filter porque hay un registro para "ACTIVIDADES" y otro para "PROYECTOS"
        const registrosLambayeque = jsonData.data.filter(item => 
            item.pliego.toUpperCase().includes("LAMBAYEQUE")
        );

        if (registrosLambayeque.length > 0) {
            let sumaPim = 0;
            let sumaDev = 0;
            let sumaCer = 0;

            // 3. Sumar valores de ambos tipos (Proyectos + Actividades)
            registrosLambayeque.forEach(reg => {
                sumaPim += parseFloat(reg.pim || 0);
                sumaDev += parseFloat(reg.devengado || 0);
                sumaCer += parseFloat(reg.certificado || 0);
            });

            // 4. Calcular avance global
            const porcentajeAvance = sumaPim > 0 ? (sumaDev / sumaPim) * 100 : 0;

            // 5. Formatear y mostrar en pantalla
            const configSoles = { 
                style: 'currency', 
                currency: 'PEN', 
                minimumFractionDigits: 0, 
                maximumFractionDigits: 0 
            };

            // Asignar valores a los IDs del HTML
            document.getElementById('total-pim').innerText = sumaPim.toLocaleString('es-PE', configSoles);
            document.getElementById('total-cer').innerText = sumaCer.toLocaleString('es-PE', configSoles);
            document.getElementById('total-ejecutado').innerText = sumaDev.toLocaleString('es-PE', configSoles);
            
            const elAvanceText = document.getElementById('avance-global');
            const elBarra = document.getElementById('progreso-barra');

            if (elAvanceText) elAvanceText.innerText = porcentajeAvance.toFixed(1) + "%";
            
            if (elBarra) {
                elBarra.style.width = porcentajeAvance.toFixed(1) + "%";
                // Cambiar color de barra según tramo de ejecución
                if (porcentajeAvance < 30) elBarra.style.backgroundColor = "#ef4444";
                else if (porcentajeAvance < 70) elBarra.style.backgroundColor = "#fbbf24";
                else elBarra.style.backgroundColor = "#10b981";
            }

        } else {
            console.error("No se encontraron registros de Lambayeque en el JSON.");
            document.getElementById('total-pim').innerText = "Sin datos";
        }

    } catch (error) {
        console.error("Error cargando el Dashboard:", error);
    }
}
