# 📊 Monitor de Ejecución Presupuestal - GORE Lambayeque 2026

![Estado del Despliegue](https://img.shields.io/github/deployments/mcastro-wq/consulta_mef/github-pages?label=Status&logo=github&color=success)
![Python](https://img.shields.io/badge/Python-3.10+-blue?logo=python&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-purple?logo=bootstrap&logoColor=white)

Este proyecto es una plataforma interactiva de **Inteligencia de Datos** diseñada para monitorear el avance presupuestal del Gobierno Regional de Lambayeque. Centraliza la información del MEF (Ministerio de Economía y Finanzas) y permite visualizar el estado de inversiones y actividades en tiempo real.

---

## 🚀 Características Principales

* **⚡ Visualización Dinámica:** Velocímetros (gauges) interactivos que muestran el % de avance en Certificación, Compromiso, Devengado y Girado.
* **🔍 Filtros de Alta Precisión:** Buscador global por código CUI o nombre, con segmentación por **Unidad Ejecutora** y tipo de registro (Proyecto/Actividad).
* **📋 Gestión de Trazabilidad:** Panel dedicado para el seguimiento de hitos de gestión, expedientes SISGEDO y acciones programadas.
* **🤖 Automatización Total:** Actualización de datos mediante Scraping con Python y despliegue continuo (CI/CD) con GitHub Actions.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
| :--- | :--- |
| **Backend / ETL** | Python (Pandas para procesamiento de datos) |
| **Frontend** | HTML5, CSS3, JavaScript (Vanilla ES6+) |
| **UI Framework** | Bootstrap 5.3 & Bootstrap Icons |
| **Automatización** | GitHub Actions (Workflows) |
| **Hosting** | GitHub Pages |

---

## ⚙️ Arquitectura de Datos

El sistema sigue un flujo automatizado para garantizar que la información sea siempre reciente:

1.  **Extracción:** Un script en Python consulta las fuentes oficiales (SIAF/Transparencia Económica).
2.  **Transformación:** Los datos se limpian y se genera un archivo `data_proyectos.json` ligero y optimizado.
3.  **Carga:** GitHub Actions detecta la actualización y reconstruye el sitio estático en menos de 1 minuto.



---

📌 Notas de Uso
Filtros: Al seleccionar una Unidad Ejecutora, los indicadores globales se recalculan automáticamente para reflejar solo esa unidad.

Caché: Si los datos no parecen actualizarse, presiona Ctrl + F5 para limpiar la caché del navegador.

👤 Créditos
Desarrollado por: Miguel

Fuente de información: Consulta Amigable - MEF.

Propósito: Transparencia y optimización de la gestión pública en el GORE Lambayeque.

© 2026 - Gestión de Datos Presupuestales
